/* FocusBridge21 original Gateway evidence and probability lab; no proprietary audio. */
(() => {
"use strict";
const TRIAL_COUNT=20;
const TARGETS=Object.freeze(["Circle","Triangle","Square","Star"]);
const SOURCES=Object.freeze({
  memo:{label:"1983 US Army Gateway assessment",url:"https://www.govinfo.gov/app/details/GOVPUB-D101-PURL-gpo152943"},
  binaural:{label:"2023 PLOS ONE systematic review",url:"https://doi.org/10.1371/journal.pone.0286023"},
  obe:{label:"Blanke et al., Nature 2002",url:"https://doi.org/10.1038/419269a"},
  stargate:{label:"1995 AIR STARGATE evaluation",url:"https://irp.fas.org/program/collect/air1995.pdf"}
});
const TOPICS=Object.freeze([
 {name:"Origins of the 1983 report",kind:"Historical record",source:"memo",claim:"The Gateway Experience was assessed for intelligence applications.",evidence:"A US Army report was written in 1983 and later appeared in declassified CIA holdings.",limit:"A government investigation does not prove that the unusual claims succeeded."},
 {name:"Monroe and Focus levels",kind:"Practice model",source:"memo",claim:"Focus 10, 12, 15 and 21 describe progressively unusual awareness states.",evidence:"Gateway taught relaxation and guided attention, with named subjective stages.",limit:"Focus labels are not measured dimensions, ranks or certifications."},
 {name:"Binaural beats",kind:"Scientific test",source:"binaural",claim:"Stereo tones with offset frequencies might entrain brain activity.",evidence:"Binaural beat perception is real. A 2023 review of 14 EEG studies found inconsistent entrainment results.",limit:"Perceiving a beat does not show that the whole brain oscillates at that rate."},
 {name:"Body resonance and 7 Hz",kind:"Proposed mechanism",source:"memo",claim:"Physiological rhythms might resonate with Earth electromagnetic activity.",evidence:"Earth has measurable Schumann resonances, with a fundamental around 7.8 Hz.",limit:"Similar frequencies do not establish physical coupling, universal information access or telepathy."},
 {name:"Out-of-body perception",kind:"Neuroscience",source:"obe",claim:"Awareness can seem to occupy a point outside the physical body.",evidence:"Changes in bodily self-location can arise through brain stimulation and multisensory processes.",limit:"The experience does not establish that consciousness literally left the body."},
 {name:"Holographic universe and the Absolute",kind:"Speculation",source:"memo",claim:"Consciousness might access a universal informational order beyond ordinary time.",evidence:"The memorandum combines ideas associated with Bentov, Bohm and Pribram.",limit:"This proposed bridge is not an experimentally validated mechanism."},
 {name:"Focus 15 / 21 and time",kind:"Extraordinary claim",source:"memo",claim:"Observers might retrieve descriptions of a target from the past or future.",evidence:"Time perception can change during meditation, dreams and other states.",limit:"There is no reliable demonstration of literal future information access."},
 {name:"Remote viewing and STARGATE",kind:"Historical evaluation",source:"stargate",claim:"Related government projects investigated extrasensory information gathering.",evidence:"The 1995 evaluation examined research and operational utility.",limit:"Useful operational remote viewing was not demonstrated; STARGATE and Gateway were not identical."}
].map(Object.freeze));
const esc=x=>String(x==null?"":x).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const randomAvailable=x=>!!(x&&typeof x.getRandomValues==="function");
function drawTarget(cryptoSource) {
 if(!randomAvailable(cryptoSource)) return null;
 const bytes=new Uint32Array(1);
 try { cryptoSource.getRandomValues(bytes); } catch { return null; }
 // 2^32 is divisible by four: modulo is unbiased for this four-symbol test.
 return bytes[0]%TARGETS.length;
}
const newBlock=()=>({status:"active",rounds:[],outcome:null,error:"",saved:false});
function scoreBlock(rows){
 if(!Array.isArray(rows)||rows.length!==TRIAL_COUNT||!rows.every(r=>r&&Number.isInteger(r.guess)&&Number.isInteger(r.target)&&r.guess>=0&&r.guess<4&&r.target>=0&&r.target<4))return null;
 const hits=rows.filter(r=>r.guess===r.target).length;
 let mass=Math.pow(.75,TRIAL_COUNT),tail=0;
 for(let k=0;k<=TRIAL_COUNT;k++){
  if(k>=hits)tail+=mass;
  if(k<TRIAL_COUNT)mass=mass*(TRIAL_COUNT-k)/(k+1)/3;
 }
 return Object.freeze({hits,trials:TRIAL_COUNT,expected:TRIAL_COUNT/4,chance:.25,oneSidedTail:Math.min(1,tail)});
}
function recordPrediction(block,choice,cryptoSource){
 if(!block||block.status!=="active"||!Array.isArray(block.rounds)||block.rounds.length>=TRIAL_COUNT)return block;
 if(!/^[0-3]$/.test(String(choice)))return block;
 const guess=Number(choice);
 // The chosen prediction is placed in the next immutable array before RNG.
 // Browser-side ordering is not independently verifiable.
 const locked=[...block.rounds,{guess}];
 const target=drawTarget(cryptoSource);
 if(target===null)return {status:"error",rounds:[],outcome:null,saved:false,error:"Secure randomness failed. Incomplete block discarded."};
 const rounds=[...locked.slice(0,-1),{guess,target}];
 const complete=rounds.length===TRIAL_COUNT;
 return {status:complete?"complete":"active",rounds,outcome:complete?scoreBlock(rounds):null,error:"",saved:false};
}
function render(block,cryptoReady){
 const b=block||{status:"ready",rounds:[],outcome:null,error:"",saved:false};
 const topics=TOPICS.map(t=>{const src=SOURCES[t.source];return [
 '<details class="gw-topic"><summary><small>',esc(t.kind),'</small><strong>',esc(t.name),'</strong></summary>',
 '<div><p><b>Claim:</b> ',esc(t.claim),'</p><p><b>Evidence:</b> ',esc(t.evidence),
 '</p><p><b>Boundary:</b> ',esc(t.limit),'</p><a target="_blank" rel="noopener noreferrer" href="',
 esc(src.url),'">',esc(src.label),' ↗</a></div></details>'
 ].join("");}).join("");
 const guesses=TARGETS.map((x,i)=>'<button class="q-duration" type="button" data-action="gw-guess" data-target-index="'+i+'">'+esc(x)+'</button>').join("");
 const results=b.status==="complete"?b.rounds.map((r,i)=>'<li><strong>Trial '+(i+1)+' · '+(r.guess===r.target?'Match':'No match')+'</strong><span>Prediction: '+esc(TARGETS[r.guess])+' · Later target: '+esc(TARGETS[r.target])+'</span></li>').join(""):"";
 return [
 '<button type="button" class="q-back" data-action="home">← Back to Quiet Deck</button>',
 '<div class="q-eyebrow">GATEWAY RESEARCH · ORIGINAL EVIDENCE ATLAS</div>',
 '<h1>Gateway <em>Evidence Atlas.</em></h1>',
 '<p class="q-lead">Follow the 1983 Army assessment, modern neuroscience, and what is still speculative. Independent research, not Monroe Institute or proprietary Hemi-Sync content.</p>',
 '<section class="gw-intro"><b>Keep the categories separate:</b> documented historical claim, tested observation, and extraordinary inference. An official document does not itself certify the conclusion.</section>',
 '<div class="gw-topics">',topics,'</div>',
 '<section class="q-panel gw-lab"><div class="q-eyebrow">F01 · EXPERIMENTAL PROBABILITY LAB</div>',
 '<h2>Future-Target Lab</h2>',
 '<p>This differs from the existing Blind Target Lab: here your prediction is locked before the random target is drawn. This is a browser-only demonstration, not a test of physical time travel.</p>',
 '<p class="q-detail">20 trials · four symbols · 25% chance baseline · no feedback until all 20 predictions finish. No meditation or audio required.</p>',
 b.status==="ready"||b.status==="error"?'<button type="button" class="q-primary" data-action="gw-begin" '+(cryptoReady?'':'disabled')+'>Begin 20 predictions</button>':"",
 b.status==="active"?'<div class="q-setup-step">PREDICTION '+(b.rounds.length+1)+' / 20</div><p>Which symbol will be drawn after you choose? Your selection locks immediately.</p><div class="q-durations q-target-choices">'+guesses+'</div><p class="q-detail">Targets and score remain hidden until the final trial. Leaving discards an unfinished block.</p>':"",
 b.status==="complete"&&b.outcome?'<h3>'+b.outcome.hits+' / 20 matches</h3><p>Chance expectation: 5 matches. One-sided binomial tail under chance: '+(b.outcome.oneSidedTail*100).toFixed(2)+'%. This is descriptive only, not a preregistered scientific significance result.</p><p class="q-detail">'+(b.saved?'Complete raw results saved in the local Signal Ledger.':'No receipt confirmed in local storage.')+'</p><ol class="q-sync-stage-list">'+results+'</ol><button type="button" class="q-secondary" data-action="gw-begin" '+(cryptoReady?'':'disabled')+'>Run another block</button>':"",
 b.error?'<p role="alert" class="q-error">'+esc(b.error)+'</p>':"",
 !cryptoReady?'<p role="alert" class="q-detail">Secure browser randomness is unavailable; no fallback will be used.</p>':"",
 '<p class="q-detail">Browser code and storage can be edited. This is not independently blinded, timestamped, audited or proof of precognition. The app uses no microphone, camera, hidden sensor, or private location.</p></section>',
 '<section class="gw-intro"><h2>Next research threshold</h2><p>Pre-register a larger study; record every attempt; commit predictions with an independent timestamp before an external random draw; blind the analyst; control repeated testing; replicate across researchers.</p><p>For voluntary meditation, prioritize comfort, grounded return, and no sleep deprivation or forced breathing. Stop if distressed or disoriented.</p></section>'
 ].join("");
}
window.FocusBridgeGatewayResearch=Object.freeze({TRIAL_COUNT,TARGETS,SOURCES,TOPICS,randomAvailable,drawTarget,newBlock,scoreBlock,recordPrediction,render});
})();
