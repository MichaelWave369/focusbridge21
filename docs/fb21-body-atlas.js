/* FocusBridge21 Chapter 4 source-critical Human Body Atlas
 * From the user-provided PDF The Book of Knowledge (Anonymous), pp. 6-13.
 * Original summaries, not verbatim excerpts. Claims and anatomy are separately
 * labeled; chakra-to-disease causal claims are unsubstantiated and not advice.
 */
(() => {
  "use strict";
  const RECORDS = Object.freeze([
    {id:"root", group:"major", name:"Root / Base Chakra", page:6, position:"Tailbone",
      described:"Physical vitality, groundedness, and manifestation. The book links 'balanced' energy with feeling centered and confident.",
      health:"The author additionally links imbalance with addiction, cancer, heart disease and infections including HIV/AIDS. These causal links are not medically established.",
      anatomy:"The coccyx (tailbone) and surrounding pelvis are real structures; no discrete chakra organ has been established there."},
    {id:"sacral", group:"major", name:"Sacral Chakra", page:7, position:"One to two inches below the navel, slightly left, according to the book",
      described:"Friendliness, creativity, emotion, sexuality, and gut-level intuition. The author associates this center with childhood emotional expression.",
      health:"The book attaches personality traits and sexual difficulties to the alleged balance of this center; these are interpretations rather than diagnostic criteria.",
      anatomy:"The lower abdomen and pelvis contain ordinary reproductive, urinary and digestive structures; the described chakra is not a documented organ."},
    {id:"solar", group:"major", name:"Solar Plexus Chakra", page:7, position:"Belly / upper abdomen",
      described:"Personal power, confidence, fulfillment and childhood interests. The book attributes enthusiasm and self-respect to balance.",
      health:"The author attributes depression, diabetes, gallstones, liver damage and digestive conditions to imbalance; that causal explanation is unsupported.",
      anatomy:"The abdomen contains documented digestive organs and autonomic nerves, including a celiac nerve plexus. They do not demonstrate a chakra energy center."},
    {id:"heart", group:"major", name:"Heart Chakra", page:7, position:"Center of chest",
      described:"Compassion, care for others, connection, love, and humanitarian motivation.",
      health:"The author links heart attacks, high blood pressure and cancer to chakra imbalance. Medical conditions have physiological causes and require medical evaluation.",
      anatomy:"The heart, lungs, ribs and sternum occupy the chest; none is equivalent to a medically demonstrated chakra."},
    {id:"throat", group:"major", name:"Throat Chakra", page:8, position:"Throat",
      described:"Communication, self-expression, speaking about feelings, and artistic expression.",
      health:"The text attributes speech difficulties and immune problems to imbalance, an unverified causal explanation.",
      anatomy:"The throat contains the larynx, pharynx and thyroid region; the larynx supports speech through actual anatomy."},
    {id:"third-eye", group:"major", name:"Third Eye Chakra", page:8, position:"Forehead / mind's eye (no precise physical coordinate provided)",
      described:"The author describes psychic power, intuition, telepathy, channeling and astral travel.",
      health:"The book associates schizophrenia with 'deficiency.' This is medically inaccurate and should never be used to understand or diagnose a psychiatric condition.",
      anatomy:"Eyes, optic pathways and brain structures enable vision and perception. No demonstrated organ grants remote viewing or astral travel."},
    {id:"crown", group:"major", name:"Crown Chakra", page:8, position:"Top of head",
      described:"The author associates the crown with higher realms and alleged miraculous abilities.",
      health:"The text connects migraines, depression, stress and headaches with chakra imbalance. These are not accepted medical explanations.",
      anatomy:"The scalp, skull and brain are real anatomy; spiritual 'crown' effects are not anatomically demonstrated."},
    {id:"godhead", group:"dan", name:"God's Head / Higher-Self Chakra", page:9, position:"Several imagined points above and beside the head; main golden orb about 15 inches above",
      described:"The author describes Wisdom and Activity centers beside/above the head and a higher-self golden orb.",
      health:"This is the author's spiritual description, not a verified structure or health measurement.",
      anatomy:"There is no corresponding anatomical structure suspended above the head."},
    {id:"soul-star", group:"dan", name:"Soul Star Chakra", page:9, position:"About six inches above the head",
      described:"The book links this supposed spiritual center to the Core Star.",
      health:"No diagnostic or therapeutic conclusion follows from the asserted center.",
      anatomy:"Space above the head contains no known anatomical organ."},
    {id:"thymus", group:"dan", name:"Thymus Chakra / Soul Seat", page:9, position:"Above the heart, upper chest",
      described:"The author calls it the seat of perceptual soul and a spiritual point of communication.",
      health:"The spiritual properties are not established medical functions of the thymus.",
      anatomy:"A real thymus gland lies behind the upper breastbone, especially prominent earlier in life, and contributes to T-cell maturation."},
    {id:"core-star", group:"dan", name:"Core Star Chakra", page:9, position:"About one and one-half inches above the navel",
      described:"Described as a white-light point containing the soul or 'energy-intelligence.'",
      health:"This is symbolic spirituality, not a measured metabolic or neurological center.",
      anatomy:"The abdominal wall and internal organs are real; no Core Star energy organ is medically established."},
    {id:"earth-star", group:"dan", name:"Earth Star Chakra", page:9, position:"Six inches below the feet",
      described:"The book describes a greenish-brown orb that allegedly grounds the person to the physical plane.",
      health:"No physical grounding current or medical effect has been demonstrated for the described orb.",
      anatomy:"There is no anatomical structure below the feet when standing."},
    {id:"tan-tien", group:"hara", name:"Tan Tien", page:11, position:"About two and one-half inches below the navel",
      described:"The book portrays a ball-like center of will, martial movement, and bodily regeneration.",
      health:"Claims of regenerating the body through a Tan Tien or molten-Earth connection are unverified.",
      anatomy:"The lower abdominal region is real; martial arts can train posture, breath and movement without a measurable ball of spiritual power."},
    {id:"hara-line", group:"hara", name:"Haric / Hara Line", page:11, position:"Imagined straight line from top of head toward and beyond the feet",
      described:"The author presents this line as a spiritual alignment practice linked to purpose, grounding and the Earth's core.",
      health:"No medically recognized line connects the body to Earth's molten core or guarantees healing.",
      anatomy:"Body alignment involves actual bones, muscles, joints and balance systems, not a proven Hara laser line."},
    {id:"id-point", group:"hara", name:"ID Point", page:13, position:"About three and one-half feet above the head",
      described:"The book describes a funnel-like point connected to the Hara line and spiritual individuation.",
      health:"Its proposed power and spiritual effects are not demonstrated outcomes.",
      anatomy:"No known organ or biological energy center floats above the head."},
    {id:"pineal", group:"dan", name:"Pineal Spiritual Center (book note)", page:9, position:"Inside the head, near the book's 'mind's eye'",
      described:"A brief note asserts a spiritual 'source intelligence' center at the pineal gland and likens its appearance to a golden sun.",
      health:"No evidence establishes the book's claimed telepathic or cosmic intelligence functions.",
      anatomy:"The pineal gland is a real brain endocrine structure involved in melatonin secretion and circadian timing, not a known source-intelligence antenna."}
  ].map(item => Object.freeze(item)));
  const RANGES = Object.freeze([
    [3,1,7],[4,8,15],[5,16,22],[6,23,29],[7,30,36],[8,37,43],[9,44,50]
  ].map(([dimension,start,end])=>Object.freeze({dimension,start,end,page:6})));
  const GROUPS = Object.freeze([
    {id:"all",label:"All topics"},
    {id:"major",label:"Seven major"},
    {id:"dan",label:"Dan Tiens & related"},
    {id:"hara",label:"Tan Tien / Hara"}
  ]);
  const ESCAPE_MAP = Object.freeze({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"});
  function esc(s){return String(s ?? "").replace(/[&<>"']/g,c=>ESCAPE_MAP[c]);}
  function find(q="",group="all"){
    const needle=String(q||"").trim().toLocaleLowerCase();
    return RECORDS.filter(r=>(group==="all"||r.group===group) &&
      (!needle || [r.name,r.position,r.described,r.anatomy,r.health,String(r.page)]
        .some(v=>v.toLocaleLowerCase().includes(needle))));
  }
  function get(id){return RECORDS.find(r=>r.id===id)||null;}
  function renderAtlas(state={}){
    const category=GROUPS.some(g=>g.id===state.category)?state.category:"all";
    const query=String(state.search||"").slice(0,100);
    const results=find(query,category);
    const selected=results.find(r=>r.id===state.selected)||results[0]||null;
    return [
      '<button type="button" class="q-back" data-action="home">← Back to Quiet Deck</button>',
      '<div class="q-eyebrow">SOURCE-CRITICAL REFERENCE · CHAPTER 4</div>',
      '<h1>Human Body <em>Atlas.</em></h1>',
      '<p class="q-lead">A searchable guide to the chakra and Hara concepts in <i>The Book of Knowledge</i> (Anonymous). Each entry separates the author\'s claims from established physical anatomy. This is reference material, not a meditation or a diagnostic tool.</p>',
      '<section class="q-panel q-atlas-intro" aria-label="Evidence boundary">',
      '<strong>Evidence boundary:</strong> These are spiritual and symbolic descriptions. Chakra organs, dimensional chakra counts and chakra-caused illnesses are not established medical facts. Do not interpret symptoms through this atlas or delay appropriate medical care.',
      '</section>',
      '<section class="q-panel q-atlas-catalog" aria-label="Chapter 4 source and anatomy catalog">',
      '<label for="q-atlas-search"><strong>Search the atlas</strong></label>',
      '<input id="q-atlas-search" class="q-atlas-search" type="search" maxlength="100" autocomplete="off" placeholder="Find a chakra, location, claim or anatomy…" value="',esc(query),'">',
      '<div class="q-atlas-filters" role="group" aria-label="Atlas topic filters">',
      GROUPS.map(g=>'<button type="button" class="q-secondary'+(category===g.id?' q-atlas-selected':'')+
        '" data-action="atlas-filter" data-group="'+esc(g.id)+'" aria-pressed="'+(category===g.id)+'">'+esc(g.label)+'</button>').join(""),
      '</div><p class="q-detail" role="status">',results.length,' topic',results.length===1?'':'s',' found · sourced to PDF pages 6–13.</p>',
      '<div class="q-atlas-layout">',
      '<div class="q-atlas-results" role="group" aria-label="Atlas topics">',
      results.map(r=>'<button type="button" class="q-atlas-item'+(selected&&r.id===selected.id?' q-atlas-selected':'')+
        '" data-action="atlas-open" data-atlas-id="'+esc(r.id)+'" aria-pressed="'+(selected&&r.id===selected.id)+'">'+
        '<strong>'+esc(r.name)+'</strong><small>Book p. '+r.page+' · '+esc(r.position)+'</small></button>').join(""),
      '</div>',
      selected ? [
        '<article class="q-atlas-detail" aria-label="Selected source concept">',
        '<div class="q-setup-step">',esc(selected.group.toUpperCase()),' · BOOK PAGE ',selected.page,'</div>',
        '<h2>',esc(selected.name),'</h2>',
        '<p><strong>Location described in the book:</strong> ',esc(selected.position),'</p>',
        '<h3>Book\'s interpretation</h3><p>',esc(selected.described),'</p>',
        '<h3>Health claims: evidence caution</h3><p>',esc(selected.health),'</p>',
        '<h3>Established anatomical context</h3><p>',esc(selected.anatomy),'</p>',
        '<p class="q-detail">An anatomical neighbor is not proof that a chakra exists as an organ. Source: <i>The Book of Knowledge</i>, Chapter 4, PDF p. ',selected.page,'.</p>',
        '</article>'
      ].join("") : '<p class="q-detail">No matching topics. Try another search or choose All topics.</p>',
      '</div></section>',
      '<section class="q-panel" aria-label="Book dimensional classification">',
      '<div class="q-setup-step">THE AUTHOR\'S CLASSIFICATION · PDF PAGE 6</div>',
      '<h2>Chakras 1–50 by “dimension”</h2>',
      '<p class="q-detail">The book provides only these numerical groupings here. It does <strong>not</strong> give separate anatomical descriptions for each of chakras 8–50 in this section. We will not invent them.</p>',
      '<div class="q-atlas-range-grid">',
      RANGES.map(r=>'<div class="q-atlas-range"><strong>'+r.dimension+'D</strong><span>Chakras '+r.start+'–'+r.end+'</span></div>').join(""),
      '</div></section>',
      '<section class="q-panel"><h2>Reference sources</h2>',
      '<p class="q-detail">Primary: <i>The Book of Knowledge</i> (Anonymous), chapter 4, pages 6–13, user-provided PDF. Independent anatomy: ',
      '<a href="https://medlineplus.gov/anatomy.html" target="_blank" rel="noopener noreferrer">MedlinePlus Anatomy (NIH)</a> and ',
      '<a href="https://my.clevelandclinic.org/health/body/23016-thymus" target="_blank" rel="noopener noreferrer">Cleveland Clinic: Thymus</a>. ',
      'Evidence on energy-field claims: <a href="https://www.nccih.nih.gov/health/reiki" target="_blank" rel="noopener noreferrer">NCCIH</a>. ',
      'No body area in this atlas is a diagnosis or validated chakra measurement.</p></section>'
    ].join("");
  }
  window.FocusBridgeBodyAtlas=Object.freeze({RECORDS,RANGES,GROUPS,find,get,renderAtlas});
})();
