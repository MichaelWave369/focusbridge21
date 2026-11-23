#!/usr/bin/env node
/* Full multi-participant audit: NEVER trust uploaded result JSON for scoring.
 * Re-fetch the public witness and beacon and verify signatures for each private file.
 */
import {readFile} from "node:fs/promises";
import {resolve,dirname,join} from "node:path";
import {auditCohort} from "../docs/f04/analysis.mjs";
import {verifyQuicknetSignature} from "./f03-bls.mjs";
async function run([studyPath,issue,manifestPath]){
 if(!studyPath||!issue||!manifestPath)
  throw Error('Usage: node scripts/f04-audit.mjs public-study.json "https://github.com/owner/repo/issues/123" manifest.json');
 const study=JSON.parse(await readFile(studyPath,"utf8"));
 const manifest=JSON.parse(await readFile(manifestPath,"utf8"));
 if(!Array.isArray(manifest.files)||manifest.files.some(x=>typeof x!=="string"||!x||x.length>4096))
  throw Error("Manifest must contain a files array of private campaign paths");
 const base=dirname(resolve(manifestPath));
 const files=[];
 for(const name of manifest.files)files.push(JSON.parse(await readFile(join(base,name),"utf8")));
 const result=await auditCohort(study,issue,files,{verifySignature:verifyQuicknetSignature});
 process.stdout.write(JSON.stringify(result,null,2)+"\n");
 if(result.status!=="complete")process.exitCode=2;
}
run(process.argv.slice(2)).catch(error=>{console.error("F04 audit failed: "+error.message);process.exitCode=1;});
