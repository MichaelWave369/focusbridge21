# FocusBridge21

**Sovereign threshold-training cockpit for original audio, guided practice, safe return, and local session receipts.**

FocusBridge21 is a local-first practice app for developing meditative capacities associated with progressive threshold work: readiness, body-asleep stability, expanded awareness, time-release, stable witness, clean return, and integration.

It is inspired by the broad idea of focus-level training, but it is independent of proprietary Monroe Institute / Hemi-Sync content and signals.

## Chapter 2 Going Deeper: QMM → GDM → optional exploration

- **QMM** is the first step for all dedicated Quiet Deck meditation/exploration routes. Selecting **Going Deeper (GDM)**, **Threshold Explorer** or **Focus Sync** begins with a quiet-mind practice, not a direct jump to advanced sessions.
- **GDM** follows QMM as a new silent-first Chapter 2 exercise. It offers an imagined ladder, backward-moving escalator, or no-motion stillness alternative, with a gentle imagined landing and grounded return. The physical body stays still.
- Timers offer **3, 5, 10, 15, 20 and 30 minutes** for each foundation. Optional original browser-spoken cues are off by default. Each session has a new safety check, Pause/Resume, Return Now and private local receipts.
- A completed practice offers **voluntary continuation** to the next stage; early returns cannot silently advance. Completing a timer is never described as proof of Alpha/Theta EEG, trance or astral projection.
- Passive listening, sleep, productivity focus, intentions, comfort sound and waveform labs continue to work independently. The older full laboratory is not yet subject to these new Quiet Deck routes.
- Both Pages entrypoints and the offline service worker preload the GDM module; regression tests cover safe routing and consent.

Read [QMM foundations](docs/QMM_FOUNDATION.md) and [Chapter 2 Going Deeper implementation](docs/GDM_GOING_DEEPER.md).

## v2.8 Seamless Surf Wrap: eliminate the 11-second seam dropout

- Fixed the original ocean-surf noise buffer's repeated 25 ms fade-to-silence notch. The surf's end now crossfades into the **preceding natural noise samples** over ~750 ms, maintaining an audible continuous bed instead of a short silent pulse every 11 seconds.
- Uses a raised-cosine **equal-power overlap-add** and keeps the 11-second buffer length, three surf voices, rain/wind sharing, existing gain envelopes, master dynamics and soft session stops unchanged.
- A deterministic waveform regression test verifies the *actual* final-to-first sample transition, overlap shape and absence of a zero-level notch. Existing Quiet Deck and extended-session tests still run.
- A new PWA shell cache version lets previously-installed browser apps refresh the fixed sound generator after deployment. Manual headphone/speaker listening is still required to confirm the audible issue is gone on a real device.

## v2.7 Intention Studio: create, save, and hear your own reflection scripts

- New dedicated **Intention Studio** card on the Quiet Deck home screen, using the existing shared master audio bus and original six-layer ambience.
- Write and save up to **12 personal reflection scripts**, each with an editable 60-character title, 800-character script, and snapshot of the full six-layer sound mix/HUM note/stereo-tone choice. Load, update, or confirm-delete recipes locally.
- Optional spoken playback uses the browser voice (OFF on entry), once at the start or every 3 or 5 minutes *while a conscious session is active*. One-time audition requires the existing safety check, and delayed browser tabs skip stale repetitions.
- Active view presents your own words in a distraction-light layout with Pause, Return Now and existing relative digital master control. Written scripts stay **out of Signal Ledger**; receipts contain only selected metadata.
- Browser storage is not encrypted. Speech voices may use online services. These are voluntary affirmations/reflections, not subliminal messages or proven sleep learning.

Read [Intention Studio: architecture, safety and QA](docs/INTENTION_STUDIO.md).

## v2.6 Sleep Sanctuary+ and Bedtime Intention Studio

- Existing **Sleep Sanctuary** now offers optional short narrated wind-down prompts: a start cue and a final first-minute cue, then no more speech during the sleep session. Narration remains off by default.
- Write an optional **personal bedtime intention** (up to 280 characters), stored only in this browser. A separate opt-in checkbox speaks the intended words **once** at session start. No subliminal messages and no scientifically unsupported promises of subconscious reprogramming while asleep.
- A user-triggered one-time voice preview checks the spoken text after readiness confirmation without creating a session receipt. The narration stops on Pause/Return Now as appropriate.
- An adjustable **Dim session display** setting reduces visual glow without hiding essential controls.
- Signal Ledger records only which features were enabled, never the private intention text. Browser-local storage is not encryption, and browser speech voices may use an online service.

See [Sleep and Intention Studio design and acceptance QA](docs/SLEEP_INTENTION_STUDIO.md).

## v2.5 Shared Audio Engine: master mixer and digital diagnostics

- Quiet Deck's six environmental layers and stereo tones feed a common session output bus, with an accessible **master fader** shown during preflight and live playback. Individual recipe levels remain independent.
- **Gentle dynamics processing** (when supported) reduces some peaks and an optional digital signal meter displays relative post-processor sample peaks. Neither indicates real headphone loudness or guarantees clipping protection.
- A **140 ms fade on Return Now / Stop Preview / session ending** softens abrupt cutoff; suspended or older browsers close immediately.
- The existing Rife waveform experiment remains isolated on its existing audio route, and the 15-second mix-preview, Focus Sync, safe return controls, local settings, and Signal Ledger remain in place.

See [Shared Audio Engine architecture and QA](docs/SHARED_AUDIO_ENGINE.md). Next planned: optional sleep wind-down and a consent-based Intention Studio for editable affirmations, without unsupported sleep-learning claims.

## v2.4 Guided Focus Sync and smoother soundscape loop (review candidate)

This review branch makes a focused first step toward a unified audio cockpit while preserving the existing modes, profiles, guided labs, offline shell, and safety checks.

- The procedural surf/rain/wind noise loop is now 11 seconds, with a smooth 25 ms taper at both ends, reducing a possible source of periodic clicks. This does **not** prove device-specific crackles and pops are eliminated.
- **Focus Sync** offers an optional **Speak each focus gate** control. With consent, a browser-provided voice reads the current original stage title and prompt; it is silent by default, pauses and resumes with the session, and stops on Return Now. On-screen prompts still work without speech support. Browser voice technology and whether voices use online services depend on the device.
- An independent optional visual breathing companion uses 4 seconds in / 6 seconds out with no breath-holding requirement. Breathe naturally whenever preferable. No voice, breathing animation, or listening mode claims medical benefits or proves reaching any focus state.
- Two entrypoints load the optional voice guide before Quiet Deck. The PWA shell cache is versioned for the new script, and automated test coverage adds narrative cancellation and buffer-loop seam checks.

See [Audio cockpit roadmap and manual listening QA](docs/AUDIO_COCKPIT_ROADMAP.md) for the proposed next phase: a unified master audio bus, smooth stop transitions, peak diagnostics, narration ducking, and an optional AudioWorklet backend.

## v2.3 Preview Mix: listen before starting

A separate **15-second Preview selected mix** control now appears in the Quiet Deck preflight setup for any audible preset, including six-layer soundscapes, Island 108, Focus Sync, Holistic Zone, and Rife Frequency Lab.

- **Hear exactly the chosen starting settings** at the same proportional mixer gains as the real session, with finite hardware-scheduled oscillator/noise-source stops. Focus Sync previews its **opening station**, rather than pretending to audition an entire multi-hour evolution. Rife Frequency Lab safely previews its selected single audible tone/waveform for 15 seconds.
- **See each sound layer's current setting** (surf, bass, pulse, rain, wind and HUM), the HUM musical note, optional stereo tone pair, or Rife frequency, waveform, sweep and capped output percentage. Values are **mix settings, not measured speaker/headphone loudness or dB SPL**.
- **Safe preflight:** The same comfort checkbox and stereo headphone confirmation (when tones are enabled) unlock Preview. **Stop preview now** instantly closes its own AudioContext. Preview also stops automatically after 15 seconds, on navigating away, when settings change, or when the actual session starts.
- **No accidental session:** Auditions do not start the session clock, write a Signal Ledger receipt, change saved mix settings, or modify full-session durations.
- **Low-volume practice:** Start with device/headphone volume almost silent and stop if sound is uncomfortable. A Web browser cannot detect acoustic output volume. The preview helps with relative balance and audible pitch, not hearing-safety certification.
- All nine home mode cards and the separate Island 108 feature remain intact. Test coverage includes safe consent gating, actual mixer options, automatic stop, no receipts, Focus Sync's opening gate, Rife's 15-second finite waveform preview, and profile isolation.

See [Preview Mix design and QA](docs/PREVIEW_MIX_QA.md).

## v2.2 Island 108: LOST-inspired soundscape preset

The nine main Quiet Deck cards remain unchanged. A featured **Island 108** shortcut on the homepage, plus a shortcut within Listen & drift, launches an **original fan-inspired preset** using our existing six-layer procedural sound engine. No TV-show soundtrack, dialogue, sound effects, logos, or character likenesses are included. This is unaffiliated with and not endorsed by the television series.

- **4 · 8 · 15 · 16 · 23 · 42 = 108.** The famous numbers become both a custom six-layer mix and an original six-chapter timeline. The default full route lasts **108 minutes**.
- The number-to-mixer mapping is **soft pulse 4%, warm sub-bass 8%, C3 HUM 15%, wind 16%, rain 23%, ocean surf 42%**. Stereo binaural tones are **off by default**, so the ambience can be played quietly over speakers. A user can enable optional stereo tones with normal headphone consent.
- Chapters last **4, 8, 15, 16, 23 and 42 minutes** in the default 108-minute experience. Their original reflection prompts are *Shoreline*, *The Canopy*, *Under the Sky*, *The Signal*, *After Sundown*, and *The Way Home*. No chapter beeps, alarms, copyrighted music or sound effects.
- Alternative durations **15, 45, 60 and 180 minutes** scale chapter proportions to the chosen session length. Chapter names are atmospheric suggestions, not literal events or neurological states.
- **Restore original island six-layer mix** reapplies the numbered values and full 108-minute session. Custom adjustments save locally under their **own profile**, leaving Sleep Sanctuary, Deep Focus, Focus Sync and other profiles untouched.
- Safety acknowledgment, optional headphone confirmation, Pause/Resume, RETURN NOW, the existing six-hour hard stop and browser-local Signal Ledger receipts are preserved. Device sleep may interrupt browser audio.

[Read Island 108 design and QA](docs/ISLAND_108_PRESET.md).

## v2.1 Six-Layer Soundscape: Rain, Wind, Musical HUM

The Quiet Deck mixer now supports **six independently adjustable procedural audio layers**: Ocean surf, Warm sub-bass, Soft pulse, **Rain**, **Wind**, and **HUM**. The new layers are included wherever the existing soundscape mixer appears: Listen & drift, Sleep Sanctuary, Deep Focus, Threshold Explorer, Focus Sync and the four Holistic Zone comfort presets.

- **Rain (0–100%)**: from a barely audible light rain to a full, sustained downpour, using two filtered layers of original generated noise. No thunder or sudden impulses.
- **Wind (0–100%)**: from a soft breeze to stronger, slowly swelling gusts. Rising intensity increases both level and gust depth. No sharp gust transients.
- **HUM (0–100%)**: a quiet musical drone, with a **chromatic note picker C3 to C5 inclusive** (25 notes, approximately 130.81–523.25 Hz), calculated from 12-tone equal temperament and A4 = 440 Hz. Includes a very soft harmonic, not a treatment frequency.
- **Privacy and compatibility:** Everything is generated locally in Web Audio and saved separately for each preset. Existing stored Ocean surf/sub-bass/pulse settings remain intact. Newly added layers default **off** on existing and new profiles.
- **Playback:** Each new layer is separately optional and works without binaural tones or headphones. Safety consent is still required, and headphones are required for optional stereo binaural tones. Existing 6-hour cap, Pause/Resume and RETURN NOW remain in force.
- **Performance:** Surf, rain, and wind share one locally generated noise buffer per session and use bounded low-rate gain automation instead of importing sound recordings.
- **Feedback:** Signal Ledger receipts capture new layer settings and the HUM note. These sound options are for personal ambience and musical experimentation, not for diagnosis, treatment or medical frequency claims.

See [Six-layer environmental sound design and acceptance QA](docs/SIX_LAYER_SOUNDSCAPE.md).

## v2.0 The Ninth Quiet Deck Card: Rife Frequency Lab

Quiet Deck now contains **nine accessible mode cards** in a 3-by-3 desktop layout, including a new **Rife Frequency Lab**. This is a **browser-only audible waveform experiment**, not a radiofrequency Rife machine or an electromagnetic treatment.

- Explore **110, 220, 440, 727, 787, or 880 Hz** as neutral audio examples. No frequency is labeled for an illness or claimed to kill pathogens, cure disease, or induce a measured body response.
- Compare **sine vs. triangle** tone shapes, **steady vs. gentle pitch sweep** (±2%) and conservative output level controls.
- Finite **1, 3, 5, 10, or 15-minute sessions**, guarded start, gradual gain fades, Pause/Resume and RETURN NOW.
- History, limitations and links to independent medical assessments are in [Rife Audio Lab](docs/RIFE_AUDIO_LAB.md). Cancer Research UK reports no reliable evidence that Rife machines cure cancer. Audio from a web browser is not RF or electrical stimulation.
- Existing modes, separate local settings, and private Signal Ledger are preserved.

## v1.9 Focus Sync: complete continuous journey

New in Quiet Deck: **Focus Sync**, an original continuous audio journey through the **17 publicly named Monroe focus-level entries** (1, 3, 10, 11, 12, 15, 18, 21, 22, 23, 24, 25, 26, 27, 34/35, 42, 49), followed by 12 minutes of grounded return.

- Choose **8, 12, 18, or 20 minutes per station**. A complete route lasts **2h28, 3h36, 5h18, or 5h52**, well within the Web Audio six-hour hard stop.
- The soundscape is **original**, with gentle, automatically scheduled crossovers between stereo tone differences and continuous optional ocean ambience. These are audio-design choices, **not** certified neurological frequency mappings, original Hemi-Sync recordings, or proprietary Monroe guidance.
- Live stage display, preparation itinerary, optional surf/bass/pulse mixing, mandatory comfort and headphone confirmation when appropriate, pause/resume, **RETURN NOW**, and private Signal Ledger receipts.
- Playing a labelled stage does **not** establish that anyone has reached its associated subjective, neurological, or supernatural state. The later levels are approached as reflective metaphors, not as evidence of an afterlife.
- Browser backgrounding or power saving may interrupt a multi-hour session. Test the target device and keep volume low.
- Read [Focus Sync journey, station map, references and QA](docs/FOCUS_SYNC_JOURNEY.md).

## v1.8 Holistic Zone: comfort-first sound environments

The Quiet Deck now includes a **Holistic Zone** with four short, gently adjustable soundscapes: Headache Sensitivity, Stomach Discomfort, Nausea / Queasiness, and Everyday Tension.

- Each profile starts with **stereo tones, bass pulses, and spatial movement off**. A soft, stationary surf background can be changed or turned down to silence. A full **Just settle** silent route is offered when any audio is unpleasant.
- Optional stereo tone experiments can be enabled deliberately, with a selectable **4 / 6 / 8 / 10 / 12 Hz beat difference**. All tone experiments require stereo headphone confirmation and are **not medical treatments**, diagnostic tools, or symptom-specific prescriptions.
- Each profile remembers its own local mixer levels; existing sleep, focus and explorer settings remain independent.
- The high-visibility Step 1 safety acknowledgment remains mandatory; RETURN NOW stays available.
- Symptom-aware warnings advise seeking care for sudden severe headache, neurological symptoms, severe abdominal pain, blood in vomit, and concerning dehydration. Nothing in the app is intended to replace medical care.
- Review the [evidence boundaries, sources, and practical QA](docs/HOLISTIC_ZONE_EVIDENCE.md).

## v1.7 First-run Onboarding Clarity

An outside tester enjoyed the session but needed someone to point out the safety checkbox before playback was enabled. The Quiet Deck setup now places a prominently styled **Step 1 safety confirmation at the top**, followed by duration and optional sound controls, then **Step 3 Start**. A visible status explains exactly why Start is locked and a "Show me what to check" button brings keyboard focus back to the missing requirement. No safety checks were removed or automatically accepted.

## v1.6 Extended Sessions and Original Audio Profiles

The Quiet Deck now offers **Sleep Sanctuary**, **Deep Focus**, and **Threshold Explorer** in addition to **Just settle** and **Listen & drift**.

- **Up to six hours** (360 minutes), with the previously hidden one-hour cap removed from the procedural soundscape scheduler.
- **Sleep Sanctuary:** original ocean ambience with very quiet optional bass, stereo tones off by default, no completion chime, and a full-duration gentle fade. Optional tones fade away within the first 30 minutes. Surf-only playback works over speakers without a headphone confirmation.
- **Deep Focus:** steady low-volume sound for work or study, 25–180 minutes.
- **Threshold Explorer:** subtle, slow stereo movement for contemplative listening, 20–120 minutes. No claim of astral projection or a specific neurological state.
- **Listen & drift** includes short exercises and longer 45-minute to six-hour options. **Just settle** remains silent and simple.
- **Independent browser-local mixes** for each audio profile. Existing Quiet Deck preferences and Signal Ledger entries remain in place.
- **Advanced Manual Session Builder** also exposes longer durations up to 360 minutes. Its existing safety gate and original audio design remain unchanged.
- **Return now**, pause/resume, and bounded Web Audio stop times remain available.
- **Original stereo spatial drift** in the surf layers is slow panning, not personalized 3D/HRTF simulation or EEG feedback.

Long playback is best-effort: browsers and operating systems can suspend audio when a device sleeps or backgrounds a tab. Test your device awake before depending on overnight use. Keep sound very quiet for extended listening. For sleep, consider speakers with tones disabled rather than wearing headphones for hours.

See [Extended Audio Profiles and evidence boundaries](docs/EXTENDED_AUDIO_PROFILES.md) for duration tables, practical QA, audio details, scientific references, and the future opt-in CFD visual-field concept.

## v1.5 Playback clarity and safety feedback

The full cockpit now explains exactly why a session cannot start, **without unexpectedly navigating away from Cockpit**.

- If the `YES, I recently had a distressing or destabilizing meditation / altered-state experience` checkbox is checked, audio remains blocked and the interface clearly explains the hold. Leave it unchecked only if the statement does not apply.
- Safe location, stereo headphones, and safety acknowledgement must all be confirmed. The Start button is disabled while any requirement is missing, with a visible `Review readiness checks` action.
- The readiness gate no longer recommends an audio Foundation session while a stop condition is active. Changing the readiness answers invalidates stale recommendations.
- A stereo sound test is available next to the Cockpit controls when safety prerequisites are complete. A status message distinguishes a successfully started Web Audio context from a suspended/blocked context; it cannot verify physical sound output or operating-system mute settings.
- Failed audio start cleans up nodes and keeps you in the current step with an actionable diagnostic.
- Quiet Deck now describes `Just settle` as **intentionally silent** and prevents an `Listen & drift` session from claiming playback when the stereo tones and every soundscape layer are off.
- PWA cache version was bumped to ensure older cached JavaScript is replaced.
- Added automated regression tests for safety-blocked start, successful audio graph startup, suspended audio contexts, and silent Quiet Deck mixes.

After deployment, reload the page once to activate the updated service worker. If you still see the old code, close the tab, reopen the site, and reload. Avoid clearing browser storage unless you have exported private Signal Ledger data.

## v1.4 Original Ocean Soundscape

**Original, locally generated sound, not a Hemi-Sync recording or a claim of brainwave entrainment.**

The FocusBridge21 **Quiet Deck > Listen & drift** setup now includes an independent three-layer soundscape mixer alongside the optional stereo tones. The original advanced **Manual Session Builder** also has the mixer without removing any existing noise presets or labs.

| Layer | How it works | Default in Quiet Deck |
| --- | --- | --- |
| Ocean surf | Three filtered, overlapping waves of locally generated textured noise with gentle swells and foam | 68% |
| Warm sub-bass | Very quiet 62 Hz sine foundation plus an even quieter 124 Hz harmonic | 14% |
| Soft pulse | Subtle 72 Hz envelopes every 1.5 seconds (40 BPM), not a sharp kick drum | Off |
| Stereo tones | Original low-level binaural stereo tones | On, but optional |

- Each layer has a 0–100% level. **All off** is possible; no added sounds are mandatory.
- Mix levels are browser-local in the Quiet Deck and persisted with existing preferences in the advanced cockpit.
- Original procedural audio buffers are generated in browser memory; no copyrighted Hemi-Sync media or network audio assets are used.
- Sound nodes are registered for **Return now**, and oscillators/buffers also have a bounded scheduled stop time.
- The PWA cache includes the new audio module for repeat offline access after a complete first load.
- Previous full-app "Parallax" branding was replaced with PHI369 branding.
- These sounds are for creative relaxation and personal practice. Rhythm may help some listeners and distract others, so start with all added layers quiet and adjust gently. Avoid boosting volume to "feel" sub-bass through headphones.
- Do not use audio experiments when dizzy, near-fainting, ill, or otherwise unwell. Seek medical evaluation for concerning symptoms rather than interpreting them as meditative progress.

### v1.4 manual QA

1. Open both GitHub Pages routes; confirm soundscape engine loads and Quiet Deck opens.
2. Listen & drift: surf at ~60%, bass at ~10%, pulse off; begin at low device volume; test Return now and pause.
3. Turn stereo tones off and leave surf on; check that surf can play alone.
4. Set surf, bass, and pulse to 0 and re-enable tones; verify tones-only works.
5. Try gentle pulse at 10–20%; verify it stays subtle without harsh clicks or sudden loud transients.
6. Open the advanced app. Confirm the Parallax text is gone, the old presets still work, and the soundscape sliders persist.
7. Check at a narrow/mobile width and test after reloading the updated service worker.
8. Verify any received Quiet Deck journal entries include mix settings but no fabricated physiological measurements.

## v1.3 Quiet Deck: a comfortable way in

The default landing experience is now **Quiet Deck**, a small, accessible front door to the complete existing laboratory. All v1.2 features, including the guided readiness flow, full audio builder, Command Hub, Labs, return protocol, and Signal Ledger, remain available via **All tools & labs**. From the full app, use the fixed **Quiet Deck** button to get back.

- **Just settle:** 60 seconds, 90 seconds, 2 minutes, or 5 minutes with no audio and no forced breathing cadence.
- **Listen & drift:** opt-in gentle, original Web Audio stereo tones (180 Hz left, 188 Hz right). Stereo headphones are required; start at low volume. This is exploratory audio, not a verified Focus-state induction.
- **Simple controls:** pause/resume, Return now at any time, a grounded return screen, and an optional one-question reflection.
- **Existing ledger:** optional Quiet Deck reflections are saved locally in the same browser Signal Ledger used by the original app. Opening the full lab reloads the application to pick up these new entries.
- **Advanced without losing features:** the existing v1.2 React/PWA cockpit and lab modules are unchanged, and both the repository root and `/docs` support the new entry.
- **Comfort:** responsive layout, keyboard focus indicators, reduced-motion support, and a clear no-audio path.

### Safety and claims

Quiet Deck deliberately avoids promising Hemi-Sync, Monroe Focus 21, astral projection, medical benefits, or neurological state changes. It does not use copyrighted proprietary recordings or scripts. Do not use audio sessions when dizzy, faint, unwell, or in an unsafe environment. If you have concerning symptoms, prioritize rest or appropriate medical care instead of an altered-state experiment.

### Manual check before merging

1. Load both `/` and `/docs/`; confirm Quiet Deck appears on each.
2. Start **Just settle** for 60 seconds and confirm the timer, pause/resume, finish, and Return now.
3. Confirm **Listen & drift** cannot start until both safety and headphone confirmations are checked; test at low volume using stereo headphones.
4. Write a note, save it, open **All tools & labs**, and confirm the Signal Ledger includes the Quiet Deck receipt.
5. Confirm existing readiness, audio presets, Command Hub, labs, and their data are still available.
6. Return to Quiet Deck and verify that reloading the full lab ends any active audio.
7. Check at mobile width, on keyboard-only navigation, with reduced motion, and with network offline after first load.

## Live GitHub Pages app

The browser React/PWA prototype can run from the repo root or from `/docs` with no build step:

**https://michaelwave369.github.io/focusbridge21/**

### Current live version

**FocusBridge21 v1.6 extended Quiet Deck + preserved v1.2 Experience Layer**

The live app includes:

- v1.2 Experience Guide bar for onboarding and safer first-run use.
- First-run orientation tour: readiness, short sessions, RETURN NOW, local ledger, and beginner mode.
- Beginner Mode toggle that hides advanced lab launchers for a calmer practice cockpit.
- Advanced Mode toggle that restores the full lab stack.
- Privacy & Data Center for local storage visibility, private backup export, cache refresh, and local data clearing.
- Practice Snapshot with release readiness, streak, average return, average coherence, average resistance, receipts, and best-next-move guidance.
- Unified **Command Hub** that replaces the scattered floating launcher stack with one clean cockpit entry point.
- Command Hub stats: receipts, streak, average coherence, and average return quality.
- Command Hub recommendations for the best next tool based on local receipts.
- Guided Session Flow Wizard: readiness → recommendation → cockpit → return → journal → ledger.
- Smooth quick-start cards: 2-min demo, gentle reset, Bridge preview, training session.
- Readiness Gate Score with safer automatic preset/duration suggestions.
- Recommended Session card that loads the safest session for the current state.
- Practice Tracker with streak, total receipts, current protocol week, and suggested next practice.
- Foundation, Expansion, No-Time, and Bridge presets.
- Browser Web Audio binaural session generator.
- Stereo headphone test.
- Optional pink, brown, or white noise layer.
- Slow non-flashing sacred-geometry cockpit visual.
- Live timer, phase model, coach card, and progress bar.
- Neutral and Resonance Architect guidance modes.
- RETURN NOW and Auto-Return grounding screen with a 60-second return timer.
- Post-session journal receipt.
- Browser-local Signal Ledger using `localStorage`.
- Ledger stats cards, best-coherence receipt hint, and lightweight pattern insights.
- JSON and CSV ledger export.
- 8-week mastery protocol.
- PWA install support with manifest, app icon, theme color, and service-worker cache shell.
- Floating Smart Coach overlay with next-practice hints, local pattern summary, offline/app status, and install helper.
- Pattern Lab overlay with best-condition analysis, recommendation logic, receipt cards, breath pacer, and 7-day plan generator.
- Clean shareable/downloadable session receipt cards with private notes hidden by default.
- Breath Pacer for pre-session grounding or RETURN NOW support.
- Studio Lab overlay with Today view, Private Backup Vault, Weekly Review export, 7-day smooth plan, Comfort Profiles, and quick tone checks.
- Full local backup/restore for FocusBridge21 browser data.
- Comfort profiles that apply safer builder defaults and reload the app cleanly.
- Mastery Lab overlay with capacity map, milestones, best-condition analysis, local coach card, audio recipe library, custom comfort builder, 14-day plan, calendar export, and mastery report export.
- Guidance Lab overlay with preflight checklist, script builder, browser-local voice guide, voice/rate/pitch controls, script copy/export, and local coach hints.
- Sparse guidance modes: Minimal Zen, Neutral, Resonance Architect, and Return Only.
- Audio Lab overlay with carrier/base Hz calibration, comfort meter, recipe library, tone checks, 18-second mix preview, and local pattern-based audio recommendations.
- Downloadable audio recipe JSON and copyable calibration notes.
- **v1.0 Release Hub** with release readiness score, safety charter, data health center, private backup, launch packet, Markdown release report, roadmap, and v1.0 completion checklist.

Recommended GitHub Pages setting:

```text
Settings → Pages → Source: Deploy from branch → main → /(root)
```

The app shell also exists in `/docs`, so `main → /docs` can work too. If the site shows a 404, switch Pages from GitHub Actions to "Deploy from branch" and choose `main` with `/(root)`, then wait a couple minutes for Pages to publish.

## What it is not

- Not a Hemi-Sync clone or ripoff.
- Not a guaranteed Focus 21 switch.
- Not an out-of-body guarantee.
- Not a medical device, therapy, diagnosis tool, or clinical treatment.
- Not a push-button altered-state machine.

## What it is

- A disciplined local practice cockpit.
- An original generated-audio experiment engine.
- A readiness and return safety system.
- An append-only Signal Ledger for personal state cartography.
- A Parallax / PHI369-aligned training tool: local-first, receipt-driven, safety-bound, and claim-disciplined.

> We do not promise the gate. We train the capacities that make the gate safer, clearer, and more repeatable.

## Local Python prototype

The Streamlit prototype remains available as `app.py`.

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
streamlit run app.py
```

The Python app stores local runtime data in:

```text
audio/                 generated WAV files
ledger/sessions.jsonl  append-only session receipts
exports/               CSV exports
```

These folders are intentionally ignored by Git so private session data does not get committed.

## Safety first

Do not use FocusBridge21 while driving, operating machinery, or in any situation requiring full external attention.

Consult a qualified healthcare or mental-health professional before using audio/visual altered-state practices if you have a history of seizures, photosensitive epilepsy, severe anxiety or panic, psychosis, dissociation, or destabilizing experiences with meditation or altered states.

Visuals are slow and non-flashing by default. Keep volume low. Start short. Use RETURN NOW whenever needed.

## Project structure

```text
.
├── index.html
├── 404.html
├── manifest.webmanifest
├── service-worker.js
├── app.py
├── requirements.txt
├── README.md
├── LICENSE
├── docs/
│   ├── index.html
│   ├── styles.css
│   ├── upgrade.css
│   ├── pwa-coach.css
│   ├── pattern-lab.css
│   ├── fb21-v06-lab.css
│   ├── fb21-v07-masterylab.css
│   ├── fb21-v08-guidancelab.css
│   ├── fb21-v09-audiolab.css
│   ├── fb21-v10-releasehub.css
│   ├── fb21-v10-layout-fix.css
│   ├── fb21-v11-commandhub.css
│   ├── fb21-v12-experience.css
│   ├── fb21-react.js
│   ├── fb21-pwa-coach.js
│   ├── fb21-pattern-lab.js
│   ├── fb21-v06-lab.js
│   ├── fb21-v07-masterylab.js
│   ├── fb21-v08-guidancelab.js
│   ├── fb21-v09-audiolab.js
│   ├── fb21-v10-releasehub.js
│   ├── fb21-v11-commandhub.js
│   ├── fb21-v12-experience.js
│   ├── icon.svg
│   └── FocusBridge21_Master_Spec_v0.2.md
└── site/
    └── index.html
```

## Master spec

See [`docs/FocusBridge21_Master_Spec_v0.2.md`](docs/FocusBridge21_Master_Spec_v0.2.md).

## License

MIT License. See [`LICENSE`](LICENSE).
