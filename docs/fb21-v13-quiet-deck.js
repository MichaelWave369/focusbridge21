/* FocusBridge21 Quiet Deck v1.3: optional, local-first front door. */
(() => {
  "use strict";
  const LEDGER_KEY = "focusbridge21-ledger-v1";
  const MIX_KEY = "focusbridge21-quiet-soundscape-v14";
  const readMix = () => {
    try { return JSON.parse(localStorage.getItem(MIX_KEY) || "{}"); } catch { return {}; }
  };
  const mix = readMix();
  const level = (x, fallback) => Number.isFinite(Number(x)) && x !== undefined && x !== null ? Math.max(0, Math.min(100, Number(x))) : fallback;
  const saveMix = () => {
    try { localStorage.setItem(MIX_KEY, JSON.stringify({ surf: state.surf, bass: state.bass, beat: state.beat, tones: state.tones })); } catch {}
  };
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
    screen: "home", mode: "settle", duration: 90, safe: false,
    headphones: false, elapsedMs: 0, lastTick: 0, timer: null,
    audio: null, paused: false, interrupted: false, starting: false, note: "", error: "",
    surf: level(mix.surf, 68), bass: level(mix.bass, 14), beat: level(mix.beat, 0), tones: mix.tones !== false
  };

  function safeText(value) {
    return String(value || "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
  function formatTime(seconds) {
    const n = Math.max(0, Math.ceil(seconds));
    return String(Math.floor(n / 60)).padStart(2, "0") + ":" + String(n % 60).padStart(2, "0");
  }
  function setQuiet(isQuiet) {
    document.body.classList.toggle("fb21-quiet-mode", isQuiet);
    root.hidden = !isQuiet;
    homeButton.hidden = isQuiet;
    if (isQuiet) render();
  }
  function openLab() {
    stopAudio();
    clearInterval(state.timer);
    try { sessionStorage.setItem(LAB_ONCE_KEY, "1"); } catch {}
    window.location.reload(); // also rehydrates the existing React ledger after a Quiet Deck receipt
  }
  function returnToQuiet() {
    try { sessionStorage.removeItem(LAB_ONCE_KEY); } catch {}
    window.location.reload(); // stops any ongoing React-session audio safely
  }
  homeButton.addEventListener("click", returnToQuiet);

  function selectMode(mode) {
    state.mode = mode;
    state.duration = mode === "listen" ? 120 : 90;
    state.safe = false;
    state.headphones = false;
    state.error = "";
    state.note = "";
    state.screen = "prepare";
    render();
  }
  function returnHome() {
    stopAudio();
    clearInterval(state.timer);
    state.screen = "home";
    state.error = "";
    render();
  }

  async function startAudio() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) throw new Error("Web Audio is not supported by this browser.");
    const context = new Context();
    const nodes = [];
    state.audio = { context, nodes };
    try {
      const merger = context.createChannelMerger(2);
      const left = context.createOscillator();
      const right = context.createOscillator();
      const leftGain = context.createGain();
      const rightGain = context.createGain();
      const volume = context.createGain();
      left.type = "sine";
      right.type = "sine";
      // Original gentle stereo tones; this is an audio experiment, not a focus-gate claim.
      left.frequency.value = 180;
      right.frequency.value = 188;
      leftGain.gain.value = 0.5;
      rightGain.gain.value = 0.5;
      const startAt = context.currentTime;
      const endAt = startAt + state.duration;
      volume.gain.setValueAtTime(0.0001, startAt);
      volume.gain.linearRampToValueAtTime(0.035, startAt + 1.5);
      volume.gain.setValueAtTime(0.035, endAt - 2);
      volume.gain.linearRampToValueAtTime(0.0001, endAt);
      if (state.tones) {
        left.connect(leftGain).connect(merger, 0, 0);
        right.connect(rightGain).connect(merger, 0, 1);
        merger.connect(volume).connect(context.destination);
        nodes.push(left, right, leftGain, rightGain, merger, volume);
      }
      await context.resume();
      if (state.tones) {
        left.start();
        right.start();
        // Hardware-side end time prevents tones running indefinitely in a suspended tab.
        left.stop(endAt + 0.1);
        right.stop(endAt + 0.1);
      }
      if (window.FocusBridgeSoundscape) {
        window.FocusBridgeSoundscape.schedule(context,
          { surf: state.surf, bass: state.bass, beat: state.beat },
          state.duration, state.audio);
      }
    } catch (error) {
      stopAudio();
      throw error;
    }
  }
  function stopAudio() {
    if (!state.audio) return;
    const audio = state.audio;
    state.audio = null;
    for (const node of audio.nodes) {
      try { if (typeof node.stop === "function") node.stop(); } catch {}
      try { node.disconnect(); } catch {}
    }
    try { if (audio.context.state !== "closed") audio.context.close(); } catch {}
  }
  async function startSession() {
    if (state.screen !== "prepare" || state.starting || !state.safe ||
        (state.mode === "listen" && !state.headphones)) return;
    state.starting = true;
    state.error = "";
    render();
    state.elapsedMs = 0;
    state.paused = false;
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
  }
  function cue() {
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
      finishSession(false);
      return;
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
      app: "FocusBridge21 v1.3 Quiet Deck",
      preset: "Foundation",
      target_gate: 10,
      duration_min: state.duration / 60,
      actual_elapsed_sec: elapsed,
      guidance_mode: "Quiet Deck " + state.mode,
      audio_params: { engine: state.mode === "listen" ? "original-browser-soundscape-v14" : "none",
        stereo_tones: state.mode === "listen" && state.tones,
        surf: state.mode === "listen" ? state.surf : 0,
        bass: state.mode === "listen" ? state.bass : 0,
        beat: state.mode === "listen" ? state.beat : 0 },
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
      '<strong>FocusBridge21</strong><small>THE QUIET DECK · v1.3</small></div></div>',
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
        '<button type="button" data-action="lab" class="q-choice">',
        '<span class="q-choice-icon" aria-hidden="true">⌘</span><span class="q-choice-kicker">THE COMPLETE COCKPIT</span>',
        '<strong>Explore the labs</strong><span>Every existing preset, audio tool, ledger, guide, and experiment is still here.</span>',
        '<span class="q-choice-link">Open full app →</span></button>',
        '</div>',
        '<p class="q-footnote">Not feeling well, dizzy, or faint? Skip audio practice and rest.',
        ' The full app has more detailed safety information.</p>'
      ].join("");
    } else if (state.screen === "prepare") {
      const listen = state.mode === "listen";
      const choices = [60, 90, 120, 300].map((seconds) =>
        '<button type="button" class="q-duration ' + (state.duration === seconds ? 'selected' : '') +
        '" data-action="duration" data-seconds="' + seconds +
        '" aria-pressed="' + (state.duration === seconds) + '">' +
        (seconds < 60 ? seconds + 's' : seconds === 60 ? '1 min' : seconds === 90 ? '90 sec' :
        seconds === 120 ? '2 min' : '5 min') + '</button>'
      ).join("");
      content = [
        '<button type="button" class="q-back" data-action="home">← Back to choices</button>',
        '<div class="q-eyebrow">', listen ? 'ORIGINAL STEREO AUDIO' : 'JUST SETTLE', '</div>',
        '<h1>', listen ? 'Listen gently.' : 'Make a little space.', '</h1>',
        '<p class="q-lead">', listen
          ? 'Low-volume stereo tones for personal exploration. They are not a verified way to reach a focus gate.'
          : 'No audio. No forced breath timing. Let thoughts come and go.', '</p>',
        '<section class="q-panel" aria-label="Session setup">',
        '<h2>How long feels comfortable?</h2><div class="q-durations">', choices, '</div>',
        listen ? '<div class="q-mixer"><h2>Make it sound like your place</h2>' +
          '<p class="q-detail">An original, gentle soundscape. Every layer is optional, and the mix stays on this device.</p>' +
          [['surf','Ocean surf','Slow, overlapping shoreline waves'],['bass','Warm sub-bass','A quiet 62 Hz foundation'],['beat','Soft pulse','A gentle 40 BPM anchor']]
            .map(([key, label, desc]) => '<label class="q-mix-row" for="q-mix-' + key + '"><span><strong>' + label + '</strong><small>' + desc + '</small></span>' +
            '<input type="range" min="0" max="100" step="5" id="q-mix-' + key + '" value="' + state[key] + '" aria-valuetext="' + state[key] + ' percent"><output id="q-mix-value-' + key + '">' + state[key] + '%</output></label>').join('') +
          '<label class="q-check"><input type="checkbox" id="q-tones" ' + (state.tones ? 'checked' : '') + '> <span>Include gentle stereo tones (optional)</span></label></div>' : '',
        '<p class="q-detail">', listen
          ? 'Use stereo headphones, keep volume low, and stop immediately if you feel uncomfortable.'
          : 'Sit or lie somewhere comfortable. Regular, natural breathing is enough.', '</p>',
        '<label class="q-check"><input type="checkbox" id="q-safe" ',
        state.safe ? 'checked' : '', '> <span>I am somewhere safe, feel steady, and am not dizzy, faint, or unwell.</span></label>',
        listen ? '<label class="q-check"><input type="checkbox" id="q-headphones" ' +
          (state.headphones ? 'checked' : '') +
          '> <span>I have stereo headphones on at a low, comfortable volume.</span></label>' : '',
        '<div class="q-actions"><button type="button" class="q-primary" data-action="start" ',
        (!state.safe || (listen && !state.headphones) || state.starting) ? 'disabled' : '',
        '>Start my session</button>',
        listen ? '<button type="button" class="q-secondary" data-action="settle">No audio instead</button>' : '',
        '</div>',
        state.error ? '<p role="alert" class="q-error">' + safeText(state.error) + '</p>' : '',
        '</section>'
      ].join("");
    } else if (state.screen === "running") {
      const remaining = formatTime(state.duration - state.elapsedMs / 1000);
      content = [
        '<div class="q-running"><div class="q-eyebrow">', state.mode === "listen" ? 'LISTEN & DRIFT' : 'JUST SETTLE', '</div>',
        '<div class="q-orb" aria-hidden="true"><div class="q-orb-inner"></div></div>',
        '<div id="fb21-q-timer" class="q-timer" role="timer" aria-label="Remaining session time">', remaining, '</div>',
        '<p id="fb21-q-cue" class="q-cue">', state.paused ? 'Paused. Return whenever you like.' : cue(), '</p>',
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
    if (action === "settle" || action === "listen") selectMode(action);
    else if (action === "lab") openLab();
    else if (action === "home") returnHome();
    else if (action === "duration") { state.duration = Number(button.dataset.seconds); render(); }
    else if (action === "start") startSession();
    else if (action === "pause") togglePause();
    else if (action === "return") finishSession(true);
    else if (action === "save") saveReflection();
  });
  root.addEventListener("change", (event) => {
    if (event.target.id === "q-safe") { state.safe = event.target.checked; render(); }
    if (event.target.id === "q-headphones") { state.headphones = event.target.checked; render(); }
    if (event.target.id === "q-tones") { state.tones = event.target.checked; saveMix(); render(); }
  });
  root.addEventListener("input", (event) => {
    if (event.target.id === "q-note") state.note = event.target.value;
    const match = /^q-mix-(surf|bass|beat)$/.exec(event.target.id || "");
    if (match) {
      const key = match[1];
      state[key] = level(event.target.value, 0);
      const display = root.querySelector("#q-mix-value-" + key);
      if (display) display.textContent = state[key] + "%";
      event.target.setAttribute("aria-valuetext", state[key] + " percent");
      saveMix();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.screen === "running" &&
        document.body.classList.contains("fb21-quiet-mode")) finishSession(true);
  });
  window.addEventListener("pagehide", () => { clearInterval(state.timer); stopAudio(); });

  let openOldLab = false;
  try {
    openOldLab = sessionStorage.getItem(LAB_ONCE_KEY) === "1";
    sessionStorage.removeItem(LAB_ONCE_KEY);
  } catch {}
  setQuiet(!openOldLab);
})();