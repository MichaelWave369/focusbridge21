# FocusBridge21 Holistic Zone v1.8

**Purpose:** offer optional, quiet, user-adjustable listening environments for everyday discomfort. **Not** a medical device, a diagnosis, a replacement for treatment, or an evidence-based frequency prescription.

## Design and symptom-aware defaults

| Comfort choice | Time | Surf | Bass / rhythmic pulse / spatial drift | Binaural stereo tones | Why |
| --- | --- | --- | --- | --- | --- |
| Headache sensitivity | 10 min | 8% | Off | Off | Some headaches and migraines involve sound sensitivity. Start nearly silent, avoid moving sound; stop if worse. |
| Stomach discomfort | 15 min | 20% | Off | Off | Predictable ambience for comfort; no claim of action on digestion or stomach pain. |
| Nausea / queasiness | 10 min | 12% | Off | Off | Avoid panning, pulsing, bass and other provocative stimulation; silence is available instead. |
| Everyday tension | 15 min | 32% | Off | Off | Gentle background texture to support a relaxation break. |

All Holistic Zone presets offer 5 to 20-minute durations (stomach/tension also offer 30 minutes), with separate browser-local mixer preferences. Users can disable or change any layer before starting.

The Holistic Zone also has **Choose silence instead**, which opens the existing deliberately silent Just settle path. All-sound-off audio sessions are still blocked rather than pretending sound is playing.

## The frequency question: what is known?

- **Music / pleasant sound:** The US National Center for Complementary and Integrative Health (NCCIH) reports preliminary evidence for reduced anxiety, stress, and some forms of pain. Effects are variable and much evidence concerns actual music, not isolated healing frequencies.
- **Binaural beat studies:** Studies sometimes find changes to self-reported pain or anxiety, but reviews emphasize small samples, variable protocols, and low-certainty evidence. The 2026 theta-beat meta-analysis found a moderate average pain association across only four pooled trials involving 173 people; this is **not a validated treatment for a particular symptom**.
- **Specific frequencies:** There is no robust clinical foundation for assigning a curative frequency to headache, stomachache, or nausea, including claimed "432 Hz / 528 Hz cure" mappings. A beat-frequency label is not a measured EEG reading.
- **Migraine-related sensitivity:** Increased sensitivity to sound is common during migraine attacks; silence, a dark room, or ordinary clinical care may be preferable.
- **Nausea:** Distraction through music is among simple self-care approaches, but the cause of nausea matters, and a specific tone has not been established as a treatment.

### Opt-in tone palette

Only when a person manually switches on **Include gentle stereo tones**, a separate control offers **4, 6, 8, 10, or 12 Hz** as the difference between the two audible carrier frequencies. These are **acoustic experiments only**; they are not symptom-to-frequency prescriptions or evidence of brain entrainment. Stereo tones require headphones and a separate confirmation. The default for all Holistic Zone presets is **off**.

**Do not use** headphones at high volume, especially for long sessions. Do not use this software while driving or in other settings requiring full attention. Sudden extreme headache, neurological problems, blood in vomit, severe abdominal pain, inability to keep fluids down, or concerning dehydration are reasons to seek appropriate medical attention promptly rather than trying an audio preset. If audio worsens symptoms, immediately select RETURN NOW and stop.

No health data are uploaded, no diagnoses are inferred, and the Signal Ledger remains stored locally. Users can journal subjective comfort, but the app never claims to record treatment results or measure brain activity.

## Primary references

- NCCIH: [Music and Health, what you need to know](https://www.nccih.nih.gov/health/music-and-health-what-you-need-to-know)
- NCCIH: [6 things you need to know about music and health](https://www.nccih.nih.gov/health/tips/6-things-you-need-to-know-about-music-and-health)
- Shamsi et al. (2024), systematic review of binaural beats for pain: https://pubmed.ncbi.nlm.nih.gov/38216943/
- Fatima et al. (2026), theta binaural beats, pain and cognition meta-analysis: https://pubmed.ncbi.nlm.nih.gov/42349368/
- NHS: [Headaches](https://www.nhs.uk/symptoms/headaches/)
- NHS: [Feeling sick / nausea](https://www.nhs.uk/symptoms/feeling-sick-nausea/)
- MedlinePlus: [Adult nausea and vomiting](https://medlineplus.gov/ency/article/003117.htm)
- Cedars-Sinai: [Sound therapy and binaural beats: do they work?](https://www.cedars-sinai.org/stories-and-insights/healthy-living/sound-advice-do-sound-therapy-and-binaural-beats-work)

## Acceptance tests / manual QA

1. From Quiet Deck, select **Holistic Zone**. Verify all four choices and the evidence/safety boundary.
2. Choose headache sensitivity. Verify 10-minute default, nearly silent surf, bass/pulse/stereo off, and still no playback until the Step 1 comfort check is confirmed.
3. Turn on stereo tones. Verify headphone consent becomes mandatory. Verify neutral 4/6/8/10/12 Hz selection is described as experimental, not therapeutic.
4. Start and use Pause, Resume, RETURN NOW, and automatic session completion. Confirm all nodes are stopped.
5. Use Choose silence instead and confirm the intentionally silent route does not start an AudioContext.
6. Change a Holistic Zone profile mix, navigate away and back; confirm it persists without overwriting the Sleep Sanctuary or Deep Focus preferences.
7. Verify mobile, keyboard-only focus, reduced motion, offline cache update, and low volume. Validate actual output in browser audio QA.
8. Never run a symptom-specific frequency-treatment claim as marketing text, UX label, or undocumented recommendation.

**Next design rung:** optional personal comfort journal (user-written only), fade-to-silence control, a quick dark-screen switch, and accessibility testing with headache/migraine-sensitive testers. These are proposed, not shipped.
