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

function harness({ withAudio = false } = {}) {
  let clock = Date.now();
  const elements = [];
  const timers = new Map();
  const storage = new Map();
  const session = new Map();
  const classes = new Map();
  const contexts = [];
  const scheduled = [];
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
    ...(withAudio ? { AudioContext: FakeAudioContext } : {})
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

  runInNewContext(syncScript, { window });
  runInNewContext(rifeScript, { window });
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
  const advance = (milliseconds) => {
    clock += milliseconds;
    for (const callback of [...timers.values()]) callback();
  };
  return { root, click, check, note, setMix, setHumNote, advance, storage, classes, contexts, scheduled, session,
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
  assert.match(read("service-worker.js"), /(?:focusbridge21-v1-(?:3-quiet-deck|4-original-soundscape|5-audio-feedback|6-extended-audio|7-onboarding|8-holistic-comfort|9-focus-sync)|focusbridge21-v2-0-rife-audio-lab|focusbridge21-v2-1-weather-hum)/);
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
