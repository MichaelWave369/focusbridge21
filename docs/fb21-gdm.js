/* FocusBridge21 Going Deeper Meditation (GDM)
 * Original, non-verbatim adaptation of Chapter 2 of The Book of Knowledge
 * (Anonymous): QMM first, then imagined ladder/backward escalator descent
 * and an imagined backward drop into a deeper sense of relaxation.
 * https://www.scribd.com/doc/120678976/The-Book-Of-Knowledge
 *
 * We keep movements purely imagined and provide a stillness alternative.
 * Timed cues cannot measure alpha/theta brainwaves or prove trance states.
 */
(() => {
  "use strict";
  const DURATIONS = Object.freeze([180, 300, 600, 900, 1200, 1800]);
  const VISUALS = Object.freeze({
    ladder: Object.freeze({ label: "Ladder into quiet", description: "Imagine stepping downward into a dim, peaceful room. Your actual body remains supported." }),
    escalator: Object.freeze({ label: "Backward escalator", description: "Imagine a slow, steady escalator carrying you backward toward a quiet place. This is purely visualization." }),
    still: Object.freeze({ label: "Stillness alternative", description: "Skip movement imagery. Notice the weight of your body and allow relaxation at your own pace." })
  });
  const STAGES = Object.freeze([
    Object.freeze({ id: "arrive", title: "Supported & steady", weight: 0.15,
      prompt: "Feel the chair, bed, or floor holding you. Let your breathing stay comfortable and natural.",
      voice: "You have completed the quiet mind foundation. Feel the support beneath you, and breathe naturally." }),
    Object.freeze({ id: "descent", title: "Imagine going deeper", weight: 0.25 }),
    Object.freeze({ id: "transition", title: "A gentle imagined landing", weight: 0.15 }),
    Object.freeze({ id: "rest", title: "Rest without chasing", weight: 0.25,
      prompt: "Rest in the relaxed scene. Thoughts and unexpected imagery may appear; no meaning needs to be assigned.",
      voice: "Rest for a moment in the scene you have imagined. Let thoughts pass without following them." }),
    Object.freeze({ id: "return", title: "Return to the room", weight: 0.20,
      prompt: "Notice the weight of your body, feel your hands and feet, then open your eyes and look around.",
      voice: "Return to the present room. Feel your hands and feet and notice your surroundings." })
  ]);
  function visual(id) { return Object.prototype.hasOwnProperty.call(VISUALS, id) ? id : "ladder"; }
  function stageAt(elapsedSeconds, durationSeconds, imagery = "ladder") {
    const seconds = Math.max(1, Number(durationSeconds) || 1);
    const progress = Math.min(0.999999999, Math.max(0, Number(elapsedSeconds) || 0) / seconds);
    const selected = visual(imagery);
    let total = 0, index = STAGES.length - 1;
    for (let i = 0; i < STAGES.length; i++) {
      total += STAGES[i].weight;
      if (progress < total) { index = i; break; }
    }
    const stage = STAGES[index];
    if (stage.id === "descent") {
      const desc = selected === "ladder"
        ? "Imagine climbing carefully down a steady ladder toward a peaceful, dim room. Stay physically still and supported."
        : selected === "escalator"
          ? "Imagine riding a slow escalator backward toward a quiet room. Your real body does not move."
          : "Let your attention settle more deeply into the support beneath you. No moving scene is necessary.";
      return Object.freeze({ ...stage, index, prompt: desc, voice: desc });
    }
    if (stage.id === "transition") {
      const desc = selected === "still"
        ? "Imagine a soft sense of settling, as if becoming more at ease with each exhale. Nothing needs to happen."
        : "If comfortable, imagine a brief, gentle backward drop onto a perfectly soft landing. Do not move your actual body or force a falling sensation.";
      return Object.freeze({ ...stage, index, prompt: desc, voice: desc });
    }
    return Object.freeze({ ...stage, index });
  }
  window.FocusBridgeGDM = Object.freeze({ DURATIONS, VISUALS, STAGES, visual, stageAt });
})();
