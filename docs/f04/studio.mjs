import {createStudy,validateStudy,studyWitnessLine,enrollmentClosesMs,createParticipantCampaign} from "./protocol.mjs";
import {fetchCohortRoster} from "./roster.mjs";
import {scheduledTime} from "../f02/protocol.mjs";
const root=document.getElementById("f04");
let study=null,priv=null;
const names=["Circle","Triangle","Square","Star"];
let predictions=Array.from({length:4},()=>[]);
const el=(tag,value,cls)=>{const e=document.createElement(tag);if(value!==undefined)e.textContent=value;if(cls)e.className=cls;return e;};
function button(container,label,fn){const b=el("button",label);b.type="button";b.addEventListener("click",fn);container.append(b);return b;}
function download(data,name){
 const blob=new Blob([JSON.stringify(data,null,2)+"\n"],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
}
function copy(text,input){
 if(navigator.clipboard?.writeText){
  navigator.clipboard.writeText(text).then(()=>root.append(el("p","Public text copied.","success")))
    .catch(()=>{input.select();root.append(el("p","Clipboard unavailable. Select and copy the text.","error"));});
 }else{input.select();root.append(el("p","Clipboard unavailable. Select and copy the text.","error"));}
}
function message(text,error=false){root.append(el("p",text,error?"error":"success"));}
function reset(){study=null;priv=null;predictions=Array.from({length:4},()=>[]);home();}
function home(){
 root.replaceChildren(el("h2","Choose a research role"),el("p","Create a new pilot study, or join an existing study using its public JSON configuration."));
 const controls=el("div",undefined,"row");
 button(controls,"Plan a study",createScreen);
 button(controls,"Join a study",joinScreen);
 root.append(controls);
}
function createScreen(){
 root.replaceChildren(el("h2","Study organizer"),el("p","A new study schedules four shared target rounds at least 24 hours ahead, with enrollment closing one hour before the first."));
 const lab=el("label","Target cohort size (2 to 24)");
 const select=document.createElement("select");select.id="f04-size";
 for(const n of [2,4,8,12,16,24]){const o=document.createElement("option");o.value=String(n);o.textContent=String(n);if(n===8)o.selected=true;select.append(o);}
 select.style.padding="12px";root.append(lab,select);
 const actions=el("div",undefined,"row");
 button(actions,"Generate study configuration",async()=>{
  try{study=await createStudy({cohortSize:Number(select.value)});showStudy();}
  catch(error){message(String(error.message||error),true);}
 });
 button(actions,"Back",home);root.append(actions);
}
function textArea(text,label){
 const title=el("label",label),ta=document.createElement("textarea");
 ta.readOnly=true;ta.value=text;root.append(title,ta);return ta;
}
function showStudy(){
 root.replaceChildren(el("h2","Study plan sealed"),el("p","Study ID: "+study.study_id),
 el("p","First target: "+new Date(scheduledTime(study.first_round)).toISOString()),
 el("p","Enrollment closes: "+new Date(enrollmentClosesMs(study)).toISOString()),
 el("p","Cohort seats: "+study.cohort_size));
 const line=studyWitnessLine(study);const area=textArea(line,"Exact public organizer registration:");
 const actions=el("div",undefined,"row");
 button(actions,"Download PUBLIC study JSON",()=>download(study,"focusbridge21-f04-study-"+study.study_id+".json"));
 button(actions,"Copy organizer line",()=>copy(line,area));
 button(actions,"Check public registry",inspectScreen);
 button(actions,"Start over",reset);root.append(actions);
 message("Publish the organizer line on the public registry issue BEFORE participant enrollment. Share the public study JSON with participants.");
}
function joinScreen(){
 root.replaceChildren(el("h2","Participant: load the public study plan"),
  el("p","The study JSON is public information, not a secret. Loading the file verifies its internal hash, but you must also check that the organizer publicly registered it before you join."));
 const label=el("label","Select public study JSON"),file=document.createElement("input");
 file.type="file";file.accept="application/json,.json";label.append(file);
 const actions=el("div",undefined,"row");
 button(actions,"Load and verify study",async()=>{
  try{
   if(!file.files?.[0])throw Error("Choose a public study JSON file first");
   const imported=JSON.parse(await file.files[0].text());
   await validateStudy(imported);
   if(Date.now()>=enrollmentClosesMs(imported))throw Error("The public enrollment cutoff has passed");
   study=imported;predictions=Array.from({length:4},()=>[]);showJoinChoices();
  }catch(err){message(String(err.message||err),true);}
 });
 button(actions,"Back",home);root.append(label,actions);
}
function showJoinChoices(){
 const block=predictions.findIndex(b=>b.length<20);
 if(block<0){sealJoin();return;}
 root.replaceChildren(el("h2","Participant predictions"),
  el("p","Study "+study.study_id+" · Block "+(block+1)+"/4 · Prediction "+(predictions[block].length+1)+"/20"));
 const opts=el("div",undefined,"options");
 names.forEach((name,i)=>button(opts,name,()=>{predictions[block].push(i);showJoinChoices();}));
 root.append(opts,el("p","The target will be drawn later. No feedback or scores are available now.","small"));
}
async function sealJoin(){
 root.replaceChildren(el("h2","Sealing your fixed-round campaign…"));
 try{priv=await createParticipantCampaign(study,predictions);showJoinResult();}
 catch(err){root.append(el("p",String(err.message||err),"error"));button(root,"Start again",reset);}
}
function showJoinResult(){
 root.replaceChildren(el("h2","Private campaign sealed"),el("p","Campaign ID: "+priv.campaign.registration.campaign_id),
  el("p","Enrollment closes: "+new Date(enrollmentClosesMs(study)).toISOString()));
 const lines=priv.public_comment;
 const input=textArea(lines,"Both lines go together in ONE public GitHub issue comment:");
 const controls=el("div",undefined,"row");
 button(controls,"Download PRIVATE campaign JSON",()=>download(priv.campaign,"focusbridge21-f04-private-"+priv.campaign.registration.campaign_id+".json"));
 button(controls,"Copy BOTH public witness lines",()=>copy(lines,input));
 button(controls,"Start over",reset);root.append(controls);
 message("Do not publish your private predictions/nonces before the beacon rounds. Use your own GitHub account; only the first valid registration per account is eligible.");
}
function inspectScreen(){
 root.replaceChildren(el("h2","Check the live public enrollment roster"),
 el("p","Enter the issue where the organizer posted the F04 study line. This action will query GitHub only, not upload your study file."));
 const label=el("label","Public GitHub issue URL"),input=document.createElement("input");
 input.type="url";input.placeholder="https://github.com/owner/repo/issues/123";
 root.append(label,input);
 const actions=el("div",undefined,"row");
 button(actions,"Read registered participants",async()=>{
  try{
   if(!study)throw Error("No study loaded");
   const roster=await fetchCohortRoster(study,input.value.trim());
   root.append(el("p",roster.enrolled_count+" enrolled / "+roster.expected_participants+" required; "+roster.missing_enrollment+" unfilled seats.","success"));
   for(const row of roster.entries){
    root.append(el("p",row.status.toUpperCase()+" · "+(row.github_login||"unknown")+" · "+row.reason,"small"));
   }
   root.append(el("p","This roster is an observation of currently visible comments, not proof that deleted or never-posted attempts did not exist.","small"));
  }catch(err){message(String(err.message||err),true);}
 });
 button(actions,"Back to study",showStudy);
 root.append(actions);
}
if(!globalThis.crypto?.subtle||!globalThis.crypto?.getRandomValues)
 root.replaceChildren(el("h2","Secure browser required"),el("p","F04 requires HTTPS and Web Crypto. No insecure fallback.","error"));
else home();
