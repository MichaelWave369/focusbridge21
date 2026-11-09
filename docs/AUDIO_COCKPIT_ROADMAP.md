# FocusBridge21 next-generation audio cockpit: technical roadmap

Status: **v2.4 first step proposed for review**. The six-layer soundscape, preflight preview, 17-station Focus Sync itinerary, safety checks, six-hour cap, Signal Ledger, and all nine home cards remain.

## v2.4 first step: eliminate an obvious discontinuity and join voice to Quiet Deck

- Generate an 11-second original textured-noise buffer instead of repeating a three-second random snippet. Taper the first and last 25 ms with smooth cosine windows, so a loop cannot jump between unrelated sample values. This targets one *plausible* source of periodic ticks, but does not establish the cause of the user's device-specific crackles.
- Focus Sync gains a **disabled-by-default** speech toggle at preflight. The browser's speech service reads the current gate's original title and prompt at entry, and reads the 12-minute return station when that stage begins. No speech while the option is off. Existing on-screen prompts remain primary.
- A separate **disabled-by-default** breathing visual offers a comfortable 4-second expansion / 6-second contraction without holds. It is a visual invitation, never a respiratory instruction to follow if uncomfortable.
- Pause/resume propagates to speech; RETURN NOW, navigation, session end, and pagehide cancel speech. Voice does not play during 15-second sound previews or create a session receipt on its own.
- Voice rate is reduced and volume requested conservatively. Browser/OS speech synthesis is **not sample-synchronized** to the Web Audio stream, and actual spoken loudness depends on the device. Depending on the selected system voice, speech may be provided by an online service. Do not advertise it as guaranteed offline or private-device-only TTS.

## Known risks and how to diagnose pops

| Symptom | Likely source to investigate | Reproduction / evidence |
| --- | --- | --- |
| Click repeating at a regular short interval | Old random-noise buffer loop boundary | Test surf-only, rain-only, and wind-only for several minutes with tones disabled; compare v2.3 to v2.4 at low volume |
| Click when pressing Return Now or Stop Preview | Immediate node disconnect / AudioContext.close | Compare with upcoming 50–100 ms soft-stop envelope |
| Pops when switching tabs or under heavy CPU load | Audio underruns, browser suspension, power-saving behavior | Record device, browser, output interface, background state, and CPU activity |
| Clicking around the slow pulse | Short envelope attack or abrupt parameter reset | Test pulse alone at 10–20% and then off |
| Distortion only with multiple layers enabled | Summed peaks or headphone/output-chain overload | Lower all mixer levels and device volume; later inspect real peak meter |

No simulated oscillator unit test can prove glitch-free playback on particular headphones. Do not raise volume to investigate a suspected click.

## Proposed engine architecture

```text
User-selected session profile / saved recipe
          |
     Session Conductor (timeline, pause, return, cancellation)
          |
    +-----+----------------+-----------------+
    |                      |                 |
Web Audio generators   Speech coach      Visual guide
(surf, rain, wind,     (optional,       (optional breath
 bass, pulse, HUM,      browser TTS /     and stage progress)
 stereo tones)          local recording)
    |
Independent layer gains / buses
    |
Master volume, safety attenuation, soft start/stop
    |
Optional analyser/peak meter and performance diagnostics
    |
Device output
```

### Phase 2: unify mixer and smooth all transitions

1. Create one explicit session master output bus, independent gains for each layer, and 100–250 ms user-triggered transitions. Preserve the currently immediate **control response** while allowing a short fade before closing nodes.
2. Add gentle peak limiting, not automatic volume boosting, and a **true master output** knob that does not change stored layer recipe percentages.
3. Add on-screen signal meters explicitly labeled as **digital levels**, not measured speaker loudness/dB SPL. Include a pop-diagnostic mode with a deterministic recipe, not arbitrary audio recording.
4. Avoid a new AudioContext for each overlapping UI action; keep **preview isolated** and ensure cancellation is race-safe. Maintain browser-local Signal Ledger behavior.
5. Add first-minute optional spoken breathing introductions, a quiet/neutral/narrator level control, and opt-in ducking of the soundscape during narration.

### Phase 3: real-time procedural sound and polished visual engine

- Evaluate AudioWorklet for uninterrupted noise synthesis, timed envelopes, a master processor, and long-duration scheduling. Keep current graph as a safe fallback when Worklets are unavailable. Worklets operate on a separate audio rendering thread on supported browsers, rather than executing custom processing on the main UI thread.
- Build a responsive immersive mixer with selectable studio, quiet, sleep, and focus layouts. Offer accessible controls, keyboard navigation, reduced-motion defaults, and non-flashing orbit visuals.
- Offer voice packs only if original recordings are licensed for redistribution; keep voice entirely opt-in. Spoken gate cues and optional breathing should never claim to achieve a measured neurological state.
- Add automated offline signal tests for peak bounds, end fades, per-layer isolation, and cancellation. Browser listening tests on headphones, speakers, mobile, and low-resource hardware remain mandatory.

## Validation for this v2.4 PR

- `node --check docs/*.js` and `node --test tests/*.test.mjs` (CI performs these).
- Confirm both the repository-root route and `/docs/` route load the voice script before Quiet Deck.
- At low volume, listen to surf-only / rain-only / wind-only for at least 60 seconds and compare loop seam behavior; then test full six-layer Island 108.
- Focus Sync: opt-in voice on/off, first and next gate cue, pause/resume, 12-minute return stage, Return Now, and pagehide; verify voice never auto-starts during preview.
- Check screen reader focus order and keyboard-only setup; test reduced-motion and narrow viewport.
- Confirm no web page can assert an acoustic decibel reading, a medically verified effect, or that a time-based focus gate was objectively achieved.

## API background

- [MDN: AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet)
- [MDN: Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API)
- [MDN: SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)

This is an engineering design and listening-experience plan, not a medical device specification.
