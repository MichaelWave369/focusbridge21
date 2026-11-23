/* Exact null distribution with shared target slots grouped across participants.
 * Conditional on FIXED predictions: each distinct (round,trial-index) target
 * contributes one uniform 4-choice draw, regardless of participant count.
 */
import {BLOCKS} from "../f03/registry.mjs";
import {TRIALS,CHOICES} from "../f02/protocol.mjs";
export const TRIALS_PER_PERSON=BLOCKS*TRIALS;
const validPred=x=>Number.isInteger(x)&&x>=0&&x<CHOICES;
export function exactSharedTargetTest(participants){
 if(!Array.isArray(participants)||!participants.length||participants.length>24)
   throw Error("Expected 1-24 independently authenticated participant records");
 const groups=new Map(),participantIds=new Set();
 for(const p of participants){
   if(!p||typeof p.campaign_id!=="string"||participantIds.has(p.campaign_id)||
      !Array.isArray(p.blocks)||p.blocks.length!==BLOCKS)
     throw Error("Duplicate participant or missing blocks");
   participantIds.add(p.campaign_id);
   for(let bi=0;bi<BLOCKS;bi++){
     const b=p.blocks[bi];
     if(!b||b.status!=="verified"||b.bls_verified!==true||b.index!==bi||
        !Number.isSafeInteger(b.round)||b.round<1||
        !Array.isArray(b.predictions)||!Array.isArray(b.targets)||
        b.predictions.length!==TRIALS||b.targets.length!==TRIALS)
       throw Error("Every participant block must be independently verified");
     for(let j=0;j<TRIALS;j++){
       if(!validPred(b.predictions[j])||!validPred(b.targets[j]))throw Error("Invalid prediction/target");
       const k=b.round+":"+j;
       if(!groups.has(k))groups.set(k,{round:b.round,index:j,target:b.targets[j],counts:[0,0,0,0],participantCount:0});
       const slot=groups.get(k);
       if(slot.target!==b.targets[j])throw Error("Shared beacon round has inconsistent targets");
       slot.counts[b.predictions[j]]++;
       slot.participantCount++;
     }
   }
 }
 const sampleCount=participants.length;
 if(groups.size<TRIALS_PER_PERSON)throw Error("Missing distinct target positions");
 const observed=[...groups.values()].reduce((sum,g)=>sum+g.counts[g.target],0);
 const total=sampleCount*TRIALS_PER_PERSON;
 // In the fixed-round cohort design all participants use the same 80 slots.
 if(groups.size!==TRIALS_PER_PERSON||[...groups.values()].some(g=>g.participantCount!==sampleCount))
   throw Error("All participants must use the same preregistered target rounds");
 let probabilities=new Float64Array(total+1);probabilities[0]=1;
 let processed=0;
 for(const group of groups.values()){
   const next=new Float64Array(total+1);
   for(let hits=0;hits<=processed;hits++){
     const mass=probabilities[hits];if(mass===0)continue;
     for(const count of group.counts)next[hits+count]+=mass/CHOICES;
   }
   probabilities=next;processed+=sampleCount;
 }
 let tail=0;for(let i=observed;i<=total;i++)tail+=probabilities[i];
 const chance=Math.min(1,Math.max(0,tail));
 return {method:"exact-shared-target-randomization-v1",participants:sampleCount,
   distinct_beacon_target_cells:groups.size,total_predictions:total,
   observed_hits:observed,expected_hits:total/CHOICES,
   observed_rate:observed/total,one_sided_null_tail:chance,
   note:"Exact for uniformly random independent target cells conditional on preregistered fixed predictions. HMAC-derived slots share beacon entropy; independence is a cryptographic pseudorandomness assumption. This is not a causal proof."};
}
