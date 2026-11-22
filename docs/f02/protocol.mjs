/* FocusBridge21 F02: reproducible commitment + beacon protocol.
 * Relays and public GitHub timestamps are independently fetched; this version
 * DOES NOT perform drand BLS signature verification. See protocol documentation.
 */
export const SCHEMA="focusbridge21/f02/v1";
export const CHAIN_HASH="52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971";
export const GENESIS=1692803367;
export const PERIOD=3;
export const TRIALS=20;
export const CHOICES=4;
export const LEAD_SECONDS=360;
export const WITNESS_GAP_SECONDS=30;
const utf8=new TextEncoder();
const toHex=b=>Array.from(b, v=>v.toString(16).padStart(2,"0")).join("");
const hexBytes=s=>{
 if(typeof s!=="string"||s.length%2!==0||!/^[0-9a-f]+$/i.test(s))throw Error("Invalid hex value");
 return Uint8Array.from(s.match(/../g),v=>parseInt(v,16));
};
const bytes=async data=>new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256",data));
export const sha256Hex=async data=>toHex(await bytes(typeof data==="string"?utf8.encode(data):data));
export function scheduledTime(round) {
 if(!Number.isSafeInteger(round)||round<1)throw Error("Invalid beacon round");
 return (GENESIS+(round-1)*PERIOD)*1000;
}
export function nextFutureRound(nowMs,leadSeconds=LEAD_SECONDS) {
 if(!Number.isFinite(nowMs)||nowMs<GENESIS*1000)throw Error("Invalid current time");
 if(!Number.isSafeInteger(leadSeconds)||leadSeconds<60)throw Error("Insufficient lead time");
 return Math.ceil((nowMs/1000+leadSeconds-GENESIS)/PERIOD)+1;
}
export function validatePredictions(predictions) {
 if(!Array.isArray(predictions)||predictions.length!==TRIALS||
    !predictions.every(v=>Number.isInteger(v)&&v>=0&&v<CHOICES))throw Error("Exactly 20 predictions from 0 to 3 are required");
 return predictions;
}
export function canonicalPayload(plan) {
 if(!plan||plan.schema!==SCHEMA||plan.chain_hash!==CHAIN_HASH)throw Error("Wrong F02 schema or drand chain");
 if(!Number.isSafeInteger(plan.beacon_round)||plan.beacon_round<1)throw Error("Invalid beacon round");
 validatePredictions(plan.predictions);
 if(typeof plan.nonce!=="string"||!/^[0-9a-f]{64}$/.test(plan.nonce))throw Error("Nonce must be 32 lowercase hex bytes");
 return ["FB21-F02-v1",CHAIN_HASH,String(plan.beacon_round),plan.predictions.join(","),plan.nonce].join("\n");
}
export async function commitmentOf(plan){return sha256Hex(canonicalPayload(plan));}
export function witnessText(plan){
 if(!plan||!Number.isSafeInteger(plan.beacon_round)||!(/^[0-9a-f]{64}$/.test(plan.commitment||"")))throw Error("Invalid witness fields");
 return "FB21-F02/v1 round="+plan.beacon_round+" commitment="+plan.commitment;
}
export async function createSealedPlan(predictions,{nowMs=Date.now(),randomProvider=globalThis.crypto}={}) {
 validatePredictions(predictions);
 if(!randomProvider||typeof randomProvider.getRandomValues!=="function"||!globalThis.crypto?.subtle)throw Error("Secure browser crypto is required");
 const nonce=new Uint8Array(32);
 randomProvider.getRandomValues(nonce);
 const plan={schema:SCHEMA,chain_hash:CHAIN_HASH,beacon_round:nextFutureRound(nowMs),
   predictions:[...predictions],nonce:toHex(nonce)};
 plan.commitment=await commitmentOf(plan);
 return plan;
}
export async function validatePlan(plan){
 const hash=await commitmentOf(plan);
 if(plan.commitment!==hash)throw Error("Sealed plan has been altered or has the wrong commitment");
 return {hash,roundTime:scheduledTime(plan.beacon_round)};
}
export function parseWitnessUrl(input) {
 let u;
 try{u=new URL(input);}catch{throw Error("Enter a public GitHub issue comment URL");}
 if(u.protocol!=="https:"||u.hostname!=="github.com"||u.username||u.password||u.port||u.search)throw Error("Witness must be an HTTPS github.com issue comment");
 const parts=u.pathname.split("/").filter(Boolean);
 if(parts.length!==4||!parts.slice(0,2).every(p=>/^[\w.-]{1,100}$/.test(p))||
    parts[2]!=="issues"||!(/^[1-9]\d*$/.test(parts[3])))throw Error("Unsupported GitHub issue URL");
 const m=/^#issuecomment-([1-9]\d*)$/.exec(u.hash);
 if(!m)throw Error("Witness URL must include an issuecomment ID");
 return "https://api.github.com/repos/"+parts[0]+"/"+parts[1]+"/issues/comments/"+m[1];
}
async function getJSON(url,fetcher){
 const response=await fetcher(url,{headers:{"Accept":"application/vnd.github+json"}});
 if(!response||!response.ok)throw Error("Could not fetch independent record: "+url.split("/").slice(0,3).join("/"));
 return response.json();
}
export async function verifyWitness(plan,witnessUrl,fetcher=fetch) {
 await validatePlan(plan);
 const url=parseWitnessUrl(witnessUrl);
 const record=await getJSON(url,fetcher);
 const required=witnessText(plan);
 if(typeof record.body!=="string"||!record.body.split(/\r?\n/).some(line=>line.trim()===required)){
   throw Error("Public witness comment does not contain the exact commitment line");
 }
 const created=Date.parse(record.created_at||""),updated=Date.parse(record.updated_at||"");
 if(!Number.isFinite(created)||!Number.isFinite(updated)||updated<created)throw Error("Witness timestamps missing or inconsistent");
 const deadline=scheduledTime(plan.beacon_round)-WITNESS_GAP_SECONDS*1000;
 if(created>=deadline||updated>=deadline)throw Error("Witness was created or edited too late for the future beacon round");
 return {url,created_at:record.created_at,updated_at:record.updated_at,deadline:new Date(deadline).toISOString()};
}
export async function verifyBeacon(plan,fetcher=fetch) {
 await validatePlan(plan);
 const endpoints=["https://api.drand.sh/","https://drand.cloudflare.com/"];
 const round=plan.beacon_round;
 const records=await Promise.all(endpoints.map(base=>getJSON(base+CHAIN_HASH+"/public/"+round,fetcher)));
 for(const r of records){
   if(!r||r.round!==round||typeof r.signature!=="string"||!/^[0-9a-f]{96}$/i.test(r.signature)||
      typeof r.randomness!=="string"||!/^[0-9a-f]{64}$/i.test(r.randomness))throw Error("Malformed beacon response");
   const digest=await sha256Hex(hexBytes(r.signature));
   if(digest!==r.randomness.toLowerCase())throw Error("Beacon randomness does not match its signature hash");
 }
 if(records[0].signature.toLowerCase()!==records[1].signature.toLowerCase()||
    records[0].randomness.toLowerCase()!==records[1].randomness.toLowerCase())
   throw Error("Independent beacon relays disagree");
 return {round,signature:records[0].signature.toLowerCase(),randomness:records[0].randomness.toLowerCase(),
   relays:endpoints,bls_verified:false};
}
export async function deriveTargets(plan,randomness) {
 await validatePlan(plan);
 if(!(/^[0-9a-f]{64}$/.test(randomness)))throw Error("Invalid beacon randomness");
 const key=await globalThis.crypto.subtle.importKey("raw",hexBytes(randomness),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const result=[];
 for(let i=0;i<TRIALS;i++){
   const message=utf8.encode("FB21-F02-v1|"+plan.beacon_round+"|"+i);
   const digest=new Uint8Array(await globalThis.crypto.subtle.sign("HMAC",key,message));
   result.push(digest[0]&3);
 }
 return result;
}
export function scorePredictions(predictions,targets){
 validatePredictions(predictions);
 validatePredictions(targets);
 const hits=predictions.filter((v,i)=>v===targets[i]).length;
 let mass=Math.pow(.75,TRIALS),tail=0;
 for(let k=0;k<=TRIALS;k++){if(k>=hits)tail+=mass;if(k<TRIALS)mass=mass*(TRIALS-k)/(k+1)/3;}
 return {hits,trials:TRIALS,expected:5,one_sided_tail:Math.min(1,tail)};
}
export async function auditOnline(plan,witnessUrl,fetcher=fetch) {
 // Witness must be independently checked, not inferred from a local timestamp.
 const witness=await verifyWitness(plan,witnessUrl,fetcher);
 const beacon=await verifyBeacon(plan,fetcher);
 const targets=await deriveTargets(plan,beacon.randomness);
 return {protocol:SCHEMA,commitment:plan.commitment,round:plan.beacon_round,
   scheduled_utc:new Date(scheduledTime(plan.beacon_round)).toISOString(),
   witness,beacon,targets,...scorePredictions(plan.predictions,targets),
   assurance:"Two HTTPS relay responses and GitHub comment timestamps matched. BLS signature has NOT been independently verified.",
   science_limit:"No selective reporting controls, replication, or confirmed precognition."};
}
