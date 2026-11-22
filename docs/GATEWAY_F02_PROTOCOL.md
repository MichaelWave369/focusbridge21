# F02: Future Beacon Protocol

**Status:** Experimental, independently auditable public-record protocol, not an assertion of precognition.

## Why add F02?

F01 is a useful local browser probability demo, but its predictions and randomly selected targets live in editable state. F02 addresses two independent weaknesses:

1. **Predictions fixed before an unpredictable public event:** commit to all 20 predictions before a scheduled future drand Quicknet round.
2. **An external time witness:** publish only the commitment line in a public GitHub issue comment, whose creation and last-edit timestamps are checked by the verifier.

The protocol does *not* control selection bias or optional reporting. One favorable block is not evidence for precognition.

## Browser workflow

Open the F02 research studio, complete 20 symbol predictions, and download its **private sealed JSON**. It includes all guesses, nonce, round, and commitment. Never post this file before the beacon round: doing so reveals predictions and may alter participant behavior. The browser schedules a future drand Quicknet round more than six minutes away; it publishes nothing automatically.

The generated public witness line looks like:

    FB21-F02/v1 round=<number> commitment=<64-lowercase-hex>

Post exactly that one line as a comment on a publicly accessible GitHub issue **at least 30 seconds before the round**. Do not edit the comment later. After the scheduled round, paste the full issue-comment URL, for example:

    https://github.com/owner/repository/issues/123#issuecomment-45678

Choose Verify public records, or independently run:

    node scripts/f02-audit.mjs path/to/private-sealed.json "https://github.com/owner/repository/issues/123#issuecomment-45678"

With no URL the CLI only checks the local hash and explicitly does **not** claim public verification.

## Fixed protocol

- Schema: focusbridge21/f02/v1
- Chain: drand mainnet **quicknet**, chain hash 52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971
- Genesis: 1692803367 Unix seconds, period: 3 seconds, with round 1 at genesis.
- Fixed predictions: 20 symbols indexed 0 through 3.
- Commitment preimage (UTF-8 with literal LF separators): FB21-F02-v1, chain hash, decimal round, comma-separated zero-indexed predictions, 32-byte nonce encoded in lowercase hex.
- Commitment: SHA-256 of preimage, lowercase hex.
- Public witness: exact line above, GitHub comment created_at **and** updated_at strictly before round timestamp minus 30 seconds.
- Beacon relays: api.drand.sh and drand.cloudflare.com, both requested by pinned round number and pinned chain hash. They must agree on signature and randomness.
- Beacon integrity check: SHA-256(decoded signature bytes) equals reported randomness, matching drand's specified relation.
- Target i (0..19): first byte of HMAC-SHA-256(key=beacon randomness as 32 raw bytes, message=UTF8("FB21-F02-v1|"+round+"|"+i)) bitwise AND 3.
- Null hit probability: p=1/4, n=20. Exact one-sided Binomial(20, 0.25) upper-tail reported descriptively. All trials in a block are predetermined by one round, so the block is the relevant unit for exploratory inference.

## What this does and does not verify

The verifier independently obtains the public GitHub comment and two HTTPS beacon responses and rejects mismatched hashes, wrong rounds, invalid formats, edited comments, missed timestamp deadlines, and relay disagreements.

**Important:** The proof of the drand signature against the Quicknet **BLS group public key is not implemented in F02**. SHA-256(signature) integrity and agreement between HTTPS relays are useful cross-checks, but not full drand cryptographic verification. Add a verified drand client or an audited BLS verification step for F03 before claiming cryptographic beacon authenticity. Browser clock is not trusted; the public comment timestamp is the external witness.

This protocol cannot prevent participants from abandoning blocks, selectively reporting, coordinating predictions, or modifying local files. It cannot establish human access to future information without a preregistered, sufficiently powered, independently supervised study that reports all attempted blocks.

## Security and privacy

The private plan has no name, birthdate, IP address, sensor values, or health information. The public comment exposes a hash and round, **not predictions or nonce**. The user must retain the sealed JSON privately until the round exists; then it can be shared with auditors. No local storage or background upload is necessary. Clicking Verify makes browser requests to GitHub and drand; the CLI uses the same public sources.

The experiment does not require meditation, sleep deprivation, altered breathing, or unusual subjective experiences. No medical or paranormal outcomes are promised.

## Verification and tests

Run:

    node --check docs/f02/protocol.mjs
    node --check docs/f02/studio.mjs
    node --check scripts/f02-audit.mjs
    node --test tests/f02-protocol.test.mjs
    node --test tests/*.test.mjs

Relevant upstream documentation: https://drand.love/developer and https://docs.drand.love/developer/API-v2/drand-http-api/
