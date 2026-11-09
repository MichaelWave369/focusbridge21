# FocusBridge21 v2.7: Intention Studio

## What this actually is

A **voluntary, conscious reflection tool** built into the existing Quiet Deck and powered by the same locally generated six-layer soundscape and shared v2.5 master output bus. It is not a hypnosis service, mental-health treatment, subliminal audio tool or proven subconscious reprogramming system.

The home screen includes a new **Intention Studio** choice beside Sleep Sanctuary and Deep Focus. The new mode defaults to a quiet, comfortable atmosphere (surf 30%, rain 10%, HUM 10%, no stereo tones). The user can customize every sound layer in the existing mixer and use a 5-, 10-, 15-, 20- or 30-minute practice. If stereo tones are explicitly enabled, existing headphone confirmation is required.

## The personal script library

- **Write and edit** a personal statement up to 800 characters, with an optional 60-character title. All text is HTML-escaped before display.
- **Save up to 12 scripts** in browser local storage using versioned storage key `focusbridge21-intention-library-v27`.
- Saving a script also snapshots **all six sound layer levels**, the HUM note, and the stereo-tones on/off choice. Selecting a saved recipe restores its mixer settings; the user can refine them and save changes.
- **Delete** a saved recipe with a second explicit confirmation. New script clears the editor without deleting existing saved entries.
- Saving fails visibly when storage is blocked or full. Changes do not modify the Sleep Sanctuary personal bedtime text or its preferences.
- **Privacy:** scripts live unencrypted in this browser. Do not put secrets in them, particularly when auditioning a browser voice, which may use a network service. The Signal Ledger receives only metadata (speaking opted in, cadence, saved-recipe flag) and **never includes the script/title** unless a user independently types those words into the ordinary reflection notes field.
- No accounts, downloads, microphones, trackers or cloud data service are introduced by this feature.

## Voice behavior

Voice remains **OFF every time the user enters the Studio**. A voice audition requires the existing explicit safety check and a nonempty script. During a committed session, the user can opt into speaking the script once on Start, every three minutes, or every five minutes. A repeated cue fires only inside a 20-second on-time window with at least 30 seconds left: delayed/throttled tabs **skip** old prompts rather than reading them hours later.

Pause requests pause the browser voice; Resume requests resume. Return Now, navigation between modes, and leaving the page cancel narration. This uses the existing optional `FocusBridgeVoice` browser SpeechSynthesis adapter and does not record or analyze user speech.

**Important:** The spoken voice comes from the browser's speech subsystem, outside the Web Audio master bus. The digital peak meter therefore does not represent speech loudness, and the built-in dynamics effect cannot balance narration against ambience. Manual voice-to-ambience balance checks are still required.

## Validation

CI runs JavaScript syntax validation and all Node test suites. The tests cover library CRUD, the 12-script limit, sound mix snapshot/restore, HTML escaping, local storage failures, deliberate speech opt-in, no stale speech, pause/resume, Return Now, receipt privacy, and offline PWA entrypoint loading.

Manual checks before merge:
1. Open Intention Studio; confirm the sound mix defaults are subtle and stereo tones start off.
2. Type and preview a phrase with a browser voice at low OS output volume. Repeat with voice unavailable and with a denied storage API.
3. Save two uniquely named scripts with different mixer levels; switch between them, save edits, and explicitly delete one.
4. Play 5 minutes with speech off, then enable speech and test once, every 3 minutes and every 5 minutes.
5. Pause during speech and use Return Now. No speech should continue after exit.
6. Switch away from a voice preview without committing a session; no stray utterance should survive.
7. Try offline/PWA mode after cache refresh, mobile portrait, Firefox, reduced-motion mode, headphones, and speakers.
8. Review a session receipt. It must not reproduce the script title or content.

## Next foundation: immersive audio cockpit

The shared v2.5 audio bus remains the base. Future independent, reviewable changes could add a voice/ambience balance controller (requires a compatible local speech path), per-layer mute/solo, user-authored multiple sound recipes, smarter output diagnostics, CPU/load and Web Audio rendering measurements, optional spatial movement, and accessible presets. These are **not** claimed as implemented in v2.7.
