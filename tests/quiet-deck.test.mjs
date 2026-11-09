// Dependency-free smoke tests for the v1.3 Quiet Deck front door.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const dir = fileURLToPath(new URL("..", import.meta.url));
const read = (p) => readFileSync(join(dir, p), "utf8");
const script = read("docs/fb21-v13-quiet-deck.js");
const syncScript = read("docs/fb21-focus-sync.js");
const rifeScript = read("docs/fb21-rife-lab.js");
const soundscapeWindow = {};
runInNewContext(read("docs/fb21-soundscape.js"), { window: soundscapeWindow, Math });
const HUM_NOTES = soundscapeWindow.FocusBridgeSoundscape.HUM_NOTES;

function harness({ withAudio = false, withVoice = false } = {}) {
  let clock = Date.now();
  const elements = [];
  const timers = new Map();
  const storage = new Map();
  const session = new Map();
  const classes = new Map();
  const contexts = [];
  const scheduled = [];
  const spoken = [], voiceOps = [];
  let reloads = 0;
  let nextTimer = 1;
  class FakeDate extends Date { static now() { return clock; } }
  class FakeNode {
    constructor() {
      this.frequency = {
        value: 0, events: [],
        setValueAtTime(value, at) { this.value = value; this.events.push({ kind: "set", value, at }); },
        linearRampToValueAtTime(value, at) { this.value = value; this.events.push({ kind: "ramp", value, at }); }
      };
      this.gain = {
        value: 0,
        setValueAtTime() {},
        linearRampToValueAtTime() {}
      };
    }
    connect() { return this; }
    disconnect() {}
    start() {}
    stop(when) { this.stopTime = when; }
  }
  class FakeAudioContext {
    constructor() { this.currentTime = 0; this.state = "running"; this.destination = new FakeNode(); contexts.push(this); }
    createChannelMerger() { return new FakeNode(); }
    createOscillator() { const oscillator = new FakeNode(); this.oscillators ||= []; this.oscillators.push(oscillator); return oscillator; }
    createGain() { return new FakeNode(); }
    async resume() { this.state = "running"; }
    async suspend() { this.state = "suspended"; }
    close() { this.state = "closed"; }
  }
  const newElement = () => ({
    listeners: {}, innerHTML: "", hidden: false,
    setAttribute() {},
    addEventListener(kind, listener) { this.listeners[kind] = listener; },
    querySelector() { return null; }
  });
  const document = {
    createElement: newElement,
    addEventListener() {},
    body: {
      append(...items) { elements.push(...items); },
      classList: {
        toggle(key, value) { classes.set(key, value); },
        contains(key) { return !!classes.get(key); }
      }
    }
  };
  const window = {
    addEventListener() {},
    location: { reload() { reloads++; } },
    FocusBridgeSoundscape: { HUM_NOTES, schedule(ctx, options, seconds) {
      scheduled.push({ ctx, options, seconds }); return true;
    } },
    ...(withAudio ? { AudioContext: FakeAudioContext } : {}),
    ...(withVoice ? {
      SpeechSynthesisUtterance: class {
        constructor(text) { this.text = text; }
      },
      speechSynthesis: {
        getVoices() { return [{ lang: "en-US", localService: true }]; },
        speak(utterance) { spoken.push(utterance.text); voiceOps.push("speak"); },
        cancel() { voiceOps.push("cancel"); },
        pause() { voiceOps.push("pause"); },
        resume() { voiceOps.push("resume"); }
      }
    } : {})
  };
  const localStorage = {
    getItem(key) { return storage.get(key) ?? null; },
    setItem(key, value) { storage.set(key, value); }
  };
  const sessionStorage = {
    getItem(key) { return session.get(key) ?? null; },
    setItem(key, value) { session.set(key, value); },
    removeItem(key) { session.delete(key); }
  };
  const setInterval = (callback) => { const id = nextTimer++; timers.set(id, callback); return id; };
  const clearInterval = (id) => timers.delete(id);

  runInNewContext(read("docs/fb21-audio-engine.js"), { window, Uint8Array });
  runInNewContext(syncScript, { window });
  runInNewContext(rifeScript, { window });
  runInNewContext(read("docs/fb21-voice-guide.js"), { window });
  runInNewContext(read("docs/fb21-sleep-studio.js"), { window });
  runInNewContext(read("docs/fb21-intention-studio.js"), { window, Date: FakeDate });
  runInNewContext(script, { document, window, localStorage, sessionStorage,
    setInterval, clearInterval, Date: FakeDate });
  const root = elements.find((item) => item.id === "fb21-quiet-root");
  assert.ok(root, "quiet root exists");
  const click = (action, seconds, minutes, frequency) => root.listeners.click({
    target: { closest: () => ({ disabled: false, dataset: { action, seconds, minutes, frequency } }) }
  });
  const check = (id, value = true) => root.listeners.change({ target: { id, checked: value } });
  const note = (value) => root.listeners.input({ target: { id: "q-note", value } });
  const setMix = (key, value) => root.listeners.input({ target: { id: "q-mix-" + key, value, setAttribute() {} } });
  const setHumNote = (value) => root.listeners.change({ target: { id: "q-hum-note", value } });
  const setMaster = (value) => root.listeners.input({ target: { id: "q-master", value } });
  const setSleepIntention = (value) => root.listeners.input({ target: { id: "q-sleep-intention", value } });
  const setIntention = (key, value) => root.listeners.input({ target: { id: "q-intention-" + key, value } });
  const chooseIntention = (id) => root.listeners.change({ target: { id: "q-intention-saved", value: id } });
  const cadence = (value) => root.listeners.change({ target: { id: "q-intention-cadence", value } });
  const advance = (milliseconds) => {
    clock += milliseconds;
    for (const callback of [...timers.values()]) callback();
  };
  return { root, click, check, note, setMix, setHumNote, setMaster, setSleepIntention, setIntention, chooseIntention, cadence, advance, storage, classes, contexts, scheduled, session, spoken, voiceOps,
    get reloads() { return reloads; } };
}

test("both Pages entrypoints reference Quiet Deck while retaining the original app", () => {
  for (const p of ["index.html", "docs/index.html"]) {
    const html = read(p);
    assert.match(html, /fb21-v13-quiet-deck\.css/);
    assert.match(html, /fb21-v13-quiet-deck\.js/);
    assert.match(html, /fb21-focus-sync\.js/);
    assert.match(html, /fb21-rife-lab\.js/);
    assert.ok(html.indexOf("fb21-rife-lab.js") < html.indexOf("fb21-v13-quiet-deck.js"));
    assert.ok(html.indexOf("fb21-focus-sync.js") < html.indexOf("fb21-v13-quiet-deck.js"),
      "the sequence helper loads before Quiet Deck");
    assert.match(html, /fb21-react\.js/);
    assert.match(html, /fb21-v12-experience\.js/);
  }
  assert.match(read("service-worker.js"), /(?:focusbridge21-v1-(?:3-quiet-deck|4-original-soundscape|5-audio-feedback|6-extended-audio|7-onboarding|8-holistic-comfort|9-focus-sync)|focusbridge21-v2-0-rife-audio-lab|focusbridge21-v2-1-weather-hum|focusbridge21-v2-2-island-108|focusbridge21-v2-3-mix-preview|focusbridge21-v2-4-guided-audio|focusbridge21-v2-5-master-audio-engine|focusbridge21-v2-6-sleep-intentions|focusbridge21-v2-7-intention-studio)/);
  assert.match(read("service-worker.js"), /fb21-v13-quiet-deck\.js/);
  assert.match(read("service-worker.js"), /fb21-v13-quiet-deck\.css/);
});

test("new visitors see quiet home; safety gate, return, ledger and lab handoff work", () => {
  const app = harness();
  assert.equal(app.classes.get("fb21-quiet-mode"), true);
  assert.match(app.root.innerHTML, /Start where/);
  app.click("settle");
  assert.match(app.root.innerHTML, /Make a little space/);
  app.click("start");
  assert.match(app.root.innerHTML, /Make a little space/, "cannot start until safe");
  app.check("q-safe");
  app.click("start");
  assert.match(app.root.innerHTML, /Return now/);
  app.advance(15000);
  app.click("return");
  assert.match(app.root.innerHTML, /GENTLE RETURN/);
  app.note("I noticed the music in my thoughts.");
  app.click("save");
  assert.match(app.root.innerHTML, /SAVED ON THIS DEVICE/);
  const rows = JSON.parse(app.storage.get("focusbridge21-ledger-v1"));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].notes, "I noticed the music in my thoughts.");
  assert.equal(rows[0].post, undefined, "no invented coherence score");
  app.click("lab");
  assert.equal(app.reloads, 1);
  assert.equal(app.session.get("focusbridge21-open-lab-once-v13"), "1");
});

test("stereo mode requires both confirmations and stops its sound on return", async () => {
  const app = harness({ withAudio: true });
  app.click("listen");
  app.click("start");
  assert.equal(app.contexts.length, 0, "audio never starts without consent");
  app.check("q-safe");
  app.click("start");
  assert.equal(app.contexts.length, 0, "headphones are independently required");
  app.check("q-headphones");
  app.click("start");
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(app.contexts.length, 1);
  assert.match(app.root.innerHTML, /Return now/);
  app.click("return");
  assert.equal(app.contexts[0].state, "closed", "Web Audio context closes on return");
});

test("all soundscape layers off and stereo tones disabled cannot masquerade as playback", () => {
  const app = harness({ withAudio: true });
  app.click("listen");
  for (const layer of ["surf", "bass", "beat"]) app.setMix(layer, 0);
  app.check("q-tones", false);
  assert.match(app.root.innerHTML, /All sound layers are off/);
  app.check("q-safe", true);
  app.check("q-headphones", true);
  app.click("start");
  assert.doesNotMatch(app.root.innerHTML, /Return now/);
  assert.equal(app.contexts.length, 0);
});

test("Sleep Sanctuary offers six-hour ambience without headphone consent or sudden completion audio", async () => {
  const app = harness({ withAudio: true });
  app.click("sleep");
  assert.match(app.root.innerHTML, /6 hr/);
  assert.match(app.root.innerHTML, /Sleep Sanctuary/);
  assert.doesNotMatch(app.root.innerHTML, /id="q-headphones"/, "surf-only sleep allows speakers");
  app.check("q-safe");
  app.click("start");
  await new Promise(resolve => setImmediate(resolve));
  assert.match(app.root.innerHTML, /Return now/);
  assert.equal(app.contexts.length, 1);
  assert.equal(app.scheduled.length, 1);
  assert.equal(app.scheduled[0].seconds, 21600, "engine receives the full six hours");
  assert.equal(app.scheduled[0].options.space, 10);
  app.advance(45 * 60 * 1000);
  assert.match(app.root.innerHTML, /Return now/, "no 45-minute cutoff");
  app.advance((6 * 60 - 45) * 60 * 1000);
  assert.match(app.root.innerHTML, /GENTLE RETURN/);
  assert.equal(app.contexts[0].state, "closed");
});

test("focus and exploratory presets retain their independent, adjustable sessions", () => {
  const app = harness();
  app.click("focus");
  assert.match(app.root.innerHTML, /Deep Focus/);
  assert.match(app.root.innerHTML, /data-seconds="10800"/);
  app.click("home");
  app.click("explore");
  assert.match(app.root.innerHTML, /Threshold Explorer/);
  assert.match(app.root.innerHTML, /data-seconds="7200"/);
});

test("sleep tones are opt-in, require headphones, and stop at 30 minutes", async () => {
  const app = harness({ withAudio: true });
  app.click("sleep");
  app.check("q-tones");
  assert.match(app.root.innerHTML, /id="q-headphones"/);
  app.check("q-safe");
  app.click("start");
  assert.equal(app.contexts.length, 0, "headphone confirmation still required");
  app.check("q-headphones");
  app.click("start");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.contexts.length, 1);
  assert.equal(app.contexts[0].oscillators.length, 2);
  assert.ok(app.contexts[0].oscillators.every(n => Math.abs(n.stopTime - 1800.1) < 0.001));
  assert.equal(app.scheduled[0].seconds, 21600, "ambience runs past tone fade");
  app.click("return");
});

test("each original audio profile keeps its own local mixer settings", () => {
  const app = harness();
  app.click("sleep");
  app.setMix("surf", 35);
  app.click("home");
  app.click("focus");
  app.setMix("surf", 10);
  app.click("home");
  app.click("sleep");
  assert.match(app.root.innerHTML, /id="q-mix-surf" value="35"/);
  app.click("home");
  app.click("focus");
  assert.match(app.root.innerHTML, /id="q-mix-surf" value="10"/);
});

test("first-run safety confirmation is visually before optional sound controls and explains locked Start", () => {
  const app = harness({ withAudio: true });
  app.click("listen");
  const initial = app.root.innerHTML;
  assert.ok(initial.indexOf('id="q-safe"') < initial.indexOf('class="q-mixer"'),
    "the required check is encountered before the optional audio mixer");
  assert.match(initial, /STEP 1 OF 3 · SAFETY CHECK/);
  assert.match(initial, /Check the comfort and safety box above to unlock Start/);
  assert.match(initial, /Show me what to check/);
  assert.match(initial, /data-action="start" aria-describedby="q-readiness-hint" disabled/);
  app.click("review");
  app.check("q-safe");
  assert.match(app.root.innerHTML, /Confirm your stereo headphones above/);
  app.check("q-headphones");
  assert.match(app.root.innerHTML, /All set. Your session is ready to start/);
  assert.match(app.root.innerHTML, /data-action="start" aria-describedby="q-readiness-hint" >Start my session/);
});

test("speaker-based sleep asks for safety but not headphones until stereo tones are enabled", () => {
  const app = harness({ withAudio: true });
  app.click("sleep");
  assert.match(app.root.innerHTML, /Check the comfort and safety box above/);
  assert.doesNotMatch(app.root.innerHTML, /id="q-headphones"/);
  app.check("q-safe");
  assert.match(app.root.innerHTML, /All set. Your session is ready to start/);
  app.check("q-tones");
  assert.match(app.root.innerHTML, /Confirm your stereo headphones above/);
  assert.match(app.root.innerHTML, /id="q-headphones"/);
});

test("Holistic Zone is discoverable and makes no symptom-cure frequency claims", () => {
  const app = harness({ withAudio: true });
  assert.match(app.root.innerHTML, /Holistic Zone/);
  app.click("holistic");
  assert.match(app.root.innerHTML, /Headache \/ sound sensitivity/);
  assert.match(app.root.innerHTML, /Stomach discomfort/);
  assert.match(app.root.innerHTML, /Nausea \/ queasiness/);
  assert.match(app.root.innerHTML, /Everyday tension/);
  assert.match(app.root.innerHTML, /no particular Hz cures/);
  assert.match(app.root.innerHTML, /When to seek care/);
  assert.match(app.root.innerHTML, /Choose silence instead/);
});

test("headache comfort defaults are low stimulation, brief and require consent", async () => {
  const app = harness({ withAudio: true });
  app.click("holistic");
  app.click("headache");
  assert.match(app.root.innerHTML, /Headache Sensitivity/);
  assert.match(app.root.innerHTML, /id="q-mix-surf" value="8"/);
  assert.match(app.root.innerHTML, /id="q-mix-bass" value="0"/);
  assert.match(app.root.innerHTML, /id="q-mix-beat" value="0"/);
  assert.match(app.root.innerHTML, /id="q-tones"\s*>/);
  assert.doesNotMatch(app.root.innerHTML, /id="q-headphones"/);
  assert.match(app.root.innerHTML, /audio frequency is proven to treat this symptom/);
  app.click("start");
  assert.equal(app.contexts.length, 0, "must not bypass readiness");
  app.check("q-safe");
  app.click("start");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.scheduled.length, 1);
  assert.equal(app.scheduled[0].seconds, 600);
  assert.equal(app.scheduled[0].options.space, 0, "no moving stereo when sound sensitive");
  app.click("return");
  assert.equal(app.contexts[0].state, "closed");
});

test("holistic optional tones are not prescribed per symptom, and require headphones", async () => {
  const app = harness({ withAudio: true });
  app.click("holistic");
  app.click("nausea");
  assert.match(app.root.innerHTML, /id="q-tone-palette" disabled/);
  app.check("q-tones");
  assert.match(app.root.innerHTML, /id="q-headphones"/);
  assert.match(app.root.innerHTML, /Hz options are sound experiments/);
  app.check("q-safe");
  app.click("start");
  assert.equal(app.contexts.length, 0);
  app.check("q-headphones");
  app.click("start");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.contexts.length, 1);
  assert.equal(app.contexts[0].oscillators.length, 2);
  app.click("return");
});

test("Holistic Zone preserves its unique preset mixes without overwriting sleep", () => {
  const app = harness();
  app.click("holistic");
  app.click("stomach");
  app.setMix("surf", 27);
  app.click("back");
  assert.match(app.root.innerHTML, /Holistic <em>Zone/);
  app.click("stomach");
  assert.match(app.root.innerHTML, /id="q-mix-surf" value="27"/);
  app.click("home");
  app.click("sleep");
  assert.match(app.root.innerHTML, /id="q-mix-surf" value="60"/);
});

test("Holistic Zone has a completely silent fallback when sound is unpleasant", () => {
  const app = harness();
  app.click("holistic");
  app.click("settle");
  assert.match(app.root.innerHTML, /Make a little space/);
  assert.doesNotMatch(app.root.innerHTML, /class="q-mixer"/);
  app.check("q-safe");
  app.click("start");
  assert.match(app.root.innerHTML, /INTENTIONALLY SILENT/);
});

test("Focus Sync previews all published stations and four full-journey paces", () => {
  const app = harness();
  assert.match(app.root.innerHTML, /Focus Sync/);
  app.click("sync");
  assert.match(app.root.innerHTML, /Complete itinerary · 17 stations \+ return/);
  assert.match(app.root.innerHTML, /Focus 1/);
  assert.match(app.root.innerHTML, /Focus 34\/35/);
  assert.match(app.root.innerHTML, /Focus 49/);
  assert.match(app.root.innerHTML, /3:36:00/);
  assert.match(app.root.innerHTML, /5:52:00/);
  assert.match(app.root.innerHTML, /12-minute grounded return/);
  assert.match(app.root.innerHTML, /No stage is objectively achieved/);
});

test("Focus Sync preflight gates the full sequence and schedules smooth changes", async () => {
  const app = harness({ withAudio: true });
  app.click("sync");
  app.click("start");
  assert.equal(app.contexts.length, 0);
  app.check("q-safe");
  app.click("start");
  assert.equal(app.contexts.length, 0, "still requires stereo headphone consent");
  app.check("q-headphones");
  app.click("start");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.contexts.length, 1);
  assert.match(app.root.innerHTML, /STATION 1 OF 17/);
  assert.match(app.root.innerHTML, /Focus 1 · Arrival/);
  assert.equal(app.scheduled.length, 1);
  assert.equal(app.scheduled[0].seconds, 216 * 60);
  const changes = app.contexts[0].oscillators[1].frequency.events;
  assert.ok(changes.filter(x => x.kind === "ramp").length >= 17, "one gentle shift per station, including return");
  app.advance(12 * 60 * 1000);
  assert.match(app.root.innerHTML, /STATION 2 OF 17/);
  assert.match(app.root.innerHTML, /Focus 3 · Steady Attention/);
  app.click("return");
  assert.equal(app.contexts[0].state, "closed");
  assert.match(app.root.innerHTML, /GENTLE RETURN/);
});

test("deepest Focus Sync pace runs through all stations and grounded return without an early cutoff", async () => {
  const app = harness({ withAudio: true });
  app.click("sync");
  app.click("sync-pace", undefined, 20);
  assert.match(app.root.innerHTML, /5:52:00/);
  app.check("q-safe");
  app.check("q-headphones");
  app.click("start");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.scheduled[0].seconds, 352 * 60);
  app.advance(45 * 60 * 1000);
  assert.match(app.root.innerHTML, /Return now/);
  app.advance((17 * 20 - 45) * 60 * 1000);
  assert.match(app.root.innerHTML, /FINAL STAGE/);
  assert.match(app.root.innerHTML, /Gentle Reorientation/);
  app.advance(12 * 60 * 1000);
  assert.match(app.root.innerHTML, /GENTLE RETURN/);
  assert.equal(app.contexts[0].state, "closed");
  app.note("I followed the complete symbolic route.");
  app.click("save");
  const entries = JSON.parse(app.storage.get("focusbridge21-ledger-v1"));
  assert.equal(entries[0].sync_journey.last_listed_level, "Return");
  assert.equal(entries[0].sync_journey.finished_full_journey, true);
});

test("Quiet Deck has exactly nine first-run cards including Rife Frequency Lab", () => {
  const app = harness();
  const choices = app.root.innerHTML.match(/class="q-choice"/g) || [];
  assert.equal(choices.length, 9, "nine home cards form a 3 by 3 grid");
  assert.match(app.root.innerHTML, /Rife Frequency Lab/);
  app.click("rife");
  assert.match(app.root.innerHTML, /Audio oscillator|audio oscillator|browser-based audio oscillator/);
  assert.match(app.root.innerHTML, /not an RF|NOT a Rife RF device/);
  assert.match(app.root.innerHTML, /data-frequency="727"/);
  assert.match(app.root.innerHTML, /data-frequency="787"/);
  assert.match(app.root.innerHTML, /data-frequency="880"/);
  assert.match(app.root.innerHTML, /q-rife-waveform/);
  assert.match(app.root.innerHTML, /q-rife-motion/);
  assert.match(app.root.innerHTML, /q-rife-intensity/);
  assert.doesNotMatch(app.root.innerHTML, /class="q-mixer"/,
    "the separate audible tone lab does not pretend to be binaural soundscape mixing");
});

test("Rife audio lab requires checkboxes and uses exactly one finite low-gain oscillator", async () => {
  const app = harness({ withAudio: true });
  app.click("rife");
  app.click("start");
  assert.equal(app.contexts.length, 0, "no WebAudio until user checks safety");
  app.check("q-safe");
  app.click("start");
  assert.equal(app.contexts.length, 0, "headphone confirmation still required");
  app.check("q-headphones");
  app.click("start");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.contexts.length, 1);
  assert.equal(app.contexts[0].oscillators.length, 1, "not the two-channel binaural engine");
  assert.equal(app.contexts[0].oscillators[0].type, "sine");
  assert.equal(app.contexts[0].oscillators[0].stopTime, 300.05);
  assert.match(app.root.innerHTML, /AUDIBLE WAVEFORM DEMONSTRATION/);
  assert.match(app.root.innerHTML, /220 Hz/);
  assert.match(app.root.innerHTML, /Return now/);
  app.click("return");
  assert.equal(app.contexts[0].state, "closed");
});

test("Rife lab settings persist separately from established sleep profile", async () => {
  const app = harness({ withAudio: true });
  app.click("rife");
  app.click("rife-frequency", undefined, undefined, 727);
  assert.match(app.root.innerHTML, /data-frequency="727" aria-pressed="true"/);
  assert.match(app.storage.get("focusbridge21-rife-audio-lab-v1"), /"frequency":727/);
  app.click("duration", 900);
  app.check("q-safe");
  app.check("q-headphones");
  app.click("start");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.contexts[0].oscillators[0].frequency.value, 727);
  assert.equal(app.contexts[0].oscillators[0].stopTime, 900.05);
  app.advance(11 * 60 * 1000);
  assert.match(app.root.innerHTML, /Return now/, "no hidden early session cutoff");
  app.click("return");
  app.note("A neutral sound test, not a therapy");
  app.click("save");
  const ledger = JSON.parse(app.storage.get("focusbridge21-ledger-v1"));
  assert.equal(ledger[0].rife_audio_lab.frequency_hz, 727);
  assert.equal(ledger[0].rife_audio_lab.output_type.includes("not RF"), true);
  app.click("home");
  app.click("sleep");
  assert.match(app.root.innerHTML, /id="q-mix-surf" value="60"/);
  app.click("home");
  app.click("rife");
  assert.match(app.root.innerHTML, /data-frequency="727" aria-pressed="true"/);
});

test("all soundscape profiles expose rain, wind and 25-note HUM with defaults off", () => {
  const app = harness();
  for (const profile of ["listen", "sleep", "focus", "explore", "sync"]) {
    app.click(profile);
    assert.match(app.root.innerHTML, /id="q-mix-rain" value="0"/);
    assert.match(app.root.innerHTML, /id="q-mix-wind" value="0"/);
    assert.match(app.root.innerHTML, /id="q-mix-hum" value="0"/);
    assert.match(app.root.innerHTML, /id="q-hum-note"/);
    assert.match(app.root.innerHTML, /C3 · 130.81 Hz/);
    assert.match(app.root.innerHTML, /C5 · 523.25 Hz/);
    app.click("home");
  }
  app.click("holistic");
  app.click("headache");
  assert.match(app.root.innerHTML, /id="q-mix-rain" value="0"/);
  assert.match(app.root.innerHTML, /id="q-mix-wind" value="0"/);
  assert.match(app.root.innerHTML, /id="q-mix-hum" value="0"/);
  app.click("home");
  app.click("rife");
  assert.doesNotMatch(app.root.innerHTML, /id="q-mix-rain"/, "Rife mode remains a separate audio generator");
});

test("rain, wind and HUM can each be the sole sound layer without stereo headphones", async () => {
  for (const layer of ["rain", "wind", "hum"]) {
    const app = harness({ withAudio: true });
    app.click("sleep");
    app.setMix("surf", 0);
    app.setMix("bass", 0);
    app.setMix("beat", 0);
    for (const key of ["rain","wind","hum"]) app.setMix(key, key === layer ? 40 : 0);
    app.check("q-tones", false);
    assert.doesNotMatch(app.root.innerHTML, /All sound layers are off/);
    assert.doesNotMatch(app.root.innerHTML, /id="q-headphones"/);
    app.click("start");
    assert.equal(app.contexts.length, 0, "still requires safety consent");
    app.check("q-safe");
    app.click("start");
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(app.contexts.length, 1);
    assert.equal(app.scheduled.length, 1);
    assert.equal(app.scheduled[0].options[layer], 40);
    for (const other of ["rain","wind","hum"].filter(k => k !== layer))
      assert.equal(app.scheduled[0].options[other], 0);
    assert.match(app.root.innerHTML, /Return now/);
    app.click("return");
    assert.equal(app.contexts[0].state, "closed");
  }
});

test("six-layer mixer remembers unique profile settings and selected musical HUM note", () => {
  const app = harness();
  app.click("sleep");
  app.setMix("rain", 85);
  app.setMix("wind", 20);
  app.setMix("hum", 40);
  app.setHumNote("C5");
  const sleep = JSON.parse(app.storage.get("focusbridge21-quiet-profile-mixes-v16")).sleep;
  assert.equal(sleep.rain, 85);
  assert.equal(sleep.wind, 20);
  assert.equal(sleep.hum, 40);
  assert.equal(sleep.humNote, "C5");
  app.click("home");
  app.click("focus");
  app.setMix("rain", 15);
  app.setMix("wind", 55);
  app.setMix("hum", 5);
  app.setHumNote("C3");
  app.click("home");
  app.click("sleep");
  assert.match(app.root.innerHTML, /id="q-mix-rain" value="85"/);
  assert.match(app.root.innerHTML, /id="q-mix-wind" value="20"/);
  assert.match(app.root.innerHTML, /id="q-mix-hum" value="40"/);
  assert.match(app.root.innerHTML, /value="C5" selected/);
  app.click("home");
  app.click("focus");
  assert.match(app.root.innerHTML, /id="q-mix-rain" value="15"/);
  assert.match(app.root.innerHTML, /id="q-mix-wind" value="55"/);
  assert.match(app.root.innerHTML, /id="q-mix-hum" value="5"/);
  assert.match(app.root.innerHTML, /value="C3" selected/);
});

test("soundscape ledger records newly mixed layers and accurate HUM note", async () => {
  const app = harness({ withAudio: true });
  app.click("sleep");
  app.setMix("rain", 50);
  app.setMix("wind", 25);
  app.setMix("hum", 30);
  app.setHumNote("G3");
  app.check("q-safe");
  app.click("start");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.scheduled[0].options.rain, 50);
  assert.equal(app.scheduled[0].options.wind, 25);
  assert.equal(app.scheduled[0].options.hum, 30);
  assert.equal(app.scheduled[0].options.humNote, "G3");
  app.advance(45000);
  app.click("return");
  app.click("save");
  const receipt = JSON.parse(app.storage.get("focusbridge21-ledger-v1"))[0];
  assert.equal(receipt.audio_params.rain, 50);
  assert.equal(receipt.audio_params.wind, 25);
  assert.equal(receipt.audio_params.hum, 30);
  assert.equal(receipt.audio_params.hum_note, "G3");
  assert.equal(receipt.audio_params.stereo_tones, false);
});

test("Island 108 is a discoverable fan tribute without breaking the nine-box grid", () => {
  const app = harness();
  const home = app.root.innerHTML;
  assert.equal((home.match(/class="q-choice"/g) || []).length, 9);
  assert.match(home, /class="q-island-teaser"/);
  assert.match(home, /data-action="lost"/);
  assert.match(home, /4 · 8 · 15 · 16 · 23 · 42/);
  assert.match(home, /Not affiliated with the television series/);
  app.click("listen");
  assert.match(app.root.innerHTML, /Try Island 108/);
  app.click("lost");
  assert.match(app.root.innerHTML, /Island 108 · LOST-inspired/);
  assert.match(app.root.innerHTML, /108 min · full island loop/);
  assert.match(app.root.innerHTML, /No copied soundtrack or sound effects/);
});

test("Island 108 defaults match every number and require normal safety without stereo", async () => {
  const app = harness({ withAudio: true });
  app.click("lost");
  for (const [name, amount] of Object.entries({
    beat: 4, bass: 8, hum: 15, wind: 16, rain: 23, surf: 42
  })) {
    assert.match(app.root.innerHTML, new RegExp('id="q-mix-' + name + '" value="' + amount + '"'));
  }
  assert.match(app.root.innerHTML, /value="C3" selected/);
  assert.match(app.root.innerHTML, /id="q-tones"\s*>/);
  assert.doesNotMatch(app.root.innerHTML, /id="q-headphones"/);
  assert.match(app.root.innerHTML, /The Signal/);
  assert.match(app.root.innerHTML, /The Way Home/);
  app.click("start");
  assert.equal(app.contexts.length, 0);
  app.check("q-safe");
  app.click("start");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.contexts.length, 1);
  assert.equal(app.contexts[0].oscillators.length, 2, "existing inactive stereo oscillators are not started");
  assert.equal(app.contexts[0].oscillators[0].stopTime, undefined);
  assert.equal(app.scheduled.length, 1);
  assert.equal(app.scheduled[0].seconds, 6480);
  assert.equal(app.scheduled[0].options.humNote, "C3");
  assert.equal(app.scheduled[0].options.surf, 42);
  assert.equal(app.scheduled[0].options.space, 6);
  assert.match(app.root.innerHTML, /CHAPTER 1 OF 6/);
  assert.match(app.root.innerHTML, /Shoreline/);
  app.click("return");
  assert.equal(app.contexts[0].state, "closed");
});

test("Island 108 traverses six weighted chapters and ends after exactly 108 minutes", async () => {
  const app = harness({ withAudio: true });
  app.click("lost");
  app.check("q-safe");
  app.click("start");
  await new Promise(resolve => setImmediate(resolve));
  const steps = [
    [4, "CHAPTER 2 OF 6", "The Canopy"],
    [8, "CHAPTER 3 OF 6", "Under the Sky"],
    [15, "CHAPTER 4 OF 6", "The Signal"],
    [16, "CHAPTER 5 OF 6", "After Sundown"],
    [23, "CHAPTER 6 OF 6", "The Way Home"]
  ];
  for (const [minutes, marker, title] of steps) {
    app.advance((minutes * 60 + 1) * 1000);
    assert.match(app.root.innerHTML, new RegExp(marker));
    assert.match(app.root.innerHTML, new RegExp(title));
  }
  assert.match(app.root.innerHTML, /Return now/);
  assert.equal(app.contexts[0].state, "running");
  app.advance((42 * 60) * 1000);
  assert.match(app.root.innerHTML, /GENTLE RETURN/);
  assert.equal(app.contexts[0].state, "closed");
  app.note("The beach felt peaceful.");
  app.click("save");
  const receipt = JSON.parse(app.storage.get("focusbridge21-ledger-v1"))[0];
  assert.match(receipt.preset, /Island 108/);
  assert.equal(receipt.duration_min, 108);
  assert.equal(receipt.island_108.complete_default_duration_seconds, 6480);
  assert.equal(receipt.island_108.last_chapter, "The Way Home");
  assert.deepEqual(receipt.island_108.numbers, [4, 8, 15, 16, 23, 42]);
  assert.equal(receipt.island_108.completed, true);
});

test("Island shorter routes scale chapters and enabling binaural tones requires headphones", async () => {
  const app = harness({ withAudio: true });
  app.click("lost");
  app.click("duration", 900);
  app.check("q-tones");
  assert.match(app.root.innerHTML, /id="q-headphones"/);
  app.check("q-safe");
  app.click("start");
  assert.equal(app.contexts.length, 0);
  app.check("q-headphones");
  app.click("start");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.scheduled[0].seconds, 900);
  app.advance(5 * 60 * 1000);
  assert.match(app.root.innerHTML, /CHAPTER 4 OF 6/, "a scaled 15-minute journey still progresses");
  app.click("return");
  assert.equal(app.contexts[0].state, "closed");
});

test("Island 108 mix restores itself without overwriting Sleep Sanctuary or drift", () => {
  const app = harness();
  app.click("sleep");
  app.setMix("rain", 68);
  app.click("home");
  app.click("listen");
  app.setMix("surf", 79);
  app.click("home");
  app.click("lost");
  app.setMix("surf", 94);
  app.setMix("wind", 87);
  app.setHumNote("G4");
  app.click("duration", 3600);
  app.click("home");
  app.click("lost");
  assert.match(app.root.innerHTML, /id="q-mix-surf" value="94"/);
  assert.match(app.root.innerHTML, /id="q-mix-wind" value="87"/);
  assert.match(app.root.innerHTML, /value="G4" selected/);
  app.click("island-reset");
  assert.match(app.root.innerHTML, /id="q-mix-surf" value="42"/);
  assert.match(app.root.innerHTML, /id="q-mix-wind" value="16"/);
  assert.match(app.root.innerHTML, /value="C3" selected/);
  assert.match(app.root.innerHTML, /108 min · full island loop/);
  app.click("home");
  app.click("sleep");
  assert.match(app.root.innerHTML, /id="q-mix-rain" value="68"/);
  app.click("home");
  app.click("listen");
  assert.match(app.root.innerHTML, /id="q-mix-surf" value="79"/);
  const stored = JSON.parse(app.storage.get("focusbridge21-quiet-profile-mixes-v16"));
  assert.equal(stored.lost.surf, 42);
  assert.equal(stored.lost.humNote, "C3");
  assert.equal(stored.sleep.rain, 68);
  assert.equal(stored.drift.surf, 79);
});

test("preflight Preview Mix requires safety and stereo consent without starting a session", async () => {
  const app = harness({ withAudio: true });
  app.click("listen");
  assert.match(app.root.innerHTML, /Preview your selections/);
  assert.match(app.root.innerHTML, /data-action="preview" disabled/);
  assert.match(app.root.innerHTML, /not measured loudness or dB SPL/);
  app.click("preview");
  assert.equal(app.contexts.length, 0);
  app.check("q-safe");
  assert.match(app.root.innerHTML, /Confirm stereo headphones above to preview/);
  app.click("preview");
  assert.equal(app.contexts.length, 0);
  app.check("q-headphones");
  app.click("preview");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.contexts.length, 1);
  assert.equal(app.scheduled.length, 1);
  assert.equal(app.scheduled[0].seconds, 15, "sound check schedules 15 seconds only");
  assert.match(app.root.innerHTML, /Stop preview now/);
  assert.match(app.root.innerHTML, /Listening only, session not started/);
  assert.equal(app.storage.has("focusbridge21-ledger-v1"), false);
  app.advance(15001);
  assert.equal(app.contexts[0].state, "closed", "preview closes without user action");
  assert.match(app.root.innerHTML, /Preview finished/);
  assert.doesNotMatch(app.root.innerHTML, /GENTLE RETURN/, "preview never enters session completion");
  assert.equal(app.storage.has("focusbridge21-ledger-v1"), false, "no receipt created");
  app.click("start");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.contexts.length, 2, "committed session is a separate AudioContext");
  assert.equal(app.scheduled[1].seconds, 120, "full duration unchanged");
  assert.match(app.root.innerHTML, /Return now/);
  app.click("return");
  assert.equal(app.contexts[1].state, "closed");
});

test("Island 108 preview plays the exact selected six-layer mix and stops on retuning", async () => {
  const app = harness({ withAudio: true });
  app.click("lost");
  assert.match(app.root.innerHTML, /Ocean surf/);
  assert.match(app.root.innerHTML, /q-preview-value-surf">42%/);
  assert.match(app.root.innerHTML, /q-preview-value-beat">4%/);
  assert.match(app.root.innerHTML, /HUM note: <strong>C3/);
  assert.match(app.root.innerHTML, /Optional stereo tones are off/);
  assert.doesNotMatch(app.root.innerHTML, /id="q-headphones"/);
  app.check("q-safe");
  app.click("preview");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.scheduled.length, 1);
  assert.equal(app.scheduled[0].seconds, 15);
  for (const [key, val] of Object.entries({ surf: 42, bass: 8, beat: 4, rain: 23, wind: 16, hum: 15 }))
    assert.equal(app.scheduled[0].options[key], val);
  assert.equal(app.scheduled[0].options.humNote, "C3");
  assert.ok(app.contexts[0].oscillators.every(osc => osc.stopTime === undefined),
    "stereo tones remain disconnected and unstarted with the island mix");
  app.setMix("hum", 50);
  assert.equal(app.contexts[0].state, "closed", "changing a slider interrupts old preview");
  assert.match(app.root.innerHTML, /Settings changed/);
  assert.match(app.root.innerHTML, /q-preview-value-hum">50%/);
  app.click("preview");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.contexts.length, 2);
  assert.equal(app.scheduled[1].options.hum, 50);
  app.click("stop-preview");
  assert.equal(app.contexts[1].state, "closed");
  assert.match(app.root.innerHTML, /Preview stopped/);
  assert.equal(app.storage.has("focusbridge21-ledger-v1"), false);
  app.click("start");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.scheduled[2].seconds, 6480);
  assert.equal(app.scheduled[2].options.hum, 50, "full session uses last auditioned mix");
  assert.equal(app.contexts[2].state, "running");
  app.click("return");
});

test("Preview never extends a Focus Sync journey or schedules years of tone automation", async () => {
  const app = harness({ withAudio: true });
  app.click("sync");
  app.check("q-safe");
  app.check("q-headphones");
  assert.match(app.root.innerHTML, /opening Focus Sync stage only/);
  app.click("preview");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.scheduled[0].seconds, 15);
  const right = app.contexts[0].oscillators[1];
  assert.equal(right.frequency.value, 195);
  assert.equal(right.frequency.events.filter(event => event.kind === "ramp").length, 0,
    "full multi-hour station glides must not leak into a short audition");
  assert.ok(right.stopTime < 16);
  app.click("start");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.contexts[0].state, "closed");
  assert.equal(app.scheduled[1].seconds, 216 * 60);
  assert.ok(app.contexts[1].oscillators[1].frequency.events.some(e => e.kind === "ramp"));
  app.click("return");
});

test("Rife Frequency Lab uses the exact frequency and waveform in a finite preview", async () => {
  const app = harness({ withAudio: true });
  app.click("rife");
  app.click("rife-frequency", undefined, undefined, 787);
  app.check("q-safe");
  app.check("q-headphones");
  assert.match(app.root.innerHTML, /787 Hz · sine/);
  assert.match(app.root.innerHTML, /15-second sample/);
  app.click("preview");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.contexts.length, 1);
  const osc = app.contexts[0].oscillators[0];
  assert.equal(osc.frequency.value, 787);
  assert.equal(osc.stopTime, 15.05);
  assert.match(app.root.innerHTML, /Stop preview now/);
  app.advance(16000);
  assert.equal(app.contexts[0].state, "closed");
  app.click("start");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.contexts[1].oscillators[0].stopTime, 300.05,
    "Rife normal session still uses its approved duration");
  app.click("return");
});

test("No audio preview is allowed for a silent mix or the intentionally silent session", async () => {
  const app = harness({ withAudio: true });
  app.click("settle");
  assert.doesNotMatch(app.root.innerHTML, /data-action="preview"/);
  app.click("home");
  app.click("listen");
  for (const layer of ["surf","bass","beat","rain","wind","hum"]) app.setMix(layer, 0);
  app.check("q-tones", false);
  app.check("q-safe");
  assert.match(app.root.innerHTML, /data-action="preview" disabled/);
  app.click("preview");
  assert.equal(app.contexts.length, 0);
  app.setMix("rain", 20);
  app.check("q-safe"); // DOM-free harness rerenders after the slider changes
  assert.match(app.root.innerHTML, /q-preview-value-rain">20%/);
  app.click("preview");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.contexts.length, 1);
  assert.equal(app.scheduled[0].options.rain, 20);
  app.click("stop-preview");
  assert.equal(app.contexts[0].state, "closed");
});


test("Focus Sync voice and breathing companion are opt-in and stop on Return now", async () => {
  const app = harness({ withAudio: true, withVoice: true });
  app.click("sync");
  assert.match(app.root.innerHTML, /id="q-guide-voice"/);
  assert.match(app.root.innerHTML, /id="q-guide-breath"/);
  assert.equal(app.spoken.length, 0, "narration defaults off");
  app.check("q-guide-voice", true);
  app.check("q-guide-breath", true);
  assert.deepEqual(JSON.parse(app.storage.get("focusbridge21-quiet-guidance-v1")),
    { voice: true, breath: true });
  app.check("q-safe", true);
  app.check("q-headphones", true);
  app.click("start");
  await new Promise(resolve => setImmediate(resolve));
  assert.match(app.root.innerHTML, /id="q-breath-phase"/);
  assert.match(app.root.innerHTML, /q-orb-guided/);
  assert.equal(app.spoken.length, 1);
  assert.match(app.spoken[0], /Focus 1\. Arrival\./);
  app.advance(12 * 60 * 1000 + 1);
  assert.equal(app.spoken.length, 2, "next gate narrates exactly once");
  assert.match(app.spoken[1], /Focus 3\. Steady Attention\./);
  app.click("pause");
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(app.voiceOps.includes("pause"), "speech pauses after async audio suspension");
  app.click("pause");
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(app.voiceOps.includes("resume"), "speech resumes after async audio resume");
  app.click("return");
  assert.equal(app.contexts[0].state, "closed");
  assert.equal(app.spoken.length, 2, "Return now never queues an extra cue");
});

test("Focus Sync keeps written prompts when no speech engine exists", () => {
  const app = harness();
  app.click("sync");
  assert.match(app.root.innerHTML, /id="q-guide-voice" disabled/);
  assert.match(app.root.innerHTML, /browser has no speech voice available/);
  app.check("q-guide-breath", true);
  assert.match(app.root.innerHTML, /id="q-guide-breath" checked/);
});


test("v2.5 master fader persists, is available while running, and never bypasses safety checks", async () => {
  const app = harness({ withAudio: true });
  app.click("sleep");
  assert.match(app.root.innerHTML, /Φ AUDIO ENGINE · MASTER OUTPUT/);
  assert.match(app.root.innerHTML, /id="q-master" min="0" max="100" step="5" value="80"/);
  app.setMaster(35);
  assert.equal(app.storage.get("focusbridge21-master-level-v25"), "35");
  app.click("start");
  assert.equal(app.contexts.length, 0, "master fader does not bypass safety confirmation");
  app.check("q-safe");
  app.click("start");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.contexts.length, 1);
  assert.match(app.root.innerHTML, /q-master-running/);
  assert.match(app.root.innerHTML, /id="q-master" min="0" max="100" step="5" value="35"/);
  assert.match(app.root.innerHTML, /id="q-master-meter-fill"/);
  app.setMaster(60);
  assert.equal(app.storage.get("focusbridge21-master-level-v25"), "60");
  app.click("pause");
  await new Promise(resolve => setImmediate(resolve));
  app.click("return");
  assert.equal(app.contexts[0].state, "closed", "paused session stops immediately");
});

test("master can be adjusted during preview without creating a receipt", async () => {
  const app = harness({ withAudio: true });
  app.click("listen");
  app.check("q-safe");
  app.check("q-headphones");
  app.click("preview");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.contexts.length, 1);
  app.setMaster(25);
  assert.equal(app.storage.get("focusbridge21-master-level-v25"), "25");
  assert.equal(app.contexts[0].state, "running");
  assert.equal(app.storage.has("focusbridge21-ledger-v1"), false);
  app.click("stop-preview");
  assert.equal(app.contexts[0].state, "closed", "fake audio falls back to immediate stop");
});


test("Sleep Sanctuary+ starts its optional wind-down and speaks no cues after three minutes", async () => {
  const app = harness({ withAudio: true, withVoice: true });
  app.click("sleep");
  assert.match(app.root.innerHTML, /SLEEP SANCTUARY\+ · YOUR WIND-DOWN/);
  assert.match(app.root.innerHTML, /id="q-sleep-guide"/);
  assert.match(app.root.innerHTML, /id="q-sleep-intention-speak"/);
  assert.match(app.root.innerHTML, /id="q-sleep-dim" checked/);
  assert.equal(app.spoken.length, 0, "the sleep narrator is opt-in");
  app.setSleepIntention("Tonight I can rest.");
  app.check("q-sleep-intention-speak", true);
  app.check("q-sleep-guide", true);
  const saved = JSON.parse(app.storage.get("focusbridge21-sleep-intentions-v26"));
  assert.equal(saved.intention, "Tonight I can rest.");
  assert.equal(saved.speakIntention, true);
  assert.equal(saved.guide, true);
  app.click("sleep-voice-preview");
  assert.equal(app.spoken.length, 0, "preview requires safety consent");
  app.check("q-safe");
  app.click("sleep-voice-preview");
  assert.equal(app.spoken.length, 1, "voice preview is explicit");
  assert.match(app.spoken[0], /Tonight I can rest/);
  app.click("start");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.contexts.length, 1);
  assert.match(app.root.innerHTML, /q-sleep-dim/);
  assert.equal(app.spoken.length, 2, "session introduction plays once");
  app.advance(60 * 1000);
  assert.equal(app.spoken.length, 3, "one followup cue after the first minute");
  app.advance(180 * 1000);
  assert.equal(app.spoken.length, 3, "no repeated overnight speech");
  app.click("return");
  assert.equal(app.contexts[0].state, "closed");
  app.click("save");
  const receipt = JSON.parse(app.storage.get("focusbridge21-ledger-v1"))[0];
  assert.equal(receipt.sleep_wind_down.spoken_guide_opted_in, true);
  assert.equal(receipt.sleep_wind_down.spoken_personal_intention_opted_in, true);
  assert.equal(receipt.sleep_wind_down.saved_intention_text_excluded, true);
  assert.ok(!JSON.stringify(receipt).includes("Tonight I can rest"), "private intention not repeated in session ledger");
});

test("Sleep Sanctuary+ text is escaped, voice remains optional, and night mode may be disabled", () => {
  const app = harness();
  app.click("sleep");
  assert.match(app.root.innerHTML, /id="q-sleep-guide" disabled/);
  assert.match(app.root.innerHTML, /Voice is unavailable here/);
  app.setSleepIntention("<script>not HTML</script>");
  app.check("q-sleep-dim", false);
  assert.match(app.root.innerHTML, /&lt;script&gt;not HTML&lt;\/script&gt;/);
  assert.doesNotMatch(app.root.innerHTML, /id="q-sleep-dim" checked/);
  assert.equal(app.storage.get("focusbridge21-sleep-intentions-v26") !== null, true);
  assert.doesNotMatch(app.root.innerHTML, /<script>not HTML<\/script>/);
});
