/*
 * FocusBridge21 Rife Frequency Lab: safe AUDIO waveform demonstration.
 *
 * This is a speaker/headphone audible oscillator, NOT an RF/EMF Rife machine,
 * not a disease-frequency generator, and not a medical treatment. There is no
 * validated disease-matching frequency. All tones are user initiated, limited,
 * finite, and have scheduled fades. No microphone, data upload or electrodes.
 */
(() => {
  "use strict";
  const FREQUENCIES = Object.freeze([110, 220, 440, 727, 787, 880]);
  const DURATIONS = Object.freeze([60, 180, 300, 600, 900]);
  const WAVEFORMS = Object.freeze(["sine", "triangle"]);
  const MOTIONS = Object.freeze(["steady", "gentle-sweep"]);
  const MAX_SECONDS = 900;
  const MAX_GAIN = 0.014;

  function config(raw = {}) {
    const frequency = FREQUENCIES.includes(Number(raw.frequency)) ? Number(raw.frequency) : 220;
    const waveform = WAVEFORMS.includes(raw.waveform) ? raw.waveform : "sine";
    const motion = MOTIONS.includes(raw.motion) ? raw.motion : "steady";
    const intensity = Number(raw.intensity);
    const quiet = Number.isFinite(intensity) ? Math.max(5, Math.min(35, intensity)) : 15;
    return Object.freeze({ frequency, waveform, motion, intensity: quiet });
  }

  // Preview is a separate, fixed-length user-initiated sound check. It is never a session.
  function schedule(context, rawOptions, rawSeconds, refs, preview = false) {
    if (!context || !context.createOscillator || !context.createGain)
      throw new Error("Audio oscillators are unavailable in this browser.");
    const options = config(rawOptions);
    const seconds = preview === true ? 15 : DURATIONS.includes(Number(rawSeconds)) ? Number(rawSeconds) : 300;
    const at = context.currentTime;
    const end = at + Math.min(seconds, MAX_SECONDS);
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    oscillator.type = options.waveform;
    const hz = oscillator.frequency;
    hz.setValueAtTime(options.frequency, at);

    // Gentle +/- 2% movement is an audible pitch exploration, not RF radiation
    // or an asserted clinical pulse protocol. It is not used in steady mode.
    if (options.motion === "gentle-sweep") {
      if (preview === true) {
        // Short audition of a subtle sweep. Normal session modulation remains unchanged.
        hz.linearRampToValueAtTime(options.frequency * 1.01, at + 7);
        hz.linearRampToValueAtTime(options.frequency, end - 2);
      }
      for (let offset = 30; offset < seconds; offset += 30) {
        const next = Math.min(offset, seconds - 2);
        hz.linearRampToValueAtTime(options.frequency * ((offset / 30) % 2 ? 1.02 : 0.98), at + next);
      }
      hz.linearRampToValueAtTime(options.frequency, Math.max(at + 1, end - 2));
    }

    const ceiling = MAX_GAIN * options.intensity / 100;
    volume.gain.setValueAtTime(0, at);
    volume.gain.linearRampToValueAtTime(ceiling, at + 2);
    volume.gain.setValueAtTime(ceiling, end - 2);
    volume.gain.linearRampToValueAtTime(0, end);
    oscillator.connect(volume).connect(context.destination);
    if (refs && Array.isArray(refs.nodes)) refs.nodes.push(oscillator, volume);
    oscillator.start(at);
    oscillator.stop(end + 0.05);
    return Object.freeze({ frequency: options.frequency, waveform: options.waveform,
      motion: options.motion, intensity: options.intensity, seconds, end });
  }

  window.FocusBridgeRife = Object.freeze({
    FREQUENCIES, DURATIONS, WAVEFORMS, MOTIONS, MAX_SECONDS, MAX_GAIN, config, schedule
  });
})();
