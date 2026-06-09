(() => {
  const VERSION = "v0.8 Guidance Lab + Voice Guide";
  const LEDGER_KEY = "focusbridge21-ledger-v1";
  const PREF_KEY = "focusbridge21-preferences-v2";
  const GUIDE_KEY = "focusbridge21-guidance-lab-v1";

  const MODES = {
    "Minimal Zen": {
      style: "quiet, sparse, non-symbolic",
      cues: {
        Prepare: ["Settle.", "Lower the volume.", "Return is always available."],
        Relax: ["Body soft.", "Breath easy.", "Witness awake."],
        Expand: ["Let space widen.", "No chasing.", "Rest as observer."],
        Threshold: ["Stable witness.", "No forcing.", "Gentle attention."],
        Return: ["Hands. Feet. Room.", "Open the eyes when ready.", "Move slowly."]
      }
    },
    Neutral: {
      style: "clear, grounding, practical",
      cues: {
        Prepare: ["Settle into a safe position.", "Confirm low volume and stereo headphones.", "Set the return anchor before going deeper."],
        Relax: ["Let the body become heavy while the mind remains gently awake.", "Release jaw, shoulders, belly, hands, and feet.", "Let the sound field do less, not more."],
        Expand: ["Allow awareness to widen around the body.", "Notice the room without needing to label it.", "Stay calm, awake, and observant."],
        Threshold: ["Rest near the threshold without trying to prove anything.", "If pressure rises, soften and return to breath.", "Stable witness and clean return matter most."],
        Return: ["Bring awareness back to hands, feet, breath, and room.", "Name three things you see, hear, and feel.", "Journal only after you feel grounded."],
      }
    },
    "Resonance Architect": {
      style: "symbolic, Parallax-flavored, still safety-first",
      cues: {
        Prepare: ["Enter the cockpit as a sovereign witness.", "Set the bridge intention: stable witness, clean return, honest receipt.", "The return anchor is the root. The ledger is the receipt."],
        Relax: ["Let the carbon vessel rest while awareness stays gently online.", "Body asleep, witness awake, no forcing.", "The gate is trained through capacity, not demanded by will."],
        Expand: ["Let awareness become spherical: behind, beside, above, below.", "Hold humility at the center of the signal.", "The bridge opens through gentleness and coherence."],
        Threshold: ["At the edge, witness without grasping.", "If resistance rises, thank it and soften.", "The strongest journey is the one you can return from cleanly."],
        Return: ["Return to hands, feet, breath, and room.", "Gather the signal without clinging to the symbol.", "Write the receipt. Let pattern become wisdom over time."],
      }
    },
    "Return Only": {
      style: "grounding only",
      cues: {
        Prepare: ["Stop the session.", "Open the eyes.", "Feel the support under the body."],
        Relax: ["Press feet into the floor.", "Move fingers and toes.", "Take a normal breath."],
        Expand: ["Name three things you see.", "Name three things you hear.", "Name three things you feel."],
        Threshold: ["Drink water if available.", "Stand only when stable.", "No analysis until grounded."],
        Return: ["You are here.", "The room is here.", "The session is complete."],
      }
    }
  };

  const PHASES = [
    { name: "Prepare", ratio: 0.12 },
    { name: "Relax", ratio: 0.25 },
    { name: "Expand", ratio: 0.23 },
    { name: "Threshold", ratio: 0.25 },
    { name: "Return", ratio: 0.15 }
  ];

  const PRESETS = ["Foundation", "Expansion", "No-Time", "Bridge"];

  let state = {
    open: false,
    mode: "Neutral",
    preset: "Foundation",
    duration: 5,
    voiceURI: "",
    rate: 0.88,
    pitch: 0.96,
    customIntention: "Stable witness, clean return, honest receipt.",
    speaking: false,
    speakIndex: 0,
    checks: {
      safe: false,
      volume: false,
      returnAnchor: false,
      body: false,
      water: false,
      noMachinery: false
    }
  };

  let voices = [];
  let currentScript = [];

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || ""); } catch { return fallback; }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function escapeHtml(text) {
    return String(text ?? "").replace(/[&<>'"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[ch]));
  }

  function fmtTime(sec) {
    const s = Math.max(0, Math.round(sec));
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const r = (s % 60).toString().padStart(2, "0");
    return `${m}:${r}`;
  }

  function downloadText(filename, text, type = "text/plain") {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function getLedger() {
    return readJson(LEDGER_KEY, []);
  }

  function getPrefs() {
    return readJson(PREF_KEY, {});
  }

  function loadGuideState() {
    const saved = readJson(GUIDE_KEY, null);
    const prefs = getPrefs();
    state = {
      ...state,
      ...(saved || {}),
      preset: saved?.preset || prefs.presetName || state.preset,
      duration: saved?.duration || prefs.durationMin || state.duration,
      customIntention: saved?.customIntention || prefs.pre?.intention || state.customIntention
    };
  }

  function saveGuideState() {
    writeJson(GUIDE_KEY, state);
  }

  function refreshVoices() {
    voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  }

  function scriptFor({ mode, preset, duration, customIntention }) {
    const pack = MODES[mode] || MODES.Neutral;
    const total = Number(duration) * 60;
    let cursor = 0;
    const rows = [];
    rows.push({ time: 0, phase: "Intention", text: `Preset: ${preset}. Intention: ${customIntention || "stable witness and clean return"}` });
    PHASES.forEach((phase) => {
      const phaseLen = total * phase.ratio;
      const cues = pack.cues[phase.name] || [];
      cues.forEach((cue, i) => {
        const cueTime = cursor + (phaseLen * (i + 0.16) / Math.max(1, cues.length));
        rows.push({ time: cueTime, phase: phase.name, text: cue });
      });
      cursor += phaseLen;
    });
    rows.push({ time: total, phase: "Complete", text: "Session complete. Return before interpretation. Journal after grounded." });
    return rows.map((r, idx) => ({ ...r, id: `${idx}-${r.phase}` }));
  }

  function preflightScore() {
    const total = Object.keys(state.checks).length;
    const done = Object.values(state.checks).filter(Boolean).length;
    return { done, total, ok: done === total };
  }

  function getGuideRecommendation() {
    const ledger = getLedger();
    const recent = ledger.slice(0, 5);
    if (!ledger.length) return "Start with Minimal Zen or Neutral guidance and a 2–5 minute Foundation run. Build clean receipts before depth.";
    const avgReturn = recent.reduce((a, r) => a + Number(r.post?.return_quality || 0), 0) / recent.length;
    const avgFear = recent.reduce((a, r) => a + Number(r.during?.fear_or_resistance || 0), 0) / recent.length;
    const avgWitness = recent.reduce((a, r) => a + Number(r.during?.stable_witness_presence || 0), 0) / recent.length;
    if (avgFear >= 4 || avgReturn < 6) return "Use Return Only or Minimal Zen for the next run. Keep it short and focus on clean return quality.";
    if (avgWitness >= 7 && avgReturn >= 8) return "You have enough clean-return signal for a gentle Bridge Preview. Keep the voice sparse and the session conservative.";
    return "Use Neutral guidance with Foundation or Expansion. Train stable witness and return quality before pushing threshold work.";
  }

  function markdownScript() {
    const script = currentScript.length ? currentScript : scriptFor(state);
    return `# FocusBridge21 Guidance Script\n\nVersion: ${VERSION}\nMode: ${state.mode}\nPreset: ${state.preset}\nDuration: ${state.duration} minutes\nIntention: ${state.customIntention}\n\nClaim Boundary: subjective practice guidance only; not medical care, therapy, diagnosis, or a guaranteed altered state.\n\n## Cues\n\n${script.map(c => `- [${fmtTime(c.time)}] **${c.phase}:** ${c.text}`).join("\n")}\n`;
  }

  function openModal() {
    state.open = true;
    saveGuideState();
    render();
  }

  function closeModal() {
    stopSpeaking();
    state.open = false;
    saveGuideState();
    render();
  }

  function speakCue(cue, onEnd) {
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(`${cue.phase}. ${cue.text}`);
    const voice = voices.find(v => v.voiceURI === state.voiceURI);
    if (voice) utter.voice = voice;
    utter.rate = Number(state.rate) || 0.88;
    utter.pitch = Number(state.pitch) || 0.96;
    utter.onend = () => onEnd && onEnd();
    utter.onerror = () => onEnd && onEnd();
    window.speechSynthesis.speak(utter);
  }

  function playFullScript() {
    if (!window.speechSynthesis) return alert("Speech synthesis is not available in this browser.");
    stopSpeaking(false);
    currentScript = scriptFor(state);
    state.speaking = true;
    state.speakIndex = 0;
    render();

    const next = () => {
      if (!state.speaking || state.speakIndex >= currentScript.length) {
        state.speaking = false;
        state.speakIndex = 0;
        saveGuideState();
        render();
        return;
      }
      const cue = currentScript[state.speakIndex];
      state.speakIndex += 1;
      saveGuideState();
      render();
      speakCue(cue, () => setTimeout(next, 450));
    };
    next();
  }

  function playNextCue() {
    if (!window.speechSynthesis) return alert("Speech synthesis is not available in this browser.");
    currentScript = scriptFor(state);
    const cue = currentScript[Math.min(state.speakIndex, currentScript.length - 1)];
    state.speakIndex = (state.speakIndex + 1) % currentScript.length;
    saveGuideState();
    render();
    speakCue(cue);
  }

  function stopSpeaking(doRender = true) {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    state.speaking = false;
    state.speakIndex = 0;
    saveGuideState();
    if (doRender) render();
  }

  function applyGuideDefaults() {
    const prefs = getPrefs();
    const pre = prefs.pre || {};
    const nextPrefs = {
      ...prefs,
      presetName: state.preset,
      durationMin: Number(state.duration),
      guidanceMode: state.mode === "Resonance Architect" ? "Resonance Architect" : "Neutral",
      pre: { ...pre, intention: state.customIntention }
    };
    writeJson(PREF_KEY, nextPrefs);
    alert("Guidance defaults saved. The main builder will pick them up on reload.");
  }

  function renderFab() {
    let fab = document.querySelector(".fb21-guide-fab");
    if (!fab) {
      fab = document.createElement("button");
      fab.className = "fb21-guide-fab";
      fab.type = "button";
      fab.addEventListener("click", openModal);
      document.body.appendChild(fab);
    }
    fab.textContent = "✺ Guidance Lab";
  }

  function render() {
    renderFab();
    let modal = document.querySelector(".fb21-guide-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "fb21-guide-modal";
      document.body.appendChild(modal);
    }
    if (!state.open) {
      modal.classList.remove("open");
      modal.innerHTML = "";
      return;
    }

    refreshVoices();
    currentScript = scriptFor(state);
    const check = preflightScore();
    const progress = currentScript.length ? Math.round((state.speakIndex / currentScript.length) * 100) : 0;
    const recommendation = getGuideRecommendation();

    modal.classList.add("open");
    modal.innerHTML = `
      <div class="fb21-guide-shell" role="dialog" aria-modal="true" aria-label="FocusBridge21 Guidance Lab">
        <div class="fb21-guide-head">
          <div>
            <div class="fb21-guide-badge">${VERSION}</div>
            <h2>Guidance Lab</h2>
            <div class="fb21-guide-mini">Build sparse scripts, test browser voice guidance, and run a safety preflight before practice.</div>
          </div>
          <button class="fb21-guide-btn warn" data-close>Close</button>
        </div>

        <div class="fb21-guide-grid">
          <div class="fb21-guide-panel">
            <h3>Preflight</h3>
            <div class="fb21-guide-status ${check.ok ? "good" : "wait"}">
              ${check.ok ? "Green check: guidance preflight complete." : `${check.done}/${check.total} checks complete. Keep this boring and safe.`}
            </div>
            ${Object.entries({
              safe: "Safe quiet space",
              volume: "Volume low / headphones comfortable",
              returnAnchor: "Return anchor chosen",
              body: "Body feels stable enough for practice",
              water: "Water nearby / no rushing afterward",
              noMachinery: "Not driving, cooking, or operating machinery"
            }).map(([key, label]) => `
              <label class="fb21-guide-check"><input type="checkbox" data-check="${key}" ${state.checks[key] ? "checked" : ""}> ${label}</label>
            `).join("")}

            <h3>Script Builder</h3>
            <div class="fb21-guide-field"><label>Mode</label><select data-field="mode">${Object.keys(MODES).map(mode => `<option ${state.mode === mode ? "selected" : ""}>${mode}</option>`).join("")}</select></div>
            <div class="fb21-guide-field"><label>Preset</label><select data-field="preset">${PRESETS.map(p => `<option ${state.preset === p ? "selected" : ""}>${p}</option>`).join("")}</select></div>
            <div class="fb21-guide-field"><label>Duration: ${escapeHtml(state.duration)} minutes</label><input data-field="duration" type="range" min="2" max="45" step="1" value="${escapeHtml(state.duration)}"></div>
            <div class="fb21-guide-field"><label>Intention</label><textarea data-field="customIntention">${escapeHtml(state.customIntention)}</textarea></div>

            <h3>Voice</h3>
            <div class="fb21-guide-field"><label>Browser voice</label><select data-field="voiceURI"><option value="">Default voice</option>${voices.map(v => `<option value="${escapeHtml(v.voiceURI)}" ${state.voiceURI === v.voiceURI ? "selected" : ""}>${escapeHtml(v.name)} (${escapeHtml(v.lang)})</option>`).join("")}</select></div>
            <div class="fb21-guide-field"><label>Rate: ${escapeHtml(state.rate)}</label><input data-field="rate" type="range" min="0.55" max="1.2" step="0.01" value="${escapeHtml(state.rate)}"></div>
            <div class="fb21-guide-field"><label>Pitch: ${escapeHtml(state.pitch)}</label><input data-field="pitch" type="range" min="0.7" max="1.2" step="0.01" value="${escapeHtml(state.pitch)}"></div>
            <div class="fb21-guide-row">
              <button class="fb21-guide-btn primary" data-play-full>${state.speaking ? "Playing..." : "Play script"}</button>
              <button class="fb21-guide-btn" data-play-next>Play next cue</button>
              <button class="fb21-guide-btn warn" data-stop>Stop voice</button>
            </div>
            <div class="fb21-guide-progress"><span style="width:${progress}%"></span></div>
            <div class="fb21-guide-mini">Voice is browser-local. Keep it sparse; too much guidance can pull attention outward.</div>
          </div>

          <div class="fb21-guide-panel">
            <h3>Local Coach Hint</h3>
            <div class="fb21-guide-status wait">${escapeHtml(recommendation)}</div>
            <div class="fb21-guide-row" style="margin-bottom:12px">
              <button class="fb21-guide-btn primary" data-apply>Apply guidance defaults</button>
              <button class="fb21-guide-btn" data-download-md>Download script MD</button>
              <button class="fb21-guide-btn" data-copy>Copy script</button>
            </div>
            <h3>Generated Script</h3>
            <div class="fb21-guide-script">
              ${currentScript.map((cue, idx) => `
                <div class="fb21-guide-cue">
                  <span class="fb21-guide-time">${fmtTime(cue.time)}</span><strong>${escapeHtml(cue.phase)}</strong>
                  <div>${escapeHtml(cue.text)}</div>
                  ${idx === state.speakIndex ? `<div class="fb21-guide-mini">Next voice cue</div>` : ""}
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      </div>
    `;

    modal.querySelector("[data-close]").addEventListener("click", closeModal);
    modal.querySelectorAll("[data-field]").forEach(el => {
      el.addEventListener("input", () => {
        const key = el.getAttribute("data-field");
        state[key] = el.type === "range" ? Number(el.value) : el.value;
        saveGuideState();
        render();
      });
      el.addEventListener("change", () => {
        const key = el.getAttribute("data-field");
        state[key] = el.type === "range" ? Number(el.value) : el.value;
        saveGuideState();
        render();
      });
    });
    modal.querySelectorAll("[data-check]").forEach(el => {
      el.addEventListener("change", () => {
        state.checks[el.getAttribute("data-check")] = el.checked;
        saveGuideState();
        render();
      });
    });
    modal.querySelector("[data-play-full]").addEventListener("click", playFullScript);
    modal.querySelector("[data-play-next]").addEventListener("click", playNextCue);
    modal.querySelector("[data-stop]").addEventListener("click", () => stopSpeaking(true));
    modal.querySelector("[data-apply]").addEventListener("click", applyGuideDefaults);
    modal.querySelector("[data-download-md]").addEventListener("click", () => downloadText(`focusbridge21-guidance-${Date.now()}.md`, markdownScript(), "text/markdown"));
    modal.querySelector("[data-copy]").addEventListener("click", async () => {
      await navigator.clipboard.writeText(markdownScript()).catch(() => {});
      alert("Guidance script copied, bro.");
    });
    modal.addEventListener("click", (ev) => { if (ev.target === modal) closeModal(); });
  }

  function init() {
    loadGuideState();
    refreshVoices();
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = () => { refreshVoices(); if (state.open) render(); };
    render();
    window.FocusBridge21GuidanceLab = { open: openModal, version: VERSION };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
