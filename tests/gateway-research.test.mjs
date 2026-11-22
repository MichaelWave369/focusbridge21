import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const read=x=>readFileSync(new URL("../"+x,import.meta.url),"utf8");
function engine(){const window={};runInNewContext(read("docs/fb21-gateway-research.js"),{window,Uint32Array});return window.FocusBridgeGatewayResearch;}
test("Gateway topics distinguish historical claims, evidence and boundaries",()=>{
 const g=engine();
 assert.equal(g.TOPICS.length,8);
 assert.ok(g.TOPICS.every(x=>x.claim&&x.evidence&&x.limit&&g.SOURCES[x.source]));
 assert.match(g.render(null,true),/Army assessment/);
 assert.match(g.render(null,true),/data-action="gw-begin"/);
 assert.match(g.render(null,true),/noopener noreferrer/);
});
test("Prediction is locked before cryptographic target selection and feedback is delayed",()=>{
 const g=engine();let n=3,calls=0;
 const crypto={getRandomValues(x){calls++;x[0]=n++;return x;}};
 const original=g.newBlock();
 assert.equal(g.recordPrediction(original,"invalid",crypto),original);
 assert.equal(calls,0);
 const next=g.recordPrediction(original,"2",crypto);
 assert.equal(calls,1);
 assert.equal(next.rounds[0].guess,2);
 assert.equal(next.rounds[0].target,3);
 assert.equal(original.rounds.length,0);
 assert.match(g.render(next,true),/PREDICTION 2/);
 assert.doesNotMatch(g.render(next,true),/Later target:/);
 assert.match(read("docs/fb21-gateway-research.js"),/const locked=[\s\S]*?const target=drawTarget\(cryptoSource\)/);
});
test("Exactly 20 trials; no partial scoring; exact binomial tail and 25 percent baseline",()=>{
 const g=engine(),crypto={getRandomValues(x){x[0]=0;return x;}};
 let b=g.newBlock();
 for(let i=0;i<19;i++){b=g.recordPrediction(b,String(i%2),crypto);assert.equal(b.status,"active");assert.equal(b.outcome,null);}
 b=g.recordPrediction(b,"1",crypto);
 assert.equal(b.status,"complete");
 assert.equal(b.outcome.hits,10);
 assert.equal(b.outcome.expected,5);
 assert.equal(b.outcome.chance,.25);
 assert.match(g.render(b,true),/10 \/ 20 matches/);
 assert.match(g.render(b,true),/Later target: Circle/);
 assert.equal(g.scoreBlock([]),null);
 const all=Array.from({length:20},()=>({guess:0,target:0}));
 assert.ok(Math.abs(g.scoreBlock(all).oneSidedTail-Math.pow(.25,20))<1e-18);
 const zero=Array.from({length:20},()=>({guess:1,target:0}));
 assert.ok(Math.abs(g.scoreBlock(zero).oneSidedTail-1)<1e-10);
});
test("Broken RNG fails closed and does not save an incomplete block",()=>{
 const g=engine(),fail={getRandomValues(){throw Error("unavailable");}};
 assert.equal(g.drawTarget(null),null);
 assert.equal(g.drawTarget(fail),null);
 const b=g.recordPrediction(g.newBlock(),0,fail);
 assert.equal(b.status,"error");
 assert.equal(b.rounds.length,0);
 assert.match(g.render(b,false),/Secure browser randomness is unavailable/);
});
test("Two HTML entrypoints, cache, and Quiet Deck integration leave existing labs intact",()=>{
 for(const p of ["index.html","docs/index.html"]){const s=read(p);assert.match(s,/fb21-gateway-research\.css/);assert.ok(s.indexOf("fb21-gateway-research.js")<s.indexOf("fb21-v13-quiet-deck.js"));}
 const cache=read("service-worker.js");
 assert.match(cache,/docs\/fb21-gateway-research\.css/);
 assert.match(cache,/docs\/fb21-gateway-research\.js/);
 const quiet=read("docs/fb21-v13-quiet-deck.js");
 assert.match(quiet,/data-action="gateway"/);
 assert.match(quiet,/state\.screen === "gateway"/);
 assert.match(quiet,/gateway_future_target_lab/);
 assert.match(quiet,/tele_target_lab/);
 assert.match(quiet,/data-action="human12"/);
});
