import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
function studio(initial = {}) {
  const data = new Map(Object.entries(initial));
  const localStorage = {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); }
  };
  const window = {};
  runInNewContext(read("docs/fb21-human-code12.js"), {window, localStorage});
  return {human:window.FocusBridgeHumanCode12, data, localStorage};
}

test("Human Code 12 defines twelve original, optional levels and non-certifying progress", () => {
  const {human} = studio();
  assert.equal(human.LEVELS.length, 12);
  assert.equal(new Set(Array.from(human.LEVELS, x => x.name)).size, 12);
  assert.equal(human.LEVELS[0].name, "The Vessel");
  assert.equal(human.LEVELS[11].name, "The Whole");
  assert.ok(human.LEVELS.every(x => x.objective && x.practice && x.reflection && x.action));
  assert.equal(human.progress(), 0);
  assert.match(human.view(), /self-reported/);
  assert.match(human.view(), /Different from Focus 12/);
  assert.match(human.view(), /data-action="hc-qmm"/);
  assert.match(human.view(), /data-action="hc-intention"/);
});

test("Every level is directly navigable; entries are private, independent, persistent and reversible", () => {
  const {human, localStorage, data} = studio({
    "focusbridge21-ledger-v1":JSON.stringify([{existing:"untouched"}])
  });
  assert.equal(human.select(12), true);
  assert.equal(human.current(), 12);
  human.updateNote("My own practice charter");
  human.toggleExplored();
  assert.equal(human.progress(), 1);
  assert.match(human.view(), /Unmark explored/);
  assert.equal(human.select(99), false);
  assert.equal(human.current(), 12);
  assert.equal(human.select("1"), true);
  assert.equal(human.progress(), 1);
  human.updateNote("Grounding first");
  human.select(12);
  assert.match(human.view(), /My own practice charter/);
  assert.equal(data.get("focusbridge21-ledger-v1"), '[{"existing":"untouched"}]');
  const next = studio(Object.fromEntries(data));
  assert.equal(next.human.progress(), 1);
  next.human.select(12);
  assert.match(next.human.view(), /My own practice charter/);
  next.human.toggleExplored();
  assert.equal(next.human.progress(), 0);
  assert.ok(localStorage.getItem(human.KEY));
});

test("Journal text escapes HTML and corrupt or excessive stored data is safely bounded", () => {
  const {human} = studio();
  human.updateNote('</textarea><script>alert("bad")</script> & "hello"');
  const html = human.view();
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /<\/textarea><script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&amp;/);
  human.updateNote("x".repeat(3000));
  assert.equal(human.snapshot().entries["1"].note.length, human.MAX_NOTE);
  const malformed = studio({[human.KEY]:"{not-json"});
  assert.equal(malformed.human.progress(), 0);
  const untrusted = studio({[human.KEY]:JSON.stringify({entries:{"1":{note:"y".repeat(5000),explored:"true"},"13":{note:"outside",explored:true}}})});
  assert.equal(untrusted.human.snapshot().entries["1"].note.length, human.MAX_NOTE);
  assert.equal(untrusted.human.progress(), 0);
  assert.equal(untrusted.human.snapshot().entries["13"], undefined);
});

test("Reset only clears Human Code 12, requires explicit confirmation, and never deletes Signal Ledger", () => {
  const {human, data} = studio({"focusbridge21-ledger-v1":"keep-me"});
  human.updateNote("A thought");
  human.toggleExplored();
  assert.equal(human.reset(false), false);
  assert.equal(human.progress(), 1);
  assert.equal(human.reset(true), true);
  assert.equal(human.progress(), 0);
  assert.equal(data.has(human.KEY), false);
  assert.equal(data.get("focusbridge21-ledger-v1"), "keep-me");
});

test("Both FocusBridge21 entrypoints and offline cache load the curriculum before Quiet Deck", () => {
  const quiet = read("docs/fb21-v13-quiet-deck.js");
  for (const path of ["index.html", "docs/index.html"]) {
    const html = read(path);
    assert.match(html, /fb21-human-code12\.css/);
    assert.ok(html.indexOf("fb21-human-code12.js") < html.indexOf("fb21-v13-quiet-deck.js"));
  }
  const cache = read("service-worker.js");
  assert.match(cache, /focusbridge21-v3-7-human-code12/);
  assert.match(cache, /docs\/fb21-human-code12\.js/);
  assert.match(cache, /docs\/fb21-human-code12\.css/);
  assert.match(quiet, /data-action="human12"/);
  assert.match(quiet, /state\.screen === "human12"/);
  assert.match(quiet, /updateNote\(event\.target\.value\)/);
});
