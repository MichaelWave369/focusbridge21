#!/usr/bin/env node
/* Read-only registry health; no participant credentials or private files. */
import {readFile} from "node:fs/promises";
import {fetchCohortRoster} from "../docs/f04/roster.mjs";
async function run([studyPath,issue]){
 if(!studyPath||!issue)
  throw Error('Usage: node scripts/f04-roster.mjs public-study.json "https://github.com/owner/repo/issues/123"');
 const study=JSON.parse(await readFile(studyPath,"utf8"));
 const result=await fetchCohortRoster(study,issue);
 process.stdout.write(JSON.stringify(result,null,2)+"\n");
 if(result.missing_enrollment>0)process.exitCode=2;
}
run(process.argv.slice(2)).catch(error=>{console.error("F04 roster failed: "+error.message);process.exitCode=1;});
