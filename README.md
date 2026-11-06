# FocusBridge21

**Sovereign threshold-training cockpit for original audio, guided practice, safe return, and local session receipts.**

FocusBridge21 is a local-first practice app for developing meditative capacities associated with progressive threshold work: readiness, body-asleep stability, expanded awareness, time-release, stable witness, clean return, and integration.

It is inspired by the broad idea of focus-level training, but it is independent of proprietary Monroe Institute / Hemi-Sync content and signals.

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

**FocusBridge21 v1.3 Quiet Deck + preserved v1.2 Experience Layer**

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
