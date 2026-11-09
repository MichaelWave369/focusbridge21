/* FocusBridge21 Sleep and Intention Studio v2.6
 * Brief voluntary wind-down prompts. No subliminal messages, hypnosis claims,
 * sleep-learning promises, or audio that wakes the user hours later.
 */
(() => {
  "use strict";
  const MAX_LENGTH = 280;
  const SECOND_CUE_SECONDS = 60;
  const LAST_CUE_WINDOW_SECONDS = 180;
  const clean = text => String(text ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ").trim().slice(0, MAX_LENGTH);

  function preferences(saved = {}) {
    return Object.freeze({
      guide: saved.guide === true,
      speakIntention: saved.speakIntention === true,
      dim: saved.dim !== false,
      intention: clean(saved.intention)
    });
  }

  function cue(config, kind = "start") {
    const prefs = preferences(config);
    if (kind === "settle") {
      return prefs.guide
        ? "Allow the day to be done for now. Feel the support beneath you. Let the sound fade into the background. You do not need to follow my voice any longer."
        : "";
    }
    if (!prefs.guide && !(prefs.speakIntention && prefs.intention)) return "";
    const intro = prefs.guide
      ? "Welcome to your wind-down. Settle into a comfortable position. Let your breath find its natural rhythm. There is nothing you need to accomplish."
      : "";
    const affirmation = prefs.speakIntention && prefs.intention
      ? " Your chosen intention: " + prefs.intention + "."
      : "";
    return (intro + affirmation).trim();
  }

  function shouldSpeakSecond(config, elapsedSeconds, alreadySpoken) {
    return preferences(config).guide && !alreadySpoken &&
      elapsedSeconds >= SECOND_CUE_SECONDS &&
      elapsedSeconds < LAST_CUE_WINDOW_SECONDS;
  }

  window.FocusBridgeSleep = Object.freeze({
    MAX_LENGTH, SECOND_CUE_SECONDS, LAST_CUE_WINDOW_SECONDS,
    preferences, cue, shouldSpeakSecond, clean
  });
})();