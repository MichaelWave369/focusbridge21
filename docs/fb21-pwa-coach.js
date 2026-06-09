(() => {
  const LEDGER_KEY = "focusbridge21-ledger-v1";
  const PREF_KEYS = ["focusbridge21-preferences-v031", "focusbridge21-preferences-v2"];
  const DISMISS_KEY = "focusbridge21-install-dismissed-v1";
  let deferredInstallPrompt = null;

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || ""); }
    catch { return fallback; }
  }

  function getLedger() {
    const rows = readJson(LEDGER_KEY, []);
    return Array.isArray(rows) ? rows : [];
  }

  function getPrefs() {
    for (const key of PREF_KEYS) {
      const value = readJson(key, null);
      if (value) return value;
    }
    return null;
  }

  function avg(rows, getter) {
    const vals = rows.map(getter).filter((v) => typeof v === "number" && !Number.isNaN(v));
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  function daysBetween(a, b) {
    const day = 24 * 60 * 60 * 1000;
    return Math.round((startOfDay(a) - startOfDay(b)) / day);
  }

  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  }

  function streak(rows) {
    if (!rows.length) return 0;
    const days = [...new Set(rows.map((r) => new Date(r.timestamp).toDateString()))]
      .map((d) => new Date(d))
      .sort((a, b) => b - a);
    let count = 0;
    const today = new Date();
    const firstGap = daysBetween(today, days[0]);
    if (firstGap > 1) return 0;
    count = 1;
    for (let i = 1; i < days.length; i++) {
      if (daysBetween(days[i - 1], days[i]) === 1) count += 1;
      else break;
    }
    return count;
  }

  function estimateReadiness(pre) {
    if (!pre) return null;
    let score = 0;
    score += Number(pre.mood || 0) * 2.0;
    score += Number(pre.sleep || 0) * 2.2;
    score += (11 - Number(pre.stress || 10)) * 2.4;
    score += Number(pre.grounded || 0) * 2.2;
    if (pre.safe) score += 10;
    if (pre.headphones) score += 8;
    if (pre.ack) score += 10;
    if (pre.destabilized) score -= 25;
    if (Number(pre.sleep || 0) <= 3) score -= 12;
    if (Number(pre.stress || 10) >= 8) score -= 12;
    if (Number(pre.grounded || 0) <= 3) score -= 10;
    score = Math.max(0, Math.min(100, Math.round(score)));
    const level = score >= 75 && !pre.destabilized && pre.safe && pre.ack ? "Green" : score >= 50 && !pre.destabilized ? "Yellow" : "Red";
    return { score, level };
  }

  function buildCoachModel() {
    const ledger = getLedger();
    const prefs = getPrefs();
    const pre = prefs?.pre || null;
    const readiness = estimateReadiness(pre);
    const latest = ledger[0] || null;
    const avgReturn = avg(ledger, (r) => r.post?.return_quality);
    const avgWitness = avg(ledger, (r) => r.during?.stable_witness_presence);
    const avgFear = avg(ledger, (r) => r.during?.fear_or_resistance);
    const avgCoherence = avg(ledger, (r) => r.post?.overall_coherence);
    const best = [...ledger].sort((a, b) => (b.post?.overall_coherence || 0) - (a.post?.overall_coherence || 0))[0] || null;

    let recommendation = "Start with the 2-min demo or a 5-min Gentle Reset. Build clean return before depth.";
    let next = "2-min demo";
    let reason = "No receipt pattern yet.";

    if (readiness?.level === "Red") {
      recommendation = "Choose Foundation only, 2–5 minutes, or skip audio and do grounding.";
      next = "Gentle reset";
      reason = `Readiness estimate is ${readiness.score}/100.`;
    } else if (latest && ((latest.post?.return_quality || 0) < 6 || (latest.during?.fear_or_resistance || 0) > 5)) {
      recommendation = "Return training before threshold work: Foundation, 5 minutes, low volume.";
      next = "Gentle reset";
      reason = "Last receipt suggests return quality/fear needs care.";
    } else if (ledger.length >= 3 && avgReturn >= 7 && avgWitness >= 6 && (avgFear || 0) <= 4) {
      recommendation = "You can use Bridge Preview or Expansion, but keep clean return as the success metric.";
      next = "Bridge preview";
      reason = "Recent receipts show stable return and witness capacity.";
    } else if (readiness?.level === "Green") {
      recommendation = "Training session looks appropriate. Expansion or Bridge Preview, conservative volume.";
      next = "Training session";
      reason = `Readiness estimate is ${readiness.score}/100.`;
    } else {
      recommendation = "Gentle reset or Foundation is the best next practice.";
      next = "Gentle reset";
      reason = readiness ? `Readiness estimate is ${readiness.score}/100.` : "Readiness not calculated yet.";
    }

    const insight = best
      ? `Best coherence so far: ${best.preset || "session"}, ${best.duration_min || "?"} min, readiness ${best.readiness?.score ?? "—"}, return ${best.post?.return_quality ?? "—"}.`
      : "No receipts yet. Run a short session and write one honest receipt.";

    return {
      ledger,
      prefs,
      readiness,
      latest,
      avgReturn,
      avgWitness,
      avgFear,
      avgCoherence,
      best,
      count: ledger.length,
      streak: streak(ledger),
      recommendation,
      next,
      reason,
      insight
    };
  }

  function fmt(n) {
    return typeof n === "number" ? n.toFixed(1) : "—";
  }

  function createCoach() {
    if (document.getElementById("fb21Coach")) return;
    const launcher = document.createElement("button");
    launcher.className = "fb21-coach-launcher";
    launcher.type = "button";
    launcher.textContent = "Coach";
    launcher.setAttribute("aria-controls", "fb21Coach");

    const panel = document.createElement("aside");
    panel.id = "fb21Coach";
    panel.className = "fb21-coach";
    panel.hidden = true;

    launcher.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      renderCoach(panel);
    });

    document.body.appendChild(launcher);
    document.body.appendChild(panel);
    renderCoach(panel);
    maybeShowInstallStrip();
  }

  function renderCoach(panel) {
    const m = buildCoachModel();
    const online = navigator.onLine;
    const installed = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    const installReady = !!deferredInstallPrompt;

    panel.innerHTML = `
      <div class="fb21-coach-head">
        <div>
          <div class="fb21-coach-title">FocusBridge21 Coach</div>
          <div class="fb21-coach-subtitle">Local pattern hints, PWA status, and safer next practice.</div>
        </div>
        <button class="fb21-coach-close" type="button" aria-label="Close coach">×</button>
      </div>

      <div class="fb21-coach-card">
        <h3>Recommended next</h3>
        <p><strong>${escapeHtml(m.next)}</strong> — ${escapeHtml(m.recommendation)}</p>
        <div class="fb21-coach-pillrow">
          <span class="fb21-coach-pill">Reason: ${escapeHtml(m.reason)}</span>
          <span class="fb21-coach-pill">Readiness: ${m.readiness ? `${m.readiness.score}/100 ${m.readiness.level}` : "not set"}</span>
        </div>
      </div>

      <div class="fb21-coach-card">
        <h3>Practice tracker</h3>
        <p>${m.count} receipt${m.count === 1 ? "" : "s"} stored locally • ${m.streak}-day streak.</p>
        <div class="fb21-coach-pillrow">
          <span class="fb21-coach-pill">Avg witness: ${fmt(m.avgWitness)}</span>
          <span class="fb21-coach-pill">Avg return: ${fmt(m.avgReturn)}</span>
          <span class="fb21-coach-pill">Avg coherence: ${fmt(m.avgCoherence)}</span>
          <span class="fb21-coach-pill">Avg fear: ${fmt(m.avgFear)}</span>
        </div>
      </div>

      <div class="fb21-coach-card">
        <h3>Pattern insight</h3>
        <p>${escapeHtml(m.insight)}</p>
      </div>

      <div class="fb21-coach-card">
        <h3>App mode</h3>
        <p><span class="fb21-coach-status"><span class="fb21-dot ${online ? "" : "offline"}"></span>${online ? "Online" : "Offline / cached shell"}</span></p>
        <div class="fb21-coach-pillrow">
          <span class="fb21-coach-pill">${installed ? "Installed / standalone" : "Browser tab mode"}</span>
          <span class="fb21-coach-pill">Private localStorage ledger</span>
          <span class="fb21-coach-pill">No cloud sync</span>
        </div>
        <div class="fb21-coach-actions">
          <button class="fb21-coach-btn" id="fb21InstallBtn" type="button" ${installed ? "disabled" : ""}>${installed ? "Installed" : installReady ? "Install app" : "Install help"}</button>
          <button class="fb21-coach-btn secondary" id="fb21RefreshCoach" type="button">Refresh coach</button>
        </div>
      </div>
    `;

    panel.querySelector(".fb21-coach-close").addEventListener("click", () => { panel.hidden = true; });
    panel.querySelector("#fb21RefreshCoach").addEventListener("click", () => renderCoach(panel));
    panel.querySelector("#fb21InstallBtn").addEventListener("click", installAppOrHelp);
  }

  function maybeShowInstallStrip() {
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    if (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone) return;
    const strip = document.createElement("div");
    strip.className = "fb21-install-strip";
    strip.innerHTML = `
      <div class="fb21-install-copy">
        <strong>Install FocusBridge21</strong>
        <span>Open it like a private practice app. Ledger remains local on this device.</span>
      </div>
      <div class="fb21-coach-actions">
        <button class="fb21-coach-btn" id="fb21InstallStripBtn" type="button">Install</button>
        <button class="fb21-coach-btn secondary" id="fb21InstallDismiss" type="button">Not now</button>
      </div>
    `;
    document.body.appendChild(strip);
    strip.querySelector("#fb21InstallStripBtn").addEventListener("click", installAppOrHelp);
    strip.querySelector("#fb21InstallDismiss").addEventListener("click", () => {
      localStorage.setItem(DISMISS_KEY, "1");
      strip.remove();
    });
  }

  async function installAppOrHelp() {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      try { await deferredInstallPrompt.userChoice; } catch (_) {}
      deferredInstallPrompt = null;
      return;
    }
    alert("Install help:\n\nChrome/Edge: use the install icon in the address bar or browser menu.\niPhone/iPad Safari: Share → Add to Home Screen.\nAndroid Chrome: menu → Install app or Add to Home screen.");
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[ch]));
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
  });

  window.addEventListener("online", () => {
    const panel = document.getElementById("fb21Coach");
    if (panel && !panel.hidden) renderCoach(panel);
  });

  window.addEventListener("offline", () => {
    const panel = document.getElementById("fb21Coach");
    if (panel && !panel.hidden) renderCoach(panel);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createCoach);
  } else {
    createCoach();
  }
})();
