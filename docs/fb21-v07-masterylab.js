(() => {
  const VERSION = "v0.7 Mastery Lab";
  const LEDGER_KEY = "focusbridge21-ledger-v1";
  const PREF_KEY = "focusbridge21-preferences-v2";
  const PLAN_KEY = "focusbridge21-v07-plan-v1";

  const PRESETS = {
    Foundation: { gate: 10, base: 180, noise: "pink", intention: "Relax the body, stay gently awake, and return cleanly." },
    Expansion: { gate: 12, base: 200, noise: "pink", intention: "Widen awareness while staying calm, grounded, and observant." },
    "No-Time": { gate: 15, base: 210, noise: "brown", intention: "Rest in spaciousness while keeping a stable witness and clear return." },
    Bridge: { gate: 21, base: 220, noise: "pink", intention: "Stable witness at the threshold, no forcing, clean return, honest receipt." }
  };

  const RECIPES = [
    { name: "Soft Landing", preset: "Foundation", duration: 5, guidance: "Neutral", volume: 0.10, noiseAmount: 0.03, note: "Gentle reset, body safety, clean return." },
    { name: "Witness Builder", preset: "Expansion", duration: 15, guidance: "Neutral", volume: 0.14, noiseAmount: 0.04, note: "Capacity training without pushing threshold." },
    { name: "Time-Release Lite", preset: "No-Time", duration: 15, guidance: "Neutral", volume: 0.13, noiseAmount: 0.04, note: "Spaciousness practice with conservative return." },
    { name: "Bridge Preview", preset: "Bridge", duration: 5, guidance: "Resonance Architect", volume: 0.12, noiseAmount: 0.035, note: "Short threshold-flavored practice." },
    { name: "Deep But Safe", preset: "Expansion", duration: 25, guidance: "Resonance Architect", volume: 0.16, noiseAmount: 0.05, note: "Longer practice when return quality is strong." }
  ];

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || ""); }
    catch { return fallback; }
  }
  function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>'"]/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[ch]));
  }
  function path(obj, p) { return p.split(".").reduce((o, k) => o && o[k], obj); }
  function avg(rows, p) {
    const vals = rows.map(r => path(r, p)).filter(v => typeof v === "number" && !Number.isNaN(v));
    if (!vals.length) return null;
    return vals.reduce((a,b)=>a+b,0) / vals.length;
  }
  function round(v, d = 1) { return v == null ? "—" : Number(v).toFixed(d); }
  function dateKey(ts) { return new Date(ts).toISOString().slice(0,10); }
  function addDays(date, days) { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
  function ymd(d) { return d.toISOString().slice(0,10).replaceAll("-", ""); }
  function download(name, content, type="text/plain") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function loadLedger() {
    return readJson(LEDGER_KEY, []).sort((a,b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  }

  function computeStreak(ledger) {
    const days = new Set(ledger.map(r => dateKey(r.timestamp || Date.now())));
    let streak = 0;
    let d = new Date();
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().slice(0,10);
      if (days.has(key)) { streak++; d.setDate(d.getDate() - 1); continue; }
      if (i === 0) { d.setDate(d.getDate() - 1); continue; }
      break;
    }
    return streak;
  }

  function groupBest(ledger, groupFn) {
    const groups = new Map();
    ledger.forEach(r => {
      const key = groupFn(r) || "Unknown";
      const val = r.post?.overall_coherence;
      if (typeof val !== "number") return;
      const g = groups.get(key) || { key, count: 0, total: 0 };
      g.count += 1; g.total += val; groups.set(key, g);
    });
    const sorted = [...groups.values()].map(g => ({ ...g, avg: g.total / g.count })).sort((a,b) => b.avg - a.avg || b.count - a.count);
    return sorted[0] || null;
  }

  function analyze() {
    const ledger = loadLedger();
    const prefs = readJson(PREF_KEY, {});
    const count = ledger.length;
    const recent = ledger.slice(0, 3);
    const previous = ledger.slice(3, 6);
    const a = {
      ledger,
      prefs,
      count,
      streak: computeStreak(ledger),
      avgRelax: avg(ledger, "during.body_relaxation"),
      avgWitness: avg(ledger, "during.stable_witness_presence"),
      avgReturn: avg(ledger, "post.return_quality"),
      avgGround: avg(ledger, "post.grounding_feeling"),
      avgCoherence: avg(ledger, "post.overall_coherence"),
      avgClarity: avg(ledger, "during.mental_clarity"),
      avgFear: avg(ledger, "during.fear_or_resistance"),
      recentCoherence: avg(recent, "post.overall_coherence"),
      previousCoherence: avg(previous, "post.overall_coherence"),
      bestPreset: groupBest(ledger, r => r.preset),
      bestDuration: groupBest(ledger, r => `${r.duration_min || "?"} min`),
      bestNoise: groupBest(ledger, r => r.audio_params?.noise),
      bestBase: groupBest(ledger, r => r.audio_params?.base_hz ? `${r.audio_params.base_hz} Hz` : null),
      bestReceipt: [...ledger].sort((x,y) => (y.post?.overall_coherence || 0) - (x.post?.overall_coherence || 0))[0]
    };
    a.protocolWeek = Math.min(8, Math.max(1, Math.floor(count / 3) + 1));
    a.calmScore = a.avgFear == null ? null : Math.max(1, 11 - a.avgFear);
    a.recommendation = recommend(a);
    return a;
  }

  function recommend(a) {
    if (!a.count) return { title: "Begin with Soft Landing", preset: "Foundation", duration: 5, guidance: "Neutral", volume: 0.10, noiseAmount: 0.03, why: "No receipts yet. Start with an easy baseline." };
    if ((a.avgReturn ?? 0) < 6 || (a.avgFear ?? 0) > 5) return { title: "Repair return quality", preset: "Foundation", duration: 5, guidance: "Neutral", volume: 0.10, noiseAmount: 0.03, why: "Return/fear pattern suggests grounding-first practice." };
    if ((a.avgWitness ?? 0) >= 7 && (a.avgReturn ?? 0) >= 8 && (a.avgFear ?? 10) <= 3) return { title: "Bridge Preview is reasonable", preset: "Bridge", duration: 5, guidance: "Resonance Architect", volume: 0.12, noiseAmount: 0.035, why: "Stable witness and clean return are trending strong." };
    if ((a.avgCoherence ?? 0) >= 7 && (a.avgReturn ?? 0) >= 7) return { title: "Build the bridge gradually", preset: "Expansion", duration: 15, guidance: "Resonance Architect", volume: 0.15, noiseAmount: 0.04, why: "Coherence is good; keep building without forcing threshold." };
    return { title: "Witness Builder", preset: "Expansion", duration: 15, guidance: "Neutral", volume: 0.14, noiseAmount: 0.04, why: "Balanced capacity training is the next smooth step." };
  }

  function applySession(session) {
    const preset = PRESETS[session.preset] || PRESETS.Foundation;
    const prefs = readJson(PREF_KEY, {});
    const next = {
      ...prefs,
      presetName: session.preset,
      durationMin: Number(session.duration || 5),
      guidanceMode: session.guidance || "Neutral",
      base: Number(session.base || preset.base),
      noise: session.noise || preset.noise,
      noiseAmount: Number(session.noiseAmount ?? 0.04),
      volume: Number(session.volume ?? 0.12),
      pre: {
        ...(prefs.pre || {}),
        mood: prefs.pre?.mood || 7,
        sleep: prefs.pre?.sleep || 7,
        stress: prefs.pre?.stress || 3,
        grounded: prefs.pre?.grounded || 7,
        safe: true,
        headphones: true,
        ack: false,
        destabilized: false,
        intention: session.intention || preset.intention
      }
    };
    writeJson(PREF_KEY, next);
    alert("Session loaded. Safety acknowledgement was reset on purpose. Re-check readiness before starting.");
    window.location.reload();
  }

  function buildPlan(days = 14) {
    const a = analyze();
    const plan = [];
    for (let i = 0; i < days; i++) {
      const day = addDays(new Date(), i);
      let s;
      if (i % 7 === 6) s = { title: "Integration / Rest", preset: "Foundation", duration: 2, guidance: "Neutral", volume: 0.08, noiseAmount: 0.02, note: "No pushing. Review receipts, hydrate, ground." };
      else if ((a.avgReturn ?? 0) < 6 || (a.avgFear ?? 0) > 5) s = RECIPES[0];
      else if (i % 4 === 3 && (a.avgWitness ?? 0) >= 7 && (a.avgReturn ?? 0) >= 7.5) s = RECIPES[3];
      else if (i % 3 === 2) s = RECIPES[2];
      else s = i % 2 === 0 ? RECIPES[1] : RECIPES[0];
      plan.push({ date: day.toISOString().slice(0,10), ...s });
    }
    writeJson(PLAN_KEY, plan);
    return plan;
  }

  function planMarkdown(plan) {
    return `# FocusBridge21 14-Day Mastery Plan\n\nGenerated: ${new Date().toLocaleString()}\n\n| Date | Session | Preset | Duration | Note |\n|---|---|---:|---:|---|\n${plan.map(p => `| ${p.date} | ${p.title} | ${p.preset} | ${p.duration} min | ${p.note || ""} |`).join("\n")}\n`;
  }

  function planIcs(plan) {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const events = plan.map((p, i) => `BEGIN:VEVENT\nUID:focusbridge21-${p.date}-${i}@local\nDTSTAMP:${stamp}\nDTSTART:${ymd(new Date(p.date + "T09:00:00"))}T090000\nDURATION:PT${Math.max(2, Number(p.duration || 5))}M\nSUMMARY:FocusBridge21: ${p.title}\nDESCRIPTION:${p.preset} / ${p.duration} min / ${p.note || "Local-first practice"}\nEND:VEVENT`).join("\n");
    return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//FocusBridge21//Mastery Plan//EN\n${events}\nEND:VCALENDAR\n`;
  }

  function reportMarkdown(a) {
    return `# FocusBridge21 Mastery Report\n\nGenerated: ${new Date().toLocaleString()}\n\n## Summary\n\n- Receipts: ${a.count}\n- Current streak: ${a.streak}\n- Protocol week estimate: ${a.protocolWeek}\n- Avg stable witness: ${round(a.avgWitness)}\n- Avg return quality: ${round(a.avgReturn)}\n- Avg coherence: ${round(a.avgCoherence)}\n- Avg fear/resistance: ${round(a.avgFear)}\n\n## Best Conditions\n\n- Preset: ${a.bestPreset ? `${a.bestPreset.key} (${round(a.bestPreset.avg)} coherence avg)` : "not enough data"}\n- Duration: ${a.bestDuration ? `${a.bestDuration.key} (${round(a.bestDuration.avg)} coherence avg)` : "not enough data"}\n- Noise: ${a.bestNoise ? `${a.bestNoise.key} (${round(a.bestNoise.avg)} coherence avg)` : "not enough data"}\n- Base Hz: ${a.bestBase ? `${a.bestBase.key} (${round(a.bestBase.avg)} coherence avg)` : "not enough data"}\n\n## Next Practice\n\n${a.recommendation.title}: ${a.recommendation.preset}, ${a.recommendation.duration} minutes.\n\nWhy: ${a.recommendation.why}\n\n## Claim Boundary\n\nSubjective self-report only. This report does not prove altered-state achievement, medical benefit, or objective Focus-level attainment.\n`;
  }

  function bar(label, value) {
    const pct = value == null ? 0 : Math.max(0, Math.min(100, value * 10));
    return `<div><strong>${escapeHtml(label)}</strong><div class="fb21-v07-bar"><span style="width:${pct}%"></span></div><div class="fb21-v07-soft fb21-v07-small">${round(value)} / 10</div></div>`;
  }

  function badge(label, on) { return `<span class="fb21-v07-badge ${on ? "on" : ""}">${escapeHtml(label)}</span>`; }

  function renderMap(a) {
    const delta = a.recentCoherence != null && a.previousCoherence != null ? a.recentCoherence - a.previousCoherence : null;
    return `
      <div class="fb21-v07-grid four">
        <div class="fb21-v07-card"><div class="fb21-v07-stat">${a.count}</div><div class="fb21-v07-muted">Receipts</div></div>
        <div class="fb21-v07-card"><div class="fb21-v07-stat">${a.streak}</div><div class="fb21-v07-muted">Day streak</div></div>
        <div class="fb21-v07-card"><div class="fb21-v07-stat">${a.protocolWeek}</div><div class="fb21-v07-muted">Protocol week estimate</div></div>
        <div class="fb21-v07-card"><div class="fb21-v07-stat">${delta == null ? "—" : (delta >= 0 ? "+" : "") + delta.toFixed(1)}</div><div class="fb21-v07-muted">Recent coherence trend</div></div>
      </div>
      <div class="fb21-v07-grid" style="margin-top:14px;">
        <div class="fb21-v07-card">
          <h3>Capacity Map</h3>
          ${bar("Body relaxation", a.avgRelax)}
          ${bar("Stable witness", a.avgWitness)}
          ${bar("Return quality", a.avgReturn)}
          ${bar("Grounding", a.avgGround)}
          ${bar("Coherence", a.avgCoherence)}
          ${bar("Mental clarity", a.avgClarity)}
          ${bar("Calm / low resistance", a.calmScore)}
        </div>
        <div class="fb21-v07-card">
          <h3>Best Conditions</h3>
          <p class="fb21-v07-muted">These are pattern hints from local receipts, not proof of cause.</p>
          <p><strong>Preset:</strong> ${a.bestPreset ? `${escapeHtml(a.bestPreset.key)} · ${round(a.bestPreset.avg)} avg` : "Need more receipts"}</p>
          <p><strong>Duration:</strong> ${a.bestDuration ? `${escapeHtml(a.bestDuration.key)} · ${round(a.bestDuration.avg)} avg` : "Need more receipts"}</p>
          <p><strong>Noise:</strong> ${a.bestNoise ? `${escapeHtml(a.bestNoise.key)} · ${round(a.bestNoise.avg)} avg` : "Need more receipts"}</p>
          <p><strong>Base Hz:</strong> ${a.bestBase ? `${escapeHtml(a.bestBase.key)} · ${round(a.bestBase.avg)} avg` : "Need more receipts"}</p>
          <h3>Milestones</h3>
          <div class="fb21-v07-badges">
            ${badge("First receipt", a.count >= 1)}
            ${badge("3 receipts", a.count >= 3)}
            ${badge("7 receipts", a.count >= 7)}
            ${badge("Clean return", (a.avgReturn ?? 0) >= 8)}
            ${badge("Stable witness", (a.avgWitness ?? 0) >= 7)}
            ${badge("Low resistance", (a.avgFear ?? 99) <= 3 && a.count > 0)}
          </div>
        </div>
      </div>`;
  }

  function renderCoach(a) {
    const r = a.recommendation;
    return `
      <div class="fb21-v07-grid">
        <div class="fb21-v07-card">
          <h3>${escapeHtml(r.title)}</h3>
          <p class="fb21-v07-muted">${escapeHtml(r.why)}</p>
          <p><strong>Preset:</strong> ${escapeHtml(r.preset)} · <strong>Duration:</strong> ${r.duration} min · <strong>Mode:</strong> ${escapeHtml(r.guidance)}</p>
          <p class="fb21-v07-soft fb21-v07-small">Safety acknowledgement will reset after applying.</p>
          <div class="fb21-v07-actions"><button class="fb21-v07-action primary" data-v07-apply-rec>Apply recommendation</button></div>
        </div>
        <div class="fb21-v07-card">
          <h3>Coach Boundary</h3>
          <p class="fb21-v07-muted">The coach only reads local receipts and preferences. It suggests safer practice patterns; it does not diagnose, certify Focus 21, or make medical claims.</p>
          <button class="fb21-v07-action" data-v07-report>Download Mastery Report</button>
        </div>
      </div>`;
  }

  function renderAudio() {
    const prefs = readJson(PREF_KEY, {});
    return `
      <div class="fb21-v07-grid">
        <div class="fb21-v07-card">
          <h3>Audio Recipe Library</h3>
          <div class="fb21-v07-grid">
            ${RECIPES.map((r, i) => `<button class="fb21-v07-recipe" data-v07-recipe="${i}"><strong>${escapeHtml(r.name)}</strong><br><span class="fb21-v07-muted">${escapeHtml(r.preset)} · ${r.duration} min · vol ${r.volume}</span><br><span class="fb21-v07-soft">${escapeHtml(r.note)}</span></button>`).join("")}
          </div>
        </div>
        <div class="fb21-v07-card">
          <h3>Custom Comfort Builder</h3>
          <div class="fb21-v07-field"><label>Preset</label><select id="v07Preset">${Object.keys(PRESETS).map(p => `<option ${p === (prefs.presetName || "Foundation") ? "selected" : ""}>${p}</option>`).join("")}</select></div>
          <div class="fb21-v07-field"><label>Duration</label><select id="v07Duration">${[2,5,15,25,35,45].map(d => `<option value="${d}" ${d === (prefs.durationMin || 5) ? "selected" : ""}>${d} minutes</option>`).join("")}</select></div>
          <div class="fb21-v07-field"><label>Guidance</label><select id="v07Guidance"><option ${prefs.guidanceMode !== "Resonance Architect" ? "selected" : ""}>Neutral</option><option ${prefs.guidanceMode === "Resonance Architect" ? "selected" : ""}>Resonance Architect</option></select></div>
          <div class="fb21-v07-field"><label>Base Hz</label><input id="v07Base" type="number" min="120" max="440" step="5" value="${Number(prefs.base || 180)}"></div>
          <div class="fb21-v07-field"><label>Noise</label><select id="v07Noise">${["none","pink","brown","white"].map(n => `<option ${n === (prefs.noise || "pink") ? "selected" : ""}>${n}</option>`).join("")}</select></div>
          <div class="fb21-v07-field"><label>Noise amount</label><input id="v07NoiseAmount" type="number" min="0" max="0.25" step="0.01" value="${Number(prefs.noiseAmount ?? 0.04)}"></div>
          <div class="fb21-v07-field"><label>Volume</label><input id="v07Volume" type="number" min="0.02" max="0.50" step="0.01" value="${Number(prefs.volume ?? 0.12)}"></div>
          <div class="fb21-v07-field"><label>Intention</label><textarea id="v07Intention">${escapeHtml(prefs.pre?.intention || PRESETS.Foundation.intention)}</textarea></div>
          <div class="fb21-v07-actions"><button class="fb21-v07-action primary" data-v07-custom>Apply custom builder</button></div>
        </div>
      </div>`;
  }

  function renderPlan() {
    const plan = readJson(PLAN_KEY, []);
    return `
      <div class="fb21-v07-grid">
        <div class="fb21-v07-card">
          <h3>14-Day Mastery Plan</h3>
          <p class="fb21-v07-muted">A gentle rotating plan based on your local receipts. Rest days are included on purpose.</p>
          <div class="fb21-v07-actions">
            <button class="fb21-v07-action primary" data-v07-plan>Generate / refresh plan</button>
            <button class="fb21-v07-action" data-v07-plan-md ${plan.length ? "" : "disabled"}>Download Markdown</button>
            <button class="fb21-v07-action" data-v07-plan-ics ${plan.length ? "" : "disabled"}>Download Calendar .ics</button>
          </div>
        </div>
        <div class="fb21-v07-card">
          <h3>Plan Boundary</h3>
          <p class="fb21-v07-muted">This is a practice calendar, not treatment, prescription, or certainty engine. Skip any session if readiness is low.</p>
        </div>
      </div>
      <div class="fb21-v07-card" style="margin-top:14px;">
        ${plan.length ? plan.map((p, i) => `<div class="fb21-v07-plan-row"><strong>${escapeHtml(p.date)}</strong><div><strong>${escapeHtml(p.title)}</strong><div class="fb21-v07-muted">${escapeHtml(p.preset)} · ${p.duration} min · ${escapeHtml(p.note || "")}</div></div><button class="fb21-v07-action" data-v07-plan-apply="${i}">Load</button></div>`).join("") : `<p class="fb21-v07-muted">No plan generated yet.</p>`}
      </div>`;
  }

  function render() {
    const a = analyze();
    const panel = document.getElementById("fb21-v07-panel");
    const active = panel?.dataset.tab || "map";
    const body = active === "map" ? renderMap(a) : active === "coach" ? renderCoach(a) : active === "audio" ? renderAudio() : renderPlan();
    panel.innerHTML = `
      <div class="fb21-v07-backdrop" data-v07-close></div>
      <div class="fb21-v07-shell">
        <div class="fb21-v07-head">
          <div>
            <h2>◇ Mastery Lab</h2>
            <div class="fb21-v07-muted">${VERSION} · local pattern intelligence, audio recipes, milestones, and practice planning.</div>
          </div>
          <button class="fb21-v07-close" data-v07-close>Close</button>
        </div>
        <div class="fb21-v07-tabs">
          ${[["map","Mastery Map"],["coach","Coach"],["audio","Audio Recipes"],["plan","14-Day Plan"]].map(([id,label]) => `<button class="fb21-v07-tab ${active === id ? "active" : ""}" data-v07-tab="${id}">${label}</button>`).join("")}
        </div>
        <div class="fb21-v07-body">${body}</div>
      </div>`;
    wire(panel, a);
  }

  function wire(panel, a) {
    panel.querySelectorAll("[data-v07-close]").forEach(el => el.addEventListener("click", close));
    panel.querySelectorAll("[data-v07-tab]").forEach(el => el.addEventListener("click", () => { panel.dataset.tab = el.dataset.v07Tab; render(); }));
    const rec = panel.querySelector("[data-v07-apply-rec]");
    if (rec) rec.addEventListener("click", () => applySession(a.recommendation));
    const rep = panel.querySelector("[data-v07-report]");
    if (rep) rep.addEventListener("click", () => download(`focusbridge21-mastery-report-${Date.now()}.md`, reportMarkdown(a), "text/markdown"));
    panel.querySelectorAll("[data-v07-recipe]").forEach(el => el.addEventListener("click", () => applySession(RECIPES[Number(el.dataset.v07Recipe)])));
    const custom = panel.querySelector("[data-v07-custom]");
    if (custom) custom.addEventListener("click", () => {
      const preset = document.getElementById("v07Preset").value;
      applySession({
        title: "Custom Comfort Builder",
        preset,
        duration: Number(document.getElementById("v07Duration").value),
        guidance: document.getElementById("v07Guidance").value,
        base: Number(document.getElementById("v07Base").value),
        noise: document.getElementById("v07Noise").value,
        noiseAmount: Number(document.getElementById("v07NoiseAmount").value),
        volume: Number(document.getElementById("v07Volume").value),
        intention: document.getElementById("v07Intention").value
      });
    });
    const gen = panel.querySelector("[data-v07-plan]");
    if (gen) gen.addEventListener("click", () => { buildPlan(14); render(); });
    const md = panel.querySelector("[data-v07-plan-md]");
    if (md) md.addEventListener("click", () => download(`focusbridge21-14-day-plan-${Date.now()}.md`, planMarkdown(readJson(PLAN_KEY, [])), "text/markdown"));
    const ics = panel.querySelector("[data-v07-plan-ics]");
    if (ics) ics.addEventListener("click", () => download(`focusbridge21-14-day-plan-${Date.now()}.ics`, planIcs(readJson(PLAN_KEY, [])), "text/calendar"));
    panel.querySelectorAll("[data-v07-plan-apply]").forEach(el => el.addEventListener("click", () => applySession(readJson(PLAN_KEY, [])[Number(el.dataset.v07PlanApply)])));
  }

  function open() {
    let panel = document.getElementById("fb21-v07-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "fb21-v07-panel";
      panel.className = "fb21-v07-panel";
      panel.dataset.tab = "map";
      document.body.appendChild(panel);
    }
    panel.classList.add("open");
    render();
  }
  function close() { document.getElementById("fb21-v07-panel")?.classList.remove("open"); }

  function boot() {
    if (document.getElementById("fb21-v07-button")) return;
    const btn = document.createElement("button");
    btn.id = "fb21-v07-button";
    btn.className = "fb21-v07-button";
    btn.textContent = "◇ Mastery Lab";
    btn.title = "Open FocusBridge21 Mastery Lab";
    btn.addEventListener("click", open);
    document.body.appendChild(btn);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
