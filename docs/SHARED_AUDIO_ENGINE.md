# FocusBridge21 v2.5: Shared Output Audio Engine

## Architecture and status

The v2.5 review branch introduces a **common Web Audio output stage** for Quiet Deck's stereo tones and six-layer soundscape (surf, bass, pulse, rain, wind, HUM). The existing Rife audible waveform experiment remains on its separately tested audio graph; it has **not** been modified to pass through this bus.

```text
Original binaural oscillators ─┐
                               ├── Session Master Gain ─ Optional Gentle Dynamics
Six-layer procedural sound ────┘          │                   │
                                         ▼                   ▼
                                   UI master %      Optional Analyser
                                                             │
                                                         Destination
```

Features implemented:

- A single session master output at **80% default digital relative gain**, with an accessible 0–100% fader in preflight and during playback. Changing the master does not overwrite individual layer settings; it persists locally.
- A conservative dynamics compressor on supported Web Audio engines to soften some unexpected peaks. It is **not a true-peak limiter** and cannot guarantee against clipping or browser audio underruns.
- An on-screen **digital signal peak meter** when `AnalyserNode` is available. It reads post-compressor PCM amplitude, **not acoustic dB SPL** or measured headphone exposure.
- A short **140 ms fade toward zero** when sessions end, the user presses Return Now, or preview ends, followed by context cleanup at 170 ms. In unsupported audio environments and suspended contexts, close immediately instead of leaving the stream hanging.
- Preview and committed sessions still receive separate AudioContexts. Each context owns a bus; changes to an old cancelled preview cannot route into a newer one.
- Original consent checks, independent profile settings, Focus Sync cue narration, optional breathing visual, 6-hour cap, local-only receipts, and the full Quiet Deck remain.

## Why this helps with cracks and pops

This change addresses an abrupt *stop* discontinuity and makes peak inspection possible. The earlier v2.4 work tapered procedural noise-loop boundaries. Neither change identifies whether pops are caused by CPU load, OS audio driver buffering, output-device Bluetooth problems, stale service workers, or browser tab suspension.

## Important compatibility boundaries

- The engine uses standard Web Audio nodes; no microphone or audio recording permissions are requested.
- The compressor and analyser are optional. If either is unavailable, the output remains audible through the gain node and the meter simply cannot provide samples.
- In old or fake AudioParam implementations without event cancellation, cleanup falls back to immediate close. `AudioParam.cancelScheduledValues`/ `cancelAndHoldAtTime` behavior is browser-dependent.
- The meter reports *relative digital peak*, not perceptual loudness. Keep the OS/headphone volume low.
- Speech synthesis is a separate browser service and is **not** included in the signal meter or compressor, so voice loudness still needs real-device QA.

## QA

1. CI: `node --check docs/*.js service-worker.js`; `node --test tests/*.test.mjs`.
2. Start surf-only, bass-only and stereo-tone-only sessions at low device volume; change master from 80% to 25%, to 0%, and back. Listen for zipper noise.
3. Listen to 15-second preview, click Stop Preview, then start the real session. Confirm preview audio does not overlap the committed stream.
4. Start Focus Sync, use Pause then Return Now. Audio must close immediately in a suspended state.
5. In normal playback, click Return Now while surf/wind is audible and listen for the 140 ms fade, not a hard cut.
6. Verify digital meter only when available and distinguish meter movement from **actual speaker loudness**.
7. Test Android/Chrome, Windows/Chrome, Firefox, reduced-motion mode, offline PWA after cache upgrade, and mobile browser tab backgrounding.
8. Revisit real-device cracks: report browser/version, source preset, exact pattern/timing, headphone or speaker connection, and whether CPU load spikes.

## Next: sleep and intention layers

The next two modules will **use this common engine**, rather than inventing separate audio pipelines.

**Sleep Sanctuary+**: optional bedtime wind-down (gentle voice, optional breath invitation), noise/ambience fading after 15–60 minutes or running quietly for a chosen session, a night-dim display, and no unexpected completion chime. Avoid claiming to treat insomnia; the browser/device may suspend overnight.

**Intention Studio** (user's “subconscious programming” idea): consciously authored, editable, opt-in affirmations or personal suggestions read *while awake or winding down*, with a clear start/stop control, capped playback duration, optional silence, and no covert or subliminal audio. There is no reliable basis for promising that inaudible or asleep messages “reprogram” the subconscious. Store intentions locally and let the user delete/export them.

Reference: [MDN AudioParam](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam).
