# Preview selected mix: preflight sound check (v2.3)

A short, explicit **Preview selected mix · 15 sec** button appears during the normal three-step Quiet Deck audio setup, after the safety checkbox and sound controls and before **Start my session**. It uses the selected audio settings through the same Web Audio engines used by full sessions.

## User experience

1. Choose one of the nine Quiet Deck modes that includes audio, or the featured Island 108 preset. Complete the safety acknowledgment and (only if stereo binaural tones are enabled) confirm stereo headphones.
2. Adjust the existing six mixer levels and HUM note, or Rife Frequency Lab's frequency, waveform, movement and intensity.
3. The new sound-check area shows the six **configured percentage levels** as static bars, plus the selected HUM note and stereo frequencies, or the Rife tone settings. It does not manufacture a decibel figure. A selected slider percentage is not a calibrated sound pressure level.
4. Click **Preview selected mix · 15 sec**. A standalone AudioContext plays a sample using the actual selected relative gains, native Web Audio oscillators and procedural ambience. The **Stop preview now** control immediately stops and closes that context. Escape also stops an active preview.
5. The 15-second audio schedule ends automatically, even if UI timers are throttled. The interval only updates the UI and closes an unused context. Change a slider, note, duration, tone enable state or Rife control to stop any existing preview before a new audition.
6. If satisfactory, click **Start my session**. That stops any preview context before starting a separate actual session at the original chosen duration. The preview never begins the session timer or writes a Signal Ledger record.

## Supported modes

- **Listen & drift; Sleep Sanctuary; Deep Focus; Threshold Explorer; Holistic Zone; Island 108**: Up to six independent layers (Ocean surf, Sub-bass, Soft pulse, Rain, Wind, HUM) mixed together. If the optional stereo tone is enabled, the same selected opening carrier/difference is included in the preview. A disabled stereo layer stays disconnected.
- **Focus Sync**: Previews the original **opening gate's** carrier and beat difference, plus the currently selected environmental layers. The 15-second preview deliberately does **not** schedule every 2–6 hour transition. This is explained beside the stereo pair.
- **Rife Frequency Lab**: A dedicated 15-second audio-only demonstration of the selected Hz/waveform/intensity, with a short reduced sweep sample when movement is enabled. Normal frequency lab sessions remain limited to 1, 3, 5, 10 or 15 minutes.
- **Just settle**: Intentionally silent. No preview control appears, as there is no audio to audition.

## Safety, scope and privacy

- A user gesture triggers preview via the existing Web Audio API. The comfort and safety acknowledgment and, where appropriate, stereo headphone readiness are required **for preview as well as session start**.
- Software gain is the same as the full session's initial sound levels, and 15-second fade schedules limit exposure to a short sound check. Output loudness is hardware-dependent and is **not measured or guaranteed safe**. Users should begin with system volume low, stop immediately if uncomfortable and be especially careful with headphones.
- The existing audio engines remain fully local-first. No external audio files, microphone access, network measurement service, third-party dependencies, analytics, or persisted user health data are introduced.
- Separate context/node holders and preview cancellation guard against overlapping auditions and full sessions, changes while asynchronous audio permission/resume is pending, profile navigation and pagehide.
- Feedback for the preview is distinct from full session errors. Preview cancellation or failure never creates a phantom session receipt.

## QA / regression acceptance criteria

Automated:
1. Without the safety acknowledgment, audio preview must create no context. Stereo-tone preview additionally requires explicit headphones confirmation.
2. Preview generates a **15-second** schedule using the selected layers/notes, not the full 6-hour or 108-minute duration, and must automatically close.
3. A preview may be stopped instantly; **Start my session** must stop its context before starting normal audio at the original session duration. Preview itself never creates a Signal Ledger entry.
4. Mixer edits during preview must close the stale AudioContext and allow replay with updated levels.
5. Rife Frequency Lab preview's oscillator must stop after 15 seconds; normal Rife sessions must retain their allowed 1/3/5/10/15-minute duration rules.
6. Focus Sync preview must **not** schedule full multihour frequency automation but full sessions still must.
7. Just settle must not expose a preview control, and a fully disabled audio mix must not be previewable.
8. Both the nine-mode grid and Island 108 featured shortcut remain present; offline PWA cache version increments to v2.3.

Manual:
1. Listen on mobile and desktop with speakers/headphones at a very low hardware volume. Compare the preview with the opening 15 seconds of a full session.
2. Try high HUM notes, steep wind/rain percentages and soft sound sensitivity profiles; ensure no abrupt onset or unexpected volume peaks.
3. Switch tabs, navigate back, modify sliders while previewing, use Escape, lock devices and allow preview to expire. A context must not continue playing.
4. Screen reader announces the Preview Mix region and status. Controls and percentage bars remain legible at narrow mobile widths.
5. Validate the PWA service-worker update. Do not claim true measured SPL or auditory safety based on gain percentages.

**Limitation:** A 15-second sound check is not a substitute for long-duration listening QA. Slow wind gusts, evolving Focus Sync stages and other subtle modulations can change beyond the preview's opening window.
