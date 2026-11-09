/* FocusBridge21 Audio Engine v2.5
 * Shared session output for tones and six-layer ambience.
 * This is a browser Web Audio mixer, not an acoustic loudness meter,
 * medical device, or guaranteed glitch-free output.
 */
(() => {
  "use strict";
  const clamp = value => Math.max(0, Math.min(100, Number(value) || 0));
  const fraction = value => clamp(value) / 100;

  function create(ctx, refs = { nodes: [] }, options = {}) {
    if (!ctx || typeof ctx.createGain !== "function")
      throw new Error("Web Audio GainNode is unavailable.");
    const master = ctx.createGain();
    const level = fraction(options.level === undefined ? 80 : options.level);
    const now = ctx.currentTime;
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(level, now + 0.12);
    let tail = master;
    let dynamics = null;
    if (typeof ctx.createDynamicsCompressor === "function") {
      dynamics = ctx.createDynamicsCompressor();
      dynamics.threshold.value = -15;
      dynamics.knee.value = 12;
      dynamics.ratio.value = 3;
      dynamics.attack.value = 0.012;
      dynamics.release.value = 0.28;
      tail.connect(dynamics);
      tail = dynamics;
    }
    let analyser = null, samples = null;
    if (typeof ctx.createAnalyser === "function") {
      analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.65;
      tail.connect(analyser);
      tail = analyser;
      samples = new Uint8Array(analyser.frequencyBinCount ? analyser.fftSize : 512);
    }
    tail.connect(options.destination || ctx.destination);
    if (refs && Array.isArray(refs.nodes))
      refs.nodes.push(...[master, dynamics, analyser].filter(Boolean));
    return { ctx, input: master, master, dynamics, analyser, samples, level, stopping: false };
  }

  function setLevel(bus, level) {
    if (!bus || bus.stopping) return;
    const next = fraction(level);
    const param = bus.master.gain;
    const now = bus.ctx.currentTime;
    if (typeof param.cancelAndHoldAtTime === "function") {
      param.cancelAndHoldAtTime(now);
    } else if (typeof param.cancelScheduledValues === "function") {
      param.cancelScheduledValues(now);
      param.setValueAtTime(Math.max(0, param.value), now);
    }
    if (typeof param.setTargetAtTime === "function")
      param.setTargetAtTime(next, now, 0.035);
    else
      param.linearRampToValueAtTime(next, now + 0.1);
    bus.level = next;
  }

  // Returns a normalized digital sample peak, not headphone dB SPL.
  function peak(bus) {
    if (!bus || !bus.analyser || !bus.samples ||
        typeof bus.analyser.getByteTimeDomainData !== "function") return null;
    bus.analyser.getByteTimeDomainData(bus.samples);
    let amplitude = 0;
    for (let i = 0; i < bus.samples.length; i++)
      amplitude = Math.max(amplitude, Math.abs(bus.samples[i] - 128) / 128);
    return Math.min(1, amplitude);
  }

  // Schedule a 140 ms envelope before closing active nodes. Calling stop
  // immediately removes the session from UI state; sound fades briefly.
  // When an AudioParam cannot cancel scheduled automation, close directly.
  function beginStop(bus, finish, delay = setTimeout) {
    if (!bus || bus.stopping) return false;
    bus.stopping = true;
    const param = bus.master.gain;
    if (typeof delay !== "function" ||
        typeof param.cancelScheduledValues !== "function") {
      finish();
      return false;
    }
    try {
      const now = bus.ctx.currentTime;
      if (typeof param.cancelAndHoldAtTime === "function")
        param.cancelAndHoldAtTime(now);
      else {
        param.cancelScheduledValues(now);
        param.setValueAtTime(Math.max(0, param.value), now);
      }
      param.linearRampToValueAtTime(0, now + 0.14);
      delay(finish, 170);
      return true;
    } catch {
      finish();
      return false;
    }
  }

  window.FocusBridgeAudioEngine = Object.freeze({
    create, setLevel, peak, beginStop
  });
})();