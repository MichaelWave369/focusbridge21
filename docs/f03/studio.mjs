import {BLOCKS,createCampaign,publicWitnessLine} from "./registry.mjs";
import {scheduledTime} from "../f02/protocol.mjs";
const root=document.getElementById("campaign");
const labels=["Circle","Triangle","Square","Star"];
let blocks=Array.from({length:BLOCKS},()=>[]);
let sealed=null;
function elem(tag,txt,cls){
 const node=document.createElement(tag);if(txt!==undefined)node.textContent=txt;
 if(cls)node.className=cls;return node;
}
function btn(parent,label,callback){
 const node=elem("button",label);node.type="button";node.addEventListener("click",callback);parent.append(node);
}
function render(){
 const bi=blocks.findIndex(x=>x.length<20);
 if(bi<0){seal();return;}
 root.replaceChildren(elem("h2","Step 1 · Enter predictions"),
   elem("p","Block "+(bi+1)+" / "+BLOCKS+" · Prediction "+(blocks[bi].length+1)+" / 20"));
 const options=elem("div",undefined,"options");
 labels.forEach((label,i)=>btn(options,label,()=>{blocks[bi].push(i);render();}));
 root.append(options,elem("p","All eighty choices are made before any of the four targets are published.","small"));
}
async function seal(){
 root.replaceChildren(elem("h2","Sealing four prediction blocks…"));
 try{sealed=await createCampaign(blocks);showSealed();}
 catch(error){root.append(elem("p",String(error.message||error),"error"));btn(root,"Start over",reset);}
}
function reset(){sealed=null;blocks=Array.from({length:BLOCKS},()=>[]);render();}
function download(){
 const data=JSON.stringify(sealed,null,2)+"\n";
 const url=URL.createObjectURL(new Blob([data],{type:"application/json"}));
 const a=document.createElement("a");a.href=url;a.download="focusbridge21-f03-private-"+sealed.registration.campaign_id+".json";
 document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
}
function showSealed(){
 const line=publicWitnessLine(sealed.registration);
 const first=scheduledTime(sealed.registration.blocks[0].round);
 root.replaceChildren(elem("h2","Step 2 · Anchor the preregistration"),
   elem("p","Campaign ID: "+sealed.registration.campaign_id),
   elem("p","First future round: "+new Date(first).toISOString()),
   elem("p","Public registration must exist and remain unedited BEFORE: "+new Date(first-30000).toISOString()),
   elem("p","Registration hash: "+sealed.registration.registration_hash,"hash"));
 const label=elem("label","Publish only this exact public line:");
 const field=document.createElement("textarea");field.value=line;field.readOnly=true;
 root.append(label,field);
 const actions=elem("div",undefined,"row");
 btn(actions,"Download PRIVATE sealed file",download);
 btn(actions,"Copy public line",async()=>{
  try{await navigator.clipboard.writeText(line);root.append(elem("p","Public witness line copied.","success"));}
  catch{field.select();root.append(elem("p","Clipboard unavailable; select and copy text manually.","error"));}
 });
 btn(actions,"Discard private draft",reset);root.append(actions);
 root.append(elem("p","Keep the private file until after all four rounds. For independently authenticated results, run the F03 Node audit command documented below. Never paste the private JSON into a public issue.","small"));
}
if(!globalThis.crypto?.subtle||!globalThis.crypto?.getRandomValues)
 root.replaceChildren(elem("h2","Secure browser connection required"),elem("p","Web Crypto is unavailable. Use HTTPS. No insecure fallback is provided.","error"));
else render();
