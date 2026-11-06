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
    stop() {}
  }
  class FakeAudioContext {
    constructor() { this.currentTime = 0; this.state = "running"; this.destination = new FakeNode(); contexts.push(this); }
    createChannelMerger() { return new FakeNode(); }
    createOscillator() { return new FakeNode(); }
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
  return { root, click, check, note, setMix, advance, storage, classes, contexts, session,
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
  assert.match(read("service-worker.js"), /focusbridge21-v1-(?:3-quiet-deck|4-original-soundscape|5-audio-feedback)/);
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
