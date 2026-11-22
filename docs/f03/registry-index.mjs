/* F03 read-only coverage index for a designated public GitHub issue.
 * Uploaded JSON reports are not by themselves verified evidence.
 */
import {scheduledTime,WITNESS_GAP_SECONDS} from "../f02/protocol.mjs";
import {ROUND_SPACING,BLOCKS} from "./registry.mjs";
const PATTERN=/^FB21-F03\/v1 campaign=([a-f0-9]{32}) commitment=([a-f0-9]{64}) blocks=4 first=([1-9]\d*) last=([1-9]\d*)$/gm;
export function parseRegistryIssue(url){
 let u;try{u=new URL(url);}catch{throw Error("Invalid registry URL");}
 if(u.protocol!=="https:"||u.hostname!=="github.com"||u.username||u.password||u.port||u.hash||u.search)
   throw Error("Registry URL must be a public github.com issue URL with no query or fragment");
 const p=u.pathname.split("/").filter(Boolean);
 if(p.length!==4||p[2]!=="issues"||!p.slice(0,2).every(x=>/^[\w.-]{1,100}$/.test(x))||!/^[1-9]\d*$/.test(p[3]))
  throw Error("Registry URL does not identify one public issue");
 return {owner:p[0],repo:p[1],issue:p[3],
  api:"https://api.github.com/repos/"+p[0]+"/"+p[1]+"/issues/"+p[3]+"/comments"};
}
export async function fetchAllRegistryComments(issueUrl,fetcher=fetch){
 const issue=parseRegistryIssue(issueUrl),list=[];
 for(let page=1;page<=30;page++){
   const url=issue.api+"?per_page=100&page="+page;
   const res=await fetcher(url,{headers:{"Accept":"application/vnd.github+json"}});
   if(!res||!res.ok)throw Error("Cannot read public registry comments");
   const batch=await res.json();
   if(!Array.isArray(batch))throw Error("Invalid GitHub comments response");
   list.push(...batch);
   if(batch.length<100)return list;
 }
 throw Error("Registry exceeds 3000 comments: scope is incomplete");
}
export function summarizeRegistryComments(comments,uploadedReports=[]){
 if(!Array.isArray(comments)||!Array.isArray(uploadedReports))throw Error("Expected comments and reports arrays");
 const seen=new Map(),rows=[];
 for(const comment of comments){
   if(typeof comment.body!=="string")continue;
   for(const match of comment.body.matchAll(PATTERN)){
     const [,id,hash,firstText,lastText]=match;
     const first=Number(firstText),last=Number(lastText);
     const created=Date.parse(comment.created_at||""),updated=Date.parse(comment.updated_at||"");
     const validNumber=Number.isSafeInteger(first)&&Number.isSafeInteger(last)&&last===first+(BLOCKS-1)*ROUND_SPACING;
     const deadline=validNumber?scheduledTime(first)-WITNESS_GAP_SECONDS*1000:NaN;
     const timely=Number.isFinite(created)&&Number.isFinite(updated)&&updated>=created&&created<deadline&&updated<deadline;
     const row={campaign_id:id,registration_hash:hash,first,last,
       comment_url:comment.html_url||null,witness_created_at:comment.created_at||null,
       witness_updated_at:comment.updated_at||null,
       status:(!validNumber||!timely)?"invalid_witness":"registered",
       reported:false,report_complete:false};
     if(seen.has(id)){row.status="duplicate_id";seen.get(id).status="duplicate_id";}
     else seen.set(id,row);
     rows.push(row);
   }
 }
 const unrecognized=[],reportsSeen=new Set();
 for(const report of uploadedReports){
   const id=report?.campaign_id,hash=report?.registration_hash,entry=seen.get(id);
   if(!entry||entry.registration_hash!==hash||reportsSeen.has(id)){
     unrecognized.push({campaign_id:typeof id==="string"?id:null,reason:"unmatched, altered or duplicate report"});continue;
   }
   reportsSeen.add(id);entry.reported=true;
   entry.report_complete=report.summary?.complete===true&&Array.isArray(report.blocks)&&
     report.blocks.length===BLOCKS&&report.blocks.every((b,i)=>b.index===i&&b.status==="verified");
 }
 const valid=rows.filter(r=>r.status==="registered");
 return {registered_unique:valid.length,invalid_or_duplicate:rows.length-valid.length,
   reports_submitted:valid.filter(r=>r.reported).length,
   apparently_complete_reports:valid.filter(r=>r.report_complete).length,
   registered_but_unreported:valid.filter(r=>!r.reported).length,
   unrecognized_reports:unrecognized,registrations:rows,
   caution:"Coverage index only. Submitted reports are untrusted until independently rerun; unregistered attempts cannot be detected."};
}
export async function registryCoverage(issueUrl,reports,{fetcher=fetch}={}){
 return summarizeRegistryComments(await fetchAllRegistryComments(issueUrl,fetcher),reports);
}
