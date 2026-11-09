/* FocusBridge21 opt-in Focus Sync voice cues.
 * Uses the browser's speech service, never a proprietary meditation script.
 * Speech availability and whether a voice uses network services depend on the device.
 */
(() => {
  "use strict";
  function synthesizer() {
    return window.speechSynthesis || null;
  }
  function utteranceType() {
    return window.SpeechSynthesisUtterance ||
      (typeof SpeechSynthesisUtterance === "function" ? SpeechSynthesisUtterance : null);
  }
  function available() {
    const synth = synthesizer();
    return !!(synth && typeof synth.speak === "function" && utteranceType());
  }
  function stop() {
    const synth = synthesizer();
    if (synth && typeof synth.cancel === "function") synth.cancel();
  }
  function pause() {
    const synth = synthesizer();
    if (synth && typeof synth.pause === "function") synth.pause();
  }
  function resume() {
    const synth = synthesizer();
    if (synth && typeof synth.resume === "function") synth.resume();
  }
  function say(message) {
    if (!available() || !String(message || "").trim()) return false;
    try {
      const synth = synthesizer();
      const utterance = new (utteranceType())(String(message));
      utterance.lang = "en-US";
      utterance.rate = 0.88;
      utterance.pitch = 0.96;
      utterance.volume = 0.8;
      const voices = typeof synth.getVoices === "function" ? synth.getVoices() : [];
      const english = voices.filter(voice => /^en([_-]|$)/i.test(voice.lang || ""));
      const preferred = english.find(voice => voice.localService) || english[0];
      if (preferred) utterance.voice = preferred;
      // Queue only the current gate; avoid reading stale cues after a tab resumes.
      stop();
      synth.speak(utterance);
      return true;
    } catch {
      return false; // On-screen prompts remain available without speech.
    }
  }
  window.FocusBridgeVoice = Object.freeze({ available, say, stop, pause, resume });
})();