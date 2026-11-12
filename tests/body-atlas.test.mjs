import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
function atlas(){
  const window={};
  runInNewContext(read("docs/fb21-body-atlas.js"),{window});
  return window.FocusBridgeBodyAtlas;
}
test("Chapter 4 faithfully inventories named concepts without inventing 8–50 anatomy",()=>{
  const a=atlas();
  assert.equal(a.RECORDS.length,16);
  assert.equal(a.RECORDS.filter(r=>r.group==="major").length,7);
  assert.equal(a.RECORDS.filter(r=>r.group==="dan").length,6);
  assert.equal(a.RECORDS.filter(r=>r.group==="hara").length,3);
  assert.deepEqual(Array.from(a.RANGES,r=>[r.dimension,r.start,r.end]),[
    [3,1,7],[4,8,15],[5,16,22],[6,23,29],[7,30,36],[8,37,43],[9,44,50]
  ]);
  assert.equal(a.RECORDS.filter(r=>r.page<6||r.page>13).length,0);
  assert.ok(a.RECORDS.every(r=>r.described&&r.anatomy&&r.health));
  assert.match(a.get("pineal").anatomy,/melatonin/);
  assert.match(a.get("thymus").anatomy,/T-cell/);
  assert.match(a.get("third-eye").health,/schizophrenia.*medically inaccurate/);
  assert.equal(a.get("chakra-50"),null);
});
test("Atlas text search and categories work, escape dynamic query and mark unsupported causation",()=>{
  const a=atlas();
  assert.equal(a.find().length,16);
  assert.equal(a.find("root").length,1);
  assert.equal(a.find("six inches","dan").length,2);
  assert.equal(a.find("Tan Tien","hara").length,1);
  assert.equal(a.find("nonexistent chakra").length,0);
  let html=a.renderAtlas({selected:"root",search:"<script>alert('x')</script>",category:"all"});
  assert.doesNotMatch(html,/<script>/);
  assert.match(html,/&lt;script&gt;/);
  html=a.renderAtlas({selected:"root",search:"",category:"all"});
  assert.match(html,/Evidence boundary/);
  assert.match(html,/Book.*interpretation/);
  assert.match(html,/Established anatomical context/);
  assert.match(html,/Chakras 1–50/);
  assert.match(html,/will not invent them/);
  assert.match(html,/data-action="atlas-filter"/);
  assert.match(html,/data-action="atlas-open"/);
  assert.match(html,/NIH/);
});
test("Chapter 4 atlas loads in both entrypoints and offline service worker",()=>{
  for(const file of ["index.html","docs/index.html"]){
    const html=read(file);
    assert.match(html,/fb21-body-atlas\.js/);
    assert.ok(html.indexOf("fb21-body-atlas.js")<html.indexOf("fb21-v13-quiet-deck.js"));
  }
  assert.match(read("service-worker.js"),/docs\/fb21-body-atlas\.js/);
  assert.match(read("service-worker.js"),/focusbridge21-v3-3-chapter4-atlas/);
});
