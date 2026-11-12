# Quiet Mind Meditation (QMM) | FocusBridge21 Foundation

## Source and adaptation

The original **Quiet-Mind Meditation** is described in Chapter 1 of *The Book of Knowledge*, credited to Anonymous. The book treats it as a prerequisite for its more elaborate visualization and "Going Deeper" exercises. Source: https://www.scribd.com/doc/120678976/The-Book-Of-Knowledge

This application provides an **original, non-verbatim, modernized practice** based on that general sequence. We preserve its attentional progression (comfortable place -> visual anchor -> natural breathing -> closed-eye awareness -> external sound awareness -> release of distracting thoughts) while replacing pressure to achieve an empty mind with an attainable nonjudgmental return to attention. We also add an explicit grounded ending.

## What QMM actually trains

- Getting settled without demanding a particular brain state.
- Shifting attention deliberately between gaze, breathing, inner visual field, and ambient sound.
- Recognizing a thought without battling it, and gently returning.
- Tolerating a period of quiet without grading its depth.
- Reorienting afterward.

**Not claimed:** supernatural powers, verifiable astral travel, universal brain-wave frequency changes, EEG-confirmed Alpha/Theta states, thought suppression, or treatment of an illness.

Mindfulness and attentional practices have some evidence for stress management, but results are variable and practices can be uncomfortable for some people. Sources:
- NIH/NCCIH: https://www.nccih.nih.gov/health/meditation-and-mindfulness-effectiveness-and-safety
- Research on mind wandering: https://pubmed.ncbi.nlm.nih.gov/34560133/
- On inconsistent binaural EEG entrainment evidence: https://pubmed.ncbi.nlm.nih.gov/37205669/

## Guided stages

The seven stages live in `docs/fb21-qmm.js`. They fill each chosen time interval proportionally, with no sudden alarm or forced breathing.

| Stage | Practice | Time share |
|---|---|---:|
| 1 Arrive & orient | Check comfort and notice your surroundings | 10% |
| 2 Gentle gaze | Rest eyes on a stationary object, without strain | 12% |
| 3 Natural rhythm | Attend to regular breathing, no holds or counts required | 14% |
| 4 Inner screen | If comfortable, close eyes and notice their natural visual field | 15% |
| 5 Open listening | Allow environmental sounds without chasing or analyzing them | 15% |
| 6 Return to quiet | Notice thoughts and gently come back without self-judgment | 24% |
| 7 Grounded return | Feel body support, reopen eyes, orient to room | 10% |

Presets: **3, 5, 10, 15, 20, 30 minutes**. Ten minutes is the default. Longer practice is optional; consistent short sessions count.

## Product behavior and safety

- QMM is a first-class card in Quiet Deck. It is **silent-first** and uses no Web Audio nodes, stereo binaural beats, or required headphones.
- Browser voice optionally reads **seven original prompts** at stage boundaries. Voice is off on every new session. Browser speech may use online resources on some devices.
- Safety checkbox is required. Stop with **Return now** at any time; there is no penalty.
- Pause/resume pauses the stage clock and optional voice.
- The Signal Ledger receives local-only metadata: title, elapsed time, last stage, consent for voice, and optional notes. No mind state or thought-silence score is invented.
- After completing QMM, users can choose **Continue to Going Deeper (GDM)**, then optional **Breathing Energy**, before any dedicated exploration journey. Every transition has a separate preparation flow.
- If closing eyes feels uncomfortable or disorienting, keep them open. If symptoms worsen, stop and orient to surroundings. No practice while driving or operating equipment.

## Recommended personal practice

Start with **5 minutes daily for a week**, or 3 minutes if that feels better. Consider 10 minutes when it feels comfortable. After finishing, jot down what helped attention return; do not try to prove anything about metaphysical experiences.

## Relationship to Going Deeper and Focus Sync

The book's later "Going Deeper" practice includes imaginative descent imagery as a subjective relaxation technique. Its claims about attaining Alpha or Theta by visualization are **not EEG measurements**.

### Current QMM-first routing

Selecting **Going Deeper**, **Breathing Energy**, **Focus Sync**, or **Threshold Explorer** in Quiet Deck opens QMM first. The user chooses a 3–30-minute QMM session (10 minutes by default). Finishing the timer, returning gently, and saving a reflection allows a voluntary **Continue to Going Deeper** action, followed optionally by **Breathing Energy**, then a dedicated exploration experience. Each rung has its own safety check. See [GDM](GDM_GOING_DEEPER.md) and [Breathing Energy](BREATHING_ENERGY.md).

Ending QMM early is always allowed and never unlocks the follow-on button. The local receipt records completion of the **timed sequence**, not mastery of a thought-free mental state. A completed standalone QMM can hand off to GDM, which can offer Breathing Energy, which can offer Threshold Explorer or a selected Focus Sync route.

This prerequisite applies to dedicated meditative exploration paths in the current Quiet Deck. **Listen & drift, Deep Focus for work, Sleep Sanctuary, Intention Studio, the Holistic Zone, and Rife Frequency Lab** remain independent because they are listening, productivity, reflection, comfort, or audio-test tools rather than the book's meditations. The legacy full laboratory retains its current controls; this change does not silently claim to intercept every possible old entrypoint.

Chapter 3 has **two additional routes after QMM**, separate from the QMM → GDM → Breathing Energy route used by Focus Sync: the quiet **Tele-Visualization** scene and a 20-trial **Blind Target Lab**. Chapter 3 itself requires QMM but does not explicitly require GDM or Breathing Energy. The lab is a browser-only, chance-baseline guessing exercise, not remote perception. See [Tele-Visualization](TELE_VISUALIZATION.md).

**Going Deeper Meditation (GDM)** is the second stage and **Breathing Energy** is the third, as the book's Chapter 2 specifies. Keep all transitions voluntary, preserve Return Now, and never assert that a neurological or paranormal gate was achieved.

**Philosophy:** Curiosity is welcome. Claims stay bounded to what the app actually observes.
