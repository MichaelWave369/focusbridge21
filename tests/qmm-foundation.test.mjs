import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

function engine() {
  const window = {};
  runInNewContext(read("docs/fb21-qmm.js"), { window });
  return window.FocusBridgeQMM;
}
test("QMM is an original, deterministic seven-stage sequence with a grounded return", () => {
  const qmm = engine();
  assert.equal(qmm.STAGES.length, 7);
  assert.equal(qmm.STAGES[0].id, "arrive");
  assert.equal(qmm.STAGES.at(-1).id, "return");
  assert.equal(qmm.STAGES.reduce((n, x) => n + x.weight, 0).toFixed(3), "1.000");
  assert.deepEqual(Array.from(qmm.DURATIONS), [180, 300, 600, 900, 1200, 1800]);
  for (const duration of qmm.DURATIONS) {
    assert.equal(qmm.stageAt(-5, duration).id, "arrive");
    assert.equal(qmm.stageAt(duration, duration).id, "return");
    assert.equal(qmm.stageAt(duration + 100, duration).id, "return");
    let previous = -1;
    for (let t = 0; t <= duration; t += 1) {
      const stage = qmm.stageAt(t, duration);
      assert.ok(stage.index >= previous);
      assert.ok(stage.index < 7);
      previous = stage.index;
    }
  }
  assert.match(qmm.stageAt(400, 600).prompt, /thought|sound/i);
});
test("QMM is preloaded before Quiet Deck on both web entrypoints and offline cache", () => {
  for (const file of ["index.html", "docs/index.html"]) {
    const html = read(file);
    assert.match(html, /fb21-qmm\.js/);
    assert.ok(html.indexOf("fb21-qmm.js") < html.indexOf("fb21-v13-quiet-deck.js"));
  }
  assert.match(read("service-worker.js"), /docs\/fb21-qmm\.js/);
});
