# Rife Frequency Lab: audible sound experiments, not medical treatment

The ninth Quiet Deck card is **Rife Frequency Lab**, a history-inspired Web Audio **sound-wave demonstration**. It is **not** a Rife radiofrequency or electromagnetic machine, does not output RF energy, and does **not** offer a clinically validated medical treatment. There are no disease protocols or symptom/frequency mappings.

## Historical and scientific boundary

Royal Raymond Rife proposed using electromagnetic signals to act on microbes and illnesses. Modern Rife products commonly involve RF/EM fields or electrodes and cannot be replicated with a browser tone generator. Cancer Research UK reports **no reliable evidence that Rife machines cure cancer** and warns against replacing medical care with unproven approaches. Rife lists found online that map named diseases to Hz values are not clinically validated. The selected audible numbers in this app are **demonstration frequencies only**.

Sources:
- [Cancer Research UK: Rife machines](https://www.cancerresearchuk.org/about-cancer/treatment/complementary-alternative-therapies/individual-therapies/rife-machine-and-cancer)
- [Full Fact: No evidence Rife machines can cure all cancers](https://fullfact.org/health/Rife-machines/)
- [PolitiFact: No evidence vibrational frequencies from Rife machines can cure cancer](https://www.politifact.com/factchecks/2022/jul/29/viral-image/there-no-evidence-vibrational-frequencies-rife-mac/)

Research on some **other** low-energy electromagnetic or ultrasound technologies does **not** validate Rife disease/frequency claims, and none are represented by these simple audio signals.

## What this code actually does

- Audible sound through speakers or headphones using the browser's Web Audio oscillator, **never** RF, electromagnetic-field treatment, electrodes, or electrical stimulation.
- **Six selectable frequencies:** 110, 220, 440, 727, 787 and 880 Hz. The last three are also seen in circulating Rife lists, but have **no verified disease-specific effect**. They are offered solely to understand what those audible pitches sound like.
- **Sine or triangle** waves (no harsh square-wave preset).
- **Steady** or **gentle +/-2% pitch sweep** (pitch exploration, not a therapeutic pulse rate). No flashing or strobe effects.
- **1, 3, 5, 10, or 15-minute** bounded sessions. Default: 5 minutes. One oscillator, quiet software gain ceiling 0.014 * selected percentage/100, 2-second in/out fade, scheduled oscillator stop, AudioContext closed with RETURN NOW, pagehide, or finish.
- Mandatory comfort/safety checkbox, headphone acknowledgment, Pause/Resume, RETURN NOW, and private Signal Ledger receipt of chosen **audio settings** with non-therapeutic interpretation. Settings persist locally separately from other mode mixes.
- Actual loudness depends on device/amplifier/headphone volume. Set it nearly silent before playback, avoid overexposure, and stop if discomfort occurs. This browser generator cannot measure sound pressure in dB SPL or know the user's health context.

## Manual and automated verification

Automated tests assert nine entry cards, safe start gating, zero unintended audio before user confirmation, one finitely scheduled oscillator, limited waveforms/frequencies, hard intensity and duration limits, fade scheduling, settings isolation, receipt semantics, and closing AudioContext.

Manual device QA still needed:
1. Desktop/mobile browser, screen reader and keyboard navigation. Verify the ninth card appears.
2. Choose 727 Hz, triangle, gentle sweep, and lowest intensity. Confirm it's audible only if the volume is comfortable. Raise system volume cautiously, not to force inaudible tones to become audible.
3. Verify 1/3/5/10/15-minute settings; stop/resume/return. Try on wired headphones, Bluetooth headphones, and ordinary speakers. Note stereo headphones required by the startup acknowledgment although output is a single-channel tone.
4. Confirm all settings remain separate from Sleep Sanctuary, Focus Sync and Holistic Zone mixes; the Signal Ledger does not show symptom or treatment metrics.
5. Test PWA update to cache v2.0. No claims that a phone speaker or headphones can recreate the original historical apparatus or its asserted effects.

**The mission is inquiry, not medical promises.** If someone is ill, the lab is no substitute for qualified care.
