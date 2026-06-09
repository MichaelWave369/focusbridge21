# FocusBridge21

**Sovereign threshold-training cockpit for original audio, guided practice, safe return, and local session receipts.**

FocusBridge21 is a local-first practice app for developing meditative capacities associated with progressive threshold work: readiness, body-asleep stability, expanded awareness, time-release, stable witness, clean return, and integration.

It is inspired by the broad idea of focus-level training, but it is independent of proprietary Monroe Institute / Hemi-Sync content and signals.

## Live GitHub Pages app

The browser React prototype lives in `/docs` and is designed to run directly from GitHub Pages with no build step:

**https://michaelwave369.github.io/focusbridge21/**

The live app includes:

- Readiness Gate Score.
- Foundation, Expansion, No-Time, and Bridge presets.
- Browser Web Audio binaural session generator.
- Optional pink, brown, or white noise layer.
- Slow non-flashing sacred-geometry cockpit visual.
- Neutral and Resonance Architect guidance modes.
- RETURN NOW grounding protocol.
- Post-session journal receipt.
- Browser-local Signal Ledger using `localStorage`.
- JSON and CSV ledger export.
- 8-week mastery protocol.

To publish it, set GitHub Pages to:

```text
Settings → Pages → Source: Deploy from branch → main → /docs
```

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
├── app.py
├── requirements.txt
├── README.md
├── LICENSE
├── docs/
│   ├── index.html
│   ├── styles.css
│   ├── fb21-react.js
│   └── FocusBridge21_Master_Spec_v0.2.md
└── site/
    └── index.html
```

## Master spec

See [`docs/FocusBridge21_Master_Spec_v0.2.md`](docs/FocusBridge21_Master_Spec_v0.2.md).

## License

MIT License. See [`LICENSE`](LICENSE).
