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
  assert.equal(ctx.buffers[0].data.length, ctx.sampleRate * 11);
  const wave = ctx.buffers[0].data;
  assert.ok(wave.slice(0, 256).some(v => Math.abs(v) > 0.01),
    "surf does not fade to digital silence at the start");
  assert.ok(wave.slice(-256).some(v => Math.abs(v) > 0.01),
    "surf does not fade to digital silence at the end");
  assert.ok(wave.some(v => Math.abs(v) > 0.001), "interior keeps audible textured noise");
  assert.equal(ctx.nodes.filter(n => n.kind === "buffer-source").length, 3);
  for (const node of ctx.nodes.filter(n => n.kind === "buffer-source")) {
    assert.equal(node.starts.length, 1);
    assert.equal(node.stops.length, 1);
    assert.ok(node.stops[0] <= 12 + 91);
  }
  assert.equal(ctx.nodes.filter(n => n.kind === "oscillator").length, 0);
});

test("seamless ocean buffer wraps between consecutive original noise samples", () => {
  // Deterministic noise source catches a sample restart, zero-fade trough,
  // phase mismatch or loss of continuity at the exact 11-second seam.
  const initialSeed = 0x13579bdf;
  function seeded() {
    let seed = initialSeed;
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
  }
  const seededMath = Object.create(Math);
  seededMath.random = seeded();
  const isolatedWindow = {};
  runInNewContext(source, { window: isolatedWindow, Math: seededMath });
  const ctx = context();
  assert.equal(isolatedWindow.FocusBridgeSoundscape.schedule(ctx, { surf: 65 }, 90), true);
  const channel = ctx.buffers[0].data;
  const size = channel.length;
  const overlap = Math.min(Math.floor(size / 4),
    Math.max(16, Math.round(ctx.sampleRate * 0.75)));
  const rnd = seeded();
  const original = new Float32Array(size + overlap);
  let pink = 0;
  for (let i = 0; i < original.length; i++) {
    pink = 0.93 * pink + 0.07 * (rnd() * 2 - 1);
    original[i] = 0.65 * pink + 0.35 * (rnd() * 2 - 1);
  }
  assert.ok(Math.abs(channel[0] - original[overlap]) < 1e-7,
    "first loop sample follows the head's final sample in source noise");
  assert.ok(Math.abs(channel.at(-1) - original[overlap - 1]) < 1e-7,
    "final loop sample is exactly the preceding natural noise sample");
  assert.ok(Math.abs((channel[0] - channel.at(-1)) -
    (original[overlap] - original[overlap - 1])) < 1e-7,
    "seam jump is no greater than its corresponding natural sample transition");
  assert.ok(Math.abs(channel[size - overlap] - original[size]) < 1e-7,
    "crossfade starts at the unmodified original tail sample");
  const midpoint = Math.floor(overlap / 2);
  const progress = midpoint / (overlap - 1);
  const eased = progress * progress * (3 - 2 * progress);
  const angle = eased * Math.PI / 2;
  const expected = original[size + midpoint] * Math.cos(angle) +
    original[midpoint] * Math.sin(angle);
  assert.ok(Math.abs(channel[size - overlap + midpoint] - expected) < 1e-6,
    "crossfade uses smooth equal-power weights, not a fade to silence");
  const rms = portion => Math.sqrt(portion.reduce((sum, v) => sum + v * v, 0) /
    portion.length);
  const margin = 400;
  const edgeLevel = rms([...channel.slice(0, margin), ...channel.slice(-margin)]);
  const middleLevel = rms(channel.slice(Math.floor(size / 3), Math.floor(size / 3) + margin * 2));
  assert.ok(edgeLevel > middleLevel * 0.55,
    "loop ends keep a comparable noise bed rather than a perceptible silent notch");
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
  assert.match(read("service-worker.js"), /(?:focusbridge21-v1-(?:4-original-soundscape|5-audio-feedback|6-extended-audio|7-onboarding|8-holistic-comfort|9-focus-sync)|focusbridge21-v2-0-rife-audio-lab|focusbridge21-v2-1-weather-hum|focusbridge21-v2-2-island-108|focusbridge21-v2-3-mix-preview|focusbridge21-v2-4-guided-audio|focusbridge21-v2-5-master-audio-engine|focusbridge21-v2-6-sleep-intentions|focusbridge21-v2-7-intention-studio|focusbridge21-v2-9-qmm-foundation|focusbridge21-v3-0-going-deeper|focusbridge21-v3-1-breathing-energy|focusbridge21-v3-2-tele-visualization|focusbridge21-v3-3-chapter4-atlas)/);
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

test("rain alone produces original drizzle-to-downpour layers with gentle fades", () => {
  const small = context(), large = context();
  const srefs = { nodes: [] }, lrefs = { nodes: [] };
  assert.equal(schedule(small, { rain: 10 }, 300, srefs), true);
  assert.equal(schedule(large, { rain: 100 }, 300, lrefs), true);
  assert.equal(small.buffers.length, 1);
  assert.equal(large.buffers.length, 1);
  assert.equal(small.nodes.filter(n => n.kind === "buffer-source").length, 2);
  assert.equal(small.nodes.filter(n => n.kind === "oscillator").length, 0);
  const peak = ctx => ctx.nodes.filter(n => n.kind === "gain").slice(1)
    .flatMap(n => n.gain.events).filter(e => e.type === "linear").reduce((acc, e) => Math.max(acc, e.value), 0);
  assert.ok(peak(large) > peak(small) * 3, "heavy rain should be distinctly fuller than drizzle");
  const fade = large.nodes.filter(n => n.kind === "gain").slice(1);
  assert.ok(fade.every(n => n.gain.events.at(-1).value <= 0.0001));
  assert.ok(fade.every(n => n.gain.events.at(-1).when === 312));
});

test("wind alone sweeps softly from breeze to hard gusts with low frequencies", () => {
  const soft = context(), hard = context();
  schedule(soft, { wind: 10 }, 300);
  schedule(hard, { wind: 100 }, 300);
  const hardBuffers = hard.nodes.filter(n => n.kind === "buffer-source");
  assert.equal(hardBuffers.length, 2);
  assert.equal(hard.nodes.filter(n => n.kind === "oscillator").length, 0);
  const body = ctx => ctx.nodes.filter(n => n.kind === "gain").at(1).gain.events;
  const peaks = ev => Math.max(...ev.filter(x => x.type === "linear").map(x => x.value));
  assert.ok(peaks(body(hard)) > peaks(body(soft)));
  assert.ok(body(hard).filter(x => x.type === "linear").length >= 8, "wind gusts are smooth automated envelopes");
  assert.ok(hardBuffers.every(n => n.stops[0] <= 313));
});

test("HUM offers each chromatic musical note between C3 and C5 and is absent when off", () => {
  const notes = Array.from(win.FocusBridgeSoundscape.HUM_NOTES, n => ({ name: n.name, hz: n.hz }));
  assert.equal(notes.length, 25);
  assert.deepEqual(notes.filter(n => n.name === "C3" || n.name === "C4" || n.name === "C5"), [
    { name: "C3", hz: 130.81 }, { name: "C4", hz: 261.63 }, { name: "C5", hz: 523.25 }
  ]);
  assert.ok(notes.every((n, index) => index === 0 || n.hz > notes[index - 1].hz));
  const silent = context();
  assert.equal(schedule(silent, { hum: 0 }, 600), false);
  assert.equal(silent.nodes.filter(n => n.kind === "oscillator").length, 0);
  for (const name of ["C3","C4","C5"]) {
    const ctx = context();
    assert.equal(schedule(ctx, { hum: 40, humNote: name }, 600), true);
    const tones = ctx.nodes.filter(n => n.kind === "oscillator");
    assert.equal(tones.length, 2);
    const hz = notes.find(n => n.name === name).hz;
    assert.equal(tones[0].frequency.value, hz);
    assert.equal(tones[1].frequency.value, hz * 2);
    assert.ok(tones.every(n => n.stops[0] <= 613));
  }
});

test("all six layers combine using one noise buffer and stop after a six-hour session", () => {
  const ctx = context(), refs = { nodes: [] };
  const yes = schedule(ctx, {
    surf: 40, bass: 8, beat: 5, rain: 60, wind: 50, hum: 30, humNote: "G3", space: 5
  }, 21600, refs);
  assert.equal(yes, true);
  assert.equal(ctx.buffers.length, 1, "surf, rain and wind share a single synthesized buffer");
  assert.equal(ctx.nodes.filter(n => n.kind === "buffer-source").length, 7);
  assert.equal(ctx.nodes.filter(n => n.kind === "oscillator").length, 5);
  assert.ok(ctx.nodes.filter(n => n.kind === "buffer-source" || n.kind === "oscillator")
    .every(n => n.stops.length === 1 && n.stops[0] >= 21612 && n.stops[0] < 21613));
  const master = ctx.nodes.find(n => n.kind === "gain");
  assert.equal(master.gain.events.at(-1).when, 21612);
  assert.equal(master.gain.events.at(-1).value, 0.0001);
  assert.ok(refs.nodes.length > 15, "all nodes registered for explicit cleanup");
});
