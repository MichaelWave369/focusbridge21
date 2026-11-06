/*
 * FocusBridge21 Original Soundscape v1.4
 * Procedural waves + optional quiet low-frequency drone + gentle pulse.
 * Independent of proprietary recordings and independent of Hemi-Sync.
 *
 * Intensity inputs are 0..100. Defaults are OFF, except where the UI
 * explicitly chooses a soundscape. All audio is low-level and scheduled
 * to stop at a definite AudioContext time.
 */
(() => {
  "use strict";

  const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0));
  const fraction = (value) => clamp(value, 0, 100) / 100;
  const register = (refs, ...nodes) => {
    if (refs && Array.isArray(refs.nodes)) refs.nodes.push(...nodes);
  };

  function makeFoamNoise(ctx) {
    const size = Math.max(512, Math.round(ctx.sampleRate * 3));
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    // 3-second pseudo-pink textured noise, randomly generated per context.
    // Never downloaded or taken from a copyrighted recording.
    let pink = 0;
    for (let i = 0; i < size; i++) {
      pink = 0.93 * pink + 0.07 * (Math.random() * 2 - 1);
      channel[i] = 0.65 * pink + 0.35 * (Math.random() * 2 - 1);
    }
    return buffer;
  }

  function makeLayer(ctx, buffer, type, frequency, volume, pan, t, seconds, refs, output) {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 70;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    if (type === "bandpass") filter.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    src.connect(hp).connect(filter).connect(gain);
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.value = pan;
      gain.connect(panner).connect(output);
      register(refs, panner);
    } else {
      gain.connect(output);
    }
    register(refs, src, hp, filter, gain);
    src.start(t);
    src.stop(t + seconds + 0.1);
    return { gain, volume };
  }

  function waves(gain, level, t, seconds, cycle, offset, rise, fall) {
    const end = t + seconds;
    gain.gain.setValueAtTime(0.0001, t);
    for (let at = t + offset; at < end; at += cycle) {
      const peak = Math.min(end, at + rise);
      const softEnd = Math.min(end, at + rise + fall);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime(Math.max(0.0001, level), peak);
      gain.gain.linearRampToValueAtTime(0.0001, softEnd);
    }
  }

  function tone(ctx, frequency, gainAmount, t, seconds, refs, output, harmonic = false) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    const safe = Math.max(0.0001, gainAmount);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(safe, t + Math.min(2.5, seconds / 3));
    gain.gain.setValueAtTime(safe, t + Math.max(2.5, seconds - 2.5));
    gain.gain.linearRampToValueAtTime(0.0001, t + seconds);
    oscillator.connect(gain).connect(output);
    oscillator.start(t);
    oscillator.stop(t + seconds + 0.1);
    register(refs, oscillator, gain);
  }

  function pulse(ctx, amount, t, seconds, refs, output) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 72;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    osc.connect(gain).connect(output);
    const interval = 1.5; // 40 BPM: slow, optional rhythmic anchor.
    // Keep transient quieter than a typical music kick; avoid sharp clicks.
    for (let at = t + 0.4; at < t + seconds - 0.5; at += interval) {
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime(Math.max(0.0001, amount * 0.045), at + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.55);
    }
    osc.start(t);
    osc.stop(t + seconds + 0.1);
    register(refs, osc, gain);
  }

  function schedule(ctx, options = {}, seconds = 90, refs = { nodes: [] }) {
    if (!ctx || typeof ctx.createGain !== "function") return false;
    const surf = fraction(options.surf);
    const bass = fraction(options.bass);
    const beat = fraction(options.beat);
    if (!surf && !bass && !beat) return false;
    const duration = Math.max(5, Math.min(3600, Number(seconds) || 90));
    const now = ctx.currentTime;
    const master = ctx.createGain();
    const destination = options.destination || ctx.destination;
    master.gain.setValueAtTime(0.0001, now);
    master.gain.linearRampToValueAtTime(1, now + Math.min(2, duration / 3));
    master.gain.setValueAtTime(1, now + Math.max(2, duration - 3));
    master.gain.linearRampToValueAtTime(0.0001, now + duration);
    master.connect(destination);
    register(refs, master);

    if (surf) {
      const buffer = makeFoamNoise(ctx);
      const undertow = makeLayer(ctx, buffer, "lowpass", 760, surf * 0.24, -0.28, now, duration, refs, master);
      const shore = makeLayer(ctx, buffer, "lowpass", 1250, surf * 0.17, 0.28, now, duration, refs, master);
      const foam = makeLayer(ctx, buffer, "bandpass", 1500, surf * 0.10, 0.05, now, duration, refs, master);
      waves(undertow.gain, undertow.volume, now, duration, 10.6, 0, 3.3, 6.9);
      waves(shore.gain, shore.volume, now, duration, 10.6, 4.4, 3.7, 6.6);
      waves(foam.gain, foam.volume, now, duration, 10.6, 2.8, 2.3, 4.7);
    }
    if (bass) {
      // Audible low bass: 62 Hz plus an extremely soft 124 Hz harmonic.
      // This is not infrasonic stimulation and does not require high playback gain.
      tone(ctx, 62, bass * 0.035, now, duration, refs, master);
      tone(ctx, 124, bass * 0.009, now, duration, refs, master, true);
    }
    if (beat) pulse(ctx, beat, now, duration, refs, master);
    return true;
  }

  window.FocusBridgeSoundscape = Object.freeze({ schedule });
})();
