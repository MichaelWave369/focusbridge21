# FocusBridge21: Extended Audio Profiles (v1.6)

Original, local-first audio environments for rest, focus, and subjective exploration.

## Available experiences

| Quiet Deck profile | Suggested default | Selectable durations | Main design |
| --- | --- | --- | --- |
| Just settle | 90 seconds | 1, 1.5, 2, 5, 10 minutes | Deliberately silent grounding |
| Listen & drift | 2 minutes | 2 minutes through 6 hours | Original stereo tones and optional procedural ambience |
| Sleep Sanctuary | 6 hours | 30 minutes through 6 hours | Surf + low bass; no stereo tones or rhythmic pulse by default |
| Deep Focus | 45 minutes | 25 minutes through 3 hours | Low-level 12 Hz difference stereo pair, steady environment |
| Threshold Explorer | 45 minutes | 20 minutes through 2 hours | Low-level 6 Hz difference stereo pair, subtle spatial surf |

All presets are starting points. Audio layers can be adjusted or disabled in Quiet Deck before pressing Start. Mixes are stored separately for each profile, only in this browser.

The full advanced Manual Session Builder also exposes sessions up to 360 minutes, preserving its existing readiness safeguards. For sleeping, prefer the dedicated Sleep Sanctuary route.

## How the sound engine works

- All audio is procedural Web Audio. No proprietary recordings, signature signal mixes, guided scripts, or brand-specific focus protocols are copied.
- The original surf engine loops a short locally generated textured buffer, shaped into three overlapping shoreline envelopes.
- Optional spatial movement slowly modulates the Web Audio stereo pan of surf layers over 45-second periods. It is a *stereo pan effect*, not HRTF or personalized true 3D spatial audio.
- Optional stereo tone pairs contain two audible carriers. The listed difference between them is a nominal binaural beat frequency; it is **not** measured EEG synchronization or a guarantee of any state.
- Sleep tones, if opted in, are scheduled to fade to silence by 30 minutes; ambient surf/bass can continue for up to six hours. The last few seconds of all soundscape output fade to silence. No completion chime plays.
- The soundscape scheduler caps at 21,600 seconds (6 hours), even if called with a larger number. Scheduled audio nodes stop even if UI timers are throttled.
- Real wall-clock listening and browser audio time may differ if the system sleeps, tab audio suspends, or the device shuts down. A browser tab **cannot guarantee six uninterrupted hours** across all phones or power settings. Test the target browser while awake before depending on overnight playback.

## Notes on safety and evidence

Use comfortable low volume, particularly for extended listening. Prefer speakers for ambience-only sleep if they suit the room. Binaural stereo tones require separate left/right playback; do not claim binaural beats from a mono speaker or collapsed stereo signal. A long session does not require headphones unless stereo tones are enabled.

Do not use while driving or in any environment requiring attention. Stop if audio increases distress, dizziness, headache, or discomfort. Persistent or new visual disturbances should be evaluated medically rather than treated as a sign of progression.

The original Hemi-Sync work uses layered sound and focuses on subjective practice, but its proprietary implementation is not an open source signal recipe. The Monroe Institute's later Monroe Sound Science program also explores phase modulation and spatial audio. FocusBridge21 draws only on public principles of audio synthesis, audio ergonomics, and honest session journaling.

Research into binaural-beat entrainment and effects is mixed: some controlled experiments report EEG changes and small performance improvements, but we must not treat alpha, theta, delta, or other beat frequency ranges as guaranteed switches for sleep, focus, lucid dreams, or out-of-body experiences.

References:

- Hemi-Sync technology overview: https://hemi-sync.com/learn/how-hemi-sync-works
- Monroe Institute, history of sound: https://www.monroeinstitute.org/pages/the-history-of-sound-at-the-monroe-institute
- Monroe Institute, Hemi-Sync and Expand app distinction: https://support.monroeinstitute.org/support/solutions/articles/70000659271-hemi-sync-in-expand-app
- Melnichuk et al. (2025), Scientific Reports: https://doi.org/10.1038/s41598-025-88517-z
- WHO safe listening guidance: https://www.who.int/news-room/questions-and-answers/item/deafness-and-hearing-loss-safe-listening

## Follow-on experiment: CFD field

A future opt-in **CFD Field** can offer slow, non-flashing procedural dots and clouds inspired by personal descriptions of visual noise observed with eyes closed. Keep it optional and compatible with reduced-motion settings. The visual should not claim to reproduce a neurological signal, track brain waves, or induce projection. Allow visual-free audio at all times.

Potential v1.7 work: separate long-session audio lifecycle clock from wall time; browser background-suspension warnings and resume recovery; verified long-play browser QA; accessible dark screen lock; optional fade-out start time; head-tracked spatial rendering where a compatible headset is available; receipt fields for subjective CFD observations.

## Manual verification

1. Check both root and `/docs/` entrypoints. All six Quiet Deck entry choices are available and the advanced lab remains accessible.
2. Sleep Sanctuary defaults to 6 hours, surf on, tones/pulse off, no headphone confirmation needed, safety confirmation required.
3. Enable tones in sleep: headphone confirmation becomes required. With tones, verify they fade out at 30 minutes while surf continues.
4. Ensure separate profile mixes persist after navigating between Sleep Sanctuary, Deep Focus, and Threshold Explorer.
5. Test 45+ minute sessions for absence of the old 45-minute cutoff, and 60+ minute soundscape for absence of the hidden one-hour cutoff.
6. Verify Pause/Resume, Return now, abrupt tab close, audio-blocked browser, local receipt, and offline repeat launch.
7. Verify mobile responsiveness, reduced-motion, headset stereo routing, and no loud transients.
8. For overnight use, manually test the exact browser and OS power settings rather than assuming an uninterrupted six hours.
