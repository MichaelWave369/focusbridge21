#!/usr/bin/env node
/* F04 participant makes a private F03 campaign against the study's FIXED rounds. */
import {readFile,writeFile} from "node:fs/promises";
import {createParticipantCampaign} from "../docs/f04/protocol.mjs";
async function run([studyPath,guessesPath,out]){
 if(!studyPath||!guessesPath||!out)
  throw Error("Usage: node scripts/f04-join.mjs public-study.json predictions.json private-campaign.json");
 const study=JSON.parse(await readFile(studyPath,"utf8"));
 const input=JSON.parse(await readFile(guessesPath,"utf8"));
 const predictions=Array.isArray(input)?input:input.blocks;
 const created=await createParticipantCampaign(study,predictions);
 await writeFile(out,JSON.stringify(created.campaign,null,2)+"\n",{flag:"wx",mode:0o600});
 console.log("PRIVATE campaign file: "+out);
 console.log("Post BOTH lines in ONE comment on the study's public issue before enrollment closes:");
 console.log(created.public_comment);
 console.log("Never post the private JSON before all future rounds have elapsed.");
}
run(process.argv.slice(2)).catch(error=>{console.error("F04 enrollment failed: "+error.message);process.exitCode=1;});
