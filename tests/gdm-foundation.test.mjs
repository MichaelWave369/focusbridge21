import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
function engine() {
  const window = {};
  runInNewContext(read("docs/fb21-gdm.js"), { window });
  return window.FocusBridgeGDM;
}
test("GDM stages, timing, and default options are deterministic", () => {
  const g = engine();
  assert.deepEqual(Array.from(g.DURATIONS), [180, 300, 600, 900, 1200, 1800]);
  assert.deepEqual(Object.keys(g.VISUALS), ["ladder", "escalator", "still"]);
  assert.equal(g.visual("malformed"), "ladder");
  assert.equal(g.STAGES.length, 5);
  assert.equal(g.STAGES.reduce((sum, item) => sum + item.weight, 0).toFixed(3), "1.000");
  assert.equal(g.stageAt(-1, 300).id, "arrive");
  assert.equal(g.stageAt(300, 300).id, "return");
  for (const duration of g.DURATIONS) {
    let last = -1;
    for (let elapsed = 0; elapsed <= duration; elapsed++) {
      const stage = g.stageAt(elapsed, duration, "ladder");
      assert.ok(stage.index >= last, "ordered stage progress");
      last = stage.index;
    }
  }
});
test("visualization is optional, only imagined, and stage prompts have grounded return", () => {
  const g = engine();
  for (const option of Object.keys(g.VISUALS)) {
    const descent = g.stageAt(70, 300, option);
    assert.equal(descent.id, "descent");
    assert.ok(descendSafe(descent.prompt), "imagery is explicitly stationary or optional");
    const landing = g.stageAt(150, 300, option);
    assert.equal(landing.id, "transition");
    assert.ok(descendSafe(landing.prompt));
    assert.match(g.stageAt(299, 300, option).prompt, /hands and feet/);
    assert.ok(typeof g.stageAt(0, 300, option).voice === "string");
  }
  assert.match(g.stageAt(80, 300, "escalator").prompt, /escalator/);
  assert.match(g.stageAt(80, 300, "still").prompt, /No moving scene/);
});
function descendSafe(text) {
  return /imagin|physically still|real body|nothing needs|No moving scene|Do not move/i.test(text);
}
test("GDM engine loads before Quiet Deck on both routes and preloads for offline use", () => {
  for (const p of ["index.html", "docs/index.html"]) {
    const html = read(p);
    assert.match(html, /fb21-gdm\.js/);
    assert.ok(html.indexOf("fb21-gdm.js") < html.indexOf("fb21-v13-quiet-deck.js"));
  }
  assert.match(read("service-worker.js"), /docs\/fb21-gdm\.js/);
});
