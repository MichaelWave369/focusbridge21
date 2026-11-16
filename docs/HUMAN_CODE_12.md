# Human Code 12 · Original practice curriculum

Human Code 12 is an **optional, self-paced, local-first reflection atlas** within the FocusBridge21 Quiet Deck. Its twelve developmental lessons are **not** the Monroe/Gateway focus numbers (e.g., Focus 10/12/15/21), intelligence assessments, medical scales, mystical ranks, or claims of universal physics.

## Structure and lessons

| Levels | Arc | Lessons |
| --- | --- | --- |
| 1–3 | Foundation | The Vessel · The Breath · The Quiet Mind |
| 4–6 | Awareness | The Observer · The Inner Theater · The Architect |
| 7–9 | Connection | The Mirror · The Heart · The Bridge |
| 10–12 | Integration | The Weave · The Steward · The Whole |

Every level has an objective, a low-pressure exercise, a reflection question, and one practical action. Levels are available in any order, with no prerequisites or artificial unlocks. The 3/6/9/12 milestones are organizational only. Level 12 explicitly permits revisiting and revising the curriculum.

The suggested meditations and imagery are personal contemplative practices. We do not measure EEG, confirm a focus state, guarantee healing, verify ESP, or establish the universe as a holographic computer. “Source” and unity may be personally meaningful philosophical metaphors, not required beliefs.

## Integrations with existing FocusBridge21

- A **Human Code 12** card launches directly from the Quiet Deck home screen on both GitHub Pages entrypoints.
- The detailed curriculum screen offers **Open Quiet Mind practice**, which uses existing QMM session setup and its safety/return workflow.
- **Open Intention Studio** uses existing audio, recipe, voice and readiness controls.
- The module does not independently start a timer, induce audio, trigger any voice, or bypass existing sound/headphone checks.
- No changes are made to Chapter 2–7 content, the Focus Sync progression, the audio graph, the original React cockpit, or the full Signal Ledger.

## Persistence and privacy

The standalone browser key is `focusbridge21-human-code12-v1`. Data includes only per-level notes (max 1,600 characters), optional self-reported explored markers, and an update timestamp. Content is HTML-escaped before rendering.

Entries stay on this device in browser localStorage, which is **not encrypted**. The application does not transmit the journal to a server. JSON export is explicit and user-initiated; its file is created in the browser. Clearing Human Code 12 data requires a confirmation and deletes **only** this key, leaving `focusbridge21-ledger-v1` and other profile/sound preferences untouched.

LocalStorage may be blocked or erased by private browsing settings. The UI continues operating in memory but warns that unsaved data may disappear.

## Manual QA checklist

1. Open `/` and `/docs/`; verify the new card and responsive level grid display.
2. Select 1, 6, 9 and 12; verify every objective/practice/action and ability to select nonsequential levels.
3. Write a reflection, mark explored, reload, confirm persistence. Unmark, switch levels, reload.
4. Enter `</textarea><script>alert('x')</script>` as a note; verify it appears as ordinary text, not rendered HTML.
5. Export JSON; confirm only the Human Code 12 journal is included.
6. Clear Human Code data only after confirmation; confirm existing Quiet Deck Signal Ledger and Intention Studio recipes are unchanged.
7. Open QMM and Intention Studio from the curriculum; verify all standard safety checks, Return Now, and audio controls still work.
8. After an online visit, revisit both entrypoints offline with the new service worker installed.
9. Test a narrow mobile display and keyboard-only navigation, including focused level buttons and textarea.

## Automated validation

`node --check docs/fb21-human-code12.js` and `node --test tests/human-code12.test.mjs`, plus the repository-wide Node smoke test suite and JavaScript syntax checks.

This is an original educational framework, not the social-video creator's 12-Level Human Code product and not a reproduction of licensed Gateway audio.
