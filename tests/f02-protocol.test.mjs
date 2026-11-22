import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash,webcrypto} from "node:crypto";
import {fileURLToPath} from "node:url";
import {createSealedPlan,validatePlan,canonicalPayload,scheduledTime,nextFutureRound,
 witnessText,parseWitnessUrl,deriveTargets,scorePredictions,verifyWitness,verifyBeacon,auditOnline,
 CHAIN_HASH,GENESIS,TRIALS} from "../docs/f02/protocol.mjs";
const crypto=webcrypto;
const guesses=Array.from({length:TRIALS},(_,i)=>i%4);
const nowMs=(GENESIS+3*100)*1000;
const randomProvider={getRandomValues(out){out.fill(23);return out;}};
const plan=async()=>createSealedPlan(guesses,{nowMs,randomProvider});
const signature="ab".repeat(48);
const randomness=createHash("sha256").update(Buffer.from(signature,"hex")).digest("hex");
function mocked(p,{late=false,edited=false,wrongBeacon=false,failRelay=false}={}){
 const when=scheduledTime(p.beacon_round)-(late?5000:60000);
 const created=new Date(when).toISOString(),updated=new Date(edited?scheduledTime(p.beacon_round)+1000:when).toISOString();
 const witness={body:witnessText(p),created_at:created,updated_at:updated};
 const beacon={round:p.beacon_round,signature,randomness:wrongBeacon?"00".repeat(32):randomness};
 let calls=0;
 return async url=>{
   calls++;
   if(failRelay&&url.startsWith("https://drand.cloudflare.com/"))return {ok:false};
   if(url.startsWith("https://api.github.com/repos/"))return {ok:true,json:async()=>witness};
   if(url.startsWith("https://api.drand.sh/")||url.startsWith("https://drand.cloudflare.com/"))
     return {ok:true,json:async()=>beacon};
   throw Error("Unexpected URL "+url);
 };
}
test("F02 commits exactly twenty predictions to a future drand quicknet round",async()=>{
 const p=await plan();
 assert.equal(p.predictions.length,20);
 assert.match(p.nonce,/^[0-9a-f]{64}$/);
 assert.equal(p.chain_hash,CHAIN_HASH);
 assert.ok(scheduledTime(p.beacon_round)>nowMs+360000);
 assert.ok(nextFutureRound(nowMs)>1);
 assert.equal((await validatePlan(p)).hash,p.commitment);
 assert.ok(canonicalPayload(p).startsWith("FB21-F02-v1\n"));
 assert.match(witnessText(p),/^FB21-F02\/v1 round=/);
});
test("A changed guess, round, nonce, hash, or wrong schema fails validation",async()=>{
 const p=await plan();
 for(const mutation of [
   x=>x.predictions[0]=3,x=>x.beacon_round++,x=>x.nonce="ee".repeat(32),
   x=>x.commitment="ff".repeat(32),x=>x.schema="fake"
 ]){
   const v=structuredClone(p);mutation(v);
   await assert.rejects(()=>validatePlan(v));
 }
 await assert.rejects(()=>createSealedPlan(Array(19).fill(0),{nowMs,randomProvider}));
});
test("Strict GitHub comment URLs reject spoofed hosts, embedded creds and missing IDs",()=>{
 assert.equal(parseWitnessUrl("https://github.com/owner/repo/issues/20#issuecomment-433"),
 "https://api.github.com/repos/owner/repo/issues/comments/433");
 for(const v of ["https://github.com.evil.test/owner/repo/issues/20#issuecomment-1",
 "https://evil.test/x","http://github.com/owner/repo/issues/20#issuecomment-1",
 "https://github.com/owner/repo/issues/20","https://github.com/owner/repo/pull/20#issuecomment-1"]){
 assert.throws(()=>parseWitnessUrl(v));}
});
test("Witness must be present, unedited and timestamped ahead of the target round",async()=>{
 const p=await plan(),url="https://github.com/a/b/issues/1#issuecomment-2";
 const good=await verifyWitness(p,url,mocked(p));
 assert.match(good.url,/api.github.com/);
 await assert.rejects(()=>verifyWitness(p,url,mocked(p,{late:true})),/too late/);
 await assert.rejects(()=>verifyWitness(p,url,mocked(p,{edited:true})),/too late/);
});
test("Beacon check detects tampering, relay disagreement and transport failure",async()=>{
 const p=await plan();
 const good=await verifyBeacon(p,mocked(p));
 assert.equal(good.randomness,randomness);
 assert.equal(good.bls_verified,false);
 await assert.rejects(()=>verifyBeacon(p,mocked(p,{wrongBeacon:true})),/signature hash/);
 await assert.rejects(()=>verifyBeacon(p,mocked(p,{failRelay:true})),/Could not fetch/);
 const disagree=async url=>({ok:true,json:async()=>url.includes("cloudflare")
  ?{round:p.beacon_round,signature:"cd".repeat(48),randomness:createHash("sha256").update(Buffer.from("cd".repeat(48),"hex")).digest("hex")}
  :{round:p.beacon_round,signature,randomness}});
 await assert.rejects(()=>verifyBeacon(p,disagree),/disagree/);
});
test("Target derivation is reproducible, exactly twenty uniform four-choice values",async()=>{
 const p=await plan();
 const a=await deriveTargets(p,randomness),b=await deriveTargets(p,randomness);
 assert.deepEqual(a,b);
 assert.equal(a.length,20);
 assert.ok(a.every(x=>x>=0&&x<4&&Number.isInteger(x)));
 const stats=scorePredictions(p.predictions,a);
 assert.equal(stats.expected,5);
 assert.ok(stats.hits>=0&&stats.hits<=20);
});
test("Online audit combines witness, beacon, deterministic outcomes and explicit BLS caveat",async()=>{
 const p=await plan();
 const result=await auditOnline(p,"https://github.com/a/b/issues/1#issuecomment-2",mocked(p));
 assert.equal(result.round,p.beacon_round);
 assert.equal(result.trials,20);
 assert.equal(result.targets.length,20);
 assert.match(result.assurance,/NOT been independently verified/);
 assert.match(result.science_limit,/No selective reporting controls/);
});
test("F02 browser page and main atlas link exist without replacing original labs",()=>{
 const read=x=>readFileSync(fileURLToPath(new URL("../"+x,import.meta.url)),"utf8");
 const page=read("docs/f02/index.html"),module=read("docs/fb21-gateway-research.js"),cache=read("service-worker.js");
 assert.match(page,/studio.mjs/);
 assert.match(module,/f02\/index.html/);
 assert.match(cache,/docs\/f02\/index.html/);
 assert.match(cache,/docs\/f02\/protocol.mjs/);
 assert.match(read("docs/fb21-v13-quiet-deck.js"),/gateway_future_target_lab/);
});
