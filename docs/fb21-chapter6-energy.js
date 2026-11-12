/* FocusBridge21 · Chapter 6: Controlling Energy
 * The Book of Knowledge (Anonymous), user-supplied 112-page PDF, pp.17–18.
 * This is an ORIGINAL guided imagery adaptation, not a mechanism for moving
 * matter, predicting thoughts, reading auras, transferring biological energy,
 * or detecting intelligent life.
 *
 * The source names QMM as the foundation. All motion/energy is IMAGINED;
 * no water immersion, electricity, barefoot outdoor exposure, or movement
 * is requested. Gentle sensory attention, optional imagery, grounded return.
 */
(() => {
  "use strict";
  const DURATIONS = Object.freeze([180, 300, 600, 900, 1200, 1800]);
  function stage(id, title, weight, prompt, voice) {
    return Object.freeze({ id, title, weight, prompt, voice: voice || prompt });
  }
  const THEMES = Object.freeze({
    body: Object.freeze({
      label: "Mental-body and limbs",
      summary: "Picture yourself in front of your body, then imagine light and awareness moving through each hand and foot.",
      stages: Object.freeze([
        stage("arrive", "Arrive after Quiet Mind", .12, "Feel where your body rests. Keep your breath natural and know you can stop at any time."),
        stage("double", "Picture a second, imagined self", .18, "Picture a mental image of yourself standing nearby in soft, warm light. This is imagination; your physical body remains in place."),
        stage("return", "Imagine rejoining your body", .12, "Imagine that picture gently fading back into your ordinary awareness. Feel the actual support under your body."),
        stage("hands", "Hands: outward and inward", .19, "Without needing to move, imagine a soft glow extending from one hand and returning, then repeat with the other hand."),
        stage("feet", "Feet: outward and inward", .19, "Imagine a gentle glow reaching each foot and settling again. Nothing physical needs to move or radiate."),
        stage("rest", "Rest with normal sensations", .10, "Notice only sensations you actually have. No warmth, tingling, or special power is required."),
        stage("ground", "Return to the room", .10, "Look around, feel both hands and feet, and return attention to the real room.")
      ])
    }),
    earth: Object.freeze({
      label: "Earth connection imagery",
      summary: "Use the book's warm red Earth imagery while remaining safely supported indoors or outdoors.",
      stages: Object.freeze([
        stage("arrive", "Arrive after Quiet Mind", .16, "Feel the chair, bed, or floor supporting you. Shoes can stay on."),
        stage("ground", "Notice ordinary support", .20, "Notice the actual pressure under your feet or body. You do not need to stand, go barefoot, or go outside."),
        stage("red", "Imagine red warmth", .24, "Picture the book's warm red, softly pulsing light as a mental image near the ground. It is not physical plasma entering you."),
        stage("settle", "Rest with the image", .20, "Let the imagined warm color fade. Notice your real breathing and the place where you sit or lie."),
        stage("return", "Grounded return", .20, "Feel your fingers and toes. Look around and identify familiar things in the room.")
      ])
    }),
    water: Object.freeze({
      label: "Imagined water exchange",
      summary: "Visualize a symbolic back-and-forth ripple between hands, without touching water.",
      stages: Object.freeze([
        stage("arrive", "Arrive in a dry, safe place", .15, "Stay comfortably supported, away from water and electrical hazards. No bowl, bath, or wet hands are needed."),
        stage("pool", "Picture calm water", .20, "Imagine a shallow pool as a peaceful mental scene. The water exists only in your imagination."),
        stage("right", "Right-to-left imagined ripple", .20, "Picture a little ripple moving from your right hand toward your left. Keep your hands wherever they are comfortable."),
        stage("left", "Left-to-right imagined ripple", .20, "Imagine the ripple moving back from your left hand to your right. No actual energy, water, or object is moved."),
        stage("rest", "Notice the difference", .10, "An imagined movement is different from a physical event. Let the picture fade without seeking a result."),
        stage("return", "Return to your surroundings", .15, "Feel your hands and feet, open your eyes when ready, and notice the room.")
      ])
    }),
    forest: Object.freeze({
      label: "Forest and living-things imagery",
      summary: "Imagine the book's detailed forest, then practice sensory description without assuming knowledge of animals or people.",
      stages: Object.freeze([
        stage("arrive", "Arrive after Quiet Mind", .13, "Feel where your body rests. You may keep your eyes open or closed."),
        stage("forest", "Imagine a forest", .22, "Picture trees, leaves, colors, and branches. No forest or living thing is being accessed remotely."),
        stage("senses", "Explore imagined sensations", .22, "Imagine the smell of leaves and the sounds of wind or birds. Notice which details are invented by the mind."),
        stage("reach", "Imagine a gentle connection", .18, "Picture a soft gesture of care toward a tree or animal in the scene. No life force is taken or measured."),
        stage("reflect", "Distinguish guesses and observations", .12, "Your impressions cannot establish what another person thinks or feels. Real understanding requires evidence and consent."),
        stage("return", "Back to the real room", .13, "Let the scene fade. Look around the room and feel the real support under your body.")
      ])
    })
  });
  for (const theme of Object.values(THEMES)) {
    if (Math.abs(theme.stages.reduce((sum, part) => sum + part.weight, 0) - 1) > 1e-8)
      throw new Error("Chapter 6 stage weights must total one");
  }
  function theme(value) {
    return Object.prototype.hasOwnProperty.call(THEMES, value) ? value : "body";
  }
  function stageAt(elapsedSeconds, durationSeconds, selected = "body") {
    const duration = Math.max(1, Number(durationSeconds) || 1);
    const time = Math.max(0, Math.min(duration, Number(elapsedSeconds) || 0));
    const progress = Math.min(.999999999, time / duration);
    const parts = THEMES[theme(selected)].stages;
    let cumulative = 0;
    for (let index = 0; index < parts.length; index++) {
      cumulative += parts[index].weight;
      if (progress < cumulative || index === parts.length - 1)
        return Object.freeze({ ...parts[index], index });
    }
  }
  window.FocusBridgeEnergyImagery = Object.freeze({ DURATIONS, THEMES, theme, stageAt });
})();
