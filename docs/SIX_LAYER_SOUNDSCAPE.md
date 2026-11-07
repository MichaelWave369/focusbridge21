# Six-layer procedural audio: Rain, Wind and Musical HUM

FocusBridge21 v2.1 expands the Quiet Deck's **Ocean surf / Warm sub-bass / Soft pulse** mixer with **Rain / Wind / HUM**. These are original browser-generated sounds, not sampled or streamed recordings. No external service, account, or microphone is needed.

## Layer controls

| Layer | Range | Synthesis | Default |
| --- | --- | --- | --- |
| Ocean surf | 0–100% | Three overlapping filtered noise waves, unchanged | Existing profile-specific value |
| Warm sub-bass | 0–100% | 62 Hz sine and very quiet 124 Hz harmonic, unchanged | Existing profile-specific value |
| Soft pulse | 0–100% | Gentle 40 BPM 72 Hz pulse, unchanged | Existing profile-specific value |
| **Rain** | 0–100% | Two noise bands, a warm rain bed (~1.5 kHz band) and airy droplets (~2.9 kHz highpass). Slider increases both amplitude and brighter rain texture. Envelope rises/falls softly. | **Off** |
| **Wind** | 0–100% | Filtered low wind (~330 Hz lowpass) and a softer airflow band (~760 Hz bandpass). Slider increases output and gust depth while slowly varying volume over ~9–17 seconds. | **Off** |
| **HUM** | 0–100% plus musical note | Soft sine fundamental and extremely quiet octave overtone. All 25 chromatic notes **C3–C5**, from ~130.81 to ~523.25 Hz, inclusive. | **Off** with C4 selected |

The rain and wind frequencies describe **filters** on noise, not a narrow pure tone. They are not equal to weather recordings or instruments and do not produce actual gusts or rain. The HUM setting is **musical pitch** rather than a healing-frequency prescription.

## Engineering decisions

- **No change to profile identity or duration:** All existing Quiet Deck profiles still use their own duration, readiness checks, and optional binaural tones. The ninth Rife Frequency Lab keeps its separate, dedicated audible oscillator and is not mixed with environmental ambience.
- **One noise buffer:** Surf, rain and wind share a single, original 3-second procedurally generated noise buffer per active AudioContext. The generated buffer loops through independent filters. Disabled layers allocate no source nodes. HUM's waveform is a native oscillator.
- **No abrupt transients or thunder:** Weather uses slow gain ramps and separate frequency filtering. HUM uses the existing fade-in/out. New layers do not pan by default, even when an existing profile has stereo-space ambience.
- **Six-hour bounded sessions:** Each buffer source and oscillator has a finite stop time. The existing overall master fade and RETURN NOW / pagehide AudioContext cleanup still apply.
- **Safe headphone experience:** Keep system volume low. Perceived output depends on speakers and headphones; Web Audio gain cannot tell the user actual acoustic dB SPL. Stop if a tone or weather texture feels unpleasant, especially during headache or nausea.
- **Backwards-compatible preferences:** Existing keys `focusbridge21-quiet-soundscape-v14` and `focusbridge21-quiet-profile-mixes-v16` are retained. Additional fields are `rain`, `wind`, `hum`, `humNote`; old profiles gracefully fall back to `0,0,0,"C4"`. Each profile stores its own values without changing saved audio settings for others.
- **Receipt format:** Existing `audio_params` keeps old values and adds `rain`, `wind`, `hum`, `hum_note` (the note only when HUM is nonzero). No health claims, EEG states or user medical data are inferred.

## HUM pitch math

Equal temperament from A4 = 440 Hz:

```
midi = 48, 49, ... 72  // C3 through C5
frequency = 440 × 2 ^ ((midi - 69) / 12)

C3 = 130.81 Hz
C4 = 261.63 Hz
C5 = 523.25 Hz
```

## Acceptance tests

Automated:
1. Old three layers continue unchanged; turning all six down (and stereo tones off) blocks misleading silent playback.
2. Rain-only and wind-only are playable without binaural headphones after safety confirmation.
3. Drizzle and downpour amplitudes differ, wind gusts vary smoothly, and separate noise sources have scheduled stop times.
4. HUM off produces zero oscillators. Each of C3, C4 and C5 gives the correct fundamental plus a low-gain octave harmonic. All 25 chromatic notes are present.
5. Rain/wind/surf share one buffer, and all six can run until 21,600 seconds without hidden 45/60-minute cutoffs.
6. Newly added mix settings persist per profile, do not overwrite other profiles, and are reflected accurately in the local Signal Ledger.
7. Offline cache version is updated so installed users receive the new scripts.

Manual:
1. Listen at low volume on wired headphones and speakers. Verify that a low rain level resembles light rain, with gradually more texture as the slider increases; wind should swell gently.
2. Select C3, C4, C5, and a few sharps in the HUM picker. Ensure a change is audible **in the next session**, since sounds are scheduled when playback starts. Do not make a live control silently imply retuning an already running oscillator.
3. Compare surf + rain + wind, and a gentle HUM under ambient sounds, for clipping or unpleasant artifacts across mobile/desktop devices.
4. Pause, Resume, Return now, background/foreground browser and full-duration auto-stop, including an extended Sleep Sanctuary session.
5. Verify Holistic Zone continues to default all extra layers off for sound-sensitive users.

This mode is designed for **comfort listening and original sonic experimentation**, not disease-specific frequency treatment or guaranteed brain entrainment.
