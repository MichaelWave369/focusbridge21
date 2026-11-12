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
- After saving, users can choose **Continue to Threshold Explorer**, but doing so begins a separate preparation flow, never an automatic escalation.
- If closing eyes feels uncomfortable or disorienting, keep them open. If symptoms worsen, stop and orient to surroundings. No practice while driving or operating equipment.

## Recommended personal practice

Start with **5 minutes daily for a week**, or 3 minutes if that feels better. Consider 10 minutes when it feels comfortable. After finishing, jot down what helped attention return; do not try to prove anything about metaphysical experiences.

## Relationship to Going Deeper and Focus Sync

The book's later "Going Deeper" practice includes imaginative descent imagery as a subjective relaxation technique. Its claims about attaining Alpha or Theta by visualization are **not EEG measurements**.

### Current QMM-first routing

Selecting **Going Deeper**, **Focus Sync**, or **Threshold Explorer** in Quiet Deck now opens the QMM setup first. The destination is clearly displayed, and the user chooses a 3–30 minute QMM session (10 minutes by default). Completing its timed progression and the grounded return, then saving the reflection, offers a voluntary **Continue to Going Deeper** button. The subsequent GDM preparation and any later exploration practice each require their own safety check. See [GDM_GOING_DEEPER.md](GDM_GOING_DEEPER.md).

Ending QMM early is always allowed and never unlocks the follow-on button. The local receipt records completion of the **timed sequence**, not mastery of a thought-free mental state. A completed standalone QMM can hand off to GDM after reflection; GDM can then offer optional Threshold Explorer or a selected Focus Sync route.

This prerequisite applies to dedicated meditative exploration paths in the current Quiet Deck. **Listen & drift, Deep Focus for work, Sleep Sanctuary, Intention Studio, the Holistic Zone, and Rife Frequency Lab** remain independent because they are listening, productivity, reflection, comfort, or audio-test tools rather than the book's meditations. The legacy full laboratory retains its current controls; this change does not silently claim to intercept every possible old entrypoint.

**Going Deeper Meditation (GDM)** is now the second stage after QMM for deliberate exploration routes. The next potential book-derived practice is *Breathing Energy*, which explicitly calls for both QMM and GDM first. Keep transitions voluntary, preserve Return Now, and never assert that a neurological or paranormal gate was achieved.

**Philosophy:** Curiosity is welcome. Claims stay bounded to what the app actually observes.
