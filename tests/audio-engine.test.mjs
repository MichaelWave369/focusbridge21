import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const script = readFileSync(new URL("../docs/fb21-audio-engine.js", import.meta.url), "utf8");

function harness({ dynamics = true, analyser = true, modernParam = true, suspended = false } = {}) {
  const nodes = [], commands = [], timers = [];
  class Param {
    constructor() { this.value = 0; this.events = []; }
    setValueAtTime(v, t) { this.value = v; this.events.push(["set",v,t]); }
    linearRampToValueAtTime(v, t) { this.value = v; this.events.push(["linear",v,t]); }
    setTargetAtTime(v, t, k) { this.value = v; this.events.push(["target",v,t,k]); }
    cancelScheduledValues(t) { this.events.push(["cancel",t]); }
    cancelAndHoldAtTime(t) { this.events.push(["hold",t]); }
  }
  class Node {
    constructor(kind) {
      this.kind = kind; this.gain = new Param();
      this.threshold = new Param(); this.knee = new Param();
      this.ratio = new Param(); this.attack = new Param();
      this.release = new Param();
    }
    connect(to) { this.output = to; return to; }
    disconnect() { commands.push(["disconnect", this.kind]); }
  }
  const fake = (kind) => { const n = new Node(kind); nodes.push(n); return n; };
  const ctx = {
    state: suspended ? "suspended" : "running",
    currentTime: 12,
    destination: fake("output"),
    createGain: () => fake("gain"),
    ...(dynamics ? { createDynamicsCompressor: () => fake("compressor") } : {}),
    ...(analyser ? { createAnalyser: () => {
      const a = fake("analyser");
      a.fftSize = 512;
      a.frequencyBinCount = 256;
      a.getByteTimeDomainData = (data) => {
        data.fill(128); data[0] = 192; data[1] = 64;
      };
      return a;
    }} : {})
  };
  if (!modernParam) {
    const create = ctx.createGain;
    ctx.createGain = () => {
      const g = create();
      g.gain.cancelScheduledValues = undefined;
      g.gain.cancelAndHoldAtTime = undefined;
      return g;
    };
  }
  const window = {};
  runInNewContext(script, { window, Uint8Array });
  const audio = window.FocusBridgeAudioEngine;
  return { audio, ctx, nodes, timers, commands };
}

test("unified bus handles master, gentle dynamics and digital meter without changing physical output", () => {
  const h = harness();
  const refs = { nodes: [] };
  const bus = h.audio.create(h.ctx, refs, { level: 80 });
  assert.equal(bus.level, 0.8);
  assert.equal(bus.master.output, bus.dynamics);
  assert.equal(bus.dynamics.output, bus.analyser);
  assert.equal(bus.analyser.output, h.ctx.destination);
  assert.equal(refs.nodes.length, 3);
  assert.ok(bus.master.gain.events.some(e => e[0] === "linear" && e[1] === 0.8));
  assert.equal(h.audio.peak(bus), 0.5);
  h.audio.setLevel(bus, 40);
  assert.equal(bus.level, 0.4);
  assert.ok(bus.master.gain.events.some(e => e[0] === "target" && e[1] === 0.4));
});

test("graceful stop keeps audio connected through a 140ms ramp and closes once", () => {
  const h = harness();
  const bus = h.audio.create(h.ctx, { nodes: [] });
  let completions = 0;
  const schedule = (cb, ms) => { h.timers.push({ cb, ms }); };
  assert.equal(h.audio.beginStop(bus, () => completions++, schedule), true);
  assert.equal(bus.stopping, true);
  assert.equal(completions, 0);
  assert.equal(h.timers.length, 1);
  assert.equal(h.timers[0].ms, 170);
  assert.ok(bus.master.gain.events.some(e => e[0] === "linear" && e[1] === 0 && e[2] === 12.14));
  assert.equal(h.audio.beginStop(bus, () => completions++, schedule), false);
  h.timers[0].cb();
  assert.equal(completions, 1);
  h.audio.setLevel(bus, 100);
  assert.equal(bus.level, 0.8, "stopping bus cannot be reactivated");
});

test("suspended or older browser audio contexts close without waiting for a suspended fade", () => {
  for (const cfg of [{ suspended: true }, { modernParam: false }]) {
    const h = harness(cfg), bus = h.audio.create(h.ctx);
    let count = 0;
    assert.equal(h.audio.beginStop(bus, () => count++, () => {}), false);
    assert.equal(count, 1);
  }
});

test("fallback mixer works without compressor, analyser, or non-essential Web Audio features", () => {
  const h = harness({ dynamics: false, analyser: false });
  const bus = h.audio.create(h.ctx);
  assert.equal(bus.master.output, h.ctx.destination);
  assert.equal(h.audio.peak(bus), null);
  h.audio.setLevel(bus, 0);
  assert.equal(bus.level, 0);
  assert.equal(h.audio.create(h.ctx, { nodes: [] }, { level: 999 }).level, 1);
});

test("both Pages entrypoints preload engine and offline shell precaches the module", () => {
  for (const page of ["../index.html", "../docs/index.html"]) {
    const html = readFileSync(new URL(page, import.meta.url), "utf8");
    assert.ok(html.indexOf("fb21-audio-engine.js") > 0);
    assert.ok(html.indexOf("fb21-audio-engine.js") < html.indexOf("fb21-v13-quiet-deck.js"));
  }
  const worker = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");
  assert.match(worker, /focusbridge21-v2-(?:5-master-audio-engine|6-sleep-intentions|7-intention-studio|8-seamless-surf|9-qmm-foundation)|focusbridge21-v3-0-going-deeper/);
  assert.match(worker, /fb21-audio-engine\.js/);
});
