/* Human Code 12: original, optional self-reflection curriculum for FocusBridge21.
   Separate from Monroe focus numbers and from existing session/Signal Ledger data. */
(() => {
  "use strict";
  const KEY = "focusbridge21-human-code12-v1";
  const MAX_NOTE = 1600;
  const LEVELS = Object.freeze([
    {number:1, name:"The Vessel", phase:"Foundation", objective:"Notice your body and establish an ordinary sense of safety.", practice:"Sit or stand comfortably. Look around and name five ordinary things you can see. Notice where your body is supported. You can stop at any time.", reflection:"What helps me feel present, steady, and physically comfortable?", action:"Choose one realistic body-care habit to try today."},
    {number:2, name:"The Breath", phase:"Foundation", objective:"Learn to notice feelings and physiological cues without forcing them to change.", practice:"Observe your natural breathing for a short period. Relax your shoulders if comfortable. There is no required rhythm, counting, or breath-holding.", reflection:"Which situations shift my breath, energy, or emotional state?", action:"Make a simple plan for taking a comfortable pause when overwhelmed."},
    {number:3, name:"The Quiet Mind", phase:"Foundation", objective:"Practice noticing distraction and returning attention without judgment.", practice:"Choose a simple anchor: room sounds, your hands, or an ordinary object. When your attention wanders, gently return.", reflection:"How do I recognize a thought without needing to follow it?", action:"Try the existing Quiet Mind Meditation in FocusBridge21."},
    {number:4, name:"The Observer", phase:"Awareness", objective:"Distinguish thoughts, interpretations, and observations.", practice:"Recall a harmless recent event. Write one direct observation, one interpretation, and one alternative explanation.", reflection:"When have I mistaken my first interpretation for a fact?", action:"During one conversation, pause to check an assumption before responding."},
    {number:5, name:"The Inner Theater", phase:"Awareness", objective:"Explore imagination as a tool for creativity and planning.", practice:"Picture a familiar safe place, or describe it in words if visualizing is difficult. Notice its details while knowing you are imagining.", reflection:"How can imagination help me rehearse a useful choice?", action:"Sketch or describe one small idea that could become a real project."},
    {number:6, name:"The Architect", phase:"Awareness", objective:"Connect intention to a specific action you can actually take.", practice:"Choose a modest goal. Imagine taking the first step, anticipate one obstacle, and write an if-then plan to address it.", reflection:"Which part of this goal depends on my actions, and which does not?", action:"Take one small observable step. Optionally write a reflection in Intention Studio."},
    {number:7, name:"The Mirror", phase:"Connection", objective:"Explore how relationships reveal habits and blind spots.", practice:"Think of a low-stakes disagreement. Describe your view and what the other person might reasonably have experienced.", reflection:"What feedback do I receive repeatedly, and how might I examine it?", action:"Ask a trusted person for one specific piece of constructive feedback, if comfortable."},
    {number:8, name:"The Heart", phase:"Connection", objective:"Strengthen empathy without abandoning boundaries.", practice:"Consider someone facing an ordinary difficulty. Write what they may need and what you can realistically offer, without making assumptions.", reflection:"How can I express care while honoring my own needs and theirs?", action:"Make a small, welcome act of kindness."},
    {number:9, name:"The Bridge", phase:"Connection", objective:"Practice listening, clarity, consent, and mutual understanding.", practice:"Practice explaining an idea in two sentences. Then formulate an open question that could help you understand another perspective.", reflection:"What changes when I listen to understand rather than to reply?", action:"Have one conversation where you summarize the other person's view before offering your own."},
    {number:10, name:"The Weave", phase:"Integration", objective:"Learn how shared knowledge and collaboration can improve outcomes.", practice:"Choose a community problem. Identify the people involved, what each may know, and how decisions could include them.", reflection:"What can a group accomplish that an individual cannot do alone?", action:"Invite someone to contribute an idea to a small cooperative effort."},
    {number:11, name:"The Steward", phase:"Integration", objective:"Turn values into responsibility and practical contribution.", practice:"Name a value you care about. List one way your choices support it, one trade-off, and one way to verify impact.", reflection:"How can I help without controlling other people's choices?", action:"Do one sustainable act of service or care, with the recipients' preferences in mind."},
    {number:12, name:"The Whole", phase:"Integration", objective:"Combine useful practices into a flexible personal philosophy.", practice:"Review your notes from earlier levels. Notice what helped, what didn't, and what you still don't know. Make room for rest and revision.", reflection:"Which ideas will I keep, challenge, or revise as I continue learning?", action:"Write a short, revisable personal practice charter. Start another cycle whenever you wish."}
  ]);
  const escapeHtml = (value) => String(value == null ? "" : value).replace(/[&<>"']/g,
    (ch) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const empty = () => ({entries:{}});
  const validNumber = (value) => {
    const number = Number(value);
    return Number.isInteger(number) && number >= 1 && number <= 12 ? number : null;
  };
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      const entries = {};
      if (raw && typeof raw === "object" && !Array.isArray(raw) &&
          raw.entries && typeof raw.entries === "object" && !Array.isArray(raw.entries)) {
        for (let i=1; i<=12; i++) {
          const old = raw.entries[i];
          if (!old || typeof old !== "object" || Array.isArray(old)) continue;
          entries[i] = {
            note: typeof old.note === "string" ? old.note.slice(0, MAX_NOTE) : "",
            explored: old.explored === true,
            updated: typeof old.updated === "string" ? old.updated.slice(0, 35) : ""
          };
        }
      }
      return {entries};
    } catch { return empty(); }
  }
  let data = load();
  let selected = 1;
  let notice = "";
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      notice = "Saved on this device. This is a personal reflection, not a certification.";
      return true;
    } catch {
      notice = "Browser storage is unavailable. Your current changes may disappear when you leave.";
      return false;
    }
  }
  function select(value) {
    const n = validNumber(value);
    if (n === null) return false;
    selected = n;
    notice = "";
    return true;
  }
  function entry(n = selected) { return data.entries[n] || {note:"", explored:false, updated:""}; }
  function updateNote(value) {
    const before = entry();
    data.entries[selected] = {...before, note:String(value == null ? "" : value).slice(0, MAX_NOTE)};
    return save();
  }
  function toggleExplored() {
    const before = entry();
    data.entries[selected] = {...before, explored:!before.explored, updated:new Date().toISOString()};
    return save();
  }
  function progress() {
    return LEVELS.filter((level) => entry(level.number).explored).length;
  }
  function reset(confirmReset) {
    if (confirmReset !== true) return false;
    data = empty(); selected = 1;
    try { localStorage.removeItem(KEY); notice = "Only Human Code 12 notes and progress were cleared."; }
    catch { notice = "Could not clear stored notes in this browser."; }
    return true;
  }
  function snapshot() {
    return {format:"focusbridge21-human-code12", version:1,
      exportedAt:new Date().toISOString(), entries:JSON.parse(JSON.stringify(data.entries))};
  }
  function exportFile() {
    if (typeof document === "undefined" || typeof Blob === "undefined" ||
        typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return false;
    const blob = new Blob([JSON.stringify(snapshot(), null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    try {
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = "focusbridge21-human-code12.json";
      anchor.style.display = "none";
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      notice = "JSON export prepared. Your notes were not uploaded.";
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    return true;
  }
  function view() {
    const selectedLevel = LEVELS[selected - 1];
    const completed = progress();
    const thisEntry = entry();
    return [
      '<button type="button" class="q-back" data-action="home">← Back to Quiet Deck</button>',
      '<div class="q-eyebrow">AN ORIGINAL TWELVE-LEVEL PRACTICE ATLAS</div>',
      '<h1>Human Code <em>12.</em></h1>',
      '<p class="q-lead">Explore attention, imagination, relationships, and practical contribution. Every level is optional, revisitable, and self-paced. No belief system, supernatural ability, or special brain state is required.</p>',
      '<section class="hc-note" aria-label="About this framework"><strong>Different from Focus 12:</strong> Human Code level numbers describe an original learning curriculum. Monroe/Gateway focus numbers refer to a different subjective practice framework. Neither numbering system is a medical diagnosis or a certification.</section>',
      '<section class="hc-summary" aria-label="Human Code progress"><div><strong>',completed,' / 12</strong><span>Levels marked explored · self-reported</span></div>',
      '<div class="hc-progress" role="progressbar" aria-label="Levels marked explored" aria-valuemin="0" aria-valuemax="12" aria-valuenow="',completed,'"><div style="width:',Math.round(completed / 12 * 100),'%"></div></div>',
      '<p class="q-detail">Milestones at 3, 6, 9 and 12. These are learning checkpoints, not ranks, tests, or locked gates.</p></section>',
      '<div class="hc-layout"><section class="hc-grid" aria-label="Choose one of the twelve levels">',
      LEVELS.map((l) => '<button type="button" class="hc-level" data-action="hc-select" data-level="' + l.number +
        '" aria-pressed="' + (selected === l.number) + '"><small>LEVEL ' + String(l.number).padStart(2,"0") +
        ' · ' + escapeHtml(l.phase.toUpperCase()) + '</small><strong>' + escapeHtml(l.name) +
        '</strong><span>' + (entry(l.number).explored ? '✓ Explored' : 'Open to explore') + '</span></button>').join(""),
      '</section><section class="hc-detail" aria-labelledby="hc-level-title"><span class="hc-kicker">LEVEL ',
      String(selected).padStart(2,"0"), ' / 12 · ',escapeHtml(selectedLevel.phase.toUpperCase()),'</span>',
      '<h2 id="hc-level-title">',escapeHtml(selectedLevel.name),'</h2>',
      '<p>',escapeHtml(selectedLevel.objective),'</p>',
      '<h3>Practice</h3><p>',escapeHtml(selectedLevel.practice),'</p>',
      '<h3>Reflection</h3><p>',escapeHtml(selectedLevel.reflection),'</p>',
      '<h3>One real-world step</h3><p>',escapeHtml(selectedLevel.action),'</p>',
      '<label for="hc-reflection">Private journal · optional · up to ',MAX_NOTE,' characters</label>',
      '<textarea id="hc-reflection" rows="5" maxlength="',MAX_NOTE,
      '" placeholder="What did you notice, learn, or want to try next?">',
      escapeHtml(thisEntry.note),'</textarea>',
      '<div class="hc-actions"><button type="button" class="q-primary" data-action="hc-mark">',
      thisEntry.explored ? 'Unmark explored' : 'Mark explored (self-reported)','</button>',
      '<button type="button" class="q-secondary" data-action="hc-qmm">Open Quiet Mind practice</button>',
      '<button type="button" class="q-secondary" data-action="hc-intention">Open Intention Studio</button></div>',
      '<p class="q-detail">Notes are kept only in this browser and are separate from the Signal Ledger. Existing sound and practice sessions have their own safety checks and Return Now controls.</p>',
      '</section></div>',
      '<section class="hc-footer"><h2>Your data belongs to you</h2><p>Export this curriculum journal as JSON or clear only Human Code 12 data. Browser storage is not encrypted. Never use this journal as a substitute for professional care.</p>',
      '<div class="hc-actions"><button type="button" class="q-secondary" data-action="hc-export">Export JSON</button>',
      '<button type="button" class="q-secondary" data-action="hc-reset">Clear Human Code notes</button></div>',
      notice ? '<p class="q-detail" role="status">' + escapeHtml(notice) + '</p>' : '',
      '<p class="q-detail">Level 12 ends with integration and can begin a new cycle. “Source” or unity may be personally meaningful metaphors, not required beliefs or scientifically established outcomes.</p></section>'
    ].join("");
  }
  window.FocusBridgeHumanCode12 = Object.freeze({
    LEVELS, KEY, MAX_NOTE, view, select, updateNote, toggleExplored, progress, reset, snapshot, exportFile,
    current:() => selected
  });
})();
