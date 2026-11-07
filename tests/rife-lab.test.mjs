import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const source = readFileSync(fileURLToPath(new URL("../docs/fb21-rife-lab.js", import.meta.url)), "utf8");
const window = {};
runInNewContext(source, { window });
const lab = window.FocusBridgeRife;

function fakeContext() {
  const nodes = [];
  const events = [];
  const param = name => ({
    value: 0,
    setValueAtTime(value, at) { this.value = value; events.push({ name, action: "set", value, at }); },
    linearRampToValueAtTime(value, at) { this.value = value; events.push({ name, action: "ramp", value, at }); }
  });
  const context = {
    currentTime: 1,
    destination: {},
    createOscillator() {
      const osc = { type: "sine", frequency: param("frequency"),
        connect(other) { return other; }, start(at) { this.startTime = at; },
        stop(at) { this.stopTime = at; }, disconnect() {} };
      nodes.push(osc);
      return osc;
    },
    createGain() {
      const gain = { gain: param("gain"), connect(other) { return other; }, disconnect() {} };
      nodes.push(gain);
      return gain;
    }
  };
  return { context, nodes, events };
}

test("audio demo offers neutral Hz with no disease or treatment mappings", () => {
  assert.deepEqual(Array.from(lab.FREQUENCIES), [110, 220, 440, 727, 787, 880]);
  assert.deepEqual(Array.from(lab.WAVEFORMS), ["sine", "triangle"]);
  assert.deepEqual(Array.from(lab.MOTIONS), ["steady", "gentle-sweep"]);
  assert.deepEqual(Array.from(lab.DURATIONS), [60, 180, 300, 600, 900]);
  assert.equal(lab.MAX_SECONDS, 900);
  assert.ok(lab.MAX_GAIN <= 0.02);
  assert.match(source, /NOT an RF\/EMF Rife machine/);
});

test("configuration clamps invalid values to conservative sound-exploration defaults", () => {
  assert.equal(lab.config({ frequency: 40000 }).frequency, 220);
  assert.equal(lab.config({ intensity: 999 }).intensity, 35);
  assert.equal(lab.config({ intensity: -1 }).intensity, 5);
  assert.equal(lab.config({ waveform: "square", motion: "frenetic" }).waveform, "sine");
  assert.equal(lab.config({ motion: "frenetic" }).motion, "steady");
});

test("steady oscillator has a finite hard stop, quiet ramp up and fade out", () => {
  const f = fakeContext(), refs = { nodes: [] };
  const receipt = lab.schedule(f.context, { frequency: 727, waveform: "triangle", intensity: 35 }, 900, refs);
  assert.equal(receipt.frequency, 727);
  assert.equal(receipt.waveform, "triangle");
  assert.equal(receipt.seconds, 900);
  assert.equal(f.nodes.length, 2);
  assert.equal(refs.nodes.length, 2);
  assert.equal(f.nodes[0].stopTime, 901.05);
  const gains = f.events.filter(e => e.name === "gain");
  assert.equal(gains[0].value, 0);
  assert.equal(gains.at(-1).value, 0);
  assert.ok(gains.every(e => e.value <= lab.MAX_GAIN));
  assert.ok(f.events.filter(e => e.name === "frequency").every(e => e.value === 727));
});

test("gentle sweep uses only 2 percent pitch changes without abrupt modulation", () => {
  const f = fakeContext();
  lab.schedule(f.context, { frequency: 440, motion: "gentle-sweep" }, 180, { nodes: [] });
  const pitches = f.events.filter(e => e.name === "frequency");
  assert.ok(pitches.some(e => e.action === "ramp"));
  assert.ok(pitches.every(e => e.value >= 440 * 0.98 && e.value <= 440 * 1.02));
  assert.equal(pitches.at(-1).value, 440);
  assert.ok(pitches.at(-1).at <= 179);
});

test("oversized or invalid session requests are shortened to documented presets", () => {
  const f = fakeContext();
  const receipt = lab.schedule(f.context, { frequency: 220 }, 21600, { nodes: [] });
  assert.equal(receipt.seconds, 300);
  assert.equal(f.nodes[0].stopTime, 301.05);
});
