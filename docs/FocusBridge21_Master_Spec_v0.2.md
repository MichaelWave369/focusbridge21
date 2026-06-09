# FocusBridge21

## Sovereign Consciousness Training Cockpit

**Master Specification Document — v0.2**  
**Date:** June 9, 2026  
**Project:** Parallax Labs / PHI369 Ecosystem  
**Status:** Hardened MVP specification + public prototype

---

## 1. Executive Vision

FocusBridge21 is a local-first, sovereign consciousness-training cockpit designed to help practitioners safely and repeatably develop capacities associated with threshold meditative states.

It is inspired by the general idea of progressive focus-level training, but it remains independent of proprietary Monroe Institute / Hemi-Sync products and signals.

FocusBridge21 is not:

- A Hemi-Sync clone or ripoff.
- A guaranteed Focus 21 or out-of-body switch.
- A medical device, therapy, diagnosis tool, or clinical treatment.
- A push-button altered-state machine.

FocusBridge21 is:

- A disciplined practice engine for readiness, relaxation, expanded awareness, time-release, stable witnessing, and gentle return.
- A personal state cartography system that learns user-specific patterns through local receipts.
- A safety-first threshold cockpit with non-negotiable return and grounding mechanisms.
- An original generated-audio system using transparent parameters rather than copied proprietary signals.

> We do not promise the gate. We train the capacities that make the gate safer, clearer, and more repeatable.

---

## 2. Core Principles

### Honesty and humility

The software trains capacities. It does not promise specific subjective experiences. Individual factors such as sleep, stress, expectation, physiology, and practice history matter enormously.

### Sovereignty and locality

Everything runs locally. No cloud is required. Session logs stay on the user's machine unless intentionally exported.

### Safety first

Shorter first sessions, explicit warnings, no aggressive flicker, conservative volume defaults, and an always-available RETURN NOW protocol are core requirements.

### Personalization through receipts

The Signal Ledger is the product's heart. Every session becomes structured data. Over time, the system discovers what actually works for the practitioner.

### Progressive and trainable

FocusBridge21 treats threshold practice as a ladder of capacities, not an instant download.

### Original and ethical

All audio is generated on the fly or from transparent open parameters. The app does not copy proprietary Hemi-Sync content.

---

## 3. Five-Engine Architecture

The v0.1 concept used four engines: Gate Ladder, Audio Entrainment, Signal Ledger, and Safety/Return. v0.2 keeps those and adds a fifth: the Readiness Gate Engine.

### 3.1 Readiness Gate Engine

The Readiness Gate Engine runs before the session starts. It does not diagnose the user. It estimates whether the current moment is suitable for deeper practice.

Inputs:

- Mood / emotional steadiness.
- Sleep quality.
- Stress level.
- Groundedness in the body and room.
- Safe environment confirmation.
- Stereo headphone check.
- Safety acknowledgement.
- Recent destabilizing meditation / altered-state experience.

Outputs:

- Readiness score from 0 to 100.
- Green / Yellow / Red readiness classification.
- Suggested preset and duration.
- Safety recommendation.

Example rules:

- Sleep below 4/10 recommends Foundation, not Bridge.
- Stress above 8/10 recommends grounding or a short Foundation session.
- Low grounding recommends no threshold work.
- Recent destabilizing experience caps readiness and recommends rest/grounding.

This gives FocusBridge21 intelligence without pretending to be medical or mystical.

### 3.2 Gate Ladder Engine

The Gate Ladder is a progressive training ladder. Each gate trains capacities rather than promising subjective states.

| Gate | Name | Primary Capacities | Typical Focus | Suggested Audio Start | Visual / Guidance Theme |
|---|---|---|---|---|---|
| 0 | Readiness | Intention, safety, baseline awareness | Checklist + breath anchor | Gentle alpha range | Simple grounding field |
| 10 | Body-Asleep | Deep body relaxation while mentally awake | Body scan, heaviness, stillness | Gentle theta ramp | Floating / body-asleep imagery |
| 12 | Expanded Awareness | Spatial widening, peripheral perception, observer mode | Sound-field expansion | Theta + subtle spatial movement | Expanding sphere |
| 15 | Time-Release | Reduced clock awareness, memory anchors, identity softening | Timeless spaciousness | Slow theta / low-alpha ramps | Timeless void / memory anchor |
| 21 | Threshold / Bridge | Stable witness, non-grasping exploration, gentle return | Edge-state holding | User-tuned ramp + strong return | Bridge portal + return anchor |

Gate Ladder features:

- Users can start at any gate, but the app encourages progressive training.
- Entry recommendations depend on ledger history and readiness.
- Longer sessions unlock only after clean return markers.
- Reflection questions are capacity-based: stable witness, return quality, fear/resistance, memory retention.

### 3.3 Audio Entrainment Engine

The Audio Engine generates original, transparent audio. It does not copy Hemi-Sync products or attempt to recreate proprietary signals.

MVP capabilities:

- Binaural beats using independent left/right stereo carriers.
- Smooth beat-frequency ramps across session phases.
- Optional pink, brown, or white noise layer.
- Conservative master volume default.
- Fade-in and fade-out envelope.
- Preset-based phase automation.

Future capabilities:

- Monaural beats.
- Isochronic pulses.
- Spatial panning.
- User-supplied nature or music beds.
- Browser Web Audio API for production-grade real-time synthesis.

Evidence posture:

- Binaural beat research is mixed and protocol-dependent.
- The app does not assume universal best frequencies.
- The ledger tests individual response over time.

### 3.4 Signal Ledger / Integration Engine

The Signal Ledger is an append-only local receipt system.

MVP storage format:

- JSONL, one receipt per session.
- Append-only by default.
- Export to CSV for analysis.

Minimum receipt fields:

- `session_id`
- `timestamp`
- `preset`
- `target_gate`
- `duration_min`
- `audio_params`
- `phase_model`
- `intention`
- `pre` readiness data
- `during` capacity ratings
- `post` integration ratings
- `notes`
- `dreamlike_fragments`
- `claim_boundary`

Example learning pattern:

> The practitioner reaches deeper states after 22+ minutes, with low-volume pink noise, 4.5–6 Hz theta ramps, no visual flicker, and explicit bridge imagery.

Future ledger intelligence:

- Search/filter receipts.
- Local summaries.
- Correlation hints.
- Export to Parallax / TIEKAT / Codex systems.
- Optional local LLM pattern review.

### 3.5 Safety + Return Engine

The Safety + Return Engine is non-negotiable.

Hard requirements:

- Prominent RETURN NOW button in the live cockpit.
- Clear grounding protocol.
- Orientation prompts: see, hear, feel.
- Water/rest/movement reminder.
- No use while driving or operating machinery.
- Warnings for seizure history, photosensitive epilepsy, panic/anxiety, psychosis, dissociation, and destabilizing altered-state experiences.
- Short first sessions.
- Low volume defaults.
- Visuals default to slow, non-flashing sacred geometry.

RETURN NOW protocol:

1. Stop or pause the audio.
2. Open the eyes.
3. Feel feet, hands, breath, and the room.
4. Name three things seen.
5. Name three things heard.
6. Name three things felt.
7. Drink water.
8. Move gently.
9. Journal only after grounded.

---

## 4. MVP v0.1 Scope

The first prototype is not the full product. It is one complete local cockpit.

Must-have features:

- Streamlit local web app.
- Readiness Gate Score.
- Session builder with Foundation, Expansion, No-Time, and Bridge presets.
- Original generated binaural WAV audio.
- Optional pink/brown/white noise.
- Slow non-flashing sacred-geometry visualizer.
- Guided script panel.
- Neutral and Resonance Architect script modes.
- RETURN NOW grounding panel.
- Post-session receipt form.
- Append-only JSONL ledger.
- Ledger dashboard and CSV export.
- 8-week protocol page.

Out of scope for v0.1:

- Full production desktop package.
- Real-time browser synthesis.
- EEG integration.
- Medical claims.
- Cloud sync.
- Voice/TTS guidance.
- Advanced machine learning.

---

## 5. MVP Technical Architecture

Recommended stack for v0.1:

- Python.
- Streamlit.
- NumPy.
- Pandas.
- Local WAV generation.
- Local JSONL ledger.

Runtime folders:

```text
audio/              generated WAV files
ledger/sessions.jsonl  append-only session receipts
exports/            CSV exports
```

These should remain local and ignored by Git.

---

## 6. Presets

### Foundation

Gate 10 body-asleep training. Prioritizes relaxation, breath, safety, and clean return.

### Expansion

Gate 12 expanded-awareness training. Prioritizes spatial widening, peripheral awareness, and observer mode.

### No-Time

Gate 15 time-release practice. Prioritizes reduced clock awareness and stable witness.

### Bridge

Gate 21 threshold practice. Prioritizes stable witness, non-grasping exploration, and reliable return.

---

## 7. 8-Week Mastery Protocol

### Weeks 1–2: Body-Asleep Mastery

Goal: consistently achieve deep physical relaxation while remaining mentally alert and able to return on cue.

Focus metrics:

- Body relaxation.
- Return quality.
- Grounding feeling.

Recommended sessions:

- 3–5 sessions per week.
- 15–25 minutes.

### Weeks 3–4: Expanded Awareness

Goal: widen perception without losing stability or falling asleep.

Focus metrics:

- Perceived depth.
- Imagery vividness.
- Stable witness.

### Weeks 5–6: Time-Release / Deep Stillness

Goal: reduce clock awareness and experience spacious inner states while retaining witness.

Focus metrics:

- Time distortion.
- Stable witness presence.
- Mental clarity.

### Weeks 7–8: Threshold / Bridge Practice

Goal: approach the edge state with stable witness, non-grasping attitude, and reliable return.

Focus metrics:

- Stable witness presence.
- Low fear or resistance.
- Return quality.
- Memory retention.

The software should not ask only, "Did you reach Focus 21?" It should ask:

> Which capacities were present, and how cleanly did you return?

---

## 8. Safety and Ethics Language

FocusBridge21 is a training and journaling tool for developing meditative capacities. It does not diagnose, treat, or guarantee any particular altered state or out-of-body experience.

Individual results vary based on sleep, stress, physical health, psychological readiness, environment, expectation, and consistent practice.

Do not use while driving, operating machinery, or in any situation requiring full external attention.

Consult a qualified healthcare or mental-health professional before use if you have a history of seizure disorders, photosensitive epilepsy, severe anxiety, panic attacks, psychosis, dissociative disorders, or destabilizing experiences with meditation or altered states.

If distress occurs, use RETURN NOW immediately, ground with breath/movement/senses, and stop if needed.

---

## 9. Roadmap

### v0.1

- Core Streamlit app.
- Original binaural audio generation.
- Readiness Gate.
- Bridge cockpit.
- RETURN NOW.
- JSONL Signal Ledger.

### v0.2

- Full Gate Ladder navigation.
- Multiple refined presets.
- Basic analytics and correlation hints.
- Improved visualizer.
- Better export structure.

### v0.3

- Local pattern suggestions.
- Voice guidance option.
- Packaged desktop build.
- Optional local LLM summary support.

### Long-term

- Tauri or Electron desktop app.
- Web Audio API synthesis.
- Quest 3 / WebXR mode.
- Spatial audio and hand-tracked controls.
- Deeper Parallax ecosystem integrations.

---

## 10. Public Claim Boundary

FocusBridge21 may publicly claim:

- It supports meditative capacity training.
- It generates original audio locally.
- It logs private session receipts locally.
- It includes safety and grounding protocols.
- It helps users observe patterns over time.

FocusBridge21 should not publicly claim:

- It guarantees Focus 21.
- It causes out-of-body experiences.
- It recreates Monroe / Hemi-Sync signals.
- It treats medical or psychiatric conditions.
- It produces objective proof of nonphysical realities.

---

## 11. Closing

FocusBridge21 is a disciplined bridge between consciousness practice, generated audio, safety-aware design, and local-first personal intelligence.

It begins as a simple cockpit. The real intelligence emerges through repeated use, clean return, and honest receipts.
