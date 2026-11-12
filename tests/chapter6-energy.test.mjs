import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
function engine(){const window={};runInNewContext(read("docs/fb21-chapter6-energy.js"),{window});return window.FocusBridgeEnergyImagery;}
test("Chapter 6 has four original source-derived themes and monotonic timed stages",()=>{
 const e=engine();
 assert.deepEqual(Array.from(e.DURATIONS),[180,300,600,900,1200,1800]);
 assert.deepEqual(Object.keys(e.THEMES),["body","earth","water","forest"]);
 assert.equal(e.theme("invalid"),"body");
 for(const type of Object.keys(e.THEMES)){
  assert.equal(e.THEMES[type].stages.reduce((sum,x)=>sum+x.weight,0).toFixed(3),"1.000");
  for(const seconds of e.DURATIONS){
   let last=-1;
   for(let elapsed=0;elapsed<=seconds;elapsed++){
    const phase=e.stageAt(elapsed,seconds,type);
    assert.ok(phase.index>=last);
    last=phase.index;
   }
   assert.equal(e.stageAt(seconds,seconds,type).id,"return",type+" returns to surroundings");
  }
 }
});
test("Chapter 6 keeps actual water, movement, people-reading, and claimed effects out of guidance",()=>{
 const e=engine();
 const all=Object.values(e.THEMES).flatMap(x=>x.stages.map(p=>p.prompt)).join(" ");
 assert.match(all,/no.*wet hands/i);
 assert.match(all,/barefoot/i);
 assert.match(all,/cannot establish what another person thinks/i);
 assert.match(all,/not physical plasma/i);
 assert.match(all,/No actual energy, water, or object is moved/i);
 assert.match(e.stageAt(100,300,"body").prompt,/mental image|ordinary awareness|imagine/i);
 assert.match(e.stageAt(145,300,"water").prompt,/right hand|left hand/i);
});
test("Chapter 6 script loads before Quiet Deck in both entrypoints and in the offline PWA",()=>{
 for(const p of ["index.html","docs/index.html"]){
  const html=read(p);
  assert.match(html,/fb21-chapter6-energy\.js/);
  assert.ok(html.indexOf("fb21-chapter6-energy.js")<html.indexOf("fb21-v13-quiet-deck.js"));
 }
 assert.match(read("service-worker.js"),/docs\/fb21-chapter6-energy\.js/);
 assert.match(read("service-worker.js"),/focusbridge21-v3-6-chapter7-cleansing/);
});