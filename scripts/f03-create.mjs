#!/usr/bin/env node
/* Read four user-authored prediction lists. Never upload the private output. */
import {readFile,writeFile} from "node:fs/promises";
import {createCampaign,publicWitnessLine} from "../docs/f03/registry.mjs";
async function run([input,output]){
 if(!input||!output)throw Error("Usage: node scripts/f03-create.mjs predictions.json private-campaign.json");
 const raw=JSON.parse(await readFile(input,"utf8"));
 const blocks=Array.isArray(raw)?raw:raw.blocks;
 const sealed=await createCampaign(blocks);
 await writeFile(output,JSON.stringify(sealed,null,2)+"\n",{flag:"wx",mode:0o600});
 console.log("Created private campaign file: "+output);
 console.log("First round scheduled: "+new Date(1692803367000+(sealed.registration.blocks[0].round-1)*3000).toISOString());
 console.log("Register this public witness line BEFORE the first round minus 30 seconds:");
 console.log(publicWitnessLine(sealed.registration));
 console.log("Do not publish the private file or edit the witness comment.");
}
run(process.argv.slice(2)).catch(e=>{console.error("F03 create failed: "+e.message);process.exitCode=1;});
