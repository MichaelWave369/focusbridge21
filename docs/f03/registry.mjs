/* FocusBridge21 F03: campaign registration and all-block accounting.
 * Browser-safe: no Node imports, accounts or third-party code.
 */
import {SCHEMA as F02, CHAIN_HASH, TRIALS, validatePredictions, commitmentOf,
  validatePlan, nextFutureRound, scheduledTime, parseWitnessUrl, verifyBeacon,
  deriveTargets, scorePredictions, sha256Hex, WITNESS_GAP_SECONDS}
  from "../f02/protocol.mjs";

export const F03="focusbridge21/f03/v1";
export const BLOCKS=4;
export const ROUND_SPACING=40; // 120s between successive beacon rounds
export const LEAD_SECONDS=1200; // 20 minutes before first beacon
export const ANALYSIS="all-four-blocks-summed-hits-v1";
const utf8 = new TextEncoder();
const hex=bytes=>Array.from(bytes,x=>x.toString(16).padStart(2,"0")).join("");
const isHex=(value,size)=>typeof value==="string"&&new RegExp("^[a-f0-9]{"+size+"}$").test(value);
const secure=(provider)=>provider&&typeof provider.getRandomValues==="function"&&!!globalThis.crypto?.subtle;
function randomHex(provider,n){
 const data=new Uint8Array(n);
 provider.getRandomValues(data);
 return hex(data);
}
export function canonicalRegistration(reg){
 if(!reg||reg.schema!==F03||reg.chain_hash!==CHAIN_HASH||
    !isHex(reg.campaign_id,32)||reg.analysis!==ANALYSIS||
    reg.block_count!==BLOCKS||!Array.isArray(reg.blocks)||reg.blocks.length!==BLOCKS)
     throw Error("Invalid F03 registration format");
 const lines=["FB21-F03-v1",reg.campaign_id,CHAIN_HASH,ANALYSIS,String(BLOCKS)];
 let first=null;
 for(let i=0;i<BLOCKS;i++){
   const b=reg.blocks[i];
   if(!b||b.index!==i||!Number.isSafeInteger(b.round)||b.round<1||
      !isHex(b.commitment,64))throw Error("Invalid registered block");
   if(i===0)first=b.round;
   else if(b.round!==first+i*ROUND_SPACING)throw Error("Registered rounds must be consecutive scheduled slots");
   lines.push(i+","+b.round+","+b.commitment);
 }
 return lines.join("\n");
}
export async function registrationHash(reg){return sha256Hex(canonicalRegistration(reg));}
export function publicWitnessLine(reg){
 if(!isHex(reg?.registration_hash,64))throw Error("Invalid registration hash");
 canonicalRegistration(reg);
 return "FB21-F03/v1 campaign="+reg.campaign_id+" commitment="+reg.registration_hash+
   " blocks="+BLOCKS+" first="+reg.blocks[0].round+" last="+reg.blocks[BLOCKS-1].round;
}
export async function validateRegistration(reg){
 const hash=await registrationHash(reg);
 if(reg.registration_hash!==hash)throw Error("The campaign registration was modified after sealing");
 return reg;
}
export async function createCampaign(predictionBlocks,{nowMs=Date.now(),randomProvider=globalThis.crypto}={}){
 if(!Array.isArray(predictionBlocks)||predictionBlocks.length!==BLOCKS)
   throw Error("F03 requires exactly four blocks");
 predictionBlocks.forEach(validatePredictions);
 if(!secure(randomProvider))throw Error("Secure browser crypto is required");
 const first=nextFutureRound(nowMs,LEAD_SECONDS);
 const sealed_blocks=[];
 for(let i=0;i<BLOCKS;i++){
   const plan={schema:F02,chain_hash:CHAIN_HASH,beacon_round:first+i*ROUND_SPACING,
      predictions:[...predictionBlocks[i]],nonce:randomHex(randomProvider,32)};
   plan.commitment=await commitmentOf(plan);
   sealed_blocks.push(plan);
 }
 const registration={schema:F03,chain_hash:CHAIN_HASH,campaign_id:randomHex(randomProvider,16),
   block_count:BLOCKS,analysis:ANALYSIS,
   blocks:sealed_blocks.map((p,index)=>({index,round:p.beacon_round,commitment:p.commitment}))};
 registration.registration_hash=await registrationHash(registration);
 return {schema:"focusbridge21/f03/private/v1",registration,sealed_blocks};
}
export async function validateSealedCampaign(sealed){
 if(!sealed||sealed.schema!=="focusbridge21/f03/private/v1")throw Error("Invalid private campaign file");
 const reg=await validateRegistration(sealed.registration);
 if(!Array.isArray(sealed.sealed_blocks)||sealed.sealed_blocks.length!==BLOCKS)
   throw Error("Every registered block must be present even if it later cannot be audited");
 for(let i=0;i<BLOCKS;i++){
   const plan=sealed.sealed_blocks[i],entry=reg.blocks[i];
   await validatePlan(plan);
   if(plan.beacon_round!==entry.round||plan.commitment!==entry.commitment)
     throw Error("Private block does not match the public registration");
 }
 return reg;
}
export async function verifyCampaignWitness(reg,url,fetcher=fetch){
 await validateRegistration(reg);
 const endpoint=parseWitnessUrl(url);
 const response=await fetcher(endpoint,{headers:{"Accept":"application/vnd.github+json"}});
 if(!response||!response.ok)throw Error("Failed to fetch public GitHub witness");
 const data=await response.json();
 if(typeof data.body!=="string"||!data.body.split(/\r?\n/).some(x=>x.trim()===publicWitnessLine(reg)))
   throw Error("Public witness is missing the exact preregistration line");
 const created=Date.parse(data.created_at||""),modified=Date.parse(data.updated_at||"");
 if(!Number.isFinite(created)||!Number.isFinite(modified)||modified<created)
   throw Error("Invalid witness timestamps");
 const deadline=scheduledTime(reg.blocks[0].round)-WITNESS_GAP_SECONDS*1000;
 if(created>=deadline||modified>=deadline)
   throw Error("The public registration was created or edited after the preregistration deadline");
 return {url,created_at:data.created_at,updated_at:data.updated_at,
   deadline:new Date(deadline).toISOString(),registry_hash:reg.registration_hash};
}
export function aggregateCampaignBlocks(blockResults){
 if(!Array.isArray(blockResults)||blockResults.length!==BLOCKS)throw Error("Four block statuses are required");
 const audited=blockResults.filter(b=>b?.status==="verified");
 const missing=BLOCKS-audited.length;
 const hits=audited.reduce((n,b)=>n+b.hits,0);
 const claimed=audited.length*TRIALS;
 // Only compute pooled chance-model tails for COMPLETELY verified campaigns.
 let upperTail=null;
 if(!missing){
   const n=BLOCKS*TRIALS,p=.25;
   let mass=Math.pow(1-p,n),sum=0;
   for(let k=0;k<=n;k++){
     if(k>=hits)sum+=mass;
     if(k<n)mass=mass*(n-k)/(k+1)*p/(1-p);
   }
   upperTail=Math.min(1,sum);
 }
 return {registered_blocks:BLOCKS,verified_blocks:audited.length,missing_or_failed_blocks:missing,
   registered_trials:BLOCKS*TRIALS,verified_trials:claimed,verified_hits:hits,
   expected_hits_if_complete:BLOCKS*TRIALS/4,
   complete:missing===0,pooled_one_sided_chance_tail:upperTail,
   interpretation:missing?"INCOMPLETE: no pooled inference; missing blocks are explicitly retained":
     "Exploratory chance-model result only; not proof of future information access"};
}
export async function auditCampaign(sealed,url,{fetcher=fetch,verifySignature}={}){
 const reg=await validateSealedCampaign(sealed);
 if(typeof verifySignature!=="function")throw Error("BLS verifier must be provided");
 const witness=await verifyCampaignWitness(reg,url,fetcher);
 const results=[];
 for(let i=0;i<BLOCKS;i++){
   const plan=sealed.sealed_blocks[i];
   try{
     // The legacy F02 check validates relay agreement and signature-to-randomness SHA256.
     const beacon=await verifyBeacon(plan,fetcher);
     if(await verifySignature(beacon.signature,plan.beacon_round)!==true)
       throw Error("BLS12-381 signature authentication failed");
     const targets=await deriveTargets(plan,beacon.randomness);
     const score=scorePredictions(plan.predictions,targets);
     results.push({index:i,round:plan.beacon_round,status:"verified",
       commitment:plan.commitment,signature:beacon.signature,randomness:beacon.randomness,
       targets,predictions:[...plan.predictions],nonce:plan.nonce,
       hits:score.hits,expected:score.expected,one_sided_tail:score.one_sided_tail,
       bls_verified:true});
   }catch(error){
     results.push({index:i,round:plan.beacon_round,status:"unresolved",
       commitment:plan.commitment,reason:String(error.message||error).slice(0,240),
       hits:null,bls_verified:false});
   }
 }
 return {schema:F03,campaign_id:reg.campaign_id,registration_hash:reg.registration_hash,
   registration:reg,witness,blocks:results,summary:aggregateCampaignBlocks(results),
   assurance:"Registered four blocks, externally timestamped before first round; each verified block passes drand relay and pinned-key BLS checks.",
   caveat:"No global participant registry is enforced; selective enrolment and disclosure remain possible. Not evidence of precognition."};
}
