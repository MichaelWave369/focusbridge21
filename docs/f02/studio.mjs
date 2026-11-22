import {TRIALS,CHOICES,createSealedPlan,witnessText,scheduledTime,auditOnline} from "./protocol.mjs";
const root=document.getElementById("studio");
let guesses=[],sealed=null;
const names=["Circle","Triangle","Square","Star"];
function element(tag,text,cls){
 const e=document.createElement(tag);if(text!==undefined)e.textContent=text;
 if(cls)e.className=cls;return e;
}
function addButton(parent,label,fn){
 const b=element("button",label);b.type="button";b.addEventListener("click",fn);parent.append(b);return b;
}
function status(s,isError=false){const e=element("p",s,isError?"error":"success");root.append(e);}
function reset(){guesses=[];sealed=null;showPredictions();}
function showPredictions(){
 root.replaceChildren(element("h2","Step 1 · Seal your predictions"),
   element("p","Prediction "+(guesses.length+1)+" of "+TRIALS+". Each prediction locks immediately. No feedback is shown."));
 const options=element("div",undefined,"options");
 names.forEach((name,i)=>addButton(options,name,async()=>{
   guesses.push(i);if(guesses.length<TRIALS){showPredictions();return;}
   root.replaceChildren(element("h2","Creating sealed commitment…"));
   try {sealed=await createSealedPlan(guesses);showSealed();}
   catch(err){guesses=[];root.replaceChildren(element("h2","Could not create a secure plan"));status(String(err.message||err),true);addButton(root,"Start over",reset);}
 }));
 root.append(options,element("p","No account or sensors. Predictions stay in this page until you download the private file.","note"));
}
function downloadSealed(){
 const blob=new Blob([JSON.stringify(sealed,null,2)+"\n"],{type:"application/json"});
 const url=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=url;a.download="focusbridge21-f02-sealed-"+sealed.beacon_round+".json";
 document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
}
function showSealed(){
 const line=witnessText(sealed);
 const deadline=new Date(scheduledTime(sealed.beacon_round)-30000).toISOString();
 root.replaceChildren(element("h2","Step 2 · Publish only the hash"),
   element("p","Target drand Quicknet round: "+sealed.beacon_round),
   element("p","Round scheduled for: "+new Date(scheduledTime(sealed.beacon_round)).toISOString()),
   element("p","GitHub witness deadline: "+deadline),
   element("p","Commitment SHA-256: "+sealed.commitment,"hash"),
   element("label","Exact public witness line:"));
 const text=document.createElement("textarea");text.readOnly=true;text.value=line;text.setAttribute("aria-label","Public witness line");root.append(text);
 const actions=element("div",undefined,"row");
 addButton(actions,"Download PRIVATE sealed JSON",downloadSealed);
 addButton(actions,"Copy public line",async()=>{
   try{await navigator.clipboard.writeText(line);status("Public line copied. The private predictions were not copied.");}
   catch{ text.select();status("Clipboard unavailable. Select and copy the public line manually.",true); }
 });
 root.append(actions,element("p","Do not paste the private JSON into a public issue. A public comment needs only the exact witness line.","note"));
 const label=element("label","Step 3 · Paste public GitHub issue comment URL");label.htmlFor="witness-url";
 const input=document.createElement("input");input.id="witness-url";input.type="url";input.placeholder="https://github.com/owner/repo/issues/123#issuecomment-123456";
 root.append(label,input);
 addButton(root,"Verify public records",async()=>{
   const url=input.value.trim();if(!url){status("A public GitHub issue comment URL is required.",true);return;}
   root.append(element("p","Checking witness timestamps and two drand relays…","note"));
   try{
     const result=await auditOnline(sealed,url);
     const report=element("section",undefined,"success");
     report.append(element("h3","Witness and beacon relay records matched"),
       element("p",result.hits+" / 20 predictions matched. Expected by chance: 5."),
       element("p","One-sided chance-model tail: "+(result.one_sided_tail*100).toFixed(3)+"%."),
       element("p",result.assurance),element("p",result.science_limit));
     root.append(report);
   }catch(err){status("Audit unavailable or failed: "+String(err.message||err),true);}
 });
 addButton(root,"Discard and start new predictions",reset);
}
if(!globalThis.crypto?.subtle||typeof globalThis.crypto?.getRandomValues!=="function"){
 root.replaceChildren(element("h2","Secure browser context required"),element("p","Open over HTTPS with Web Crypto enabled. This protocol does not fall back to insecure randomness."));
}else showPredictions();