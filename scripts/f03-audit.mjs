#!/usr/bin/env node
/* Four-block F03 audit: only successful BLS-authenticated blocks count as verified.
 * Redirect stdout to an independently shareable report after all target rounds.
 */
import {readFile} from "node:fs/promises";
import {auditCampaign} from "../docs/f03/registry.mjs";
import {verifyQuicknetSignature} from "./f03-bls.mjs";
async function run([file,witnessUrl]){
 if(!file||!witnessUrl)throw Error('Usage: node scripts/f03-audit.mjs private-campaign.json "https://github.com/owner/repo/issues/N#issuecomment-ID"');
 const sealed=JSON.parse(await readFile(file,"utf8"));
 const result=await auditCampaign(sealed,witnessUrl,{verifySignature:verifyQuicknetSignature});
 process.stdout.write(JSON.stringify(result,null,2)+"\n");
 if(!result.summary.complete)process.exitCode=2;
}
run(process.argv.slice(2)).catch(e=>{console.error("F03 audit failed: "+e.message);process.exitCode=1;});
