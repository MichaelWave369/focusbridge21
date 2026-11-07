/*
 * FocusBridge21 Focus Sync v1.9
 * Original staged listening journey using publicly named focus-level indices
 * as reflection prompts, never as measurements of consciousness or claims
 * of reaching an external realm. No licensed Hemi-Sync signals or scripts.
 */
(() => {
  "use strict";

  // These values are original audio-design parameters, NOT mappings of
  // particular focus states to EEG frequencies. The levels are symbolic labels.
  const GATES = Object.freeze([
    { level: "1", title: "Arrival", prompt: "Notice your surroundings. You can stop whenever you wish.", difference: 10 },
    { level: "3", title: "Steady Attention", prompt: "Let the sound become a gentle background for steady attention.", difference: 9 },
    { level: "10", title: "Body Rest", prompt: "Allow the body to relax without forcing sleep or sensation.", difference: 8 },
    { level: "11", title: "Inner Check-in", prompt: "Observe your thoughts with curiosity, without trying to control them.", difference: 8.5 },
    { level: "12", title: "Open Awareness", prompt: "Notice sounds, sensations, and space with soft attention.", difference: 7.5 },
    { level: "15", title: "Unhurried Time", prompt: "Let go of clock watching while staying aware of your comfort.", difference: 6.5 },
    { level: "18", title: "Compassion", prompt: "Bring a gentle, accepting attitude toward yourself and others.", difference: 7 },
    { level: "21", title: "Threshold", prompt: "Observe any imagery without forcing a meaning or believing it must be real.", difference: 6 },
    { level: "22", title: "Borderlands", prompt: "Notice the difference between imagination, memory, and present surroundings.", difference: 6.5 },
    { level: "23", title: "Narratives", prompt: "Let stories arise and pass without trying to prove or enter them.", difference: 7 },
    { level: "24", title: "Belief Patterns I", prompt: "Consider how expectations can shape subjective experiences.", difference: 7.5 },
    { level: "25", title: "Belief Patterns II", prompt: "Allow perspectives to change; there is no result to achieve.", difference: 8 },
    { level: "26", title: "Perspective", prompt: "Hold different viewpoints lightly and remain grounded.", difference: 8.5 },
    { level: "27", title: "Rest and Reflection", prompt: "Rest in calm reflection without taking imagery literally.", difference: 7 },
    { level: "34/35", title: "Wider View", prompt: "Imagine wider connections while keeping a sense of your actual room.", difference: 8 },
    { level: "42", title: "Interconnection", prompt: "Reflect on relationships and the connections of everyday life.", difference: 8.5 },
    { level: "49", title: "Open Field", prompt: "Stay curious and unattached to whatever is or is not experienced.", difference: 9 }
  ].map(item => Object.freeze(item)));
  const PACES = Object.freeze([8, 12, 18, 20]);
  const RETURN_SECONDS = 12 * 60;
  const HARD_LIMIT_SECONDS = 6 * 60 * 60;

  function timeline(minutesPerGate = 12) {
    const minutes = PACES.includes(Number(minutesPerGate)) ? Number(minutesPerGate) : 12;
    const stageSeconds = minutes * 60;
    const stages = GATES.map((gate, index) => ({
      ...gate, index, kind: "gate",
      start: index * stageSeconds,
      end: (index + 1) * stageSeconds
    }));
    const lastEnd = stages[stages.length - 1].end;
    stages.push({
      index: stages.length, kind: "return", level: "Return", title: "Gentle Reorientation",
      prompt: "Feel your hands and feet. Notice the room and take your time before getting up.",
      difference: 10, start: lastEnd, end: lastEnd + RETURN_SECONDS
    });
    const totalSeconds = lastEnd + RETURN_SECONDS;
    if (totalSeconds > HARD_LIMIT_SECONDS) throw new Error("Focus Sync journey exceeds the six-hour safety cap.");
    return Object.freeze({ minutesPerGate: minutes, totalSeconds,
      stages: Object.freeze(stages.map(stage => Object.freeze(stage))) });
  }

  function stageAt(plan, elapsedSeconds) {
    if (!plan || !Array.isArray(plan.stages) || !plan.stages.length) throw new Error("Missing Focus Sync timeline.");
    const elapsed = Math.max(0, Number(elapsedSeconds) || 0);
    return plan.stages.find(stage => elapsed < stage.end) || plan.stages[plan.stages.length - 1];
  }

  function scheduleToneJourney(parameter, carrier, startAt, plan) {
    if (!parameter || !plan) return;
    const stages = plan.stages;
    parameter.setValueAtTime(carrier + stages[0].difference, startAt);
    for (let i = 1; i < stages.length; i++) {
      const stage = stages[i];
      const at = startAt + stage.start;
      parameter.setValueAtTime(carrier + stages[i - 1].difference, at);
      parameter.linearRampToValueAtTime(carrier + stage.difference, at + 30);
    }
  }

  window.FocusBridgeSync = Object.freeze({
    GATES, PACES, RETURN_SECONDS, HARD_LIMIT_SECONDS, timeline, stageAt, scheduleToneJourney
  });
})();
