import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
function engine(){const window={};runInNewContext(read("docs/fb21-tele-visualization.js"),{window,Uint32Array});return window.FocusBridgeTeleVisualization;}
test("Chapter 3's forest/river/misty-pool journey has seven ordered stages and grounded return",()=>{
  const tv=engine();
  assert.deepEqual(Array.from(tv.DURATIONS),[180,300,600,900,1200,1800]);
  assert.equal(tv.STAGES.length,7);
  assert.equal(tv.STAGES.reduce((sum,x)=>sum+x.weight,0).toFixed(3),"1.000");
  assert.deepEqual(Array.from(tv.STAGES,x=>x.id),["arrive","forest","river","pool","listen","echo","return"]);
  for(const seconds of tv.DURATIONS){
    let prev=-1;
    for(let t=0;t<=seconds;t++){
      const stage=tv.stageAt(t,seconds);
      assert.ok(stage.index>=prev);
      prev=stage.index;
    }
    assert.equal(tv.stageAt(seconds,seconds).id,"return");
  }
  assert.match(tv.STAGES[5].prompt,/four times/);
  assert.match(tv.STAGES[6].prompt,/real room/);
  assert.doesNotMatch(tv.STAGES.map(s=>s.prompt).join(" "),/verified remote perception|physically leave your body/);
});
test("browser lab requires unpredictable crypto target selection and only grades complete blind blocks",()=>{
  const tv=engine();
  let word=2;
  const random={getRandomValues(buffer){buffer[0]=word++;return buffer;}};
  assert.equal(tv.chooseTarget(undefined),null);
  assert.equal(tv.chooseTarget(random),2);
  assert.equal(tv.chooseTarget(random),3);
  assert.equal(tv.chooseTarget(random),0);
  assert.equal(tv.TARGETS.length,4);
  assert.equal(tv.TRIAL_COUNT,20);
  assert.equal(tv.scoreBlock([]),null);
  const rows=Array.from({length:20},(_,i)=>({target:i%4,guess:(i+1)%4}));
  assert.equal(tv.scoreBlock(rows).hits,0);
  rows[0].guess=rows[0].target;
  rows[1].guess=rows[1].target;
  const result=tv.scoreBlock(rows);
  assert.equal(result.hits,2);
  assert.equal(result.expectedChanceHits,5);
  assert.equal(result.chanceProbability,.25);
  rows[4].target=99;
  assert.equal(tv.scoreBlock(rows),null);
});
test("Chapter 3 engine preloads before Quiet Deck in both HTML entrypoints and offline shell",()=>{
  for(const file of ["index.html","docs/index.html"]){
    const html=read(file);
    assert.match(html,/fb21-tele-visualization\.js/);
    assert.ok(html.indexOf("fb21-tele-visualization.js")<html.indexOf("fb21-v13-quiet-deck.js"));
  }
  assert.match(read("service-worker.js"),/docs\/fb21-tele-visualization\.js/);
});
