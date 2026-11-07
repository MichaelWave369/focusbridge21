import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";

const source = readFileSync(fileURLToPath(new URL("../docs/fb21-focus-sync.js", import.meta.url)), "utf8");
const win = {};
runInNewContext(source, { window: win });
const sync = win.FocusBridgeSync;

test("Focus Sync contains all 17 published index entries in ascending journey order", () => {
  assert.deepEqual(Array.from(sync.GATES, gate => gate.level), [
    "1", "3", "10", "11", "12", "15", "18", "21", "22",
    "23", "24", "25", "26", "27", "34/35", "42", "49"
  ]);
  assert.equal(new Set(sync.GATES.map(gate => gate.level)).size, 17);
  assert.ok(sync.GATES.every(gate => gate.title && gate.prompt));
});

test("all supported paces fit within six hours and preserve a 12-minute reorientation", () => {
  assert.deepEqual(Array.from(sync.PACES), [8, 12, 18, 20]);
  for (const minutes of sync.PACES) {
    const plan = sync.timeline(minutes);
    assert.equal(plan.stages.length, 18);
    assert.equal(plan.totalSeconds, (17 * minutes + 12) * 60);
    assert.ok(plan.totalSeconds <= sync.HARD_LIMIT_SECONDS);
    for (let i = 1; i < plan.stages.length; i++)
      assert.equal(plan.stages[i].start, plan.stages[i - 1].end, "no gaps or overlaps");
    assert.equal(plan.stages.at(-1).kind, "return");
    assert.equal(plan.stages.at(-1).end - plan.stages.at(-1).start, 720);
    assert.equal(sync.stageAt(plan, plan.totalSeconds - 1).kind, "return");
  }
});

test("the stage clock is descriptive, not a test for achieving a consciousness state", () => {
  const plan = sync.timeline(12);
  assert.equal(sync.stageAt(plan, 0).level, "1");
  assert.equal(sync.stageAt(plan, 720 - 1).level, "1");
  assert.equal(sync.stageAt(plan, 720).level, "3");
  assert.equal(sync.stageAt(plan, 17 * 720).level, "Return");
  assert.equal(sync.stageAt(plan, plan.totalSeconds).level, "Return");
  assert.equal(sync.timeline(999).minutesPerGate, 12, "invalid paces do not disable cap");
});

test("tone path uses gentle scheduled 30-second crossovers with a bounded endpoint", () => {
  const plan = sync.timeline(12);
  const events = [];
  const param = {
    setValueAtTime(value, at) { events.push({ kind: "set", value, at }); },
    linearRampToValueAtTime(value, at) { events.push({ kind: "ramp", value, at }); }
  };
  sync.scheduleToneJourney(param, 185, 5, plan);
  assert.equal(events[0].value, 195);
  assert.equal(events.filter(e => e.kind === "ramp").length, 17);
  assert.ok(events.every(event => event.value > 185 && event.value < 200));
  assert.ok(events.at(-1).at < plan.totalSeconds + 5);
});
