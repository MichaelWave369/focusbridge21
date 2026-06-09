(() => {
  const VERSION = "FocusBridge21 v1.1 Command Hub";
  const LEDGER_KEY = "focusbridge21-ledger-v1";
  const PREF_KEY = "focusbridge21-preferences-v2";
  const HUB_PREF_KEY = "focusbridge21-command-hub-v1";

  const TOOL_SELECTORS = {
    coach: ".fb21-coach-launcher",
    studio: ".fb21-v06-btn",
    mastery: ".fb21-v07-button",
    guidance: ".fb21-guide-fab",
    audio: ".fb21-audio-btn",
    release: ".fb21-v10-button",
    pattern: ".fb21-lab-fab"
  };

  const TOOLS = [
    { key: "coach", group: "Start here", title: "Smart Coach", subtitle: "Fast next-practice hint from local receipts.", badge: "coach" },
    { key: "release", group: "Start here", title: "v1.0 Hub", subtitle: "Release readiness, safety charter, data health, and launch packet.", badge: "release" },
    { key: "pattern", group: "Insight Labs", title: "Pattern Lab", subtitle: "Best conditions, receipt cards, breath pacer, 7-day plan.", badge: "patterns" },
    { key: "studio", group: "Insight Labs", title: "Studio Lab", subtitle: "Private backup, weekly review, comfort profiles, tone checks.", badge: "studio" },
    { key: "mastery", group: "Insight Labs", title: "Mastery Lab", subtitle: "Capacity map, milestones, audio recipes, 14-day plan.", badge: "mastery" },
    { key: "guidance", group: "Practice Tools", title: "Guidance Lab", subtitle: "Script builder, preflight checklist, local browser voice guide.", badge: "voice" },
    { key: "audio", group: "Practice Tools", title: "Audio Lab", subtitle: "Calibration deck, comfort meter, tone checks, recipe JSON.", badge: "audio" }
  ];

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || ""); }
    catch { return fallback; }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function ledger() {
    const rows = readJson(LEDGER_KEY, []);
    return Array.isArray(rows) ? rows : [];
  }

  function prefs() {
    return readJson(PREF_KEY, {}) || {};
  }

  function avg(rows, path) {
    const vals = rows.map(r => path.split(".").reduce((o, k) => o?.[k], r)).filter(v => typeof v === "number");
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  function oneDecimal(n) {
    return typeof n === "number" ? n.toFixed(1) : "—";
  }

  function dayKey(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  }

  function streak(rows) {
    const days = new Set(rows.map(r => dayKey(r.timestamp)).filter(Boolean));
    let count = 0;
    const cursor = new Date();
    for (;;) {
      const key = cursor.toISOString().slice(0, 10);
      if (!days.has(key)) break;
      count += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    return count;
  }

  function mode(rows) {
    const counts = new Map();
    rows.forEach(r => {
      if (!r.preset) return;
      counts.set(r.preset, (counts.get(r.preset) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  }

  function bestReceipt(rows) {
    return [...rows].sort((a, b) => (b.post?.overall_coherence || 0) - (a.post?.overall_coherence || 0))[0] || null;
  }

  function computeStats() {
    const rows = ledger();
    const best = bestReceipt(rows);
    const coherence = avg(rows, "post.overall_coherence");
    const returnQ = avg(rows, "post.return_quality");
    const witness = avg(rows, "during.stable_witness_presence");
    const fear = avg(rows, "during.fear_or_resistance");
    const pref = prefs();
    return {
      count: rows.length,
      streak: streak(rows),
      coherence,
      returnQ,
      witness,
      fear,
      best,
      commonPreset: mode(rows),
      lastPreset: pref.presetName || "Bridge",
      lastDuration: pref.durationMin || 5
    };
  }

  function recommendation(stats) {
    if (!stats.count) return { title: "Run 2-min demo", note: "Start with a short smoke test, then write one receipt." };
    if ((stats.returnQ ?? 0) < 6 || (stats.fear ?? 0) > 4) return { title: "Gentle reset", note: "Return quality or resistance suggests Foundation, 5 minutes, low volume." };
    if ((stats.witness ?? 0) >= 7 && (stats.returnQ ?? 0) >= 7) return { title: "Bridge preview", note: "Witness and return are stable. Keep it short and receipt-driven." };
    return { title: "Training session", note: "Build capacity with Expansion or Foundation, then review patterns." };
  }

  function clickTool(key) {
    const selector = TOOL_SELECTORS[key];
    const button = selector ? document.querySelector(selector) : null;
    if (button) {
      closeHub();
      setTimeout(() => button.click(), 40);
      return;
    }
    toast(`Could not find ${key} launcher yet. Refresh once if the service worker has old files cached.`);
  }

  function clickFlow(label) {
    const candidates = [...document.querySelectorAll("button")];
    const found = candidates.find(btn => btn.textContent.toLowerCase().includes(label.toLowerCase()));
    if (found) {
      closeHub();
      found.click();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
      closeHub();
    }
  }

  function toast(message) {
    let el = document.querySelector(".fb21-command-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "fb21-command-toast";
      Object.assign(el.style, {
        position: "fixed",
        left: "50%",
        bottom: "92px",
        transform: "translateX(-50%)",
        zIndex: 10040,
        color: "#f6f0ff",
        background: "rgba(12, 11, 24, .94)",
        border: "1px solid rgba(255,255,255,.16)",
        borderRadius: "999px",
        padding: "10px 14px",
        boxShadow: "0 16px 50px rgba(0,0,0,.40)",
        maxWidth: "min(720px, calc(100vw - 24px))",
        textAlign: "center"
      });
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.style.opacity = "1";
    clearTimeout(el._timer);
    el._timer = setTimeout(() => { el.style.opacity = "0"; }, 2600);
  }

  function refreshHub() {
    const stats = computeStats();
    const rec = recommendation(stats);
    const panel = document.querySelector(".fb21-command-panel");
    if (!panel) return;

    const recommendedKey = !stats.count ? "coach" : (stats.returnQ ?? 0) < 6 ? "studio" : (stats.witness ?? 0) >= 7 ? "mastery" : "pattern";
    const grouped = TOOLS.reduce((acc, tool) => {
      (acc[tool.group] ||= []).push(tool);
      return acc;
    }, {});

    panel.innerHTML = `
      <div class="fb21-command-head">
        <div>
          <h2 class="fb21-command-title">Command Hub</h2>
          <p class="fb21-command-subtitle">One clean control center for practice, guidance, audio, patterns, backups, release status, and mastery tools.</p>
        </div>
        <button class="fb21-command-close" type="button" aria-label="Close Command Hub">×</button>
      </div>

      <div class="fb21-command-stats">
        <div class="fb21-command-stat"><strong>${stats.count}</strong><span>Receipts</span></div>
        <div class="fb21-command-stat"><strong>${stats.streak}</strong><span>Day streak</span></div>
        <div class="fb21-command-stat"><strong>${oneDecimal(stats.coherence)}</strong><span>Avg coherence</span></div>
        <div class="fb21-command-stat"><strong>${oneDecimal(stats.returnQ)}</strong><span>Avg return</span></div>
      </div>

      <div class="fb21-command-actions">
        <button class="fb21-command-action" data-flow="Readiness"><strong>Start / Readiness</strong><span>Begin the guided practice flow.</span></button>
        <button class="fb21-command-action" data-flow="Recommend"><strong>Recommended Session</strong><span>${rec.title}: ${rec.note}</span></button>
        <button class="fb21-command-action" data-tool="${recommendedKey}"><strong>Best next tool</strong><span>${recommendedKey === "coach" ? "Open Smart Coach" : recommendedKey === "studio" ? "Open Studio Lab" : recommendedKey === "mastery" ? "Open Mastery Lab" : "Open Pattern Lab"}</span></button>
      </div>

      ${Object.entries(grouped).map(([group, tools]) => `
        <div class="fb21-command-section-title">${group}</div>
        <div class="fb21-command-grid">
          ${tools.map(tool => `
            <button class="fb21-command-tool ${tool.key === recommendedKey ? "recommended" : ""}" data-tool="${tool.key}">
              <strong>${tool.title}</strong>
              <span>${tool.subtitle}</span>
              <small>${tool.key === recommendedKey ? "recommended" : tool.badge}</small>
            </button>
          `).join("")}
        </div>
      `).join("")}

      <div class="fb21-command-section-title">Fast navigation</div>
      <div class="fb21-command-grid">
        <button class="fb21-command-tool" data-flow="Cockpit"><strong>Open Cockpit</strong><span>Jump to live timer / RETURN NOW.</span><small>practice</small></button>
        <button class="fb21-command-tool" data-flow="Journal"><strong>Open Journal</strong><span>Write a local receipt after grounding.</span><small>receipt</small></button>
        <button class="fb21-command-tool" data-flow="Ledger"><strong>Open Ledger</strong><span>Review browser-local records.</span><small>local data</small></button>
        <button class="fb21-command-tool" data-flow="Protocol"><strong>Open Protocol</strong><span>Review the 8-week mastery path.</span><small>plan</small></button>
      </div>

      <div class="fb21-command-footer">
        <span>${VERSION} · legacy lab buttons are tucked away by default.</span>
        <button class="fb21-command-toggle" type="button" data-toggle-legacy>Show legacy rails</button>
      </div>
    `;

    panel.querySelector(".fb21-command-close")?.addEventListener("click", closeHub);
    panel.querySelectorAll("[data-tool]").forEach(btn => btn.addEventListener("click", () => clickTool(btn.dataset.tool)));
    panel.querySelectorAll("[data-flow]").forEach(btn => btn.addEventListener("click", () => clickFlow(btn.dataset.flow)));
    panel.querySelector("[data-toggle-legacy]")?.addEventListener("click", toggleLegacy);
  }

  function openHub() {
    refreshHub();
    document.querySelector(".fb21-command-backdrop")?.classList.add("open");
    document.querySelector(".fb21-command-panel")?.classList.add("open");
    document.querySelector(".fb21-command-btn")?.setAttribute("aria-expanded", "true");
  }

  function closeHub() {
    document.querySelector(".fb21-command-backdrop")?.classList.remove("open");
    document.querySelector(".fb21-command-panel")?.classList.remove("open");
    document.querySelector(".fb21-command-btn")?.setAttribute("aria-expanded", "false");
  }

  function toggleLegacy() {
    const showing = document.body.classList.toggle("fb21-v11-show-legacy");
    writeJson(HUB_PREF_KEY, { showLegacy: showing });
    refreshHub();
    toast(showing ? "Legacy side rails restored." : "Legacy side rails tucked away. Command Hub is primary.");
  }

  function boot() {
    const pref = readJson(HUB_PREF_KEY, { showLegacy: false });
    document.body.classList.add("fb21-v11-command-mode");
    document.body.classList.toggle("fb21-v11-show-legacy", !!pref.showLegacy);

    const backdrop = document.createElement("div");
    backdrop.className = "fb21-command-backdrop";
    backdrop.addEventListener("click", closeHub);

    const panel = document.createElement("section");
    panel.className = "fb21-command-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "FocusBridge21 Command Hub");

    const button = document.createElement("button");
    button.className = "fb21-command-btn";
    button.type = "button";
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = `<span class="dot"></span><span>Command Hub</span>`;
    button.addEventListener("click", () => {
      const isOpen = panel.classList.contains("open");
      isOpen ? closeHub() : openHub();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeHub();
    });

    document.body.append(backdrop, panel, button);
    refreshHub();
    toast("v1.1 Command Hub loaded — one clean cockpit launcher is now primary.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
