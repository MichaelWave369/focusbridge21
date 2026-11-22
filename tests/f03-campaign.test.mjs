import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {createCampaign,validateSealedCampaign,publicWitnessLine,
  verifyCampaignWitness,auditCampaign,aggregateCampaignBlocks,canonicalRegistration,
  F03,BLOCKS,ROUND_SPACING} from "../docs/f03/registry.mjs";
import {parseRegistryIssue,summarizeRegistryComments,registryCoverage} from "../docs/f03/registry-index.mjs";
import {verifyQuicknetSignature,QUICKNET_PUBKEY,QUICKNET_DST} from "../scripts/f03-bls.mjs";
import {scheduledTime,GENESIS} from "../docs/f02/protocol.mjs";
const choices=Array.from({length:BLOCKS},(_,b)=>Array.from({length:20},(_,i)=>(i+b)%4));
let seed=17;
const source={getRandomValues(x){x.fill(seed++);return x;}};
const baseTime=(GENESIS+3*2000)*1000;
const plan=()=>createCampaign(choices,{nowMs:baseTime,randomProvider:source});
const issue="https://github.com/mw/lab/issues/7#issuecomment-42";
function mockApi(sealed,{late=false,edited=false,badRelay=false}={}){
 const reg=sealed.registration;
 const expected=scheduledTime(reg.blocks[0].round);
 const when=new Date(expected-(late?10000:120000)).toISOString();
 const changed=new Date(expected+5000).toISOString();
 const signature="ac".repeat(48);
 const randomness=createHash("sha256").update(Buffer.from(signature,"hex")).digest("hex");
 return async url=>{
  if(url.includes("/issues/comments/42"))return {ok:true,json:async()=>({
     body:publicWitnessLine(reg),created_at:when,updated_at:edited?changed:when})};
  if(url.includes("/public/")){
    if(badRelay&&url.includes("cloudflare"))return {ok:false};
    const round=Number(url.split("/").pop());
    return {ok:true,json:async()=>({round,signature,randomness})};
  }
  throw Error("unexpected "+url);
 };
}
test("Known genuine Quicknet BLS12-381 short signature verifies, altered round fails",()=>{
 const known="99cbe974900e5bcf83273f87af5e90e158d3b8a8088c4c724d6ab94df8aeb44e7780f79db404b5f18ac767b3eeb76d60";
 assert.equal(QUICKNET_PUBKEY.length,192);
 assert.match(QUICKNET_DST,/G1/);
 assert.equal(verifyQuicknetSignature(known,33483413),true);
 assert.equal(verifyQuicknetSignature(known,33483412),false);
 assert.equal(verifyQuicknetSignature("00".repeat(48),33483413),false);
 assert.throws(()=>verifyQuicknetSignature("zz".repeat(48),33483413));
});
test("All four blocks are committed to distinct future rounds and one registration hash",async()=>{
 const s=await plan(),r=s.registration;
 assert.equal(r.schema,F03);
 assert.equal(r.blocks.length,4);
 assert.equal(r.blocks[1].round-r.blocks[0].round,ROUND_SPACING);
 assert.ok(scheduledTime(r.blocks[0].round)>baseTime+1200000);
 assert.equal((await validateSealedCampaign(s)).registration_hash,r.registration_hash);
 assert.match(publicWitnessLine(r),/^FB21-F03\/v1 campaign=/);
 assert.equal(canonicalRegistration(r).split("\n").length,9);
 assert.ok(s.sealed_blocks.every(x=>x.predictions.length===20));
});
test("Modified prediction, round, nonce, hash, or missing block fails before networking",async()=>{
 const s=await plan();
 for(const mutate of [
  x=>x.sealed_blocks[1].predictions[0]=(x.sealed_blocks[1].predictions[0]+1)%4,
  x=>x.registration.blocks[2].round++,
  x=>x.registration.registration_hash="ab".repeat(32),
  x=>x.sealed_blocks.pop(),
  x=>x.registration.campaign_id="aa".repeat(16)
 ]){const v=structuredClone(s);mutate(v);await assert.rejects(()=>validateSealedCampaign(v));}
 await assert.rejects(()=>createCampaign(choices.slice(0,3),{nowMs:baseTime,randomProvider:source}));
});
test("F03 public witness must predate first round and reject edits or late comments",async()=>{
 const s=await plan();
 assert.equal((await verifyCampaignWitness(s.registration,issue,mockApi(s))).registry_hash,s.registration.registration_hash);
 await assert.rejects(()=>verifyCampaignWitness(s.registration,issue,mockApi(s,{late:true})),/deadline/);
 await assert.rejects(()=>verifyCampaignWitness(s.registration,issue,mockApi(s,{edited:true})),/deadline/);
 await assert.rejects(()=>verifyCampaignWitness(s.registration,"https://github.com.evil.test/x/y/issues/7#issuecomment-42",mockApi(s)));
});
test("Full audit accounts for all four verified blocks and computes pooled chance model",async()=>{
 const s=await plan();
 const report=await auditCampaign(s,issue,{fetcher:mockApi(s),verifySignature:async()=>true});
 assert.equal(report.blocks.length,4);
 assert.ok(report.blocks.every(x=>x.status==="verified"&&x.bls_verified));
 assert.equal(report.summary.registered_trials,80);
 assert.equal(report.summary.verified_trials,80);
 assert.equal(report.summary.complete,true);
 assert.equal(typeof report.summary.pooled_one_sided_chance_tail,"number");
});
test("One authentication failure stays unresolved and suppresses pooled inference",async()=>{
 const s=await plan();let checked=0;
 const report=await auditCampaign(s,issue,{fetcher:mockApi(s),
   verifySignature:async()=>{checked++;return checked!==2;}});
 assert.equal(report.summary.verified_blocks,3);
 assert.equal(report.summary.missing_or_failed_blocks,1);
 assert.equal(report.summary.pooled_one_sided_chance_tail,null);
 assert.equal(report.blocks[1].status,"unresolved");
 assert.match(report.blocks[1].reason,/BLS/);
 const all=aggregateCampaignBlocks(Array.from({length:4},(_,i)=>({status:i<3?"verified":"unresolved",hits:i<3?5:null})));
 assert.equal(all.complete,false);
 assert.equal(all.pooled_one_sided_chance_tail,null);
});
test("Only exact public GitHub issue URL can scope registration coverage",()=>{
 assert.equal(parseRegistryIssue("https://github.com/MichaelWave369/focusbridge21/issues/1").issue,"1");
 for(const url of ["https://github.com.evil.org/a/b/issues/1","https://github.com/a/b/pulls/1",
  "http://github.com/a/b/issues/1","https://github.com/a/b/issues/1#fragment"])
   assert.throws(()=>parseRegistryIssue(url));
});
test("Registry coverage reports missing, duplicate, late and unmatched audit submissions",async()=>{
 const s=await plan(),r=s.registration,when=new Date(scheduledTime(r.blocks[0].round)-120000).toISOString();
 const first={body:publicWitnessLine(r),created_at:when,updated_at:when,html_url:issue};
 const duplicate={...first,html_url:"https://github.com/mw/lab/issues/7#issuecomment-43"};
 const index=summarizeRegistryComments([first],[]);
 assert.equal(index.registered_unique,1);
 assert.equal(index.registered_but_unreported,1);
 assert.equal(index.apparently_complete_reports,0);
 assert.match(index.caution,/untrusted/);
 const reported=summarizeRegistryComments([first],[{
  campaign_id:r.campaign_id,registration_hash:r.registration_hash,
  summary:{complete:true},blocks:Array.from({length:4},(_,i)=>({index:i,status:"verified"}))
 }]);
 assert.equal(reported.registered_but_unreported,0);
 assert.equal(reported.apparently_complete_reports,1);
 assert.equal(summarizeRegistryComments([first,duplicate],[]).invalid_or_duplicate,2);
 const remote=await registryCoverage("https://github.com/mw/lab/issues/7",[],{
  fetcher:async()=>({ok:true,json:async()=>[first]})
 });
 assert.equal(remote.registered_unique,1);
});
test("F03 studio and command-line paths are wired without removing original labs",()=>{
 const read=x=>readFileSync(fileURLToPath(new URL("../"+x,import.meta.url)),"utf8");
 assert.match(read("docs/f03/index.html"),/studio\.mjs/);
 assert.match(read("docs/f02/index.html"),/f03\/index.html/);
 assert.match(read("service-worker.js"),/docs\/f03\/registry\.mjs/);
 assert.match(read("scripts/f03-audit.mjs"),/verifyQuicknetSignature/);
 assert.match(read("scripts/f03-registry.mjs"),/registryCoverage/);
 assert.match(read("docs/fb21-v13-quiet-deck.js"),/gateway_future_target_lab/);
 assert.match(read("docs/f02/protocol.mjs"),/FB21-F02-v1/);
});
