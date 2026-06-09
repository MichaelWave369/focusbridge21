(() => {
  const VERSION = "v1.0 Release Hub";
  const LEDGER_KEY = "focusbridge21-ledger-v1";
  const PREF_KEY = "focusbridge21-preferences-v2";
  const RELEASE_KEY = "focusbridge21-v1-release-state";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || ""); }
    catch (_) { return fallback; }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function safeNumber(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function avg(rows, pick) {
    const vals = rows.map(pick).filter((v) => typeof v === "number" && Number.isFinite(v));
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
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

  function localStorageBytes() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key) || "";
      total += key.length + value.length;
    }
    return total;
  }

  function collectFocusData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("focusbridge21")) {
        data[key] = localStorage.getItem(key);
      }
    }
    return data;
  }

  function parseLedger() {
    const rows = readJson(LEDGER_KEY, []);
    return Array.isArray(rows) ? rows : [];
  }

  function daysBetween(a, b) {
    const one = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const two = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((two - one) / 86400000);
  }

  function streak(rows) {
    const days = [...new Set(rows.map((r) => (r.timestamp || "").slice(0, 10)).filter(Boolean))].sort().reverse();
    if (!days.length) return 0;
    const today = new Date();
    const first = new Date(days[0] + "T00:00:00");
    const gap = daysBetween(first, today);
    if (gap > 1) return 0;
    let count = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1] + "T00:00:00");
      const curr = new Date(days[i] + "T00:00:00");
      if (daysBetween(curr, prev) === 1) count += 1;
      else break;
    }
    return count;
  }

  function bestBy(rows, picker) {
    if (!rows.length) return null;
    return [...rows].sort((a, b) => safeNumber(picker(b)) - safeNumber(picker(a)))[0];
  }

  function groupedBest(rows, keyFn) {
    const map = new Map();
    rows.forEach((r) => {
      const key = keyFn(r) || "unknown";
      const val = safeNumber(r.post?.overall_coherence, 0) + safeNumber(r.post?.return_quality, 0) + safeNumber(r.during?.stable_witness_presence, 0) - safeNumber(r.during?.fear_or_resistance, 0) * 0.5;
      const current = map.get(key) || { key, count: 0, score: 0 };
      current.count += 1;
      current.score += val;
      map.set(key, current);
    });
    return [...map.values()].sort((a, b) => (b.score / b.count) - (a.score / a.count))[0] || null;
  }

  function environment() {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    return {
      url: location.href,
      online: navigator.onLine,
      serviceWorker: "serviceWorker" in navigator,
      audioContext: !!(window.AudioContext || window.webkitAudioContext),
      speech: "speechSynthesis" in window,
      localStorage: (() => {
        try { localStorage.setItem("focusbridge21-test", "1"); localStorage.removeItem("focusbridge21-test"); return true; }
        catch (_) { return false; }
      })(),
      standalone
    };
  }

  function releaseScore(rows, env) {
    const checks = [
      env.localStorage,
      env.audioContext,
      env.serviceWorker,
      rows.length >= 1,
      rows.length >= 3,
      streak(rows) >= 1,
      avg(rows, (r) => safeNumber(r.post?.return_quality, NaN)) >= 7,
      avg(rows, (r) => safeNumber(r.during?.fear_or_resistance, NaN)) <= 3,
      env.speech,
      env.standalone || rows.length >= 1
    ];
    const passed = checks.filter(Boolean).length;
    return Math.round((passed / checks.length) * 100);
  }

  function recommendation(rows) {
    if (!rows.length) {
      return {
        title: "Start with the 2-minute demo",
        body: "No receipts yet. Run Foundation for 2 minutes, use RETURN NOW once, and write the first receipt.",
        prefs: { presetName: "Foundation", durationMin: 2, guidanceMode: "Neutral", base: 180, noise: "pink", noiseAmount: 0.03, volume: 0.13 }
      };
    }
    const avgReturn = avg(rows, (r) => safeNumber(r.post?.return_quality, NaN)) || 0;
    const avgFear = avg(rows, (r) => safeNumber(r.during?.fear_or_resistance, NaN)) || 0;
    const avgWitness = avg(rows, (r) => safeNumber(r.during?.stable_witness_presence, NaN)) || 0;
    const bestPreset = groupedBest(rows, (r) => r.preset)?.key || "Foundation";
    const bestNoise = groupedBest(rows, (r) => r.audio_params?.noise)?.key || "pink";
    if (avgReturn < 7 || avgFear > 3.5) {
      return {
        title: "Stabilize with Gentle Reset",
        body: "Return quality or resistance suggests a softer session. Train clean return before deeper bridge work.",
        prefs: { presetName: "Foundation", durationMin: 5, guidanceMode: "Neutral", base: 180, noise: "pink", noiseAmount: 0.03, volume: 0.12 }
      };
    }
    if (avgWitness >= 7 && avgReturn >= 8 && avgFear <= 2.5) {
      return {
        title: "Bridge Preview is reasonable",
        body: "Witness and return are trending stable. Keep it short and receipt-driven.",
        prefs: { presetName: "Bridge", durationMin: 5, guidanceMode: "Resonance Architect", base: 220, noise: bestNoise, noiseAmount: 0.04, volume: 0.14 }
      };
    }
    return {
      title: `Build on ${bestPreset}`,
      body: "The pattern is usable. Continue short, clean sessions and watch return quality.",
      prefs: { presetName: bestPreset, durationMin: 15, guidanceMode: "Neutral", base: bestPreset === "Bridge" ? 220 : bestPreset === "No-Time" ? 210 : bestPreset === "Expansion" ? 200 : 180, noise: bestNoise, noiseAmount: 0.04, volume: 0.14 }
    };
  }

  function applyPrefs(prefs) {
    const current = readJson(PREF_KEY, {});
    const merged = {
      ...current,
      ...prefs,
      pre: {
        ...(current.pre || {}),
        intention: prefs.presetName === "Bridge"
          ? "Stable witness at the threshold, no forcing, clean return, honest receipt."
          : "Train gently, stay grounded, return cleanly, and write the receipt."
      }
    };
    writeJson(PREF_KEY, merged);
    toast("v1.0 practice defaults applied. Reloading the cockpit…");
    setTimeout(() => location.reload(), 700);
  }

  function toast(message) {
    let node = $(".fb21-v10-toast");
    if (!node) {
      node = document.createElement("div");
      node.className = "fb21-v10-toast";
      node.style.cssText = "position:fixed;left:18px;bottom:76px;z-index:10050;border:1px solid rgba(255,215,166,.35);background:rgba(8,8,20,.96);color:#f5f0ff;border-radius:16px;padding:12px 14px;box-shadow:0 18px 60px rgba(0,0,0,.45);max-width:min(420px,calc(100vw - 36px));";
      document.body.appendChild(node);
    }
    node.textContent = message;
    clearTimeout(node._timer);
    node._timer = setTimeout(() => node.remove(), 3200);
  }

  function releaseMarkdown(rows, env, score) {
    const s = streak(rows);
    const best = bestBy(rows, (r) => safeNumber(r.post?.overall_coherence, 0));
    const bestPreset = groupedBest(rows, (r) => r.preset);
    const bestNoise = groupedBest(rows, (r) => r.audio_params?.noise);
    const avgWitness = avg(rows, (r) => safeNumber(r.during?.stable_witness_presence, NaN));
    const avgReturn = avg(rows, (r) => safeNumber(r.post?.return_quality, NaN));
    const avgCoherence = avg(rows, (r) => safeNumber(r.post?.overall_coherence, NaN));
    const avgFear = avg(rows, (r) => safeNumber(r.during?.fear_or_resistance, NaN));
    return `# FocusBridge21 v1.0 Release Report\n\nGenerated: ${new Date().toLocaleString()}\n\n## Release Score\n\n${score}/100\n\n## Local Practice Summary\n\n- Receipts: ${rows.length}\n- Current streak: ${s}\n- Average witness: ${avgWitness == null ? "—" : avgWitness.toFixed(1)}\n- Average return quality: ${avgReturn == null ? "—" : avgReturn.toFixed(1)}\n- Average coherence: ${avgCoherence == null ? "—" : avgCoherence.toFixed(1)}\n- Average resistance: ${avgFear == null ? "—" : avgFear.toFixed(1)}\n\n## Best Conditions\n\n- Best preset: ${bestPreset ? `${bestPreset.key} (${bestPreset.count} receipts)` : "—"}\n- Best noise: ${bestNoise ? `${bestNoise.key} (${bestNoise.count} receipts)` : "—"}\n- Best receipt: ${best ? `${best.preset} • ${best.duration_min} min • coherence ${best.post?.overall_coherence ?? "—"}` : "—"}\n\n## Environment\n\n- Online: ${env.online}\n- Service Worker: ${env.serviceWorker}\n- Web Audio: ${env.audioContext}\n- Voice Guide: ${env.speech}\n- Local Storage: ${env.localStorage}\n- Installed/Standalone: ${!!env.standalone}\n\n## Claim Boundary\n\nSubjective self-report and personal training receipts only. No medical, clinical, guaranteed altered-state, or objective Focus-state claim.\n`;
  }

  function releasePacket(rows, env, score) {
    return {
      product: "FocusBridge21",
      version: VERSION,
      generated_at: new Date().toISOString(),
      release_score: score,
      claim_boundary: "subjective self-report; local training receipts; no medical, clinical, objective-state, or guaranteed altered-state claim",
      environment: env,
      local_summary: summarize(rows),
      local_storage_export: collectFocusData()
    };
  }

  function summarize(rows) {
    return {
      receipt_count: rows.length,
      streak: streak(rows),
      avg_witness: avg(rows, (r) => safeNumber(r.during?.stable_witness_presence, NaN)),
      avg_return: avg(rows, (r) => safeNumber(r.post?.return_quality, NaN)),
      avg_coherence: avg(rows, (r) => safeNumber(r.post?.overall_coherence, NaN)),
      avg_resistance: avg(rows, (r) => safeNumber(r.during?.fear_or_resistance, NaN)),
      best_preset: groupedBest(rows, (r) => r.preset),
      best_noise: groupedBest(rows, (r) => r.audio_params?.noise),
      best_base_hz: groupedBest(rows, (r) => String(r.audio_params?.base_hz || "unknown"))
    };
  }

  function render() {
    const rows = parseLedger();
    const prefs = readJson(PREF_KEY, {});
    const env = environment();
    const state = readJson(RELEASE_KEY, {});
    const score = releaseScore(rows, env);
    const rec = recommendation(rows);
    const summary = summarize(rows);
    const markdown = releaseMarkdown(rows, env, score);
    const storageKb = (localStorageBytes() / 1024).toFixed(1);
    const releaseMarked = state.accepted_at ? `Marked v1.0 on ${new Date(state.accepted_at).toLocaleString()}` : "Not marked yet";

    return `
      <div class="fb21-v10-head">
        <div>
          <h2 class="fb21-v10-title">FocusBridge21 ${VERSION}</h2>
          <p class="fb21-v10-subtitle">Release cockpit, privacy center, safety charter, data health, and launch packet.</p>
        </div>
        <button class="fb21-v10-close" data-v10-close>Close</button>
      </div>
      <div class="fb21-v10-body">
        <div class="fb21-v10-banner"><strong>v1.0 posture:</strong> local-first, installable, receipt-driven, safety-bound, and claim-disciplined. This hub helps you verify the app is ready for real practice and public sharing.</div>
        <div class="fb21-v10-tabs">
          <button class="fb21-v10-tab active" data-v10-tab="launch">Launch</button>
          <button class="fb21-v10-tab" data-v10-tab="safety">Safety</button>
          <button class="fb21-v10-tab" data-v10-tab="data">Data</button>
          <button class="fb21-v10-tab" data-v10-tab="roadmap">Roadmap</button>
          <button class="fb21-v10-tab" data-v10-tab="packet">Packet</button>
        </div>

        <section class="fb21-v10-pane" data-v10-pane="launch">
          <div class="fb21-v10-grid">
            <div class="fb21-v10-card">
              <h3>Release Readiness</h3>
              <div class="fb21-v10-score">${score}</div>
              <p class="fb21-v10-muted">${score >= 80 ? "Green: this browser is ready for v1.0 practice." : score >= 60 ? "Yellow: usable, but one or two pieces can be improved." : "Red: start with a demo and backup before deeper use."}</p>
              <div class="fb21-v10-pillrow">
                <span class="fb21-v10-pill ${env.localStorage ? "fb21-v10-good" : "fb21-v10-bad"}">Local storage ${env.localStorage ? "OK" : "blocked"}</span>
                <span class="fb21-v10-pill ${env.audioContext ? "fb21-v10-good" : "fb21-v10-bad"}">Web Audio ${env.audioContext ? "OK" : "missing"}</span>
                <span class="fb21-v10-pill ${env.serviceWorker ? "fb21-v10-good" : "fb21-v10-warn"}">Offline shell ${env.serviceWorker ? "available" : "missing"}</span>
                <span class="fb21-v10-pill ${env.standalone ? "fb21-v10-good" : "fb21-v10-warn"}">Install ${env.standalone ? "active" : "optional"}</span>
              </div>
            </div>
            <div class="fb21-v10-card">
              <h3>Recommended v1.0 Practice</h3>
              <p><strong>${rec.title}</strong></p>
              <p class="fb21-v10-muted">${rec.body}</p>
              <div class="fb21-v10-pillrow">
                <span class="fb21-v10-pill">${rec.prefs.presetName}</span>
                <span class="fb21-v10-pill">${rec.prefs.durationMin} min</span>
                <span class="fb21-v10-pill">${rec.prefs.noise}</span>
                <span class="fb21-v10-pill">${rec.prefs.base} Hz</span>
              </div>
              <div class="fb21-v10-actions">
                <button class="fb21-v10-action primary" data-v10-apply-rec>Apply recommendation</button>
                <button class="fb21-v10-action" data-v10-demo>Apply 2-min demo</button>
              </div>
            </div>
            <div class="fb21-v10-card">
              <h3>Practice Snapshot</h3>
              <ul class="fb21-v10-list">
                <li>Receipts: <strong>${rows.length}</strong></li>
                <li>Streak: <strong>${streak(rows)}</strong></li>
                <li>Avg witness: <strong>${summary.avg_witness == null ? "—" : summary.avg_witness.toFixed(1)}</strong></li>
                <li>Avg return: <strong>${summary.avg_return == null ? "—" : summary.avg_return.toFixed(1)}</strong></li>
                <li>Best preset: <strong>${summary.best_preset?.key || "—"}</strong></li>
              </ul>
            </div>
          </div>
        </section>

        <section class="fb21-v10-pane" data-v10-pane="safety" hidden>
          <div class="fb21-v10-grid two">
            <div class="fb21-v10-card">
              <h3>Safety Charter</h3>
              <ul class="fb21-v10-list">
                <li>No driving, machinery, or unsafe environments.</li>
                <li>Volume low first. Stereo check before deeper sessions.</li>
                <li>RETURN NOW is always valid. No session is more important than stability.</li>
                <li>Use Foundation when tired, stressed, dizzy, pressured, or emotionally unsettled.</li>
                <li>Do not treat receipts as medical data, proof of altered state, or objective Focus-level verification.</li>
              </ul>
            </div>
            <div class="fb21-v10-card">
              <h3>v1.0 Claim Boundary</h3>
              <p class="fb21-v10-muted">FocusBridge21 trains capacities: relaxation, stable witness, safe return, journaling, pattern recognition, and self-observation. It does not diagnose, treat, guarantee Focus 21, prove out-of-body experience, or replace professional support.</p>
              <div class="fb21-v10-actions">
                <button class="fb21-v10-action primary" data-v10-mark>Mark v1.0 safety read</button>
              </div>
              <p class="fb21-v10-soft">${releaseMarked}</p>
            </div>
          </div>
        </section>

        <section class="fb21-v10-pane" data-v10-pane="data" hidden>
          <div class="fb21-v10-grid">
            <div class="fb21-v10-card">
              <h3>Data Health</h3>
              <ul class="fb21-v10-list">
                <li>Browser data size: <strong>${storageKb} KB</strong></li>
                <li>FocusBridge21 keys: <strong>${Object.keys(collectFocusData()).length}</strong></li>
                <li>Latest receipt: <strong>${rows[0]?.timestamp ? new Date(rows[0].timestamp).toLocaleString() : "—"}</strong></li>
                <li>Preferences found: <strong>${Object.keys(prefs || {}).length ? "yes" : "no"}</strong></li>
              </ul>
            </div>
            <div class="fb21-v10-card">
              <h3>Private Backup</h3>
              <p class="fb21-v10-muted">Export a full local backup before clearing browser data or changing devices. This file may include private notes, so store it carefully.</p>
              <div class="fb21-v10-actions">
                <button class="fb21-v10-action primary" data-v10-backup>Export v1 backup</button>
              </div>
            </div>
            <div class="fb21-v10-card">
              <h3>Data Principles</h3>
              <ul class="fb21-v10-list">
                <li>Local-first by default.</li>
                <li>No server database in this Pages app.</li>
                <li>Exports are user-controlled.</li>
                <li>Private notes stay hidden from receipt cards unless intentionally exported.</li>
              </ul>
            </div>
          </div>
        </section>

        <section class="fb21-v10-pane" data-v10-pane="roadmap" hidden>
          <div class="fb21-v10-grid two">
            <div class="fb21-v10-card">
              <h3>v1.0 Completion Checklist</h3>
              <ul class="fb21-v10-list">
                <li class="${rows.length >= 1 ? "fb21-v10-good" : "fb21-v10-warn"}">First receipt written</li>
                <li class="${rows.length >= 3 ? "fb21-v10-good" : "fb21-v10-warn"}">Three-session pattern started</li>
                <li class="${env.serviceWorker ? "fb21-v10-good" : "fb21-v10-warn"}">Offline cache available</li>
                <li class="${env.audioContext ? "fb21-v10-good" : "fb21-v10-bad"}">Web Audio supported</li>
                <li class="${env.speech ? "fb21-v10-good" : "fb21-v10-warn"}">Voice Guide available</li>
                <li class="${state.accepted_at ? "fb21-v10-good" : "fb21-v10-warn"}">Safety charter marked</li>
              </ul>
            </div>
            <div class="fb21-v10-card">
              <h3>v1.1 Next Lane</h3>
              <ul class="fb21-v10-list">
                <li>Deeper charting without sending data anywhere.</li>
                <li>Optional encrypted backup passphrase.</li>
                <li>Session templates by time of day.</li>
                <li>Better mobile one-hand cockpit controls.</li>
                <li>Guided setup tour for first-time visitors.</li>
              </ul>
            </div>
          </div>
        </section>

        <section class="fb21-v10-pane" data-v10-pane="packet" hidden>
          <div class="fb21-v10-grid two">
            <div class="fb21-v10-card">
              <h3>Release Packet</h3>
              <p class="fb21-v10-muted">Download a v1.0 package with environment checks, local summary, claim boundary, and local FocusBridge21 storage export.</p>
              <div class="fb21-v10-actions">
                <button class="fb21-v10-action primary" data-v10-packet>Download JSON packet</button>
                <button class="fb21-v10-action" data-v10-report>Download Markdown report</button>
                <button class="fb21-v10-action" data-v10-copy>Copy report</button>
              </div>
            </div>
            <div class="fb21-v10-card">
              <h3>Report Preview</h3>
              <div class="fb21-v10-report">${escapeHtml(markdown)}</div>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function bind(modal) {
    const rows = parseLedger();
    const env = environment();
    const score = releaseScore(rows, env);
    const rec = recommendation(rows);
    const markdown = releaseMarkdown(rows, env, score);

    $$("[data-v10-tab]", modal).forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.v10Tab;
        $$("[data-v10-tab]", modal).forEach((b) => b.classList.toggle("active", b === btn));
        $$("[data-v10-pane]", modal).forEach((pane) => pane.hidden = pane.dataset.v10Pane !== name);
      });
    });

    $("[data-v10-close]", modal)?.addEventListener("click", close);
    $("[data-v10-apply-rec]", modal)?.addEventListener("click", () => applyPrefs(rec.prefs));
    $("[data-v10-demo]", modal)?.addEventListener("click", () => applyPrefs({ presetName: "Foundation", durationMin: 2, guidanceMode: "Neutral", base: 180, noise: "pink", noiseAmount: 0.03, volume: 0.12 }));
    $("[data-v10-backup]", modal)?.addEventListener("click", () => download(`focusbridge21-v1-backup-${Date.now()}.json`, JSON.stringify(releasePacket(rows, env, score), null, 2)));
    $("[data-v10-packet]", modal)?.addEventListener("click", () => download(`focusbridge21-v1-release-packet-${Date.now()}.json`, JSON.stringify(releasePacket(rows, env, score), null, 2)));
    $("[data-v10-report]", modal)?.addEventListener("click", () => download(`focusbridge21-v1-release-report-${Date.now()}.md`, markdown, "text/markdown"));
    $("[data-v10-copy]", modal)?.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(markdown); toast("v1.0 report copied."); }
      catch (_) { toast("Copy blocked by browser. Download the Markdown report instead."); }
    });
    $("[data-v10-mark]", modal)?.addEventListener("click", () => {
      writeJson(RELEASE_KEY, { accepted_at: new Date().toISOString(), version: VERSION });
      toast("v1.0 safety charter marked.");
      open();
    });
  }

  function open() {
    let backdrop = $(".fb21-v10-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "fb21-v10-backdrop";
      backdrop.innerHTML = `<div class="fb21-v10-modal" role="dialog" aria-modal="true" aria-label="FocusBridge21 v1.0 Release Hub"></div>`;
      document.body.appendChild(backdrop);
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) close();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") close();
      });
    }
    const modal = $(".fb21-v10-modal", backdrop);
    modal.innerHTML = render();
    bind(modal);
    backdrop.classList.add("open");
  }

  function close() {
    $(".fb21-v10-backdrop")?.classList.remove("open");
  }

  function init() {
    if ($(".fb21-v10-button")) return;
    const btn = document.createElement("button");
    btn.className = "fb21-v10-button";
    btn.type = "button";
    btn.textContent = "◎ v1.0 Hub";
    btn.addEventListener("click", open);
    document.body.appendChild(btn);

    const state = readJson(RELEASE_KEY, {});
    if (!state.first_seen_at) {
      writeJson(RELEASE_KEY, { ...state, first_seen_at: new Date().toISOString(), version: VERSION });
      setTimeout(() => toast("FocusBridge21 v1.0 Hub is live. Open it for release checks and backup."), 1200);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
