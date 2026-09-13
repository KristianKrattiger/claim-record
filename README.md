# Claim / Record

A local field instance of Assay: two labeled piles in, a grounded ledger or a typed refusal out.

This is not a legal product and not legal advice. It checks whether quotes in a Claim pile are exact substrings of the bytes you uploaded, against a Record pile. Exact bytes are not the same as a fair reading of the source.

Assay itself is vendored from [Receipts](https://github.com/KristianKrattiger/receipts) (`src/assay`, git subtree). Do not publish it as a package from here.

How the pieces fit: [architecture.md](architecture.md).

## Run locally

```bash
npm install
cp .env.example .env   # then set ANTHROPIC_API_KEY, or run Ollama
npm test
npm start
```

Open http://127.0.0.1:8787

- Drop `.txt` or `.md` files into **Claim** and **Record** (piles append; each row has Delete)
- Enter a subject
- Choose Anthropic (API key in `.env`) or Ollama (`OLLAMA_HOST`, `OLLAMA_MODEL`)
- Run. One pile only refuses `CORPUS_INSUFFICIENT` without a model call.

`tsx` loads Assay at process start. After engine changes, restart `npm start`. Port 8787 busy usually means a leftover `node` from an earlier session.

**Narrate (experimental)** is off by default. It restates ledger rows with citations; it does not invent quotes.

## What a row means

Each row is one Claim sentence and what the Record did to it:

- **divergent** — the Record contradicts it, or reports a newer state
- **corroborated** — the Record confirms it, and the confirming quote is not an issue statement or argument
- **unverified** — the Claim is specific, and no Record excerpt was admitted as speaking to it

The same Claim sentence should not appear as both divergent and corroborated. If both are proposed, the contradiction is kept. A grant of certiorari, a question presented, or an argument sentence cannot corroborate either answer.

Coverage lives on `result.audit`: `claimantChunks`, `claimantCovered`, `claimantOmitted`. A quiet ledger is uninformative without those numbers.

## Tests

```bash
npm test
```

Includes an in-repo 10(b)-shaped gold corpus under `src/assay/calibration/` (not the Desktop pile). One named residual case — an unmarked Record span with no holding competitor in that document — is required to still admit. That leftover is curator work, not assumed solved.

## Sync Assay

Receipts stays the source of truth:

```bash
git subtree pull --prefix=src/assay <path-to-receipts> assay-split
```
