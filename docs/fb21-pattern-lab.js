(() => {
  const VERSION = "v0.5 Pattern Lab + Receipt Cards";
  const LEDGER_KEY = "focusbridge21-ledger-v1";
  const PREF_KEY = "focusbridge21-preferences-v2";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || ""); }
    catch { return fallback; }
  }

  function avg(values) {
    const nums = values.filter((v) => typeof v === "number" && Number.isFinite(v));
    if (!nums.length) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }

  function fmt(n, d = 1) {
    return typeof n === "number" && Number.isFinite(n) ? n.toFixed(d) : "—";
  }

  function dateKey(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  }

  function currentStreak(rows) {
    const days = new Set(rows.map((r) => dateKey(r.timestamp)).filter(Boolean));
    let streak = 0;
    const cur = new Date();
    for (;;) {
      const key = cur.toISOString().slice(0, 10);
      if (!days.has(key)) break;
      streak += 1;
      cur.setDate(cur.getDate() - 1);
    }
    return streak;
  }

  function scoreReceipt(r) {
    const witness = r?.during?.stable_witness_presence || 0;
    const ret = r?.post?.return_quality || 0;
    const coherence = r?.post?.overall_coherence || 0;
    const fear = r?.during?.fear_or_resistance || 0;
    return coherence * 0.42 + ret * 0.32 + witness * 0.22 - fear * 0.12;
  }

  function groupBest(rows, getter) {
    const groups = new Map();
    rows.forEach((r) => {
      const key = getter(r) || "unknown";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    });
    return Array.from(groups.entries())
      .map(([key, items]) => ({ key, count: items.length, score: avg(items.map(scoreReceipt)) || 0 }))
      .sort((a, b) => b.score - a.score)[0] || null;
  }

  function analyze() {
    const rows = readJson(LEDGER_KEY, []);
    const prefs = readJson(PREF_KEY, {});
    const sorted = [...rows].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const latest = sorted[0] || null;
    const best = [...rows].sort((a, b) => scoreReceipt(b) - scoreReceipt(a))[0] || null;
    const stats = {
      count: rows.length,
      streak: currentStreak(rows),
      avgWitness: avg(rows.map((r) => r?.during?.stable_witness_presence)),
      avgReturn: avg(rows.map((r) => r?.post?.return_quality)),
      avgCoherence: avg(rows.map((r) => r?.post?.overall_coherence)),
      avgFear: avg(rows.map((r) => r?.during?.fear_or_resistance)),
      bestPreset: groupBest(rows, (r) => r.preset),
      bestDuration: groupBest(rows, (r) => r.duration_min ? `${r.duration_min} min` : null),
      bestNoise: groupBest(rows, (r) => r?.audio_params?.noise),
      bestBase: groupBest(rows, (r) => r?.audio_params?.base_hz ? `${r.audio_params.base_hz} Hz` : null),
      latest,
      best,
      prefs
    };

    let reco = {
      title: "Start with the 2-minute demo",
      body: "No receipts yet. Run a short Foundation demo, test RETURN NOW, then write one honest receipt.",
      mode: "Foundation • 2 min"
    };

    if (stats.count > 0) {
      if ((stats.avgFear || 0) >= 5 || (stats.avgReturn || 0) < 5.5) {
        reco = {
          title: "Recommended next: Gentle Reset",
          body: "Recent receipts suggest prioritizing grounding and clean return before deeper threshold work.",
          mode: "Foundation • 5 min • low volume"
        };
      } else if (stats.count >= 4 && (stats.avgWitness || 0) >= 6.5 && (stats.avgReturn || 0) >= 7) {
        reco = {
          title: "Recommended next: Bridge Preview",
          body: "Stable witness and return quality look strong enough for a short, conservative threshold-flavored practice.",
          mode: "Bridge • 5–15 min"
        };
      } else {
        reco = {
          title: "Recommended next: Training Session",
          body: "Keep building the ladder. Use the preset/duration that has produced the cleanest receipts so far.",
          mode: `${stats.bestPreset?.key || "Expansion"} • ${stats.bestDuration?.key || "5–15 min"}`
        };
      }
    }

    stats.reco = reco;
    return stats;
  }

  function safeText(value) {
    return String(value ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  }

  function receiptHtml(r, showPrivate = false) {
    if (!r) {
      return `<div class="fb21-lab-card"><h3>No receipt yet</h3><p>Complete a session journal first, then come back here to generate a clean receipt card.</p></div>`;
    }
    const date = new Date(r.timestamp).toLocaleString();
    const notes = showPrivate ? safeText(r.notes || "") : "Private notes hidden";
    const fragments = showPrivate ? safeText(r.dreamlike_fragments || "") : "Private fragments hidden";
    return `
      <div class="fb21-receipt-card" id="fb21ReceiptCard">
        <h3>FocusBridge21 Receipt</h3>
        <div class="fb21-receipt-meta">${safeText(date)} • ${safeText(r.preset || "Session")} • Gate ${safeText(r.target_gate || "—")}</div>
        <div class="fb21-receipt-kpis">
          <div class="fb21-receipt-kpi"><strong>${safeText(r.readiness?.score ?? "—")}</strong><span>Readiness</span></div>
          <div class="fb21-receipt-kpi"><strong>${safeText(r.during?.stable_witness_presence ?? "—")}</strong><span>Witness</span></div>
          <div class="fb21-receipt-kpi"><strong>${safeText(r.post?.return_quality ?? "—")}</strong><span>Return</span></div>
          <div class="fb21-receipt-kpi"><strong>${safeText(r.post?.overall_coherence ?? "—")}</strong><span>Coherence</span></div>
        </div>
        <p><strong>Duration:</strong> ${safeText(r.duration_min || "—")} min • <strong>Noise:</strong> ${safeText(r.audio_params?.noise || "—")} • <strong>Base:</strong> ${safeText(r.audio_params?.base_hz || "—")} Hz</p>
        <p><strong>Claim boundary:</strong> Subjective self-report; local training receipt; no medical or objective-state claim.</p>
        <p><strong>Notes:</strong> ${notes || "—"}</p>
        <p><strong>Fragments:</strong> ${fragments || "—"}</p>
      </div>
    `;
  }

  function download(filename, text, type = "text/plain") {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function downloadReceipt(r, showPrivate) {
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>FocusBridge21 Receipt</title><style>${receiptCardCss()}</style></head><body>${receiptHtml(r, showPrivate)}<p class="foot">Generated locally by FocusBridge21 ${VERSION}. Private data was ${showPrivate ? "included by choice" : "hidden"}.</p></body></html>`;
    download(`focusbridge21-receipt-${Date.now()}.html`, html, "text/html");
  }

  function receiptCardCss() {
    return `body{margin:0;min-height:100vh;display:grid;place-items:center;background:#070712;color:#f5f0ff;font-family:Inter,system-ui,sans-serif;padding:24px}.fb21-receipt-card{max-width:620px;padding:24px;border-radius:28px;border:1px solid rgba(255,255,255,.17);background:radial-gradient(circle at 50% 0%,rgba(185,167,255,.26),transparent 22rem),rgba(255,255,255,.06);box-shadow:0 28px 80px rgba(0,0,0,.26)}h3{margin:0;font-size:2rem;line-height:1;letter-spacing:-.05em}.fb21-receipt-meta{color:rgba(245,240,255,.72);margin:8px 0 18px}.fb21-receipt-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}.fb21-receipt-kpi{border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:12px;text-align:center}.fb21-receipt-kpi strong{display:block;color:#ffd7a6;font-size:1.55rem;line-height:1}.fb21-receipt-kpi span{display:block;color:rgba(245,240,255,.72);font-size:.8rem;margin-top:5px}.foot{max-width:620px;color:rgba(245,240,255,.62);font-size:.85rem}@media print{body{background:#fff;color:#111}.fb21-receipt-card{box-shadow:none;background:#fff;color:#111;border-color:#ddd}.fb21-receipt-meta,.fb21-receipt-kpi span,.foot{color:#555}.fb21-receipt-kpi strong{color:#111}}`;
  }

  function buildPlan(stats) {
    const base = stats.reco.mode.includes("Foundation") ? "Foundation" : (stats.bestPreset?.key || "Expansion");
    const plan = [
      { day: 1, session: "2-min demo", preset: "Foundation", goal: "App comfort, stereo check, RETURN NOW confidence." },
      { day: 2, session: "Gentle reset", preset: "Foundation", goal: "Body-asleep relaxation and clean return." },
      { day: 3, session: "Rest or journal review", preset: "None", goal: "Review receipts without forcing practice." },
      { day: 4, session: "Training session", preset: base, goal: "Build the strongest current capacity pattern." },
      { day: 5, session: "Gentle reset", preset: "Foundation", goal: "Reinforce grounding and return quality." },
      { day: 6, session: stats.reco.mode.includes("Bridge") ? "Bridge preview" : "Expansion practice", preset: stats.reco.mode.includes("Bridge") ? "Bridge" : "Expansion", goal: "Short, conservative next edge." },
      { day: 7, session: "Integration review", preset: "Journal", goal: "Export ledger and note what actually helped." }
    ];
    return plan;
  }

  function renderInsights(stats) {
    return `
      <div class="fb21-lab-grid">
        <div class="fb21-lab-card"><div class="fb21-lab-stat">${stats.count}</div><div class="fb21-lab-label">Receipts</div></div>
        <div class="fb21-lab-card"><div class="fb21-lab-stat">${stats.streak}</div><div class="fb21-lab-label">Day streak</div></div>
        <div class="fb21-lab-card"><div class="fb21-lab-stat">${fmt(stats.avgWitness)}</div><div class="fb21-lab-label">Avg witness</div></div>
        <div class="fb21-lab-card"><div class="fb21-lab-stat">${fmt(stats.avgReturn)}</div><div class="fb21-lab-label">Avg return</div></div>
      </div>
      <div class="fb21-lab-grid two" style="margin-top:12px">
        <div class="fb21-lab-card fb21-lab-reco">
          <h3>${safeText(stats.reco.title)}</h3>
          <p>${safeText(stats.reco.body)}</p>
          <p><strong>${safeText(stats.reco.mode)}</strong></p>
        </div>
        <div class="fb21-lab-card">
          <h3>Best conditions so far</h3>
          <ul>
            <li>Preset: <strong>${safeText(stats.bestPreset?.key || "Not enough data")}</strong></li>
            <li>Duration: <strong>${safeText(stats.bestDuration?.key || "Not enough data")}</strong></li>
            <li>Noise: <strong>${safeText(stats.bestNoise?.key || "Not enough data")}</strong></li>
            <li>Base: <strong>${safeText(stats.bestBase?.key || "Not enough data")}</strong></li>
          </ul>
        </div>
      </div>
      <div class="fb21-lab-card" style="margin-top:12px">
        <h3>Pattern note</h3>
        <p>${patternNote(stats)}</p>
      </div>
    `;
  }

  function patternNote(stats) {
    if (!stats.count) return "No receipts yet. Run a 2-minute demo and create one receipt so the Pattern Lab has something real to read.";
    if ((stats.avgFear || 0) >= 5) return "Fear/resistance is trending high. Keep sessions short, prioritize Foundation, and strengthen RETURN NOW confidence before deeper work.";
    if ((stats.avgReturn || 0) >= 7 && (stats.avgWitness || 0) >= 6) return "Return quality and stable witness are trending well. Short Bridge Preview sessions are reasonable if readiness is also green.";
    return "Keep building capacity gently. The strongest move is repeatable clean return, not chasing intensity.";
  }

  function renderPlan(stats) {
    const plan = buildPlan(stats);
    return `
      <div class="fb21-lab-card fb21-lab-reco">
        <h3>7-Day Smooth Practice Plan</h3>
        <p>Generated from local receipts and conservative safety rules. Treat it as a suggestion, not a requirement.</p>
      </div>
      <div class="fb21-lab-grid two" style="margin-top:12px">
        ${plan.map((p) => `<div class="fb21-lab-card"><h4>Day ${p.day}: ${safeText(p.session)}</h4><p><strong>${safeText(p.preset)}</strong></p><p>${safeText(p.goal)}</p></div>`).join("")}
      </div>
      <div class="fb21-lab-actions"><button class="fb21-lab-btn primary" data-download-plan>Download plan JSON</button></div>
    `;
  }

  function renderPacer() {
    return `
      <div class="fb21-lab-card fb21-lab-reco"><h3>Breath Pacer</h3><p>Use before a session, during RETURN NOW, or anytime the body needs a gentle anchor. Pattern: inhale 4, hold 2, exhale 6.</p></div>
      <div class="fb21-pacer"><div class="fb21-pacer-orb exhale" id="fb21PacerOrb"><span class="fb21-pacer-word" id="fb21PacerWord">Ready</span><span class="fb21-pacer-count" id="fb21PacerCount">—</span></div></div>
      <div class="fb21-lab-actions"><button class="fb21-lab-btn primary" data-pacer-start>Start pacer</button><button class="fb21-lab-btn" data-pacer-stop>Stop pacer</button></div>
      <p class="fb21-lab-note">No claim. Just a simple visual breath anchor.</p>
    `;
  }

  let pacerTimer = null;
  function startPacer(root) {
    stopPacer();
    const orb = $("#fb21PacerOrb", root);
    const word = $("#fb21PacerWord", root);
    const count = $("#fb21PacerCount", root);
    const cycle = [{ phase: "inhale", label: "Inhale", seconds: 4 }, { phase: "hold", label: "Hold", seconds: 2 }, { phase: "exhale", label: "Exhale", seconds: 6 }];
    let i = 0;
    let remaining = cycle[0].seconds;
    const tick = () => {
      const item = cycle[i];
      orb.className = `fb21-pacer-orb ${item.phase}`;
      word.textContent = item.label;
      count.textContent = remaining;
      remaining -= 1;
      if (remaining < 0) {
        i = (i + 1) % cycle.length;
        remaining = cycle[i].seconds;
      }
    };
    tick();
    pacerTimer = setInterval(tick, 1000);
  }

  function stopPacer() {
    if (pacerTimer) clearInterval(pacerTimer);
    pacerTimer = null;
  }

  function init() {
    if (document.getElementById("fb21PatternLabFab")) return;
    const fab = document.createElement("button");
    fab.id = "fb21PatternLabFab";
    fab.className = "fb21-lab-fab";
    fab.textContent = "✦ Pattern Lab";
    document.body.appendChild(fab);

    const backdrop = document.createElement("div");
    backdrop.className = "fb21-lab-backdrop";
    backdrop.innerHTML = `
      <div class="fb21-lab-modal" role="dialog" aria-modal="true" aria-label="FocusBridge21 Pattern Lab">
        <div class="fb21-lab-head">
          <div><h2 class="fb21-lab-title">Pattern Lab</h2><p class="fb21-lab-sub">Local insights, receipt cards, breath pacer, and smooth practice plan. ${VERSION}</p></div>
          <button class="fb21-lab-close" aria-label="Close Pattern Lab">×</button>
        </div>
        <div class="fb21-lab-tabs">
          <button class="fb21-lab-tab active" data-tab="insights">Insights</button>
          <button class="fb21-lab-tab" data-tab="receipt">Receipt Card</button>
          <button class="fb21-lab-tab" data-tab="pacer">Breath Pacer</button>
          <button class="fb21-lab-tab" data-tab="plan">7-Day Plan</button>
        </div>
        <div class="fb21-lab-body"></div>
      </div>`;
    document.body.appendChild(backdrop);

    const body = $(".fb21-lab-body", backdrop);
    let activeTab = "insights";
    let showPrivate = false;
    let receiptChoice = "latest";

    function render() {
      const stats = analyze();
      $$(".fb21-lab-tab", backdrop).forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === activeTab));
      stopPacer();
      if (activeTab === "insights") {
        body.innerHTML = renderInsights(stats);
      } else if (activeTab === "receipt") {
        const receipt = receiptChoice === "best" ? stats.best : stats.latest;
        body.innerHTML = `
          <div class="fb21-lab-actions" style="margin-bottom:12px">
            <button class="fb21-lab-btn ${receiptChoice === "latest" ? "primary" : ""}" data-receipt-choice="latest">Latest receipt</button>
            <button class="fb21-lab-btn ${receiptChoice === "best" ? "primary" : ""}" data-receipt-choice="best">Best coherence receipt</button>
            <button class="fb21-lab-btn" data-toggle-private>${showPrivate ? "Hide private notes" : "Show private notes"}</button>
            <button class="fb21-lab-btn primary" data-download-receipt>Download receipt HTML</button>
          </div>
          ${receiptHtml(receipt, showPrivate)}
          <p class="fb21-lab-note">Private notes/fragments are hidden by default for safer screenshots and sharing.</p>
        `;
      } else if (activeTab === "pacer") {
        body.innerHTML = renderPacer();
      } else {
        body.innerHTML = renderPlan(stats);
      }
    }

    fab.addEventListener("click", () => {
      backdrop.classList.add("open");
      render();
    });
    $(".fb21-lab-close", backdrop).addEventListener("click", () => {
      backdrop.classList.remove("open");
      stopPacer();
    });
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove("open");
        stopPacer();
      }
    });
    $$(".fb21-lab-tab", backdrop).forEach((btn) => btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      render();
    }));
    body.addEventListener("click", (e) => {
      const target = e.target;
      const stats = analyze();
      if (target.matches("[data-receipt-choice]")) {
        receiptChoice = target.dataset.receiptChoice;
        render();
      }
      if (target.matches("[data-toggle-private]")) {
        showPrivate = !showPrivate;
        render();
      }
      if (target.matches("[data-download-receipt]")) {
        downloadReceipt(receiptChoice === "best" ? stats.best : stats.latest, showPrivate);
      }
      if (target.matches("[data-download-plan]")) {
        download(`focusbridge21-7-day-plan-${Date.now()}.json`, JSON.stringify(buildPlan(stats), null, 2), "application/json");
      }
      if (target.matches("[data-pacer-start]")) startPacer(backdrop);
      if (target.matches("[data-pacer-stop]")) stopPacer();
    });
  }

  window.addEventListener("load", () => setTimeout(init, 600));
})();
