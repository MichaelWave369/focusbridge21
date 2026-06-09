(() => {
  const { useEffect, useMemo, useRef, useState } = React;
  const h = React.createElement;

  const PRESETS = {
    Foundation: { gate: 10, desc: "Body-asleep training: relaxation, breath, safety, clean return.", base: 180, start: 8.0, mid: 5.5, end: 9.5, noise: "pink" },
    Expansion: { gate: 12, desc: "Expanded awareness: spatial widening, observer mode, calm perception.", base: 200, start: 7.0, mid: 5.0, end: 9.0, noise: "pink" },
    "No-Time": { gate: 15, desc: "Time-release practice: spaciousness, memory anchors, stable witness.", base: 210, start: 6.5, mid: 4.2, end: 8.5, noise: "brown" },
    Bridge: { gate: 21, desc: "Threshold practice: stable witness, non-grasping exploration, reliable return.", base: 220, start: 6.2, mid: 4.6, end: 9.0, noise: "pink" }
  };

  const PHASES = [
    { name: "Prepare", ratio: 0.12, cue: "Safety, intention, breath, headphones, return anchor." },
    { name: "Relax", ratio: 0.25, cue: "Body-asleep stability and physical softening." },
    { name: "Expand", ratio: 0.23, cue: "Spatial widening and observer mode." },
    { name: "Threshold", ratio: 0.25, cue: "Stable witness at the bridge without forcing." },
    { name: "Return", ratio: 0.15, cue: "Clean return, orientation, integration." }
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

  const LS_KEY = "focusbridge21-ledger-v1";

  function fmtTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function loadLedger() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
    catch { return []; }
  }

  function saveLedger(rows) {
    localStorage.setItem(LS_KEY, JSON.stringify(rows));
  }

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
    score = Math.max(0, Math.min(100, Math.round(score)));

    let level = "Red";
    let recommendation = "Readiness is low. Prefer rest, grounding, breath, or a short Foundation session.";
    let suggestedPreset = "Foundation";
    let suggestedDuration = 15;

    if (form.destabilized || !form.safe || !form.ack) {
      level = "Red";
      recommendation = "Do not do threshold work right now. Choose rest, grounding, or very short Foundation only.";
    } else if (score >= 75) {
      level = "Green";
      recommendation = "Good readiness for normal practice. Stay conservative and keep RETURN NOW visible.";
      suggestedPreset = "Bridge";
      suggestedDuration = 25;
    } else if (score >= 50) {
      level = "Yellow";
      recommendation = "Use a gentle session. Prefer Foundation or Expansion. Avoid pushing threshold work today.";
    }

    if (Number(form.sleep) <= 3 || Number(form.stress) >= 8 || Number(form.grounded) <= 4) {
      suggestedPreset = "Foundation";
      suggestedDuration = 15;
    }
    return { score, level, recommendation, suggestedPreset, suggestedDuration };
  }

  function currentPhase(elapsed, duration) {
    let cursor = 0;
    for (const phase of PHASES) {
      const len = duration * phase.ratio;
      if (elapsed <= cursor + len) return phase;
      cursor += len;
    }
    return PHASES[PHASES.length - 1];
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
    master.gain.exponentialRampToValueAtTime(cfg.volume, startTime + 4);
    master.gain.setValueAtTime(cfg.volume, startTime + Math.max(4, durationSec - 6));
    master.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

    leftOsc.connect(leftGain).connect(merger, 0, 0);
    rightOsc.connect(rightGain).connect(merger, 0, 1);
    merger.connect(master).connect(ctx.destination);
    leftOsc.start(startTime);
    rightOsc.start(startTime);
    leftOsc.stop(startTime + durationSec + 0.2);
    rightOsc.stop(startTime + durationSec + 0.2);

    refs.nodes.push(leftOsc, rightOsc, master);

    if (cfg.noise !== "none" && cfg.noiseAmount > 0) {
      const noiseSource = ctx.createBufferSource();
      const noiseGain = ctx.createGain();
      noiseSource.buffer = makeNoiseBuffer(ctx, cfg.noise);
      noiseSource.loop = true;
      noiseGain.gain.value = cfg.noiseAmount;
      noiseSource.connect(noiseGain).connect(ctx.destination);
      noiseSource.start(startTime);
      noiseSource.stop(startTime + durationSec + 0.2);
      refs.nodes.push(noiseSource, noiseGain);
    }
  }

  function RangeField({ label, value, min = 1, max = 10, onChange }) {
    return h("div", { className: "field" },
      h("label", null, `${label}: ${value}`),
      h("input", { type: "range", min, max, value, onChange: e => onChange(Number(e.target.value)) })
    );
  }

  function App() {
    const [tab, setTab] = useState("build");
    const [presetName, setPresetName] = useState("Bridge");
    const [durationMin, setDurationMin] = useState(15);
    const [guidanceMode, setGuidanceMode] = useState("Neutral");
    const [base, setBase] = useState(PRESETS.Bridge.base);
    const [noise, setNoise] = useState("pink");
    const [noiseAmount, setNoiseAmount] = useState(0.05);
    const [volume, setVolume] = useState(0.18);
    const [pre, setPre] = useState({ mood: 7, sleep: 7, stress: 3, grounded: 7, safe: true, headphones: true, ack: false, destabilized: false, intention: "Stable witness, clean return, honest receipt." });
    const [readiness, setReadiness] = useState(null);
    const [running, setRunning] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [returnMode, setReturnMode] = useState(false);
    const [ledger, setLedger] = useState(loadLedger());
    const [metrics, setMetrics] = useState({ depth: 5, relaxation: 5, witness: 5, imagery: 5, time: 5, clarity: 5, fear: 1, returnQuality: 7, memory: 5, grounding: 7, coherence: 6, notes: "", fragments: "" });

    const audioRef = useRef({ ctx: null, nodes: [] });
    const startStamp = useRef(null);
    const preset = PRESETS[presetName];
    const durationSec = durationMin * 60;
    const phase = useMemo(() => currentPhase(elapsed, durationSec), [elapsed, durationSec]);

    useEffect(() => {
      setBase(PRESETS[presetName].base);
      setNoise(PRESETS[presetName].noise);
    }, [presetName]);

    useEffect(() => {
      if (!running) return;
      const id = setInterval(() => {
        const next = Math.min(durationSec, Math.floor((Date.now() - startStamp.current) / 1000));
        setElapsed(next);
        if (next >= durationSec) stopSession(false);
      }, 500);
      return () => clearInterval(id);
    }, [running, durationSec]);

    function calcReadiness() {
      const r = readinessScore(pre);
      setReadiness(r);
      if (r.level !== "Green") {
        setPresetName(r.suggestedPreset);
        setDurationMin(r.suggestedDuration);
      }
    }

    async function startSession() {
      if (!pre.ack) {
        alert("Please acknowledge the safety notes before starting.");
        return;
      }
      stopAudioOnly();
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      await ctx.resume();
      const refs = { ctx, nodes: [] };
      audioRef.current = refs;
      scheduleBinaural(ctx, preset, { base, volume, noise, noiseAmount }, durationSec, refs);
      startStamp.current = Date.now();
      setElapsed(0);
      setReturnMode(false);
      setRunning(true);
      setTab("cockpit");
    }

    function stopAudioOnly() {
      const refs = audioRef.current;
      try { refs.nodes.forEach(node => { if (node.stop) node.stop(0); if (node.disconnect) node.disconnect(); }); } catch (_) {}
      try { if (refs.ctx) refs.ctx.close(); } catch (_) {}
      audioRef.current = { ctx: null, nodes: [] };
    }

    function stopSession(setReturn = true) {
      stopAudioOnly();
      setRunning(false);
      if (setReturn) setReturnMode(true);
    }

    function writeReceipt() {
      const receipt = {
        session_id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        timestamp: new Date().toISOString(),
        app: "FocusBridge21 React GitHub Pages v0.1",
        preset: presetName,
        target_gate: preset.gate,
        duration_min: durationMin,
        actual_elapsed_sec: elapsed,
        guidance_mode: guidanceMode,
        readiness,
        pre,
        audio_params: { engine: "browser_web_audio_binaural_v0.1", base_hz: base, beat_start_hz: preset.start, beat_mid_hz: preset.mid, beat_end_hz: preset.end, noise, noise_amount: noiseAmount, master_volume: volume },
        during: { perceived_depth: metrics.depth, body_relaxation: metrics.relaxation, stable_witness_presence: metrics.witness, imagery_vividness: metrics.imagery, time_distortion: metrics.time, mental_clarity: metrics.clarity, fear_or_resistance: metrics.fear },
        post: { return_quality: metrics.returnQuality, memory_retention: metrics.memory, grounding_feeling: metrics.grounding, overall_coherence: metrics.coherence },
        notes: metrics.notes,
        dreamlike_fragments: metrics.fragments,
        claim_boundary: "subjective self-report; local training receipt; no medical or objective-state claim"
      };
      const next = [receipt, ...ledger];
      setLedger(next);
      saveLedger(next);
      setTab("ledger");
    }

    function exportJson() {
      const blob = new Blob([JSON.stringify(ledger, null, 2)], { type: "application/json" });
      downloadBlob(blob, `focusbridge21-ledger-${Date.now()}.json`);
    }

    function exportCsv() {
      const header = ["timestamp", "preset", "gate", "duration", "readiness", "depth", "relaxation", "witness", "fear", "return", "coherence", "notes"];
      const rows = ledger.map(r => [r.timestamp, r.preset, r.target_gate, r.duration_min, r.readiness?.score ?? "", r.during?.perceived_depth ?? "", r.during?.body_relaxation ?? "", r.during?.stable_witness_presence ?? "", r.during?.fear_or_resistance ?? "", r.post?.return_quality ?? "", r.post?.overall_coherence ?? "", (r.notes || "").replaceAll('"', '""')]);
      const csv = [header, ...rows].map(row => row.map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
      downloadBlob(new Blob([csv], { type: "text/csv" }), `focusbridge21-ledger-${Date.now()}.csv`);
    }

    function downloadBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }

    function clearLedger() {
      if (!confirm("Clear local browser ledger? This only clears this browser's localStorage.")) return;
      setLedger([]);
      saveLedger([]);
    }

    const scoreClass = readiness ? (readiness.level === "Green" ? "score-green" : readiness.level === "Yellow" ? "score-yellow" : "score-red") : "";

    return h(React.Fragment, null,
      h("header", { className: "hero wrap" },
        h("div", { className: "eyebrow" }, "Parallax / PHI369 live prototype"),
        h("h1", null, "FocusBridge21"),
        h("p", { className: "subtitle" }, "A browser-based threshold-training cockpit for readiness, original Web Audio binaural practice, RETURN NOW grounding, and local Signal Ledger receipts."),
        h("div", { className: "top-actions" },
          h("a", { className: "link-button primary", href: "https://github.com/MichaelWave369/focusbridge21" }, "GitHub repo"),
          h("a", { className: "link-button", href: "FocusBridge21_Master_Spec_v0.2.md" }, "Master spec"),
          h("a", { className: "link-button", href: "../" }, "Pages root")
        )
      ),
      h("main", { className: "wrap" },
        h("section", { className: "notice" }, h("strong", null, "Safety first: "), "This is a meditative training prototype, not medical care, therapy, a guaranteed Focus 21 switch, or an OBE guarantee. Do not use while driving or operating machinery. Start short, keep volume low, and use RETURN NOW whenever needed."),
        h("div", { className: "tabs" },
          [["build", "1 Build"], ["cockpit", "2 Cockpit"], ["journal", "3 Journal"], ["ledger", "4 Ledger"], ["protocol", "8-Week Protocol"]].map(([id, label]) => h("button", { key: id, className: `tab ${tab === id ? "active" : ""}`, onClick: () => setTab(id) }, label))
        ),
        tab === "build" && h("section", { className: "app-grid" },
          h("div", { className: "panel" },
            h("h2", null, "Readiness Gate"),
            h("p", { className: "muted" }, "A conservative pre-session check. This does not diagnose anything; it helps choose a safer practice intensity."),
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
            h("button", { className: "button primary", onClick: calcReadiness }, "Calculate Readiness Gate"),
            readiness && h("div", { className: "score-box" }, h("div", { className: `score-number ${scoreClass}` }, readiness.score), h("div", null, h("strong", null, readiness.level), h("div", { className: "muted" }, readiness.recommendation), h("div", { className: "soft small" }, `Suggested: ${readiness.suggestedPreset}, ${readiness.suggestedDuration} min`)))
          ),
          h("div", { className: "panel" },
            h("h2", null, "Session Builder"),
            h("div", { className: "field" }, h("label", null, "Preset"), h("select", { value: presetName, onChange: e => setPresetName(e.target.value) }, Object.keys(PRESETS).map(name => h("option", { key: name, value: name }, name)))) ,
            h("p", { className: "muted" }, preset.desc),
            h("div", { className: "form-grid" },
              h("div", { className: "field" }, h("label", null, "Duration"), h("select", { value: durationMin, onChange: e => setDurationMin(Number(e.target.value)) }, [15, 25, 35, 45].map(d => h("option", { key: d, value: d }, `${d} minutes`)))),
              h("div", { className: "field" }, h("label", null, "Guidance mode"), h("select", { value: guidanceMode, onChange: e => setGuidanceMode(e.target.value) }, ["Neutral", "Resonance Architect"].map(v => h("option", { key: v, value: v }, v)))),
              h("div", { className: "field" }, h("label", null, `Carrier/base Hz: ${base}`), h("input", { type: "range", min: 120, max: 440, step: 5, value: base, onChange: e => setBase(Number(e.target.value)) })),
              h("div", { className: "field" }, h("label", null, "Noise"), h("select", { value: noise, onChange: e => setNoise(e.target.value) }, ["none", "pink", "brown", "white"].map(v => h("option", { key: v, value: v }, v)))),
              h("div", { className: "field" }, h("label", null, `Noise amount: ${noiseAmount}`), h("input", { type: "range", min: 0, max: 0.25, step: 0.01, value: noiseAmount, onChange: e => setNoiseAmount(Number(e.target.value)) })),
              h("div", { className: "field" }, h("label", null, `Master volume: ${volume}`), h("input", { type: "range", min: 0.02, max: 0.5, step: 0.01, value: volume, onChange: e => setVolume(Number(e.target.value)) }))
            ),
            h("div", { className: "top-actions" }, h("button", { className: "button primary", onClick: startSession }, "Start Live Web Audio Session"), h("button", { className: "button ghost", onClick: () => setTab("cockpit") }, "Open cockpit"))
          )
        ),
        tab === "cockpit" && h("section", { className: "app-grid" },
          h("div", { className: "panel portal-panel" }, h("div", { className: "portal" }, [1,2,3,4,5].map(i => h("div", { key: i, className: `ring r${i}` })), h("div", { className: "core" }, `${presetName.toUpperCase()}\nGATE ${preset.gate}\n${running ? "LIVE" : "READY"}`))),
          h("div", { className: "panel" },
            h("h2", null, "Live Cockpit"),
            h("div", { className: "timer" }, fmtTime(Math.max(0, durationSec - elapsed))),
            h("p", { className: "muted" }, `${phase.name}: ${phase.cue}`),
            h("div", { className: "phase-pills" }, PHASES.map(p => h("span", { key: p.name, className: `phase-pill ${p.name === phase.name ? "active" : ""}` }, p.name))),
            h("div", { className: "top-actions" }, h("button", { className: "button primary", onClick: startSession }, running ? "Restart" : "Start"), h("button", { className: "button", onClick: () => stopSession(false) }, "Stop"), h("button", { className: "button danger", onClick: () => stopSession(true) }, "RETURN NOW")),
            returnMode && h("div", { className: "return-box" }, h("h3", null, "RETURN NOW active"), h("ol", null, ["Stop audio and open your eyes.", "Feel feet, hands, breath, and room.", "Name three things you see.", "Name three things you hear.", "Name three things you feel.", "Drink water. Move gently. Journal after grounded."].map(x => h("li", { key: x }, x)))),
            h("h3", null, "Guidance"),
            h("ul", null, GUIDANCE[guidanceMode][phase.name].map(x => h("li", { key: x }, x)))
          )
        ),
        tab === "journal" && h("section", { className: "panel" },
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
          h("button", { className: "button primary", onClick: writeReceipt }, "Write Local Browser Receipt")
        ),
        tab === "ledger" && h("section", { className: "panel" },
          h("h2", null, "Signal Ledger"),
          h("p", { className: "muted" }, `Local browser receipts: ${ledger.length}. This data lives in localStorage on this device/browser unless exported.`),
          h("div", { className: "top-actions" }, h("button", { className: "button", onClick: exportJson, disabled: !ledger.length }, "Export JSON"), h("button", { className: "button", onClick: exportCsv, disabled: !ledger.length }, "Export CSV"), h("button", { className: "button danger", onClick: clearLedger, disabled: !ledger.length }, "Clear local ledger")),
          ledger.length === 0 ? h("p", { className: "soft" }, "No receipts yet.") : h("div", { className: "ledger-table-wrap" }, h("table", null, h("thead", null, h("tr", null, ["Time", "Preset", "Gate", "Ready", "Depth", "Witness", "Fear", "Return", "Coherence", "Notes"].map(x => h("th", { key: x }, x)))), h("tbody", null, ledger.map(r => h("tr", { key: r.session_id }, h("td", null, new Date(r.timestamp).toLocaleString()), h("td", null, r.preset), h("td", null, r.target_gate), h("td", null, r.readiness?.score ?? ""), h("td", null, r.during?.perceived_depth), h("td", null, r.during?.stable_witness_presence), h("td", null, r.during?.fear_or_resistance), h("td", null, r.post?.return_quality), h("td", null, r.post?.overall_coherence), h("td", null, r.notes || ""))))))
        ),
        tab === "protocol" && h("section", { className: "panel" },
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
      h("footer", { className: "wrap" }, "FocusBridge21 React v0.1 — browser-local, MIT licensed, safety-first, receipt-driven.")
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(h(App));
})();
