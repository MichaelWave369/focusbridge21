(() => {
  const LEDGER_KEY = "focusbridge21-ledger-v1";
  const PREF_KEY = "focusbridge21-preferences-v2";
  const BACKUP_VERSION = "FocusBridge21 Backup v0.6";
  const PRESET_META = {
    Foundation: { gate: 10, base: 180, noise: "pink", intention: "Relax the body, stay gently awake, and return cleanly." },
    Expansion: { gate: 12, base: 200, noise: "pink", intention: "Widen awareness while staying calm, grounded, and observant." },
    "No-Time": { gate: 15, base: 210, noise: "brown", intention: "Rest in spaciousness while keeping a stable witness and clear return." },
    Bridge: { gate: 21, base: 220, noise: "pink", intention: "Stable witness at the threshold, no forcing, clean return, honest receipt." }
  };

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || ""); }
    catch { return fallback; }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function ledger() { return readJson(LEDGER_KEY, []); }
  function prefs() { return readJson(PREF_KEY, {}); }
  function byTime(rows) { return [...rows].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)); }
  function avg(nums) { const good = nums.filter(n => typeof n === "number" && !Number.isNaN(n)); return good.length ? good.reduce((a,b) => a+b, 0) / good.length : null; }
  function round(n) { return n == null ? "—" : (Math.round(n * 10) / 10).toFixed(1); }
  function esc(s) { return String(s ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c])); }

  function streak(rows) {
    const days = new Set(rows.map(r => (r.timestamp || "").slice(0, 10)).filter(Boolean));
    let count = 0;
    const d = new Date();
    for (;;) {
      const iso = d.toISOString().slice(0, 10);
      if (days.has(iso)) { count++; d.setDate(d.getDate() - 1); }
      else if (count === 0) { d.setDate(d.getDate() - 1); if (days.has(d.toISOString().slice(0, 10))) count++; else break; }
      else break;
    }
    return count;
  }

  function groupedBest(rows, keyFn) {
    const groups = new Map();
    rows.forEach(r => {
      const key = keyFn(r) || "unknown";
      const score = r.post?.overall_coherence ?? r.during?.stable_witness_presence ?? 0;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(score);
    });
    return [...groups.entries()]
      .map(([key, vals]) => ({ key, count: vals.length, avg: avg(vals) || 0 }))
      .filter(x => x.count >= 1)
      .sort((a, b) => b.avg - a.avg)[0] || null;
  }

  function analyze() {
    const rows = byTime(ledger());
    const recent = rows.slice(0, 7);
    const last = rows[0];
    const witness = avg(rows.map(r => r.during?.stable_witness_presence));
    const returnQuality = avg(rows.map(r => r.post?.return_quality));
    const coherence = avg(rows.map(r => r.post?.overall_coherence));
    const fear = avg(rows.map(r => r.during?.fear_or_resistance));
    const bestPreset = groupedBest(rows, r => r.preset);
    const bestDuration = groupedBest(rows, r => r.duration_min ? `${r.duration_min} min` : "unknown");
    const bestNoise = groupedBest(rows, r => r.audio_params?.noise);
    const bestBase = groupedBest(rows, r => r.audio_params?.base_hz ? `${r.audio_params.base_hz} Hz` : "unknown");
    const s = streak(rows);
    let recommendation = { preset: "Foundation", duration: 5, label: "Gentle Reset", reason: "No receipt pattern yet. Start with a short, safe baseline." };
    if (rows.length >= 3) {
      if ((returnQuality || 0) < 6 || (fear || 0) > 4) {
        recommendation = { preset: "Foundation", duration: 5, label: "Return Training", reason: "Recent pattern suggests strengthening safety and return before deeper threshold work." };
      } else if ((witness || 0) >= 7 && (returnQuality || 0) >= 7 && (fear || 0) <= 3) {
        recommendation = { preset: "Bridge", duration: 15, label: "Bridge Preview", reason: "Stable witness and return quality look strong enough for a short threshold-flavored run." };
      } else {
        recommendation = { preset: bestPreset?.key || "Expansion", duration: 15, label: "Training Session", reason: "Continue building capacity using the strongest observed preset so far." };
      }
    }
    return { rows, recent, last, witness, returnQuality, coherence, fear, bestPreset, bestDuration, bestNoise, bestBase, streak: s, recommendation };
  }

  function applySession(presetName, durationMin, intensity = "gentle") {
    const meta = PRESET_META[presetName] || PRESET_META.Foundation;
    const p = prefs();
    const intensityMap = {
      gentle: { volume: 0.11, noiseAmount: 0.025 },
      standard: { volume: 0.16, noiseAmount: 0.04 },
      deep: { volume: 0.22, noiseAmount: 0.065 }
    };
    const i = intensityMap[intensity] || intensityMap.gentle;
    const next = {
      ...p,
      presetName,
      durationMin,
      guidanceMode: p.guidanceMode || "Neutral",
      base: meta.base,
      noise: meta.noise,
      noiseAmount: i.noiseAmount,
      volume: i.volume,
      pre: {
        ...(p.pre || {}),
        intention: meta.intention,
        safe: true,
        headphones: true
      }
    };
    writeJson(PREF_KEY, next);
    alert(`${presetName} ${durationMin} min applied. The app will reload so the builder picks it up.`);
    location.reload();
  }

  function backupBlob() {
    const data = { version: BACKUP_VERSION, exported_at: new Date().toISOString(), keys: {} };
    Object.keys(localStorage).filter(k => k.startsWith("focusbridge21-")).sort().forEach(k => { data.keys[k] = localStorage.getItem(k); });
    return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  }

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function reportText() {
    const a = analyze();
    const lines = [];
    lines.push("# FocusBridge21 Weekly Review");
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push("");
    lines.push(`Receipts: ${a.rows.length}`);
    lines.push(`Practice streak: ${a.streak} day(s)`);
    lines.push(`Avg stable witness: ${round(a.witness)}`);
    lines.push(`Avg return quality: ${round(a.returnQuality)}`);
    lines.push(`Avg coherence: ${round(a.coherence)}`);
    lines.push(`Avg fear/resistance: ${round(a.fear)}`);
    lines.push("");
    lines.push("## Best observed conditions");
    lines.push(`Preset: ${a.bestPreset ? `${a.bestPreset.key} (${round(a.bestPreset.avg)})` : "—"}`);
    lines.push(`Duration: ${a.bestDuration ? `${a.bestDuration.key} (${round(a.bestDuration.avg)})` : "—"}`);
    lines.push(`Noise: ${a.bestNoise ? `${a.bestNoise.key} (${round(a.bestNoise.avg)})` : "—"}`);
    lines.push(`Base: ${a.bestBase ? `${a.bestBase.key} (${round(a.bestBase.avg)})` : "—"}`);
    lines.push("");
    lines.push("## Next recommended practice");
    lines.push(`${a.recommendation.label}: ${a.recommendation.preset}, ${a.recommendation.duration} min`);
    lines.push(a.recommendation.reason);
    lines.push("");
    lines.push("Claim boundary: subjective self-report and local training pattern, not medical or objective-state evidence.");
    return lines.join("\n");
  }

  function sevenDayPlan() {
    const a = analyze();
    const base = a.recommendation.preset;
    const plans = [
      ["Day 1", "Foundation", 5, "Ground, breathe, clean return."],
      ["Day 2", base === "Bridge" ? "Expansion" : base, 5, "Capacity practice, no forcing."],
      ["Day 3", "Rest / Breath Pacer", 3, "Only grounding if tired."],
      ["Day 4", base, a.recommendation.duration, "Main practice window."],
      ["Day 5", "Foundation", 5, "Return training and body anchor."],
      ["Day 6", a.returnQuality >= 7 ? "Bridge" : "Expansion", a.returnQuality >= 7 ? 15 : 5, "Only deepen if return is clean."],
      ["Day 7", "Review", 10, "Read receipts and write one insight."]
    ];
    return plans;
  }

  async function toneTest(kind = "soft") {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return alert("Web Audio is not available in this browser.");
    const ctx = new AudioContext();
    await ctx.resume();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = kind === "low" ? 174 : kind === "high" ? 528 : 220;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(kind === "soft" ? 0.09 : 0.14, t + 0.25);
    gain.gain.setValueAtTime(kind === "soft" ? 0.09 : 0.14, t + 1.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1.7);
    setTimeout(() => ctx.close(), 1900);
  }

  function render(tab = "today") {
    const a = analyze();
    const p = prefs();
    const body = document.querySelector("#fb21-v06-body");
    const tabs = document.querySelectorAll(".fb21-v06-tab");
    tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
    if (!body) return;

    if (tab === "today") {
      body.innerHTML = `
        <div class="fb21-v06-grid">
          <div class="fb21-v06-card"><h3>Receipts</h3><div class="fb21-v06-kpi">${a.rows.length}</div><p>Local browser entries.</p></div>
          <div class="fb21-v06-card"><h3>Streak</h3><div class="fb21-v06-kpi">${a.streak}</div><p>Day(s) with practice nearby.</p></div>
          <div class="fb21-v06-card"><h3>Coherence</h3><div class="fb21-v06-kpi">${round(a.coherence)}</div><p>Average self-rated integration.</p></div>
        </div>
        <div class="fb21-v06-grid two" style="margin-top:12px">
          <div class="fb21-v06-card">
            <h3>Recommended next practice</h3>
            <p><strong>${esc(a.recommendation.label)}</strong>: ${esc(a.recommendation.preset)} • ${a.recommendation.duration} min</p>
            <p>${esc(a.recommendation.reason)}</p>
            <div class="fb21-v06-actions">
              <button class="fb21-v06-action primary" data-apply="recommended">Apply recommendation</button>
              <button class="fb21-v06-action" data-apply="gentle">Apply Gentle Reset</button>
              <button class="fb21-v06-action" data-apply="bridge">Apply Bridge Preview</button>
            </div>
          </div>
          <div class="fb21-v06-card">
            <h3>Best conditions so far</h3>
            <div class="fb21-v06-pillrow">
              <span class="fb21-v06-pill">Preset: ${a.bestPreset ? esc(a.bestPreset.key) : "—"}</span>
              <span class="fb21-v06-pill">Duration: ${a.bestDuration ? esc(a.bestDuration.key) : "—"}</span>
              <span class="fb21-v06-pill">Noise: ${a.bestNoise ? esc(a.bestNoise.key) : "—"}</span>
              <span class="fb21-v06-pill">Base: ${a.bestBase ? esc(a.bestBase.key) : "—"}</span>
            </div>
            <p>Current saved builder: ${esc(p.presetName || "—")} • ${esc(p.durationMin || "—")} min • volume ${esc(p.volume ?? "—")}</p>
          </div>
        </div>`;
    }

    if (tab === "backup") {
      body.innerHTML = `
        <div class="fb21-v06-grid two">
          <div class="fb21-v06-card">
            <h3>Private Backup Vault</h3>
            <p>Export all FocusBridge21 browser-local keys: receipts, preferences, Pattern Lab data, and coach data.</p>
            <div class="fb21-v06-actions"><button class="fb21-v06-action primary" id="fb21-v06-backup">Download full backup</button></div>
          </div>
          <div class="fb21-v06-card">
            <h3>Restore backup</h3>
            <p>Restores keys from a backup JSON. This overwrites matching local keys in this browser.</p>
            <input class="fb21-v06-file" type="file" id="fb21-v06-restore" accept="application/json" />
          </div>
        </div>
        <div class="fb21-v06-card" style="margin-top:12px"><h3>Privacy note</h3><p>This backup is a plain JSON file. Keep it private if your session notes are private.</p></div>`;
    }

    if (tab === "review") {
      const plan = sevenDayPlan();
      body.innerHTML = `
        <div class="fb21-v06-grid two">
          <div class="fb21-v06-card"><h3>Weekly review</h3><div class="fb21-v06-report">${esc(reportText())}</div><div class="fb21-v06-actions"><button class="fb21-v06-action primary" id="fb21-v06-copy-review">Copy review</button><button class="fb21-v06-action" id="fb21-v06-download-review">Download .md</button></div></div>
          <div class="fb21-v06-card"><h3>7-day smooth plan</h3><ul>${plan.map(x => `<li><strong>${esc(x[0])}</strong>: ${esc(x[1])} • ${x[2]} min — ${esc(x[3])}</li>`).join("")}</ul></div>
        </div>`;
    }

    if (tab === "comfort") {
      body.innerHTML = `
        <div class="fb21-v06-grid two">
          <div class="fb21-v06-card">
            <h3>Comfort profile</h3>
            <p>Choose a conservative audio intensity. This writes safe defaults into the main builder preferences.</p>
            <select class="fb21-v06-select" id="fb21-v06-comfort">
              <option value="gentle">Very Gentle — low volume, subtle noise</option>
              <option value="standard">Standard — balanced</option>
              <option value="deep">Deep — stronger, still conservative</option>
            </select>
            <div class="fb21-v06-actions"><button class="fb21-v06-action primary" id="fb21-v06-apply-comfort">Apply to current preset</button></div>
          </div>
          <div class="fb21-v06-card">
            <h3>Quick tone checks</h3>
            <p>Short, soft Web Audio checks for comfort before a session.</p>
            <div class="fb21-v06-actions"><button class="fb21-v06-action" data-tone="soft">Soft tone</button><button class="fb21-v06-action" data-tone="low">Low tone</button><button class="fb21-v06-action" data-tone="high">High tone</button></div>
          </div>
        </div>`;
    }

    wireBody(tab, a);
  }

  function wireBody(tab, a) {
    document.querySelectorAll("[data-apply]").forEach(btn => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.apply;
        if (mode === "recommended") applySession(a.recommendation.preset, a.recommendation.duration, "gentle");
        if (mode === "gentle") applySession("Foundation", 5, "gentle");
        if (mode === "bridge") applySession("Bridge", 5, "gentle");
      });
    });
    const backup = document.querySelector("#fb21-v06-backup");
    if (backup) backup.addEventListener("click", () => download(backupBlob(), `focusbridge21-backup-${Date.now()}.json`));
    const restore = document.querySelector("#fb21-v06-restore");
    if (restore) restore.addEventListener("change", async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.keys || typeof data.keys !== "object") throw new Error("No backup keys found");
        Object.entries(data.keys).forEach(([k, v]) => { if (k.startsWith("focusbridge21-")) localStorage.setItem(k, String(v)); });
        alert("Backup restored. Reloading now.");
        location.reload();
      } catch (err) { alert(`Restore failed: ${err.message || err}`); }
    });
    const copy = document.querySelector("#fb21-v06-copy-review");
    if (copy) copy.addEventListener("click", () => navigator.clipboard?.writeText(reportText()).then(() => alert("Review copied."), () => alert("Copy failed.")));
    const dl = document.querySelector("#fb21-v06-download-review");
    if (dl) dl.addEventListener("click", () => download(new Blob([reportText()], { type: "text/markdown" }), `focusbridge21-review-${Date.now()}.md`));
    const comfort = document.querySelector("#fb21-v06-apply-comfort");
    if (comfort) comfort.addEventListener("click", () => {
      const choice = document.querySelector("#fb21-v06-comfort")?.value || "gentle";
      const p = prefs();
      applySession(p.presetName || "Foundation", p.durationMin || 5, choice);
    });
    document.querySelectorAll("[data-tone]").forEach(btn => btn.addEventListener("click", () => toneTest(btn.dataset.tone)));
  }

  function mount() {
    if (document.querySelector("#fb21-v06-btn")) return;
    const btn = document.createElement("button");
    btn.id = "fb21-v06-btn";
    btn.className = "fb21-v06-btn";
    btn.textContent = "✧ Studio Lab";
    document.body.appendChild(btn);

    const modal = document.createElement("div");
    modal.className = "fb21-v06-backdrop";
    modal.innerHTML = `
      <div class="fb21-v06-modal" role="dialog" aria-modal="true" aria-label="FocusBridge21 Studio Lab">
        <div class="fb21-v06-head">
          <div><h2>FocusBridge21 Studio Lab v0.6</h2><p>Backup vault, weekly review, comfort profile, and smoother next-practice setup.</p></div>
          <button class="fb21-v06-close" aria-label="Close">×</button>
        </div>
        <div class="fb21-v06-tabs">
          <button class="fb21-v06-tab active" data-tab="today">Today</button>
          <button class="fb21-v06-tab" data-tab="backup">Backup Vault</button>
          <button class="fb21-v06-tab" data-tab="review">Weekly Review</button>
          <button class="fb21-v06-tab" data-tab="comfort">Comfort</button>
        </div>
        <div id="fb21-v06-body" class="fb21-v06-body"></div>
      </div>`;
    document.body.appendChild(modal);

    btn.addEventListener("click", () => { modal.classList.add("open"); render("today"); });
    modal.querySelector(".fb21-v06-close").addEventListener("click", () => modal.classList.remove("open"));
    modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("open"); });
    modal.querySelectorAll(".fb21-v06-tab").forEach(t => t.addEventListener("click", () => render(t.dataset.tab)));
  }

  window.addEventListener("load", () => setTimeout(mount, 350));
})();
