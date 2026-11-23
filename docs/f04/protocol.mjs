/* FocusBridge21 F04: prospectively fixed, privacy-minimized cohort protocol.
 * Web Crypto only. No network or account access during plan creation.
 */
import {CHAIN_HASH,nextFutureRound,scheduledTime,sha256Hex} from "../f02/protocol.mjs";
import {createCampaign,validateRegistration,publicWitnessLine,BLOCKS,ROUND_SPACING} from "../f03/registry.mjs";
export const F04="focusbridge21/f04/v1";
export const SIZE_MIN=2, SIZE_MAX=24, DEFAULT_SIZE=8;
export const STUDY_LEAD_SECONDS=86400; // first target at least 24 hours away
export const ENROLLMENT_GAP_SECONDS=3600; // close enrollment 1 hour before first target
export const ANALYSIS="exact-shared-target-randomization-v1";
export const ALPHA="0.05";
const isHex=(value,n)=>typeof value==="string"&&new RegExp("^[a-f0-9]{"+n+"}$").test(value);
const toHex=bytes=>Array.from(bytes,x=>x.toString(16).padStart(2,"0")).join("");
export function enrollmentClosesMs(study){
 return scheduledTime(study.first_round)-ENROLLMENT_GAP_SECONDS*1000;
}
export function canonicalStudy(study){
 if(!study||study.schema!==F04||study.chain_hash!==CHAIN_HASH||!isHex(study.study_id,32)||
    !Number.isSafeInteger(study.cohort_size)||study.cohort_size<SIZE_MIN||study.cohort_size>SIZE_MAX||
    !Number.isSafeInteger(study.first_round)||study.first_round<1||study.blocks!==BLOCKS||
    study.round_spacing!==ROUND_SPACING||study.analysis!==ANALYSIS||study.alpha!==ALPHA)
     throw Error("Invalid F04 study configuration");
 return ["FB21-F04-v1",study.study_id,CHAIN_HASH,String(study.cohort_size),
   String(study.first_round),String(BLOCKS),String(ROUND_SPACING),
   String(Math.floor(enrollmentClosesMs(study)/1000)),ANALYSIS,ALPHA].join("\n");
}
export async function studyHash(study){return sha256Hex(canonicalStudy(study));}
export async function validateStudy(study){
 const digest=await studyHash(study);
 if(study.study_hash!==digest)throw Error("Study settings differ from the registered SHA-256 hash");
 return study;
}
export function studyWitnessLine(study){
 canonicalStudy(study);
 if(!isHex(study.study_hash,64))throw Error("Invalid study hash");
 return "FB21-F04-STUDY/v1 id="+study.study_id+" hash="+study.study_hash+
   " seats="+study.cohort_size+" first="+study.first_round+
   " closes="+Math.floor(enrollmentClosesMs(study)/1000);
}
export async function createStudy({cohortSize=DEFAULT_SIZE,nowMs=Date.now(),randomProvider=globalThis.crypto}={}){
 if(!Number.isSafeInteger(cohortSize)||cohortSize<SIZE_MIN||cohortSize>SIZE_MAX)
   throw Error("Choose between 2 and 24 registered participants");
 if(!randomProvider||typeof randomProvider.getRandomValues!=="function"||!globalThis.crypto?.subtle)
   throw Error("Secure browser randomness is required");
 const id=new Uint8Array(16);
 randomProvider.getRandomValues(id);
 const study={schema:F04,chain_hash:CHAIN_HASH,study_id:toHex(id),cohort_size:cohortSize,
   first_round:nextFutureRound(nowMs,STUDY_LEAD_SECONDS),blocks:BLOCKS,
   round_spacing:ROUND_SPACING,analysis:ANALYSIS,alpha:ALPHA};
 study.study_hash=await studyHash(study);
 return study;
}
export function joinWitnessLine(study,registration){
 canonicalStudy(study);
 if(!isHex(study.study_hash,64)||!isHex(registration?.registration_hash,64)||!isHex(registration?.campaign_id,32))
   throw Error("Invalid study or campaign ID");
 if(registration.blocks?.[0]?.round!==study.first_round)
   throw Error("Campaign must use the study's fixed future rounds");
 return "FB21-F04-JOIN/v1 study="+study.study_id+" hash="+study.study_hash+
   " campaign="+registration.campaign_id+" commitment="+registration.registration_hash;
}
export async function createParticipantCampaign(study,predictions,{nowMs=Date.now(),randomProvider=globalThis.crypto}={}){
 await validateStudy(study);
 if(nowMs>=enrollmentClosesMs(study))throw Error("Enrollment has already closed");
 const campaign=await createCampaign(predictions,{nowMs,randomProvider,firstRound:study.first_round});
 await validateRegistration(campaign.registration);
 return {campaign,public_comment:[publicWitnessLine(campaign.registration),joinWitnessLine(study,campaign.registration)].join("\n")};
}
