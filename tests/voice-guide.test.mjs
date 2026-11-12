import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../docs/fb21-voice-guide.js", import.meta.url), "utf8");

function fakeVoice() {
  const utterances = [], calls = [];
  class Utterance {
    constructor(text) { this.text = text; }
  }
  const synth = {
    getVoices: () => [
      { name: "Network voice", lang: "en-US", localService: false },
      { name: "Local voice", lang: "en-US", localService: true }
    ],
    speak: (utterance) => { utterances.push(utterance); calls.push("speak"); },
    cancel: () => calls.push("cancel"),
    pause: () => calls.push("pause"),
    resume: () => calls.push("resume")
  };
  const window = { speechSynthesis: synth, SpeechSynthesisUtterance: Utterance };
  runInNewContext(source, { window });
  return { guide: window.FocusBridgeVoice, utterances, calls };
}

test("no browser speech service means text-only prompts, not a thrown error", () => {
  const window = {};
  runInNewContext(source, { window });
  assert.equal(window.FocusBridgeVoice.available(), false);
  assert.equal(window.FocusBridgeVoice.say("Focus 1"), false);
  window.FocusBridgeVoice.stop();
  window.FocusBridgeVoice.pause();
  window.FocusBridgeVoice.resume();
});

test("guide prefers available local voice and speaks low, deliberate cues", () => {
  const { guide, utterances, calls } = fakeVoice();
  assert.equal(guide.available(), true);
  assert.equal(guide.say("Focus 1. Arrival."), true);
  assert.equal(utterances.length, 1);
  assert.equal(utterances[0].voice.name, "Local voice");
  assert.equal(utterances[0].rate, 0.88);
  assert.ok(utterances[0].volume <= 0.5);
  assert.deepEqual(calls, ["cancel", "speak"]);
  assert.equal(guide.say(""), false);
  guide.say("Focus 3. Steady Attention.");
  assert.equal(utterances.length, 2);
  assert.deepEqual(calls.slice(-2), ["cancel", "speak"]);
});

test("voice follows pause, resume and cancel commands", () => {
  const { guide, calls } = fakeVoice();
  guide.say("Arrival.");
  guide.pause();
  guide.resume();
  guide.stop();
  assert.deepEqual(calls.slice(-3), ["pause", "resume", "cancel"]);
});

test("both browser entrypoints load optional voice guide before Quiet Deck and cache it", () => {
  for (const name of ["../index.html", "../docs/index.html"]) {
    const html = readFileSync(new URL(name, import.meta.url), "utf8");
    const voiceAt = html.indexOf("fb21-voice-guide.js");
    const quietAt = html.indexOf("fb21-v13-quiet-deck.js");
    assert.ok(voiceAt > 0 && voiceAt < quietAt);
  }
  const worker = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");
  assert.match(worker, /focusbridge21-v2-(?:4-guided-audio|5-master-audio-engine|6-sleep-intentions|7-intention-studio|8-seamless-surf|9-qmm-foundation)|focusbridge21-v3-0-going-deeper|focusbridge21-v3-1-breathing-energy/);
  assert.match(worker, /fb21-voice-guide\.js/);
});
