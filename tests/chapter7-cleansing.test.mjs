import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
function engine(){ const window={};runInNewContext(read("docs/fb21-chapter7-cleansing.js"),{window});return window.FocusBridgeCleansing;}
test("Chapter 7 preserves Root-to-Crown order, source colors, and front/back details",()=>{
 const c=engine();
 assert.deepEqual(Array.from(c.DURATIONS),[180,300,600,900,1200,1800]);
 assert.deepEqual(Array.from(c.CENTERS,x=>x.id),["root","sacral","solar","heart","throat","third-eye","crown"]);
 assert.deepEqual(Array.from(c.CENTERS,x=>x.color),["Red","Orange","Yellow","Green","Light blue to deeper blue","Light purple","Golden-white"]);
 assert.deepEqual(Array.from(c.CENTERS,x=>x.page),[19,19,20,20,21,21,21]);
 assert.deepEqual(Array.from(c.CENTERS,x=>x.points),[
  "One imagined point","Two imagined points: front and back","Two imagined points: front and back",
  "Two imagined points: front and back","Two imagined points: front and back",
  "Two imagined points: front and back","One imagined point"
 ]);
 assert.deepEqual(Array.from(c.STAGES,x=>x.id),["arrive","root","sacral","solar","heart","throat","third-eye","crown","settle","return"]);
 assert.equal(c.STAGES.reduce((n,x)=>n+x.weight,0).toFixed(4),"1.0000");
});
test("All Chapter 7 durations progress monotonically and end with a grounded return",()=>{
 const c=engine();
 for(const seconds of c.DURATIONS){
  for(const style of Object.keys(c.STYLES)){
   let last=-1;
   for(let t=0;t<=seconds;t++){
    const s=c.stageAt(t,seconds,style);
    assert.ok(s.index>=last,"stages do not go backward");
    last=s.index;
   }
   assert.equal(c.stageAt(seconds,seconds,style).id,"return");
   assert.match(c.stageAt(seconds,seconds,style).prompt,/real room/);
  }
 }
 assert.equal(c.style("invalid"),"release");
 assert.match(c.stageAt(45,300,"release").prompt,/worry becoming lighter/);
 assert.match(c.stageAt(45,300,"observe").prompt,/no need to identify or release/);
 assert.match(c.stageAt(255,300).prompt,/does not prove an energy center opened/);
});
test("Chapter 7 engine preloads before Quiet Deck in both entrypoints and PWA offline cache",()=>{
 for(const path of ["index.html","docs/index.html"]){
  const html=read(path);
  assert.match(html,/fb21-chapter7-cleansing\.js/);
  assert.ok(html.indexOf("fb21-chapter7-cleansing.js")<html.indexOf("fb21-v13-quiet-deck.js"));
 }
 assert.match(read("service-worker.js"),/docs\/fb21-chapter7-cleansing\.js/);
 assert.match(read("service-worker.js"),/focusbridge21-v3-6-chapter7-cleansing/);
});