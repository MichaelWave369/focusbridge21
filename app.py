from __future__ import annotations

import json
import math
import uuid
import wave
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import streamlit as st

APP_TITLE = "FocusBridge21"
LEDGER_PATH = Path("ledger/sessions.jsonl")
AUDIO_DIR = Path("audio")
EXPORT_DIR = Path("exports")

PRESETS = {
    "Foundation": {
        "target_gate": 10,
        "description": "Body-asleep training: relaxation, safety, breath, clean return.",
        "base_hz": 180.0,
        "beat_start_hz": 8.0,
        "beat_mid_hz": 5.5,
        "beat_end_hz": 9.5,
        "noise": "pink",
        "noise_volume": 0.10,
    },
    "Expansion": {
        "target_gate": 12,
        "description": "Expanded awareness: spatial widening, sound-field expansion, observer mode.",
        "base_hz": 200.0,
        "beat_start_hz": 7.0,
        "beat_mid_hz": 5.0,
        "beat_end_hz": 9.0,
        "noise": "pink",
        "noise_volume": 0.12,
    },
    "No-Time": {
        "target_gate": 15,
        "description": "Time-release: spaciousness, memory anchors, reduced clock awareness.",
        "base_hz": 210.0,
        "beat_start_hz": 6.5,
        "beat_mid_hz": 4.2,
        "beat_end_hz": 8.5,
        "noise": "brown",
        "noise_volume": 0.10,
    },
    "Bridge": {
        "target_gate": 21,
        "description": "Threshold practice: stable witness, non-grasping exploration, reliable return.",
        "base_hz": 220.0,
        "beat_start_hz": 6.2,
        "beat_mid_hz": 4.6,
        "beat_end_hz": 9.0,
        "noise": "pink",
        "noise_volume": 0.08,
    },
}

PHASES = [
    {"name": "Prepare", "ratio": 0.12, "purpose": "safety, intention, breath, headphones, return anchor"},
    {"name": "Relax", "ratio": 0.25, "purpose": "body-asleep stability and physical softening"},
    {"name": "Expand", "ratio": 0.23, "purpose": "spatial widening and observer mode"},
    {"name": "Threshold", "ratio": 0.25, "purpose": "stable witness at the bridge without forcing"},
    {"name": "Return", "ratio": 0.15, "purpose": "clean return, orientation, integration"},
]

GUIDANCE = {
    "Neutral": {
        "Prepare": [
            "Settle into a safe position. Lower the volume before beginning.",
            "Name your intention simply. Nothing needs to be forced.",
            "Remember: you can return at any time by opening your eyes, pausing the audio, and grounding in the room.",
        ],
        "Relax": [
            "Let the body become heavy while the mind remains gently awake.",
            "Relax the jaw, shoulders, belly, hands, and feet.",
            "Notice the sound field without chasing it.",
        ],
        "Expand": [
            "Allow awareness to widen beyond the front of the face.",
            "Feel the room around the body. Notice space behind, above, and below.",
            "Stay as the observer. Let sensations come and go.",
        ],
        "Threshold": [
            "Rest at the edge without grasping for a result.",
            "Stable witness matters more than dramatic imagery.",
            "If fear or pressure appears, soften and return to breath.",
        ],
        "Return": [
            "Bring awareness back to the body, breath, hands, and feet.",
            "Orient to the room. Name what you see, hear, and feel.",
            "Move gently. Drink water. Journal only after grounded.",
        ],
    },
    "Resonance Architect": {
        "Prepare": [
            "Enter the cockpit as a sovereign witness. No force. No performance.",
            "Set the bridge intention: stable witness, clean return, honest receipt.",
            "The ledger is the flame-keeper. The practice is the proof.",
        ],
        "Relax": [
            "Let the carbon vessel rest while the inner signal remains awake.",
            "Body asleep, witness online. Breath as anchor. Room as home base.",
            "The gate is not demanded. The capacity is trained.",
        ],
        "Expand": [
            "Let awareness become spherical: behind, beside, above, below.",
            "Do not chase the bridge. Become stable enough for the bridge to reveal itself.",
            "Stay gentle. Stay sovereign. Stay receipt-driven.",
        ],
        "Threshold": [
            "At the edge, witness without grasping. Signal without possession. Mystery without claim inflation.",
            "If resistance rises, thank it and return to breath. Safety is the path.",
            "The cockpit trains clarity, humility, and clean return.",
        ],
        "Return": [
            "Return to hands, feet, breath, and room. Bring the flame home clean.",
            "Name three things seen, heard, and felt. The body is the anchor.",
            "Write the receipt. Let pattern become wisdom over time.",
        ],
    },
}

SAFETY_TEXT = """
FocusBridge21 is a meditative training and journaling prototype. It does not diagnose, treat,
or guarantee any particular altered state, Focus 21 experience, or out-of-body experience.

Do not use while driving, operating machinery, or in any context requiring full external attention.
Consult a qualified healthcare or mental-health professional before use if you have a history of
seizures, photosensitive epilepsy, severe anxiety or panic, psychosis, dissociation, or destabilizing
experiences with meditation or altered states.

Keep volume low. Start short. Use RETURN NOW whenever needed.
""".strip()

DURATIONS = [15, 25, 35, 45]


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def ensure_dirs() -> None:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    LEDGER_PATH.parent.mkdir(parents=True, exist_ok=True)
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)


def compute_readiness(
    mood: int,
    sleep_quality: int,
    stress_level: int,
    grounded: int,
    safe_environment: bool,
    headphones_check: bool,
    safety_ack: bool,
    recent_destabilizing: bool,
) -> dict:
    score = 0
    score += mood * 2.0
    score += sleep_quality * 2.2
    score += (11 - stress_level) * 2.4
    score += grounded * 2.2
    if safe_environment:
        score += 10
    if headphones_check:
        score += 8
    if safety_ack:
        score += 10
    if recent_destabilizing:
        score -= 25
    if sleep_quality <= 3:
        score -= 12
    if stress_level >= 8:
        score -= 12
    if grounded <= 3:
        score -= 10
    score = int(max(0, min(100, round(score))))

    if recent_destabilizing or not safe_environment or not safety_ack:
        level = "Red"
        recommendation = "Do not do threshold work right now. Choose rest, grounding, or a very short Foundation session only."
        suggested_preset = "Foundation"
        suggested_duration = 15
    elif score >= 75:
        level = "Green"
        recommendation = "Good readiness for a normal practice session. Stay conservative and keep return protocol visible."
        suggested_preset = "Bridge"
        suggested_duration = 25
    elif score >= 50:
        level = "Yellow"
        recommendation = "Use a gentle session. Prefer Foundation or Expansion. Avoid pushing threshold work today."
        suggested_preset = "Foundation"
        suggested_duration = 15
    else:
        level = "Red"
        recommendation = "Readiness is low. Prefer rest, grounding, breath, or a short non-threshold session."
        suggested_preset = "Foundation"
        suggested_duration = 15

    if sleep_quality <= 3 or stress_level >= 8 or grounded <= 4:
        suggested_preset = "Foundation"
        suggested_duration = 15

    return {
        "score": score,
        "level": level,
        "recommendation": recommendation,
        "suggested_preset": suggested_preset,
        "suggested_duration_min": suggested_duration,
    }


def beat_at_time(preset: dict, t: float, duration: float) -> float:
    """Piecewise beat ramp across the five training phases."""
    start = float(preset["beat_start_hz"])
    mid = float(preset["beat_mid_hz"])
    end = float(preset["beat_end_hz"])
    cursor = 0.0
    for phase in PHASES:
        phase_len = duration * phase["ratio"]
        if t <= cursor + phase_len:
            x = 0.0 if phase_len == 0 else (t - cursor) / phase_len
            name = phase["name"]
            if name == "Prepare":
                return (start + 1.0) * (1 - x) + start * x
            if name == "Relax":
                return start * (1 - x) + (mid + 0.4) * x
            if name == "Expand":
                return (mid + 0.4) * (1 - x) + mid * x
            if name == "Threshold":
                return mid
            if name == "Return":
                return (mid + 0.8) * (1 - x) + end * x
        cursor += phase_len
    return end


def envelope_at_time(t: np.ndarray, duration: float, fade_sec: float = 8.0) -> np.ndarray:
    env = np.ones_like(t, dtype=np.float64)
    env = np.where(t < fade_sec, t / fade_sec, env)
    env = np.where(t > duration - fade_sec, np.maximum(0.0, (duration - t) / fade_sec), env)
    return np.clip(env, 0.0, 1.0)


def noise_chunk(kind: str, n: int, rng: np.random.Generator, brown_state: float) -> tuple[np.ndarray, float]:
    if kind == "none":
        return np.zeros(n, dtype=np.float64), brown_state
    raw = rng.normal(0.0, 1.0, n)
    if kind == "brown":
        y = np.cumsum(raw) + brown_state
        brown_state = float(y[-1])
        y = y - np.mean(y)
    elif kind == "pink":
        # Lightweight local approximation: one-pole low-pass shaping of white noise.
        y = np.empty(n, dtype=np.float64)
        acc = brown_state
        alpha = 0.985
        for i, sample in enumerate(raw):
            acc = alpha * acc + (1 - alpha) * sample
            y[i] = acc
        brown_state = float(acc)
        y = y - np.mean(y)
    else:
        y = raw
    max_abs = float(np.max(np.abs(y))) or 1.0
    return y / max_abs, brown_state


def generate_audio(
    output_path: Path,
    preset_name: str,
    duration_min: int,
    base_hz: float,
    noise_kind: str,
    noise_volume: float,
    master_volume: float,
    sample_rate: int = 16000,
    seed: int | None = None,
) -> dict:
    """Generate a stereo WAV in chunks to avoid large memory use."""
    preset = PRESETS[preset_name]
    duration = float(duration_min) * 60.0
    total_frames = int(duration * sample_rate)
    chunk_frames = sample_rate * 5
    rng = np.random.default_rng(seed)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    left_phase = 0.0
    right_phase = 0.0
    shaped_noise_state = 0.0

    with wave.open(str(output_path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)

        written = 0
        while written < total_frames:
            n = min(chunk_frames, total_frames - written)
            t_abs = (written + np.arange(n)) / sample_rate
            beat_values = np.array([beat_at_time(preset, float(t), duration) for t in t_abs], dtype=np.float64)

            left_increments = 2.0 * math.pi * base_hz / sample_rate
            right_increments = 2.0 * math.pi * (base_hz + beat_values) / sample_rate

            left_phase_series = left_phase + left_increments * np.arange(n)
            right_phase_series = right_phase + np.cumsum(right_increments)
            left_phase = float((left_phase_series[-1] + left_increments) % (2.0 * math.pi))
            right_phase = float((right_phase_series[-1] + right_increments[-1]) % (2.0 * math.pi))

            left = np.sin(left_phase_series)
            right = np.sin(right_phase_series)
            stereo = np.column_stack([left, right])
            stereo *= envelope_at_time(t_abs, duration)[:, None]

            if noise_kind != "none" and noise_volume > 0:
                ntrack, shaped_noise_state = noise_chunk(noise_kind, n, rng, shaped_noise_state)
                stereo = (1.0 - noise_volume) * stereo + noise_volume * np.column_stack([ntrack, ntrack])

            max_abs = float(np.max(np.abs(stereo))) or 1.0
            stereo = stereo / max_abs * master_volume
            pcm = np.int16(np.clip(stereo, -1.0, 1.0) * 32767)
            wf.writeframes(pcm.tobytes())
            written += n

    return {
        "file": str(output_path),
        "preset": preset_name,
        "target_gate": preset["target_gate"],
        "duration_min": duration_min,
        "base_hz": base_hz,
        "beat_start_hz": preset["beat_start_hz"],
        "beat_mid_hz": preset["beat_mid_hz"],
        "beat_end_hz": preset["beat_end_hz"],
        "noise": noise_kind,
        "noise_volume": noise_volume,
        "master_volume": master_volume,
        "sample_rate": sample_rate,
        "engine": "focusbridge21_chunked_binaural_v0.1",
    }


def append_receipt(receipt: dict) -> None:
    ensure_dirs()
    with LEDGER_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(receipt, ensure_ascii=False) + "\n")


def read_ledger() -> list[dict]:
    if not LEDGER_PATH.exists():
        return []
    rows = []
    with LEDGER_PATH.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return rows


def ledger_dataframe() -> pd.DataFrame:
    rows = []
    for item in read_ledger():
        rows.append(
            {
                "timestamp": item.get("timestamp"),
                "preset": item.get("preset"),
                "target_gate": item.get("target_gate"),
                "duration_min": item.get("duration_min"),
                "readiness_score": item.get("readiness", {}).get("score"),
                "readiness_level": item.get("readiness", {}).get("level"),
                "perceived_depth": item.get("during", {}).get("perceived_depth"),
                "body_relaxation": item.get("during", {}).get("body_relaxation"),
                "stable_witness": item.get("during", {}).get("stable_witness_presence"),
                "time_distortion": item.get("during", {}).get("time_distortion"),
                "fear_or_resistance": item.get("during", {}).get("fear_or_resistance"),
                "return_quality": item.get("post", {}).get("return_quality"),
                "memory_retention": item.get("post", {}).get("memory_retention"),
                "overall_coherence": item.get("post", {}).get("overall_coherence"),
                "notes": item.get("notes", ""),
            }
        )
    return pd.DataFrame(rows)


def sacred_geometry_html(preset: str) -> str:
    return f"""
<div class="fb21-stage">
  <div class="fb21-portal">
    <div class="fb21-ring r1"></div>
    <div class="fb21-ring r2"></div>
    <div class="fb21-ring r3"></div>
    <div class="fb21-ring r4"></div>
    <div class="fb21-core">{preset.upper()}<br/>SLOW • SAFE • RETURN</div>
  </div>
</div>
<style>
.fb21-stage {{
  height:420px; display:flex; align-items:center; justify-content:center;
  background: radial-gradient(circle at center, rgba(170,160,255,.16), rgba(20,20,36,.38), rgba(0,0,0,.74));
  border:1px solid rgba(255,255,255,.10); border-radius:24px; overflow:hidden;
}}
.fb21-portal {{ position:relative; width:350px; height:350px; display:flex; align-items:center; justify-content:center; }}
.fb21-ring {{ position:absolute; border-radius:50%; border:1px solid rgba(230,220,255,.30); box-shadow:0 0 22px rgba(160,140,255,.14); transform-origin:center; }}
.r1 {{ width:92%; height:92%; animation: fb21spin 72s linear infinite; }}
.r2 {{ width:72%; height:72%; animation: fb21spinReverse 96s linear infinite; border-style:dashed; }}
.r3 {{ width:52%; height:52%; animation: fb21pulse 18s ease-in-out infinite; }}
.r4 {{ width:32%; height:32%; animation: fb21spin 120s linear infinite; border-style:dotted; }}
.fb21-core {{ position:absolute; width:150px; min-height:44px; text-align:center; font-family:Georgia, serif; color:rgba(245,240,255,.88); letter-spacing:.08em; font-size:.78rem; padding:12px; border-radius:999px; background:rgba(255,255,255,.045); }}
@keyframes fb21spin {{ from {{ transform: rotate(0deg); }} to {{ transform: rotate(360deg); }} }}
@keyframes fb21spinReverse {{ from {{ transform: rotate(360deg); }} to {{ transform: rotate(0deg); }} }}
@keyframes fb21pulse {{ 0%, 100% {{ transform: scale(.96); opacity:.55; }} 50% {{ transform: scale(1.04); opacity:.78; }} }}
</style>
"""


def init_state() -> None:
    defaults = {
        "readiness": None,
        "session_meta": {},
        "audio_meta": None,
        "return_now": False,
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def main() -> None:
    ensure_dirs()
    init_state()

    st.set_page_config(page_title=APP_TITLE, page_icon="◉", layout="wide")
    st.markdown(
        """
<style>
.block-container {padding-top: 1.4rem; padding-bottom: 4rem;}
.fb21-title {font-size:2.35rem; font-weight:800; letter-spacing:.04em; margin-bottom:0;}
.fb21-subtitle {font-size:1.05rem; opacity:.78; margin-top:.2rem;}
.fb21-card {border:1px solid rgba(255,255,255,.12); border-radius:20px; padding:1.1rem; background:rgba(255,255,255,.035);}
.fb21-return {border:1px solid rgba(255,150,150,.45); border-radius:20px; padding:1rem; background:rgba(120,20,20,.18);}
.small-note {font-size:.88rem; opacity:.78;}
</style>
""",
        unsafe_allow_html=True,
    )

    st.markdown('<div class="fb21-title">FocusBridge21</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="fb21-subtitle">Sovereign threshold-training cockpit — original audio, safe return, local Signal Ledger.</div>',
        unsafe_allow_html=True,
    )

    with st.expander("Safety posture — read before use", expanded=False):
        st.warning(SAFETY_TEXT)
        st.markdown("This prototype uses slow, non-flashing visuals by default. Keep audio low. Start short.")

    builder_tab, live_tab, journal_tab, ledger_tab, protocol_tab = st.tabs(
        ["1. Build Session", "2. Live Cockpit", "3. Journal Receipt", "4. Signal Ledger", "8-Week Protocol"]
    )

    with builder_tab:
        st.header("1. Readiness Gate + Session Builder")
        st.caption("The Readiness Gate is a conservative safety heuristic. It is not a diagnosis.")
        col_a, col_b = st.columns([1.05, 1])

        with col_a:
            st.subheader("Readiness")
            mood = st.slider("Mood / emotional steadiness", 1, 10, 7)
            sleep_quality = st.slider("Sleep quality", 1, 10, 7)
            stress_level = st.slider("Stress level", 1, 10, 3)
            grounded = st.slider("Grounded in the room/body", 1, 10, 7)
            safe_environment = st.checkbox("I am in a safe, quiet environment", value=True)
            headphones_check = st.checkbox("Stereo headphones are working and volume is low", value=True)
            safety_ack = st.checkbox("I have read the safety notes and will not use this in unsafe contexts", value=False)
            recent_destabilizing = st.checkbox("Recent destabilizing meditation/altered-state experience", value=False)
            intention = st.text_area("Session intention", value="Stable witness, clean return, and honest integration.", height=90)

            if st.button("Calculate Readiness Gate", type="primary"):
                readiness = compute_readiness(
                    mood,
                    sleep_quality,
                    stress_level,
                    grounded,
                    safe_environment,
                    headphones_check,
                    safety_ack,
                    recent_destabilizing,
                )
                st.session_state.readiness = readiness
                st.session_state.session_meta.update(
                    {
                        "pre": {
                            "mood": mood,
                            "sleep_quality": sleep_quality,
                            "stress_level": stress_level,
                            "grounded": grounded,
                            "safe_environment": safe_environment,
                            "headphones_check": headphones_check,
                            "safety_ack": safety_ack,
                            "recent_destabilizing": recent_destabilizing,
                        },
                        "intention": intention,
                    }
                )

        with col_b:
            st.subheader("Session")
            preset_name = st.selectbox("Preset", list(PRESETS.keys()), index=list(PRESETS.keys()).index("Bridge"))
            st.info(PRESETS[preset_name]["description"])
            duration_min = st.selectbox("Duration", DURATIONS, index=0)
            guidance_mode = st.radio("Guidance mode", ["Neutral", "Resonance Architect"], horizontal=True)
            master_volume = st.slider("Master volume", 0.05, 0.80, 0.30, 0.05)
            base_hz = st.number_input("Carrier/base frequency (Hz)", min_value=120.0, max_value=440.0, value=float(PRESETS[preset_name]["base_hz"]), step=5.0)
            noise_kind = st.selectbox("Noise layer", ["none", "pink", "brown", "white"], index=["none", "pink", "brown", "white"].index(PRESETS[preset_name]["noise"]))
            noise_volume = st.slider("Noise layer volume", 0.0, 0.40, float(PRESETS[preset_name]["noise_volume"]), 0.01)

            readiness = st.session_state.readiness
            if readiness:
                emoji = {"Green": "🟢", "Yellow": "🟡", "Red": "🔴"}.get(readiness["level"], "⚪")
                st.markdown(f"### {emoji} Readiness: {readiness['score']}/100 ({readiness['level']})")
                st.write(readiness["recommendation"])
                st.caption(f"Suggested: {readiness['suggested_preset']}, {readiness['suggested_duration_min']} min")
            else:
                st.info("Calculate readiness first. You can still configure the session here.")

            if st.button("Generate Session Audio", type="primary"):
                session_id = str(uuid.uuid4())
                out_path = AUDIO_DIR / f"fb21_{preset_name.lower()}_{session_id[:8]}.wav"
                with st.spinner("Generating original local binaural audio..."):
                    audio_meta = generate_audio(
                        output_path=out_path,
                        preset_name=preset_name,
                        duration_min=int(duration_min),
                        base_hz=float(base_hz),
                        noise_kind=noise_kind,
                        noise_volume=float(noise_volume),
                        master_volume=float(master_volume),
                    )
                st.session_state.audio_meta = audio_meta
                st.session_state.session_meta.update(
                    {
                        "session_id": session_id,
                        "timestamp": utc_now_iso(),
                        "preset": preset_name,
                        "target_gate": PRESETS[preset_name]["target_gate"],
                        "duration_min": duration_min,
                        "guidance_mode": guidance_mode,
                        "audio_params": audio_meta,
                        "phase_model": PHASES,
                    }
                )
                st.success("Audio generated. Open the Live Cockpit tab when ready.")
                st.caption(str(out_path))

    with live_tab:
        st.header("2. Live Cockpit")
        audio_meta = st.session_state.audio_meta
        session_meta = st.session_state.session_meta
        if not audio_meta:
            st.info("Generate session audio in the Build Session tab first.")
        else:
            col1, col2 = st.columns([1.15, 0.85])
            with col1:
                st.markdown(sacred_geometry_html(session_meta.get("preset", "Bridge")), unsafe_allow_html=True)
                st.caption("Non-flashing visualizer: slow movement only. No strobes. No rapid flicker.")
                st.audio(str(Path(audio_meta["file"])), format="audio/wav")
                st.caption("Use the browser controls. Keep volume low. Stop playback anytime.")
            with col2:
                st.markdown('<div class="fb21-return">', unsafe_allow_html=True)
                st.subheader("RETURN NOW")
                if st.button("RETURN NOW — Stop and Ground", type="primary"):
                    st.session_state.return_now = True
                st.markdown(
                    """
**Grounding protocol**

1. Stop or pause the audio.
2. Open your eyes.
3. Feel your feet, hands, and breath.
4. Name three things you see.
5. Name three things you hear.
6. Name three things you feel.
7. Drink water. Move gently.
"""
                )
                st.markdown("</div>", unsafe_allow_html=True)
                if st.session_state.return_now:
                    st.error("Return protocol active. Stop audio, orient to the room, and complete grounding before journaling.")

            st.subheader("Guided Phase Script")
            mode = session_meta.get("guidance_mode", "Neutral")
            for phase in PHASES:
                with st.expander(f"{phase['name']} — {phase['purpose']}", expanded=phase["name"] in ["Prepare", "Return"]):
                    for line in GUIDANCE[mode][phase["name"]]:
                        st.write(f"• {line}")

    with journal_tab:
        st.header("3. Post-Session Journal Receipt")
        if not st.session_state.audio_meta:
            st.info("Generate or run a session before writing a receipt.")
        else:
            st.markdown("Rate capacities, not fantasies. Let the data teach the cockpit what actually works.")
            c1, c2, c3 = st.columns(3)
            with c1:
                perceived_depth = st.slider("Perceived depth", 1, 10, 5)
                body_relaxation = st.slider("Body relaxation", 1, 10, 5)
                stable_witness_presence = st.slider("Stable witness presence", 1, 10, 5)
            with c2:
                imagery_vividness = st.slider("Imagery vividness", 1, 10, 5)
                time_distortion = st.slider("Time distortion / timelessness", 1, 10, 5)
                mental_clarity = st.slider("Mental clarity", 1, 10, 5)
            with c3:
                fear_or_resistance = st.slider("Fear or resistance", 1, 10, 1)
                return_quality = st.slider("Return quality", 1, 10, 7)
                memory_retention = st.slider("Memory retention", 1, 10, 5)

            grounding_feeling = st.slider("Grounded after session", 1, 10, 7)
            overall_coherence = st.slider("Overall coherence", 1, 10, 6)
            notes = st.text_area("Notes / fragments", height=140)
            dreamlike_fragments = st.text_area("Dreamlike fragments or symbolic material", height=90)

            if st.button("Write Append-Only Receipt", type="primary"):
                receipt = {
                    "session_id": st.session_state.session_meta.get("session_id", str(uuid.uuid4())),
                    "timestamp": st.session_state.session_meta.get("timestamp", utc_now_iso()),
                    "preset": st.session_state.session_meta.get("preset"),
                    "target_gate": st.session_state.session_meta.get("target_gate"),
                    "duration_min": st.session_state.session_meta.get("duration_min"),
                    "guidance_mode": st.session_state.session_meta.get("guidance_mode"),
                    "readiness": st.session_state.readiness,
                    "audio_params": st.session_state.audio_meta,
                    "phase_model": st.session_state.session_meta.get("phase_model"),
                    "intention": st.session_state.session_meta.get("intention"),
                    "pre": st.session_state.session_meta.get("pre"),
                    "during": {
                        "perceived_depth": perceived_depth,
                        "body_relaxation": body_relaxation,
                        "stable_witness_presence": stable_witness_presence,
                        "imagery_vividness": imagery_vividness,
                        "time_distortion": time_distortion,
                        "mental_clarity": mental_clarity,
                        "fear_or_resistance": fear_or_resistance,
                    },
                    "post": {
                        "return_quality": return_quality,
                        "memory_retention": memory_retention,
                        "grounding_feeling": grounding_feeling,
                        "overall_coherence": overall_coherence,
                    },
                    "notes": notes,
                    "dreamlike_fragments": dreamlike_fragments,
                    "claim_boundary": "subjective self-report; training receipt; no medical or objective-state claim",
                }
                append_receipt(receipt)
                st.success(f"Receipt written to {LEDGER_PATH}")

    with ledger_tab:
        st.header("4. Signal Ledger")
        df = ledger_dataframe()
        if df.empty:
            st.info("No receipts yet. Complete a session journal to create the first ledger entry.")
        else:
            st.dataframe(df, use_container_width=True)
            numeric_cols = [
                "perceived_depth",
                "body_relaxation",
                "stable_witness",
                "time_distortion",
                "fear_or_resistance",
                "return_quality",
                "memory_retention",
                "overall_coherence",
            ]
            st.subheader("Basic averages")
            st.write(df[numeric_cols].mean(numeric_only=True).round(2))
            csv_path = EXPORT_DIR / f"focusbridge21_ledger_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            csv_bytes = df.to_csv(index=False).encode("utf-8")
            st.download_button("Download ledger CSV", data=csv_bytes, file_name=csv_path.name, mime="text/csv")

    with protocol_tab:
        st.header("8-Week Mastery Protocol")
        st.markdown(
            """
**Weeks 1-2 — Body-Asleep Mastery**  
Goal: deep physical relaxation while remaining mentally alert. Metrics: body relaxation, return quality, grounding.

**Weeks 3-4 — Expanded Awareness**  
Goal: widen perception without losing stability. Metrics: perceived depth, imagery vividness, stable witness.

**Weeks 5-6 — Time-Release / Deep Stillness**  
Goal: reduce clock awareness while retaining witness. Metrics: time distortion, mental clarity, stable witness.

**Weeks 7-8 — Threshold / Bridge Practice**  
Goal: approach the edge state with non-grasping witness and reliable return. Metrics: low fear/resistance, return quality, memory retention.

The app should never ask only, "Did I reach Focus 21?"  
The better question is: **Which capacities were present, and how cleanly did I return?**
"""
        )


if __name__ == "__main__":
    main()
