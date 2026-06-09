(() => {
  const VERSION = "FocusBridge21 v1.2 Experience Layer";
  const LEDGER_KEY = "focusbridge21-ledger-v1";
  const PREF_KEY = "focusbridge21-preferences-v2";
  const MODE_KEY = "focusbridge21-ui-mode-v12";
  const TOUR_KEY = "focusbridge21-tour-dismissed-v12";

  const TOUR = [
    {
      title: "Start with the Readiness Gate",
      body: "FocusBridge21 works best when the first question is not 'how deep can I go?' but 'what is safe and useful today?' The Readiness Gate helps choose a safer preset and duration."
    },
    {
      title: "Use short sessions first",
      body: "The 2-minute demo and 5-minute gentle reset are here on purpose. Short, clean, repeatable sessions create better data than forcing long threshold sessions too soon."
    },
    {
      title: "RETURN NOW is part of mastery",
      body: "Return quality is not a failure metric. It is one of the most important capacities. Clean return, memory retention, and groundedness are the receipt trail."
    },
    {
      title: "The ledger stays local",
      body: "Receipts, preferences, and lab data live in this browser's localStorage unless you export them. This layer adds a privacy/data center so you can back up or clear that local data."
    },
    {
      title: "Beginner Mode keeps the cockpit calm",
      body: "Beginner Mode hides most advanced floating lab buttons and leaves a cleaner practice flow. You can turn advanced controls back on anytime."
    }
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

  function fbKeys() {
    return Object.keys(localStorage).filter((key) => key.startsWith("focusbridge21"));
  }

  function bytesForKeys(keys) {
    return keys.reduce((sum, key) => sum + key.length + (localStorage.getItem(key) || "").length, 0);
  }

  function avg(rows, getter) {
    const vals = rows.map(getter).filter((v) => typeof v === "number" && Number.isFinite(v));
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  function dates(rows) {
    return rows.map((r) => new Date(r.timestamp)).filter((d) => !Number.isNaN(d.getTime())).sort((a, b) => b - a);
  }

  function streak(rows) {
    const set = new Set(dates(rows).map((d) => d.toISOString().slice(0, 10)));
    let n = 0;
    const cursor = new Date();
    for (;;) {
      const key = cursor.toISOString().slice(0, 10);
      if (!set.has(key)) break;
      n += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return n;
  }

  function readiness(rows) {
    if (!rows.length) return 34;
    const returnAvg = avg(rows, (r) => r.post?.return_quality) || 0;
    const coherenceAvg = avg(rows, (r) => r.post?.overall_coherence) || 0;
    const witnessAvg = avg(rows, (r) => r.during?.stable_witness_presence) || 0;
    const fearAvg = avg(rows, (r) => r.during?.fear_or_resistance) ?? 5;
    const recent = dates(rows)[0];
    const recentBonus = recent && (Date.now() - recent.getTime()) < 1000 * 60 * 60 * 24 * 4 ? 10 : 0;
    return Math.max(0, Math.min(100, Math.round(rows.length * 5 + returnAvg * 7 + coherenceAvg * 6 + witnessAvg * 5 - fearAvg * 4 + recentBonus)));
  }

  function bestNext(rows) {
    if (!rows.length) return "Run the 2-minute demo, then save one honest receipt.";
    const r = readiness(rows);
    const ret = avg(rows, (x) => x.post?.return_quality) || 0;
    const fear = avg(rows, (x) => x.during?.fear_or_resistance) ?? 5;
    if (fear >= 5 || ret < 6) return "Use Gentle Reset or Foundation until return quality is consistently clean.";
    if (r >= 78 && rows.length >= 5) return "Bridge Preview is reasonable today. Keep it short and prioritize clean return.";
    return "Training Session or Expansion is the best next step. Build stable witness before depth.";
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
  }

  function button(label, className = "", onClick = null) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `fb21-v12-btn ${className}`.trim();
    b.textContent = label;
    if (onClick) b.addEventListener("click", onClick);
    return b;
  }

  function openModal(html, afterMount) {
    closeModal();
    const backdrop = document.createElement("div");
    backdrop.className = "fb21-v12-modal-backdrop";
    backdrop.innerHTML = `<section class="fb21-v12-modal"><button class="fb21-v12-btn fb21-v12-close" type="button">Close</button>${html}</section>`;
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) closeModal();
    });
    document.body.appendChild(backdrop);
    backdrop.querySelector(".fb21-v12-close").addEventListener("click", closeModal);
    if (afterMount) afterMount(backdrop);
  }

  function closeModal() {
    document.querySelectorAll(".fb21-v12-modal-backdrop").forEach((el) => el.remove());
  }

  function download(filename, text, type = "application/json") {
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

  function allDataPacket() {
    const keys = fbKeys();
    const storage = {};
    keys.forEach((key) => storage[key] = localStorage.getItem(key));
    return {
      exported_at: new Date().toISOString(),
      app: VERSION,
      origin: location.origin,
      storage_keys: keys,
      storage,
      note: "Private local FocusBridge21 backup. Keep this file somewhere safe if it contains personal notes."
    };
  }

  function openTour(start = 0) {
    let idx = start;
    const render = () => {
      const item = TOUR[idx];
      openModal(`
        <div class="fb21-v12-step">Orientation ${idx + 1} / ${TOUR.length}</div>
        <h2>${escapeHtml(item.title)}</h2>
        <p>${escapeHtml(item.body)}</p>
        <div class="fb21-v12-meter"><div style="width:${((idx + 1) / TOUR.length) * 100}%"></div></div>
        <div class="fb21-v12-nav">
          <button class="fb21-v12-btn" id="fb21-tour-prev" ${idx === 0 ? "disabled" : ""}>Back</button>
          <div>
            <button class="fb21-v12-btn" id="fb21-tour-skip">Done</button>
            <button class="fb21-v12-btn primary" id="fb21-tour-next">${idx === TOUR.length - 1 ? "Finish" : "Next"}</button>
          </div>
        </div>
      `, (root) => {
        root.querySelector("#fb21-tour-prev").addEventListener("click", () => { idx = Math.max(0, idx - 1); render(); });
        root.querySelector("#fb21-tour-skip").addEventListener("click", () => { localStorage.setItem(TOUR_KEY, "1"); closeModal(); });
        root.querySelector("#fb21-tour-next").addEventListener("click", () => {
          if (idx >= TOUR.length - 1) {
            localStorage.setItem(TOUR_KEY, "1");
            closeModal();
          } else {
            idx += 1;
            render();
          }
        });
      });
    };
    render();
  }

  function openPrivacyCenter() {
    const rows = ledger();
    const keys = fbKeys();
    const last = dates(rows)[0];
    const size = bytesForKeys(keys);
    const score = readiness(rows);
    openModal(`
      <h2>Privacy & Data Center</h2>
      <p>FocusBridge21 stores practice data locally in this browser unless you export it. This panel shows what the app can see locally and gives you backup / clear controls.</p>
      <div class="fb21-v12-grid">
        <div class="fb21-v12-card"><strong>Local receipts</strong>${rows.length}</div>
        <div class="fb21-v12-card"><strong>Local storage keys</strong>${keys.length}</div>
        <div class="fb21-v12-card"><strong>Approx local size</strong>${Math.round(size / 1024)} KB</div>
        <div class="fb21-v12-card"><strong>Practice readiness</strong>${score}/100</div>
      </div>
      <div class="fb21-v12-kv"><span>Last receipt</span><span>${last ? last.toLocaleString() : "none"}</span></div>
      <div class="fb21-v12-kv"><span>Saved preset</span><span>${escapeHtml(prefs().presetName || "none")}</span></div>
      <div class="fb21-v12-kv"><span>UI mode</span><span>${escapeHtml(localStorage.getItem(MODE_KEY) || "advanced")}</span></div>
      <div class="fb21-v12-nav">
        <button class="fb21-v12-btn primary" id="fb21-export-all">Export private backup</button>
        <button class="fb21-v12-btn" id="fb21-refresh-app">Refresh app cache</button>
        <button class="fb21-v12-btn fb21-v12-danger" id="fb21-clear-data">Clear FocusBridge21 local data</button>
      </div>
    `, (root) => {
      root.querySelector("#fb21-export-all").addEventListener("click", () => download(`focusbridge21-private-backup-${Date.now()}.json`, JSON.stringify(allDataPacket(), null, 2)));
      root.querySelector("#fb21-refresh-app").addEventListener("click", async () => {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((reg) => reg.update().catch(() => {})));
        }
        const names = await caches.keys().catch(() => []);
        alert(`Cache refresh requested. Known caches: ${names.join(", ") || "none"}. Hard refresh once after closing this.`);
      });
      root.querySelector("#fb21-clear-data").addEventListener("click", () => {
        const ok = prompt("Type CLEAR to remove FocusBridge21 local data from this browser.");
        if (ok !== "CLEAR") return;
        fbKeys().forEach((key) => localStorage.removeItem(key));
        alert("FocusBridge21 local browser data cleared. The page will reload.");
        location.reload();
      });
    });
  }

  function openSnapshot() {
    const rows = ledger();
    const r = readiness(rows);
    const s = streak(rows);
    const avgRet = avg(rows, (x) => x.post?.return_quality);
    const avgCo = avg(rows, (x) => x.post?.overall_coherence);
    const avgFear = avg(rows, (x) => x.during?.fear_or_resistance);
    openModal(`
      <h2>Practice Snapshot</h2>
      <p>This is a local-only view of your current training pattern. It is not a diagnosis or proof of reaching a state; it is a receipt summary.</p>
      <div class="fb21-v12-meter"><div style="width:${r}%"></div></div>
      <div class="fb21-v12-grid">
        <div class="fb21-v12-card"><strong>Release readiness</strong>${r}/100</div>
        <div class="fb21-v12-card"><strong>Current streak</strong>${s} day${s === 1 ? "" : "s"}</div>
        <div class="fb21-v12-card"><strong>Avg return</strong>${avgRet == null ? "—" : avgRet.toFixed(1)}</div>
        <div class="fb21-v12-card"><strong>Avg coherence</strong>${avgCo == null ? "—" : avgCo.toFixed(1)}</div>
        <div class="fb21-v12-card"><strong>Avg resistance</strong>${avgFear == null ? "—" : avgFear.toFixed(1)}</div>
        <div class="fb21-v12-card"><strong>Total receipts</strong>${rows.length}</div>
      </div>
      <div class="fb21-v12-card"><strong>Best next move</strong>${escapeHtml(bestNext(rows))}</div>
      <div class="fb21-v12-nav">
        <button class="fb21-v12-btn primary" id="fb21-go-readiness">Go to Readiness</button>
        <button class="fb21-v12-btn" id="fb21-go-command">Open Command Hub</button>
      </div>
    `, (root) => {
      root.querySelector("#fb21-go-readiness").addEventListener("click", () => { closeModal(); clickByText("Readiness"); });
      root.querySelector("#fb21-go-command").addEventListener("click", () => { closeModal(); clickByText("Command Hub"); });
    });
  }

  function clickByText(text) {
    const needle = text.toLowerCase();
    const el = [...document.querySelectorAll("button, a")].find((node) => (node.textContent || "").toLowerCase().includes(needle));
    if (el) el.click();
  }

  function markAdvancedLaunchers() {
    const patterns = ["coach", "studio lab", "guidance lab", "audio lab", "mastery lab", "pattern lab", "v1.0 hub", "release hub"];
    document.querySelectorAll("button, a").forEach((el) => {
      const text = (el.textContent || "").trim().toLowerCase();
      if (!text || text.includes("command hub")) return;
      if (patterns.some((p) => text.includes(p))) el.setAttribute("data-fb21-advanced", "true");
    });
  }

  function setMode(mode) {
    localStorage.setItem(MODE_KEY, mode);
    document.body.classList.toggle("fb21-beginner-mode", mode === "beginner");
    markAdvancedLaunchers();
    updateBarModeText();
  }

  function updateBarModeText() {
    const el = document.querySelector("#fb21-v12-mode-label");
    if (el) el.textContent = localStorage.getItem(MODE_KEY) === "beginner" ? "Beginner Mode" : "Advanced Mode";
  }

  function injectBar() {
    if (document.querySelector(".fb21-v12-bar")) return;
    const bar = document.createElement("section");
    bar.className = "fb21-v12-bar";
    bar.innerHTML = `
      <div>
        <div class="fb21-v12-title"><span>✦</span><div><div>v1.2 Experience Guide</div><div class="fb21-v12-subtitle">Cleaner onboarding, beginner mode, local privacy center, and practice snapshot.</div></div></div>
      </div>
      <div class="fb21-v12-actions">
        <button class="fb21-v12-btn primary" id="fb21-v12-tour">Start tour</button>
        <button class="fb21-v12-btn" id="fb21-v12-mode"><span id="fb21-v12-mode-label">Advanced Mode</span></button>
        <button class="fb21-v12-btn" id="fb21-v12-snapshot">Snapshot</button>
        <button class="fb21-v12-btn" id="fb21-v12-privacy">Privacy/Data</button>
      </div>
    `;
    const hero = document.querySelector("header.hero") || document.querySelector(".hero") || document.body.firstElementChild;
    if (hero && hero.parentNode) hero.parentNode.insertBefore(bar, hero.nextSibling);
    else document.body.prepend(bar);

    bar.querySelector("#fb21-v12-tour").addEventListener("click", () => openTour(0));
    bar.querySelector("#fb21-v12-mode").addEventListener("click", () => setMode(localStorage.getItem(MODE_KEY) === "beginner" ? "advanced" : "beginner"));
    bar.querySelector("#fb21-v12-snapshot").addEventListener("click", openSnapshot);
    bar.querySelector("#fb21-v12-privacy").addEventListener("click", openPrivacyCenter);
    updateBarModeText();
  }

  function init() {
    injectBar();
    setMode(localStorage.getItem(MODE_KEY) || "advanced");
    setTimeout(markAdvancedLaunchers, 500);
    setTimeout(markAdvancedLaunchers, 1500);

    if (!localStorage.getItem(TOUR_KEY) && ledger().length === 0) {
      const tip = document.createElement("div");
      tip.className = "fb21-v12-modal-backdrop";
      tip.innerHTML = `
        <section class="fb21-v12-modal">
          <button class="fb21-v12-btn fb21-v12-close" type="button">Close</button>
          <div class="fb21-v12-step">First run helper</div>
          <h2>Welcome to FocusBridge21</h2>
          <p>New here? The v1.2 tour explains the cleanest safe path: readiness, short session, return, receipt, and local data controls.</p>
          <div class="fb21-v12-nav">
            <button class="fb21-v12-btn" id="fb21-v12-not-now">Not now</button>
            <button class="fb21-v12-btn primary" id="fb21-v12-start-first-tour">Start tour</button>
          </div>
        </section>
      `;
      document.body.appendChild(tip);
      tip.querySelector(".fb21-v12-close").addEventListener("click", () => { localStorage.setItem(TOUR_KEY, "1"); tip.remove(); });
      tip.querySelector("#fb21-v12-not-now").addEventListener("click", () => { localStorage.setItem(TOUR_KEY, "1"); tip.remove(); });
      tip.querySelector("#fb21-v12-start-first-tour").addEventListener("click", () => { tip.remove(); openTour(0); });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
