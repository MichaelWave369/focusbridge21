/*
 * FocusBridge21 Original Soundscape v2.1
 * Procedural surf, gentle sub-bass, pulse, rain, wind and musical HUM.
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
  // Equal-temperament notes C3 (MIDI 48, ~130.81 Hz) through
  // C5 (MIDI 72, ~523.25 Hz), inclusive, derived from A4 = 440 Hz.
  const NOTE_NAMES = Object.freeze(["C", "C#", "D", "D#", "E", "F",
    "F#", "G", "G#", "A", "A#", "B"]);
  const HUM_NOTES = Object.freeze(Array.from({ length: 25 }, (_, index) => {
    const midi = 48 + index;
    return Object.freeze({
      name: NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1),
      hz: Number((440 * Math.pow(2, (midi - 69) / 12)).toFixed(2))
    });
  }));
  const register = (refs, ...nodes) => {
    if (refs && Array.isArray(refs.nodes)) refs.nodes.push(...nodes);
  };

  function makeFoamNoise(ctx) {
    const size = Math.max(512, Math.round(ctx.sampleRate * 11));
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    // Do not fade the 11-second sample to silence at its boundary: the
    // recurring 25 ms dip was audible as a click or tiny dropout in surf.
    // Instead extend the original noise by a short leading segment, then
    // wrap the tail back into that segment with a smooth overlap-add.
    // This keeps the noise bed continuous at playback's exact loop boundary.
    const overlap = Math.min(Math.floor(size / 4),
      Math.max(16, Math.round(ctx.sampleRate * 0.75)));
    const head = new Float32Array(overlap);
    let pink = 0;
    for (let i = 0; i < size + overlap; i++) {
      pink = 0.93 * pink + 0.07 * (Math.random() * 2 - 1);
      const sample = 0.65 * pink + 0.35 * (Math.random() * 2 - 1);
      if (i < overlap) head[i] = sample;
      else channel[i - overlap] = sample;
    }
    // The final sample becomes head[overlap - 1] and the first sample
    // follows as the very next original noise sample. That makes the
    // transition a natural adjacent-sample pair, not an abrupt reset.
    // Equal-power raised-cosine weights avoid a fade-to-silence trough,
    // while the eased ramp avoids a sharp change at the crossfade edges.
    for (let i = 0; i < overlap; i++) {
      const progress = i / (overlap - 1);
      const eased = progress * progress * (3 - 2 * progress);
      const angle = eased * Math.PI / 2;
      const tailIndex = size - overlap + i;
      channel[tailIndex] = channel[tailIndex] * Math.cos(angle) +
        head[i] * Math.sin(angle);
    }
    return buffer;
  }

  function makeLayer(ctx, buffer, type, frequency, volume, pan, t, seconds, refs, output, spatial = 0) {
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
      panner.pan.setValueAtTime(pan, t);
      // Deliberately subtle stereo wandering, never hard left/right movement.
      // Fixed virtual positions remain the default when spatial is zero.
      if (spatial > 0) {
        let direction = 1;
        for (let at = t + 45; at < t + seconds; at += 45) {
          panner.pan.linearRampToValueAtTime(
            Math.max(-0.65, Math.min(0.65, pan + direction * spatial)), at);
          direction *= -1;
        }
      }
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

  // Smooth weather amplitude with finite, sparse gain automation.
  // Wind uses more dynamic gusts as its slider rises; rain stays steady.
  function weatherEnvelope(gain, peak, t, seconds, cycle, depth) {
    const end = t + seconds;
    const floor = Math.max(0.0001, peak * (1 - depth));
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(floor, t + Math.min(2, seconds / 3));
    for (let at = t + cycle; at + cycle * 0.55 < end - 2; at += cycle) {
      gain.gain.linearRampToValueAtTime(Math.max(0.0001, peak), at);
      gain.gain.linearRampToValueAtTime(floor, at + cycle * 0.55);
    }
    gain.gain.setValueAtTime(floor, Math.max(t + 2, end - 2));
    gain.gain.linearRampToValueAtTime(0.0001, end);
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
    const rain = fraction(options.rain);
    const wind = fraction(options.wind);
    const hum = fraction(options.hum);
    if (!surf && !bass && !beat && !rain && !wind && !hum) return false;
    const duration = Math.max(5, Math.min(21600, Number(seconds) || 90)); // bounded six-hour playback
    const now = ctx.currentTime;
    const spatial = fraction(options.space) * 0.18; // at most 18% stereo-pan offset
    const master = ctx.createGain();
    const destination = options.destination || ctx.destination;
    master.gain.setValueAtTime(0.0001, now);
    master.gain.linearRampToValueAtTime(1, now + Math.min(2, duration / 3));
    master.gain.setValueAtTime(1, now + Math.max(2, duration - 3));
    master.gain.linearRampToValueAtTime(0.0001, now + duration);
    master.connect(destination);
    register(refs, master);

    // One in-memory original noise buffer shared by surf/rain/wind;
    // no samples, assets or extra memory allocations for the three layers.
    const noiseBuffer = (surf || rain || wind) ? makeFoamNoise(ctx) : null;
    if (surf) {
      const buffer = noiseBuffer;
      const undertow = makeLayer(ctx, buffer, "lowpass", 760, surf * 0.24, -0.28, now, duration, refs, master, spatial);
      const shore = makeLayer(ctx, buffer, "lowpass", 1250, surf * 0.17, 0.28, now, duration, refs, master, spatial);
      const foam = makeLayer(ctx, buffer, "bandpass", 1500, surf * 0.10, 0.05, now, duration, refs, master, spatial);
      waves(undertow.gain, undertow.volume, now, duration, 10.6, 0, 3.3, 6.9);
      waves(shore.gain, shore.volume, now, duration, 10.6, 4.4, 3.7, 6.6);
      waves(foam.gain, foam.volume, now, duration, 10.6, 2.8, 2.3, 4.7);
    }
    if (rain) {
      // High-frequency droplets over a soft rain bed. Raising the slider
      // increases both level and bright-droplet presence, without thunder.
      const canopy = makeLayer(ctx, noiseBuffer, "bandpass", 1500,
        rain * 0.075, -0.1, now, duration, refs, master);
      const droplets = makeLayer(ctx, noiseBuffer, "highpass", 2900,
        Math.pow(rain, 1.6) * 0.040, 0.1, now, duration, refs, master);
      weatherEnvelope(canopy.gain, canopy.volume, now, duration, 21, 0.09);
      weatherEnvelope(droplets.gain, droplets.volume, now, duration, 13, 0.18);
    }
    if (wind) {
      // Filtered air with smooth gust envelopes, no harsh gust transients.
      const gustDepth = 0.18 + wind * 0.59;
      const gustCycle = 17 - 8 * wind;
      const body = makeLayer(ctx, noiseBuffer, "lowpass", 330,
        wind * 0.110, -0.16, now, duration, refs, master);
      const air = makeLayer(ctx, noiseBuffer, "bandpass", 760,
        wind * 0.039, 0.16, now, duration, refs, master);
      weatherEnvelope(body.gain, body.volume, now, duration, gustCycle, gustDepth);
      weatherEnvelope(air.gain, air.volume, now, duration, gustCycle + 2, gustDepth * 0.84);
    }
    if (hum) {
      const selected = HUM_NOTES.find(note => note.name === options.humNote) || HUM_NOTES[12];
      // Quiet musical foundation with an extremely soft overtone.
      tone(ctx, selected.hz, hum * 0.018, now, duration, refs, master);
      tone(ctx, selected.hz * 2, hum * 0.0035, now, duration, refs, master);
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

  window.FocusBridgeSoundscape = Object.freeze({ schedule, HUM_NOTES });
})();
