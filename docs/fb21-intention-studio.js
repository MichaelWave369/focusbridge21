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

  window.FocusBridgeIntention = Object.freeze({
    STORAGE_KEY, MAX_ENTRIES, MAX_TITLE, MAX_SCRIPT, CADENCES,
    MIX_KEYS, clean, normalize, normalizeMix, normalizeEntries,
    load, upsert, remove, persist, textForSpeech, cueDue, validCadence
  });
})();