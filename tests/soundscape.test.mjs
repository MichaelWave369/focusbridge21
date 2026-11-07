import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (name) => readFileSync(new URL(name, "file://" + root + (root.endsWith("/") ? "" : "/")), "utf8");
const source = read("docs/fb21-soundscape.js");

class FakeParam {
  constructor() { this.value = 0; this.events = []; }
  setValueAtTime(value, when) { this.value = value; this.events.push({ type: "set", value, when }); }
  linearRampToValueAtTime(value, when) { this.value = value; this.events.push({ type: "linear", value, when }); }
  exponentialRampToValueAtTime(value, when) { this.value = value; this.events.push({ type: "exponential", value, when }); }
}
class FakeNode {
  constructor(kind = "gain") {
    this.kind = kind; this.frequency = new FakeParam(); this.gain = new FakeParam();
    this.pan = new FakeParam(); this.Q = new FakeParam(); this.starts = []; this.stops = [];
    this.type = kind;
  }
  connect(other) { this.connected = other; return other; }
  disconnect() { this.disconnected = true; }
  start(at) { this.starts.push(at); }
  stop(at) { this.stops.push(at); }
}
function context() {
  const nodes = [], buffers = [];
  const node = (name) => { const n = new FakeNode(name); nodes.push(n); return n; };
  return {
    currentTime: 12, sampleRate: 8000, destination: node("destination"),
    nodes, buffers,
    createGain: () => node("gain"),
    createOscillator: () => node("oscillator"),
    createBufferSource: () => node("buffer-source"),
    createBiquadFilter: () => node("filter"),
    createStereoPanner: () => node("panner"),
    createBuffer: (channels, size) => {
      const obj = { data: new Float32Array(size), getChannelData() { return this.data; } };
      buffers.push(obj); return obj;
    }
  };
}
const win = {};
runInNewContext(source, { window: win, Math });
const schedule = win.FocusBridgeSoundscape.schedule;

test("disabled layers have zero side effects", () => {
  const ctx = context(), refs = { nodes: [] };
  assert.equal(schedule(ctx, { surf: 0, bass: 0, beat: 0 }, 60, refs), false);
  assert.equal(refs.nodes.length, 0);
});

test("ocean surf is original in-memory noise with two overlapping shoreline waves and foam", () => {
  const ctx = context(), refs = { nodes: [] };
  assert.equal(schedule(ctx, { surf: 70 }, 90, refs), true);
  assert.equal(ctx.buffers.length, 1);
  assert.equal(ctx.buffers[0].data.length, ctx.sampleRate * 3);
  assert.equal(ctx.nodes.filter(n => n.kind === "buffer-source").length, 3);
  for (const node of ctx.nodes.filter(n => n.kind === "buffer-source")) {
    assert.equal(node.starts.length, 1);
    assert.equal(node.stops.length, 1);
    assert.ok(node.stops[0] <= 12 + 91);
  }
  assert.equal(ctx.nodes.filter(n => n.kind === "oscillator").length, 0);
});

test("bass is quiet 62 Hz plus soft harmonic; pulse is 40 BPM and finite", () => {
  const ctx = context(), refs = { nodes: [] };
  schedule(ctx, { surf: 0, bass: 30, beat: 20 }, 120, refs);
  const oscillators = ctx.nodes.filter(n => n.kind === "oscillator");
  assert.deepEqual(oscillators.map(n => n.frequency.value), [62, 124, 72]);
  for (const osc of oscillators) {
    assert.equal(osc.starts.length, 1);
    assert.equal(osc.stops.length, 1);
    assert.ok(osc.stops[0] < 133);
  }
  const pulseGain = ctx.nodes.filter(n => n.kind === "gain").at(-1);
  const peaks = pulseGain.gain.events.filter(e => e.type === "linear" && e.value > 0.0001);
  assert.ok(peaks.length >= 70 && peaks.length <= 82, "roughly 40 BPM at 2 minutes");
  assert.ok(Math.max(...peaks.map(e => e.value)) < 0.02);
});

test("page entrypoints and cache include new engine before React", () => {
  for (const name of ["index.html","docs/index.html"]) {
    const html = read(name);
    const engineAt = html.indexOf("fb21-soundscape.js");
    const reactAt = html.indexOf("fb21-react.js");
    assert.ok(engineAt > 0 && engineAt < reactAt);
  }
  assert.match(read("service-worker.js"), /focusbridge21-v1-(?:4-original-soundscape|5-audio-feedback|6-extended-audio|7-onboarding)/);
  assert.match(read("service-worker.js"), /fb21-soundscape.js/);
  assert.doesNotMatch(read("docs/fb21-react.js"), /Parallax \/ PHI369 live prototype/);
});

test("spatial surf continues to six hours and ends at the bounded Web Audio time", () => {
  const ctx = context(), refs = { nodes: [] };
  assert.equal(schedule(ctx, { surf: 60, space: 35 }, 21600, refs), true);
  const sources = ctx.nodes.filter(n => n.kind === "buffer-source");
  assert.equal(sources.length, 3);
  for (const source of sources) {
    assert.ok(source.stops[0] >= 12 + 21600, "no inherited one-hour cutoff");
    assert.ok(source.stops[0] < 12 + 21601, "bounded audio scheduling");
  }
  const panners = ctx.nodes.filter(n => n.kind === "panner");
  assert.equal(panners.length, 3);
  assert.ok(panners.every(p => p.pan.events.some(e => e.type === "linear")));
  const master = ctx.nodes.find(n => n.kind === "gain");
  assert.equal(master.gain.events.at(-1).when, 12 + 21600, "silent end fade");
});

test("duration remains capped at six hours even for invalid oversized requests", () => {
  const ctx = context(), refs = { nodes: [] };
  schedule(ctx, { bass: 5 }, 86400, refs);
  assert.ok(ctx.nodes.filter(n => n.kind === "oscillator").every(n =>
    n.stops[0] <= 12 + 21600.2));
});
