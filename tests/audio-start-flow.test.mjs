import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const reactSource = readFileSync(fileURLToPath(new URL("../docs/fb21-react.js", import.meta.url)), "utf8");
const soundSource = readFileSync(fileURLToPath(new URL("../docs/fb21-soundscape.js", import.meta.url)), "utf8");

function harness({ destabilized = false, safe = true, headphones = true, ack = true, suspend = false } = {}) {
  let index = 0;
  const hooks = [];
  let tree = null;
  let startedContexts = 0;
  let closedContexts = 0;
  let oscillators = 0;

  const pre = { mood: 7, sleep: 7, stress: 3, grounded: 7, safe, headphones, ack, destabilized, intention: "Calm experiment" };
  const prefs = { step: "cockpit", pre, durationMin: 2, presetName: "Foundation" };
  const store = new Map([["focusbridge21-preferences-v031", JSON.stringify(prefs)]]);
  const storage = {
    getItem(key) { return store.get(key) || null; },
    setItem(key, value) { store.set(key, value); }
  };

  const h = (type, props, ...children) => typeof type === "function"
    ? type({ ...(props || {}), children })
    : { type, props: props || {}, children };

  const React = {
    createElement: h,
    Fragment: "fragment",
    useState(initial) {
      const i = index++;
      if (!(i in hooks)) hooks[i] = initial;
      return [hooks[i], (next) => { hooks[i] = typeof next === "function" ? next(hooks[i]) : next; }];
    },
    useRef(initial) {
      const i = index++;
      if (!(i in hooks)) hooks[i] = { current: initial };
      return hooks[i];
    },
    useMemo(fn) { return fn(); },
    useEffect() {}
  };
  const ReactDOM = { createRoot() { return { render(node) { tree = node; } }; } };
  const param = () => ({
    value: 0,
    setValueAtTime(value) { this.value = value; },
    linearRampToValueAtTime(value) { this.value = value; },
    exponentialRampToValueAtTime(value) { this.value = value; }
  });
  const node = () => ({
    frequency: param(), gain: param(), pan: param(), Q: param(),
    connect(target) { return target; },
    disconnect() {},
    start() { oscillators++; },
    stop() {}
  });
  class FakeAudioContext {
    constructor() {
      startedContexts++;
      this.state = "running";
      this.currentTime = 1;
      this.sampleRate = 4000;
      this.destination = node();
    }
    async resume() { this.state = suspend ? "suspended" : "running"; }
    createChannelMerger() { return node(); }
    createGain() { return node(); }
    createOscillator() { return node(); }
    createStereoPanner() { return node(); }
    createBufferSource() { return node(); }
    createBiquadFilter() { return node(); }
    createBuffer(_channels, length) { return { getChannelData() { return new Float32Array(length); } }; }
    close() { closedContexts++; this.state = "closed"; }
  }
  const window = {
    AudioContext: FakeAudioContext,
    location: { pathname: "/focusbridge21/" }
  };
  new Function("window", soundSource)(window);

  function render() {
    index = 0;
    new Function("React", "ReactDOM", "window", "document", "localStorage",
      "crypto", "setInterval", "clearInterval", reactSource)(
        React, ReactDOM, window, { getElementById() { return {}; } },
        storage, { randomUUID() { return "local-test"; } }, () => 1, () => {}
      );
  }

  const textOf = (obj) => {
    if (typeof obj === "string" || typeof obj === "number") return String(obj);
    if (!obj) return "";
    if (Array.isArray(obj)) return obj.map(textOf).join(" ");
    return textOf(obj.children);
  };

  const collect = (obj, items = []) => {
    if (!obj || typeof obj !== "object") return items;
    if (Array.isArray(obj)) {
      obj.forEach((child) => collect(child, items));
      return items;
    }
    if (obj.type === "button") items.push(obj);
    collect(obj.children, items);
    return items;
  };

  render();
  return {
    async start() {
      const button = collect(tree).find((btn) => textOf(btn) === "Start");
      assert.ok(button, "Cockpit Start button is visible");
      const disabled = !!button.props.disabled;
      await button.props.onClick();
      render();
      return { disabled, output: textOf(tree), buttons: collect(tree).map(textOf) };
    },
    get startedContexts() { return startedContexts; },
    get closedContexts() { return closedContexts; },
    get oscillators() { return oscillators; }
  };
}

test("a checked destabilizing experience blocks audio clearly without bouncing to Readiness", async () => {
  const app = harness({ destabilized: true });
  const state = await app.start();
  assert.equal(state.disabled, true);
  assert.equal(app.startedContexts, 0);
  assert.match(state.output, /Audio not ready/);
  assert.match(state.output, /recent distressing or destabilizing experience/);
  assert.ok(!state.buttons.includes("Calculate + Continue"), "Cockpit remains visible instead of auto-navigating");
  assert.ok(state.buttons.includes("Review readiness checks"));
});

test("missing headphone consent is explicit and never starts an audio context", async () => {
  const app = harness({ headphones: false });
  const state = await app.start();
  assert.equal(state.disabled, true);
  assert.match(state.output, /Confirm stereo headphones/);
  assert.equal(app.startedContexts, 0);
});

test("when all safety checks are valid the real browser audio graph is scheduled", async () => {
  const app = harness();
  const state = await app.start();
  assert.equal(state.disabled, false);
  assert.equal(app.startedContexts, 1);
  assert.ok(app.oscillators >= 2, "at least the two binaural oscillators started");
  assert.match(state.output, /Audio running/);
  assert.ok(!state.buttons.includes("Calculate + Continue"), "still in Cockpit");
});

test("browser audio suspension produces an inline actionable error and cleans up", async () => {
  const app = harness({ suspend: true });
  const state = await app.start();
  assert.equal(app.startedContexts, 1);
  assert.ok(app.closedContexts >= 1);
  assert.match(state.output, /Browser audio is suspended/);
  assert.ok(!state.buttons.includes("Calculate + Continue"), "no silent navigation bounce on error");
});
