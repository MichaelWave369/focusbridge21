import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

function engine() {
  const window = {};
  runInNewContext(read("docs/fb21-breathing-energy.js"), { window });
  return window.FocusBridgeBreathingEnergy;
}

test("Breathing Energy uses deterministic six-stage progression with a grounded return", () => {
  const be = engine();
  assert.deepEqual(Array.from(be.DURATIONS), [180, 300, 600, 900, 1200, 1800]);
  assert.deepEqual(Object.keys(be.VISUALS), ["glow", "light", "somatic"]);
  assert.equal(be.STAGES.length, 6);
  assert.equal(be.STAGES.reduce((n, x) => n + x.weight, 0).toFixed(3), "1.000");
  assert.equal(be.visual("not-an-option"), "glow");
  for (const seconds of be.DURATIONS) {
    assert.equal(be.stageAt(-10, seconds).id, "arrive");
    assert.equal(be.stageAt(seconds, seconds).id, "return");
    let previous = -1;
    for (let t = 0; t <= seconds; t++) {
      const stage = be.stageAt(t, seconds);
      assert.ok(stage.index >= previous);
      previous = stage.index;
    }
  }
});
test("imagery is optional and no stage demands held breaths or energy effects", () => {
  const be = engine();
  for (const visual of Object.keys(be.VISUALS)) {
    const breath = be.stageAt(55, 300, visual);
    assert.equal(breath.id, "breath");
    assert.match(breath.prompt, /Do not force depth, hold your breath, or count/);
    const image = be.stageAt(115, 300, visual);
    assert.equal(image.id, "image");
    assert.ok(typeof image.voice === "string");
    const feel = be.stageAt(185, 300, visual);
    assert.equal(feel.id, "feel");
    assert.match(feel.prompt, /[Ss]ensations|[Nn]otice/);
  }
  assert.match(be.stageAt(115, 300, "glow").prompt, /sponge/);
  assert.match(be.stageAt(115, 300, "somatic").prompt, /skip all light imagery/);
  assert.match(be.stageAt(300, 300).prompt, /Open your eyes/);
});
test("Breathing Energy is loaded before Quiet Deck and in offline app shell", () => {
  for (const p of ["index.html", "docs/index.html"]) {
    const html = read(p);
    assert.match(html, /fb21-breathing-energy\.js/);
    assert.ok(html.indexOf("fb21-breathing-energy.js") < html.indexOf("fb21-v13-quiet-deck.js"));
  }
  assert.match(read("service-worker.js"), /docs\/fb21-breathing-energy\.js/);
});
