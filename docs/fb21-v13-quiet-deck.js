/* FocusBridge21 Quiet Deck v1.3: optional, local-first front door. */
(() => {
  "use strict";
  const LEDGER_KEY = "focusbridge21-ledger-v1";
  const PREVIEW_SECONDS = 15;
  const PREVIEW_LAYERS = Object.freeze([
    ["surf", "Ocean surf"], ["bass", "Sub-bass"], ["beat", "Soft pulse"],
    ["rain", "Rain"], ["wind", "Wind"], ["hum", "HUM"]
  ]);
  const MIX_KEY = "focusbridge21-quiet-soundscape-v14";
  const PROFILE_MIX_KEY = "focusbridge21-quiet-profile-mixes-v16";
  const RIFE_SETTINGS_KEY = "focusbridge21-rife-audio-lab-v1";
  const GUIDE_KEY = "focusbridge21-quiet-guidance-v1";
  const MASTER_KEY = "focusbridge21-master-level-v25";
  const SLEEP_KEY = "focusbridge21-sleep-intentions-v26";
  const intentionEngine = window.FocusBridgeIntention;
  const sleepPrefs = (() => {
    try {
      const value = JSON.parse(localStorage.getItem(SLEEP_KEY) || "{}");
      return window.FocusBridgeSleep
        ? window.FocusBridgeSleep.preferences(value) : {};
    } catch { return {}; }
  })();
  const guidePrefs = (() => {
    try {
      const value = JSON.parse(localStorage.getItem(GUIDE_KEY) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch { return {}; }
  })();
  const readRifeSettings = () => {
    try { return JSON.parse(localStorage.getItem(RIFE_SETTINGS_KEY) || "{}"); }
    catch { return {}; }
  };
  const readProfileMixes = () => {
    try {
      const value = JSON.parse(localStorage.getItem(PROFILE_MIX_KEY) || "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch { return {}; }
  };
  const profileMixes = readProfileMixes();
  const readMix = () => {
    try { return JSON.parse(localStorage.getItem(MIX_KEY) || "{}"); } catch { return {}; }
  };
  const mix = readMix();
  // Seed the original Listen & drift mixer once, before new profiles can
  // overwrite the legacy flat preference key.
  if (!profileMixes.drift) profileMixes.drift = mix;
  const level = (x, fallback) => Number.isFinite(Number(x)) && x !== undefined && x !== null ? Math.max(0, Math.min(100, Number(x))) : fallback;
  const saveMix = () => {
    const values = {
      surf: state.surf, bass: state.bass, beat: state.beat,
      rain: state.rain, wind: state.wind, hum: state.hum, humNote: state.humNote,
      tones: state.tones, toneDifference: state.toneDifference
    };
    try {
      localStorage.setItem(MIX_KEY, JSON.stringify(values)); // legacy Quiet Deck preference
      profileMixes[state.profile] = values;
      localStorage.setItem(PROFILE_MIX_KEY, JSON.stringify(profileMixes));
    } catch {} // Audio works without storage access.
  };
  // These are original audio-design profiles, not measured neurological states.
  const PROFILES = Object.freeze({
    qmm: { label: "Quiet Mind · QMM", duration: 600, surf: 0, bass: 0, beat: 0, tones: false, carrier: 180, difference: 8, space: 0 },
    gdm: { label: "Going Deeper · GDM", duration: 600, surf: 0, bass: 0, beat: 0, tones: false, carrier: 180, difference: 8, space: 0 },
    energy: { label: "Breathing Energy", duration: 600, surf: 0, bass: 0, beat: 0, tones: false, carrier: 180, difference: 8, space: 0 },
    tele: { label: "Tele-Visualization", duration: 600, surf: 0, bass: 0, beat: 0, tones: false, carrier: 180, difference: 8, space: 0 },
    chakra: { label: "Seven-Center Light Meditation", duration: 600, surf: 0, bass: 0, beat: 0, tones: false, carrier: 180, difference: 8, space: 0 },
    clair: { label: "Clairaudience · Listening Imagery", duration: 600, surf: 0, bass: 0, beat: 0, tones: false, carrier: 180, difference: 8, space: 0 },
    energy6: { label: "Controlling Energy · Imagery Studio", duration: 600, surf: 0, bass: 0, beat: 0, tones: false, carrier: 180, difference: 8, space: 0 },
    cleanse7: { label: "Seven-Center Cleansing Imagery", duration: 600, surf: 0, bass: 0, beat: 0, tones: false, carrier: 180, difference: 8, space: 0 },
    drift: { label: "Listen & drift", duration: 120, surf: 68, bass: 14, beat: 0, tones: true, carrier: 180, difference: 8, space: 20 },
    lost: { label: "Island 108 · LOST-inspired", island: true, duration: 6480,
      surf: 42, bass: 8, beat: 4, rain: 23, wind: 16, hum: 15, humNote: "C3",
      tones: false, carrier: 180, difference: 8, space: 6 },
    sleep: { label: "Sleep Sanctuary", duration: 21600, surf: 60, bass: 8, beat: 0, tones: false, carrier: 180, difference: 4, space: 10 },
    intention: { label: "Intention Studio", duration: 900, surf: 30, bass: 0, beat: 0,
      rain: 10, wind: 0, hum: 10, humNote: "C4", tones: false,
      carrier: 180, difference: 8, space: 0 },
    focus: { label: "Deep Focus", duration: 2700, surf: 34, bass: 0, beat: 0, tones: true, carrier: 200, difference: 12, space: 0 },
    explore: { label: "Threshold Explorer", duration: 2700, surf: 50, bass: 8, beat: 0, tones: true, carrier: 180, difference: 6, space: 35 },
    sync: { label: "Focus Sync", sync: true, duration: 12960, surf: 35, bass: 5, beat: 0, tones: true, carrier: 185, difference: 10, space: 12 },
    rife: { label: "Rife Frequency Lab", rife: true, duration: 300, surf: 0, bass: 0, beat: 0, tones: true, carrier: 220, difference: 0, space: 0 },
    headache: { label: "Headache Sensitivity", holistic: true, duration: 600, surf: 8, bass: 0, beat: 0, tones: false, carrier: 180, difference: 8, space: 0, note: "Quiet is often best for sound-sensitive headaches. Any audio should be barely audible. Stop if discomfort increases." },
    stomach: { label: "Stomach Discomfort", holistic: true, duration: 900, surf: 20, bass: 0, beat: 0, tones: false, carrier: 180, difference: 8, space: 0, note: "A small, predictable background sound may help some people settle. This does not address the cause of abdominal pain." },
    nausea: { label: "Nausea / Queasiness", holistic: true, duration: 600, surf: 12, bass: 0, beat: 0, tones: false, carrier: 180, difference: 8, space: 0, note: "Low-stimulation ambience or silence can be preferable; audio is optional and will not treat nausea." },
    tension: { label: "Everyday Tension", holistic: true, duration: 900, surf: 32, bass: 0, beat: 0, tones: false, carrier: 180, difference: 8, space: 0, note: "A soft sound field may support relaxation and provide a comfortable pause." }
  });
  const HOLISTIC_CHOICES = Object.freeze([
    { key: "headache", symbol: "◌", subtitle: "Headache / sound sensitivity", description: "Low stimulation first. Prefer quiet if sound makes symptoms worse." },
    { key: "stomach", symbol: "≈", subtitle: "Stomach discomfort", description: "Predictable, low-level ambient sound for settling down." },
    { key: "nausea", symbol: "◇", subtitle: "Nausea / queasiness", description: "Barely audible and stationary sound, with no pulses or moving stereo." },
    { key: "tension", symbol: "✧", subtitle: "Everyday tension", description: "A soothing pause with gentle ambient texture." }
  ]);
  const HOLISTIC_TONE_OPTIONS = Object.freeze([4, 6, 8, 10, 12]);
  // An original island-inspired six-chapter experience. These famous numbers
  // are used only as proportional durations, not for licensed audio or scenes.
  const ISLAND_SEGMENTS = Object.freeze([
    { number: 4, title: "Shoreline", cue: "Settle near the imagined shoreline. Let the surf arrive and recede." },
    { number: 8, title: "The Canopy", cue: "Imagine light rainfall through leaves. Follow no story you do not choose." },
    { number: 15, title: "Under the Sky", cue: "Notice the wind and the space between its gentle gusts." },
    { number: 16, title: "The Signal", cue: "Hear the quiet HUM beneath the waves. Nothing needs decoding." },
    { number: 23, title: "After Sundown", cue: "Let the island stay a place of imagination. Relax your shoulders." },
    { number: 42, title: "The Way Home", cue: "Feel the ground beneath you. You can return to your surroundings anytime." }
  ]);
  const ISLAND_TOTAL = ISLAND_SEGMENTS.reduce((sum, stage) => sum + stage.number, 0);
  function islandStageAt(elapsedMs, durationSeconds) {
    const scaled = Math.max(0, Math.min(ISLAND_TOTAL, elapsedMs / Math.max(1, durationSeconds * 1000) * ISLAND_TOTAL));
    let cumulative = 0;
    for (let i = 0; i < ISLAND_SEGMENTS.length; i++) {
      cumulative += ISLAND_SEGMENTS[i].number;
      if (scaled < cumulative) return i;
    }
    return ISLAND_SEGMENTS.length - 1;
  }
  const DURATIONS = Object.freeze({
    qmm: [180, 300, 600, 900, 1200, 1800],
    gdm: [180, 300, 600, 900, 1200, 1800],
    energy: [180, 300, 600, 900, 1200, 1800],
    tele: [180, 300, 600, 900, 1200, 1800],
    chakra: [180, 300, 600, 900, 1200, 1800],
    clair: [180, 300, 600, 900, 1200, 1800],
    energy6: [180, 300, 600, 900, 1200, 1800],
    cleanse7: [180, 300, 600, 900, 1200, 1800],
    settle: [60, 90, 120, 300, 600],
    drift: [120, 300, 900, 1500, 2700, 3600, 5400, 7200, 10800, 14400, 21600],
    lost: [900, 2700, 3600, 6480, 10800],
    sleep: [1800, 3600, 5400, 7200, 10800, 14400, 21600],
    intention: [300, 600, 900, 1200, 1800],
    focus: [1500, 2700, 5400, 10800],
    explore: [1200, 2700, 5400, 7200],
    rife: [60, 180, 300, 600, 900],
    headache: [300, 600, 900, 1200],
    stomach: [300, 600, 900, 1200, 1800],
    nausea: [300, 600, 900, 1200],
    tension: [300, 600, 900, 1200, 1800]
  });
  const LAB_ONCE_KEY = "focusbridge21-open-lab-once-v13";
  const root = document.createElement("div");
  root.id = "fb21-quiet-root";
  const homeButton = document.createElement("button");
  homeButton.id = "fb21-quiet-home";
  homeButton.type = "button";
  homeButton.textContent = "◌ Quiet Deck";
  homeButton.setAttribute("aria-label", "Leave labs and return to Quiet Deck");
  document.body.append(root, homeButton);

  const state = {
    screen: "home", mode: "settle", profile: "drift", duration: 90, toneDifference: 8,
    syncMinutes: 12, syncPlan: null, syncStage: 0, islandIndex: 0, qmmStage: 0, qmmVoice: false, qmmNext: null,
    gdmStage: 0, gdmVoice: false, gdmVisual: "ladder", gdmNext: null,
    energyStage: 0, energyVoice: false, energyVisual: "glow", energyNext: null,
    teleStage: 0, teleVoice: false, targetLab: null,
    chapterStage: 0, chapterVoice: false,
    energy6Stage: 0, energy6Voice: false, energy6Theme: "body",
    cleanse7Stage: 0, cleanse7Voice: false, cleanse7Style: "release",
    atlas: { category: "all", search: "", selected: "root" },
    rife: window.FocusBridgeRife ? window.FocusBridgeRife.config(readRifeSettings()) : null,
    safe: false,
    headphones: false, elapsedMs: 0, lastTick: 0, timer: null,
    audio: null, paused: false, interrupted: false, starting: false, note: "", error: "",
    previewAudio: null, previewTimer: null, previewStarting: false,
    previewActive: false, previewStartedAt: 0, previewNonce: 0,
    previewMessage: "", previewError: "",
    surf: level(mix.surf, 68), bass: level(mix.bass, 14), beat: level(mix.beat, 0),
    rain: level(mix.rain, 0), wind: level(mix.wind, 0), hum: level(mix.hum, 0),
    humNote: "C4", tones: mix.tones !== false,
    master: level((() => { try { return localStorage.getItem(MASTER_KEY) ?? 80; } catch { return 80; } })(), 80),
    voiceGuide: guidePrefs.voice === true, breathGuide: guidePrefs.breath === true,
    sleepGuide: sleepPrefs.guide === true, sleepSpeakIntention: sleepPrefs.speakIntention === true,
    sleepDim: sleepPrefs.dim !== false, sleepIntention: sleepPrefs.intention || "",
    sleepCueIndex: 0,
    intentionLibrary: intentionEngine ? intentionEngine.load(localStorage) : [],
    intentionId: "", intentionTitle: "", intentionScript: "",
    intentionCadence: "once", intentionSpeak: false, intentionNextCue: null,
    intentionNotice: "", intentionConfirmDelete: false
  };

  function saveGuidePreferences() {
    try {
      localStorage.setItem(GUIDE_KEY,
        JSON.stringify({ voice: state.voiceGuide, breath: state.breathGuide }));
    } catch {} // Guidance works without persistent storage.
  }
  function voiceAvailable() {
    return !!(window.FocusBridgeVoice && window.FocusBridgeVoice.available());
  }
  function sleepConfig() {
    return { guide: state.sleepGuide, speakIntention: state.sleepSpeakIntention,
      dim: state.sleepDim, intention: state.sleepIntention };
  }
  function saveSleepSettings() {
    try { localStorage.setItem(SLEEP_KEY, JSON.stringify(sleepConfig())); }
    catch {} // Session remains usable if storage is blocked.
  }
  function speakSleep(kind) {
    if (!window.FocusBridgeSleep || !voiceAvailable()) return false;
    const message = window.FocusBridgeSleep.cue(sleepConfig(), kind);
    return message ? window.FocusBridgeVoice.say(message) : false;
  }
  function intentionVoice() {
    if (!intentionEngine || !voiceAvailable() || !state.intentionScript) return false;
    return window.FocusBridgeVoice.say(intentionEngine.textForSpeech(state.intentionScript));
  }
  function applyIntentionRecipe(entry) {
    state.intentionId = entry.id;
    state.intentionTitle = entry.title;
    state.intentionScript = entry.script;
    state.intentionCadence = entry.cadence;
    for (const key of intentionEngine.MIX_KEYS) state[key] = entry.mix[key];
    state.tones = entry.mix.tones;
    state.humNote = entry.mix.humNote;
    state.intentionConfirmDelete = false;
    state.intentionNotice = "Recipe loaded. Review the sound mixer and safety check before starting.";
    stopPreviewForChange();
    saveMix();
    render();
  }
  function saveIntentionRecipe() {
    if (!intentionEngine || state.screen !== "prepare" || state.profile !== "intention") return;
    try {
      const mix = { tones: state.tones, humNote: state.humNote };
      for (const key of intentionEngine.MIX_KEYS) mix[key] = state[key];
      const result = intentionEngine.upsert(state.intentionLibrary, {
        id: state.intentionId, title: state.intentionTitle,
        script: state.intentionScript, cadence: state.intentionCadence, mix
      });
      intentionEngine.persist(localStorage, result.entries);
      state.intentionLibrary = result.entries;
      state.intentionId = result.saved.id;
      state.intentionTitle = result.saved.title;
      state.intentionScript = result.saved.script;
      state.intentionConfirmDelete = false;
      state.intentionNotice = "Saved locally. This recipe includes the current sound mixer levels.";
    } catch (err) {
      state.intentionNotice = err.message || "Could not save in this browser.";
    }
    render();
  }
  function deleteIntentionRecipe() {
    if (!intentionEngine || state.screen !== "prepare" || state.profile !== "intention" ||
        !state.intentionId || !state.intentionConfirmDelete) return;
    try {
      const remaining = intentionEngine.remove(state.intentionLibrary, state.intentionId);
      intentionEngine.persist(localStorage, remaining);
      state.intentionLibrary = remaining;
      state.intentionId = "";
      state.intentionTitle = "";
      state.intentionScript = "";
      state.intentionCadence = "once";
      state.intentionSpeak = false;
      state.intentionNotice = "Saved recipe deleted from this browser.";
    } catch {
      state.intentionNotice = "Could not delete: browser storage is unavailable.";
    }
    state.intentionConfirmDelete = false;
    render();
  }
  function speakGate(stage) {
    if (!state.voiceGuide || state.profile !== "sync" || !voiceAvailable()) return;
    const introduction = stage.kind === "return"
      ? "Now begin a gentle return."
      : "Focus " + stage.level + ". " + stage.title + ".";
    window.FocusBridgeVoice.say(introduction + " " + stage.prompt);
  }
  function speakQMM(stage) {
    if (!state.qmmVoice || state.profile !== "qmm" || !voiceAvailable()) return;
    window.FocusBridgeVoice.say(stage.voice);
  }
  function speakGDM(stage) {
    if (!state.gdmVoice || state.profile !== "gdm" || !voiceAvailable()) return;
    window.FocusBridgeVoice.say(stage.voice);
  }
  function speakEnergy(stage) {
    if (!state.energyVoice || state.profile !== "energy" || !voiceAvailable()) return;
    window.FocusBridgeVoice.say(stage.voice);
  }
  function speakTele(stage) {
    if (!state.teleVoice || state.profile !== "tele" || !voiceAvailable()) return;
    window.FocusBridgeVoice.say(stage.voice);
  }
  function chapterEngine() {
    return state.profile === "chakra" ? window.FocusBridgeChakraLight :
      state.profile === "clair" ? window.FocusBridgeClairaudience : null;
  }
  function speakChapter(stage) {
    if (!state.chapterVoice || !chapterEngine() || !voiceAvailable()) return;
    window.FocusBridgeVoice.say(stage.voice);
  }
  function speakEnergy6(phase) {
    if (!state.energy6Voice || state.profile !== "energy6" || !voiceAvailable()) return;
    window.FocusBridgeVoice.say(phase.voice);
  }
  function speakCleanse7(phase) {
    if (!state.cleanse7Voice || state.profile !== "cleanse7" || !voiceAvailable()) return;
    window.FocusBridgeVoice.say(phase.voice);
  }
  function breathCue() {
    const cycle = state.elapsedMs % 10000;
    return cycle < 4000 ? "Breathe in gently" : "Breathe out comfortably";
  }

  function safeText(value) {
    return String(value || "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
  function formatTime(seconds) {
    const n = Math.max(0, Math.ceil(seconds));
    if (n >= 3600) return Math.floor(n / 3600) + ":" +
      String(Math.floor(n % 3600 / 60)).padStart(2, "0") + ":" +
      String(n % 60).padStart(2, "0");
    return String(Math.floor(n / 60)).padStart(2, "0") + ":" + String(n % 60).padStart(2, "0");
  }
  function setQuiet(isQuiet) {
    document.body.classList.toggle("fb21-quiet-mode", isQuiet);
    root.hidden = !isQuiet;
    homeButton.hidden = isQuiet;
    if (isQuiet) render();
  }
  function openLab() {
    stopPreview("", false);
    stopAudio();
    clearInterval(state.timer);
    try { sessionStorage.setItem(LAB_ONCE_KEY, "1"); } catch {}
    window.location.reload(); // also rehydrates the existing React ledger after a Quiet Deck receipt
  }
  function returnToQuiet() {
    stopPreview("", false);
    stopAudio();
    try { sessionStorage.removeItem(LAB_ONCE_KEY); } catch {}
    window.location.reload(); // stops any ongoing React-session audio safely
  }
  homeButton.addEventListener("click", returnToQuiet);

  // In the source book, QMM precedes deeper meditation exercises.
  // Every dedicated exploration journey begins with a fresh QMM foundation.
  // QMM -> GDM -> Breathing Energy precedes dedicated exploration journeys.
  // Timed completion is not neurological certification; every transition is
  // voluntary and demands a fresh safety check.
  function selectMode(mode, completedQMM = false, completedGDM = false, completedEnergy = false) {
    if (["gdm", "energy", "explore", "sync", "tele", "targetlab", "chakra", "clair", "energy6", "cleanse7"].includes(mode) && !completedQMM) {
      selectMode("qmm");
      if (state.screen === "prepare" && state.profile === "qmm") {
        state.qmmNext = mode;
        render();
      }
      return;
    }
    if (["energy", "explore", "sync", "clair"].includes(mode) && !completedGDM) {
      selectMode("gdm", true);
      if (state.screen === "prepare" && state.profile === "gdm") {
        state.gdmNext = mode;
        render();
      }
      return;
    }
    if (["explore", "sync"].includes(mode) && !completedEnergy) {
      selectMode("energy", true, true);
      if (state.screen === "prepare" && state.profile === "energy") {
        state.energyNext = mode;
        render();
      }
      return;
    }
    state.qmmNext = null;
    state.gdmNext = null;
    state.energyNext = null;
    if (mode === "atlas") {
      stopPreview("", false);
      stopAudio();
      clearInterval(state.timer);
      if (window.FocusBridgeVoice) window.FocusBridgeVoice.stop();
      state.screen = "atlas";
      state.profile = "atlas";
      state.atlas = { category: "all", search: "", selected: "root" };
      render();
      return;
    }
    if (mode === "targetlab" && completedQMM) {
      stopPreview("", false);
      stopAudio();
      if (window.FocusBridgeVoice) window.FocusBridgeVoice.stop();
      clearInterval(state.timer);
      state.screen = "targetlab";
      state.profile = "targetlab";
      state.targetLab = { status: "ready", rounds: [], targetIndex: null, error: "", saved: false };
      render();
      return;
    }
    stopPreview("", false);
    if (window.FocusBridgeVoice) window.FocusBridgeVoice.stop(); // prevent old preview voice after switching modes
    state.previewMessage = "";
    state.previewError = "";
    state.mode = ["settle", "qmm", "gdm", "energy", "tele", "chakra", "clair", "energy6", "cleanse7"].includes(mode) ? "settle" : "listen";
    state.profile = mode === "settle" || mode === "listen" ? "drift" : mode;
    const profile = PROFILES[state.profile];
    if (state.profile === "qmm" && !window.FocusBridgeQMM) {
      state.error = "Quiet Mind guidance is unavailable. Reload the app to retry.";
      state.screen = "home"; render(); return;
    }
    if (state.profile === "gdm" && !window.FocusBridgeGDM) {
      state.error = "Going Deeper guidance is unavailable. Reload the app to retry.";
      state.screen = "home"; render(); return;
    }
    if (state.profile === "energy" && !window.FocusBridgeBreathingEnergy) {
      state.error = "Breathing Energy guidance is unavailable. Reload the app to retry.";
      state.screen = "home"; render(); return;
    }
    if (state.profile === "tele" && !window.FocusBridgeTeleVisualization) {
      state.error = "Tele-Visualization guidance is unavailable. Reload to retry.";
      state.screen = "home"; render(); return;
    }
    if (["chakra", "clair"].includes(state.profile) && !chapterEngine()) {
      state.error = "Chapter 4/5 guidance is unavailable. Reload to retry.";
      state.screen = "home"; render(); return;
    }
    if (state.profile === "energy6" && !window.FocusBridgeEnergyImagery) {
      state.error = "Chapter 6 practice guidance is unavailable. Reload to retry.";
      state.screen = "home"; render(); return;
    }
    if (state.profile === "cleanse7" && !window.FocusBridgeCleansing) {
      state.error = "Chapter 7 guidance is unavailable. Reload to retry.";
      state.screen = "home"; render(); return;
    }
    if (state.profile === "intention" && !intentionEngine) {
      state.error = "Intention Studio did not load. Reload the page.";
      state.screen = "home"; render(); return;
    }
    if (state.profile === "intention") {
      state.intentionSpeak = false; // voice requires deliberate opt-in each visit.
      state.intentionConfirmDelete = false;
      state.intentionNotice = "";
    }
    state.duration = mode === "settle" ? 90 : profile.duration;
    state.qmmStage = 0;
    state.qmmVoice = false; // deliberate per-session opt-in
    state.gdmStage = 0;
    state.gdmVoice = false;
    state.gdmVisual = "ladder";
    state.energyStage = 0;
    state.energyVoice = false;
    state.energyVisual = "glow";
    state.teleStage = 0;
    state.teleVoice = false;
    state.chapterStage = 0;
    state.chapterVoice = false;
    state.energy6Stage = 0;
    state.energy6Voice = false;
    state.energy6Theme = "body";
    state.cleanse7Stage = 0;
    state.cleanse7Voice = false;
    state.cleanse7Style = "release";
    state.toneDifference = profile.difference;
    state.syncStage = 0;
    state.islandIndex = 0;
    if (profile.rife && !window.FocusBridgeRife) {
      state.error = "Audio frequency engine unavailable. Reload the app.";
      state.screen = "home";
      render();
      return;
    }
    if (profile.sync) {
      if (!window.FocusBridgeSync) {
        state.error = "Focus Sync engine was not loaded. Reload the app to retry.";
        state.screen = "home";
        render();
        return;
      }
      state.syncPlan = window.FocusBridgeSync.timeline(state.syncMinutes);
      state.duration = state.syncPlan.totalSeconds;
    }
    if (profile.rife) {
      // Isolate the audible waveform lab from the binaural/mixer profiles.
      state.surf = 0;
      state.bass = 0;
      state.beat = 0;
      state.rain = 0;
      state.wind = 0;
      state.hum = 0;
      state.tones = true;
    } else if (mode !== "settle") {
      const saved = profileMixes[state.profile] || (mode === "listen" ? mix : profile);
      state.surf = level(saved.surf, profile.surf);
      state.bass = level(saved.bass, profile.bass);
      state.beat = level(saved.beat, profile.beat);
      state.rain = level(saved.rain, profile.rain ?? 0);
      state.wind = level(saved.wind, profile.wind ?? 0);
      state.hum = level(saved.hum, profile.hum ?? 0);
      state.humNote = (window.FocusBridgeSoundscape?.HUM_NOTES || [])
        .some(note => note.name === saved.humNote) ? saved.humNote : "C4";
      state.tones = typeof saved.tones === "boolean" ? saved.tones : profile.tones;
      state.toneDifference = HOLISTIC_TONE_OPTIONS.includes(Number(saved.toneDifference))
        ? Number(saved.toneDifference) : profile.difference;
      saveMix();
    }
    state.safe = false;
    state.headphones = false;
    state.error = "";
    state.note = "";
    state.screen = "prepare";
    render();
  }
  function returnHome() {
    stopPreview("", false);
    stopAudio();
    clearInterval(state.timer);
    state.screen = "home";
    state.qmmNext = null;
    state.gdmNext = null;
    state.energyNext = null;
    state.error = "";
    render();
  }
  function openHolistic() {
    stopPreview("", false);
    stopAudio();
    state.screen = "holistic";
    state.error = "";
    render();
  }
  function returnToChoices() {
    state.qmmNext = null;
    state.gdmNext = null;
    state.energyNext = null;
    stopPreview("", false);
    if (window.FocusBridgeVoice) window.FocusBridgeVoice.stop(); // cancel audition on navigation
    state.screen = PROFILES[state.profile]?.holistic ? "holistic" : "home";
    state.error = "";
    render();
  }

  function changeRifeSetting(key, value) {
    if (state.profile !== "rife" || !window.FocusBridgeRife) return;
    stopPreviewForChange();
    state.rife = window.FocusBridgeRife.config({ ...state.rife, [key]: value });
    try { localStorage.setItem(RIFE_SETTINGS_KEY, JSON.stringify(state.rife)); } catch {}
    render();
  }

  async function startAudio(preview = false) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) throw new Error("Web Audio is not supported by this browser.");
    const context = new Context();
    const nodes = [];
    const audio = { context, nodes, bus: null };
    if (preview) state.previewAudio = audio;
    else state.audio = audio;
    const seconds = preview ? PREVIEW_SECONDS : state.duration;
    try {
      // Both oscillator tones and six-layer ambience feed a common output bus.
      // The experimental Rife module remains isolated until its own routing QA.
      if (state.profile !== "rife" && window.FocusBridgeAudioEngine) {
        audio.bus = window.FocusBridgeAudioEngine.create(context, audio,
          { level: state.master });
      }
      if (state.profile === "rife") {
        await context.resume();
        if (context.state !== "running")
          throw new Error("The browser suspended audio. Check playback permissions.");
        if ((preview ? state.previewAudio : state.audio) !== audio)
          throw new Error("Audio request cancelled.");
        window.FocusBridgeRife.schedule(context, state.rife, seconds, audio, preview);
        return;
      }
      const merger = context.createChannelMerger(2);
      const left = context.createOscillator();
      const right = context.createOscillator();
      const leftGain = context.createGain();
      const rightGain = context.createGain();
      const volume = context.createGain();
      left.type = "sine";
      right.type = "sine";
      // Different profile pairs remain original audio experiments, not EEG control.
      const profile = PROFILES[state.profile];
      left.frequency.value = profile.carrier;
      right.frequency.value = profile.carrier + (profile.holistic ? state.toneDifference : profile.difference);
      leftGain.gain.value = 0.5;
      rightGain.gain.value = 0.5;
      const startAt = context.currentTime;
      // Sleep tones, when explicitly enabled, fade away after <= 30 minutes.
      // The ambience can continue for the full duration with no abrupt ending.
      const toneSeconds = state.profile === "sleep" ? Math.min(1800, seconds) : seconds;
      const endAt = startAt + toneSeconds;
      volume.gain.setValueAtTime(0.0001, startAt);
      volume.gain.linearRampToValueAtTime(0.035, startAt + 1.5);
      volume.gain.setValueAtTime(0.035, endAt - 3);
      volume.gain.linearRampToValueAtTime(0.0001, endAt);
      if (profile.sync && !preview) {
        window.FocusBridgeSync.scheduleToneJourney(right.frequency, profile.carrier, startAt, state.syncPlan);
      } // A preview samples the opening Focus Sync stage only.
      if (state.profile === "explore" && toneSeconds > 300) {
        right.frequency.linearRampToValueAtTime(profile.carrier + 4.5, startAt + toneSeconds * .55);
        right.frequency.linearRampToValueAtTime(profile.carrier + profile.difference, endAt);
      }
      if (state.tones) {
        left.connect(leftGain).connect(merger, 0, 0);
        right.connect(rightGain).connect(merger, 0, 1);
        merger.connect(volume).connect(audio.bus ? audio.bus.input : context.destination);
        nodes.push(left, right, leftGain, rightGain, merger, volume);
      }
      await context.resume();
      if (context.state !== "running") throw new Error("The browser suspended audio. Check playback permissions.");
      if ((preview ? state.previewAudio : state.audio) !== audio)
        throw new Error("Audio request cancelled.");
      if (state.tones) {
        left.start();
        right.start();
        // Hardware-side end time prevents tones running indefinitely in a suspended tab.
        left.stop(endAt + 0.1);
        right.stop(endAt + 0.1);
      }
      const ambienceStarted = window.FocusBridgeSoundscape
        ? window.FocusBridgeSoundscape.schedule(context,
            { surf: state.surf, bass: state.bass, beat: state.beat,
              rain: state.rain, wind: state.wind, hum: state.hum,
              humNote: state.humNote, space: profile.space,
              destination: audio.bus ? audio.bus.input : context.destination },
            seconds, audio)
        : false;
      if (!state.tones && !ambienceStarted)
        throw new Error("The soundscape engine did not start.");
    } catch (error) {
      if ((preview ? state.previewAudio : state.audio) === audio) stopAudio(preview);
      else closeAudio(audio); // navigation may have replaced the preview while resume was pending
      throw error;
    }
  }
  function closeAudio(audio) {
    if (!audio) return;
    for (const node of audio.nodes) {
      try { if (typeof node.stop === "function") node.stop(); } catch {}
      try { node.disconnect(); } catch {}
    }
    try { if (audio.context.state !== "closed") audio.context.close(); } catch {}
  }
  function stopAudio(preview = false, immediate = false) {
    if (!preview && window.FocusBridgeVoice) window.FocusBridgeVoice.stop();
    const audio = preview ? state.previewAudio : state.audio;
    if (preview) state.previewAudio = null;
    else state.audio = null;
    // Audio stop is logically immediate. Real Web Audio fades for 140 ms
    // before context cleanup to avoid clicks from abrupt disconnection.
    if (audio && audio.bus && !immediate && window.FocusBridgeAudioEngine) {
      window.FocusBridgeAudioEngine.beginStop(audio.bus, () => closeAudio(audio));
    } else {
      closeAudio(audio);
    }
  }
  function stopPreview(message = "", rerender = true) {
    const wasActive = state.previewActive || state.previewStarting || !!state.previewAudio;
    state.previewNonce++;
    clearInterval(state.previewTimer);
    state.previewTimer = null;
    state.previewActive = false;
    state.previewStarting = false;
    stopAudio(true);
    state.previewMessage = message;
    if (rerender && wasActive && state.screen === "prepare") render();
  }
  function stopPreviewForChange() {
    if (state.previewAudio || state.previewStarting)
      stopPreview("Settings changed. Preview your updated mix.", false);
  }
  async function startPreview() {
    // Preview respects the same safety/readiness checks as full playback.
    if (state.screen !== "prepare" || state.mode !== "listen" || state.starting ||
        state.previewStarting || state.previewActive || !state.safe ||
        (headphoneRequired() && !state.headphones) || allSoundOff()) return;
    const nonce = ++state.previewNonce;
    state.previewStarting = true;
    state.previewError = "";
    state.previewMessage = "";
    render();
    try {
      if (window.FocusBridgeVoice) window.FocusBridgeVoice.stop();
      await startAudio(true);
      if (state.previewNonce !== nonce || state.screen !== "prepare") return;
      state.previewStarting = false;
      state.previewActive = true;
      state.previewStartedAt = Date.now();
      state.previewTimer = setInterval(() => {
        if (!state.previewActive || state.previewNonce !== nonce) return;
        const remaining = Math.max(0,
          PREVIEW_SECONDS - (Date.now() - state.previewStartedAt) / 1000);
        const display = root.querySelector("#q-preview-remaining");
        if (display) display.textContent = Math.ceil(remaining) + " sec remaining";
        if (remaining <= 0)
          stopPreview("Preview finished. Adjust the mix or begin your session.");
      }, 200);
      render();
    } catch (error) {
      if (state.previewNonce !== nonce) return;
      state.previewStarting = false;
      state.previewActive = false;
      state.previewError = "Preview could not play: " + (error.message || String(error));
      render();
    }
  }
  function allSoundOff() {
    return !state.tones && !state.surf && !state.bass && !state.beat &&
      !state.rain && !state.wind && !state.hum;
  }
  function headphoneRequired() {
    return state.mode === "listen" && state.tones;
  }

  async function startSession() {
    if (state.screen !== "prepare" || state.starting || state.previewStarting || !state.safe ||
        (state.profile === "intention" && !state.intentionScript) ||
        (state.mode === "listen" && ((headphoneRequired() && !state.headphones) ||
          (allSoundOff() && state.profile !== "intention")))) return;
    stopPreview("", false); // no preview oscillator may overlap the committed session
    if (window.FocusBridgeVoice) window.FocusBridgeVoice.stop();
    state.starting = true;
    state.error = "";
    render();
    state.elapsedMs = 0;
    state.paused = false;
    state.syncStage = 0;
    state.islandIndex = 0;
    state.qmmStage = 0;
    state.gdmStage = 0;
    state.energyStage = 0;
    state.teleStage = 0;
    state.chapterStage = 0;
    state.energy6Stage = 0;
    state.cleanse7Stage = 0;
    state.sleepCueIndex = 0;
    state.intentionNextCue = state.profile === "intention" && intentionEngine
      ? (intentionEngine.CADENCES[state.intentionCadence] || null) : null;
    if (state.mode === "listen" && !allSoundOff()) {
      try { await startAudio(); }
      catch (error) {
        state.starting = false;
        state.error = "Audio could not start: " + (error.message || String(error)) +
          ". You can still choose Settle without audio.";
        render();
        return;
      }
    }
    state.starting = false;
    state.screen = "running";
    state.lastTick = Date.now();
    clearInterval(state.timer);
    state.timer = setInterval(tick, 200);
    render();
    if (state.profile === "sync" && state.syncPlan)
      speakGate(window.FocusBridgeSync.stageAt(state.syncPlan, 0));
    if (state.profile === "qmm") speakQMM(window.FocusBridgeQMM.stageAt(0, state.duration));
    if (state.profile === "gdm") speakGDM(window.FocusBridgeGDM.stageAt(0, state.duration, state.gdmVisual));
    if (state.profile === "energy") speakEnergy(window.FocusBridgeBreathingEnergy.stageAt(0, state.duration, state.energyVisual));
    if (state.profile === "tele") speakTele(window.FocusBridgeTeleVisualization.stageAt(0, state.duration));
    if (chapterEngine()) speakChapter(chapterEngine().stageAt(0, state.duration));
    if (state.profile === "energy6") speakEnergy6(window.FocusBridgeEnergyImagery.stageAt(0, state.duration, state.energy6Theme));
    if (state.profile === "cleanse7") speakCleanse7(window.FocusBridgeCleansing.stageAt(0, state.duration, state.cleanse7Style));
    if (state.profile === "sleep" && state.mode === "listen") {
      if (speakSleep("start") && state.sleepGuide) state.sleepCueIndex = 1;
    }
    if (state.profile === "intention" && state.intentionSpeak && state.mode === "listen")
      intentionVoice();
  }
  function cue() {
    if (state.profile === "qmm" && window.FocusBridgeQMM)
      return window.FocusBridgeQMM.stageAt(state.elapsedMs / 1000, state.duration).prompt;
    if (state.profile === "gdm" && window.FocusBridgeGDM)
      return window.FocusBridgeGDM.stageAt(state.elapsedMs / 1000, state.duration, state.gdmVisual).prompt;
    if (state.profile === "energy" && window.FocusBridgeBreathingEnergy)
      return window.FocusBridgeBreathingEnergy.stageAt(state.elapsedMs / 1000, state.duration, state.energyVisual).prompt;
    if (state.profile === "tele" && window.FocusBridgeTeleVisualization)
      return window.FocusBridgeTeleVisualization.stageAt(state.elapsedMs / 1000, state.duration).prompt;
    if (chapterEngine()) return chapterEngine().stageAt(state.elapsedMs / 1000, state.duration).prompt;
    if (state.profile === "energy6" && window.FocusBridgeEnergyImagery)
      return window.FocusBridgeEnergyImagery.stageAt(state.elapsedMs / 1000, state.duration, state.energy6Theme).prompt;
    if (state.profile === "cleanse7" && window.FocusBridgeCleansing)
      return window.FocusBridgeCleansing.stageAt(state.elapsedMs / 1000, state.duration, state.cleanse7Style).prompt;
    if (state.profile === "lost")
      return ISLAND_SEGMENTS[islandStageAt(state.elapsedMs, state.duration)].cue;
    if (state.profile === "rife" && state.mode === "listen")
      return "Notice the sound only if comfortable. A pitch is not a medical treatment.";
    if (state.profile === "sync" && state.syncPlan)
      return window.FocusBridgeSync.stageAt(state.syncPlan, state.elapsedMs / 1000).prompt;
    if (state.profile === "sleep" && state.mode === "listen")
      return "Nothing to follow. Let the quiet soundscape carry on while you rest.";
    if (state.profile === "intention" && state.mode === "listen")
      return state.intentionSpeak ? "Listen to your chosen words, or simply read them." :
        "Read your words at your own pace. Silence is allowed.";
    if (state.profile === "focus" && state.mode === "listen")
      return "Let the sound stay in the background. Give your attention to what matters.";
    if (state.profile === "explore" && state.mode === "listen")
      return "Observe any imagery or sensations without forcing an interpretation.";
    const fraction = state.elapsedMs / (state.duration * 1000);
    if (fraction < .25) return "Notice the room around you. There is nothing to accomplish.";
    if (fraction < .5) return "If a thought arrives, you can notice it without following it.";
    if (fraction < .75) return "Feel where your body meets the chair, bed, or floor.";
    return "Take your time. Let your breathing find its own comfortable rhythm.";
  }
  function tick() {
    if (state.screen !== "running") return;
    const now = Date.now();
    if (!state.paused) state.elapsedMs += Math.max(0, now - state.lastTick);
    state.lastTick = now;
    if (state.elapsedMs >= state.duration * 1000) {
      state.elapsedMs = state.duration * 1000;
      if (state.profile === "lost") state.islandIndex = ISLAND_SEGMENTS.length - 1;
      if (state.profile === "sync" && state.syncPlan) {
        state.syncStage = window.FocusBridgeSync.stageAt(state.syncPlan, state.duration).index;
      }
      finishSession(false);
      return;
    }
    if (state.profile === "qmm" && !state.paused && window.FocusBridgeQMM) {
      const phase = window.FocusBridgeQMM.stageAt(state.elapsedMs / 1000, state.duration);
      if (phase.index !== state.qmmStage) {
        state.qmmStage = phase.index;
        render();
        speakQMM(phase);
      }
    }
    if (state.profile === "gdm" && !state.paused && window.FocusBridgeGDM) {
      const phase = window.FocusBridgeGDM.stageAt(state.elapsedMs / 1000, state.duration, state.gdmVisual);
      if (phase.index !== state.gdmStage) {
        state.gdmStage = phase.index;
        render();
        speakGDM(phase);
      }
    }
    if (state.profile === "energy" && !state.paused && window.FocusBridgeBreathingEnergy) {
      const phase = window.FocusBridgeBreathingEnergy.stageAt(state.elapsedMs / 1000, state.duration, state.energyVisual);
      if (phase.index !== state.energyStage) {
        state.energyStage = phase.index;
        render();
        speakEnergy(phase);
      }
    }
    if (state.profile === "tele" && !state.paused && window.FocusBridgeTeleVisualization) {
      const phase = window.FocusBridgeTeleVisualization.stageAt(state.elapsedMs / 1000, state.duration);
      if (phase.index !== state.teleStage) {
        state.teleStage = phase.index;
        render();
        speakTele(phase);
      }
    }
    if (chapterEngine() && !state.paused) {
      const phase = chapterEngine().stageAt(state.elapsedMs / 1000, state.duration);
      if (phase.index !== state.chapterStage) {
        state.chapterStage = phase.index;
        render();
        speakChapter(phase);
      }
    }
    if (state.profile === "energy6" && !state.paused && window.FocusBridgeEnergyImagery) {
      const phase = window.FocusBridgeEnergyImagery.stageAt(state.elapsedMs / 1000, state.duration, state.energy6Theme);
      if (phase.index !== state.energy6Stage) {
        state.energy6Stage = phase.index;
        render();
        speakEnergy6(phase);
      }
    }
    if (state.profile === "cleanse7" && !state.paused && window.FocusBridgeCleansing) {
      const phase = window.FocusBridgeCleansing.stageAt(state.elapsedMs / 1000, state.duration, state.cleanse7Style);
      if (phase.index !== state.cleanse7Stage) {
        state.cleanse7Stage = phase.index;
        render();
        speakCleanse7(phase);
      }
    }
    if (state.profile === "lost" && !state.paused) {
      const islandIndex = islandStageAt(state.elapsedMs, state.duration);
      if (islandIndex !== state.islandIndex) {
        state.islandIndex = islandIndex;
        render(); // Update only when the chapter changes; no audible alarm.
      }
    }
    if (state.profile === "sync" && state.syncPlan && !state.paused) {
      const stage = window.FocusBridgeSync.stageAt(state.syncPlan, state.elapsedMs / 1000);
      if (stage.index !== state.syncStage) {
        state.syncStage = stage.index;
        render(); // Only rerender when a symbolic station changes, not every 200ms.
        speakGate(stage);
      }
    }
    if (state.profile === "sleep" && !state.paused && state.sleepCueIndex === 1 &&
        window.FocusBridgeSleep && window.FocusBridgeSleep.shouldSpeakSecond(
          sleepConfig(), state.elapsedMs / 1000, false)) {
      state.sleepCueIndex = 2; // never repeat on a throttled tab.
      speakSleep("settle");
    }
    if (state.profile === "intention" && !state.paused && state.intentionSpeak &&
        intentionEngine && state.intentionNextCue) {
      const elapsed = state.elapsedMs / 1000;
      const remaining = state.duration - elapsed;
      if (intentionEngine.cueDue(elapsed, state.intentionNextCue, remaining))
        intentionVoice();
      // Skip overdue cues when a browser tab resumes rather than stacking speech.
      const interval = intentionEngine.CADENCES[state.intentionCadence] || 0;
      if (interval) {
        while (state.intentionNextCue <= elapsed) state.intentionNextCue += interval;
      }
    }
    const breath = root.querySelector("#q-breath-phase");
    if (breath && state.breathGuide) breath.textContent = state.paused ? "Breathing companion paused" : breathCue();
    const meter = root.querySelector("#q-master-meter-fill");
    if (meter && state.audio && state.audio.bus && window.FocusBridgeAudioEngine) {
      const value = window.FocusBridgeAudioEngine.peak(state.audio.bus);
      if (value !== null) {
        meter.style.width = Math.round(value * 100) + "%";
        const text = root.querySelector("#q-meter-reading");
        if (text) text.textContent = Math.round(value * 100) + "% digital peak";
      }
    }
    const timer = root.querySelector("#fb21-q-timer");
    const bar = root.querySelector("#fb21-q-progress");
    const prompt = root.querySelector("#fb21-q-cue");
    if (timer) timer.textContent = formatTime(state.duration - state.elapsedMs / 1000);
    if (bar) bar.style.width = Math.round(100 * state.elapsedMs / (state.duration * 1000)) + "%";
    if (prompt) prompt.textContent = cue();
  }
  async function togglePause() {
    if (state.screen !== "running") return;
    state.paused = !state.paused;
    state.lastTick = Date.now();
    if (state.audio) {
      try {
        if (state.paused) await state.audio.context.suspend();
        else await state.audio.context.resume();
      } catch {
        finishSession(true);
        return;
      }
    }
    if ((state.voiceGuide || state.qmmVoice || state.gdmVoice || state.energyVoice || state.teleVoice || state.chapterVoice || state.energy6Voice || state.cleanse7Voice || state.sleepGuide || state.intentionSpeak) && window.FocusBridgeVoice) {
      if (state.paused) window.FocusBridgeVoice.pause();
      else window.FocusBridgeVoice.resume();
    }
    render();
  }
  function finishSession(interrupted) {
    clearInterval(state.timer);
    state.timer = null;
    stopAudio();
    state.paused = false;
    state.interrupted = interrupted;
    state.screen = "return";
    render();
  }
  function saveReflection() {
    const elapsed = Math.round(state.elapsedMs / 1000);
    if (elapsed < 1) return returnHome();
    let ledger;
    try {
      const parsed = JSON.parse(localStorage.getItem(LEDGER_KEY) || "[]");
      ledger = Array.isArray(parsed) ? parsed : [];
    } catch { ledger = []; }
    const receipt = {
      session_id: (window.crypto && typeof crypto.randomUUID === "function")
        ? crypto.randomUUID() : "quiet-" + Date.now(),
      timestamp: new Date().toISOString(),
      app: "FocusBridge21 Quiet Deck extended audio",
      preset: ["qmm", "gdm", "energy", "tele", "chakra", "clair", "energy6", "cleanse7"].includes(state.profile) ? PROFILES[state.profile].label : state.mode === "settle" || state.profile === "drift" ? "Foundation" : PROFILES[state.profile].label,
      target_gate: state.mode === "settle" && !["qmm", "gdm", "energy", "tele", "chakra", "clair", "energy6", "cleanse7"].includes(state.profile) || state.profile === "drift" ? 10 : null,
      duration_min: state.duration / 60,
      actual_elapsed_sec: elapsed,
      island_108: state.profile === "lost" ? {
        source: "LOST-inspired fan tribute, original audio, no affiliation",
        numbers: ISLAND_SEGMENTS.map(segment => segment.number),
        complete_default_duration_seconds: 6480,
        selected_duration_seconds: state.duration,
        last_chapter: ISLAND_SEGMENTS[state.islandIndex].title,
        completed: !state.interrupted && elapsed >= state.duration - 1,
        note: "The numbers are symbolic listening chapters, not a medical or paranormal signal"
      } : null,
      sync_journey: state.profile === "sync" && state.syncPlan ? {
        published_level_labels: window.FocusBridgeSync.GATES.map(gate => gate.level),
        last_listed_level: state.syncStage >= window.FocusBridgeSync.GATES.length ? "Return" : window.FocusBridgeSync.GATES[state.syncStage].level,
        scheduled_full_journey: true,
        finished_full_journey: !state.interrupted && elapsed >= state.duration - 1,
        minutes_per_level: state.syncMinutes,
        interpretation: "Time-based labels and personal reflection, not detected states"
      } : null,
      guidance_mode: state.profile === "qmm" ? "QMM silent-first guided attention" : state.profile === "gdm" ? "GDM silent-first guided visualization" : state.profile === "energy" ? "Breathing Energy: guided imagination" : state.profile === "tele" ? "Tele-Visualization: guided imagination" : chapterEngine() ? "Source-attributed, silent-first guided imagery" : state.profile === "energy6" ? "Chapter 6 source-attributed, silent-first imaginary energy movement" : state.profile === "cleanse7" ? "Chapter 7 symbolic seven-color imagery, not treatment" : "Quiet Deck " + state.mode,
      quiet_mind: state.profile === "qmm" ? {
        progression: "7 timed attention prompts",
        completed_timed_practice: !state.interrupted && elapsed >= state.duration - 1,
        next_exercise: state.qmmNext === "targetlab" ? "Blind Target Lab" : (state.qmmNext ? PROFILES[state.qmmNext]?.label || null : null),
        last_phase: window.FocusBridgeQMM.stageAt(elapsed, state.duration).id,
        voice_opted_in: state.qmmVoice && voiceAvailable(),
        evidence_boundary: "Reflective attention practice; no measurement of thought silence or EEG"
      } : null,
      going_deeper: state.profile === "gdm" ? {
        progression: "5 timed imaginative relaxation prompts",
        visual_choice: state.gdmVisual,
        last_phase: window.FocusBridgeGDM.stageAt(elapsed, state.duration, state.gdmVisual).id,
        completed_timed_practice: !state.interrupted && elapsed >= state.duration - 1,
        next_exercise: state.gdmNext ? PROFILES[state.gdmNext].label : null,
        next_rung: PROFILES.energy.label,
        voice_opted_in: state.gdmVoice && voiceAvailable(),
        evidence_boundary: "Self-reported visual relaxation, not EEG-confirmed alpha/theta or evidence of an external realm"
      } : null,
      breathing_energy: state.profile === "energy" ? {
        progression: "Six timed relaxation and imagery prompts",
        visual_choice: state.energyVisual,
        last_phase: window.FocusBridgeBreathingEnergy.stageAt(elapsed, state.duration, state.energyVisual).id,
        completed_timed_practice: !state.interrupted && elapsed >= state.duration - 1,
        next_exercise: state.energyNext ? PROFILES[state.energyNext].label : null,
        voice_opted_in: state.energyVoice && voiceAvailable(),
        evidence_boundary: "Imagined light and self-reported body sensations; no detection or transfer of external energy"
      } : null,
      tele_visualization: state.profile === "tele" ? {
        progression: "7-stage forest, river, misty pool and imagined echo",
        last_phase: window.FocusBridgeTeleVisualization.stageAt(elapsed, state.duration).id,
        completed_timed_practice: !state.interrupted && elapsed >= state.duration - 1,
        voice_opted_in: state.teleVoice && voiceAvailable(),
        evidence_boundary: "Imagined scene detail; not verified perception of another place"
      } : null,
      chakra_light: state.profile === "chakra" ? {
        book_chapter: 4,
        sequence: ["Crown", "Third Eye", "Throat", "Heart", "Solar Plexus", "Sacral", "Root"],
        last_phase: window.FocusBridgeChakraLight.stageAt(elapsed, state.duration).id,
        completed_timed_practice: !state.interrupted && elapsed >= state.duration - 1,
        voice_opted_in: state.chapterVoice && voiceAvailable(),
        evidence_boundary: "Symbolic light visualization only; no chakra opening, bioenergy, or health effect measured"
      } : null,
      clairaudience_imagery: state.profile === "clair" ? {
        book_chapter: 5,
        practice: "Auditory attention and symbolic outward/returning wave",
        last_phase: window.FocusBridgeClairaudience.stageAt(elapsed, state.duration).id,
        completed_timed_practice: !state.interrupted && elapsed >= state.duration - 1,
        voice_opted_in: state.chapterVoice && voiceAvailable(),
        evidence_boundary: "No evidence of voices or messages from another realm; ordinary hearing and imagination distinguished"
      } : null,
      controlling_energy_imagery: state.profile === "energy6" ? {
        book_chapter: 6,
        theme: state.energy6Theme,
        theme_label: window.FocusBridgeEnergyImagery.THEMES[state.energy6Theme].label,
        last_phase: window.FocusBridgeEnergyImagery.stageAt(elapsed, state.duration, state.energy6Theme).id,
        completed_timed_practice: !state.interrupted && elapsed >= state.duration - 1,
        voice_opted_in: state.energy6Voice && voiceAvailable(),
        evidence_boundary: "Imagined movements only; no measured energy transfer, matter manipulation, mind reading or remote sensing"
      } : null,
      cleansing_imagery: state.profile === "cleanse7" ? {
        book_chapter: 7,
        sequence: window.FocusBridgeCleansing.CENTERS.map(center => center.title),
        color_sequence: window.FocusBridgeCleansing.CENTERS.map(center => center.color),
        imagery_style: state.cleanse7Style,
        last_phase: window.FocusBridgeCleansing.stageAt(elapsed, state.duration, state.cleanse7Style).id,
        completed_timed_practice: !state.interrupted && elapsed >= state.duration - 1,
        voice_opted_in: state.cleanse7Voice && voiceAvailable(),
        evidence_boundary: "Imagined colors and metaphorical release; no chakra opening, medical cleansing, illness treatment, or paranormal result measured"
      } : null,
      voice_guidance_opted_in: ((state.profile === "sync" && state.voiceGuide) ||
        (state.profile === "qmm" && state.qmmVoice) ||
        (state.profile === "gdm" && state.gdmVoice) ||
        (state.profile === "energy" && state.energyVoice) ||
        (state.profile === "tele" && state.teleVoice) ||
        (["chakra", "clair"].includes(state.profile) && state.chapterVoice) ||
        (state.profile === "energy6" && state.energy6Voice) ||
        (state.profile === "cleanse7" && state.cleanse7Voice)) && voiceAvailable(),
      optional_breath_visual: state.profile === "sync" && state.breathGuide,
      intention_studio: state.profile === "intention" ? {
        voice_opted_in: state.intentionSpeak && voiceAvailable(),
        cadence: state.intentionCadence,
        uses_saved_recipe: !!state.intentionId,
        personal_script_excluded: true
      } : null,
      sleep_wind_down: state.profile === "sleep" ? {
        spoken_guide_opted_in: state.sleepGuide && voiceAvailable(),
        spoken_personal_intention_opted_in: state.sleepSpeakIntention &&
          !!state.sleepIntention && voiceAvailable(),
        dimmed_display: state.sleepDim,
        saved_intention_text_excluded: true
      } : null,
      rife_audio_lab: state.profile === "rife" ? {
        frequency_hz: state.rife.frequency,
        waveform: state.rife.waveform,
        motion: state.rife.motion,
        intensity_percent_of_capped_gain: state.rife.intensity,
        output_type: "audible Web Audio, not RF, EMF or electrotherapy",
        interpretation: "Audio demonstration, not a medical treatment"
      } : null,
      audio_params: { master_percent: state.master,
        engine: state.profile === "rife" ? "audible-waveform-lab-v1"
        : state.mode === "listen" ? "original-browser-soundscape-v16" : "none",
        profile: state.mode === "listen" ? state.profile : "silent",
        difference_hz: state.mode === "listen" && state.tones && state.profile !== "rife"
          ? state.toneDifference : null,
        space_percent: state.mode === "listen" ? PROFILES[state.profile].space : 0,
        stereo_tones: state.mode === "listen" && state.tones && state.profile !== "rife",
        surf: state.mode === "listen" ? state.surf : 0,
        bass: state.mode === "listen" ? state.bass : 0,
        beat: state.mode === "listen" ? state.beat : 0,
        rain: state.mode === "listen" ? state.rain : 0,
        wind: state.mode === "listen" ? state.wind : 0,
        hum: state.mode === "listen" ? state.hum : 0,
        hum_note: state.mode === "listen" && state.hum > 0 ? state.humNote : null },
      notes: state.note.trim(),
      claim_boundary: "Self-reported session; not evidence of a neurological or out-of-body state"
    };
    try {
      localStorage.setItem(LEDGER_KEY, JSON.stringify([receipt, ...ledger]));
      state.screen = "saved";
      render();
    } catch {
      state.error = "Your browser could not save locally. Your note remains visible here.";
      render();
    }
  }
  // The Chapter 3 digital target practice is a self-contained, casual blind
  // experiment. We never show a target until all 20 guesses have been locked.
  // This differs from the author's friend-placed object in an adjacent room.
  function beginTargetBlock() {
    if (state.screen !== "targetlab" || !state.targetLab ||
        !["ready", "complete"].includes(state.targetLab.status) ||
        !window.FocusBridgeTeleVisualization) return;
    const index = window.FocusBridgeTeleVisualization.chooseTarget(window.crypto);
    if (index === null) {
      state.targetLab.error = "Secure browser randomness is unavailable. No target block was started.";
      render();
      return;
    }
    state.targetLab = {status:"active",rounds:[],targetIndex:index,error:"",saved:false};
    render();
  }
  function guessTarget(choice) {
    const lab = state.targetLab, engine = window.FocusBridgeTeleVisualization;
    if (state.screen !== "targetlab" || !lab || !engine || lab.status !== "active") return;
    const guess = Number(choice);
    if (!Number.isInteger(guess) || guess < 0 || guess >= engine.TARGETS.length) return;
    // Target selection happened before the guess. The target stays hidden
    // until the complete block is over, preventing trial-by-trial feedback.
    const rounds = [...lab.rounds,{guess,target:lab.targetIndex}];
    if (rounds.length < engine.TRIAL_COUNT) {
      const next = engine.chooseTarget(window.crypto);
      if (next === null) {
        lab.status = "error";
        lab.error = "Randomness became unavailable. This incomplete block was discarded.";
        lab.rounds = [];
        lab.targetIndex = null;
        render(); return;
      }
      lab.rounds = rounds;
      lab.targetIndex = next;
      render(); return;
    }
    const outcome = engine.scoreBlock(rounds);
    if (!outcome) {
      lab.status = "error";
      lab.error = "Invalid trial data. Nothing was scored or saved.";
      lab.rounds = [];
      lab.targetIndex = null;
      render(); return;
    }
    lab.status = "complete";
    lab.rounds = rounds;
    lab.targetIndex = null;
    lab.outcome = outcome;
    // Full raw block is recorded once in the existing, local-only Signal
    // Ledger so the guess and target lists cannot be revised inside the UI.
    // Browser storage is editable by its owner, and this is not independent
    // scientific verification.
    let ledger = [];
    try {
      const old = JSON.parse(localStorage.getItem(LEDGER_KEY) || "[]");
      if (Array.isArray(old)) ledger = old;
    } catch {}
    try {
      const receipt = {
        session_id:"tele-target-" + Date.now(),
        timestamp:new Date().toISOString(),
        app:"FocusBridge21 Quiet Deck",
        preset:"Blind Target Lab",
        target_gate:null,
        duration_min:null,
        actual_elapsed_sec:null,
        guidance_mode:"Chapter 3 browser-only four-choice target block",
        tele_target_lab:{
          method:"20 independent browser-random 4-choice targets; no feedback until last guess",
          trials:outcome.trials,
          hits:outcome.hits,
          chance_baseline:outcome.chanceProbability,
          expected_chance_hits:outcome.expectedChanceHits,
          guesses:rounds.map(x=>engine.TARGETS[x.guess].id),
          targets:rounds.map(x=>engine.TARGETS[x.target].id),
          evidence_boundary:"Uncontrolled browser exercise; no evidence of remote perception"
        },
        notes:"",
        claim_boundary:"This digital matching task is not the author's physical hidden-object protocol or proof of remote viewing."
      };
      localStorage.setItem(LEDGER_KEY,JSON.stringify([receipt,...ledger]));
      lab.saved = true;
    } catch {
      lab.error = "Completed block is visible here, but browser storage could not save it.";
    }
    render();
  }

  function frame(inner) {
    return [
      '<div class="q-shell">',
      '<header class="q-header"><div class="q-brand"><span class="q-sigil">Φ</span><div>',
      '<strong>FocusBridge21</strong><small>THE QUIET DECK · v2.7</small></div></div>',
      '<button type="button" class="q-text-button" data-action="lab">All tools &amp; labs <span aria-hidden="true">↗</span></button></header>',
      '<main class="q-main">', inner, '</main>',
      '<footer class="q-footer"><span>Local-first · No account · Nothing to prove</span>',
      '<span>Original audio experiments. No guaranteed focus states or out-of-body experiences.</span></footer>',
      '</div>'
    ].join("");
  }
  function render() {
    let content = "";
    if (state.screen === "home") {
      content = [
        '<div class="q-eyebrow">A calm place for a curious mind</div>',
        '<h1>Start where <em>you are.</em></h1>',
        '<p class="q-lead">You do not need to empty your mind, reach a gate, or do this perfectly.',
        ' Choose a little room to breathe, or open the full laboratory whenever curiosity strikes.</p>',
        '<div class="q-choices">',
        '<button type="button" data-action="settle" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">◌</span><span class="q-choice-kicker">NO HEADPHONES NEEDED</span>',
        '<strong>Just settle</strong><span>Quiet awareness, no tones. Start with 90 seconds.</span>',
        '<span class="q-choice-link">Begin gently →</span></button>',
        '<button type="button" data-action="qmm" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">◯</span><span class="q-choice-kicker">SILENT-FIRST · 3 TO 30 MIN</span>',
        '<strong>Quiet Mind · QMM</strong><span>Seven steps: soften your gaze, natural breath, open listening, and gentle release of thoughts.</span>',
        '<span class="q-choice-link">Practice quiet attention →</span></button>',
        '<button type="button" data-action="gdm" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">▽</span><span class="q-choice-kicker">CHAPTER 2 · REQUIRES QMM</span>',
        '<strong>Going Deeper · GDM</strong><span>Follow QMM with gentle imagined descent, then optionally continue to Breathing Energy.</span>',
        '<span class="q-choice-link">Start from QMM →</span></button>',
        '<button type="button" data-action="energy" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">✧</span><span class="q-choice-kicker">CHAPTER 2 · REQUIRES QMM + GDM</span>',
        '<strong>Breathing Energy</strong><span>Explore the book\'s golden-white light metaphor with comfortable breathing and a grounded return.</span>',
        '<span class="q-choice-link">Start at QMM →</span></button>',
        '<button type="button" data-action="tele" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">♧</span><span class="q-choice-kicker">CHAPTER 3 · AFTER QMM</span>',
        '<strong>Tele-Visualization</strong><span>Imagine the forest, river and mist-covered pool described in the book.</span>',
        '<span class="q-choice-link">Start with Quiet Mind →</span></button>',
        '<button type="button" data-action="targetlab" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">▣</span><span class="q-choice-kicker">CHAPTER 3 · BLIND TARGET EXPERIMENT</span>',
        '<strong>Blind Target Lab</strong><span>Twenty hidden four-choice targets, locked guesses and chance-baseline results. No external surveillance.</span>',
        '<span class="q-choice-link">Begin with Quiet Mind →</span></button>',
        '<button type="button" data-action="atlas" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">◎</span><span class="q-choice-kicker">CHAPTER 4 · REFERENCE, NOT MEDITATION</span>',
        '<strong>Human Body Atlas</strong><span>Explore the book\'s chakras, Dan Tiens and Hara model alongside established anatomy and evidence.</span>',
        '<span class="q-choice-link">Open the atlas →</span></button>',
        '<button type="button" data-action="chakra" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">✳</span><span class="q-choice-kicker">CHAPTER 4 · AFTER QMM</span>',
        '<strong>Seven-Center Light Meditation</strong><span>Crown-to-Root imagined white or golden light, with no claims of healing or chakra opening.</span>',
        '<span class="q-choice-link">Begin with Quiet Mind →</span></button>',
        '<button type="button" data-action="clair" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">◉</span><span class="q-choice-kicker">CHAPTER 5 · AFTER QMM + GDM</span>',
        '<strong>Clairaudience · Listening Imagery</strong><span>Explore auditory attention and imagined waves. No external messages or voices are required.</span>',
        '<span class="q-choice-link">Begin with Quiet Mind →</span></button>',
        '<button type="button" data-action="energy6" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">◇</span><span class="q-choice-kicker">CHAPTER 6 · AFTER QMM</span>',
        '<strong>Controlling Energy · Imagery Studio</strong><span>Explore mental-body, Earth, water and forest imagery with no physical energy claims.</span>',
        '<span class="q-choice-link">Start with Quiet Mind →</span></button>',
        '<button type="button" data-action="cleanse7" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">✺</span><span class="q-choice-kicker">CHAPTER 7 · QMM FIRST · SYMBOLIC</span>',
        '<strong>Seven-Center Cleansing Imagery</strong><span>Root-to-Crown color visualization with a gentle symbolic release or colors-only option.</span>',
        '<span class="q-choice-link">Start with Quiet Mind →</span></button>',
        '<button type="button" data-action="listen" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">♫</span><span class="q-choice-kicker">STEREO HEADPHONES</span>',
        '<strong>Listen &amp; drift</strong><span>Soft original stereo tones and a gentle return.</span>',
        '<span class="q-choice-link">Choose a session →</span></button>',
        '<button type="button" data-action="sleep" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">☾</span><span class="q-choice-kicker">UP TO 6 HOURS</span>',
        '<strong>Sleep Sanctuary</strong><span>Gentle surf and a quiet fade. Stereo tones are off by default.</span>',
        '<span class="q-choice-link">Set up sleep →</span></button>',
        '<button type="button" data-action="intention" class="q-choice q-choice-intention">',
        '<span class="q-choice-icon" aria-hidden="true">✦</span><span class="q-choice-kicker">CREATE · SAVE · LISTEN</span>',
        '<strong>Intention Studio</strong><span>Your own spoken reflections, saved sound recipes, and thoughtful playback timing.</span>',
        '<span class="q-choice-link">Open Intention Studio →</span></button>',
        '<button type="button" data-action="focus" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">◎</span><span class="q-choice-kicker">STEADY ATTENTION</span>',
        '<strong>Deep Focus</strong><span>A stable, unobtrusive sound field for work or study.</span>',
        '<span class="q-choice-link">Set up focus →</span></button>',
        '<button type="button" data-action="explore" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">◇</span><span class="q-choice-kicker">SUBJECTIVE EXPLORATION</span>',
        '<strong>Threshold Explorer</strong><span>QMM → GDM → Breathing Energy → optional spatial exploration.</span>',
        '<span class="q-choice-link">Set up exploration →</span></button>',
        '<button type="button" data-action="sync" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">◎</span><span class="q-choice-kicker">COMPLETE LEVEL JOURNEY</span>',
        '<strong>Focus Sync</strong><span>QMM → GDM → Breathing Energy → focus-level stations.</span>',
        '<span class="q-choice-link">Plan the full journey →</span></button>',
        '<button type="button" data-action="holistic" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">✧</span><span class="q-choice-kicker">GENTLE SELF-COMFORT</span>',
        '<strong>Holistic Zone</strong><span>Calm audio options for everyday discomfort, with clear evidence and safety boundaries.</span>',
        '<span class="q-choice-link">Explore comfort sounds →</span></button>',
        '<button type="button" data-action="rife" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">∿</span><span class="q-choice-kicker">AUDIO WAVEFORM EXPLORATION</span>',
        '<strong>Rife Frequency Lab</strong><span>Explore audible Hz, shapes, and gentle sweeps. A science-history lab, never a disease treatment.</span>',
        '<span class="q-choice-link">Open sound laboratory →</span></button>',
        '<button type="button" data-action="lab" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">⌘</span><span class="q-choice-kicker">THE COMPLETE COCKPIT</span>',
        '<strong>Explore the labs</strong><span>Every existing preset, audio tool, ledger, guide, and experiment is still here.</span>',
        '<span class="q-choice-link">Open full app →</span></button>',
        '</div>',
        '<section class="q-island-teaser" aria-label="Special Island 108 soundscape preset">',
        '<div><span class="q-island-kicker">SPECIAL SOUNDSCAPE · FAN TRIBUTE</span>',
        '<strong>Island 108</strong>',
        '<p>4 · 8 · 15 · 16 · 23 · 42. An original, LOST-inspired shoreline journey. Six sounds. Six chapters. One 108-minute loop.</p>',
        '<small>Not affiliated with the television series. No music, dialogue, or sound effects from the show.</small></div>',
        '<button type="button" data-action="lost" class="q-secondary q-island-open">Explore Island 108 →</button>',
        '</section>',
        '<p class="q-footnote">Not feeling well, dizzy, or faint? Skip audio practice and rest.',
        ' The full app has more detailed safety information.</p>'
      ].join("");
    } else if (state.screen === "holistic") {
      content = [
        '<button type="button" class="q-back" data-action="home">← Back to Quiet Deck</button>',
        '<div class="q-eyebrow">ORIGINAL SOUND · COMFORT FIRST</div>',
        '<h1>Holistic <em>Zone.</em></h1>',
        '<p class="q-lead">Choose a gentle listening environment, not a treatment frequency. Music and calming sound may help with relaxation or the experience of pain, but no particular Hz cures a headache, stomachache, or nausea.</p>',
        '<div class="q-choices q-holistic-choices">',
        HOLISTIC_CHOICES.map(item =>
          '<button type="button" class="q-choice q-holistic-choice" data-action="' + item.key + '">' +
          '<span class="q-choice-icon" aria-hidden="true">' + item.symbol + '</span>' +
          '<span class="q-choice-kicker">COMFORT LISTENING</span>' +
          '<strong>' + safeText(item.subtitle) + '</strong><span>' + safeText(item.description) + '</span>' +
          '<span class="q-choice-link">Customize a session →</span></button>').join(""),
        '</div>',
        '<div class="q-holistic-info"><h2>Sound is optional</h2>',
        '<p>Quiet, hydration, rest, and appropriate medical care may matter more than audio. Sound can worsen some headaches and nausea. Stop if the sound feels unpleasant.</p>',
        '<p class="q-holistic-alert"><strong>When to seek care:</strong> A sudden extremely severe headache, weakness, confusion, severe abdominal pain, vomiting blood, or inability to keep fluids down requires prompt medical attention. This app cannot assess symptoms or provide treatment.</p>',
        '<button type="button" class="q-secondary" data-action="settle">Choose silence instead</button></div>'
      ].join("");
    } else if (state.screen === "atlas") {
      content = window.FocusBridgeBodyAtlas
        ? window.FocusBridgeBodyAtlas.renderAtlas(state.atlas)
        : '<p role="alert">Human Body Atlas is unavailable. Reload the app to retry.</p>';
    } else if (state.screen === "targetlab") {
      const lab = state.targetLab, engine = window.FocusBridgeTeleVisualization;
      const able = !!(engine && window.crypto && typeof window.crypto.getRandomValues === "function");
      content = [
        '<button type="button" class="q-back" data-action="home">← Back to Quiet Deck</button>',
        '<div class="q-eyebrow">CHAPTER 3 · PART 2 · AFTER QMM</div>',
        '<h1>Blind Target <em>Lab.</em></h1>',
        '<p class="q-lead">A browser-only adaptation of the book\'s hidden-object exercise. A random target is chosen before each guess and concealed until the entire block is finished. This does not see into another room or reveal anyone\'s private activities.</p>',
        '<section class="q-panel" aria-label="Blind-target exercise">',
        '<p class="q-detail"><strong>Fixed protocol:</strong> 20 trials, four possible targets per trial, 25% expected chance accuracy. No feedback until all 20 guesses are locked. Choose without outside hints. A score here is not scientific evidence of extrasensory perception.</p>',
        lab && lab.status === "ready" ? [
          '<h2>Ready for a blind block?</h2>',
          '<p class="q-detail">The targets will be drawn using your browser\'s cryptographic random generator. No remote server or physical room target is involved.</p>',
          '<div class="q-actions"><button type="button" class="q-primary" data-action="target-begin" ', able ? '' : 'disabled',
          '>Begin 20 trials</button></div>'
        ].join("") : '',
        lab && lab.status === "active" ? [
          '<div class="q-setup-step">BLIND TRIAL ', lab.rounds.length + 1, ' OF ', engine.TRIAL_COUNT, '</div>',
          '<h2>Target selected and hidden.</h2>',
          '<p class="q-detail">Which of these four images do you guess? Your answer locks immediately. Results are withheld until the entire block ends.</p>',
          '<div class="q-durations q-target-choices">',
          engine.TARGETS.map((target, i) =>
            '<button type="button" class="q-duration" data-action="target-guess" data-target-index="' + i + '">' +
            safeText(target.label) + '</button>').join(""),
          '</div><p class="q-detail">No current hit count is shown. Leaving this page discards an unfinished block.</p>'
        ].join("") : '',
        lab && lab.status === "complete" && lab.outcome ? [
          '<div class="q-setup-step">BLOCK COMPLETE · FEEDBACK UNLOCKED</div>',
          '<h2>', lab.outcome.hits, ' of ', lab.outcome.trials, ' correct</h2>',
          '<p class="q-detail">Chance expectation: ', lab.outcome.expectedChanceHits, ' out of ', lab.outcome.trials,
          ' (', Math.round(lab.outcome.chanceProbability * 100),
          '%). A single block cannot establish unusual perception. Selection and browser storage are not independently audited.</p>',
          '<ol class="q-sync-stage-list">',
          lab.rounds.map((r, i) =>
            '<li><strong>Trial ' + (i + 1) + ' · ' + (r.guess === r.target ? 'Match' : 'No match') +
            '</strong><span>Guessed: ' + safeText(engine.TARGETS[r.guess].label) +
            ' · Hidden target: ' + safeText(engine.TARGETS[r.target].label) + '</span></li>').join(""),
          '</ol>',
          '<p class="q-detail">', lab.saved ? 'Raw guesses and targets were saved in your local Signal Ledger.' :
            'This result could not be saved in your local Signal Ledger.', '</p>',
          '<button type="button" class="q-secondary" data-action="target-begin" ', able ? '' : 'disabled',
          '>Begin another independent block →</button>'
        ].join("") : '',
        lab && lab.error ? '<p role="alert" class="q-error">' + safeText(lab.error) + '</p>' : '',
        !able ? '<p class="q-detail">This browser does not support the required secure random selection. The experiment cannot start without it.</p>' : '',
        '</section>'
      ].join("");
    } else if (state.screen === "prepare") {
      const listen = state.mode === "listen";
      const needsHeadphones = listen && headphoneRequired() && !state.headphones;
      const needsSound = listen && allSoundOff() && state.profile !== "intention";
      const needsIntention = state.profile === "intention" && !state.intentionScript;
      const canBegin = state.safe && !needsHeadphones && !needsSound && !needsIntention;
      const readinessHint = !state.safe
        ? "Check the comfort and safety box above to unlock Start."
        : needsHeadphones
          ? "Confirm your stereo headphones above to unlock Start."
          : needsSound
            ? "Enable a sound layer or switch to Just settle before starting."
            : needsIntention
              ? "Write a personal script before beginning."
              : "All set. Your session is ready to start.";
      const choices = state.profile === "sync"
        ? window.FocusBridgeSync.PACES.map(minutes => {
            const plan = window.FocusBridgeSync.timeline(minutes);
            return '<button type="button" class="q-duration ' + (state.syncMinutes === minutes ? 'selected' : '') +
              '" data-action="sync-pace" data-minutes="' + minutes +
              '" aria-pressed="' + (state.syncMinutes === minutes) + '">' +
              minutes + ' min/station · ' + formatTime(plan.totalSeconds) + '</button>';
          }).join("")
        : DURATIONS[["qmm", "gdm", "energy", "tele", "chakra", "clair", "energy6", "cleanse7"].includes(state.profile) ? state.profile : listen ? state.profile : "settle"].map((seconds) =>
            '<button type="button" class="q-duration ' + (state.duration === seconds ? 'selected' : '') +
            '" data-action="duration" data-seconds="' + seconds +
            '" aria-pressed="' + (state.duration === seconds) + '">' +
            (state.profile === "lost" && seconds === 6480 ? '108 min · full island loop' :
              seconds === 90 ? '90 sec' : seconds < 3600 ? (seconds / 60) + ' min' :
              (seconds / 3600) + ' hr') + '</button>'
          ).join("");
      content = [
        '<button type="button" class="q-back" data-action="back">← Back to ', PROFILES[state.profile]?.holistic ? 'Holistic Zone' : 'choices', '</button>',
        '<div class="q-eyebrow">', listen || ["qmm", "gdm", "energy", "tele", "chakra", "clair", "energy6", "cleanse7"].includes(state.profile) ? safeText(PROFILES[state.profile].label.toUpperCase()) : 'JUST SETTLE', '</div>',
        '<h1>', listen || ["qmm", "gdm", "energy", "tele", "chakra", "clair", "energy6", "cleanse7"].includes(state.profile) ? safeText(PROFILES[state.profile].label) + '.' : 'Make a little space.', '</h1>',
        '<p class="q-lead">', listen
          ? PROFILES[state.profile].rife
            ? 'A browser-based audio oscillator inspired by the history of frequency experimentation. NOT a Rife RF device, an electromagnetic treatment, or a medical therapy. Audible Hz cannot diagnose or cure disease.'
            : PROFILES[state.profile].holistic
              ? 'Low-stimulation comfort listening, not a medical treatment. No audio frequency is proven to treat this symptom.'
              : state.profile === "lost"
                ? 'Welcome to Island 108: a mysterious, peaceful, LOST-inspired island listening trip built from original synthesized surf, rain, wind, bass, pulse and C3 HUM. No copied soundtrack or sound effects.'
                : state.profile === "intention"
                ? 'Create and read your own reflective script, with optional spoken voice and personalized ambience. No hidden audio or subconscious programming claims.'
                : 'Original procedural sound with optional stereo tones. Presets are creative listening experiences, not verified brain-state induction.'
          : state.profile === "qmm"
            ? 'A quiet, original seven-step attention practice adapted from The Book of Knowledge. No audio is needed. You are practicing noticing and returning, not forcing an empty mind.'
            : state.profile === "gdm"
              ? 'Chapter 2 builds upon QMM. Imagine a comfortable descent, then rest and return. Any falling sensation is purely imagined. No EEG or out-of-body state is measured.'
              : state.profile === "energy"
                ? 'Chapter 2 follows QMM and GDM with breathing and golden-white light imagery. Here breathing stays natural, imagery stays optional, and no energy effect is claimed.'
                : state.profile === "tele"
                  ? 'Chapter 3 part 1: after QMM, imagine a forest, downstream river, mist-covered pool and four echoes. The scene is imagination, not verified remote perception.'
                  : state.profile === "chakra"
                    ? 'Chapter 4: after QMM, imagine gentle light from Crown down to Root. The book calls tingling evidence a chakra is open, but this is not established.'
                    : state.profile === "clair"
                      ? 'Chapter 5: after QMM and GDM, gently listen and imagine outward/returning awareness. The book proposes messages from other realms; this practice does not validate that claim.'
                      : state.profile === "energy6"
                        ? 'Chapter 6: after QMM, practice four types of imaginative movement: mental body, Earth, water, and forest. No force or physical energy effect is measured.'
                        : state.profile === "cleanse7"
                          ? 'Chapter 7: after QMM, imagine seven colored lights from Root up to Crown. Cleansing here is symbolic, not a medical treatment or proof of an energy center.'
                          : 'No audio. No forced breath timing. Let thoughts come and go.', '</p>',
        listen && PROFILES[state.profile].holistic
          ? '<p class="q-comfort-note">' + safeText(PROFILES[state.profile].note) + '</p>'
          : '',
        '<section class="q-panel" aria-label="Session setup">',
        '<div class="q-readiness-card ', state.safe && !needsHeadphones ? 'is-confirmed' : 'needs-confirmation', '" id="q-readiness">',
        '<div class="q-setup-step">STEP 1 OF 3 · SAFETY CHECK</div>',
        '<h2>One quick check before we begin</h2>',
        '<p class="q-detail">Please confirm this yourself. Start will unlock after your required checks are complete.</p>',
        '<label class="q-check q-check-prominent" for="q-safe"><input type="checkbox" id="q-safe" ',
        state.safe ? 'checked' : '', '> <span><strong>I\'m in a comfortable, safe place.</strong>',
        '<small>I feel steady, and I am not dizzy, faint, or unwell.</small></span></label>',
        listen && headphoneRequired() ? '<label class="q-check q-check-prominent" for="q-headphones"><input type="checkbox" id="q-headphones" ' +
          (state.headphones ? 'checked' : '') +
          '> <span><strong>My stereo headphones are ready.</strong><small>They are on at a low, comfortable volume.</small></span></label>' : '',
        '</div>',
        '<div class="q-setup-step">STEP 2 OF 3 · CUSTOMIZE</div>',
        '<h2>', state.profile === "sync" ? 'Choose a pace for the complete journey' : 'How long feels comfortable?', '</h2>',
        '<div class="q-durations">', choices, '</div>',
        state.profile === "qmm" && state.qmmNext ? [
          '<p class="q-comfort-note" role="status"><strong>Foundation first.</strong> Complete this QMM practice, return gently, and then choose to continue to ',
          ["tele", "chakra", "energy6", "cleanse7"].includes(state.qmmNext) ? safeText(PROFILES[state.qmmNext].label) :
          state.qmmNext === "clair" ? safeText(PROFILES.gdm.label) + " then " + safeText(PROFILES.clair.label) :
          state.qmmNext === "tele" ? safeText(PROFILES.tele.label) :
          state.qmmNext === "targetlab" ? "Blind Target Lab" :
          state.qmmNext === "gdm" ? safeText(PROFILES.gdm.label) :
          safeText(PROFILES.gdm.label) + ' and then ' + safeText(PROFILES.energy.label) +
            (state.qmmNext === "energy" ? '' : ' before ' + safeText(PROFILES[state.qmmNext].label)), '. You can stop at any time without continuing.</p>'
        ].join("") : '',
        state.profile === "gdm" && state.gdmNext ? [
          '<p class="q-comfort-note" role="status"><strong>Second foundation.</strong> Complete Going Deeper, reorient, and then choose whether to continue to ',
          state.gdmNext === "clair" ? safeText(PROFILES.clair.label) : safeText(PROFILES.energy.label),
          state.gdmNext === "energy" || state.gdmNext === "clair" ? '' : ' before ' + safeText(PROFILES[state.gdmNext].label),
          '. No transition is automatic.</p>'
        ].join("") : '',
        state.profile === "energy" && state.energyNext ? [
          '<p class="q-comfort-note" role="status"><strong>Third foundation.</strong> Finish this breathing-imagery session, reorient, and then decide whether to continue to ',
          safeText(PROFILES[state.energyNext].label), '. This is always optional.</p>'
        ].join("") : '',
        state.profile === "cleanse7" && window.FocusBridgeCleansing ? [
          '<section class="q-panel q-cleansing-plan" aria-label="Chapter 7 symbolic cleansing practice">',
          '<div class="q-setup-step">CHAPTER 7 · ROOT TO CROWN · QMM FIRST</div>',
          '<h3>Your Seven-Center Cleansing Imagery practice</h3>',
          '<p class="q-detail">The book describes colored lights and “burning away negativity.” This version treats that as a symbolic reflection. No physical impurity is removed, no chakra opening is detected, and meditation cannot replace medical care.</p>',
          '<div class="q-setup-step">CHOOSE A STYLE · OPTIONAL</div><div class="q-durations">',
          Object.keys(window.FocusBridgeCleansing.STYLES).map(key =>
            '<button type="button" class="q-duration ' + (state.cleanse7Style === key ? 'selected' : '') +
            '" data-action="cleanse7-style" data-style="' + key +
            '" aria-pressed="' + (state.cleanse7Style === key) + '">' +
            safeText(window.FocusBridgeCleansing.STYLES[key].label) + '</button>').join(""),
          '</div><p class="q-detail">' + safeText(window.FocusBridgeCleansing.STYLES[state.cleanse7Style].description) + '</p>',
          '<ol class="q-sync-stage-list q-cleansing-stage-list">',
          window.FocusBridgeCleansing.STAGES.map((stage, index) => {
            const chosen = window.FocusBridgeCleansing.stageAt(
              (window.FocusBridgeCleansing.STAGES.slice(0, index).reduce((n, x) => n + x.weight, 0) + 0.000001) * state.duration,
              state.duration, state.cleanse7Style);
            return '<li>' + (stage.hex
              ? '<span class="q-cleansing-swatch" aria-hidden="true" style="background-color:' + safeText(stage.hex) + '"></span>' : '') +
              '<strong>' + safeText(stage.title) + (stage.color ? ' · ' + safeText(stage.color) : '') + '</strong>' +
              (stage.points ? '<small>' + safeText(stage.points) + '</small>' : '') +
              '<span>' + safeText(chosen.prompt) + '</span></li>';
          }).join(""),
          '</ol>',
          '<label class="q-check" for="q-cleanse7-voice"><input type="checkbox" id="q-cleanse7-voice" ',
          state.cleanse7Voice && voiceAvailable() ? 'checked' : '', voiceAvailable() ? '' : 'disabled',
          '> <span><strong>Read the ten original cues</strong><small>Optional browser narration; off by default, and may use an online voice.</small></span></label>',
          '<p class="q-detail">All colors are imagined. No heat, tingling, eye effort or bodily changes are required. If anything feels uncomfortable, use Return now.</p>',
          '</section>'
        ].join("") : '',
        state.profile === "energy6" && window.FocusBridgeEnergyImagery ? [
          '<section class="q-panel q-energy6-plan" aria-label="Chapter 6 imaginative energy movement">',
          '<div class="q-setup-step">CHAPTER 6 · QMM FIRST · ALL MOVEMENT IMAGINED</div>',
          '<h3>Your Controlling Energy practice</h3>',
          '<p class="q-detail">The original chapter describes a mental double, energy through hands and feet, Earth connection, water exchange and forest life-force. All four choices below are entirely imagined. We make no claim of moving objects, reading minds, sensing others\' auras or transferring literal energy.</p>',
          '<div class="q-setup-step">CHOOSE ONE IMAGERY PATH</div>',
          '<div class="q-durations">',
          Object.keys(window.FocusBridgeEnergyImagery.THEMES).map(key =>
            '<button type="button" class="q-duration ' + (state.energy6Theme === key ? 'selected' : '') +
            '" data-action="energy6-theme" data-theme="' + key +
            '" aria-pressed="' + (state.energy6Theme === key) + '">' +
            safeText(window.FocusBridgeEnergyImagery.THEMES[key].label) + '</button>').join(""),
          '</div><p class="q-detail">' +
          safeText(window.FocusBridgeEnergyImagery.THEMES[state.energy6Theme].summary) + '</p>',
          '<ol class="q-sync-stage-list">',
          window.FocusBridgeEnergyImagery.THEMES[state.energy6Theme].stages.map(part =>
            '<li><strong>' + safeText(part.title) + '</strong><span>' + safeText(part.prompt) + '</span></li>').join(""),
          '</ol>',
          '<label class="q-check" for="q-energy6-voice"><input type="checkbox" id="q-energy6-voice" ',
          state.energy6Voice && voiceAvailable() ? 'checked' : '', voiceAvailable() ? '' : 'disabled',
          '> <span><strong>Speak the original prompts</strong><small>Optional browser narration, off by default.</small></span></label>',
          '<p class="q-detail">Stay dry and supported, especially for the water theme. No actual water, electrical equipment, barefoot exposure or physical gestures are necessary. If distressed or dizzy, use Return now.</p>',
          '</section>'
        ].join("") : '',
        ["chakra", "clair"].includes(state.profile) && chapterEngine() ? [
          '<section class="q-panel q-chapter-practice" aria-label="Book-derived practice progression">',
          '<div class="q-setup-step">', state.profile === "chakra" ?
            'CHAPTER 4 · AFTER QUIET MIND' : 'CHAPTER 5 · AFTER QUIET MIND + GOING DEEPER', '</div>',
          '<h3>Your ', safeText(PROFILES[state.profile].label), ' practice</h3>',
          '<p class="q-detail">', state.profile === "chakra" ?
            'The book guides glowing light from Crown to Root. We preserve its order, but do not claim that sensations prove chakra opening or offer treatment.' :
            'The author describes focusing on the ears and imagining energy moving outward and back. We interpret this as sensory attention and imaginative sound, not listening for real messages from another realm.', '</p>',
          '<ol class="q-sync-stage-list">',
          chapterEngine().STAGES.map(stage =>
            '<li><strong>' + safeText(stage.title) + '</strong><span>' + safeText(stage.prompt) + '</span></li>').join(""),
          '</ol>',
          '<label class="q-check" for="q-chapter-voice"><input type="checkbox" id="q-chapter-voice" ',
          state.chapterVoice && voiceAvailable() ? 'checked' : '', voiceAvailable() ? '' : 'disabled',
          '> <span><strong>Read prompts aloud</strong><small>Optional browser voice, off every new session; reading the cues is enough.</small></span></label>',
          '<p class="q-detail">If thoughts, imagery or sounds feel disturbing, stop, open your eyes and orient to the real room. You never need a special sensation or any voice. If hearing voices is distressing or persistent, seek qualified medical support.</p>',
          '</section>'
        ].join("") : '',
        state.profile === "energy" && window.FocusBridgeBreathingEnergy ? [
          '<section class="q-panel q-energy-plan" aria-label="Breathing Energy progression">',
          '<div class="q-setup-step">CHAPTER 2 · AFTER QMM AND GDM</div><h3>Your Breathing Energy practice</h3>',
          '<p class="q-detail">The original exercise describes imagining the body as a sponge within golden-white light while breathing. We treat this as optional sensory imagery, not physical energy absorption. Breathe comfortably; no force, holds or fixed rhythm.</p>',
          '<div class="q-setup-step">CHOOSE IMAGERY · OPTIONAL</div><div class="q-durations">',
          Object.keys(window.FocusBridgeBreathingEnergy.VISUALS).map(key =>
            '<button type="button" class="q-duration ' + (state.energyVisual === key ? 'selected' : '') +
            '" data-action="energy-visual" data-visual="' + key +
            '" aria-pressed="' + (state.energyVisual === key) + '">' +
            safeText(window.FocusBridgeBreathingEnergy.VISUALS[key].label) + '</button>').join(""),
          '</div><p class="q-detail">' + safeText(window.FocusBridgeBreathingEnergy.VISUALS[state.energyVisual].description) + '</p>',
          '<ol class="q-sync-stage-list">',
          window.FocusBridgeBreathingEnergy.STAGES.map((phase, index) => {
            const stage = window.FocusBridgeBreathingEnergy.stageAt(
              (window.FocusBridgeBreathingEnergy.STAGES.slice(0, index).reduce((n, x) => n + x.weight, 0) + 0.000001) * state.duration,
              state.duration, state.energyVisual);
            return '<li><strong>' + safeText(phase.title) + '</strong><span>' + safeText(stage.prompt) + '</span></li>';
          }).join(""),
          '</ol>',
          '<label class="q-check" for="q-energy-voice"><input type="checkbox" id="q-energy-voice" ',
          state.energyVoice && voiceAvailable() ? 'checked' : '', voiceAvailable() ? '' : 'disabled',
          '> <span><strong>Speak the six original cues</strong><small>Optional browser speech, off by default. Some voices may use online services.</small></span></label>',
          '<p class="q-detail">Stop if you feel dizzy, breathless, distressed or disoriented. This is not a breathing challenge or measured physiological intervention.</p>',
          '</section>'
        ].join("") : '',
        state.profile === "tele" && window.FocusBridgeTeleVisualization ? [
          '<section class="q-panel q-tele-plan" aria-label="Tele-Visualization chapter 3 journey">',
          '<div class="q-setup-step">CHAPTER 3 · PART 1 · AFTER QMM</div><h3>Your Tele-Visualization practice</h3>',
          '<p class="q-detail">The original exercise asks you to picture a forest, follow a river, reach a mist-covered pool with a smooth grey wall and greenery, then imagine the pool saying your name four times. Keep your eyes relaxed. We skip the book\'s eye-straining upward focus suggestion.</p>',
          '<ol class="q-sync-stage-list">',
          window.FocusBridgeTeleVisualization.STAGES.map(s =>
            '<li><strong>' + safeText(s.title) + '</strong><span>' + safeText(s.prompt) + '</span></li>').join(""),
          '</ol><label class="q-check" for="q-tele-voice"><input type="checkbox" id="q-tele-voice" ',
          state.teleVoice && voiceAvailable() ? 'checked' : '', voiceAvailable() ? '' : 'disabled',
          '> <span><strong>Speak the seven scene cues</strong><small>Optional original browser voice; off by default.</small></span></label>',
          '<p class="q-detail">Imagining a place vividly is not evidence of visiting it. Stop any time if uncomfortable or disoriented.</p></section>'
        ].join("") : '',
        state.profile === "gdm" && window.FocusBridgeGDM ? [
          '<section class="q-panel q-gdm-plan" aria-label="Going Deeper meditation progression">',
          '<div class="q-setup-step">CHAPTER 2 · AFTER QUIET MIND</div><h3>Your GDM practice</h3>',
          '<p class="q-detail">The book describes an imagined ladder or backward-facing escalator, followed by the sensation of dropping backward into a deeper mental space. In this adaptation these remain imagined only, and a no-motion alternative is available.</p>',
          '<div class="q-setup-step">CHOOSE IMAGERY · OPTIONAL</div><div class="q-durations">',
          Object.keys(window.FocusBridgeGDM.VISUALS).map(key =>
            '<button type="button" class="q-duration ' + (state.gdmVisual === key ? 'selected' : '') +
            '" data-action="gdm-visual" data-visual="' + key +
            '" aria-pressed="' + (state.gdmVisual === key) + '">' +
            safeText(window.FocusBridgeGDM.VISUALS[key].label) + '</button>').join(""),
          '</div><p class="q-detail">' + safeText(window.FocusBridgeGDM.VISUALS[state.gdmVisual].description) + '</p>',
          '<ol class="q-sync-stage-list">',
          window.FocusBridgeGDM.STAGES.map((phase, index) => {
            const stage = window.FocusBridgeGDM.stageAt(
              window.FocusBridgeGDM.STAGES.slice(0, index).reduce((n, x) => n + x.weight, 0) * state.duration,
              state.duration, state.gdmVisual);
            return '<li><strong>' + safeText(phase.title) + '</strong><span>' + safeText(stage.prompt) + '</span></li>';
          }).join(""),
          '</ol>',
          '<label class="q-check" for="q-gdm-voice"><input type="checkbox" id="q-gdm-voice" ',
          state.gdmVoice && voiceAvailable() ? 'checked' : '', voiceAvailable() ? '' : 'disabled',
          '> <span><strong>Speak the five original cues</strong><small>Optional browser narration, off by default. Your device may use online speech services.</small></span></label>',
          '<p class="q-detail">GDM is imagined relaxation, not verified alpha/theta. Remain physically supported, skip imagery that feels unpleasant, and use Return now at any time.</p>',
          '</section>'
        ].join("") : '',
        state.profile === "qmm" && window.FocusBridgeQMM ? [
          '<section class="q-panel q-qmm-plan" aria-label="Quiet Mind meditation progression">',
          '<div class="q-setup-step">SEVEN STAGES · GENTLE AWARENESS</div><h3>Your QMM practice</h3>',
          '<ol class="q-sync-stage-list">',
          window.FocusBridgeQMM.STAGES.map(stage => '<li><strong>' + safeText(stage.title) + '</strong><span>' + safeText(stage.prompt) + '</span></li>').join(""),
          '</ol><p class="q-detail">The sequence is inspired by Chapter 1 of <a href="https://www.scribd.com/doc/120678976/The-Book-Of-Knowledge" target="_blank" rel="noopener noreferrer">The Book of Knowledge (Anonymous)</a>; all wording here is original. This is not a claim of paranormal abilities or measured brain states.</p>',
          '<label class="q-check" for="q-qmm-voice"><input type="checkbox" id="q-qmm-voice" ',
          state.qmmVoice && voiceAvailable() ? 'checked' : '', voiceAvailable() ? '' : 'disabled',
          '> <span><strong>Speak the seven prompts</strong><small>Optional browser narration. Off by default; voice availability and network use depend on your device.</small></span></label>',
          '<p class="q-detail">Keep your eyes open when needed. Stop if distressed or disoriented. Return Now always remains available.</p></section>'
        ].join("") : '',
        state.profile === "lost" ? [
          '<section class="q-island-panel" aria-label="Island 108 six chapters">',
          '<div class="q-island-kicker">THE NUMBERS · 4 8 15 16 23 42</div>',
          '<h3>Six chapters. One shoreline.</h3>',
          '<p class="q-detail">The classic numbers add up to 108. Each number represents a chapter length in the default 108-minute journey. Other session lengths keep the same six-chapter proportions.</p>',
          '<ol class="q-island-chapters">',
          ISLAND_SEGMENTS.map(segment => '<li><strong>' + segment.number + ' min</strong><span>' + safeText(segment.title) + '</span></li>').join(""),
          '</ol><p class="q-detail">The matching original mixer levels are: Pulse 4%, bass 8%, HUM 15%, wind 16%, rain 23%, surf 42%. HUM starts on C3 and binaural tones start off.</p>',
          '<button type="button" class="q-secondary" data-action="island-reset">Restore original island six-layer mix</button>',
          '<p class="q-detail">An unofficial fan tribute. Nothing from the TV series is sampled or reproduced; no secret signal is being transmitted.</p>',
          '</section>'
        ].join("") : '',
        state.profile === "drift" ? '<p class="q-island-shortcut"><button type="button" class="q-secondary" data-action="lost">Try Island 108 · LOST-inspired mix →</button></p>' : '',
        state.profile === "sync" ? [
          '<p class="q-detail">Every pace includes all 17 listed focus levels plus a 12-minute grounded return. No stage is objectively achieved by running out its timer. Longer is not automatically better.</p>',
          '<div class="q-sync-plan"><h3>Complete itinerary · 17 stations + return</h3>',
          '<p class="q-detail">These are reflective prompts inspired by publicly published focus-level names. Focus Sync has no proprietary Monroe signals, guided scripts, or claimed access to other realities.</p>',
          '<ol class="q-sync-stage-list">',
          window.FocusBridgeSync.GATES.map(gate =>
            '<li><strong>Focus ' + safeText(gate.level) + '</strong><span>' + safeText(gate.title) + '</span></li>').join(""),
          '<li><strong>Return</strong><span>12 minutes of gentle reorientation</span></li>',
          '</ol></div>',
          '<p class="q-comfort-note">This can be a long session. Remain somewhere safe, use low volume, and stop if you become uncomfortable, distressed, dizzy, or disoriented. Browser or device sleep may interrupt playback. A contemplative sequence is not a test of brain state or evidence of a supernatural event.</p>'
        ].join("") : '',
        state.profile === "rife" ? [
          '<div class="q-rife-panel" aria-label="Audible frequency controls">',
          '<div class="q-setup-step">EXPERIMENT SETTINGS · NOT MEDICAL TREATMENT</div>',
          '<h3>Choose an audible frequency</h3>',
          '<p class="q-detail">These are demonstration tones, including numbers sometimes circulated on Rife lists. No disease-matching or healing claims are supported. This browser plays sound, not radio or electromagnetic fields.</p>',
          '<div class="q-durations q-rife-frequencies">',
          window.FocusBridgeRife.FREQUENCIES.map(hz =>
            '<button type="button" class="q-duration ' + (state.rife.frequency === hz ? 'selected' : '') +
            '" data-action="rife-frequency" data-frequency="' + hz +
            '" aria-pressed="' + (state.rife.frequency === hz) + '">' + hz + ' Hz</button>').join(""),
          '</div>',
          '<div class="q-rife-control-grid">',
          '<label for="q-rife-waveform">Wave shape',
          '<select id="q-rife-waveform">',
          window.FocusBridgeRife.WAVEFORMS.map(shape =>
            '<option value="' + shape + '"' + (state.rife.waveform === shape ? ' selected' : '') +
            '>' + (shape === 'sine' ? 'Sine · smooth' : 'Triangle · more harmonics') + '</option>').join(""),
          '</select></label>',
          '<label for="q-rife-motion">Pitch movement',
          '<select id="q-rife-motion">',
          window.FocusBridgeRife.MOTIONS.map(motion =>
            '<option value="' + motion + '"' + (state.rife.motion === motion ? ' selected' : '') +
            '>' + (motion === 'steady' ? 'Steady tone' : 'Gentle +/- 2% sweep') + '</option>').join(""),
          '</select></label>',
          '</div>',
          '<label class="q-rife-intensity" for="q-rife-intensity"><span>Quiet output level: ',
          '<output id="q-rife-intensity-value">' + state.rife.intensity + '%</output></span>',
          '<input type="range" id="q-rife-intensity" min="5" max="35" step="5" value="' + state.rife.intensity + '">',
          '</label>',
          '<p class="q-detail">Start with your device volume nearly silent. Output is software-limited but actual loudness depends on your headphones or speakers. Do not increase volume if a tone is hard to hear.</p>',
          '</div>'
        ].join("") : listen ? '<div class="q-mixer"><h2>Make it sound like your place</h2>' +
          '<p class="q-detail">An original, gentle soundscape. Every layer is optional, and the mix stays on this device.</p>' +
          [['surf','Ocean surf','Slow, overlapping shoreline waves'],
            ['bass','Warm sub-bass','A quiet 62 Hz foundation'],
            ['beat','Soft pulse','A gentle 40 BPM anchor'],
            ['rain','Rain','From light drizzle to a steady, hard downpour'],
            ['wind','Wind','From a soft breeze to sustained gusts'],
            ['hum','HUM','A soft musical hum, with selectable notes from C3 through C5']]
            .map(([key, label, desc]) => '<label class="q-mix-row" for="q-mix-' + key + '"><span><strong>' + label + '</strong><small>' + desc + '</small></span>' +
            '<input type="range" min="0" max="100" step="5" id="q-mix-' + key + '" value="' + state[key] + '" aria-valuetext="' + state[key] + ' percent"><output id="q-mix-value-' + key + '">' + state[key] + '%</output></label>').join('') +
          '<div class="q-hum-note"><label for="q-hum-note">HUM pitch (C3–C5)</label><select id="q-hum-note">' +
            (window.FocusBridgeSoundscape?.HUM_NOTES || []).map(note =>
              '<option value="' + note.name + '"' + (state.humNote === note.name ? ' selected' : '') +
              '>' + note.name + ' · ' + note.hz.toFixed(2) + ' Hz</option>').join('') +
            '</select><p class="q-detail">25 equal-tempered musical notes. HUM is off when its slider is at 0%.</p></div>' +
          '<label class="q-check"><input type="checkbox" id="q-tones" ' + (state.tones ? 'checked' : '') + '> <span>Include gentle stereo tones (optional)</span></label>' +
          (PROFILES[state.profile].holistic ? '<div class="q-tone-palette"><label for="q-tone-palette">Exploratory stereo beat difference (not a symptom treatment)</label><select id="q-tone-palette" ' +
            (state.tones ? '' : 'disabled') + '>' +
            HOLISTIC_TONE_OPTIONS.map(hz => '<option value="' + hz + '"' +
              (state.toneDifference === hz ? ' selected' : '') + '>' + hz + ' Hz</option>').join("") +
            '</select><p class="q-detail">Stereo headphones required for binaural tones. The Hz options are sound experiments, not medical prescriptions. Leave tones off if you are sound-sensitive.</p></div>' : '') +
          '</div>' : '',
        listen && state.profile !== "rife" && !allSoundOff() ? [
          '<section class="q-master-panel" aria-label="Audio engine master output">',
          '<div class="q-setup-step">Φ AUDIO ENGINE · MASTER OUTPUT</div>',
          '<label for="q-master"><strong>Master output</strong> · ',
          '<output id="q-master-value">', state.master, '%</output></label>',
          '<input type="range" id="q-master" min="0" max="100" step="5" value="',
          state.master, '" aria-label="Master output level">',
          '<p class="q-detail">Relative digital mixer gain, not measured headphone loudness. Start with your device volume low. Changes also apply during preview.</p>',
          '</section>'
        ].join("") : '',
        listen && (!allSoundOff() || state.profile !== "intention") ? [
          '<section class="q-preview-panel" aria-label="Preview selected sounds before starting">',
          '<div class="q-setup-step">SOUND CHECK · BEFORE YOUR SESSION</div>',
          '<h2>Preview your selections</h2>',
          '<p class="q-detail">Hear a 15-second sample of the sounds and tone you chose. Start with your device volume low; this does not start your session, change your settings, or save a receipt.</p>',
          state.profile === "rife" ? [
            '<div class="q-preview-rife"><strong>', state.rife.frequency, ' Hz · ',
              safeText(state.rife.waveform), '</strong>',
            '<span>', state.rife.motion === "steady" ? 'Steady pitch' : 'Gentle sweep',
              ' · ', state.rife.intensity, '% of capped software gain</span></div>'
          ].join("") : [
            '<div class="q-preview-levels">',
            PREVIEW_LAYERS.map(([key, label]) =>
              '<div class="q-preview-level"><span>' + safeText(label) + '</span>' +
              '<div class="q-preview-meter" aria-hidden="true"><div id="q-preview-meter-' + key + '" style="width:' +
                state[key] + '%"></div></div>' +
              '<strong id="q-preview-value-' + key + '">' + state[key] + '%</strong></div>').join(""),
            '</div>',
            state.hum ? '<p class="q-detail">HUM note: <strong>' + safeText(state.humNote) + '</strong></p>' : '',
            state.tones ? [
              '<p class="q-preview-stereo"><strong>Stereo tones enabled.</strong> ',
              'Left ', PROFILES[state.profile].carrier, ' Hz; right ',
              PROFILES[state.profile].carrier + (
                PROFILES[state.profile].holistic ? state.toneDifference : PROFILES[state.profile].difference),
              ' Hz.', state.profile === "sync" ? ' Preview plays the opening Focus Sync stage only.' : '',
              ' Headphones are required.</p>'
            ].join("") : '<p class="q-detail">Optional stereo tones are off.</p>'
          ].join(""),
          '<div class="q-actions">',
          state.previewActive
            ? '<button type="button" class="q-return" data-action="stop-preview">Stop preview now</button>'
            : '<button type="button" class="q-secondary q-preview-button" data-action="preview" ' +
              (!canBegin || state.starting || state.previewStarting ? 'disabled' : '') +
              '>' + (state.previewStarting ? 'Starting sound check…' : '▶ Preview selected mix · 15 sec') + '</button>',
          '</div>',
          '<p class="q-preview-status" role="status" aria-live="polite">',
          state.previewActive ? '<span id="q-preview-remaining">15 sec remaining</span> · Listening only, session not started.'
            : safeText(state.previewMessage || (!state.safe
              ? 'Complete the safety check above to enable preview.'
              : needsHeadphones ? 'Confirm stereo headphones above to preview.'
              : needsSound ? 'Enable at least one sound layer to preview.'
              : 'Ready for your sound check.')),
          '</p>',
          state.previewError ? '<p role="alert" class="q-error">' + safeText(state.previewError) + '</p>' : '',
          '<p class="q-detail">Percentages show mixer settings, <strong>not measured loudness or dB SPL</strong>. Your speakers, headphones, and system volume determine what you actually hear. Stop immediately if anything feels too loud or uncomfortable.</p>',
          '</section>'
        ].join("") : '',
        '<p class="q-detail">', listen
          ? (state.profile === "rife"
            ? 'This mode generates low-level audible tones only. It is not an RF, electromagnetic, or electrotherapy device and has no medical effectiveness claim. Stop immediately if unpleasant.'
            : state.profile === "sleep"
              ? 'Sleep mode: no completion chime; tones (if enabled) gently fade by 30 minutes. Speakers are fine for ambience-only sleep. The browser/device must allow background audio.'
              : 'Use stereo headphones for binaural tones, keep volume low, and stop if you feel uncomfortable.')
          : 'Sit or lie somewhere comfortable. Regular, natural breathing is enough.', '</p>',
        listen && allSoundOff() && state.profile !== "intention" ?
          '<p role="alert" class="q-error">All sound layers are off. Turn up Ocean surf, Rain, Wind, HUM, or enable stereo tones; choose Just settle for silence.</p>' : '',
        state.profile === "intention" && listen && intentionEngine
          ? intentionEngine.editorHtml(state, state.safe, voiceAvailable()) : '',
        state.profile === "sleep" && listen ? [
          '<section class="q-sleep-studio" aria-label="Sleep and personal intention studio">',
          '<div class="q-setup-step">SLEEP SANCTUARY+ · YOUR WIND-DOWN</div>',
          '<h2>A little help letting the day go</h2>',
          '<p class="q-detail">Keep your soothing ambience, then optionally hear a short wind-down and a personal bedtime intention. The guide stops speaking after the first minute. No hidden audio and no promises of sleep learning.</p>',
          '<label class="q-check" for="q-sleep-guide"><input type="checkbox" id="q-sleep-guide" ',
          state.sleepGuide && voiceAvailable() ? 'checked' : '', voiceAvailable() ? '' : 'disabled',
          '> <span><strong>Gentle bedtime narrator</strong><small>A short opening welcome and one last cue around the first minute. No overnight narration.</small></span></label>',
          '<label for="q-sleep-intention" class="q-sleep-label">My bedtime intention (optional)</label>',
          '<textarea id="q-sleep-intention" maxlength="280" rows="3" placeholder="For example: Tomorrow I can begin calmly. Tonight I can rest.">',
          safeText(state.sleepIntention), '</textarea>',
          '<label class="q-check" for="q-sleep-intention-speak"><input type="checkbox" id="q-sleep-intention-speak" ',
          state.sleepSpeakIntention && voiceAvailable() ? 'checked' : '',
          voiceAvailable() ? '' : 'disabled',
          '> <span><strong>Read my intention once at the beginning</strong><small>Your own words, at a normal audible level; always voluntary, never subliminal.</small></span></label>',
          '<label class="q-check" for="q-sleep-dim"><input type="checkbox" id="q-sleep-dim" ',
          state.sleepDim ? 'checked' : '',
          '> <span><strong>Dim the session display</strong><small>Make the session visually quieter without hiding Return Now.</small></span></label>',
          voiceAvailable()
            ? '<button type="button" class="q-secondary" data-action="sleep-voice-preview" ' +
              (!state.safe ? 'disabled' : '') + '>Hear my wind-down voice · one-time preview</button>'
            : '<p class="q-detail">Voice is unavailable here. All text and ambient sound controls still work.</p>',
          '<p class="q-detail">Your intention is stored in this browser, not encrypted. Some system voices may use an online service, so avoid entering secrets. This is a reflective practice, not a proven way to reprogram the subconscious during sleep.</p>',
          '</section>'
        ].join("") : '',
        '<section class="q-guide-panel" aria-label="Optional practice guidance">',
        '<div class="q-setup-step">OPTIONAL · GUIDED EXPERIENCE</div>',
        '<h2>Make the journey yours</h2>',
        state.profile === "sync" ? [
          '<label class="q-check" for="q-guide-voice"><input type="checkbox" id="q-guide-voice" ',
          state.voiceGuide && voiceAvailable() ? 'checked' : '',
          voiceAvailable() ? '' : 'disabled',
          '> <span><strong>Speak each focus gate</strong><small>A calm browser voice reads the original prompt when the next gate begins. No nonstop talking.</small></span></label>',
          voiceAvailable() ? '' : '<p class="q-detail">This browser has no speech voice available. Written prompts still work.</p>',
          '<p class="q-detail">Voice selection and offline availability depend on your browser and device; some installed voices may use an online service.</p>'
        ].join("") : '',
        '<label class="q-check" for="q-guide-breath"><input type="checkbox" id="q-guide-breath" ',
        state.breathGuide ? 'checked' : '',
        '> <span><strong>Show a gentle breathing companion</strong><small>Optional 4-second inhale, 6-second exhale visual, with no breath holding. Breathe naturally instead whenever comfortable.</small></span></label>',
        '</section>',
        '<div class="q-start-panel"><div class="q-setup-step">STEP 3 OF 3 · BEGIN</div>',
        '<p class="q-start-hint" role="status" id="q-readiness-hint">',
        canBegin ? '<span aria-hidden="true">✓ </span>' : '<span aria-hidden="true">○ </span>',
        readinessHint, '</p>',
        '<div class="q-actions"><button type="button" class="q-primary" data-action="start" aria-describedby="q-readiness-hint" ',
        (!canBegin || state.starting || state.previewStarting) ? 'disabled' : '',
        '>', state.starting ? 'Starting…' : 'Start my session', '</button>',
        !canBegin ? '<button type="button" class="q-secondary" data-action="review">Show me what to check ↑</button>' : '',
        listen ? '<button type="button" class="q-secondary" data-action="settle">No audio instead</button>' : '',
        '</div></div>',
        state.error ? '<p role="alert" class="q-error">' + safeText(state.error) + '</p>' : '',
        '</section>'
      ].join("");
    } else if (state.screen === "running") {
      const remaining = formatTime(state.duration - state.elapsedMs / 1000);
      const showBreathCompanion = state.profile === "sync" && state.breathGuide;
      const syncStation = state.profile === "sync" && state.syncPlan
        ? window.FocusBridgeSync.stageAt(state.syncPlan, state.elapsedMs / 1000) : null;
      content = [
        '<div class="q-running', state.profile === "sleep" && state.mode === "listen" ? ' q-running-sleep' : '',
        PROFILES[state.profile]?.holistic ? ' q-running-comfort' : '',
        state.profile === "rife" ? ' q-running-rife' : '',
        state.profile === "lost" ? ' q-running-island' : '',
        state.profile === "sleep" && state.sleepDim ? ' q-sleep-dim' : '',
        '"><div class="q-eyebrow">',
        state.mode === "listen" ?
          safeText(PROFILES[state.profile].label.toUpperCase()) +
            (allSoundOff() ? ' · SILENT PRACTICE' : ' · SOUND ACTIVE') :
          state.profile === "qmm" ? 'QUIET MIND · INTENTIONALLY SILENT' : state.profile === "gdm" ? 'GOING DEEPER · INTENTIONALLY SILENT' : state.profile === "energy" ? 'BREATHING ENERGY · INTENTIONALLY SILENT' : state.profile === "tele" ? 'TELE-VISUALIZATION · INTENTIONALLY SILENT' : state.profile === "chakra" ? 'SEVEN-CENTER LIGHT · INTENTIONALLY SILENT' : state.profile === "clair" ? 'LISTENING IMAGERY · INTENTIONALLY SILENT' : state.profile === "energy6" ? 'CHAPTER 6 IMAGERY · INTENTIONALLY SILENT' : state.profile === "cleanse7" ? 'CHAPTER 7 COLORS · INTENTIONALLY SILENT' : 'JUST SETTLE · INTENTIONALLY SILENT', '</div>',
        state.profile === "qmm" && window.FocusBridgeQMM ? [
          '<section class="q-sync-active q-qmm-active" aria-label="Quiet Mind stage">',
          '<div class="q-sync-step">QMM · STAGE ', state.qmmStage + 1, ' OF 7</div>',
          '<h2>', safeText(window.FocusBridgeQMM.STAGES[state.qmmStage].title), '</h2>',
          '<p class="q-detail">No thought-free score. Each gentle return counts as practice.</p></section>'
        ].join("") : '',
        state.profile === "gdm" && window.FocusBridgeGDM ? [
          '<section class="q-sync-active q-gdm-active" aria-label="Going Deeper stage">',
          '<div class="q-sync-step">GDM · STAGE ', state.gdmStage + 1, ' OF 5 · ',
          safeText(window.FocusBridgeGDM.VISUALS[state.gdmVisual].label), '</div>',
          '<h2>', safeText(window.FocusBridgeGDM.STAGES[state.gdmStage].title), '</h2>',
          '<p class="q-detail">All descent and landing images are imagined; your body stays supported.</p></section>'
        ].join("") : '',
        state.profile === "energy" && window.FocusBridgeBreathingEnergy ? [
          '<section class="q-sync-active q-energy-active" aria-label="Breathing Energy stage">',
          '<div class="q-sync-step">BREATHING ENERGY · STAGE ', state.energyStage + 1, ' OF 6</div>',
          '<h2>', safeText(window.FocusBridgeBreathingEnergy.STAGES[state.energyStage].title), '</h2>',
          '<p class="q-detail">No fixed breath timing. Any light is imagined, and sensations are subjective.</p></section>'
        ].join("") : '',
        state.profile === "tele" && window.FocusBridgeTeleVisualization ? [
          '<section class="q-sync-active q-tele-active" aria-label="Chapter 3 imagined scene stage">',
          '<div class="q-sync-step">TELE-VISUALIZATION · STAGE ', state.teleStage + 1, ' OF 7</div>',
          '<h2>', safeText(window.FocusBridgeTeleVisualization.STAGES[state.teleStage].title), '</h2>',
          '<p class="q-detail">This is imaginative scene-building, not verified travel or external sensing.</p></section>'
        ].join("") : '',
        state.profile === "energy6" && window.FocusBridgeEnergyImagery ? [
          '<section class="q-sync-active q-energy6-active" aria-label="Chapter 6 imagery stage">',
          '<div class="q-sync-step">CHAPTER 6 · ',
          safeText(window.FocusBridgeEnergyImagery.THEMES[state.energy6Theme].label),
          ' · STAGE ', state.energy6Stage + 1, ' OF ',
          window.FocusBridgeEnergyImagery.THEMES[state.energy6Theme].stages.length, '</div>',
          '<h2>', safeText(window.FocusBridgeEnergyImagery.THEMES[state.energy6Theme].stages[state.energy6Stage].title), '</h2>',
          '<p class="q-detail">A subjective, imagined experience; no external effect is tested here.</p></section>'
        ].join("") : '',
        state.profile === "cleanse7" && window.FocusBridgeCleansing ? [
          '<section class="q-sync-active q-cleansing-active" aria-label="Chapter 7 symbolic color stage">',
          '<div class="q-sync-step">CHAPTER 7 · STAGE ', state.cleanse7Stage + 1, ' OF ',
          window.FocusBridgeCleansing.STAGES.length, '</div>',
          '<h2>', safeText(window.FocusBridgeCleansing.STAGES[state.cleanse7Stage].title), '</h2>',
          window.FocusBridgeCleansing.STAGES[state.cleanse7Stage].color ? [
            '<p class="q-detail"><span class="q-cleansing-swatch" aria-hidden="true" style="background-color:',
            safeText(window.FocusBridgeCleansing.STAGES[state.cleanse7Stage].hex),
            '"></span>', safeText(window.FocusBridgeCleansing.STAGES[state.cleanse7Stage].color),
            ' · ', safeText(window.FocusBridgeCleansing.STAGES[state.cleanse7Stage].points), '</p>'
          ].join("") : '',
          '<p class="q-detail">This is symbolic imagery. No medical or supernatural effect is measured.</p></section>'
        ].join("") : '',
        chapterEngine() ? [
          '<section class="q-sync-active q-chapter-active" aria-label="Book-derived imagery stage">',
          '<div class="q-sync-step">CHAPTER ', state.profile === "chakra" ? '4' : '5',
          ' · STAGE ', state.chapterStage + 1, ' OF ', chapterEngine().STAGES.length, '</div>',
          '<h2>', safeText(chapterEngine().STAGES[state.chapterStage].title), '</h2>',
          '<p class="q-detail">Subjective imagery and attention; no supernatural or medical state detected.</p></section>'
        ].join("") : '',
        syncStation ? [
          '<section class="q-sync-active" aria-label="Focus Sync stage">',
          '<div class="q-sync-step">', syncStation.kind === "return"
            ? 'GENTLE RETURN · FINAL STAGE' : 'STATION ' + (syncStation.index + 1) + ' OF 17', '</div>',
          '<h2>Focus ', safeText(syncStation.level), ' · ', safeText(syncStation.title), '</h2>',
          '<p>', safeText(syncStation.prompt), '</p>',
          '<p class="q-detail">A suggested listening stage, not proof that a focus level was reached.</p>',
          '</section>'
        ].join("") : '',
        state.profile === "lost" ? [
          '<section class="q-island-active" aria-label="Island 108 chapter">',
          '<span class="q-island-kicker">ISLAND SIGNAL · CHAPTER ', state.islandIndex + 1, ' OF 6</span>',
          '<h2>', safeText(ISLAND_SEGMENTS[state.islandIndex].title), '</h2>',
          '<p>', safeText(ISLAND_SEGMENTS[state.islandIndex].cue), '</p>',
          '<p class="q-detail">4 · 8 · 15 · 16 · 23 · 42 · original atmosphere, no borrowed audio.</p>',
          '</section>'
        ].join("") : '',
        state.profile === "intention" && intentionEngine
          ? intentionEngine.activeHtml(state, voiceAvailable()) : '',
        state.profile === "rife" ? [
          '<section class="q-rife-active"><div class="q-setup-step">AUDIBLE WAVEFORM DEMONSTRATION</div>',
          '<h2>', state.rife.frequency, ' Hz · ', safeText(state.rife.waveform), '</h2>',
          '<p>', state.rife.motion === "steady" ? 'Steady pitch' : 'Gentle pitch sweep', ' · ',
          state.rife.intensity, '% of the limited software gain</p>',
          '<p class="q-detail">Audio only. No RF transmission, disease treatment, or measured body response.</p></section>'
        ].join("") : '',
        '<div class="q-orb', showBreathCompanion ? ' q-orb-guided' : '',
        state.paused ? ' q-orb-paused' : '', '" aria-hidden="true" style="animation-delay:-',
        (state.elapsedMs / 1000).toFixed(2), 's"><div class="q-orb-inner"></div></div>',
        showBreathCompanion ? '<p id="q-breath-phase" class="q-breath-phase" role="status">' +
          (state.paused ? 'Breathing companion paused' : breathCue()) + '</p>' : '',
        '<div id="fb21-q-timer" class="q-timer" role="timer" aria-label="Remaining session time">', remaining, '</div>',
        '<p id="fb21-q-cue" class="q-cue">', state.paused ? 'Paused. Return whenever you like.' : cue(), '</p>',
        state.mode === "listen" && state.profile !== "rife" && !allSoundOff() ? [
          '<section class="q-master-panel q-master-running" aria-label="Live audio output">',
          '<label for="q-master"><strong>Master output</strong> · ',
          '<output id="q-master-value">', state.master, '%</output></label>',
          '<input type="range" id="q-master" min="0" max="100" step="5" value="', state.master,
          '" aria-label="Live master output level">',
          '<div class="q-master-meter" aria-hidden="true"><div id="q-master-meter-fill"></div></div>',
          '<small id="q-meter-reading">Digital peak monitor</small>',
          '</section>'
        ].join("") : '',
        '<div class="q-track"><div id="fb21-q-progress" style="width:',
        Math.round(100 * state.elapsedMs / (state.duration * 1000)), '%"></div></div>',
        '<div class="q-actions q-center"><button type="button" class="q-secondary" data-action="pause">',
        state.paused ? 'Resume' : 'Pause', '</button>',
        '<button type="button" class="q-return" data-action="return">Return now</button></div>',
        '<p class="q-detail">Returning early is always okay. This is practice, not a performance.</p>',
        '</div>'
      ].join("");
    } else if (state.screen === "return") {
      content = [
        '<div class="q-eyebrow">GENTLE RETURN</div><h1>You are here.</h1>',
        '<p class="q-lead">', state.interrupted ? 'Stopping early is a good choice when you need it.' :
          'Your session is complete.', ' Look around the room, feel your feet and hands, and move at your own pace.</p>',
        '<section class="q-panel">',
        '<h2>One thought to carry with you?</h2>',
        '<label class="q-note-label" for="q-note">Optional reflection. No scores, no milestones.</label>',
        '<textarea id="q-note" maxlength="1000" rows="3" placeholder="What did you notice?">',
        safeText(state.note), '</textarea>',
        state.error ? '<p role="alert" class="q-error">' + safeText(state.error) + '</p>' : '',
        '<div class="q-actions"><button type="button" class="q-primary" data-action="save">Save locally</button>',
        '<button type="button" class="q-secondary" data-action="home">Done, no note</button></div>',
        '</section>'
      ].join("");
    } else if (state.screen === "saved") {
      content = [
        '<div class="q-eyebrow">SAVED ON THIS DEVICE</div><h1>A little time, well spent.</h1>',
        '<p class="q-lead">Your reflection is in the existing Signal Ledger, available in the full cockpit.',
        ' You did not have to reach any special state for this session to count.</p>',
        '<div class="q-actions"><button type="button" class="q-primary" data-action="home">Back to Quiet Deck</button>',
        '<button type="button" class="q-secondary" data-action="lab">View the full ledger &amp; labs</button>',
        state.profile === "qmm" && !state.interrupted && state.elapsedMs >= (state.duration * 1000 - 1000)
          ? '<button type="button" class="q-secondary" data-action="qmm-continue">Continue to ' +
            safeText(["tele", "chakra", "energy6", "cleanse7"].includes(state.qmmNext) ? PROFILES[state.qmmNext].label :
              state.qmmNext === "targetlab" ? "Blind Target Lab" : PROFILES.gdm.label) + ' →</button>' : '',
        state.profile === "gdm" && !state.interrupted && state.elapsedMs >= (state.duration * 1000 - 1000)
          ? '<button type="button" class="q-secondary" data-action="gdm-continue">Continue to ' +
            safeText(state.gdmNext === "clair" ? PROFILES.clair.label : PROFILES.energy.label) + ' →</button>' : '',
        state.profile === "energy" && !state.interrupted && state.elapsedMs >= (state.duration * 1000 - 1000)
          ? '<button type="button" class="q-secondary" data-action="energy-continue">Continue to ' +
            safeText(PROFILES[state.energyNext || "explore"].label) + ' →</button>' : '',
        state.profile === "tele" && !state.interrupted && state.elapsedMs >= (state.duration * 1000 - 1000)
          ? '<button type="button" class="q-secondary" data-action="tele-targetlab">Open Blind Target Lab →</button>' : '',
        '</div>'
      ].join("");
    }
    root.innerHTML = frame(content);
  }
  root.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (["settle", "qmm", "gdm", "energy", "tele", "chakra", "clair", "energy6", "cleanse7", "targetlab", "atlas", "listen", "sleep", "intention", "focus", "explore", "sync", "rife", "lost", ...HOLISTIC_CHOICES.map(x => x.key)].includes(action)) selectMode(action);
    else if (action === "qmm-continue" && state.screen === "saved" &&
        state.profile === "qmm" && !state.interrupted &&
        state.elapsedMs >= state.duration * 1000 - 1000) {
      const target = state.qmmNext || "gdm";
      selectMode(target, true); // next rung is GDM, not an automatic jump to exploration
    }
    else if (action === "gdm-continue" && state.screen === "saved" &&
        state.profile === "gdm" && !state.interrupted &&
        state.elapsedMs >= state.duration * 1000 - 1000) {
      const target = state.gdmNext || "energy";
      selectMode(target, true, true); // the third rung is Breathing Energy
    }
    else if (action === "energy-continue" && state.screen === "saved" &&
        state.profile === "energy" && !state.interrupted &&
        state.elapsedMs >= state.duration * 1000 - 1000) {
      const target = state.energyNext || "explore";
      selectMode(target, true, true, true); // each preceding timed session was completed
    }
    else if (action === "tele-targetlab" && state.screen === "saved" &&
        state.profile === "tele" && !state.interrupted &&
        state.elapsedMs >= state.duration * 1000 - 1000) selectMode("targetlab", true);
    else if (action === "atlas-filter" && state.screen === "atlas" && window.FocusBridgeBodyAtlas) {
      const group = button.dataset.group;
      if (window.FocusBridgeBodyAtlas.GROUPS.some(g => g.id === group)) {
        state.atlas.category = group;
        state.atlas.selected = null;
        render();
      }
    }
    else if (action === "atlas-open" && state.screen === "atlas" && window.FocusBridgeBodyAtlas) {
      const id = button.dataset.atlasId;
      if (window.FocusBridgeBodyAtlas.get(id)) {
        state.atlas.selected = id;
        render();
      }
    }
    else if (action === "target-begin" && state.screen === "targetlab") beginTargetBlock();
    else if (action === "target-guess" && state.screen === "targetlab")
      guessTarget(button.dataset.targetIndex);
    else if (action === "lab") openLab();
    else if (action === "home") returnHome();
    else if (action === "back") returnToChoices();
    else if (action === "holistic") openHolistic();
    else if (action === "duration") {
      stopPreviewForChange();
      state.duration = Number(button.dataset.seconds); render();
    }
    else if (action === "gdm-visual" && state.screen === "prepare" &&
        state.profile === "gdm" && window.FocusBridgeGDM) {
      state.gdmVisual = window.FocusBridgeGDM.visual(button.dataset.visual);
      render();
    }
    else if (action === "cleanse7-style" && state.screen === "prepare" &&
        state.profile === "cleanse7" && window.FocusBridgeCleansing) {
      state.cleanse7Style = window.FocusBridgeCleansing.style(button.dataset.style);
      render();
    }
    else if (action === "energy6-theme" && state.screen === "prepare" &&
        state.profile === "energy6" && window.FocusBridgeEnergyImagery) {
      state.energy6Theme = window.FocusBridgeEnergyImagery.theme(button.dataset.theme);
      render();
    }
    else if (action === "energy-visual" && state.screen === "prepare" &&
        state.profile === "energy" && window.FocusBridgeBreathingEnergy) {
      state.energyVisual = window.FocusBridgeBreathingEnergy.visual(button.dataset.visual);
      render();
    }
    else if (action === "preview") startPreview();
    else if (state.screen === "prepare" && state.profile === "intention" &&
        action === "intention-save") saveIntentionRecipe();
    else if (state.screen === "prepare" && state.profile === "intention" &&
        action === "intention-new") {
      state.intentionId = "";
      state.intentionTitle = "";
      state.intentionScript = "";
      state.intentionCadence = "once";
      state.intentionSpeak = false;
      state.intentionConfirmDelete = false;
      state.intentionNotice = "Blank script ready. Your mixer levels are unchanged.";
      render();
    }
    else if (state.screen === "prepare" && state.profile === "intention" &&
        action === "intention-delete" && state.intentionId) {
      state.intentionConfirmDelete = true;
      state.intentionNotice = "Confirm deletion below. This only deletes the selected local recipe.";
      render();
    }
    else if (state.screen === "prepare" && state.profile === "intention" &&
        action === "intention-confirm-delete") deleteIntentionRecipe();
    else if (state.screen === "prepare" && state.profile === "intention" &&
        action === "intention-voice-preview" && state.safe &&
        !!state.intentionScript && voiceAvailable()) {
      if (state.previewActive || state.previewStarting) stopPreview("", false);
      intentionVoice();
    }
    else if (action === "sleep-voice-preview" && state.screen === "prepare" &&
        state.profile === "sleep" && state.safe && voiceAvailable()) {
      if (state.previewActive || state.previewStarting) stopPreview("", false);
      speakSleep("start");
    }
    else if (action === "stop-preview") stopPreview("Preview stopped. Adjust your mix or listen again.");
    else if (action === "island-reset" && state.screen === "prepare" && state.profile === "lost") {
      stopPreviewForChange();
      const profile = PROFILES.lost;
      for (const key of ["surf", "bass", "beat", "rain", "wind", "hum"]) state[key] = profile[key];
      state.humNote = profile.humNote;
      state.tones = false;
      state.duration = profile.duration;
      saveMix();
      render();
    }
    else if (action === "rife-frequency" && state.screen === "prepare" && state.profile === "rife") {
      const hz = Number(button.dataset.frequency);
      if (window.FocusBridgeRife.FREQUENCIES.includes(hz)) changeRifeSetting("frequency", hz);
    }
    else if (action === "sync-pace" && state.screen === "prepare" && state.profile === "sync") {
      const minutes = Number(button.dataset.minutes);
      if (window.FocusBridgeSync.PACES.includes(minutes)) {
        stopPreviewForChange();
        state.syncMinutes = minutes;
        state.syncPlan = window.FocusBridgeSync.timeline(minutes);
        state.duration = state.syncPlan.totalSeconds;
        render();
      }
    }
    else if (action === "start") startSession();
    else if (action === "review") {
      const id = !state.safe ? "#q-safe" : headphoneRequired() && !state.headphones ? "#q-headphones" :
        state.profile === "intention" && !state.intentionScript ? "#q-intention-script" : "#q-tones";
      const target = root.querySelector(id);
      if (target) {
        if (typeof target.scrollIntoView === "function") target.scrollIntoView({ behavior: "smooth", block: "center" });
        if (typeof target.focus === "function") target.focus({ preventScroll: true });
      }
    }
    else if (action === "pause") togglePause();
    else if (action === "return") finishSession(true);
    else if (action === "save") saveReflection();
  });
  root.addEventListener("change", (event) => {
    if (event.target.id === "q-safe") {
      if (!event.target.checked) stopPreviewForChange();
      state.safe = event.target.checked; render();
    }
    if (event.target.id === "q-headphones") {
      if (!event.target.checked) stopPreviewForChange();
      state.headphones = event.target.checked; render();
    }
    if (state.profile === "sleep" && state.screen === "prepare") {
      if (event.target.id === "q-sleep-guide")
        state.sleepGuide = voiceAvailable() && event.target.checked;
      if (event.target.id === "q-sleep-intention-speak")
        state.sleepSpeakIntention = voiceAvailable() && event.target.checked;
      if (event.target.id === "q-sleep-dim")
        state.sleepDim = event.target.checked;
      if (["q-sleep-guide", "q-sleep-intention-speak", "q-sleep-dim"].includes(event.target.id)) {
        saveSleepSettings(); render();
      }
    }
    if (state.profile === "intention" && state.screen === "prepare") {
      if (event.target.id === "q-intention-speak") {
        state.intentionSpeak = voiceAvailable() && event.target.checked;
        render();
      }
      if (event.target.id === "q-intention-cadence" && intentionEngine) {
        state.intentionCadence = intentionEngine.validCadence(event.target.value);
        render();
      }
      if (event.target.id === "q-intention-saved" && intentionEngine) {
        if (event.target.value) {
          const entry = state.intentionLibrary.find(e => e.id === event.target.value);
          if (entry) applyIntentionRecipe(entry);
        } else {
          state.intentionId = "";
          state.intentionTitle = "";
          state.intentionScript = "";
          state.intentionCadence = "once";
          state.intentionSpeak = false;
          state.intentionConfirmDelete = false;
          state.intentionNotice = "";
          render();
        }
      }
    }
    if (event.target.id === "q-guide-voice" && state.profile === "sync") {
      state.voiceGuide = voiceAvailable() && event.target.checked;
      saveGuidePreferences(); render();
    }
    if (event.target.id === "q-qmm-voice" && state.profile === "qmm" && state.screen === "prepare") {
      state.qmmVoice = voiceAvailable() && event.target.checked;
      render();
    }
    if (event.target.id === "q-gdm-voice" && state.profile === "gdm" && state.screen === "prepare") {
      state.gdmVoice = voiceAvailable() && event.target.checked;
      render();
    }
    if (event.target.id === "q-energy-voice" && state.profile === "energy" && state.screen === "prepare") {
      state.energyVoice = voiceAvailable() && event.target.checked;
      render();
    }
    if (event.target.id === "q-tele-voice" && state.profile === "tele" && state.screen === "prepare") {
      state.teleVoice = voiceAvailable() && event.target.checked;
      render();
    }
    if (event.target.id === "q-chapter-voice" && state.screen === "prepare" &&
        ["chakra", "clair"].includes(state.profile)) {
      state.chapterVoice = voiceAvailable() && event.target.checked;
      render();
    }
    if (event.target.id === "q-energy6-voice" && state.screen === "prepare" &&
        state.profile === "energy6") {
      state.energy6Voice = voiceAvailable() && event.target.checked;
      render();
    }
    if (event.target.id === "q-cleanse7-voice" && state.screen === "prepare" &&
        state.profile === "cleanse7") {
      state.cleanse7Voice = voiceAvailable() && event.target.checked;
      render();
    }
    if (event.target.id === "q-guide-breath") {
      state.breathGuide = event.target.checked;
      saveGuidePreferences(); render();
    }
    if (event.target.id === "q-tones") {
      stopPreviewForChange();
      state.tones = event.target.checked; saveMix(); render();
    }
    if (event.target.id === "q-hum-note" && state.profile !== "rife") {
      if ((window.FocusBridgeSoundscape?.HUM_NOTES || []).some(note => note.name === event.target.value)) {
        stopPreviewForChange();
        state.humNote = event.target.value;
        saveMix();
        render();
      }
    }
    if (event.target.id === "q-rife-waveform") changeRifeSetting("waveform", event.target.value);
    if (event.target.id === "q-rife-motion") changeRifeSetting("motion", event.target.value);
    if (event.target.id === "q-tone-palette" && PROFILES[state.profile]?.holistic) {
      const hz = Number(event.target.value);
      if (HOLISTIC_TONE_OPTIONS.includes(hz)) {
        stopPreviewForChange();
        state.toneDifference = hz; saveMix(); render();
      }
    }
  });
  root.addEventListener("input", (event) => {
    if (event.target.id === "q-atlas-search" && state.screen === "atlas" && window.FocusBridgeBodyAtlas) {
      const next = String(event.target.value || "").slice(0, 100);
      const cursor = Number.isInteger(event.target.selectionStart) ? event.target.selectionStart : next.length;
      state.atlas.search = next;
      state.atlas.selected = null;
      render();
      // Preserve keyboard focus across this small view rerender.
      const field = root.querySelector("#q-atlas-search");
      if (field && typeof field.focus === "function") {
        field.focus();
        if (typeof field.setSelectionRange === "function") {
          try { field.setSelectionRange(cursor, cursor); } catch {}
        }
      }
      return;
    }
    if (event.target.id === "q-note") state.note = event.target.value;
    if (state.profile === "intention" && state.screen === "prepare" && intentionEngine) {
      if (event.target.id === "q-intention-title")
        state.intentionTitle = intentionEngine.clean(event.target.value, intentionEngine.MAX_TITLE);
      if (event.target.id === "q-intention-script")
        state.intentionScript = intentionEngine.clean(event.target.value, intentionEngine.MAX_SCRIPT);
    }
    if (event.target.id === "q-sleep-intention" && state.profile === "sleep") {
      state.sleepIntention = window.FocusBridgeSleep
        ? window.FocusBridgeSleep.clean(event.target.value)
        : String(event.target.value || "").slice(0, 280);
      saveSleepSettings();
    }
    if (event.target.id === "q-master" && state.profile !== "rife") {
      state.master = level(event.target.value, 80);
      try { localStorage.setItem(MASTER_KEY, String(state.master)); } catch {}
      if (window.FocusBridgeAudioEngine) {
        for (const instance of [state.audio, state.previewAudio]) {
          if (instance && instance.bus)
            window.FocusBridgeAudioEngine.setLevel(instance.bus, state.master);
        }
      }
      const output = root.querySelector("#q-master-value");
      if (output) output.textContent = state.master + "%";
    }
    if (event.target.id === "q-rife-intensity" && state.profile === "rife") {
      const wasPreviewing = !!state.previewAudio || state.previewStarting;
      stopPreviewForChange();
      const intensity = Number(event.target.value);
      state.rife = window.FocusBridgeRife.config({ ...state.rife, intensity });
      const output = root.querySelector("#q-rife-intensity-value");
      if (output) output.textContent = state.rife.intensity + "%";
      try { localStorage.setItem(RIFE_SETTINGS_KEY, JSON.stringify(state.rife)); } catch {}
      if (wasPreviewing) render();
    }
    const match = /^q-mix-(surf|bass|beat|rain|wind|hum)$/.exec(event.target.id || "");
    if (match) {
      const wasPreviewing = !!state.previewAudio || state.previewStarting;
      const wasSilent = allSoundOff();
      stopPreviewForChange();
      const key = match[1];
      state[key] = level(event.target.value, 0);
      const display = root.querySelector("#q-mix-value-" + key);
      if (display) display.textContent = state[key] + "%";
      event.target.setAttribute("aria-valuetext", state[key] + " percent");
      saveMix();
      if (wasPreviewing || wasSilent !== allSoundOff()) render();
      else {
        const meter = root.querySelector("#q-preview-meter-" + key);
        if (meter) meter.style.width = state[key] + "%";
        const value = root.querySelector("#q-preview-value-" + key);
        if (value) value.textContent = state[key] + "%";
      }
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("fb21-quiet-mode")) {
      if (state.screen === "running") finishSession(true);
      else if (state.screen === "prepare" && (state.previewActive || state.previewStarting))
        stopPreview("Preview stopped.");
    }
  });
  window.addEventListener("pagehide", () => {
    stopPreview("", false);
    clearInterval(state.timer);
    stopAudio(false, true); // navigation cannot be trusted to run delayed cleanup
  });

  let openOldLab = false;
  try {
    openOldLab = sessionStorage.getItem(LAB_ONCE_KEY) === "1";
    sessionStorage.removeItem(LAB_ONCE_KEY);
  } catch {}
  setQuiet(!openOldLab);
})();