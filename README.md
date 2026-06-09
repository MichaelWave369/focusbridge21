# FocusBridge21

**Sovereign threshold-training cockpit for original audio, guided practice, safe return, and local session receipts.**

FocusBridge21 is a local-first practice app for developing meditative capacities associated with progressive threshold work: readiness, body-asleep stability, expanded awareness, time-release, stable witness, clean return, and integration.

It is inspired by the broad idea of focus-level training, but it is independent of proprietary Monroe Institute / Hemi-Sync content and signals.

## Live GitHub Pages app

The browser React prototype can run from the repo root or from `/docs` with no build step:

**https://michaelwave369.github.io/focusbridge21/**

### Current live version

**React Pages v0.7 Mastery Lab**

The live app includes:

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
- **Studio Lab overlay** with Today view, Private Backup Vault, Weekly Review export, 7-day smooth plan, Comfort Profiles, and quick tone checks.
- Full local backup/restore for FocusBridge21 browser data.
- Comfort profiles that apply safer builder defaults and reload the app cleanly.
- **Mastery Lab overlay** with capacity map, milestones, best-condition analysis, local coach card, audio recipe library, custom comfort builder, 14-day plan, calendar export, and mastery report export.

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
├── service-worker.js
├── manifest.webmanifest
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
│   ├── fb21-react.js
│   ├── fb21-pwa-coach.js
│   ├── fb21-pattern-lab.js
│   ├── fb21-v06-lab.js
│   ├── fb21-v07-masterylab.js
│   ├── icon.svg
│   └── FocusBridge21_Master_Spec_v0.2.md
└── site/
    └── index.html
```

## Master spec

See [`docs/FocusBridge21_Master_Spec_v0.2.md`](docs/FocusBridge21_Master_Spec_v0.2.md).

## License

MIT License. See [`LICENSE`](LICENSE).
