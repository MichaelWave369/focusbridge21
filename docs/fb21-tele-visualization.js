/* FocusBridge21 Chapter 3 Tele-Visualization
 * Original, non-verbatim adaptation of The Book of Knowledge (Anonymous)
 * Chapter 3, PDF pages 4-5: a forest, downstream river, misty pool with
 * grey stone wall and greenery, and four imagined echoes of one's name.
 *
 * Part 2 in the book proposes a hidden object placed by a friend.
 * Our separate browser four-choice experiment is a *different* toy protocol.
 * It never asserts remote perception or access to another room/person.
 */
(() => {
  "use strict";
  const DURATIONS = Object.freeze([180, 300, 600, 900, 1200, 1800]);
  const STAGES = Object.freeze([
    Object.freeze({id:"arrive", title:"Arrive and settle",weight:0.12,
      prompt:"After QMM, sit or lie comfortably. Keep your eyes relaxed. Nothing needs to be seen.",
      voice:"After your Quiet Mind practice, feel where your body is supported. Keep your eyes relaxed."}),
    Object.freeze({id:"forest",title:"Imagine a forest",weight:0.17,
      prompt:"Imagine a peaceful forest. Notice its trees, shade, air and distant natural sounds.",
      voice:"If you wish, picture a forest. Notice the shapes of trees and the sounds you imagine."}),
    Object.freeze({id:"river",title:"Hear the river",weight:0.15,
      prompt:"Imagine hearing a river. Picture its current and follow the water downstream.",
      voice:"Imagine a river nearby. See its water flow, and follow it downstream in your mind."}),
    Object.freeze({id:"pool",title:"Misty pool and grey stone",weight:0.21,
      prompt:"Imagine the river reaching a mist-covered pool. A smooth grey stone wall rises around it, with small patches of green plants.",
      voice:"The river reaches a misty pool, enclosed by smooth grey stone. Notice some greenery on the wall."}),
    Object.freeze({id:"listen",title:"Sounds near the water",weight:0.12,
      prompt:"Imagine soft bubbling water. Explore the scene with sight, sound and a sense of place, without claiming to be physically there.",
      voice:"Listen in your imagination to the pool bubbling. Let it remain an imaginative scene."}),
    Object.freeze({id:"echo",title:"Four imagined echoes",weight:0.12,
      prompt:"If comfortable, imagine the pool gently repeating your name, or any friendly word you choose, four times. No name needs to be entered or saved.",
      voice:"If you wish, imagine the pool repeating a familiar, welcome name or word four times."}),
    Object.freeze({id:"return",title:"Return to the room",weight:0.11,
      prompt:"Let the scene fade. Feel your hands, feet and the surface beneath you. Look around the real room.",
      voice:"Let the forest fade. Feel your hands and feet and look around the room where you are."})
  ]);
  const TARGETS = Object.freeze([
    Object.freeze({id:"tree",label:"Tree"}),
    Object.freeze({id:"lantern",label:"Lantern"}),
    Object.freeze({id:"mountain",label:"Mountain"}),
    Object.freeze({id:"shell",label:"Seashell"})
  ]);
  const TRIAL_COUNT = 20;
  function stageAt(elapsedSeconds, durationSeconds) {
    const seconds = Math.max(1, Number(durationSeconds) || 1);
    const elapsed = Math.max(0, Math.min(seconds, Number(elapsedSeconds) || 0));
    const progress = Math.min(0.999999999, elapsed / seconds);
    let sum = 0;
    for(let i=0;i<STAGES.length;i++) {
      sum += STAGES[i].weight;
      if (progress < sum || i===STAGES.length-1) return Object.freeze({...STAGES[i],index:i});
    }
  }
  function chooseTarget(cryptoSource) {
    if (!cryptoSource || typeof cryptoSource.getRandomValues !== "function") return null;
    const buffer = new Uint32Array(1);
    cryptoSource.getRandomValues(buffer);
    return Number(buffer[0] % TARGETS.length);
  }
  function scoreBlock(rounds) {
    if (!Array.isArray(rounds) || rounds.length !== TRIAL_COUNT) return null;
    const valid = rounds.every(r => Number.isInteger(r.guess) && Number.isInteger(r.target) &&
      r.guess>=0 && r.guess<TARGETS.length && r.target>=0 && r.target<TARGETS.length);
    if (!valid) return null;
    const hits = rounds.filter(r => r.guess===r.target).length;
    return Object.freeze({trials:rounds.length,hits,expectedChanceHits:TRIAL_COUNT/TARGETS.length,
      chanceProbability:1/TARGETS.length,hitRate:hits/rounds.length});
  }
  window.FocusBridgeTeleVisualization = Object.freeze({
    DURATIONS,STAGES,TARGETS,TRIAL_COUNT,stageAt,chooseTarget,scoreBlock
  });
})();
