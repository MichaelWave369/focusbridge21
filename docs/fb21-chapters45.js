/* FocusBridge21 · Chapters 4 and 5
 * Original, non-verbatim guided imagery adapted from the supplied
 * 112-page The Book of Knowledge (Anonymous):
 * Chapter 4 pp. 14–15: crown → third eye → throat → heart → solar plexus
 * → sacral → root, imagining white/golden light at each center.
 * Chapter 5 p. 16: QMM and GDM first; ears, outward imagined energy,
 * returning imagined energy, reported 'spiritual sounds.'
 *
 * This app does NOT validate chakra opening, messages from other realms,
 * a medical benefit, or hallucination-based spiritual interpretations.
 * Both are gentle attention/imagery, with a normal grounded return.
 */
(() => {
  "use strict";
  const DURATIONS = Object.freeze([180, 300, 600, 900, 1200, 1800]);
  function engine(stages) {
    const STAGES = Object.freeze(stages.map(stage => Object.freeze(stage)));
    const total = STAGES.reduce((sum, stage) => sum + stage.weight, 0);
    if (Math.abs(total - 1) > .0000001) throw new Error("Practice stages must total 1");
    function stageAt(elapsedSeconds, durationSeconds) {
      const duration = Math.max(1, Number(durationSeconds) || 1);
      const elapsed = Math.min(duration, Math.max(0, Number(elapsedSeconds) || 0));
      const progress = Math.min(.999999999, elapsed / duration);
      let totalWeight = 0;
      for (let index = 0; index < STAGES.length; index++) {
        totalWeight += STAGES[index].weight;
        if (progress < totalWeight || index === STAGES.length - 1)
          return Object.freeze({ ...STAGES[index], index });
      }
    }
    return Object.freeze({ DURATIONS, STAGES, stageAt });
  }
  const chakra = engine([
    { id: "arrive", title: "Arrive and settle", weight: .10,
      prompt: "After Quiet Mind, find comfortable support and notice the room around you. There is nothing to activate or heal.",
      voice: "Rest where you are. Let attention settle, without trying to change your body." },
    { id: "crown", title: "Crown · top of head", weight: .10,
      prompt: "Imagine a gentle white or golden light above the top of your head. It can be vague or absent. Nothing needs to be felt.",
      voice: "Imagine a soft white or golden glow near the top of your head. Stay comfortable." },
    { id: "third-eye", title: "Third Eye · forehead", weight: .10,
      prompt: "Picture the same gentle light near your forehead, without straining your eyes or assigning special meaning to imagery.",
      voice: "Imagine a gentle glow near your forehead. No eye effort is needed." },
    { id: "throat", title: "Throat · neck", weight: .10,
      prompt: "Imagine a small light near your throat. Notice normal breathing; do not tighten or force the neck.",
      voice: "Let a soft imagined light rest near your throat. Breathe naturally." },
    { id: "heart", title: "Heart · chest", weight: .10,
      prompt: "Picture a warm white or golden light at your chest. This is a symbol of care, not a treatment or heart measurement.",
      voice: "Imagine a quiet glow in the center of your chest. You are simply reflecting." },
    { id: "solar", title: "Solar Plexus · upper belly", weight: .10,
      prompt: "Imagine the light near your upper belly. Let your abdomen move naturally as you breathe, with no forced sensation.",
      voice: "Picture a soft light in the upper abdomen. Nothing needs to happen." },
    { id: "sacral", title: "Sacral · lower belly", weight: .10,
      prompt: "Imagine a small light in your lower abdomen. You do not need to see a color or experience warmth.",
      voice: "Imagine a small, gentle light near your lower belly, or simply rest." },
    { id: "root", title: "Root · base of spine", weight: .10,
      prompt: "Picture the light near the base of your spine and notice the actual support beneath you. Avoid squeezing or straining.",
      voice: "Let the imagined glow settle near the base of your spine. Feel the support beneath you." },
    { id: "rest", title: "Rest and notice", weight: .10,
      prompt: "Let the imagery fade. Tingling or warmth, if present, does not demonstrate a chakra opened. Ordinary sensations are enough.",
      voice: "Let the pictures fade. There is no result to achieve or measure." },
    { id: "return", title: "Grounded return", weight: .10,
      prompt: "Notice hands, feet, and the room around you. Open your eyes when ready and orient before moving.",
      voice: "Feel your hands and feet. Look around the room, and return at your own pace." }
  ]);
  const clair = engine([
    { id: "arrive", title: "Arrive after QMM + GDM", weight: .12,
      prompt: "You have completed Quiet Mind and Going Deeper. Notice the room and feel safely supported.",
      voice: "Notice your surroundings after your two foundation practices." },
    { id: "ears", title: "Attention to the ears", weight: .18,
      prompt: "Gently notice your left and right ears. No pressure, touching, straining, or volume increase is needed.",
      voice: "Bring gentle attention to one ear, then the other. There is nothing to force." },
    { id: "listen", title: "Ordinary nearby sounds", weight: .18,
      prompt: "Notice nearby sounds, or the quiet between them. If you are in silence, simply observe that silence.",
      voice: "Notice sounds that are actually present around you, or simply rest in quiet." },
    { id: "outward", title: "Imagine an outward wave", weight: .14,
      prompt: "As a mental image only, picture a soft ripple of attention extending outward from your ears. Nothing travels physically.",
      voice: "Imagine a soft ripple moving outward. It is a picture in your mind." },
    { id: "inward", title: "Imagine returning awareness", weight: .14,
      prompt: "Now picture that gentle ripple returning. You are not collecting messages or proving that another realm exists.",
      voice: "Picture the ripple returning. No messages or voices are required." },
    { id: "reflect", title: "Sounds versus imagined sounds", weight: .14,
      prompt: "Notice the difference between actual sounds and any imagined echoes. Do not treat imagined or unexplained voices as instructions.",
      voice: "Distinguish what you hear externally from what you imagine. Neither needs interpretation." },
    { id: "return", title: "Grounded return", weight: .10,
      prompt: "Open your eyes if closed, feel your hands and feet, and name familiar objects in your room. End whenever you wish.",
      voice: "Return attention to your body and the real room around you." }
  ]);
  window.FocusBridgeChakraLight = chakra;
  window.FocusBridgeClairaudience = clair;
})();