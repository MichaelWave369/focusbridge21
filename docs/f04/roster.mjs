/* F04 read-only, timestamped GitHub issue enrolment roster.
 * The first N qualifying distinct GitHub accounts are locked into the cohort.
 */
import {validateStudy,studyWitnessLine,enrollmentClosesMs,joinWitnessLine} from "./protocol.mjs";
import {fetchAllRegistryComments,parseRegistryIssue} from "../f03/registry-index.mjs";
import {ROUND_SPACING,BLOCKS} from "../f03/registry.mjs";
const JOIN=/^FB21-F04-JOIN\/v1 study=([a-f0-9]{32}) hash=([a-f0-9]{64}) campaign=([a-f0-9]{32}) commitment=([a-f0-9]{64})$/gm;
const F03=/^FB21-F03\/v1 campaign=([a-f0-9]{32}) commitment=([a-f0-9]{64}) blocks=4 first=([1-9]\d*) last=([1-9]\d*)$/gm;
const getMatches=(text,re)=>[...String(text||"").matchAll(re)];
const timestamp=x=>Date.parse(typeof x==="string"?x:"");
export async function buildCohortRoster(study,issueUrl,comments){
 await validateStudy(study);
 const issue=parseRegistryIssue(issueUrl);
 if(!Array.isArray(comments))throw Error("GitHub public comment list must be an array");
 const deadline=enrollmentClosesMs(study);
 const masters=comments.filter(c=>typeof c.body==="string"&&
   c.body.split(/\r?\n/).some(line=>line.trim()===studyWitnessLine(study)));
 if(masters.length!==1)throw Error("Exactly one public master study preregistration must exist");
 const master=masters[0],masterCreated=timestamp(master.created_at),masterUpdated=timestamp(master.updated_at);
 if(!Number.isFinite(masterCreated)||!Number.isFinite(masterUpdated)||
    masterUpdated<masterCreated||masterCreated>=deadline||masterUpdated>=deadline)
   throw Error("Master study registration is missing an authentic pre-deadline timestamp");
 const entries=[];
 const sorted=comments.slice().sort((a,b)=>timestamp(a.created_at)-timestamp(b.created_at)||Number(a.id||0)-Number(b.id||0));
 const existingCampaigns=new Set(),existingUsers=new Set();
 for(const c of sorted){
   const joins=getMatches(c.body,JOIN);
   if(!joins.length)continue;
   const created=timestamp(c.created_at),updated=timestamp(c.updated_at);
   const parsed=joins.length===1?joins[0]:null;
   const f03=getMatches(c.body,F03);
   const user=typeof c.user?.login==="string"&&c.user.login.trim()?c.user.login.trim().toLowerCase():null;
   const validCommentId=Number.isSafeInteger(c.id)&&c.id>0;
   const url=validCommentId?"https://github.com/"+issue.owner+"/"+issue.repo+"/issues/"+issue.issue+"#issuecomment-"+c.id:null;
   const row={campaign_id:parsed?.[3]||null,registration_hash:parsed?.[4]||null,
      github_login:user,comment_url:url,created_at:c.created_at||null,updated_at:c.updated_at||null,
      status:"rejected",reason:""};
   if(!parsed||f03.length!==1)row.reason="Expected exactly one F04 join and one F03 public witness line";
   else if(parsed[1]!==study.study_id||parsed[2]!==study.study_hash||
      f03[0][1]!==parsed[3]||f03[0][2]!==parsed[4])
     row.reason="Study or campaign hashes do not match preregistration";
   else if(Number(f03[0][3])!==study.first_round||
       Number(f03[0][4])!==study.first_round+(BLOCKS-1)*ROUND_SPACING)
     row.reason="Campaign uses a different target schedule";
   else if(!Number.isFinite(created)||!Number.isFinite(updated)||updated<created||
      created<masterUpdated||created>=deadline||updated>=deadline)
     row.reason="Enrollment not witnessed within the permitted window";
   else if(!user||!validCommentId)row.reason="Missing authenticated public commenter or comment ID";
   else if(existingCampaigns.has(row.campaign_id))row.reason="Duplicate campaign ID";
   else if(existingUsers.has(user))row.reason="One campaign per GitHub account";
   else {
     existingCampaigns.add(row.campaign_id);existingUsers.add(user);
     if(existingUsers.size>study.cohort_size){
       row.status="overflow";row.reason="Enrollment exceeded the preregistered cohort size";
     }else {
       row.status="enrolled";row.reason="Within fixed cohort";
     }
   }
   entries.push(row);
 }
 const enrolled=entries.filter(x=>x.status==="enrolled");
 return {study_id:study.study_id,study_hash:study.study_hash,registry_issue:issueUrl,
   master:{comment_id:master.id||null,created_at:master.created_at,updated_at:master.updated_at},
   enrollment_closes_utc:new Date(deadline).toISOString(),
   expected_participants:study.cohort_size,enrolled_count:enrolled.length,
   missing_enrollment:study.cohort_size-enrolled.length,
   enrolled,entries,
   caveat:"Roster covers only comments currently visible on this single issue; deleted or never-posted attempts are not detectable."};
}
export async function fetchCohortRoster(study,issueUrl,fetcher=fetch){
 const comments=await fetchAllRegistryComments(issueUrl,fetcher);
 return buildCohortRoster(study,issueUrl,comments);
}
