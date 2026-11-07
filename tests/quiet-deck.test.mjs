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
      this.frequency = { value: 0 };
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
    FocusBridgeSoundscape: { schedule(ctx, options, seconds) {
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

  runInNewContext(script, { document, window, localStorage, sessionStorage,
    setInterval, clearInterval, Date: FakeDate });
  const root = elements.find((item) => item.id === "fb21-quiet-root");
  assert.ok(root, "quiet root exists");
  const click = (action, seconds) => root.listeners.click({
    target: { closest: () => ({ disabled: false, dataset: { action, seconds } }) }
  });
  const check = (id, value = true) => root.listeners.change({ target: { id, checked: value } });
  const note = (value) => root.listeners.input({ target: { id: "q-note", value } });
  const setMix = (key, value) => root.listeners.input({ target: { id: "q-mix-" + key, value, setAttribute() {} } });
  const advance = (milliseconds) => {
    clock += milliseconds;
    for (const callback of [...timers.values()]) callback();
  };
  return { root, click, check, note, setMix, advance, storage, classes, contexts, scheduled, session,
    get reloads() { return reloads; } };
}

test("both Pages entrypoints reference Quiet Deck while retaining the original app", () => {
  for (const p of ["index.html", "docs/index.html"]) {
    const html = read(p);
    assert.match(html, /fb21-v13-quiet-deck\.css/);
    assert.match(html, /fb21-v13-quiet-deck\.js/);
    assert.match(html, /fb21-react\.js/);
    assert.match(html, /fb21-v12-experience\.js/);
  }
  assert.match(read("service-worker.js"), /focusbridge21-v1-(?:3-quiet-deck|4-original-soundscape|5-audio-feedback|6-extended-audio|7-onboarding|8-holistic-comfort|9-focus-sync)/);
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
