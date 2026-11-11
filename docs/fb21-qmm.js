/* FocusBridge21 Quiet Mind Meditation (QMM)
 * Original, brief prompts derived from the general attentional sequence described in
 * The Book of Knowledge, Anonymous, chapter 1:
 * https://www.scribd.com/doc/120678976/The-Book-Of-Knowledge
 * No passages are reproduced. This trains gentle attention, not paranormal abilities,
 * verified EEG bands, or guaranteed altered states.
 */
(() => {
  "use strict";
  const DURATIONS = Object.freeze([180, 300, 600, 900, 1200, 1800]);
  const STAGES = Object.freeze([
    Object.freeze({ id: "arrive", title: "Arrive & orient", weight: 0.10,
      prompt: "Settle somewhere safe and comfortable. Let the room be just as it is.",
      voice: "Find a comfortable position. Notice that you are here, in this room." }),
    Object.freeze({ id: "gaze", title: "Gentle gaze", weight: 0.12,
      prompt: "Rest your eyes on one steady object. Keep the gaze soft; there is nothing to stare down.",
      voice: "Rest your eyes softly on a stationary object. No strain is needed." }),
    Object.freeze({ id: "breath", title: "Natural rhythm", weight: 0.14,
      prompt: "Notice one easy breath at a time. Breathe at your own pace, with no holds or forcing.",
      voice: "Notice the breath as it comes and goes naturally. Let it find its own rhythm." }),
    Object.freeze({ id: "inner", title: "Inner screen", weight: 0.15,
      prompt: "If comfortable, close your eyes. Notice darkness or faint patterns without chasing them.",
      voice: "If it feels comfortable, close your eyes. Simply notice the space behind your eyelids." }),
    Object.freeze({ id: "sounds", title: "Open listening", weight: 0.15,
      prompt: "Let surrounding sounds come and go. You do not have to label or control them.",
      voice: "Listen to the room around you. Sounds may pass through your awareness." }),
    Object.freeze({ id: "thoughts", title: "Return to quiet", weight: 0.24,
      prompt: "A thought appeared? That is normal. Notice it without argument and gently return to the present.",
      voice: "Thoughts may come. Nothing has gone wrong. Notice each one and gently return." }),
    Object.freeze({ id: "return", title: "Grounded return", weight: 0.10,
      prompt: "Feel your hands, feet, and the surface beneath you. Open your eyes when ready.",
      voice: "Feel where your body meets the ground. Notice the room. Open your eyes when ready." })
  ]);
  function stageAt(elapsedSeconds, durationSeconds) {
    const duration = Math.max(1, Number(durationSeconds) || 1);
    const elapsed = Math.max(0, Math.min(duration, Number(elapsedSeconds) || 0));
    const progress = Math.min(0.999999999, elapsed / duration);
    let cumulative = 0;
    for (let index = 0; index < STAGES.length; index++) {
      cumulative += STAGES[index].weight;
      if (progress < cumulative || index === STAGES.length - 1)
        return Object.freeze({ ...STAGES[index], index });
    }
  }
  window.FocusBridgeQMM = Object.freeze({ DURATIONS, STAGES, stageAt });
})();
