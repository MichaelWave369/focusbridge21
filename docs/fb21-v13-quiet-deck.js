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
    drift: { label: "Listen & drift", duration: 120, surf: 68, bass: 14, beat: 0, tones: true, carrier: 180, difference: 8, space: 20 },
    lost: { label: "Island 108 · LOST-inspired", island: true, duration: 6480,
      surf: 42, bass: 8, beat: 4, rain: 23, wind: 16, hum: 15, humNote: "C3",
      tones: false, carrier: 180, difference: 8, space: 6 },
    sleep: { label: "Sleep Sanctuary", duration: 21600, surf: 60, bass: 8, beat: 0, tones: false, carrier: 180, difference: 4, space: 10 },
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
    settle: [60, 90, 120, 300, 600],
    drift: [120, 300, 900, 1500, 2700, 3600, 5400, 7200, 10800, 14400, 21600],
    lost: [900, 2700, 3600, 6480, 10800],
    sleep: [1800, 3600, 5400, 7200, 10800, 14400, 21600],
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
    syncMinutes: 12, syncPlan: null, syncStage: 0, islandIndex: 0,
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
    voiceGuide: guidePrefs.voice === true, breathGuide: guidePrefs.breath === true
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
  function speakGate(stage) {
    if (!state.voiceGuide || state.profile !== "sync" || !voiceAvailable()) return;
    const introduction = stage.kind === "return"
      ? "Now begin a gentle return."
      : "Focus " + stage.level + ". " + stage.title + ".";
    window.FocusBridgeVoice.say(introduction + " " + stage.prompt);
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

  function selectMode(mode) {
    stopPreview("", false);
    state.previewMessage = "";
    state.previewError = "";
    state.mode = mode === "settle" ? "settle" : "listen";
    state.profile = mode === "settle" || mode === "listen" ? "drift" : mode;
    const profile = PROFILES[state.profile];
    state.duration = mode === "settle" ? 90 : profile.duration;
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
    stopPreview("", false);
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
        (state.mode === "listen" && ((headphoneRequired() && !state.headphones) || allSoundOff()))) return;
    stopPreview("", false); // no preview oscillator may overlap the committed session
    state.starting = true;
    state.error = "";
    render();
    state.elapsedMs = 0;
    state.paused = false;
    state.syncStage = 0;
    state.islandIndex = 0;
    if (state.mode === "listen") {
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
  }
  function cue() {
    if (state.profile === "lost")
      return ISLAND_SEGMENTS[islandStageAt(state.elapsedMs, state.duration)].cue;
    if (state.profile === "rife" && state.mode === "listen")
      return "Notice the sound only if comfortable. A pitch is not a medical treatment.";
    if (state.profile === "sync" && state.syncPlan)
      return window.FocusBridgeSync.stageAt(state.syncPlan, state.elapsedMs / 1000).prompt;
    if (state.profile === "sleep" && state.mode === "listen")
      return "Nothing to follow. Let the quiet soundscape carry on while you rest.";
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
    if (state.voiceGuide && window.FocusBridgeVoice) {
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
      preset: state.mode === "settle" || state.profile === "drift" ? "Foundation" : PROFILES[state.profile].label,
      target_gate: state.mode === "settle" || state.profile === "drift" ? 10 : null,
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
      guidance_mode: "Quiet Deck " + state.mode,
      voice_guidance_opted_in: state.profile === "sync" && state.voiceGuide && voiceAvailable(),
      optional_breath_visual: state.breathGuide,
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
  function frame(inner) {
    return [
      '<div class="q-shell">',
      '<header class="q-header"><div class="q-brand"><span class="q-sigil">Φ</span><div>',
      '<strong>FocusBridge21</strong><small>THE QUIET DECK · v2.4</small></div></div>',
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
        '<button type="button" data-action="listen" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">♫</span><span class="q-choice-kicker">STEREO HEADPHONES</span>',
        '<strong>Listen &amp; drift</strong><span>Soft original stereo tones and a gentle return.</span>',
        '<span class="q-choice-link">Choose a session →</span></button>',
        '<button type="button" data-action="sleep" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">☾</span><span class="q-choice-kicker">UP TO 6 HOURS</span>',
        '<strong>Sleep Sanctuary</strong><span>Gentle surf and a quiet fade. Stereo tones are off by default.</span>',
        '<span class="q-choice-link">Set up sleep →</span></button>',
        '<button type="button" data-action="focus" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">◎</span><span class="q-choice-kicker">STEADY ATTENTION</span>',
        '<strong>Deep Focus</strong><span>A stable, unobtrusive sound field for work or study.</span>',
        '<span class="q-choice-link">Set up focus →</span></button>',
        '<button type="button" data-action="explore" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">◇</span><span class="q-choice-kicker">SUBJECTIVE EXPLORATION</span>',
        '<strong>Threshold Explorer</strong><span>Slow spatial movement for imagery and personal reflection.</span>',
        '<span class="q-choice-link">Set up exploration →</span></button>',
        '<button type="button" data-action="sync" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">◎</span><span class="q-choice-kicker">COMPLETE LEVEL JOURNEY</span>',
        '<strong>Focus Sync</strong><span>All 17 publicly named focus-level stations, with a grounded return and original evolving audio.</span>',
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
    } else if (state.screen === "prepare") {
      const listen = state.mode === "listen";
      const needsHeadphones = listen && headphoneRequired() && !state.headphones;
      const needsSound = listen && allSoundOff();
      const canBegin = state.safe && !needsHeadphones && !needsSound;
      const readinessHint = !state.safe
        ? "Check the comfort and safety box above to unlock Start."
        : needsHeadphones
          ? "Confirm your stereo headphones above to unlock Start."
          : needsSound
            ? "Enable a sound layer or switch to Just settle before starting."
            : "All set. Your session is ready to start.";
      const choices = state.profile === "sync"
        ? window.FocusBridgeSync.PACES.map(minutes => {
            const plan = window.FocusBridgeSync.timeline(minutes);
            return '<button type="button" class="q-duration ' + (state.syncMinutes === minutes ? 'selected' : '') +
              '" data-action="sync-pace" data-minutes="' + minutes +
              '" aria-pressed="' + (state.syncMinutes === minutes) + '">' +
              minutes + ' min/station · ' + formatTime(plan.totalSeconds) + '</button>';
          }).join("")
        : DURATIONS[listen ? state.profile : "settle"].map((seconds) =>
            '<button type="button" class="q-duration ' + (state.duration === seconds ? 'selected' : '') +
            '" data-action="duration" data-seconds="' + seconds +
            '" aria-pressed="' + (state.duration === seconds) + '">' +
            (state.profile === "lost" && seconds === 6480 ? '108 min · full island loop' :
              seconds === 90 ? '90 sec' : seconds < 3600 ? (seconds / 60) + ' min' :
              (seconds / 3600) + ' hr') + '</button>'
          ).join("");
      content = [
        '<button type="button" class="q-back" data-action="back">← Back to ', PROFILES[state.profile]?.holistic ? 'Holistic Zone' : 'choices', '</button>',
        '<div class="q-eyebrow">', listen ? safeText(PROFILES[state.profile].label.toUpperCase()) : 'JUST SETTLE', '</div>',
        '<h1>', listen ? safeText(PROFILES[state.profile].label) + '.' : 'Make a little space.', '</h1>',
        '<p class="q-lead">', listen
          ? PROFILES[state.profile].rife
            ? 'A browser-based audio oscillator inspired by the history of frequency experimentation. NOT a Rife RF device, an electromagnetic treatment, or a medical therapy. Audible Hz cannot diagnose or cure disease.'
            : PROFILES[state.profile].holistic
              ? 'Low-stimulation comfort listening, not a medical treatment. No audio frequency is proven to treat this symptom.'
              : state.profile === "lost"
                ? 'Welcome to Island 108: a mysterious, peaceful, LOST-inspired island listening trip built from original synthesized surf, rain, wind, bass, pulse and C3 HUM. No copied soundtrack or sound effects.'
                : 'Original procedural sound with optional stereo tones. Presets are creative listening experiences, not verified brain-state induction.'
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
        listen && state.profile !== "rife" ? [
          '<section class="q-master-panel" aria-label="Audio engine master output">',
          '<div class="q-setup-step">Φ AUDIO ENGINE · MASTER OUTPUT</div>',
          '<label for="q-master"><strong>Master output</strong> · ',
          '<output id="q-master-value">', state.master, '%</output></label>',
          '<input type="range" id="q-master" min="0" max="100" step="5" value="',
          state.master, '" aria-label="Master output level">',
          '<p class="q-detail">Relative digital mixer gain, not measured headphone loudness. Start with your device volume low. Changes also apply during preview.</p>',
          '</section>'
        ].join("") : '',
        listen ? [
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
        listen && allSoundOff() ? '<p role="alert" class="q-error">All sound layers are off. Turn up Ocean surf, Rain, Wind, HUM, or enable stereo tones; choose Just settle for silence.</p>' : '',
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
      const syncStation = state.profile === "sync" && state.syncPlan
        ? window.FocusBridgeSync.stageAt(state.syncPlan, state.elapsedMs / 1000) : null;
      content = [
        '<div class="q-running', state.profile === "sleep" && state.mode === "listen" ? ' q-running-sleep' : '',
        PROFILES[state.profile]?.holistic ? ' q-running-comfort' : '',
        state.profile === "rife" ? ' q-running-rife' : '',
        state.profile === "lost" ? ' q-running-island' : '', '"><div class="q-eyebrow">',
        state.mode === "listen" ? safeText(PROFILES[state.profile].label.toUpperCase()) + ' · SOUND ACTIVE' : 'JUST SETTLE · INTENTIONALLY SILENT', '</div>',
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
        state.profile === "rife" ? [
          '<section class="q-rife-active"><div class="q-setup-step">AUDIBLE WAVEFORM DEMONSTRATION</div>',
          '<h2>', state.rife.frequency, ' Hz · ', safeText(state.rife.waveform), '</h2>',
          '<p>', state.rife.motion === "steady" ? 'Steady pitch' : 'Gentle pitch sweep', ' · ',
          state.rife.intensity, '% of the limited software gain</p>',
          '<p class="q-detail">Audio only. No RF transmission, disease treatment, or measured body response.</p></section>'
        ].join("") : '',
        '<div class="q-orb', state.breathGuide ? ' q-orb-guided' : '',
        state.paused ? ' q-orb-paused' : '', '" aria-hidden="true" style="animation-delay:-',
        (state.elapsedMs / 1000).toFixed(2), 's"><div class="q-orb-inner"></div></div>',
        state.breathGuide ? '<p id="q-breath-phase" class="q-breath-phase" role="status">' +
          (state.paused ? 'Breathing companion paused' : breathCue()) + '</p>' : '',
        '<div id="fb21-q-timer" class="q-timer" role="timer" aria-label="Remaining session time">', remaining, '</div>',
        '<p id="fb21-q-cue" class="q-cue">', state.paused ? 'Paused. Return whenever you like.' : cue(), '</p>',
        state.mode === "listen" && state.profile !== "rife" ? [
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
        '<button type="button" class="q-secondary" data-action="lab">View the full ledger &amp; labs</button></div>'
      ].join("");
    }
    root.innerHTML = frame(content);
  }
  root.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (["settle", "listen", "sleep", "focus", "explore", "sync", "rife", "lost", ...HOLISTIC_CHOICES.map(x => x.key)].includes(action)) selectMode(action);
    else if (action === "lab") openLab();
    else if (action === "home") returnHome();
    else if (action === "back") returnToChoices();
    else if (action === "holistic") openHolistic();
    else if (action === "duration") {
      stopPreviewForChange();
      state.duration = Number(button.dataset.seconds); render();
    }
    else if (action === "preview") startPreview();
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
      const id = !state.safe ? "#q-safe" : headphoneRequired() && !state.headphones ? "#q-headphones" : "#q-tones";
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
    if (event.target.id === "q-guide-voice" && state.profile === "sync") {
      state.voiceGuide = voiceAvailable() && event.target.checked;
      saveGuidePreferences(); render();
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
    if (event.target.id === "q-note") state.note = event.target.value;
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
      stopPreviewForChange();
      const key = match[1];
      state[key] = level(event.target.value, 0);
      const display = root.querySelector("#q-mix-value-" + key);
      if (display) display.textContent = state[key] + "%";
      event.target.setAttribute("aria-valuetext", state[key] + " percent");
      saveMix();
      if (wasPreviewing) render();
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