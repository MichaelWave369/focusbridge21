#!/usr/bin/env node
/* Read-only index of all F03 preregistrations on a designated public issue. */
import {readFile} from "node:fs/promises";
import {registryCoverage} from "../docs/f03/registry-index.mjs";
async function run([issue,...reports]){
 if(!issue)throw Error('Usage: node scripts/f03-registry.mjs "https://github.com/owner/repo/issues/123" [audit-report.json ...]');
 const entries=[];
 for(const path of reports)entries.push(JSON.parse(await readFile(path,"utf8")));
 const result=await registryCoverage(issue,entries);
 process.stdout.write(JSON.stringify(result,null,2)+"\n");
 if(result.registered_but_unreported||result.invalid_or_duplicate||result.unrecognized_reports.length)
   process.exitCode=2;
}
run(process.argv.slice(2)).catch(e=>{console.error("F03 registry failed: "+e.message);process.exitCode=1;});
