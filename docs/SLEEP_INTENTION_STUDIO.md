# FocusBridge21 v2.6: Sleep Sanctuary+ and Bedtime Intention Studio

Status: review branch built on v2.5 audio engine, intended to merge **after** Audio Engine PR #13.

## What is implemented

Sleep Sanctuary retains its original ambience mixer, stereo tones off by default, up-to-six-hour choices, no completion chime, safe consent, pause/Return Now, and browser-local Signal Ledger.

Its optional bedtime setup includes:

- **Gentle narrator** (off by default). At the session start, a browser-synthesized voice invites the user to settle. A second, short cue arrives at approximately 60 seconds. After this, the narrator falls silent for the rest of the session. A delayed/background tab will *not* wake somebody by speaking the second cue after three minutes.
- **My bedtime intention**: editable freeform text capped at 280 characters, sanitized to avoid control characters, saved locally in a separate preference key. Examples: "Tomorrow I can begin calmly." or "I can let go of this afternoon."
- **Read my intention once** (off by default). A normal audible spoken reading at the start only, with no hidden messages, repeated overnight narration, or “subliminal programming.”
- **Hear my wind-down voice**: optional one-time preview available only after the existing safety confirmation. It does not create session receipts and stops before committed playback starts.
- **Dim session display**: user-selectable, defaults on. Visually reduces glow but leaves the timer and **Return Now** accessible.

The voice uses the existing FocusBridgeVoice browser SpeechSynthesis fallback. Voice availability, voice timbre, and local versus network processing vary by device. Any user-authored script passed to a system voice may leave the browser if that voice is cloud-based: do not enter private secrets.

## Claim and privacy boundaries

This is a **bedtime reflection and relaxation aid**. It is not a medical treatment for insomnia, has no guarantee of inducing sleep, does not record EEG, and is not proof of unconscious learning or “subconscious reprogramming.” The user's written intention is **never placed in the Signal Ledger receipt**; only on/off settings are recorded. The editable intention remains in local browser storage and is **not encrypted**.

Speaking begins only when the user explicitly enables it and presses preview or starts the session. There is no always-on microphone, subliminal audio, hidden waveform, or external data upload by FocusBridge21 itself.

## Manual QA

1. Start Sleep Sanctuary with all voice toggles off and confirm silence from narrator and no extra headphone requirement when stereo tones are off.
2. Enter a short intended phrase and choose **Read my intention once**; do not check the voice box yet. Click Start and verify the phrase is **not** spoken without a working voice/opt-in.
3. Enable spoken intention and optionally the gentle narrator; use the visible safety check and preview button. The sample must play once without creating a receipt.
4. Start a full sleep session, hear the opening cue, then the second cue after about one minute **only if** Gentle narrator is enabled. Confirm no later speech.
5. Pause and Return Now during spoken narration; speech must pause/cancel and sound should stop gracefully. Never let a voice continue after Return.
6. Turn screen dimming off and on. Return Now must remain visible and keyboard-accessible.
7. Save a session receipt; verify it contains only the options selected, **not the actual personal intention**. The intention persists separately only in browser local storage.
8. Test voice unavailable in one browser, browser backgrounding, sleep mode on mobile, and cache upgrade after v2.5.
9. Test low OS volume and headphones or speakers without assuming the Web Audio sample meter represents voice dB SPL.

## Longer-term Intention Studio proposal

A standalone daytime practice builder could later offer: freely editable and exportable scripts, user-selected spoken timings for *awake* listening, original locally stored scripts or optional licensed recordings, a gentle voice/master balance, easy session cancellation, and a simple reflection log. No covert suggestion playback or claims of reliable sleep learning.

## Why this is separate from the engine PR

The v2.5 engine handles signal routing, gain, basic dynamics, and soft-stop lifecycle; v2.6 sits on top to add a distinct human experience. This makes failures easier to isolate and does not risk replacing the already working six-layer audio recipe.
