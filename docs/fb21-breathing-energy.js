/* FocusBridge21 Breathing Energy | original sensory imagery practice
 * Based on the "Breathing Energy" subsection of Chapter 2 in
 * The Book of Knowledge (Anonymous): QMM and GDM precede the exercise;
 * the text describes breathing through the nose, out through pursed lips,
 * and imagining the body as a sponge surrounded by golden-white light.
 *
 * This is an optional, gentle *adaptation*, not a claim that imagined
 * energy enters the body. No mandatory inhale/exhale ratio, breath holding,
 * hyperventilation, physiological measurement, or special ability.
 */
(() => {
  "use strict";
  const DURATIONS = Object.freeze([180, 300, 600, 900, 1200, 1800]);
  const VISUALS = Object.freeze({
    glow: Object.freeze({
      label: "Golden-white glow",
      description: "Imagine a soft golden-white glow around you, as in the book's sponge metaphor."
    }),
    light: Object.freeze({
      label: "Soft white light",
      description: "Imagine a gentle, white-lit space without needing to see colors clearly."
    }),
    somatic: Object.freeze({
      label: "No-light body awareness",
      description: "Skip light imagery and simply notice the ordinary sensation of breathing."
    })
  });
  const STAGES = Object.freeze([
    Object.freeze({
      id: "arrive", title: "Supported and present", weight: 0.14,
      prompt: "Remain comfortably seated or lying down. Feel your body resting on a steady surface.",
      voice: "Be comfortably supported. Notice the place where your body is resting."
    }),
    Object.freeze({
      id: "breath", title: "Comfortable breath", weight: 0.20,
      prompt: "Notice an easy breath in and an easy breath out. Use your nose or mouth as comfortable. Do not force depth, hold your breath, or count.",
      voice: "Feel an easy breath arrive and leave. Your natural pace is enough."
    }),
    Object.freeze({ id: "image", title: "Sponge and light imagery", weight: 0.22 }),
    Object.freeze({ id: "feel", title: "Notice sensations", weight: 0.18 }),
    Object.freeze({
      id: "rest", title: "Quietly integrate", weight: 0.16,
      prompt: "Rest with the sensations you actually notice. Tingling, warmth or stillness are optional experiences, not required results.",
      voice: "Rest quietly. There is nothing you need to make happen."
    }),
    Object.freeze({
      id: "return", title: "Grounded return", weight: 0.10,
      prompt: "Feel your feet, hands and the surface beneath you. Open your eyes and look around before moving on.",
      voice: "Notice your hands, feet and surroundings. Return at your own pace."
    })
  ]);
  function visual(value) {
    return Object.prototype.hasOwnProperty.call(VISUALS, value) ? value : "glow";
  }
  function stageAt(elapsedSeconds, durationSeconds, imagery = "glow") {
    const duration = Math.max(1, Number(durationSeconds) || 1);
    const elapsed = Math.max(0, Math.min(duration, Number(elapsedSeconds) || 0));
    const progress = Math.min(0.999999999, elapsed / duration);
    const selected = visual(imagery);
    let cumulative = 0, index = STAGES.length - 1;
    for (let i = 0; i < STAGES.length; i++) {
      cumulative += STAGES[i].weight;
      if (progress < cumulative) { index = i; break; }
    }
    const stage = STAGES[index];
    if (stage.id === "image") {
      const cue = selected === "glow"
        ? "If you wish, imagine your body like a sponge in soft golden-white light. This is only a mental picture, not physical energy entering you."
        : selected === "light"
          ? "Imagine sitting in gentle white light, letting it be a calm background image. No visual detail is required."
          : "You can skip all light imagery. Feel the simple rising and falling that happens with comfortable breathing.";
      return Object.freeze({ ...stage, index, prompt: cue, voice: cue });
    }
    if (stage.id === "feel") {
      const cue = selected === "somatic"
        ? "Notice the contact of your feet, hands and chest as you breathe. Sensations can be ordinary or faint."
        : "Notice any warmth, tingling, or ease without expecting it. These are subjective sensations, not evidence of an external force.";
      return Object.freeze({ ...stage, index, prompt: cue, voice: cue });
    }
    return Object.freeze({ ...stage, index });
  }
  window.FocusBridgeBreathingEnergy = Object.freeze({
    DURATIONS, VISUALS, STAGES, visual, stageAt
  });
})();
