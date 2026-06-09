(() => {
  const { useEffect, useMemo, useRef, useState } = React;
  const h = React.createElement;

  const VERSION = "React Pages v0.3.1 Smooth Flow";
  const LS_KEY = "focusbridge21-ledger-v1";
  const PREF_KEY = "focusbridge21-preferences-v031";
  const DOC_PREFIX = window.location.pathname.includes("/docs") ? "" : "docs/";

  const PRESETS = {
    Foundation: { gate: 10, base: 180, start: 8, mid: 5.5, end: 9.5, noise: "pink", desc: "Body-asleep training: relaxation, breath, safety, clean return.", intention: "Relax the body, stay gently awake, and return cleanly.", coach: "Body heavy. Mind gently awake. Nothing to chase." },
    Expansion: { gate: 12, base: 200, start: 7, mid: 5, end: 9, noise: "pink", desc: "Expanded awareness: spatial widening, observer mode, calm perception.", intention: "Widen awareness while staying calm, grounded, and observant.", coach: "Awareness widens while the witness stays soft and steady." },
    "No-Time": { gate: 15, base: 210, start: 6.5, mid: 4.2, end: 8.5, noise: "brown", desc: "Time-release practice: spaciousness, memory anchors, stable witness.", intention: "Rest in spaciousness while keeping a stable witness and clear return.", coach: "Let clock pressure dissolve. Keep one clean return anchor." },
    Bridge: { gate: 21, base: 220, start: 6.2, mid: 4.6, end: 9, noise: "pink", desc: "Threshold practice: stable witness, non-grasping exploration, reliable return.", intention: "Stable witness at the threshold, no forcing, clean return, honest receipt.", coach: "No forcing. Stable witness. Clean return. Honest receipt." }
  };

  const QUICK_RUNS = [
    { title: "2-min demo", preset: "Foundation", duration: 2, mode: "Neutral", note: "Fast smoke test for the live app." },
    { title: "Gentle reset", preset: "Foundation", duration: 5, mode: "Neutral", note: "Low intensity body + breath reset." },
    { title: "Bridge preview", preset: "Bridge", duration: 5, mode: "Resonance Architect", note: "Short threshold-flavored preview." },
    { title: "Training session", preset: "Expansion", duration: 15, mode: "Neutral", note: "Smooth practice run for real data." }
  ];

  const PHASES = [
    { name: "Prepare", ratio: .12, cue: "Safety, intention, breath, headphones, return anchor.", coach: "Settle. Lower volume. Return is always available." },
    { name: "Relax", ratio: .25, cue: "Body-asleep stability and physical softening.", coach: "Body heavy. Mind gently awake." },
    { name: "Expand", ratio: .23, cue: "Spatial widening and observer mode.", coach: "Awareness widens without leaving safety." },
    { name: "Threshold", ratio: .25, cue: "Stable witness at the bridge without forcing.", coach: "No chasing. Stable witness only." },
    { name: "Return", ratio: .15, cue: "Clean return, orientation, integration.", coach: "Return to breath, room, hands, and feet." }
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

  const fmt = s => `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, "0")}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, "0")}`;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const jread = (k, f) => { try { return JSON.parse(localStorage.getItem(k) || ""); } catch { return f; } };
  const jwrite = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const todayKey = (d = new Date()) => d.toISOString().slice(0, 10);

  function scoreReadiness(pre) {
    let score = pre.mood * 2 + pre.sleep * 2.2 + (11 - pre.stress) * 2.4 + pre.grounded * 2.2;
    if (pre.safe) score += 10;
    if (pre.headphones) score += 8;
    if (pre.ack) score += 10;
    if (pre.destabilized) score -= 25;
    if (pre.sleep <= 3) score -= 12;
    if (pre.stress >= 8) score -= 12;
    if (pre.grounded <= 3) score -= 10;
    score = clamp(Math.round(score), 0, 100);
    let out = { score, level: "Red", preset: "Foundation", duration: 5, mode: "Neutral", text: "Readiness is low. Prefer rest, grounding, breath, or a short Foundation session." };
    if (pre.destabilized || !pre.safe || !pre.ack) return { ...out, duration: 2, text: "Do not do threshold work right now. Choose grounding or very short Foundation only." };
    if (score >= 82) return { score, level: "Green", preset: "Bridge", duration: 15, mode: "Resonance Architect", text: "Strong readiness. Bridge Preview or a short Bridge session is reasonable. Keep RETURN NOW visible." };
    if (score >= 70) return { score, level: "Green", preset: "Expansion", duration: 15, mode: "Neutral", text: "Good readiness. Expansion or Bridge Preview can work; stay conservative." };
    if (score >= 50) return { score, level: "Yellow", preset: "Foundation", duration: 5, mode: "Neutral", text: "Use a gentle session. Prefer Foundation or Expansion. Avoid pushing threshold work today." };
    return out;
  }

  function phaseFor(elapsed, duration) {
    let c = 0;
    for (const p of PHASES) {
      const len = duration * p.ratio;
      if (elapsed <= c + len) return { ...p, start: c, end: c + len };
      c += len;
    }
    const p = PHASES[PHASES.length - 1];
    return { ...p, start: duration - duration * p.ratio, end: duration };
  }

  function noiseBuffer(ctx, kind) {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let brown = 0, pink = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === "brown") { brown = (brown + w * .02) / 1.02; d[i] = brown * 3.5; }
      else if (kind === "pink") { pink = .985 * pink + .015 * w; d[i] = pink * 4; }
      else d[i] = w * .7;
    }
    return buf;
  }

  function scheduleAudio(ctx, preset, cfg, seconds, refs) {
    const t = ctx.currentTime;
    const merger = ctx.createChannelMerger(2);
    const left = ctx.createOscillator(), right = ctx.createOscillator();
    const lg = ctx.createGain(), rg = ctx.createGain(), master = ctx.createGain();
    left.type = right.type = "sine";
    left.frequency.setValueAtTime(cfg.base, t);
    right.frequency.setValueAtTime(cfg.base + preset.start, t);
    let c = t;
    PHASES.forEach(p => {
      const len = seconds * p.ratio;
      const now = p.name === "Prepare" ? preset.start : p.name === "Return" ? preset.mid + .8 : preset.mid;
      const next = p.name === "Relax" ? preset.mid + .4 : p.name === "Return" ? preset.end : preset.mid;
      right.frequency.setValueAtTime(cfg.base + now, c);
      right.frequency.linearRampToValueAtTime(cfg.base + next, c + len);
      c += len;
    });
    lg.gain.value = rg.gain.value = .48;
    master.gain.setValueAtTime(.0001, t);
    master.gain.exponentialRampToValueAtTime(Math.max(.001, cfg.volume), t + 3.5);
    master.gain.setValueAtTime(Math.max(.001, cfg.volume), t + Math.max(4, seconds - 5));
    master.gain.exponentialRampToValueAtTime(.0001, t + seconds);
    left.connect(lg).connect(merger, 0, 0);
    right.connect(rg).connect(merger, 0, 1);
    merger.connect(master).connect(ctx.destination);
    left.start(t); right.start(t + .02); left.stop(t + seconds + .25); right.stop(t + seconds + .25);
    refs.nodes.push(left, right, lg, rg, merger, master);
    if (cfg.noise !== "none" && cfg.noiseAmount > 0) {
      const src = ctx.createBufferSource(), ng = ctx.createGain();
      src.buffer = noiseBuffer(ctx, cfg.noise); src.loop = true;
      ng.gain.setValueAtTime(.0001, t);
      ng.gain.exponentialRampToValueAtTime(Math.max(.001, cfg.noiseAmount), t + 4);
      ng.gain.setValueAtTime(Math.max(.001, cfg.noiseAmount), t + Math.max(4, seconds - 5));
      ng.gain.exponentialRampToValueAtTime(.0001, t + seconds);
      src.connect(ng).connect(ctx.destination); src.start(t); src.stop(t + seconds + .25);
      refs.nodes.push(src, ng);
    }
  }

  async function stereoTest() {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC(); await ctx.resume();
    const t = ctx.currentTime, merger = ctx.createChannelMerger(2), l = ctx.createOscillator(), r = ctx.createOscillator(), lg = ctx.createGain(), rg = ctx.createGain(), m = ctx.createGain();
    l.frequency.value = 440; r.frequency.value = 660; m.gain.value = .28;
    lg.gain.setValueAtTime(.22, t); lg.gain.setValueAtTime(.22, t + .8); lg.gain.linearRampToValueAtTime(.0001, t + 1);
    rg.gain.setValueAtTime(.0001, t); rg.gain.setValueAtTime(.0001, t + 1); rg.gain.linearRampToValueAtTime(.22, t + 1.12); rg.gain.setValueAtTime(.22, t + 1.8); rg.gain.linearRampToValueAtTime(.0001, t + 2);
    l.connect(lg).connect(merger, 0, 0); r.connect(rg).connect(merger, 0, 1); merger.connect(m).connect(ctx.destination);
    l.start(t); r.start(t); l.stop(t + 2.1); r.stop(t + 2.1); setTimeout(() => ctx.close(), 2300);
  }

  function tracker(ledger) {
    const dates = new Set(ledger.map(x => (x.timestamp || "").slice(0, 10)).filter(Boolean));
    let streak = 0, d = new Date();
    while (dates.has(todayKey(d))) { streak++; d.setDate(d.getDate() - 1); }
    const week = clamp(Math.floor(ledger.length / 4) + 1, 1, 8);
    const focus = week <= 2 ? "Body-Asleep" : week <= 4 ? "Expansion" : week <= 6 ? "Time-Release" : "Bridge";
    const next = week <= 2 ? "Foundation 5–15" : week <= 4 ? "Expansion 15" : week <= 6 ? "No-Time 15–25" : "Bridge 5–15";
    return { streak, week, focus, next, sessions: ledger.length };
  }

  function insights(ledger) {
    if (!ledger.length) return ["No receipts yet. Run a 2-minute demo or gentle reset, then write the first receipt."];
    const list = [];
    const best = [...ledger].sort((a, b) => (b.post?.overall_coherence || 0) - (a.post?.overall_coherence || 0))[0];
    if (best) list.push(`Best coherence so far: ${best.preset}, ${best.duration_min} min, readiness ${best.readiness?.score ?? "—"}.`);
    const good = ledger.filter(r => (r.post?.return_quality || 0) >= 8);
    if (good.length) {
      const counts = good.reduce((a, r) => (a[r.preset] = (a[r.preset] || 0) + 1, a), {});
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (top) list.push(`Cleanest returns currently cluster around ${top[0]} sessions.`);
    }
    if (ledger.some(r => (r.during?.fear_or_resistance || 0) >= 7)) list.push("High fear/resistance appeared in a receipt. Prefer Foundation and shorter sessions until return feels easy again.");
    if (ledger.length < 3) list.push("Add 2–3 more receipts before trusting pattern suggestions.");
    return list;
  }

  function Range({ label, value, onChange, min = 1, max = 10, step = 1 }) {
    return h("div", { className: "field" }, h("label", null, `${label}: ${value}`), h("input", { type: "range", min, max, step, value, onChange: e => onChange(Number(e.target.value)) }));
  }
  function Stat({ label, value, note }) { return h("div", { className: "stat-card" }, h("div", { className: "stat-value" }, value), h("div", { className: "stat-label" }, label), note && h("div", { className: "soft small" }, note)); }
  function Button({ children, cls = "button", ...props }) { return h("button", { className: cls, ...props }, children); }

  function App() {
    const prefs = jread(PREF_KEY, {}) || {};
    const [step, setStep] = useState(prefs.step || "build");
    const [presetName, setPresetName] = useState(prefs.presetName || "Bridge");
    const [durationMin, setDurationMin] = useState(prefs.durationMin || 5);
    const [guidanceMode, setGuidanceMode] = useState(prefs.guidanceMode || "Neutral");
    const [base, setBase] = useState(prefs.base || PRESETS[prefs.presetName || "Bridge"].base);
    const [noise, setNoise] = useState(prefs.noise || "pink");
    const [noiseAmount, setNoiseAmount] = useState(prefs.noiseAmount ?? .04);
    const [volume, setVolume] = useState(prefs.volume ?? .16);
    const [pre, setPre] = useState(prefs.pre || { mood: 7, sleep: 7, stress: 3, grounded: 7, safe: true, headphones: true, ack: false, destabilized: false, intention: PRESETS.Bridge.intention });
    const [ready, setReady] = useState(null);
    const [running, setRunning] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [returnTimer, setReturnTimer] = useState(60);
    const [grounded, setGrounded] = useState(false);
    const [ledger, setLedger] = useState(jread(LS_KEY, []) || []);
    const [toast, setToast] = useState("Ready. Smooth Flow guides readiness → recommendation → cockpit → return → journal → ledger.");
    const [metrics, setMetrics] = useState({ depth: 5, relaxation: 5, witness: 5, imagery: 5, time: 5, clarity: 5, fear: 1, returnQuality: 7, memory: 5, grounding: 7, coherence: 6, notes: "", fragments: "" });

    const audio = useRef({ ctx: null, nodes: [] });
    const startStamp = useRef(null);
    const preset = PRESETS[presetName];
    const durSec = durationMin * 60;
    const phase = useMemo(() => phaseFor(elapsed, durSec), [elapsed, durSec]);
    const prog = durSec ? clamp((elapsed / durSec) * 100, 0, 100) : 0;
    const phaseProg = phase.end > phase.start ? clamp(((elapsed - phase.start) / (phase.end - phase.start)) * 100, 0, 100) : 0;
    const track = useMemo(() => tracker(ledger), [ledger]);
    const hints = useMemo(() => insights(ledger), [ledger]);

    useEffect(() => { jwrite(PREF_KEY, { step, presetName, durationMin, guidanceMode, base, noise, noiseAmount, volume, pre }); }, [step, presetName, durationMin, guidanceMode, base, noise, noiseAmount, volume, pre]);
    useEffect(() => {
      if (!running) return;
      const id = setInterval(() => {
        const n = Math.min(durSec, Math.floor((Date.now() - startStamp.current) / 1000));
        setElapsed(n);
        if (n >= durSec) finishSession();
      }, 300);
      return () => clearInterval(id);
    }, [running, durSec]);
    useEffect(() => {
      if (step !== "return" || grounded || returnTimer <= 0) return;
      const id = setInterval(() => setReturnTimer(t => Math.max(0, t - 1)), 1000);
      return () => clearInterval(id);
    }, [step, grounded, returnTimer]);

    function presetClean(name) { setPresetName(name); setBase(PRESETS[name].base); setNoise(PRESETS[name].noise); setPre({ ...pre, intention: PRESETS[name].intention }); }
    function applyQuick(q) { stop(false); setPresetName(q.preset); setDurationMin(q.duration); setGuidanceMode(q.mode); setBase(PRESETS[q.preset].base); setNoise(PRESETS[q.preset].noise); setPre({ ...pre, intention: PRESETS[q.preset].intention }); setStep("build"); setToast(`${q.title} loaded. Calculate readiness, then continue.`); }
    function calc(go = true) { const r = scoreReadiness(pre); setReady(r); setToast(`Readiness ${r.score}/100: ${r.level}. ${r.text}`); if (go) setStep("recommend"); return r; }
    function loadRec() { const r = ready || calc(false); setPresetName(r.preset); setDurationMin(r.duration); setGuidanceMode(r.mode); setBase(PRESETS[r.preset].base); setNoise(PRESETS[r.preset].noise); setPre({ ...pre, intention: PRESETS[r.preset].intention }); setToast(`${r.preset} ${r.duration}-minute recommendation loaded. Press Start when ready.`); }

    function stopAudio() {
      const refs = audio.current;
      try { refs.nodes.forEach(n => { try { n.stop && n.stop(0); } catch {} try { n.disconnect && n.disconnect(); } catch {} }); } catch {}
      try { refs.ctx && refs.ctx.state !== "closed" && refs.ctx.close(); } catch {}
      audio.current = { ctx: null, nodes: [] };
    }
    function stop(toReturn = false) { stopAudio(); setRunning(false); if (toReturn) { setReturnTimer(60); setGrounded(false); setStep("return"); setToast("RETURN NOW active. Ground first, journal after stable."); } }
    function finishSession() { stopAudio(); setRunning(false); setReturnTimer(60); setGrounded(false); setStep("return"); setToast("Session complete. Auto-return started. Ground first, then journal."); }

    async function start() {
      if (!pre.ack) { setStep("build"); setToast("Safety acknowledgement required before audio starts."); return; }
      if (!ready) setReady(scoreReadiness(pre));
      stopAudio();
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { setToast("This browser does not support Web Audio."); return; }
      try {
        const ctx = new AC(); await ctx.resume();
        const refs = { ctx, nodes: [] }; audio.current = refs;
        scheduleAudio(ctx, preset, { base, volume, noise, noiseAmount }, durSec, refs);
        startStamp.current = Date.now(); setElapsed(0); setReturnTimer(60); setGrounded(false); setRunning(true); setStep("cockpit"); setToast(`${presetName} session started. RETURN NOW is always available.`);
      } catch (e) { setToast(`Audio start failed: ${e.message || e}`); }
    }

    function saveReceipt() {
      const receipt = { session_id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), timestamp: new Date().toISOString(), app: VERSION, preset: presetName, target_gate: preset.gate, duration_min: durationMin, actual_elapsed_sec: elapsed, guidance_mode: guidanceMode, readiness: ready || scoreReadiness(pre), pre, audio_params: { engine: "browser_web_audio_binaural_v0.3.1", base_hz: base, beat_start_hz: preset.start, beat_mid_hz: preset.mid, beat_end_hz: preset.end, noise, noise_amount: noiseAmount, master_volume: volume }, during: { perceived_depth: metrics.depth, body_relaxation: metrics.relaxation, stable_witness_presence: metrics.witness, imagery_vividness: metrics.imagery, time_distortion: metrics.time, mental_clarity: metrics.clarity, fear_or_resistance: metrics.fear }, post: { return_quality: metrics.returnQuality, memory_retention: metrics.memory, grounding_feeling: metrics.grounding, overall_coherence: metrics.coherence }, notes: metrics.notes, dreamlike_fragments: metrics.fragments, claim_boundary: "subjective self-report; local training receipt; no medical or objective-state claim" };
      const next = [receipt, ...ledger]; setLedger(next); jwrite(LS_KEY, next); setMetrics({ ...metrics, notes: "", fragments: "" }); setStep("ledger"); setToast("Receipt saved locally. Ledger insights updated.");
    }

    function download(blob, filename) { const u = URL.createObjectURL(blob), a = document.createElement("a"); a.href = u; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u); }
    function exportJson() { download(new Blob([JSON.stringify(ledger, null, 2)], { type: "application/json" }), `focusbridge21-ledger-${Date.now()}.json`); }
    function exportCsv() { const head = ["timestamp","preset","gate","duration","readiness","depth","relaxation","witness","fear","return","coherence","notes"]; const rows = ledger.map(r => [r.timestamp,r.preset,r.target_gate,r.duration_min,r.readiness?.score ?? "",r.during?.perceived_depth ?? "",r.during?.body_relaxation ?? "",r.during?.stable_witness_presence ?? "",r.during?.fear_or_resistance ?? "",r.post?.return_quality ?? "",r.post?.overall_coherence ?? "",r.notes || ""]); const csv = [head, ...rows].map(row => row.map(v => `"${String(v ?? "").replaceAll('"','""')}"`).join(",")).join("\n"); download(new Blob([csv], { type: "text/csv" }), `focusbridge21-ledger-${Date.now()}.csv`); }
    async function test() { try { await stereoTest(); setToast("Stereo test played: left tone then right tone."); } catch(e) { setToast(`Stereo test failed: ${e.message || e}`); } }

    const avg = k => { const vals = ledger.map(r => k.split(".").reduce((o, p) => o?.[p], r)).filter(v => typeof v === "number"); return vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1) : "—"; };
    const best = [...ledger].sort((a,b)=>(b.post?.overall_coherence||0)-(a.post?.overall_coherence||0))[0];
    const scoreClass = ready ? (ready.level === "Green" ? "score-green" : ready.level === "Yellow" ? "score-yellow" : "score-red") : "";
    const canJournal = grounded || returnTimer <= 0;

    const flow = [["build","Readiness"],["recommend","Recommend"],["cockpit","Cockpit"],["return","Return"],["journal","Journal"],["ledger","Ledger"],["protocol","Protocol"]];

    return h(React.Fragment, null,
      h("header", { className: "hero wrap" },
        h("div", { className: "eyebrow" }, "Parallax / PHI369 live prototype"), h("h1", null, "FocusBridge21"),
        h("p", { className: "subtitle" }, "Smooth Flow guides the whole practice: readiness → recommendation → cockpit → auto-return → journal → ledger."),
        h("div", { className: "hero-kpis" }, h("span", null, "Local-first"), h("span", null, "Web Audio"), h("span", null, "No cloud ledger"), h("span", null, VERSION)),
        h("div", { className: "top-actions" }, h("a", { className: "link-button primary", href: "https://github.com/MichaelWave369/focusbridge21" }, "GitHub repo"), h("a", { className: "link-button", href: `${DOC_PREFIX}FocusBridge21_Master_Spec_v0.2.md` }, "Master spec"), h(Button, { onClick: test }, "Stereo test"))
      ),
      h("main", { className: "wrap" },
        h("section", { className: "notice smooth-notice" }, h("strong", null, "Safety first: "), "This is a meditative training prototype, not medical care, therapy, a guaranteed Focus 21 switch, or an OBE guarantee. Do not use while driving or operating machinery. Start short, keep volume low, and use RETURN NOW whenever needed."),
        h("div", { className: "toast" }, toast),
        h("div", { className: "flow-stepper" }, flow.map(([id,label],i) => h("button", { key:id, className:`flow-step ${step===id?"active":""}`, onClick:()=>setStep(id) }, h("span", null, i+1), label))),

        step === "build" && h("section", null,
          h("div", { className:"quick-grid" }, QUICK_RUNS.map(q => h("button", { key:q.title, className:"quick-card", onClick:()=>applyQuick(q) }, h("strong", null, q.title), h("span", null, `${q.preset} • ${q.duration} min`), h("em", null, q.note)))),
          h("section", { className:"app-grid" },
            h("div", { className:"panel" }, h("h2", null, "Readiness Gate"), h("p", { className:"muted" }, "A conservative pre-session check. It helps choose safer intensity; it does not diagnose anything."), h("div", { className:"form-grid" },
              h(Range, { label:"Mood / steadiness", value:pre.mood, onChange:mood=>setPre({...pre,mood}) }), h(Range, { label:"Sleep quality", value:pre.sleep, onChange:sleep=>setPre({...pre,sleep}) }), h(Range, { label:"Stress level", value:pre.stress, onChange:stress=>setPre({...pre,stress}) }), h(Range, { label:"Grounded in room/body", value:pre.grounded, onChange:grounded=>setPre({...pre,grounded}) })),
              h("label", { className:"checkline" }, h("input", { type:"checkbox", checked:pre.safe, onChange:e=>setPre({...pre,safe:e.target.checked}) }), "I am in a safe, quiet environment."),
              h("label", { className:"checkline" }, h("input", { type:"checkbox", checked:pre.headphones, onChange:e=>setPre({...pre,headphones:e.target.checked}) }), "Stereo headphones are working and volume is low."),
              h("label", { className:"checkline" }, h("input", { type:"checkbox", checked:pre.ack, onChange:e=>setPre({...pre,ack:e.target.checked}) }), "I understand the safety notes and will not use this in unsafe contexts."),
              h("label", { className:"checkline" }, h("input", { type:"checkbox", checked:pre.destabilized, onChange:e=>setPre({...pre,destabilized:e.target.checked}) }), "Recent destabilizing meditation or altered-state experience."),
              h("div", { className:"field" }, h("label", null, "Session intention"), h("textarea", { value:pre.intention, onChange:e=>setPre({...pre,intention:e.target.value}) })),
              h("div", { className:"top-actions left" }, h(Button, { cls:"button primary", onClick:()=>calc(true) }, "Calculate + Continue"), h(Button, { cls:"button ghost", onClick:test }, "Stereo test")),
              ready && h("div", { className:"score-box" }, h("div", { className:`score-number ${scoreClass}` }, ready.score), h("div", null, h("strong", null, ready.level), h("div", { className:"muted" }, ready.text), h("div", { className:"soft small" }, `Suggested: ${ready.preset}, ${ready.duration} min`)))) ,
            h("div", { className:"panel" }, h("h2", null, "Manual Session Builder"), h("div", { className:"field" }, h("label", null, "Preset"), h("select", { value:presetName, onChange:e=>presetClean(e.target.value) }, Object.keys(PRESETS).map(n=>h("option", { key:n, value:n }, n)))), h("p", { className:"muted" }, preset.desc), h("div", { className:"form-grid" },
              h("div", { className:"field" }, h("label", null, "Duration"), h("select", { value:durationMin, onChange:e=>setDurationMin(Number(e.target.value)) }, [2,5,15,25,35,45].map(d=>h("option", { key:d, value:d }, `${d} minutes`)))),
              h("div", { className:"field" }, h("label", null, "Guidance mode"), h("select", { value:guidanceMode, onChange:e=>setGuidanceMode(e.target.value) }, ["Neutral","Resonance Architect"].map(x=>h("option", { key:x, value:x }, x)))),
              h(Range, { label:"Carrier/base Hz", value:base, min:120, max:440, step:5, onChange:setBase }), h("div", { className:"field" }, h("label", null, "Noise"), h("select", { value:noise, onChange:e=>setNoise(e.target.value) }, ["none","pink","brown","white"].map(x=>h("option", { key:x, value:x }, x)))),
              h(Range, { label:"Noise amount", value:noiseAmount, min:0, max:.25, step:.01, onChange:setNoiseAmount }), h(Range, { label:"Master volume", value:volume, min:.02, max:.5, step:.01, onChange:setVolume })))
          )
        ),

        step === "recommend" && h("section", { className:"app-grid" }, h("div", { className:"panel recommendation-card" }, h("h2", null, "Recommended Session"), ready ? h(React.Fragment, null, h("div", { className:"score-box" }, h("div", { className:`score-number ${scoreClass}` }, ready.score), h("div", null, h("strong", null, `${ready.level} readiness`), h("div", { className:"muted" }, ready.text))), h("div", { className:"recommended-big" }, `${ready.preset} • ${ready.duration} min`), h("p", { className:"muted" }, PRESETS[ready.preset].desc), h("div", { className:"top-actions left" }, h(Button, { cls:"button primary big", onClick:loadRec }, "Load recommendation"), h(Button, { cls:"button", onClick:start }, "Start loaded session"), h(Button, { cls:"button ghost", onClick:()=>setStep("build") }, "Adjust manually"))) : h("p", { className:"muted" }, "Calculate readiness first.")), h("div", { className:"panel" }, h("h2", null, "Practice Tracker"), h("div", { className:"stat-grid two" }, h(Stat, { label:"Streak", value:track.streak, note:"days" }), h(Stat, { label:"Protocol week", value:track.week, note:track.focus }), h(Stat, { label:"Receipts", value:track.sessions }), h(Stat, { label:"Next practice", value:track.next })), h("h3", null, "Pattern hints"), h("ul", null, hints.map(x=>h("li", { key:x }, x))))),

        step === "cockpit" && h("section", { className:"app-grid" }, h("div", { className:"panel portal-panel" }, h("div", { className:"portal" }, [1,2,3,4,5].map(i=>h("div", { key:i, className:`ring r${i}` })), h("div", { className:"core" }, h("span", null, presetName.toUpperCase()), h("span", null, `GATE ${preset.gate}`), h("span", null, running ? "LIVE" : "READY"))), h("div", { className:"progress-wrap" }, h("div", { className:"progress-bar", style:{width:`${prog}%`} })), h("div", { className:"soft small" }, `Session progress ${Math.round(prog)}% • Phase progress ${Math.round(phaseProg)}%`)), h("div", { className:"panel sticky-return" }, h("h2", null, "Live Cockpit"), h("div", { className:"timer" }, fmt(Math.max(0, durSec-elapsed))), h("div", { className:"coach-card" }, h("div", { className:"coach-phase" }, phase.name), h("div", { className:"coach-line" }, phase.coach), h("div", { className:"soft small" }, preset.coach)), h("div", { className:"phase-pills" }, PHASES.map(p=>h("span", { key:p.name, className:`phase-pill ${p.name===phase.name?"active":""}` }, p.name))), h("div", { className:"top-actions left" }, h(Button, { cls:"button primary", onClick:start }, running ? "Restart" : "Start"), h(Button, { onClick:()=>stop(false) }, "Stop"), h(Button, { cls:"button danger", onClick:()=>stop(true) }, "RETURN NOW")), h("div", { className:"return-box" }, h("h3", null, "Return protocol ready"), h("ol", null, ["Stop audio and open your eyes.","Feel feet, hands, breath, and room.","Name three things you see.","Name three things you hear.","Name three things you feel.","Drink water. Move gently. Journal after grounded."].map(x=>h("li", { key:x }, x)))), h("h3", null, "Guidance"), h("ul", null, GUIDANCE[guidanceMode][phase.name].map(x=>h("li", { key:x }, x))))),

        step === "return" && h("section", { className:"return-screen panel" }, h("div", { className:"return-orb" }, fmt(returnTimer)), h("h2", null, "Auto-Return"), h("p", { className:"muted" }, "Audio is stopped. Take one full minute to orient before journaling."), h("div", { className:"return-grid" }, ["Open your eyes.","Feel your feet.","Feel your hands.","Name 3 things you see.","Name 3 things you hear.","Name 3 things you feel.","Drink water.","Move gently."].map(x=>h("div", { key:x, className:"return-step" }, x))), h("label", { className:"checkline center" }, h("input", { type:"checkbox", checked:grounded, onChange:e=>setGrounded(e.target.checked) }), "I feel grounded enough to journal."), h("div", { className:"top-actions" }, h(Button, { cls:"button primary big", disabled:!canJournal, onClick:()=>setStep("journal") }, canJournal ? "Continue to Journal" : "Journal unlocks after return"), h(Button, { cls:"button ghost", onClick:()=>setStep("build") }, "Back to Builder"))),

        step === "journal" && h("section", { className:"panel" }, h("h2", null, "Post-Session Journal Receipt"), h("p", { className:"muted" }, "Rate capacities, not fantasies. The Signal Ledger learns through honest receipts."), h("div", { className:"metric-grid" }, h(Range,{label:"Perceived depth",value:metrics.depth,onChange:depth=>setMetrics({...metrics,depth})}), h(Range,{label:"Body relaxation",value:metrics.relaxation,onChange:relaxation=>setMetrics({...metrics,relaxation})}), h(Range,{label:"Stable witness",value:metrics.witness,onChange:witness=>setMetrics({...metrics,witness})}), h(Range,{label:"Imagery vividness",value:metrics.imagery,onChange:imagery=>setMetrics({...metrics,imagery})}), h(Range,{label:"Time distortion",value:metrics.time,onChange:time=>setMetrics({...metrics,time})}), h(Range,{label:"Mental clarity",value:metrics.clarity,onChange:clarity=>setMetrics({...metrics,clarity})}), h(Range,{label:"Fear / resistance",value:metrics.fear,onChange:fear=>setMetrics({...metrics,fear})}), h(Range,{label:"Return quality",value:metrics.returnQuality,onChange:returnQuality=>setMetrics({...metrics,returnQuality})}), h(Range,{label:"Memory retention",value:metrics.memory,onChange:memory=>setMetrics({...metrics,memory})}), h(Range,{label:"Grounded after",value:metrics.grounding,onChange:grounding=>setMetrics({...metrics,grounding})}), h(Range,{label:"Overall coherence",value:metrics.coherence,onChange:coherence=>setMetrics({...metrics,coherence})})), h("div", { className:"field" }, h("label", null, "Notes"), h("textarea", { value:metrics.notes, onChange:e=>setMetrics({...metrics,notes:e.target.value}) })), h("div", { className:"field" }, h("label", null, "Dreamlike fragments / symbolic material"), h("textarea", { value:metrics.fragments, onChange:e=>setMetrics({...metrics,fragments:e.target.value}) })), h("div", { className:"top-actions left" }, h(Button, { cls:"button primary", onClick:saveReceipt }, "Write Local Browser Receipt"), h(Button, { cls:"button ghost", onClick:()=>setStep("build") }, "Back to builder"))),

        step === "ledger" && h("section", { className:"panel" }, h("h2", null, "Signal Ledger"), h("p", { className:"muted" }, `Local browser receipts: ${ledger.length}. This data lives in localStorage on this device/browser unless exported.`), h("div", { className:"stat-grid" }, h(Stat,{label:"Receipts",value:ledger.length}), h(Stat,{label:"Avg witness",value:avg("during.stable_witness_presence")}), h(Stat,{label:"Avg return",value:avg("post.return_quality")}), h(Stat,{label:"Avg coherence",value:avg("post.overall_coherence")})), h("div", { className:"notice" }, h("strong", null, "Pattern insights: "), h("ul", null, hints.map(x=>h("li", { key:x }, x)))), best && h("div", { className:"notice" }, h("strong", null, "Best coherence receipt: "), `${best.preset} • ${best.duration_min} min • readiness ${best.readiness?.score ?? "—"} • base ${best.audio_params?.base_hz ?? "—"} Hz • noise ${best.audio_params?.noise ?? "—"}`), h("div", { className:"top-actions left" }, h(Button,{disabled:!ledger.length,onClick:exportJson},"Export JSON"), h(Button,{disabled:!ledger.length,onClick:exportCsv},"Export CSV"), h(Button,{cls:"button danger",disabled:!ledger.length,onClick:()=>{ if(confirm("Clear local browser ledger?")){setLedger([]);jwrite(LS_KEY,[]);setToast("Local browser ledger cleared.");}}},"Clear local ledger"), h(Button,{cls:"button primary",onClick:()=>setStep("build")},"New session")), ledger.length===0 ? h("p", { className:"soft" }, "No receipts yet.") : h("div", { className:"ledger-table-wrap" }, h("table", null, h("thead", null, h("tr", null, ["Time","Preset","Gate","Ready","Depth","Witness","Fear","Return","Coherence","Notes"].map(x=>h("th", { key:x }, x)))), h("tbody", null, ledger.map(r=>h("tr", { key:r.session_id }, h("td", null, new Date(r.timestamp).toLocaleString()), h("td", null, r.preset), h("td", null, r.target_gate), h("td", null, r.readiness?.score ?? ""), h("td", null, r.during?.perceived_depth), h("td", null, r.during?.stable_witness_presence), h("td", null, r.during?.fear_or_resistance), h("td", null, r.post?.return_quality), h("td", null, r.post?.overall_coherence), h("td", null, r.notes || ""))))))),

        step === "protocol" && h("section", { className:"panel" }, h("h2", null, "8-Week Mastery Protocol"), h("div", { className:"protocol-grid" }, h("div", { className:"panel tight" }, h("h3", null, "Weeks 1–2"), h("p", null, "Body-asleep mastery. Metrics: body relaxation, return quality, grounding.")), h("div", { className:"panel tight" }, h("h3", null, "Weeks 3–4"), h("p", null, "Expanded awareness. Metrics: perceived depth, imagery, stable witness.")), h("div", { className:"panel tight" }, h("h3", null, "Weeks 5–6"), h("p", null, "Time-release. Metrics: time distortion, mental clarity, stable witness.")), h("div", { className:"panel tight" }, h("h3", null, "Weeks 7–8"), h("p", null, "Threshold / Bridge practice. Metrics: low fear, clean return, memory retention."))), h("p", { className:"mono" }, "The better question is not only: Did I reach Focus 21? It is: Which capacities were present, and how cleanly did I return?"))
      ),
      h("footer", { className:"wrap" }, "FocusBridge21 v0.3.1 — Smooth Flow, browser-local, MIT licensed, safety-first, receipt-driven.")
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(h(App));
})();
