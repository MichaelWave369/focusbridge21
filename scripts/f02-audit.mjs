#!/usr/bin/env node
/* Public-record audit only: TLS relay agreement + GitHub timestamps, no local BLS. */
import {readFile} from "node:fs/promises";
import {validatePlan,scheduledTime,witnessText,auditOnline} from "../docs/f02/protocol.mjs";
async function run(argv){
 if(argv.length<1||argv.length>2)throw Error('Usage: node scripts/f02-audit.mjs sealed.json ["https://github.com/owner/repo/issues/N#issuecomment-ID"]');
 const sealed=JSON.parse(await readFile(argv[0],"utf8"));
 await validatePlan(sealed);
 const output={schema:sealed.schema,round:sealed.beacon_round,
    commitment:sealed.commitment,witness_line:witnessText(sealed),
    scheduled_utc:new Date(scheduledTime(sealed.beacon_round)).toISOString()};
 if(argv.length===1){
   output.result="LOCAL HASH MATCH ONLY: no independent witness or beacon has been checked";
 }else{
   const audit=await auditOnline(sealed,argv[1]);
   Object.assign(output,{result:"PUBLIC RECORDS CROSS-CHECKED (NOT BLS VERIFIED)",audit});
 }
 process.stdout.write(JSON.stringify(output,null,2)+"\n");
}
run(process.argv.slice(2)).catch(e=>{process.stderr.write("F02 audit failed: "+e.message+"\n");process.exitCode=1;});