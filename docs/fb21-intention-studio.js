/* FocusBridge21 Intention Studio v2.7
 * Conscious, voluntary reflection scripts. Browser-local by default.
 * No covert prompts, subliminal audio, sleep-learning or efficacy claims.
 */
(() => {
  "use strict";
  const STORAGE_KEY = "focusbridge21-intention-library-v27";
  const MAX_ENTRIES = 12;
  const MAX_TITLE = 60;
  const MAX_SCRIPT = 800;
  const CADENCES = Object.freeze({ once: 0, "3m": 180, "5m": 300 });
  const MIX_KEYS = Object.freeze(["surf", "bass", "beat", "rain", "wind", "hum"]);
  const clean = (value, limit) => String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ").trim().slice(0, limit);
  const clamp = value => Math.max(0, Math.min(100, Number(value) || 0));
  const validCadence = value => Object.hasOwn(CADENCES, value) ? value : "once";

  function normalizeMix(raw = {}) {
    const mix = {};
    for (const key of MIX_KEYS)
      mix[key] = Math.round(clamp(raw[key]));
    mix.tones = raw.tones === true;
    mix.humNote = /^[A-G]#?[3-5]$/.test(String(raw.humNote || "")) ?
      String(raw.humNote) : "C4";
    return mix;
  }

  function normalize(raw = {}) {
    const title = clean(raw.title, MAX_TITLE) || "Untitled intention";
    return {
      id: /^s-[a-z0-9-]{1,50}$/.test(String(raw.id || "")) ? String(raw.id) : "",
      title, script: clean(raw.script, MAX_SCRIPT),
      cadence: validCadence(raw.cadence),
      mix: normalizeMix(raw.mix)
    };
  }

  function normalizeEntries(value) {
    const raw = Array.isArray(value) ? value :
      value && Array.isArray(value.entries) ? value.entries : [];
    const seen = new Set(), entries = [];
    for (const item of raw) {
      const p = normalize(item);
      if (!p.id || !p.script || seen.has(p.id)) continue;
      seen.add(p.id);
      entries.push(p);
      if (entries.length >= MAX_ENTRIES) break;
    }
    return entries;
  }

  function load(storage) {
    try {
      return normalizeEntries(JSON.parse(storage.getItem(STORAGE_KEY) || "[]"));
    } catch { return []; }
  }

  function upsert(entries, draft) {
    const current = normalizeEntries(entries);
    const next = normalize(draft);
    if (!next.script) throw new Error("Write an intention before saving.");
    const matching = current.findIndex(entry => entry.id === next.id);
    if (matching < 0 && current.length >= MAX_ENTRIES)
      throw new Error("The local library holds 12 scripts. Delete one before adding another.");
    if (matching < 0) {
      // Non-authoritative browser-local identifier, not a security token.
      next.id = "s-" + Date.now().toString(36) + "-" +
        Math.random().toString(36).slice(2, 10);
    }
    const updated = current.slice();
    if (matching >= 0) updated[matching] = next;
    else updated.unshift(next);
    return { entries: updated, saved: next };
  }

  function remove(entries, id) {
    return normalizeEntries(entries).filter(item => item.id !== id);
  }

  function persist(storage, entries) {
    storage.setItem(STORAGE_KEY, JSON.stringify(normalizeEntries(entries)));
  }

  function textForSpeech(value) {
    const script = clean(value, MAX_SCRIPT);
    return script ? "Your chosen intention: " + script : "";
  }

  // A late/resumed browser tab must not read an old cue unexpectedly.
  function cueDue(elapsedSeconds, dueSeconds, remainingSeconds) {
    return Number.isFinite(dueSeconds) && dueSeconds > 0 &&
      elapsedSeconds >= dueSeconds && elapsedSeconds < dueSeconds + 20 &&
      remainingSeconds > 30;
  }

  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

  // UI is rendered into the existing Quiet Deck. Every user value is escaped.
  function editorHtml(state, ready, voiceAvailable) {
    const entries = normalizeEntries(state.intentionLibrary);
    const selection = entries.map(entry => `<option value="${escapeHtml(entry.id)}"${entry.id === state.intentionId ? " selected" : ""}>${escapeHtml(entry.title)}</option>`).join("");
    const schedule = [
      ["once", "Once at the beginning"],
      ["3m", "Every 3 minutes"],
      ["5m", "Every 5 minutes"]
    ].map(([key, label]) => `<option value="${key}"${state.intentionCadence === key ? " selected" : ""}>${label}</option>`).join("");
    return `<section class="q-intention-studio" aria-label="Personal Intention Studio">
      <div class="q-setup-step">Φ INTENTION STUDIO · YOUR OWN SCRIPT LIBRARY</div>
      <h2>Choose the words. Shape the atmosphere.</h2>
      <p class="q-detail">Write a personal reflection, save it with the current six-layer sound recipe, and optionally hear it aloud while consciously listening. This is not subconscious reprogramming.</p>
      <label class="q-intention-label" for="q-intention-saved">Saved recipes (${entries.length}/${MAX_ENTRIES})</label>
      <select id="q-intention-saved"><option value=""${state.intentionId ? "" : " selected"}>New unsaved script</option>${selection}</select>
      <label class="q-intention-label" for="q-intention-title">Script title</label>
      <input id="q-intention-title" maxlength="${MAX_TITLE}" autocomplete="off" placeholder="Morning reset" value="${escapeHtml(state.intentionTitle)}">
      <label class="q-intention-label" for="q-intention-script">My personal script</label>
      <textarea id="q-intention-script" maxlength="${MAX_SCRIPT}" rows="5" placeholder="Today I can take one thoughtful step at a time.">${escapeHtml(state.intentionScript)}</textarea>
      <p class="q-detail">Up to ${MAX_SCRIPT} characters. Scripts are stored in browser local storage, not encrypted. Avoid personal secrets.</p>
      <div class="q-intention-actions">
        <button type="button" class="q-secondary" data-action="intention-save">${state.intentionId ? "Save changes and mix" : "Save new script and mix"}</button>
        <button type="button" class="q-secondary" data-action="intention-new">New blank script</button>
        ${state.intentionId ? '<button type="button" class="q-secondary" data-action="intention-delete">Delete saved recipe</button>' : ""}
        ${state.intentionConfirmDelete ? '<button type="button" class="q-return" data-action="intention-confirm-delete">Confirm delete from this device</button>' : ""}
      </div>
      ${state.intentionNotice ? `<p class="q-detail q-intention-notice" role="status">${escapeHtml(state.intentionNotice)}</p>` : ""}
      <label class="q-check" for="q-intention-speak"><input id="q-intention-speak" type="checkbox" ${state.intentionSpeak && voiceAvailable ? "checked" : ""} ${voiceAvailable ? "" : "disabled"}>
      <span><strong>Speak my script</strong><small>Off by default each time you enter the Studio. Never hidden or subliminal.</small></span></label>
      <label class="q-intention-label" for="q-intention-cadence">Spoken timing</label>
      <select id="q-intention-cadence" ${voiceAvailable ? "" : "disabled"}>${schedule}</select>
      <p class="q-detail">Choose once, every three minutes, or every five minutes. Speech only plays during your active session, when enabled; late cues are skipped.</p>
      <button type="button" class="q-secondary" data-action="intention-voice-preview" ${ready && voiceAvailable && state.intentionScript ? "" : "disabled"}>Hear my script once</button>
      <p class="q-detail">${voiceAvailable ? "Voice comes from your browser and may use a network service. Voice output is not shown on the digital peak meter." : "No browser voice is available. Save and read your scripts silently with optional ambience."}</p>
      <p class="q-detail">Your scripts stay out of session receipts. You control when to start, stop, repeat and delete your own words.</p>
    </section>`;
  }

  function activeHtml(state, voiceAvailable) {
    return `<section class="q-intention-active" aria-label="Your active intention">
      <div class="q-setup-step">YOUR CHOSEN WORDS · ${state.intentionSpeak && voiceAvailable ? "OPT-IN NARRATION" : "SILENT READING"}</div>
      <h2>${escapeHtml(state.intentionTitle || "My intention")}</h2>
      <p>${escapeHtml(state.intentionScript)}</p>
      <p class="q-detail">Return Now stops the practice. Repeating your words is a voluntary reflection, not proof of a subconscious effect.</p>
    </section>`;
  }

  window.FocusBridgeIntention = Object.freeze({
    STORAGE_KEY, MAX_ENTRIES, MAX_TITLE, MAX_SCRIPT, CADENCES,
    MIX_KEYS, clean, normalize, normalizeMix, normalizeEntries,
    load, upsert, remove, persist, textForSpeech, cueDue, validCadence, editorHtml, activeHtml
  });
})();