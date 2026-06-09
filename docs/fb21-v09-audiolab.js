(() => {
  const VERSION = "v0.9 Audio Lab + Calibration Deck";
  const LEDGER_KEY = "focusbridge21-ledger-v1";
  const PREF_KEY = "focusbridge21-preferences-v2";
  const AUDIO_KEY = "focusbridge21-audio-lab-v09";

  const RECIPES = {
    "Soft Landing": {
      presetName: "Foundation", durationMin: 5, base: 174, noise: "pink", noiseAmount: 0.035, volume: 0.12,
      beat: "8.0 → 5.8 → 9.5 Hz", intensity: "Very Gentle", note: "Best for grounding, nervous-system downshift, or post-session return."
    },
    "Witness Builder": {
      presetName: "Expansion", durationMin: 15, base: 196, noise: "pink", noiseAmount: 0.045, volume: 0.15,
      beat: "7.0 → 5.0 → 9.0 Hz", intensity: "Standard", note: "Builds relaxed observation without pushing threshold work."
    },
    "Bridge Preview": {
      presetName: "Bridge", durationMin: 5, base: 220, noise: "pink", noiseAmount: 0.04, volume: 0.14,
      beat: "6.2 → 4.6 → 9.0 Hz", intensity: "Very Gentle", note: "Short threshold-flavored preview with clean return priority."
    },
    "Deep But Safe": {
      presetName: "No-Time", durationMin: 15, base: 210, noise: "brown", noiseAmount: 0.05, volume: 0.16,
      beat: "6.5 → 4.2 → 8.5 Hz", intensity: "Standard", note: "Spacious practice for experienced, grounded sessions only."
    },
    "Noise Only Return": {
      presetName: "Foundation", durationMin: 5, base: 180, noise: "brown", noiseAmount: 0.075, volume: 0.10,
      beat: "minimal / grounding", intensity: "Very Gentle", note: "Use as a return-oriented comfort bed when beat work feels like too much."
    }
  };

  const TONE_CHECKS = {
    "Left / Right Stereo": { mode: "stereo" },
    "Soft Carrier": { mode: "tone", hz: 174 },
    "Mid Carrier": { mode: "tone", hz: 220 },
    "Low Ground Tone": { mode: "tone", hz: 110 },
    "Pink Noise Bed": { mode: "noise", noise: "pink" },
    "Brown Noise Bed": { mode: "noise", noise: "brown" },
    "Return Chime": { mode: "chime" }
  };

  let panel = null;
  let audioCtx = null;
  let activeNodes = [];
  let statusText = "Audio Lab ready. Keep volume low, start short, and prioritize clean return.";
  let state = readJson(AUDIO_KEY, {
    selectedRecipe: "Soft Landing",
    carrier: 174,
    noise: "pink",
    noiseAmount: 0.035,
    volume: 0.12,
    duration: 5,
    intensity: "Very Gentle",
    note: "Relax the body. Stay gently awake. Return clean."
  });

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || ""); }
    catch { return fallback; }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function ledger() {
    return readJson(LEDGER_KEY, []);
  }

  function prefs() {
    return readJson(PREF_KEY, {});
  }

  function savePrefs(next) {
    writeJson(PREF_KEY, { ...prefs(), ...next });
  }

  function setStatus(text) {
    statusText = text;
    const node = document.querySelector("[data-fb21-audio-status]");
    if (node) node.textContent = text;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function avg(values) {
    const clean = values.filter((v) => typeof v === "number" && !Number.isNaN(v));
    if (!clean.length) return null;
    return clean.reduce((a, b) => a + b, 0) / clean.length;
  }

  function analyze() {
    const rows = ledger();
    const recent = rows.slice(0, 7);
    const readiness = avg(recent.map((r) => r.readiness?.score));
    const fear = avg(recent.map((r) => r.during?.fear_or_resistance));
    const returnQ = avg(recent.map((r) => r.post?.return_quality));
    const coherence = avg(recent.map((r) => r.post?.overall_coherence));
    const best = [...rows].sort((a, b) => (b.post?.overall_coherence || 0) - (a.post?.overall_coherence || 0))[0];

    let recommended = "Soft Landing";
    let reason = "No local receipt pattern yet, so start with the gentlest calibration recipe.";
    if (rows.length >= 2) {
      if ((fear ?? 0) >= 5 || (returnQ ?? 10) < 6) {
        recommended = "Noise Only Return";
        reason = "Recent resistance or return quality suggests grounding first.";
      } else if ((coherence ?? 0) >= 7 && (returnQ ?? 0) >= 7 && (readiness ?? 0) >= 70) {
        recommended = "Bridge Preview";
        reason = "Recent receipts show good coherence and return quality; keep threshold work short.";
      } else if ((coherence ?? 0) >= 6) {
        recommended = "Witness Builder";
        reason = "Recent receipts suggest stable practice capacity without needing to push deeper.";
      }
    }
    return { rows, recent, readiness, fear, returnQ, coherence, best, recommended, reason };
  }

  function conditionClass(value, goodAtHigh = true) {
    if (value == null) return "warn";
    if (goodAtHigh) return value >= 7 ? "good" : value >= 5 ? "warn" : "hot";
    return value <= 3 ? "good" : value <= 5 ? "warn" : "hot";
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

  function stopAudio() {
    activeNodes.forEach((node) => {
      try { if (node.stop) node.stop(0); } catch (_) {}
      try { if (node.disconnect) node.disconnect(); } catch (_) {}
    });
    activeNodes = [];
    try { if (audioCtx && audioCtx.state !== "closed") audioCtx.close(); } catch (_) {}
    audioCtx = null;
    setStatus("Audio stopped. Re-orient to the room before continuing.");
  }

  async function ctx() {
    stopAudio();
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error("Web Audio is not supported in this browser.");
    audioCtx = new AudioContext();
    await audioCtx.resume();
    return audioCtx;
  }

  async function playToneCheck(name) {
    const check = TONE_CHECKS[name];
    if (!check) return;
    try {
      const c = await ctx();
      const now = c.currentTime;
      const master = c.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(Math.max(0.001, state.volume), now + 0.2);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
      master.connect(c.destination);
      activeNodes.push(master);

      if (check.mode === "stereo") {
        const merger = c.createChannelMerger(2);
        const l = c.createOscillator();
        const r = c.createOscillator();
        const lg = c.createGain();
        const rg = c.createGain();
        l.frequency.value = 440;
        r.frequency.value = 660;
        lg.gain.setValueAtTime(0.45, now);
        lg.gain.setValueAtTime(0.45, now + 1.0);
        lg.gain.linearRampToValueAtTime(0.0001, now + 1.15);
        rg.gain.setValueAtTime(0.0001, now);
        rg.gain.setValueAtTime(0.0001, now + 1.15);
        rg.gain.linearRampToValueAtTime(0.45, now + 1.25);
        rg.gain.setValueAtTime(0.45, now + 2.3);
        rg.gain.linearRampToValueAtTime(0.0001, now + 2.5);
        l.connect(lg).connect(merger, 0, 0);
        r.connect(rg).connect(merger, 0, 1);
        merger.connect(master);
        l.start(now); r.start(now); l.stop(now + 2.8); r.stop(now + 2.8);
        activeNodes.push(l, r, lg, rg, merger);
      } else if (check.mode === "noise") {
        const src = c.createBufferSource();
        src.buffer = makeNoiseBuffer(c, check.noise);
        src.loop = true;
        src.connect(master);
        src.start(now);
        src.stop(now + 2.8);
        activeNodes.push(src);
      } else if (check.mode === "chime") {
        [523.25, 659.25, 783.99].forEach((hz, i) => {
          const o = c.createOscillator();
          const g = c.createGain();
          o.type = "sine";
          o.frequency.value = hz;
          const t = now + i * 0.28;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.18, t + 0.04);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.72);
          o.connect(g).connect(master);
          o.start(t);
          o.stop(t + 0.8);
          activeNodes.push(o, g);
        });
      } else {
        const o = c.createOscillator();
        o.type = "sine";
        o.frequency.value = check.hz;
        o.connect(master);
        o.start(now);
        o.stop(now + 2.8);
        activeNodes.push(o);
      }
      setStatus(`Playing ${name}. Keep it comfortable and low.`);
      setTimeout(() => stopAudio(), 3100);
    } catch (err) {
      setStatus(`Audio check failed: ${err.message || err}`);
    }
  }

  async function playPreview() {
    try {
      const c = await ctx();
      const now = c.currentTime;
      const carrier = Number(state.carrier) || 174;
      const duration = 18;
      const master = c.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(Math.max(0.001, Number(state.volume) || 0.12), now + 2);
      master.gain.setValueAtTime(Math.max(0.001, Number(state.volume) || 0.12), now + duration - 3);
      master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      master.connect(c.destination);
      activeNodes.push(master);

      const merger = c.createChannelMerger(2);
      const l = c.createOscillator();
      const r = c.createOscillator();
      const lg = c.createGain();
      const rg = c.createGain();
      l.type = "sine";
      r.type = "sine";
      l.frequency.setValueAtTime(carrier, now);
      r.frequency.setValueAtTime(carrier + 7.0, now);
      r.frequency.linearRampToValueAtTime(carrier + 5.0, now + duration * 0.55);
      r.frequency.linearRampToValueAtTime(carrier + 8.5, now + duration);
      lg.gain.value = 0.48;
      rg.gain.value = 0.48;
      l.connect(lg).connect(merger, 0, 0);
      r.connect(rg).connect(merger, 0, 1);
      merger.connect(master);
      l.start(now); r.start(now + 0.02); l.stop(now + duration + 0.1); r.stop(now + duration + 0.1);
      activeNodes.push(l, r, lg, rg, merger);

      if (state.noise !== "none" && Number(state.noiseAmount) > 0) {
        const src = c.createBufferSource();
        const ng = c.createGain();
        src.buffer = makeNoiseBuffer(c, state.noise);
        src.loop = true;
        ng.gain.value = Number(state.noiseAmount) || 0.035;
        src.connect(ng).connect(c.destination);
        src.start(now); src.stop(now + duration + 0.1);
        activeNodes.push(src, ng);
      }
      setStatus("Playing 18-second calibration preview. Stop if anything feels sharp or uncomfortable.");
      setTimeout(() => stopAudio(), (duration + 0.5) * 1000);
    } catch (err) {
      setStatus(`Preview failed: ${err.message || err}`);
    }
  }

  function applyRecipe(name, reload = true) {
    const recipe = RECIPES[name];
    if (!recipe) return;
    state = {
      selectedRecipe: name,
      carrier: recipe.base,
      noise: recipe.noise,
      noiseAmount: recipe.noiseAmount,
      volume: recipe.volume,
      duration: recipe.durationMin,
      intensity: recipe.intensity,
      note: recipe.note
    };
    writeJson(AUDIO_KEY, state);
    savePrefs({
      presetName: recipe.presetName,
      durationMin: recipe.durationMin,
      base: recipe.base,
      noise: recipe.noise,
      noiseAmount: recipe.noiseAmount,
      volume: recipe.volume,
      pre: { ...prefs().pre, intention: recipe.note }
    });
    setStatus(`${name} applied to the main builder. ${reload ? "Reloading to sync controls." : ""}`);
    render();
    if (reload) setTimeout(() => location.reload(), 550);
  }

  function saveCurrent() {
    writeJson(AUDIO_KEY, state);
    savePrefs({ base: state.carrier, noise: state.noise, noiseAmount: state.noiseAmount, volume: state.volume, durationMin: state.duration });
    setStatus("Audio Lab settings saved to local browser preferences.");
  }

  function downloadRecipe() {
    const analysis = analyze();
    const recipe = {
      app: "FocusBridge21",
      version: VERSION,
      exported_at: new Date().toISOString(),
      selected_recipe: state.selectedRecipe,
      settings: state,
      local_pattern_summary: {
        receipts: analysis.rows.length,
        recent_readiness_avg: analysis.readiness,
        recent_return_avg: analysis.returnQ,
        recent_coherence_avg: analysis.coherence,
        recent_fear_avg: analysis.fear,
        recommendation: analysis.recommended,
        reason: analysis.reason
      },
      claim_boundary: "local subjective practice recipe; not medical guidance; not a guaranteed altered-state result"
    };
    const blob = new Blob([JSON.stringify(recipe, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `focusbridge21-audio-recipe-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus("Audio recipe JSON downloaded.");
  }

  function calibrationMarkdown() {
    const analysis = analyze();
    return `# FocusBridge21 Audio Calibration Notes\n\nGenerated: ${new Date().toLocaleString()}\nVersion: ${VERSION}\n\n## Current audio settings\n\n- Recipe: ${state.selectedRecipe}\n- Carrier/base Hz: ${state.carrier}\n- Noise: ${state.noise}\n- Noise amount: ${state.noiseAmount}\n- Volume: ${state.volume}\n- Duration: ${state.duration} min\n- Intensity: ${state.intensity}\n- Note: ${state.note}\n\n## Local pattern summary\n\n- Receipts: ${analysis.rows.length}\n- Recent readiness avg: ${analysis.readiness == null ? "—" : analysis.readiness.toFixed(1)}\n- Recent return avg: ${analysis.returnQ == null ? "—" : analysis.returnQ.toFixed(1)}\n- Recent coherence avg: ${analysis.coherence == null ? "—" : analysis.coherence.toFixed(1)}\n- Recent fear/resistance avg: ${analysis.fear == null ? "—" : analysis.fear.toFixed(1)}\n- Recommendation: ${analysis.recommended}\n- Reason: ${analysis.reason}\n\n## Boundaries\n\nThis is a subjective practice calibration receipt. It is not medical advice, diagnosis, therapy, or a guaranteed altered-state result.\n`;
  }

  async function copyCalibration() {
    try {
      await navigator.clipboard.writeText(calibrationMarkdown());
      setStatus("Calibration notes copied to clipboard.");
    } catch (_) {
      setStatus("Clipboard copy unavailable in this browser. Try downloading the recipe JSON instead.");
    }
  }

  function pill(label, value, cls = "") {
    return `<span class="fb21-audio-pill ${cls}">${label}: ${value}</span>`;
  }

  function render() {
    if (!panel) return;
    const a = analyze();
    const selected = RECIPES[state.selectedRecipe] || RECIPES["Soft Landing"];
    panel.innerHTML = `
      <div class="fb21-audio-head">
        <div>
          <div class="eyebrow">FocusBridge21 ${VERSION}</div>
          <h2>Audio Lab + Calibration Deck</h2>
          <p class="muted">Tune comfort before depth: stereo, carrier, noise, preview, and safer recipe handoff to the main builder.</p>
        </div>
        <button class="fb21-audio-x" data-close-audio aria-label="Close Audio Lab">×</button>
      </div>

      <div class="fb21-audio-pillrow">
        ${pill("Receipts", a.rows.length)}
        ${pill("Readiness", a.readiness == null ? "—" : a.readiness.toFixed(1), conditionClass((a.readiness || 0) / 10))}
        ${pill("Return", a.returnQ == null ? "—" : a.returnQ.toFixed(1), conditionClass(a.returnQ))}
        ${pill("Coherence", a.coherence == null ? "—" : a.coherence.toFixed(1), conditionClass(a.coherence))}
        ${pill("Resistance", a.fear == null ? "—" : a.fear.toFixed(1), conditionClass(a.fear, false))}
      </div>

      <div class="fb21-audio-grid">
        <section class="fb21-audio-section">
          <h3>Local recommendation</h3>
          <p class="muted"><strong>${a.recommended}</strong> — ${a.reason}</p>
          <div class="fb21-audio-actions">
            <button class="button primary" data-apply-recommended>Apply recommendation</button>
            <button class="button" data-preview>18-sec preview</button>
            <button class="button danger" data-stop-audio>Stop audio</button>
          </div>
        </section>

        <section class="fb21-audio-section">
          <h3>Comfort meter</h3>
          <p class="muted">Current mix intensity: <strong>${state.intensity}</strong></p>
          <div class="fb21-audio-meter"><span style="width:${state.intensity === "Deep" ? 82 : state.intensity === "Standard" ? 56 : 30}%"></span></div>
          <p class="soft small">Comfort rule: if the mix feels sharp, loud, pressured, or emotionally spicy, lower volume/noise or use Soft Landing.</p>
        </section>

        <section class="fb21-audio-section wide">
          <h3>Recipe library</h3>
          <div class="fb21-audio-recipe-list">
            ${Object.entries(RECIPES).map(([name, r]) => `
              <button class="fb21-audio-recipe" data-recipe="${name}">
                <strong>${name}</strong>
                <span>${r.presetName} • ${r.durationMin} min • ${r.base} Hz • ${r.noise} • ${r.intensity}</span>
                <span>${r.note}</span>
              </button>
            `).join("")}
          </div>
        </section>

        <section class="fb21-audio-section">
          <h3>Calibration controls</h3>
          <div class="fb21-audio-field">
            <label>Carrier/base Hz: <span data-carrier-value>${state.carrier}</span></label>
            <input data-carrier type="range" min="90" max="440" step="1" value="${state.carrier}">
          </div>
          <div class="fb21-audio-field">
            <label>Volume: <span data-volume-value>${state.volume}</span></label>
            <input data-volume type="range" min="0.02" max="0.35" step="0.01" value="${state.volume}">
          </div>
          <div class="fb21-audio-field">
            <label>Noise</label>
            <select data-noise>
              ${["none", "pink", "brown", "white"].map((n) => `<option value="${n}" ${state.noise === n ? "selected" : ""}>${n}</option>`).join("")}
            </select>
          </div>
          <div class="fb21-audio-field">
            <label>Noise amount: <span data-noise-amount-value>${state.noiseAmount}</span></label>
            <input data-noise-amount type="range" min="0" max="0.16" step="0.005" value="${state.noiseAmount}">
          </div>
          <div class="fb21-audio-field">
            <label>Duration</label>
            <select data-duration>
              ${[2, 5, 15, 25, 35, 45].map((d) => `<option value="${d}" ${Number(state.duration) === d ? "selected" : ""}>${d} minutes</option>`).join("")}
            </select>
          </div>
          <div class="fb21-audio-field">
            <label>Intensity</label>
            <select data-intensity>
              ${["Very Gentle", "Standard", "Deep"].map((d) => `<option value="${d}" ${state.intensity === d ? "selected" : ""}>${d}</option>`).join("")}
            </select>
          </div>
          <div class="fb21-audio-actions">
            <button class="button primary" data-save-audio>Save controls</button>
            <button class="button" data-preview>Preview mix</button>
          </div>
        </section>

        <section class="fb21-audio-section">
          <h3>Tone checks</h3>
          <p class="muted">Use these before a real session. Keep volume low. Stereo check should clearly move left then right.</p>
          <div class="fb21-audio-actions">
            ${Object.keys(TONE_CHECKS).map((name) => `<button class="button" data-tone="${name}">${name}</button>`).join("")}
          </div>
        </section>

        <section class="fb21-audio-section wide">
          <h3>Session note</h3>
          <div class="fb21-audio-field">
            <label>What this mix is for</label>
            <textarea data-note>${state.note || selected.note}</textarea>
          </div>
          <div class="fb21-audio-actions">
            <button class="button primary" data-apply-selected>Apply selected recipe to builder</button>
            <button class="button" data-copy-calibration>Copy calibration notes</button>
            <button class="button" data-download-recipe>Download recipe JSON</button>
          </div>
          <div class="fb21-audio-status" data-fb21-audio-status>${statusText}</div>
        </section>
      </div>
    `;
    bind();
  }

  function bind() {
    panel.querySelector("[data-close-audio]")?.addEventListener("click", closePanel);
    panel.querySelector("[data-apply-recommended]")?.addEventListener("click", () => applyRecipe(analyze().recommended));
    panel.querySelectorAll("[data-preview]").forEach((btn) => btn.addEventListener("click", playPreview));
    panel.querySelector("[data-stop-audio]")?.addEventListener("click", stopAudio);
    panel.querySelector("[data-save-audio]")?.addEventListener("click", saveCurrent);
    panel.querySelector("[data-apply-selected]")?.addEventListener("click", () => applyRecipe(state.selectedRecipe));
    panel.querySelector("[data-copy-calibration]")?.addEventListener("click", copyCalibration);
    panel.querySelector("[data-download-recipe]")?.addEventListener("click", downloadRecipe);
    panel.querySelectorAll("[data-tone]").forEach((btn) => btn.addEventListener("click", () => playToneCheck(btn.getAttribute("data-tone"))));
    panel.querySelectorAll("[data-recipe]").forEach((btn) => btn.addEventListener("click", () => {
      const name = btn.getAttribute("data-recipe");
      const r = RECIPES[name];
      state = { selectedRecipe: name, carrier: r.base, noise: r.noise, noiseAmount: r.noiseAmount, volume: r.volume, duration: r.durationMin, intensity: r.intensity, note: r.note };
      writeJson(AUDIO_KEY, state);
      setStatus(`${name} loaded in Audio Lab. Preview or apply it to the main builder.`);
      render();
    }));

    const update = (key, value) => {
      state = { ...state, [key]: value };
      writeJson(AUDIO_KEY, state);
    };
    const carrier = panel.querySelector("[data-carrier]");
    const carrierValue = panel.querySelector("[data-carrier-value]");
    carrier?.addEventListener("input", (e) => { update("carrier", Number(e.target.value)); if (carrierValue) carrierValue.textContent = e.target.value; });
    const volume = panel.querySelector("[data-volume]");
    const volumeValue = panel.querySelector("[data-volume-value]");
    volume?.addEventListener("input", (e) => { update("volume", Number(e.target.value)); if (volumeValue) volumeValue.textContent = e.target.value; });
    const noiseAmount = panel.querySelector("[data-noise-amount]");
    const noiseAmountValue = panel.querySelector("[data-noise-amount-value]");
    noiseAmount?.addEventListener("input", (e) => { update("noiseAmount", Number(e.target.value)); if (noiseAmountValue) noiseAmountValue.textContent = e.target.value; });
    panel.querySelector("[data-noise]")?.addEventListener("change", (e) => update("noise", e.target.value));
    panel.querySelector("[data-duration]")?.addEventListener("change", (e) => update("duration", Number(e.target.value)));
    panel.querySelector("[data-intensity]")?.addEventListener("change", (e) => { update("intensity", e.target.value); render(); });
    panel.querySelector("[data-note]")?.addEventListener("input", (e) => update("note", e.target.value));
  }

  function openPanel() {
    if (!panel) {
      panel = document.createElement("aside");
      panel.className = "fb21-audio-panel";
      panel.setAttribute("aria-label", "FocusBridge21 Audio Lab");
      document.body.appendChild(panel);
    }
    panel.style.display = "block";
    render();
  }

  function closePanel() {
    if (panel) panel.style.display = "none";
  }

  function init() {
    if (document.querySelector("[data-fb21-audio-btn]")) return;
    const btn = document.createElement("button");
    btn.className = "button fb21-audio-btn";
    btn.setAttribute("data-fb21-audio-btn", "true");
    btn.textContent = "◌ Audio Lab";
    btn.addEventListener("click", () => {
      if (panel && panel.style.display !== "none") closePanel();
      else openPanel();
    });
    document.body.appendChild(btn);
    window.FB21_AUDIO_LAB = { open: openPanel, close: closePanel, version: VERSION, stopAudio };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
