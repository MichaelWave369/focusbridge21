/* FocusBridge21 · Chapter 7: Cleansing (symbolic light imagery)
 * Original, non-verbatim adaptation of The Book of Knowledge (Anonymous),
 * user-supplied 112-page PDF, pages 19–21. QMM is the prerequisite.
 *
 * The author's claims that chakra "cleansing" cures diseases, removes
 * entities, or opens psychic abilities are not established evidence.
 * No diagnosis, actual cleansing, supernatural detection, or treatment.
 */
(() => {
  "use strict";
  const DURATIONS = Object.freeze([180, 300, 600, 900, 1200, 1800]);
  const STYLES = Object.freeze({
    release: Object.freeze({ label: "Symbolic release", description: "Imagine light becoming clear while gently letting go of an ordinary worry. Nothing is physically cleansed." }),
    observe: Object.freeze({ label: "Colors only", description: "Simply picture each color, or imagine the word for it. No emotional release or special sensations are expected." })
  });
  const CENTERS = Object.freeze([
    { id: "root", title: "Root", color: "Red", hex: "#DB525A",
      location: "Base of spine", points: "One imagined point", page: 19,
      image: "Imagine one warm red sphere near the base of your spine. Remain physically supported." },
    { id: "sacral", title: "Sacral", color: "Orange", hex: "#EE9650",
      location: "Pelvis", points: "Two imagined points: front and back", page: 19,
      image: "Picture two gentle orange lights at the front and back of the pelvis, as described in the book." },
    { id: "solar", title: "Solar Plexus", color: "Yellow", hex: "#F1D164",
      location: "Upper abdomen", points: "Two imagined points: front and back", page: 20,
      image: "Picture two soft yellow lights on the front and back of the upper abdomen. Let breathing remain natural." },
    { id: "heart", title: "Heart", color: "Green", hex: "#6BCB8B",
      location: "Chest", points: "Two imagined points: front and back", page: 20,
      image: "Picture two green lights, one in front and one behind the chest. The author associates this image with kindness and love." },
    { id: "throat", title: "Throat", color: "Light blue to deeper blue", hex: "#6AB8E9",
      location: "Throat / neck", points: "Two imagined points: front and back", page: 21,
      image: "Imagine two calm blue lights at the front and back of the throat, from pale blue toward deeper blue. Never tighten the throat." },
    { id: "third-eye", title: "Third Eye", color: "Light purple", hex: "#B89ADD",
      location: "Forehead and imagined rear counterpart", points: "Two imagined points: front and back", page: 21,
      image: "Picture two gentle light-purple lights at the forehead and an imagined point behind. Keep your eyes relaxed, without straining or looking upward." },
    { id: "crown", title: "Crown", color: "Golden-white", hex: "#F1DA9A",
      location: "Above the top of the head", points: "One imagined point", page: 21,
      image: "Imagine one soft golden-white glow above the head. You do not need to feel heat, pressure or a special effect." }
  ].map(x => Object.freeze(x)));
  const STAGES = Object.freeze([
    Object.freeze({ id: "arrive", title: "Arrive after QMM", weight: .10, color: null, hex: null,
      prompt: "Notice the chair, bed, or floor supporting you. Breathing stays comfortable. This is symbolic color imagery, not a medical intervention.",
      voice: "Feel the support beneath you. We'll imagine seven colors, without needing any sensation or result." }),
    ...CENTERS.map(center => Object.freeze({ ...center, weight: .10 })),
    Object.freeze({ id: "settle", title: "Settle without interpretation", weight: .10, color: null, hex: null,
      prompt: "Allow all imagined lights to fade. Feeling warmth or tingling does not prove an energy center opened or an illness changed.",
      voice: "Let each imagined color fade. No special physical or spiritual result is required." }),
    Object.freeze({ id: "return", title: "Grounded return", weight: .10, color: null, hex: null,
      prompt: "Feel your hands, feet, and the surface beneath you. Open your eyes and identify familiar objects in the real room.",
      voice: "Feel your hands and feet, then open your eyes and orient to your surroundings." })
  ]);
  function style(value) {
    return Object.prototype.hasOwnProperty.call(STYLES, value) ? value : "release";
  }
  function stageAt(elapsedSeconds, durationSeconds, selectedStyle = "release") {
    const duration = Math.max(1, Number(durationSeconds) || 1);
    const elapsed = Math.min(duration, Math.max(0, Number(elapsedSeconds) || 0));
    const progress = Math.min(.999999999, elapsed / duration);
    let cumulative = 0;
    for (let index = 0; index < STAGES.length; index++) {
      cumulative += STAGES[index].weight;
      if (progress < cumulative || index === STAGES.length - 1) {
        const stage = STAGES[index];
        if (!stage.image) return Object.freeze({ ...stage, index });
        const suffix = style(selectedStyle) === "release"
          ? " If you like, imagine an everyday worry becoming lighter and fading. Nothing harmful is physically burned away."
          : " Simply observe the imagined color. There is no need to identify or release anything.";
        const prompt = stage.image + suffix;
        return Object.freeze({ ...stage, index, prompt, voice: prompt });
      }
    }
  }
  window.FocusBridgeCleansing = Object.freeze({ DURATIONS, STYLES, CENTERS, STAGES, style, stageAt });
})();
