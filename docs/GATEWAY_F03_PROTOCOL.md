# F03: Preregistered Campaigns, BLS Authentication and Registry Coverage

**Status:** exploratory, independently inspectable. F01 and F02 remain intact. No result should be interpreted as evidence for time travel, precognition, remote viewing, or medical benefits.

## Why F03?

F02 commits to one twenty-trial prediction set and checks a public timestamp and drand relays. F03 introduces:
1. **Four fixed blocks and 80 predictions** registered together before the first round, rather than selectively showing one unusually high score.
2. **Pinned-key BLS12-381 verification** of each drand Quicknet G1 beacon signature, in a separate Node CLI.
3. A **public GitHub issue registry coverage index** that finds unreported registrations, duplicates, and late or edited comments.
4. **Intention-to-report accounting**: every registered block appears in the output; missing or invalid rounds remain unresolved and block pooled analysis.

The browser campaign studio and Node tools do not alter original Monroe-independent audio, Quiet Deck sessions, F01, or F02.

## Fixed preregistration format

- F03 schema: focusbridge21/f03/v1.
- Four independent F02-v1 plans, each with 20 symbols indexed 0,1,2,3.
- First drand Quicknet round scheduled strictly over **20 minutes** from the local clock; additional rounds are spaced exactly **40 rounds** (120 seconds).
- Each F02 commitment remains the existing F02 SHA-256 canonical payload, protecting prediction values, target round and private 32-byte nonce.
- 16-byte random pseudonymous campaign ID, obtained via Web Crypto.
- Registration preimage (UTF-8, separated by literal LF): FB21-F03-v1, campaign ID, pinned chain hash, analysis identifier all-four-blocks-summed-hits-v1, decimal 4, followed by four lines of index,round,commitment with comma delimiters.
- Public registration hash: SHA-256 of that entire preimage.
- Public GitHub issue comment must contain the precise generated witness line (campaign ID, registration hash, block count and first/last rounds).
- Both GitHub-created and last-updated timestamps must be **strictly earlier than the first beacon schedule by 30 seconds**.
- After all four rounds exist, the sealed private file can be disclosed for reproducibility.

The public line contains hashes, not private predictions. Public GitHub comments reveal the posting account's identity; use appropriate research privacy.

## Quicknet cryptographic verification

Pinned Quicknet chain hash:

    52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971

Pinned G2 public key (96 bytes, hexadecimal):

    83cf0f2896adee7eb8b5f01fcad3912212c437e0073e911fb90022d3e760183c8c4b450b6a0a6c3ac6a5776a2d1064510d1fec758c921cc22b0e17e63aaf4bcb5ed66304de9cf809bd274ca73bab4af5a6e9c76a4bc09e76eae8991ef5ece45a

Scheme: bls-unchained-g1-rfc9380. Domain separation tag:

    BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_

The 8-byte big-endian encoded round number is first SHA-256 hashed, then hash-to-G1 uses the above DST. A candidate 48-byte G1 signature is verified against the pinned G2 key by BLS pairing verification. In addition to that, the F02 independent relay check requires that both HTTPS relays agree on the raw signature and randomness, which must equal SHA-256(signature).

The verifier uses an exact dependency pin to @noble/curves version 2.4.0, with no library loaded into the meditation interface. Known-valid Quicknet round **33,483,413** and negative mutation vectors are tested in CI.

A valid signature verifies the drand output for that round under its group key. It does *not* prove that the human prediction was made before that round; the independent GitHub timestamp witnesses that separate requirement.

## Browser campaign workflow

Open [F03 Campaign Studio](f03/index.html), choose all 80 predictions, download the PRIVATE sealed JSON and copy only the public registration line. Post that line as a comment in a public GitHub issue *before* the deadline. Do not edit the comment. Only after the four rounds have occurred should you reveal the private file to independent auditors.

The studio has no server, no account credentials, and no automatic submission. It does not purport to verify BLS signatures; use the Node CLI.

## Command-line workflow

You can also create a four-block private campaign from a local JSON file. It must contain exactly four arrays with 20 integers each (0 to 3):

~~~json
{"blocks":[
 [0,1,2,3,0,1,2,3,0,1,2,3,0,1,2,3,0,1,2,3],
 [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
 [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
 [2,3,0,1,2,3,0,1,2,3,0,1,2,3,0,1,2,3,0,1]
]}
~~~

Install dependencies and seal:

~~~sh
npm install --ignore-scripts --no-audit --no-fund
node scripts/f03-create.mjs predictions.json private-campaign.json
~~~

**Never publish the private file before the selected rounds.** The output includes the public witness line and the registration deadline. Do not edit the published comment afterward.

Audit after all four rounds:

~~~sh
node scripts/f03-audit.mjs private-campaign.json "https://github.com/owner/repo/issues/123#issuecomment-4567" > audit.json
~~~

This CLI uses the pinned-key BLS verifier and returns status for **every** registered block. If any beacon or signature cannot be checked, the result records an unresolved block, emits no pooled p-value and returns exit code 2 (rather than inventing a hit count).

For full verified campaigns, the app reports the descriptive Binomial(n=80,p=0.25) one-sided upper-tail under an independent-target null model. This statistic is not scientific evidence without a prospective multi-participant study and appropriate controls.

## Auditing registry completeness

Choose one public GitHub issue as your **explicit registration registry** and publish its URL before collecting data. Every eligible participant must post the exact witness line there. Afterward run:

~~~sh
node scripts/f03-registry.mjs "https://github.com/owner/repo/issues/123" audit.json > registry-coverage.json
~~~

The read-only index paginates all public comments and identifies valid registrations, duplicate IDs, late or edited witnesses, missing reports and unmatched report files. It reports whether a submitted report *claims* to be complete, but does not trust submitted JSON as independently verified. Independently rerun each participant's private sealed file against their GitHub comment to verify it. Preserve a historical archive of public comments to defend against deletion.

**Important limits:** the index cannot find experiments that were never registered or comments that were deleted before inspection. A participant may also run many separate campaigns and only register favorable ones. Recruitment must be independently supervised to address this.

## Safety and integrity

No microphone, camera, location sensor, health data, proprietary Monroe Institute audio, forced breathing or sleep deprivation are required. Users can stop at any time. No result is therapeutic, diagnostic, a certification, or proof of anomalous perception. All GitHub witness data is public by design. The private JSON is local until you choose to share it.

## Sources

- drand Quicknet launch: https://docs.drand.love/blog/2023/10/16/quicknet-is-live/
- drand developer docs: https://docs.drand.love/developer/
- drand cryptography: https://docs.drand.love/docs/cryptography/
- noble-curves BLS: https://github.com/paulmillr/noble-curves
- Army Gateway assessment (1983): https://www.govinfo.gov/app/details/GOVPUB-D101-PURL-gpo152943
