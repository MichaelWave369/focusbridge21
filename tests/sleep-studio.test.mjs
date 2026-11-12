import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
const script = readFileSync(new URL("../docs/fb21-sleep-studio.js", import.meta.url), "utf8");

function studio() {
  const window = {};
  runInNewContext(script, { window });
  return window.FocusBridgeSleep;
}

test("sleep guide and reading the intention are both disabled by default", () => {
  const s = studio();
  const p = s.preferences();
  assert.equal(p.guide, false);
  assert.equal(p.speakIntention, false);
  assert.equal(p.dim, true);
  assert.equal(s.cue(p), "");
  assert.equal(s.cue(p, "settle"), "");
});

test("personal words are user-authored, length-capped, and spoken only by opt-in", () => {
  const s = studio();
  const long = "a".repeat(400);
  assert.equal(s.clean(long).length, 280);
  const phrase = "  Tonight   I can    rest.\nTomorrow I can begin again.  ";
  assert.equal(s.clean(phrase), "Tonight I can rest. Tomorrow I can begin again.");
  const noSpeak = s.preferences({ intention: phrase });
  assert.equal(s.cue(noSpeak), "");
  const spoken = s.preferences({ speakIntention: true, intention: phrase });
  assert.match(s.cue(spoken), /Your chosen intention: Tonight I can rest/);
  assert.doesNotMatch(s.cue(spoken), /Welcome to your wind-down/);
  const noContent = s.preferences({ speakIntention: true, intention: "  " });
  assert.equal(s.cue(noContent), "");
});

test("optional narration is brief, grounded, and limited to the beginning", () => {
  const s = studio();
  const prefs = s.preferences({ guide: true, speakIntention: true, intention: "I have permission to rest." });
  assert.match(s.cue(prefs), /Welcome to your wind-down/);
  assert.match(s.cue(prefs), /Your chosen intention/);
  assert.match(s.cue(prefs, "settle"), /do not need to follow my voice/);
  assert.equal(s.shouldSpeakSecond(prefs, 59, false), false);
  assert.equal(s.shouldSpeakSecond(prefs, 60, false), true);
  assert.equal(s.shouldSpeakSecond(prefs, 175, false), true);
  assert.equal(s.shouldSpeakSecond(prefs, 180, false), false);
  assert.equal(s.shouldSpeakSecond(prefs, 65, true), false);
  assert.equal(s.shouldSpeakSecond({ guide: false }, 60, false), false);
});

test("sleep module is loaded before Quiet Deck on both entrypoints, and cached for PWA", () => {
  for (const page of ["../index.html", "../docs/index.html"]) {
    const html = readFileSync(new URL(page, import.meta.url), "utf8");
    assert.ok(html.indexOf("fb21-sleep-studio.js") > 0);
    assert.ok(html.indexOf("fb21-sleep-studio.js") < html.indexOf("fb21-v13-quiet-deck.js"));
  }
  const worker = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");
  assert.match(worker, /focusbridge21-v2-(?:6-sleep-intentions|7-intention-studio|8-seamless-surf|9-qmm-foundation)|focusbridge21-v3-0-going-deeper|focusbridge21-v3-1-breathing-energy|focusbridge21-v3-2-tele-visualization|focusbridge21-v3-3-chapter4-atlas|focusbridge21-v3-4-chapters45|focusbridge21-v3-5-chapter6-energy|focusbridge21-v3-6-chapter7-cleansing/);
  assert.match(worker, /fb21-sleep-studio\.js/);
});
