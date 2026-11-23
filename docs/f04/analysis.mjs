/* End-to-end F04 cohort audit: never accept an unauthenticated score file.
 * Every enrolled participant is independently verified through the F03 auditor.
 */
import {validateStudy} from "./protocol.mjs";
import {fetchCohortRoster} from "./roster.mjs";
import {exactSharedTargetTest} from "./statistics.mjs";
import {auditCampaign} from "../f03/registry.mjs";
export async function auditCohort(study,registryIssue,privateCampaigns,{fetcher=fetch,verifySignature}={}){
 await validateStudy(study);
 if(typeof verifySignature!=="function")throw Error("Pinned BLS signature verifier required");
 if(!Array.isArray(privateCampaigns))throw Error("Private campaign list is required");
 const roster=await fetchCohortRoster(study,registryIssue,fetcher);
 const files=new Map(),unmatched=[];
 for(const entry of privateCampaigns){
   const id=entry?.registration?.campaign_id;
   if(typeof id!=="string"){unmatched.push({campaign_id:null,reason:"Private file missing campaign ID"});continue;}
   if(files.has(id)){unmatched.push({campaign_id:id,reason:"Duplicate private campaign file"});files.set(id,null);continue;}
   files.set(id,entry);
 }
 const selected=new Set(roster.enrolled.map(e=>e.campaign_id));
 for(const id of files.keys())if(!selected.has(id))unmatched.push({campaign_id:id,reason:"Not in the preregistered selected cohort"});
 const participants=[],verified=[];
 for(const enrollment of roster.enrolled){
   const campaign=files.get(enrollment.campaign_id);
   if(!campaign){
     participants.push({campaign_id:enrollment.campaign_id,status:"unresolved",
       reason:files.has(enrollment.campaign_id)?"Duplicate file submission":"No private file submitted"});
     continue;
   }
   try{
     const report=await auditCampaign(campaign,enrollment.comment_url,{fetcher,verifySignature});
     if(report.registration_hash!==enrollment.registration_hash||
        report.registration.blocks?.[0]?.round!==study.first_round||
        report.witness?.url===undefined||!report.summary.complete)
       throw Error("Individual audit incomplete or campaign does not match enrollment");
     verified.push(report);
     participants.push({campaign_id:enrollment.campaign_id,status:"verified",
       hits:report.summary.verified_hits,trials:report.summary.verified_trials,
       registered_rounds:report.registration.blocks.map(x=>x.round)});
   }catch(error){
     participants.push({campaign_id:enrollment.campaign_id,status:"unresolved",
       reason:String(error.message||error).slice(0,280)});
   }
 }
 const complete=roster.enrolled_count===study.cohort_size&&verified.length===study.cohort_size&&
   unmatched.length===0;
 let exact=null,error=null;
 if(complete){
   try{exact=exactSharedTargetTest(verified);}
   catch(err){error=String(err.message||err);}
 }
 return {schema:"focusbridge21/f04/audit/v1",study_id:study.study_id,
   study_hash:study.study_hash,registry_issue:registryIssue,roster,
   participants,unmatched_submissions:unmatched,
   status:complete&&exact?"complete":"incomplete",
   exact_null_test:complete?exact:null,
   analysis_error:error,
   audit_boundary:"Each completed campaign verified from its private commitment, GitHub witness, and pinned-key BLS-authenticated drand rounds. Incomplete cohorts have no pooled inference.",
   research_boundary:"No randomized recruitment, no independently controlled enrollment owner, and no automatic conclusion about precognition. Shared target correlations are explicitly modeled."};
}
