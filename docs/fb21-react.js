(() => {
  const { useEffect, useMemo, useRef, useState } = React;
  const h = React.createElement;

  const VERSION = "React Pages v0.3 Smooth Flow";
  const LS_KEY = "focusbridge21-ledger-v1";
  const PREF_KEY = "focusbridge21-preferences-v3";
  const DOC_PREFIX = window.location.pathname.includes("/docs") ? "" : "docs/";

  const PRESETS = {
    Foundation: {
      gate: 10,
      desc: "Body-asleep training: relaxation, breath, safety, clean return.",
      base: 180,
      start: 8.0,
      mid: 5.5,
      end: 9.5,
      noise: "pink",
      intention: "Relax the body, stay gently awake, and return cleanly.",
      coach: "Body heavy. Mind gently awake. Nothing to chase."
    },
    Expansion: {
      gate: 12,
      desc: "Expanded awareness: spatial widening, observer mode, calm perception.",
      base: 200,
      start: 7.0,
      mid: 5.0,
      end: 9.0,
      noise: "pink",
      intention: "Widen awareness while staying calm, grounded, and observant.",
      coach: "Awareness widens, while the witness stays soft and steady."
    },
    "No-Time": {
      gate: 15,
      desc: "Time-release practice: spaciousness, memory anchors, stable witness.",
      base: 210,
      start: 6.5,
      mid: 4.2,
      end: 8.5,
      noise: "brown",
      intention: "Rest in spaciousness while keeping a stable witness and clear return.",
      coach: "Let clock pressure dissolve. Keep one clean return anchor."
    },
    Bridge: {
      gate: 21,
      desc: "Threshold practice: stable witness, non-grasping exploration, reliable return.",
      base: 220,
      start: 6.2,
      mid: 4.6,
      end: 9.0,
      noise: "pink",
      intention: "Stable witness at the threshold, no forcing, clean return, honest receipt.",
      coach: "No forcing. Stable witness. Clean return. Honest receipt."
    }
  };

  const QUICK_RUNS = [
    { title: "2-min demo", preset: "Foundation", duration: 2, mode: "Neutral", note: "Fast smoke test for the live app." },
    { title: "Gentle reset", preset: "Foundation", duration: 5, mode: "Neutral", note: "Low intensity body + breath reset." },
    { title: "Bridge preview", preset: "Bridge", duration: 5, mode: "Resonance Architect", note: "Short threshold-flavored preview." },
    { title: "Training session", preset: "Expansion", duration: 15, mode: "Neutral", note: "Smooth practice run for real data." }
  ];

  const PHASES = [
    { name: "Prepare", ratio: 0.12, cue: "Safety, intention, breath, headphones, return anchor.", coach: "Settle. Lower volume. Remember: return is always available." },
    { name: "Relax", ratio: 0.25, cue: "Body-asleep stability and physical softening.", coach: "Let the body become heavy while the mind remains gently awake." },
    { name: "Expand", ratio: 0.23, cue: "Spatial widening and observer mode.", coach: "Awareness can widen without leaving safety." },
    { name: "Threshold", ratio: 0.25, cue: "Stable witness at the bridge without forcing.", coach: "No chasing. Stable witness only." },
    { name: "Return", ratio: 0.15, cue: "Clean return, orientation, integration.", coach: "Return to breath, room, hands, and feet." }
  ];

  const GUIDANCE = {
    Neutral: {
      Prepare: ["Settle into a safe position.", "Lower the volume before beginning.", "Remember: you can return at any time."],
      Relax: ["Let the body become heavy while the mind remains gently awake.", "Relax jaw, shoulders, belly, hands, and feet.", "Notice the sound field without chasing it."],
      Expand: ["Allow awareness to widen beyond the front of the face.", "Feel the room around the body.", "Stay as the observer."],
      Threshold: ["Rest at the edge without grasping for a result.", "Stable witness matters more than dramatic imagery.", "If pressure appears, soften and return to breath."],
      Return: ["Bring awareness back to body, breath, hands, and feet.", "Orient to the room.", "Move gently. Drink water. Journal after grounded."]
    },
    "Resonance Architect": {
      Prepare: ["Enter the cockpit as a sovereign witness.", "Set the bridge intention: stable witness, clean return, honest receipt.", "The ledger is the flame-keeper. The practice is the proof."],
      Relax: ["Let the carbon vessel rest while the inner signal remains awake.", "Body asleep, witness online.", "The gate is not demanded. The capacity is trained."],
      Expand: ["Let awareness become spherical: behind, beside, above, below.", "Do not chase the bridge.", "Stay gentle. Stay sovereign. Stay receipt-driven."],
      Threshold: ["At the edge, witness without grasping.", "If resistance rises, thank it and return to breath.", "The cockpit trains clarity, humility, and clean return."],
      Return: ["Return to hands, feet, breath, and room.", "Name three things seen, heard, and felt.", "Write the receipt. Let pattern become wisdom over time."]
    }
  };

  function fmtTime(seconds) {
    const safe = Math.max(0, Math.floor(seconds));
    const m = Math.floor(safe / 60).toString().padStart(2, "0");
    const s = Math.floor(safe % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function todayKey(d = new Date()) {
    return d.toISOString().slice(0, 10);
  }

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || ""); }
    catch { return fallback; }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function loadLedger() { return readJson(LS_KEY, []); }
  function saveLedger(rows) { writeJson(LS_KEY, rows); }
  function loadPrefs() { return readJson(PREF_KEY, null); }
  function savePrefs(prefs) { writeJson(PREF_KEY, prefs); }

  function readinessScore(form) {
    let score = 0;
    score += Number(form.mood) * 2.0;
    score += Number(form.sleep) * 2.2;
    score += (11 - Number(form.stress)) * 2.4;
    score += Number(form.grounded) * 2.2;
    if (form.safe) score += 10;
    if (form.headphones) score += 8;
    if (form.ack) score += 10;
    if (form.destabilized) score -= 25;
    if (Number(form.sleep) <= 3) score -= 12;
    if (Number(form.stress) >= 8) score -= 12;
    if (Number(form.grounded) <= 3) score -= 10;
    score = clamp(Math.round(score), 0, 100);

    let level = "Red";
    let recommendation = "Readiness is low. Prefer rest, grounding, breath, or a short Foundation session.";
    let suggestedPreset = "Foundation";
    let suggestedDuration = 5;
    let suggestedMode = "Neutral";

    if (form.destabilized || !form.safe || !form.ack) {
      level = "Red";
      recommendation = "Do not do threshold work right now. Choose rest, grounding, or very short Foundation only.";
      suggestedDuration = 2;
    } else if (score >= 82) {
      level = "Green";
      recommendation = "Strong readiness. Bridge Preview or a short Bridge session is reasonable. Keep RETURN NOW visible.";
      suggestedPreset = "Bridge";
      suggestedDuration = 15;
      suggestedMode = "Resonance Architect";
    } else if (score >= 70) {
      level = "Green";
      recommendation = "Good readiness. Expansion or Bridge Preview can work; stay conservative.";
      suggestedPreset = "Expansion";
      suggestedDuration = 15;
    } else if (score >= 50) {
      level = "Yellow";
      recommendation = "Use a gentle session. Prefer Foundation or Expansion. Avoid pushing threshold work today.";
      suggestedPreset = "Foundation";
      suggestedDuration = 5;
    }

    if (Number(form.sleep) <= 3 || Number(form.stress) >= 8 || Number(form.grounded) <= 4) {
      suggestedPreset = "Foundation";
      suggestedDuration = 5;
      suggestedMode = "Neutral";
    }
    return { score, level, recommendation, suggestedPreset, suggestedDuration, suggestedMode };
  }

  function currentPhase(elapsed, duration) {
    let cursor = 0;
    for (const phase of PHASES) {
      const len = duration * phase.ratio;
      if (elapsed <= cursor + len) return { ...phase, phaseStart: cursor, phaseEnd: cursor + len };
      cursor += len;
    }
    const last = PHASES[PHASES.length - 1];
    return { ...last, phaseStart: Math.max(0, duration - duration * last.ratio), phaseEnd: duration };
  }

  function makeNoiseBuffer(ctx, kind, seconds = 2) {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let brown = 0;
    let pink = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      if (kind === "brown") {
        brown = (brown + white * 0.02) / 1.02;
        data[i] = brown * 3.5;
      } else if (kind === "pink") {
        pink = 0.985 * pink + 0.015 * white;
        data[i] = pink * 4;
      } else {
        data[i] = white * 0.7;
      }
    }
    return buffer;
  }

  function scheduleBinaural(ctx, preset, cfg, durationSec, refs) {
    const merger = ctx.createChannelMerger(2);
    const leftOsc = ctx.createOscillator();
    const rightOsc = ctx.createOscillator();
    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    const master = ctx.createGain();

    leftOsc.type = "sine";
    rightOsc.type = "sine";
    leftOsc.frequency.setValueAtTime(cfg.base, ctx.currentTime);

    const startTime = ctx.currentTime;
    const right = rightOsc.frequency;
    right.setValueAtTime(cfg.base + preset.start, startTime);

    let cursor = startTime;
    PHASES.forEach((phase) => {
      const len = durationSec * phase.ratio;
      const nowBeat = phase.name === "Prepare" ? preset.start : phase.name === "Return" ? preset.mid + 0.8 : preset.mid;
      const nextBeat = phase.name === "Prepare" ? preset.start : phase.name === "Relax" ? preset.mid + 0.4 : phase.name === "Return" ? preset.end : preset.mid;
      right.setValueAtTime(cfg.base + nowBeat, cursor);
      right.linearRampToValueAtTime(cfg.base + nextBeat, cursor + len);
      cursor += len;
    });

    leftGain.gain.value = 0.48;
    rightGain.gain.value = 0.48;
    master.gain.setValueAtTime(0.0001, startTime);
    master.gain.exponentialRampToValueAtTime(Math.max(0.001, cfg.volume), startTime + 3.5);
    master.gain.setValueAtTime(Math.max(0.001, cfg.volume), startTime + Math.max(3.5, durationSec - 5));
    master.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

    leftOsc.connect(leftGain).connect(merger, 0, 0);
    rightOsc.connect(rightGain).connect(merger, 0, 1);
    merger.connect(master).connect(ctx.destination);
    leftOsc.start(startTime);
    rightOsc.start(startTime + 0.02);
    leftOsc.stop(startTime + durationSec + 0.25);
    rightOsc.stop(startTime + durationSec + 0.25);
    refs.nodes.push(leftOsc, rightOsc, master, merger, leftGain, rightGain);

    if (cfg.noise !== "none" && cfg.noiseAmount > 0) {
      const noiseSource = ctx.createBufferSource();
      const noiseGain = ctx.createGain();
      noiseSource.buffer = makeNoiseBuffer(ctx, cfg.noise);
      noiseSource.loop = true;
      noiseGain.gain.setValueAtTime(0.0001, startTime);
      noiseGain.gain.exponentialRampToValueAtTime(Math.max(0.001, cfg.noiseAmount), startTime + 4);
      noiseGain.gain.setValueAtTime(Math.max(0.001, cfg.noiseAmount), startTime + Math.max(4, durationSec - 5));
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);
      noiseSource.connect(noiseGain).connect(ctx.destination);
      noiseSource.start(startTime);
      noiseSource.stop(startTime + durationSec + 0.25);
      refs.nodes.push(noiseSource, noiseGain);
    }
  }

  async function playStereoTest() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    await ctx.resume();
    const merger = ctx.createChannelMerger(2);
    const leftOsc = ctx.createOscillator();
    const rightOsc = ctx.createOscillator();
    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    const master = ctx.createGain();
    const t = ctx.currentTime;
    leftOsc.frequency.value = 440;
    rightOsc.frequency.value = 660;
    leftGain.gain.setValueAtTime(0.22, t);
    leftGain.gain.setValueAtTime(0.22, t + 0.8);
    leftGain.gain.linearRampToValueAtTime(0.0001, t + 1.0);
    rightGain.gain.setValueAtTime(0.0001, t);
    rightGain.gain.setValueAtTime(0.0001, t + 1.0);
    rightGain.gain.linearRampToValueAtTime(0.22, t + 1.12);
    rightGain.gain.setValueAtTime(0.22, t + 1.8);
    rightGain.gain.linearRampToValueAtTime(0.0001, t + 2.0);
    master.gain.value = 0.28;
    leftOsc.connect(leftGain).connect(merger, 0, 0);
    rightOsc.connect(rightGain).connect(merger, 0, 1);
    merger.connect(master).connect(ctx.destination);
    leftOsc.start(t);
    rightOsc.start(t);
    leftOsc.stop(t + 2.1);
    rightOsc.stop(t + 2.1);
    setTimeout(() => ctx.close(), 2300);
  }

  function computeTracker(ledger) {
    const dates = new Set(ledger.map(r => (r.timestamp || "").slice(0, 10)).filter(Boolean));
    let streak = 0;
    const d = new Date();
    for (;;) {
      const key = todayKey(d);
      if (!dates.has(key)) break;
      streak += 1;
      d.setDate(d.getDate() - 1);
    }
    const sessions = ledger.length;
    const week = clamp(Math.floor(sessions / 4) + 1, 1, 8);
    const focus = week <= 2 ? "Body-Asleep" : week <= 4 ? "Expansion" : week <= 6 ? "Time-Release" : "Bridge";
    const next = week <= 2 ? "Foundation 5–15 min" : week <= 4 ? "Expansion 15 min" : week <= 6 ? "No-Time 15–25 min" : "Bridge Preview 5–15 min";
    return { streak, sessions, week, focus, next };
  }

  function patternInsights(ledger) {
    if (!ledger.length) return ["No receipts yet. Run a 2-minute demo or gentle reset, then write the first receipt."];
    const insights = [];
    const best = [...ledger].sort((a, b) => (b.post?.overall_coherence || 0) - (a.post?.overall_coherence || 0))[0];
    if (best) insights.push(`Best coherence so far: ${best.preset}, ${best.duration_min} min, readiness ${best.readiness?.score ?? "—"}.`);
    const highReturn = ledger.filter(r => (r.post?.return_quality || 0) >= 8);
    if (highReturn.length) {
      const counts = highReturn.reduce((acc, r) => { acc[r.preset] = (acc[r.preset] || 0) + 1; return acc; }, {});
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (top) insights.push(`Cleanest returns currently cluster around ${top[0]} sessions.`);
    }
    const highFear = ledger.filter(r => (r.during?.fear_or_resistance || 0) >= 7).length;
    if (highFear) insights.push("High fear/resistance appeared in at least one receipt. Prefer Foundation and shorter sessions until return feels easy again.");
    if (ledger.length < 3) insights.push("Add 2–3 more receipts before trusting pattern suggestions.");
    return insights.slice(0, 4);
  }

  function RangeField({ label, value, min = 1, max = 10, step = 1, onChange }) {
    return h("div", { className: "field" },
      h("label", null, `${label}: ${value}`),
      h("input", { type: "range", min, max, step, value, onChange: e => onChange(Number(e.target.value)) })
    );
  }

  function StatCard({ label, value, note }) {
    return h("div", { className: "stat-card" },
      h("div", { className: "stat-value" }, value),
      h("div", { className: "stat-label" }, label),
      note ? h("div", { className: "soft small" }, note) : null
    );
  }

  function FlowStepper({ step, setStep }) {
    const steps = [
      ["build", "Readiness"],
      ["recommend", "Recommend"],
      ["cockpit", "Cockpit"],
      ["return", "Return"],
      ["journal", "Journal"],
      ["ledger", "Ledger"]
    ];
    return h("div", { className: "flow-stepper" }, steps.map(([id, label], idx) =>
      h("button", { key: id, className: `flow-step ${step === id ? "active" : ""}`, onClick: () => setStep(id) }, h("span", null, idx + 1), label)
    ));
  }

  function App() {
    const prefs = loadPrefs() || {};
    const [step, setStep] = useState(prefs.step || "build");
    const [presetName, setPresetName] = useState(prefs.presetName || "Bridge");
    const [durationMin, setDurationMin] = useState(prefs.durationMin || 5);
    const [guidanceMode, setGuidanceMode] = useState(prefs.guidanceMode || "Neutral");
    const [base, setBase] = useState(prefs.base || PRESETS[prefs.presetName || "Bridge"].base);
    const [noise, setNoise] = useState(prefs.noise || "pink");
    const [noiseAmount, setNoiseAmount] = useState(prefs.noiseAmount ?? 0.04);
    const [volume, setVolume] = useState(prefs.volume ?? 0.16);
    const [pre, setPre] = useState(prefs.pre || {
      mood: 7,
      sleep: 7,
      stress: 3,
      grounded: 7,
      safe: true,
      headphones: true,
      ack: false,
      destabilized: false,
      intention: PRESETS.Bridge.intention
    });
    const [readiness, setReadiness] = useState(null);
    const [running, setRunning] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [returnTimer, setReturnTimer] = useState(60);
    const [groundedEnough, setGroundedEnough] = useState(false);
    const [ledger, setLedger] = useState(loadLedger());
    const [toast, setToast] = useState("Ready. Smooth Flow guides you: readiness → recommendation → cockpit → return → journal → ledger.");
    const [metrics, setMetrics] = useState({
      depth: 5,
      relaxation: 5,
      witness: 5,
      imagery: 5,
      time: 5,
      clarity: 5,
      fear: 1,
      returnQuality: 7,
      memory: 5,
      grounding: 7,
      coherence: 6,
      notes: "",
      fragments: ""
    });

    const audioRef = useRef({ ctx: null, nodes: [] });
    const startStamp = useRef(null);
    const preset = PRESETS[presetName];
    const durationSec = durationMin * 60;
    const phase = useMemo(() => currentPhase(elapsed, durationSec), [elapsed, durationSec]);
    const progress = durationSec ? clamp((elapsed / durationSec) * 100, 0, 100) : 0;
    const phaseProgress = phase.phaseEnd > phase.phaseStart ? clamp(((elapsed - phase.phaseStart) / (phase.phaseEnd - phase.phaseStart)) * 100, 0, 100) : 0;
    const tracker = useMemo(() => computeTracker(ledger), [ledger]);
    const insights = useMemo(() => patternInsights(ledger), [ledger]);

    useEffect(() => {
      savePrefs({ step, presetName, durationMin, guidanceMode, base, noise, noiseAmount, volume, pre });
    }, [step, presetName, durationMin, guidanceMode, base, noise, noiseAmount, volume, pre]);

    useEffect(() => {
      if (!running) return;
      const id = setInterval(() => {
        const next = Math.min(durationSec, Math.floor((Date.now() - startStamp.current) / 1000));
        setElapsed(next);
        if (next >= durationSec) stopSession(false, true);
      }, 300);
      return () => clearInterval(id);
    }, [running, durationSec]);

    useEffect(() => {
      if (step !== "return" || groundedEnough || returnTimer <= 0) return;
      const id = setInterval(() => setReturnTimer(t => Math.max(0, t - 1)), 1000);
      return () => clearInterval(id);
    }, [step, groundedEnough, returnTimer]);

    function setPresetClean(name) {
      setPresetName(name);
      setBase(PRESETS[name].base);
      setNoise(PRESETS[name].noise);
      setPre({ ...pre, intention: PRESETS[name].intention });
    }

    function applyQuick(run) {
      stopSession(false, false);
      setPresetName(run.preset);
      setDurationMin(run.duration);
      setGuidanceMode(run.mode);
      setBase(PRESETS[run.preset].base);
      setNoise(PRESETS[run.preset].noise);
      setPre({ ...pre, intention: PRESETS[run.preset].intention });
      setToast(`${run.title} loaded. Calculate readiness, then continue.`);
      setStep("build");
    }

    function calcReadiness(goNext = true) {
      const r = readinessScore(pre);
      setReadiness(r);
      setToast(`Readiness ${r.score}/100: ${r.level}. ${r.recommendation}`);
      if (r.level !== "Green") {
        setPresetName(r.suggestedPreset);
        setDurationMin(r.suggestedDuration);
        setGuidanceMode(r.suggestedMode);
        setBase(PRESETS[r.suggestedPreset].base);
        setNoise(PRESETS[r.suggestedPreset].noise);
      }
      if (goNext) setStep("recommend");
      return r;
    }

    function acceptRecommendation() {
      const r = readiness || calcReadiness(false);
      setPresetName(r.suggestedPreset);
      setDurationMin(r.suggestedDuration);
      setGuidanceMode(r.suggestedMode);
      setBase(PRESETS[r.suggestedPreset].base);
      setNoise(PRESETS[r.suggestedPreset].noise);
      setPre({ ...pre, intention: PRESETS[r.suggestedPreset].intention });
      setToast(`${r.suggestedPreset} ${r.suggestedDuration}-minute recommendation loaded.`);
    }

    async function startSession() {
      if (!pre.ack) {
        setToast("Safety acknowledgement required before audio starts.");
        setStep("build");
        return;
      }
      if (!readiness) calcReadiness(false);
      stopAudioOnly();
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        setToast("This browser does not support Web Audio.");
        return;
      }
      try {
        const ctx = new AudioContext();
        await ctx.resume();
        const refs = { ctx, nodes: [] };
        audioRef.current = refs;
        scheduleBinaural(ctx, preset, { base, volume, noise, noiseAmount }, durationSec, refs);
        startStamp.current = Date.now();
        setElapsed(0);
        setReturnTimer(60);
        setGroundedEnough(false);
        setRunning(true);
        setToast(`${presetName} session started. RETURN NOW is always available.`);
        setStep("cockpit");
      } catch (err) {
        setToast(`Audio start failed: ${err.message || err}`);
      }
    }

    function stopAudioOnly() {
      const refs = audioRef.current;
      try {
        refs.nodes.forEach(node => {
          try { if (node.stop) node.stop(0); } catch (_) {}
          try { if (node.disconnect) node.disconnect(); } catch (_) {}
        });
      } catch (_) {}
      try { if (refs.ctx && refs.ctx.state !== "closed") refs.ctx.close(); } catch (_) {}
      audioRef.current = { ctx: null, nodes: [] };
    }

    function stopSession(setReturn = true, completed = false) {
      stopAudioOnly();
      setRunning(false);
      if (setReturn) {
        setReturnTimer(60);
        setGroundedEnough(false);
        setToast("RETURN NOW active. Ground first, journal after stable.");
        setStep("return");
      } else if (completed) {
        setReturnTimer(60);
        setGroundedEnough(false);
        setToast("Session complete. Auto-return has started. Ground first, then journal.");
        setStep("return");
      }
    }

    async function testAudio() {
      try {
        await playStereoTest();
        setToast("Stereo test played: left tone then right tone.");
      } catch (err) {
        setToast(`Stereo test failed: ${err.message || err}`);
      }
    }

    function writeReceipt() {
      const receipt = {
        session_id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        timestamp: new Date().toISOString(),
        app: VERSION,
        preset: presetName,
        target_gate: preset.gate,
        duration_min: durationMin,
        actual_elapsed_sec: elapsed,
        guidance_mode: guidanceMode,
        readiness: readiness || readinessScore(pre),
        pre,
        audio_params: { engine: "browser_web_audio_binaural_v0.3", base_hz: base, beat_start_hz: preset.start, beat_mid_hz: preset.mid, beat_end_hz: preset.end, noise, noise_amount: noiseAmount, master_volume: volume },
        during: { perceived_depth: metrics.depth, body_relaxation: metrics.relaxation, stable_witness_presence: metrics.witness, imagery_vividness: metrics.imagery, time_distortion: metrics.time, mental_clarity: metrics.clarity, fear_or_resistance: metrics.fear },
        post: { return_quality: metrics.returnQuality, memory_retention: metrics.memory, grounding_feeling: metrics.grounding, overall_coherence: metrics.coherence },
        notes: metrics.notes,
        dreamlike_fragments: metrics.fragments,
        claim_boundary: "subjective self-report; local training receipt; no medical or objective-state claim"
      };
      const next = [receipt, ...ledger];
      setLedger(next);
      saveLedger(next);
      setToast("Receipt saved locally. Ledger insights updated.");
      setMetrics({ ...metrics, notes: "", fragments: "" });
      setStep("ledger");
    }

    function exportJson() {
      downloadBlob(new Blob([JSON.stringify(ledger, null, 2)], { type: "application/json" }), `focusbridge21-ledger-${Date.now()}.json`);
    }

    function exportCsv() {
      const header = ["timestamp", "preset", "gate", "duration", "readiness", "depth", "relaxation", "witness", "fear", "return", "coherence", "notes"];
      const rows = ledger.map(r => [r.timestamp, r.preset, r.target_gate, r.duration_min, r.readiness?.score ?? "", r.during?.perceived_depth ?? "", r.during?.body_relaxation ?? "", r.during?.stable_witness_presence ?? "", r.during?.fear_or_resistance ?? "", r.post?.return_quality ?? "", r.post?.overall_coherence ?? "", r.notes || ""]);
      const csv = [header, ...rows].map(row => row.map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
      downloadBlob(new Blob([csv], { type: "text/csv" }), `focusbridge21-ledger-${Date.now()}.csv`);
    }

    function downloadBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    function clearLedger() {
      if (!confirm("Clear local browser ledger? This only clears this browser's localStorage.")) return;
      setLedger([]);
      saveLedger([]);
      setToast("Local browser ledger cleared.");
    }

    const stats = useMemo(() => {
      const avg = keyPath => {
        const vals = ledger.map(r => keyPath.split(".").reduce((o, k) => o?.[k], r)).filter(v => typeof v === "number");
        if (!vals.length) return "—";
        return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
      };
      const best = [...ledger].sort((a, b) => (b.post?.overall_coherence || 0) - (a.post?.overall_coherence || 0))[0];
      return { count: ledger.length, avgWitness: avg("during.stable_witness_presence"), avgReturn: avg("post.return_quality"), avgCoherence: avg("post.overall_coherence"), best };
    }, [ledger]);

    const scoreClass = readiness ? (readiness.level === "Green" ? "score-green" : readiness.level === "Yellow" ? "score-yellow" : "score-red") : "";
    const canJournal = groundedEnough || returnTimer <= 0;

    return h(React.Fragment, null,
      h("header", { className: "hero wrap" },
        h("div", { className: "eyebrow" }, "Parallax / PHI369 live prototype"),
        h("h1", null, "FocusBridge21"),
        h("p", { className: "subtitle" }, "Smooth Flow guides the whole practice: readiness → recommendation → cockpit → auto-return → journal → ledger."),
        h("div", { className: "hero-kpis" }, h("span", null, "Local-first"), h("span", null, "Web Audio"), h("span", null, "No cloud ledger"), h("span", null, VERSION)),
        h("div", { className: "top-actions" },
          h("a", { className: "link-button primary", href: "https://github.com/MichaelWave369/focusbridge21" }, "GitHub repo"),
          h("a", { className: "link-button", href: `${DOC_PREFIX}FocusBridge21_Master_Spec_v0.2.md` }, "Master spec"),
          h("button", { className: "button", onClick: testAudio }, "Stereo test")
        )
      ),
      h("main", { className: "wrap" },
        h("section", { className: "notice smooth-notice" }, h("strong", null, "Safety first: "), "This is a meditative training prototype, not medical care, therapy, a guaranteed Focus 21 switch, or an OBE guarantee. Do not use while driving or operating machinery. Start short, keep volume low, and use RETURN NOW whenever needed."),
        h("div", { className: "toast" }, toast),
        h(FlowStepper, { step, setStep }),

        step === "build" && h("section", null,
          h("div", { className: "quick-grid" }, QUICK_RUNS.map(run => h("button", { key: run.title, className: "quick-card", onClick: () => applyQuick(run) }, h("strong", null, run.title), h("span", null, `${run.preset} • ${run.duration} min`), h("em", null, run.note)))) ,
          h("section", { className: "app-grid" },
            h("div", { className: "panel" },
              h("h2", null, "Readiness Gate"),
              h("p", { className: "muted" }, "A conservative pre-session check. It helps choose safer intensity; it does not diagnose anything."),
              h("div", { className: "form-grid" },
                h(RangeField, { label: "Mood / steadiness", value: pre.mood, onChange: mood => setPre({ ...pre, mood }) }),
                h(RangeField, { label: "Sleep quality", value: pre.sleep, onChange: sleep => setPre({ ...pre, sleep }) }),
                h(RangeField, { label: "Stress level", value: pre.stress, onChange: stress => setPre({ ...pre, stress }) }),
                h(RangeField, { label: "Grounded in room/body", value: pre.grounded, onChange: grounded => setPre({ ...pre, grounded }) })
              ),
              h("label", { className: "checkline" }, h("input", { type: "checkbox", checked: pre.safe, onChange: e => setPre({ ...pre, safe: e.target.checked }) }), "I am in a safe, quiet environment."),
              h("label", { className: "checkline" }, h("input", { type: "checkbox", checked: pre.headphones, onChange: e => setPre({ ...pre, headphones: e.target.checked }) }), "Stereo headphones are working and volume is low."),
              h("label", { className: "checkline" }, h("input", { type: "checkbox", checked: pre.ack, onChange: e => setPre({ ...pre, ack: e.target.checked }) }), "I understand the safety notes and will not use this in unsafe contexts."),
              h("label", { className: "checkline" }, h("input", { type: "checkbox", checked: pre.destabilized, onChange: e => setPre({ ...pre, destabilized: e.target.checked }) }), "Recent destabilizing meditation or altered-state experience."),
              h("div", { className: "field" }, h("label", null, "Session intention"), h("textarea", { value: pre.intention, onChange: e => setPre({ ...pre, intention: e.target.value }) })),
              h("div", { className: "top-actions left" }, h("button", { className: "button primary", onClick: () => calcReadiness(true) }, "Calculate + Continue"), h("button", { className: "button ghost", onClick: testAudio }, "Stereo test")),
              readiness && h("div", { className: "score-box" }, h("div", { className: `score-number ${scoreClass}` }, readiness.score), h("div", null, h("strong", null, readiness.level), h("div", { className: "muted" }, readiness.recommendation), h("div", { className: "soft small" }, `Suggested: ${readiness.suggestedPreset}, ${readiness.suggestedDuration} min`)))
            ),
            h("div", { className: "panel" },
              h("h2", null, "Manual Session Builder"),
              h("div", { className: "field" }, h("label", null, "Preset"), h("select", { value: presetName, onChange: e => setPresetClean(e.target.value) }, Object.keys(PRESETS).map(name => h("option", { key: name, value: name }, name)))) ,
              h("p", { className: "muted" }, preset.desc),
              h("div", { className: "form-grid" },
                h("div", { className: "field" }, h("label", null, "Duration"), h("select", { value: durationMin, onChange: e => setDurationMin(Number(e.target.value)) }, [2, 5, 15, 25, 35, 45].map(d => h("option", { key: d, value: d }, `${d} minutes`)))),
                h("div", { className: "field" }, h("label", null, "Guidance mode"), h("select", { value: guidanceMode, onChange: e => setGuidanceMode(e.target.value) }, ["Neutral", "Resonance Architect"].map(v => h("option", { key: v, value: v }, v)))),
                h("div", { className: "field" }, h("label", null, `Carrier/base Hz: ${base}`), h("input", { type: "range", min: 120, max: 440, step: 5, value: base, onChange: e => setBase(Number(e.target.value)) })),
                h("div", { className: "field" }, h("label", null, "Noise"), h("select", { value: noise, onChange: e => setNoise(e.target.value) }, ["none", "pink", "brown", "white"].map(v => h("option", { key: v, value: v }, v)))),
                h("div", { className: "field" }, h("label", null, `Noise amount: ${noiseAmount}`), h("input", { type: "range", min: 0, max: 0.25, step: 0.01, value: noiseAmount, onChange: e => setNoiseAmount(Number(e.target.value)) })),
                h("div", { className: "field" }, h("label", null, `Master volume: ${volume}`), h("input", { type: "range", min: 0.02, max: 0.5, step: 0.01, value: volume, onChange: e => setVolume(Number(e.target.value)) }))
              )
            )
          )
        ),

        step === "recommend" && h("section", { className: "app-grid" },
          h("div", { className: "panel recommendation-card" },
            h("h2", null, "Recommended Session"),
            readiness ? h(React.Fragment, null,
              h("div", { className: "score-box" }, h("div", { className: `score-number ${scoreClass}` }, readiness.score), h("div", null, h("strong", null, `${readiness.level} readiness`), h("div", { className: "muted" }, readiness.recommendation))),
              h("div", { className: "recommended-big" }, `${readiness.suggestedPreset} • ${readiness.suggestedDuration} min`),
              h("p", { className: "muted" }, PRESETS[readiness.suggestedPreset].desc),
              h("div", { className: "top-actions left" }, h("button", { className: "button primary big", onClick: () => { acceptRecommendation(); startSession(); } }, "Accept + Start"), h("button", { className: "button", onClick: acceptRecommendation }, "Load recommendation"), h("button", { className: "button ghost", onClick: () => setStep("build") }, "Adjust manually"))
            ) : h("p", { className: "muted" }, "Calculate readiness first." )
          ),
          h("div", { className: "panel" },
            h("h2", null, "Practice Tracker"),
            h("div", { className: "stat-grid two" }, h(StatCard, { label: "Streak", value: tracker.streak, note: "days" }), h(StatCard, { label: "Protocol week", value: tracker.week, note: tracker.focus }), h(StatCard, { label: "Receipts", value: tracker.sessions }), h(StatCard, { label: "Next practice", value: tracker.next })),
            h("h3", null, "Pattern hints"),
            h("ul", null, insights.map(x => h("li", { key: x }, x)))
          )
        ),

        step === "cockpit" && h("section", { className: "app-grid" },
          h("div", { className: "panel portal-panel" },
            h("div", { className: "portal" }, [1, 2, 3, 4, 5].map(i => h("div", { key: i, className: `ring r${i}` })), h("div", { className: "core" }, h("span", null, presetName.toUpperCase()), h("span", null, `GATE ${preset.gate}`), h("span", null, running ? "LIVE" : "READY"))),
            h("div", { className: "progress-wrap" }, h("div", { className: "progress-bar", style: { width: `${progress}%` } })),
            h("div", { className: "soft small" }, `Session progress ${Math.round(progress)}% • Phase progress ${Math.round(phaseProgress)}%`)
          ),
          h("div", { className: "panel sticky-return" },
            h("h2", null, "Live Cockpit"),
            h("div", { className: "timer" }, fmtTime(Math.max(0, durationSec - elapsed))),
            h("div", { className: "coach-card" }, h("div", { className: "coach-phase" }, phase.name), h("div", { className: "coach-line" }, phase.coach), h("div", { className: "soft small" }, preset.coach)),
            h("div", { className: "phase-pills" }, PHASES.map(p => h("span", { key: p.name, className: `phase-pill ${p.name === phase.name ? "active" : ""}` }, p.name))),
            h("div", { className: "top-actions left" }, h("button", { className: "button primary", onClick: startSession }, running ? "Restart" : "Start"), h("button", { className: "button", onClick: () => stopSession(false, false) }, "Stop"), h("button", { className: "button danger", onClick: () => stopSession(true, false) }, "RETURN NOW")),
            h("div", { className: "return-box" }, h("h3", null, "Return protocol ready"), h("ol", null, ["Stop audio and open your eyes.", "Feel feet, hands, breath, and room.", "Name three things you see.", "Name three things you hear.", "Name three things you feel.", "Drink water. Move gently. Journal after grounded."].map(x => h("li", { key: x }, x)))),
            h("h3", null, "Guidance"),
            h("ul", null, GUIDANCE[guidanceMode][phase.name].map(x => h("li", { key: x }, x)))
          )
        ),

        step === "return" && h("section", { className: "return-screen panel" },
          h("div", { className: "return-orb" }, fmtTime(returnTimer)),
          h("h2", null, "Auto-Return"),
          h("p", { className: "muted" }, "Audio is stopped. Take one full minute to orient before journaling."),
          h("div", { className: "return-grid" },
            ["Open your eyes.", "Feel your feet.", "Feel your hands.", "Name 3 things you see.", "Name 3 things you hear.", "Name 3 things you feel.", "Drink water.", "Move gently."].map(x => h("div", { key: x, className: "return-step" }, x))
          ),
          h("label", { className: "checkline center" }, h("input", { type: "checkbox", checked: groundedEnough, onChange: e => setGroundedEnough(e.target.checked) }), "I feel grounded enough to journal."),
          h("div", { className: "top-actions" }, h("button", { className: "button primary big", disabled: !canJournal, onClick: () => setStep("journal") }, canJournal ? "Continue to Journal" : "Journal unlocks after return"), h("button", { className: "button ghost", onClick: () => setStep("build") }, "Back to Builder"))
        ),

        step === "journal" && h("section", { className: "panel" },
          h("h2", null, "Post-Session Journal Receipt"),
          h("p", { className: "muted" }, "Rate capacities, not fantasies. The Signal Ledger learns through honest receipts."),
          h("div", { className: "metric-grid" },
            h(RangeField, { label: "Perceived depth", value: metrics.depth, onChange: depth => setMetrics({ ...metrics, depth }) }),
            h(RangeField, { label: "Body relaxation", value: metrics.relaxation, onChange: relaxation => setMetrics({ ...metrics, relaxation }) }),
            h(RangeField, { label: "Stable witness", value: metrics.witness, onChange: witness => setMetrics({ ...metrics, witness }) }),
            h(RangeField, { label: "Imagery vividness", value: metrics.imagery, onChange: imagery => setMetrics({ ...metrics, imagery }) }),
            h(RangeField, { label: "Time distortion", value: metrics.time, onChange: time => setMetrics({ ...metrics, time }) }),
            h(RangeField, { label: "Mental clarity", value: metrics.clarity, onChange: clarity => setMetrics({ ...metrics, clarity }) }),
            h(RangeField, { label: "Fear / resistance", value: metrics.fear, onChange: fear => setMetrics({ ...metrics, fear }) }),
            h(RangeField, { label: "Return quality", value: metrics.returnQuality, onChange: returnQuality => setMetrics({ ...metrics, returnQuality }) }),
            h(RangeField, { label: "Memory retention", value: metrics.memory, onChange: memory => setMetrics({ ...metrics, memory }) }),
            h(RangeField, { label: "Grounded after", value: metrics.grounding, onChange: grounding => setMetrics({ ...metrics, grounding }) }),
            h(RangeField, { label: "Overall coherence", value: metrics.coherence, onChange: coherence => setMetrics({ ...metrics, coherence }) })
          ),
          h("div", { className: "field" }, h("label", null, "Notes"), h("textarea", { value: metrics.notes, onChange: e => setMetrics({ ...metrics, notes: e.target.value }) })),
          h("div", { className: "field" }, h("label", null, "Dreamlike fragments / symbolic material"), h("textarea", { value: metrics.fragments, onChange: e => setMetrics({ ...metrics, fragments: e.target.value }) })),
          h("div", { className: "top-actions left" }, h("button", { className: "button primary", onClick: writeReceipt }, "Write Local Browser Receipt"), h("button", { className: "button ghost", onClick: () => setStep("build") }, "Back to builder"))
        ),

        step === "ledger" && h("section", { className: "panel" },
          h("h2", null, "Signal Ledger"),
          h("p", { className: "muted" }, `Local browser receipts: ${ledger.length}. This data lives in localStorage on this device/browser unless exported.`),
          h("div", { className: "stat-grid" }, h(StatCard, { label: "Receipts", value: stats.count }), h(StatCard, { label: "Avg witness", value: stats.avgWitness }), h(StatCard, { label: "Avg return", value: stats.avgReturn }), h(StatCard, { label: "Avg coherence", value: stats.avgCoherence })),
          h("div", { className: "notice" }, h("strong", null, "Pattern insights: "), h("ul", null, insights.map(x => h("li", { key: x }, x)))),
          stats.best && h("div", { className: "notice" }, h("strong", null, "Best coherence receipt: "), `${stats.best.preset} • ${stats.best.duration_min} min • readiness ${stats.best.readiness?.score ?? "—"} • base ${stats.best.audio_params?.base_hz ?? "—"} Hz • noise ${stats.best.audio_params?.noise ?? "—"}`),
          h("div", { className: "top-actions left" }, h("button", { className: "button", onClick: exportJson, disabled: !ledger.length }, "Export JSON"), h("button", { className: "button", onClick: exportCsv, disabled: !ledger.length }, "Export CSV"), h("button", { className: "button danger", onClick: clearLedger, disabled: !ledger.length }, "Clear local ledger"), h("button", { className: "button primary", onClick: () => setStep("build") }, "New session")),
          ledger.length === 0 ? h("p", { className: "soft" }, "No receipts yet.") : h("div", { className: "ledger-table-wrap" }, h("table", null, h("thead", null, h("tr", null, ["Time", "Preset", "Gate", "Ready", "Depth", "Witness", "Fear", "Return", "Coherence", "Notes"].map(x => h("th", { key: x }, x)))), h("tbody", null, ledger.map(r => h("tr", { key: r.session_id }, h("td", null, new Date(r.timestamp).toLocaleString()), h("td", null, r.preset), h("td", null, r.target_gate), h("td", null, r.readiness?.score ?? ""), h("td", null, r.during?.perceived_depth), h("td", null, r.during?.stable_witness_presence), h("td", null, r.during?.fear_or_resistance), h("td", null, r.post?.return_quality), h("td", null, r.post?.overall_coherence), h("td", null, r.notes || ""))))))
        ),

        step === "protocol" && h("section", { className: "panel" },
          h("h2", null, "8-Week Mastery Protocol"),
          h("div", { className: "protocol-grid" },
            h("div", { className: "panel tight" }, h("h3", null, "Weeks 1–2"), h("p", null, "Body-asleep mastery. Metrics: body relaxation, return quality, grounding.")),
            h("div", { className: "panel tight" }, h("h3", null, "Weeks 3–4"), h("p", null, "Expanded awareness. Metrics: perceived depth, imagery, stable witness.")),
            h("div", { className: "panel tight" }, h("h3", null, "Weeks 5–6"), h("p", null, "Time-release. Metrics: time distortion, mental clarity, stable witness.")),
            h("div", { className: "panel tight" }, h("h3", null, "Weeks 7–8"), h("p", null, "Threshold / Bridge practice. Metrics: low fear, clean return, memory retention."))
          ),
          h("p", { className: "mono" }, "The better question is not only: Did I reach Focus 21? It is: Which capacities were present, and how cleanly did I return?")
        )
      ),
      h("footer", { className: "wrap" }, "FocusBridge21 v0.3 — Smooth Flow, browser-local, MIT licensed, safety-first, receipt-driven.")
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(h(App));
})();
