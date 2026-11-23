# F04: Prospective Multi-Participant Gateway Probability Study

**Status: infrastructure for an optional pilot, not an active study, a formal preregistration or a scientific finding.** F01–F03 remain unchanged and available. The software does **not** recruit participants or post anything automatically.

## Why F04

F03 can preregister four blocks of predictions for one person. A research coordinator still needs a fixed **cohort**, a public enrollment cutoff, a complete accounting of those who enrolled, and a valid analysis when multiple people predict the same future random targets.

F04 creates a public, hash-sealed study plan and enforces a fixed schedule of four future drand Quicknet beacon rounds. Every participant commits 80 predictions under the existing F03 format, tied to the same rounds. The roster is recovered from timestamped GitHub comments. The CLI independently reaudits every included private F03 campaign, including BLS12-381 beacon verification, and computes a pooled probability only for a complete cohort. A fixed sample of 8 is a default **engineering pilot size, not a power analysis**.

## The prospective protocol

Study schema: focusbridge21/f04/v1.

- **Size:** 2–24 distinct GitHub accounts, fixed before enrollment. Default is 8.
- **Targets:** one first Quicknet round strictly more than 24 hours after local study creation, plus rounds +40, +80, +120 (two minutes apart).
- **Enrollment cutoff:** one hour before the first beacon round, determined from the fixed round and Quicknet schedule.
- **Study identity:** a 16-byte cryptographically random study ID and SHA-256 hash of the canonical plan (version, ID, chain hash, cohort size, first round, four blocks, spacing, UTC cutoff, fixed analysis ID, one-sided alpha 0.05).
- **Organizer public witness:** one exactly matching F04-STUDY line published as a comment on one designated public GitHub issue before any participant enrolls and before cutoff.
- **Participant public witness:** the F03 registration line and matching F04-JOIN line must appear together in **one** issue comment after the organizer's registration and before the cutoff. Editing the comment at or after the deadline disqualifies it.
- **Sample selection:** sort public comments by GitHub created timestamp, then numeric comment ID. Enroll the first N qualifying campaign IDs from **distinct public GitHub accounts**. Overflow, duplicate accounts, altered/late registrations and invalid submissions remain in the roster with reasons. Never replace an enrolled participant whose sealed file is missing.
- **Privacy:** participant comments expose public GitHub account names and commitments, not predictions, nonces, health data, home addresses or identities beyond what GitHub already publicly shows. Participation is voluntary, no accounts are created and the browser does not upload anything automatically.

This design constrains reporting but does not make anonymous identity or one-human-one-account guarantees. It cannot detect unposted experiments or deleted comments; for a real study use independent recruitment and archived registry exports.

## Organizer workflow

The [F04 browser studio](f04/index.html) creates and downloads the public study JSON and exact master registration line. Make a dedicated public GitHub issue **before** enrolling participants. Copy the generated public master line as its own GitHub comment. Distribute the public JSON and issue URL to everyone.

Alternatively from Node 22+:

    npm install --ignore-scripts --no-audit --no-fund
    node scripts/f04-create.mjs 8 public-study.json

The local configuration is public, but publishing it is **not** enough: enrollment is recognized only if the exact master line is visible in a timely public issue comment. The issue owner should preserve an independent snapshot or archive.

## Participant workflow

The browser studio's "Join a study" route accepts the published public-study.json, verifies its hash, and collects 4 × 20 symbol predictions. It creates a **private** F03-compatible sealed file with predictions, nonces and the fixed study rounds. It generates the two public witness lines:

    FB21-F03/v1 campaign=... commitment=... blocks=4 first=... last=...
    FB21-F04-JOIN/v1 study=... hash=... campaign=... commitment=...

Post **both lines as one comment** on the study's public registry issue **before** the enrollment cutoff. Do not edit them afterward. Do not post the private file until the four future beacon rounds have elapsed.

The CLI equivalent accepts the same F03 prediction JSON format:

    node scripts/f04-join.mjs public-study.json predictions.json private-campaign.json

The participant's private file must be retained for independent verification. No new account, microphone, camera, sleep restriction, meditation, or personal health information is required.

## Coordinator enrollment check and final audit

To inspect the *currently visible* GitHub registry comments before or after the cutoff:

    node scripts/f04-roster.mjs public-study.json "https://github.com/owner/repo/issues/123" > roster.json

After all four rounds have been published, collect the private sealed JSON files from the participants through a consented, secure channel. Do not collect sensitive information or require participants to identify themselves beyond the public registration.

Prepare manifest.json, with file paths relative to the manifest file:

~~~json
{"files":["private-campaign-a.json","private-campaign-b.json"]}
~~~

Include **every available** private file, not just reports with favorable results. Audit:

    node scripts/f04-audit.mjs public-study.json "https://github.com/owner/repo/issues/123" manifest.json > study-audit.json

The command checks public organizer and participant timestamps, study hash and campaign hashes, fixed shared beacon rounds, both public beacon relays and pinned-key BLS signatures. It derives all target symbols independently from each authenticated beacon. Every selected participant appears as **verified** or **unresolved**. Files from outside the selected cohort and duplicate private file entries are separately listed, never quietly included.

If fewer than the preregistered number were validly enrolled, any private campaign is missing, any participant audit fails, or any extra unmatched submission is present, the result is **incomplete with no pooled p-value**. The script exits nonzero (2 for incomplete; 1 for invalid inputs/errors). A report is emitted even when incomplete.

## Why a shared-target exact null test?

Suppose two participants predict the *same* symbol for an identical target round and trial index. Their two hit indicators are perfectly correlated. Ordinary Binomial(n=160,p=.25) would incorrectly pretend they were independent.

F04 groups the **unique (round number, trial index)** target cells. For each cell there are four equally likely null targets, and each possible symbol gives a specific number of participant hits (0 to cohort size). It convolves the four-option hit-count distribution across the 80 distinct target cells using dynamic programming, then computes the upper tail at the actual total hits. This is an exact conditional combinatorial calculation **under the model of independent uniform target-cell values**, explicitly preserving shared-target dependencies. Test vectors verify that two participants making identical predictions are *not* evaluated as 160 independent trials.

Caveat: drand produces one random signature per round and F02 expands it deterministically with HMAC-SHA-256 into 20 targets. Treating the derived cells as independent uniform values is a **cryptographic pseudorandomness assumption**, not a mathematical consequence of independent physical events or a proof of causal effects. The exact test is exact **for the specified model**. The study is not powered for any clinical or paranormal conclusion. Null and negative findings must be reported.

## Research ethics and limitations

Before enrolling real participants in a formal study, use an appropriate independent ethics or institutional review process, a clear consent and withdrawal procedure, privacy notice, retention/deletion plan, exclusion rules, recruitment protocol and statistical power analysis. This repository does not imply IRB approval, a clinical trial, or a verified paranormal phenomenon. Avoid deception, pressure, sleep deprivation, forced breathing and claims of treatment efficacy. Participants can withdraw; withdrawals must remain explicitly represented as missing in the audit.

Public GitHub comments and their timestamps are part of the experimental protocol; they are not a distributed immutable ledger. Deleted comments, manipulated GitHub accounts, unposted campaigns, repeat registrations under different accounts, and outside collusion remain threats. An independent monitor should archive registrations and lock recruitment before looking at targets.

## Verification

    node --test tests/f04-cohort.test.mjs
    node --test tests/*.test.mjs

The independent auditor imports the already-tested F03 pinned-key BLS verifier and preserves F01, F02, F03, all original FocusBridge21 Quiet Deck audio, and the local Signal Ledger unchanged.

### References

- [drand Quicknet documentation](https://docs.drand.love/)
- [F03 campaign protocol](GATEWAY_F03_PROTOCOL.md)
- [Army Gateway memorandum (1983)](https://www.govinfo.gov/app/details/GOVPUB-D101-PURL-gpo152943)
