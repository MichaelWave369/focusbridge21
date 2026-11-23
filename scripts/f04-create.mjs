#!/usr/bin/env node
/* F04 coordinator creates an immutable PUBLIC study spec, not participant data. */
import {writeFile} from "node:fs/promises";
import {createStudy,studyWitnessLine,enrollmentClosesMs} from "../docs/f04/protocol.mjs";
import {scheduledTime} from "../docs/f02/protocol.mjs";
async function run([size,path]){
 if(!size||!path||!(/^\d+$/.test(size)))
  throw Error("Usage: node scripts/f04-create.mjs 8 public-study.json");
 const study=await createStudy({cohortSize:Number(size)});
 await writeFile(path,JSON.stringify(study,null,2)+"\n",{flag:"wx",mode:0o600});
 console.log("Public study JSON written: "+path);
 console.log("First beacon round: "+new Date(scheduledTime(study.first_round)).toISOString());
 console.log("Enrollment deadline: "+new Date(enrollmentClosesMs(study)).toISOString());
 console.log("Post this exact organizer line on a dedicated PUBLIC GitHub issue before enrollment:");
 console.log(studyWitnessLine(study));
 console.log("Share the public study JSON only after the public master line is posted.");
}
run(process.argv.slice(2)).catch(error=>{console.error("F04 study setup failed: "+error.message);process.exitCode=1;});
