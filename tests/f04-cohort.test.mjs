import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {createStudy,validateStudy,canonicalStudy,studyWitnessLine,
 enrollmentClosesMs,createParticipantCampaign,joinWitnessLine} from "../docs/f04/protocol.mjs";
import {buildCohortRoster,fetchCohortRoster} from "../docs/f04/roster.mjs";
import {exactSharedTargetTest} from "../docs/f04/statistics.mjs";
import {auditCohort} from "../docs/f04/analysis.mjs";
import {scheduledTime,GENESIS} from "../docs/f02/protocol.mjs";
import {createCampaign} from "../docs/f03/registry.mjs";

const now=(GENESIS+3000)*1000;
const fixed=Array.from({length:4},(_,block)=>Array.from({length:20},(_,i)=>(i+block)%4));
let nonce=1;
const randomProvider={getRandomValues(bytes){bytes.fill(nonce++);return bytes;}};
const makeStudy=(size=2)=>createStudy({cohortSize:size,nowMs:now,randomProvider});
async function setup(size=2,participants=2){
 const study=await makeStudy(size);
 const deadline=enrollmentClosesMs(study);
 const masterTime=new Date(deadline-5*3600000).toISOString();
 const master={id:100,body:studyWitnessLine(study),created_at:masterTime,
   updated_at:masterTime,user:{login:"coordinator"}};
 const campaigns=[],comments=[master];
 for(let i=0;i<participants;i++){
   const joined=await createParticipantCampaign(study,fixed,{nowMs:now+10000,randomProvider});
   campaigns.push(joined.campaign);
   const time=new Date(deadline-(4*3600-i*600)*1000).toISOString();
   comments.push({id:101+i,body:joined.public_comment,created_at:time,updated_at:time,
     user:{login:"participant-"+i}});
 }
 return {study,campaigns,comments,deadline};
}
const registry="https://github.com/field/lab/issues/9";
function fakeFetcher(data,{failComment=null}={}){
 const signature="ab".repeat(48);
 const randomness=createHash("sha256").update(Buffer.from(signature,"hex")).digest("hex");
 return async url=>{
   if(url.includes("/issues/9/comments?"))return {ok:true,json:async()=>data.comments};
   const m=/\/issues\/comments\/([0-9]+)$/.exec(url);
   if(m){
     if(Number(m[1])===failComment)return {ok:false};
     const comment=data.comments.find(c=>c.id===Number(m[1]));
     return comment?{ok:true,json:async()=>comment}:{ok:false};
   }
   if(url.includes("/public/")){
     return {ok:true,json:async()=>({round:Number(url.split("/").pop()),signature,randomness})};
   }
   throw Error("unexpected test URL "+url);
 };
}
const validatedBlock=(index,round,choice=0,target=0)=>({
 index,round,status:"verified",bls_verified:true,
 predictions:Array(20).fill(choice),targets:Array(20).fill(target),hits:choice===target?20:0
});
test("F04 fixes cohort size, shared future rounds, deadline, analysis and tamper-resistant plan",async()=>{
 const study=await makeStudy(8);
 assert.equal(study.cohort_size,8);
 assert.equal(study.analysis,"exact-shared-target-randomization-v1");
 assert.ok(scheduledTime(study.first_round)>now+86400000);
 assert.equal(enrollmentClosesMs(study),scheduledTime(study.first_round)-3600000);
 assert.equal((await validateStudy(study)).study_hash,study.study_hash);
 assert.equal(canonicalStudy(study).split("\n").length,10);
 assert.match(studyWitnessLine(study),/^FB21-F04-STUDY\/v1 /);
 const changed=structuredClone(study);changed.cohort_size=9;
 await assert.rejects(()=>validateStudy(changed),/modified|differ/);
 await assert.rejects(()=>createStudy({cohortSize:1,nowMs:now,randomProvider}));
});
test("F04 participant uses the EXACT study rounds, keeps 80 choices private, and gets two witness lines",async()=>{
 const study=await makeStudy();
 const joined=await createParticipantCampaign(study,fixed,{nowMs:now+60000,randomProvider});
 assert.equal(joined.campaign.registration.blocks[0].round,study.first_round);
 assert.equal(joined.campaign.sealed_blocks.length,4);
 assert.equal(joined.public_comment.trim().split("\n").length,2);
 assert.match(joined.public_comment,/FB21-F03\/v1/);
 assert.match(joined.public_comment,/FB21-F04-JOIN\/v1/);
 assert.doesNotMatch(joined.public_comment,/"predictions"/);
 assert.match(joinWitnessLine(study,joined.campaign.registration),/campaign=/);
 await assert.rejects(()=>createParticipantCampaign(study,fixed,{
   nowMs:enrollmentClosesMs(study),randomProvider}),/closed/);
 await assert.rejects(()=>createCampaign(fixed,{nowMs:now,randomProvider,firstRound:1}),/too early/);
});
test("F04 public roster selects first N distinct accounts, reports overflow and duplicate enrollments",async()=>{
 const data=await setup(2,3);
 const rows=await buildCohortRoster(data.study,registry,data.comments);
 assert.equal(rows.expected_participants,2);
 assert.equal(rows.enrolled_count,2);
 assert.equal(rows.missing_enrollment,0);
 assert.equal(rows.entries[0].status,"enrolled");
 assert.equal(rows.entries[2].status,"overflow");
 const duplicate={...data.comments[2],id:199,created_at:new Date(data.deadline-60000).toISOString()};
 const withDuplicate=await buildCohortRoster(data.study,registry,[...data.comments,duplicate]);
 assert.equal(withDuplicate.entries.find(x=>x.comment_url?.endsWith("199")).status,"rejected");
 const live=await fetchCohortRoster(data.study,registry,fakeFetcher(data));
 assert.equal(live.enrolled_count,2);
});
test("F04 refuses absent, duplicated, late, post-edited or post-enrollment master registration",async()=>{
 const data=await setup();
 await assert.rejects(()=>buildCohortRoster(data.study,registry,data.comments.slice(1)),/master/);
 await assert.rejects(()=>buildCohortRoster(data.study,registry,[data.comments[0],...data.comments]),/master/);
 const edited=structuredClone(data.comments);
 edited[0].updated_at=new Date(data.deadline+1000).toISOString();
 await assert.rejects(()=>buildCohortRoster(data.study,registry,edited),/deadline/);
 const late=structuredClone(data.comments);
 late[1].updated_at=new Date(data.deadline+1000).toISOString();
 const roster=await buildCohortRoster(data.study,registry,late);
 assert.equal(roster.enrolled_count,1);
 assert.equal(roster.entries[0].status,"rejected");
});
test("Exact shared-target test handles fully correlated participant predictions",()=>{
 const rounds=[30000,30040,30080,30120];
 const one={campaign_id:"p1",blocks:rounds.map((r,i)=>validatedBlock(i,r))};
 const two={campaign_id:"p2",blocks:rounds.map((r,i)=>validatedBlock(i,r))};
 const result=exactSharedTargetTest([one,two]);
 assert.equal(result.participants,2);
 assert.equal(result.distinct_beacon_target_cells,80);
 assert.equal(result.total_predictions,160);
 assert.equal(result.observed_hits,160);
 const expected=Math.pow(.25,80);
 assert.ok(Math.abs(result.one_sided_null_tail/expected-1)<1e-10);
 assert.ok(result.one_sided_null_tail>Math.pow(.25,160));
 const inconsistent=structuredClone(two);inconsistent.blocks[1].targets[0]=1;
 assert.throws(()=>exactSharedTargetTest([one,inconsistent]),/inconsistent/);
});
test("F04 complete cohort independently reaudits both F03 private files and yields shared-round null model",async()=>{
 const data=await setup();
 const result=await auditCohort(data.study,registry,data.campaigns,{
   fetcher:fakeFetcher(data),verifySignature:()=>true
 });
 assert.equal(result.status,"complete");
 assert.equal(result.roster.enrolled_count,2);
 assert.equal(result.participants.length,2);
 assert.ok(result.participants.every(x=>x.status==="verified"));
 assert.equal(result.exact_null_test.distinct_beacon_target_cells,80);
 assert.equal(result.exact_null_test.total_predictions,160);
 assert.ok(result.exact_null_test.one_sided_null_tail>=0);
});
test("Missing private file or invalid witness yields an explicit incomplete cohort and NO p-value",async()=>{
 const data=await setup();
 const missing=await auditCohort(data.study,registry,data.campaigns.slice(0,1),{
   fetcher:fakeFetcher(data),verifySignature:()=>true
 });
 assert.equal(missing.status,"incomplete");
 assert.equal(missing.exact_null_test,null);
 assert.equal(missing.participants.filter(x=>x.status==="unresolved").length,1);
 const failed=await auditCohort(data.study,registry,data.campaigns,{
   fetcher:fakeFetcher(data,{failComment:102}),verifySignature:()=>true
 });
 assert.equal(failed.status,"incomplete");
 assert.equal(failed.exact_null_test,null);
});
test("F04 new UI, workflows, CLI and cache coexist with earlier Gateway research",()=>{
 const read=x=>readFileSync(fileURLToPath(new URL("../"+x,import.meta.url)),"utf8");
 assert.match(read("docs/f04/index.html"),/studio\.mjs/);
 assert.match(read("docs/f03/index.html"),/f04\/index.html/);
 assert.match(read("service-worker.js"),/docs\/f04\/roster\.mjs/);
 assert.match(read(".github/workflows/quiet-deck-ci.yml"),/docs\/f04\/\*\.mjs/);
 assert.match(read("scripts/f04-audit.mjs"),/verifyQuicknetSignature/);
 assert.match(read("docs/fb21-v13-quiet-deck.js"),/gateway_future_target_lab/);
 assert.match(read("docs/f02/protocol.mjs"),/FB21-F02-v1/);
});
