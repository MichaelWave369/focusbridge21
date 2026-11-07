# Focus Sync: complete published-level journey (v1.9)

**An original, bounded, local-first audio journey through 17 symbolic stations plus a grounded return.** Inspired by publicly available descriptions of focus levels from the Monroe Institute, **not** a Hemi-Sync, Gateway Experience, Monroe Sound Science, or Expand recording or program.

## What the mode includes

- A new **Focus Sync** card in the Quiet Deck. Pick one of four full-route paces:
  - 8 minutes per station: **2 hours 28 minutes** total
  - 12 minutes per station: **3 hours 36 minutes** total (default)
  - 18 minutes per station: **5 hours 18 minutes** total
  - 20 minutes per station: **5 hours 52 minutes** total
- Each option automatically traverses every entry in this **published focus-level index**: **1, 3, 10, 11, 12, 15, 18, 21, 22, 23, 24, 25, 26, 27, 34/35, 42, 49**, then includes a **12-minute grounded return**.
- The numbers are names from a public classification system, **not one stage for every whole number from 1 to 49**, not biological measurements, and not a promise of induced or attained states.
- Original softly generated stereo sine tones and layered procedural surf. A **30-second scheduled glide** between audio stations changes the *auditory difference* without abrupt jumps or chimes. The frequency schedule was designed for FocusBridge21 and does not copy proprietary Hemi-Sync or Monroe signals.
- List of all upcoming stations before starting and clear live **station X / 17** progress. The guided text is original and intentionally grounded, including in stations that published Monroe material associates with spiritual/afterlife beliefs. These are **prompts for imagination and self-reflection**, not factual claims of contact with another reality.
- Safety checkbox, stereo headphone confirmation when tones are enabled, optional sound mix, Pause/Resume, RETURN NOW, automatic finish, and browser-local Signal Ledger receipt.
- No surveillance, EEG claims, or upload of health data.

## Structure

| Station | Original FocusBridge21 prompt theme |
| --- | --- |
| 1 | Arrival |
| 3 | Steady Attention |
| 10 | Body Rest |
| 11 | Inner Check-in |
| 12 | Open Awareness |
| 15 | Unhurried Time |
| 18 | Compassion |
| 21 | Threshold |
| 22 | Borderlands |
| 23 | Narratives |
| 24 | Belief Patterns I |
| 25 | Belief Patterns II |
| 26 | Perspective |
| 27 | Rest and Reflection |
| 34/35 | Wider View |
| 42 | Interconnection |
| 49 | Open Field |
| Return | 12-minute reorientation to body, hands, feet and surroundings |

All 17 gates are traversed *by the playlist clock*; listening for a particular number of minutes **does not establish that a psychological, neurological, or metaphysical level was reached**. If someone wants to spend longer on an experience, this first release provides slower full-route pacing rather than faking an automatic achievement detector.

## Technical boundaries

The overall duration is capped at **21,600 seconds (6 hours)** by existing Web Audio scheduling safety limits. The longest default route is 21,120 seconds. Sound nodes have definite stops, and RETURN NOW closes the AudioContext immediately; no six-hour unbounded oscillator is left behind.

The two carrier oscillators are stereo separated only if the user enables tones. Within the original FocusBridge21 implementation, station transitions use **automated audio-parameter frequency ramps**, scheduled once when playback begins. The ocean soundscape continues across transitions. Headphone confirmation remains mandatory for binaural tones.

**Browser sleep or background audio suspension can interrupt the sequence.** A browser-based app cannot promise uninterrupted multi-hour playback across every operating system. Tests should distinguish Web Audio scheduled playtime from real wall-clock elapsed time. Physical hearing output and volume cannot be inferred from Web Audio's running context.

**Safety:** Use comfortable quiet volume. Consider first practicing a short familiar FocusBridge21 session before attempting a 2.5-to-6-hour exploration. Do not listen while driving or operating machinery. If you have seizures, significant sound sensitivity, or recent destabilizing altered-state/meditation experiences, consult an appropriate qualified professional before extended altered-state practices. Return early if uncomfortable, frightened, dizzy, or disoriented.

## Why this is independent from Hemi-Sync

Hemi-Sync sells copyrighted recordings and proprietary sound-design techniques, and the Monroe Institute describes newer Monroe Sound Science technology that is also proprietary. **FocusBridge21 does not reproduce their recordings, timing scripts, binaural mixes, meditative exercises, brand marks, or products.** It draws only from widely discussed concepts of sequential listening and publicly named levels, then supplies original writing, a new sound design, and explicit non-induction language. No affiliation or endorsement is claimed.

References:

- Monroe Institute UK public focus levels: https://www.monroeinstituteuk.org/focus-levels/
- Monroe Institute Italy public list including Focus 3: https://www.monroeinstitute.it/en/focus-levels/
- Monroe Institute blog listing newer levels in Expand: https://www.monroeinstitute.org/blogs/blog/experience-different-focus-levels-in-your-own-created-journey-in-expand
- Monroe Institute on proprietary Monroe Sound Science and confidentiality: https://www.monroeinstitute.org/pages/the-history-of-sound-at-the-monroe-institute
- Hemi-Sync Gateway Experience overview: https://hemi-sync.com/gateway-experience/

## QA checklist

1. Test both root and `/docs` routes to confirm `fb21-focus-sync.js` loads before `fb21-v13-quiet-deck.js`, and is precached by the PWA service worker.
2. Focus Sync presents all 17 names and return, plus the four correct total times. A selection always covers **every** listed station.
3. Start is blocked until safety and (if stereo tones on) headphone confirmation. Readiness links still guide first-time users to the relevant checkbox.
4. Verify separate stereo tones, no abrupt changes in the frequency ramps, low volume, and the continuous ocean ambience.
5. Advance an automated clock through one boundary and the full 5h52 end: UI shows correct stations, then grounded return. Test Pause/Resume and RETURN NOW and ensure the AudioContext closes.
6. Verify the local receipt lists the planned route and honestly describes completion without EEG or out-of-body claims.
7. Perform a long real-device listening test, including headphones, page backgrounding, screen locking, reloading, and PWA cache updates. No claim of real-world overnight continuity without hardware QA.

**Planned future work, not part of v1.9:** optional user-paced stage holds and skips that can update Web Audio scheduling safely; named waypoint bookmarks; optional CFD visual accompaniment with non-flashing controls and original geometry.
