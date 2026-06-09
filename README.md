# FocusBridge21

**Sovereign threshold-training cockpit for original audio, guided practice, safe return, and local session receipts.**

FocusBridge21 is a local-first practice app for developing meditative capacities associated with progressive threshold work: readiness, body-asleep stability, expanded awareness, time-release, stable witness, clean return, and integration.

It is inspired by the broad idea of focus-level training, but it is independent of proprietary Monroe Institute / Hemi-Sync content and signals.

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

## Current version

**v0.1 prototype**

Included now:

- Streamlit local app.
- Readiness Gate Score.
- Foundation, Expansion, No-Time, and Bridge presets.
- Original binaural audio generation with gentle ramps.
- Optional pink, brown, or white noise layer.
- Slow non-flashing sacred-geometry cockpit visual.
- Neutral and Resonance Architect guidance modes.
- Prominent RETURN NOW grounding panel.
- Post-session journal receipt.
- Append-only JSONL Signal Ledger.
- Basic ledger dashboard and CSV export.
- 8-week mastery protocol page.

## Quick start

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
streamlit run app.py
```

The app stores local runtime data in:

```text
audio/              generated WAV files
ledger/sessions.jsonl  append-only session receipts
exports/            CSV exports
```

These folders are intentionally ignored by Git so your private session data does not get committed.

## Safety first

Do not use FocusBridge21 while driving, operating machinery, or in any situation requiring full external attention.

Consult a qualified healthcare or mental-health professional before using audio/visual altered-state practices if you have a history of seizures, photosensitive epilepsy, severe anxiety or panic, psychosis, dissociation, or destabilizing experiences with meditation or altered states.

Visuals are slow and non-flashing by default. Keep volume low. Start short. Use RETURN NOW whenever needed.

## Recommended first run

1. Choose **Foundation** or a short **Bridge** preview.
2. Use **15 minutes**.
3. Keep volume low.
4. Complete the Readiness Gate.
5. Keep the RETURN NOW panel visible.
6. Complete the post-session journal so the Signal Ledger can start learning your patterns.

## Project structure

```text
.
├── app.py
├── requirements.txt
├── README.md
├── LICENSE
├── docs/
│   └── FocusBridge21_Master_Spec_v0.2.md
├── site/
│   └── index.html
└── .github/
    └── workflows/
        └── pages.yml
```

## Master spec

See [`docs/FocusBridge21_Master_Spec_v0.2.md`](docs/FocusBridge21_Master_Spec_v0.2.md).

## License

MIT License. See [`LICENSE`](LICENSE).
