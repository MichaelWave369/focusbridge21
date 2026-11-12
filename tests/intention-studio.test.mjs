import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../docs/fb21-intention-studio.js", import.meta.url), "utf8");
function studio() {
  const window = {};
  runInNewContext(source, { window });
  return window.FocusBridgeIntention;
}
const basicMix = { surf: 42, bass: 8, beat: 0, rain: 23, wind: 16, hum: 15, humNote: "C3", tones: false };
const draft = (overrides = {}) => ({
  title: "Calm Reset", script: "I can start one small task.", cadence: "once",
  mix: basicMix, ...overrides
});

test("Intention Studio stays bounded, voluntary and free of undeclared presets", () => {
  const s = studio();
  assert.equal(s.MAX_ENTRIES, 12);
  assert.equal(s.MAX_TITLE, 60);
  assert.equal(s.MAX_SCRIPT, 800);
  assert.equal(s.clean("  A\n B \t C  ", 800), "A B C");
  assert.equal(s.clean("x".repeat(1000), 800).length, 800);
  assert.equal(s.validCadence("1m"), "once");
  assert.equal(s.CADENCES.once, 0);
  assert.equal(s.CADENCES["3m"], 180);
  assert.equal(s.CADENCES["5m"], 300);
  assert.equal(s.textForSpeech(" "), "");
  assert.match(s.textForSpeech("Tomorrow I begin."), /Your chosen intention: Tomorrow I begin/);
});

test("local recipe library can create, update, restore and delete while capturing six sound levels", () => {
  const s = studio();
  const storageData = new Map();
  const storage = { getItem: k => storageData.get(k) ?? null, setItem: (k,v) => storageData.set(k,v) };
  assert.equal(s.load(storage).length, 0);
  const created = s.upsert([], draft());
  assert.match(created.saved.id, /^s-/);
  assert.equal(created.saved.mix.surf, 42);
  assert.equal(created.saved.mix.rain, 23);
  assert.equal(created.saved.mix.humNote, "C3");
  assert.equal(created.saved.mix.tones, false);
  s.persist(storage, created.entries);
  const restored = s.load(storage);
  assert.equal(restored.length, 1);
  assert.equal(restored[0].title, "Calm Reset");
  const updated = s.upsert(restored, draft({
    id: restored[0].id, title: "Updated", cadence: "3m",
    mix: { surf: 1000, rain: -2, humNote: "K9", tones: true }
  }));
  assert.equal(updated.entries.length, 1);
  assert.equal(updated.saved.title, "Updated");
  assert.equal(updated.saved.mix.surf, 100);
  assert.equal(updated.saved.mix.rain, 0);
  assert.equal(updated.saved.mix.humNote, "C4");
  assert.equal(updated.saved.cadence, "3m");
  assert.equal(updated.saved.mix.tones, true);
  assert.equal(s.remove(updated.entries, updated.saved.id).length, 0);
});

test("library capacity, malformed entries and storage errors are handled safely", () => {
  const s = studio();
  assert.throws(() => s.upsert([], draft({ script: " " })), /Write an intention/);
  let entries = [];
  for (let i = 0; i < 12; i++) {
    entries = s.upsert(entries, draft({ title: "Session " + i })).entries;
  }
  assert.equal(entries.length, 12);
  assert.throws(() => s.upsert(entries, draft()), /holds 12 scripts/);
  assert.equal(s.upsert(entries, { ...entries[4], title: "Revised" }).entries.length, 12);
  const broken = { getItem: () => "{ malformed", setItem: () => { throw new Error("Storage denied"); } };
  assert.equal(s.load(broken).length, 0);
  assert.throws(() => s.persist(broken, entries), /Storage denied/);
  assert.equal(s.normalizeEntries([{id:"x",title:"Ignored",script:"Not stable"}]).length,0);
});

test("voice repeats only in narrow active-session windows and never catches up stale prompts", () => {
  const s = studio();
  assert.equal(s.cueDue(180, 180, 300), true);
  assert.equal(s.cueDue(195, 180, 100), true);
  assert.equal(s.cueDue(201, 180, 100), false);
  assert.equal(s.cueDue(180, 180, 29), false);
  assert.equal(s.cueDue(540, 180, 800), false);
  assert.equal(s.cueDue(60, 0, 200), false);
  assert.equal(s.cueDue(0, null, 1200), false);
});

test("script and title are escaped into HTML without an XSS sink", () => {
  const s = studio();
  const unsafe = '<img src=x onerror="alert(1)">';
  const state = {
    intentionLibrary: [], intentionId: "",
    intentionTitle: unsafe, intentionScript: unsafe, intentionCadence: "once",
    intentionSpeak: false, intentionNotice: "", intentionConfirmDelete: false
  };
  const editor = s.editorHtml(state, true, true);
  assert.match(editor, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.doesNotMatch(editor, /<img src=x/);
  assert.match(editor, /id="q-intention-voice-preview"|data-action="intention-voice-preview"/);
  assert.match(editor, /OFF by default|Off by default/i);
  const running = s.activeHtml(state, false);
  assert.doesNotMatch(running, /<img src=x/);
});

test("both entrypoints load Intention Studio before Quiet Deck and cache it for offline use", () => {
  for (const page of ["../index.html", "../docs/index.html"]) {
    const html = readFileSync(new URL(page, import.meta.url), "utf8");
    assert.ok(html.indexOf("fb21-intention-studio.js") > 0);
    assert.ok(html.indexOf("fb21-intention-studio.js") < html.indexOf("fb21-v13-quiet-deck.js"));
  }
  const worker = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");
  assert.match(worker, /focusbridge21-v2-(?:7-intention-studio|8-seamless-surf|9-qmm-foundation)|focusbridge21-v3-0-going-deeper/);
  assert.match(worker, /fb21-intention-studio\.js/);
});
