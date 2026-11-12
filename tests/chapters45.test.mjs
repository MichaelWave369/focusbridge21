import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
function load() {
 const window = {};
 runInNewContext(read("docs/fb21-chapters45.js"), { window });
 return window;
}
test("Chapter 4 imagery follows the seven book centers from crown to root, with grounded return", () => {
 const w = load(), engine = w.FocusBridgeChakraLight;
 assert.deepEqual(Array.from(engine.DURATIONS), [180, 300, 600, 900, 1200, 1800]);
 assert.deepEqual(Array.from(engine.STAGES, x => x.id),
  ["arrive", "crown", "third-eye", "throat", "heart", "solar", "sacral", "root", "rest", "return"]);
 assert.match(engine.STAGES[1].prompt, /white or golden/);
 assert.match(engine.STAGES[8].prompt, /does not demonstrate a chakra opened/);
 for (const duration of engine.DURATIONS) {
  assert.equal(engine.stageAt(-2,duration).id,"arrive");
  assert.equal(engine.stageAt(duration,duration).id,"return");
  let last=-1;
  for(let t=0;t<=duration;t++){
    const stage=engine.stageAt(t,duration);
    assert.ok(stage.index>=last);
    last=stage.index;
  }
 }
});
test("Chapter 5 clarifies source sequence and subjective listening limits", () => {
 const w=load(), engine=w.FocusBridgeClairaudience;
 assert.deepEqual(Array.from(engine.STAGES,x=>x.id),
  ["arrive","ears","listen","outward","inward","reflect","return"]);
 assert.match(engine.STAGES[0].prompt,/Quiet Mind and Going Deeper/);
 assert.match(engine.STAGES[4].prompt,/not collecting messages/);
 assert.match(engine.STAGES[5].prompt,/actual sounds and any imagined echoes/);
 assert.match(engine.STAGES[6].prompt,/your room/);
 assert.equal(engine.stageAt(300,300).id,"return");
 assert.equal(engine.stageAt(-1,300).id,"arrive");
});
test("New Chapter 4 and 5 engines load before Quiet Deck in both HTML files and PWA shell", () => {
 for(const path of ["index.html","docs/index.html"]){
   const html=read(path);
   assert.match(html,/fb21-chapters45\.js/);
   assert.ok(html.indexOf("fb21-chapters45.js") < html.indexOf("fb21-v13-quiet-deck.js"));
 }
 assert.match(read("service-worker.js"),/docs\/fb21-chapters45\.js/);
 assert.match(read("service-worker.js"),/focusbridge21-v3-4-chapters45/);
});