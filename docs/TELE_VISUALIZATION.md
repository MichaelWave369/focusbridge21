# Chapter 3: Remote Viewing / Tele-Visualization

## What the source says

This implementation uses **Chapter 3, pages 4–5** of the user's 112-page *The Book of Knowledge*, credited to Anonymous.

The author explicitly prefers the term **Tele-Visualization** rather than Remote Viewing. Chapter 3 divides the method into two exercises:

1. **Part 1, imagination:** After **Quiet-Mind Meditation (Q-MM)**, picture a forest, follow a river downstream, reach a mist-covered pool enclosed by a smooth grey stone wall with patches of greenery, and imagine the pool calling your name four times.
2. **Part 2, purported perception:** Ask a friend or family member to place an unknown object in an adjacent room, then perform QMM, imagine going into the other room, and guess what the object is. The author goes further, claiming people can mentally view others and past/future events. These claims are **not scientifically established** and are not implemented as actual remote access.

The source advises turning closed eyes inward/upward toward the brow. **We deliberately omit this physical eye-positioning suggestion** to avoid unnecessary eye strain. The exercise is entirely imagination-based and can be done eyes open or closed according to comfort.

The app uses original, non-verbatim wording. Source edition: https://www.scribd.com/doc/120678976/The-Book-Of-Knowledge

## Part 1: Guided Tele-Visualization

**Route: QMM → Tele-Visualization.** The book requires QMM here, but does not explicitly require the separate GDM or Breathing Energy stages for Chapter 3. We preserve that distinction instead of silently inserting prerequisites.

The seven original stages in `docs/fb21-tele-visualization.js` are:

| Stage | Weight | Intent |
|---|---:|---|
| Arrive and settle | 12% | Rest after QMM with relaxed eyes |
| Imagine a forest | 17% | Build a quiet scene |
| Hear the river | 15% | Follow the imagined current downstream |
| Misty pool and grey stone | 21% | Build the stone wall and greenery |
| Sounds near the water | 12% | Engage the imagined bubbling water |
| Four imagined echoes | 12% | Imagine hearing your name, or another welcome word, four times; **no name is collected** |
| Return to the room | 11% | Reorient to real surroundings |

The practice offers 3, 5, 10, 15, 20 and 30-minute sessions. No audio oscillators or headphones are needed. Optional browser-spoken prompts are **off by default**, and no personally entered name is used. Pause, Return Now, a fresh safety check, grounded ending, and private local Signal Ledger reflections are preserved.

**Boundary:** A vivid internal scene does not establish a real visit to an external place, astral projection, or remote sensing.

## Part 2: Blind Target Lab

This is a **digital four-choice practice exercise inspired by**, but *not identical to*, the author's hidden physical object experiment.

- A fresh QMM timed practice is required before entering the lab from the home screen.
- A completed Chapter 3 visualization may offer direct entry to the lab during the same practice journey.
- A browser cryptographic random generator chooses one of **Tree, Lantern, Mountain, Seashell** before each guess. The target value is kept inside app state and **not rendered before the entire block is complete**.
- **20 trials per block**, fixed in advance; **four possible choices** per trial. Every selection locks immediately and no trial feedback is provided until all 20 are recorded. This prevents mid-block answer revision and feedback-driven guessing.
- The expected random hit probability is **25% per trial**, so **five hits out of 20 on average**. One block may deviate above or below this through chance alone.
- After 20 guesses, the result view reveals all guesses and hidden targets. The complete raw block, baseline and outcome are stored *locally* in the Signal Ledger once. Incomplete blocks are not scored or saved.
- **No secure randomness, no experiment.** Unsupported browsers show a clear warning instead of falling back to predictable values.
- No requests go to camera, microphone, other people's devices, rooms, accounts or private location data.

**Evidence limits:** Browser app owners can inspect or edit scripts and local storage. This is not a double-blind, independently preregistered, laboratory-controlled test, and even a high score does not prove paranormal perception. No scientific significance or remote-access capability is claimed.

For any future real-world validation inspired by the book's friend-placed object, predefine the target pool and scoring before starting, have a consenting independent person select and conceal the physical item, prevent non-psychic cues, and record outcomes before revealing the item. Do not use this to speculate about or monitor the activities of nonconsenting people.

## Product boundaries

- **QMM-first** applies to both Chapter 3 entrypoints.
- Ordinary audio experiences stay independent.
- The QMM → GDM → Breathing Energy ladder remains the route to the existing dedicated Focus Sync / Threshold Explorer presets. Chapter 3 follows QMM directly because that is what the source specifies.
- The local ledger holds only session metadata and scores. It does not collect a person's spoken name, nor claim brain-state, spiritual, or physical target detection.
- If disturbing imagery or discomfort occurs, stop, open your eyes, and orient to your room.

**Logic Above Lies; Truth Above Slop.** Keep imagination, self-reflection, and experimental results distinct.
