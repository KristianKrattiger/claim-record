# Architecture

Claim / Record is a thin field instance of Assay. Two labeled piles of `.txt` / `.md` go in. A grounded ledger or a typed refusal comes out. Quotes that reach the ledger are byte-exact substrings of the uploaded files.

This file describes what the code does. It is not a product spec and not legal advice.

## Layers

```
src/web/index.html     UI: Claim / Record piles, subject, Run
src/server/index.ts    HTTP on 127.0.0.1:8787; POST /assay
src/instance/          pin uploads, Claim/Record prompt, Anthropic or Ollama
src/assay/             engine (git subtree from Receipts)
src/narrator/          optional restatement of admitted rows; off by default
```

The instance never fetches the web. It hashes the bytes you dropped (`src/instance/pin.ts`) and calls `assay()`. Assay never fetches either. It is pure given a pinned corpus and a proposal client.

Assay isolation: `src/assay` imports only itself, `zod`, `vitest`, or `node:`. Field labels (Claim / Record vs Vendor / Independent) are data on the corpus, not branches in the engine.

Receipts remains the source of truth for `src/assay`. Changes land here first; subtree-push back separately.

## Pipeline

```
corpus + subject
    → chunk (offset-preserving)
    → select candidates (IDF; pin first and last chunk per doc)
    → propose (model; quotes must be copied from excerpts)
    → admit (gate; model proposes, this decides)
    → assemble (ledger or typed refusal)
```

**Chunk.** Paragraphs, then a 700-character window, preferring a newline inside the window. Invariant: `doc.text.slice(chunk.start, chunk.end) === chunk.text`.

**Select.** Distinctive terms from the subject plus Claim text rank chunks for the model. Admission still uses `tokenize(subject)` only, so the relevance floor is not diluted by the whole Claim pile.

**Propose.** The model sees excerpts tagged `claimant` or `independent`. Claim / Record passes `CLAIM_RECORD_SYSTEM` (`src/instance/prompt.ts`). A quote that is not a substring of its excerpt is discarded later, so an approximate quote is worse than no proposal.

**Admit.** Re-derives offsets from the uploaded bytes. Denials are kept on the audit, not dropped. Among overlapping Claim spans, contradictions are judged before corroborations before unsupported claims. One Claim sentence is one row.

**Assemble.** Both roles present and at least one admitted row → ledger. Otherwise a refusal: `CORPUS_INSUFFICIENT`, `NO_GROUNDING`, `BELOW_THRESHOLD`, or `CONFLICTING_UNRESOLVABLE` (only when `conflictMode` is `converge`). Claim / Record uses `report`.

Claim / Record sizes the candidate budget with the pile: `max(40, 8 × uploads)`.

## What a row is

`divergent` — `contradicts` or `updates`.
`corroborated` — `corroborates`.
`unverified` — `unsupported`.

Green is not a score on the whole pile. It is this Claim sentence, confirmed by this Record quote.

## Gates that are not `findAnchor`

Exact-substring verification stops fabrication. It does not stop quote-mining. Assay adds extractive checks on bytes already in the corpus, or on caller-supplied tags. It does not run a second model pass to “fix” a quote, infer peer review, or rewrite the model’s quote into a holding.

**Discourse role** (`src/assay/bookkeeper/discourse.ts`). Expand the independent quote to its enclosing sentence (`.?!` or newline). Closed lexicon: `issue` (cert grant, question presented, whether … will lie), `argument` (petitioner argues, some courts have held, …), `holding` (`we hold`, `Held:`, …), else `unmarked`. Corroboration of `issue` or `argument` is denied `ISSUE_STATEMENT`.

**Same-document holding competitor.** If the proposed independent sentence is not a holding, and another sentence in that same Record document is a holding and IDF-relevant to the pair, corroboration is denied `ISSUE_STATEMENT`. The holding is not substituted for the quote.

**Residual.** An unmarked span with no holding competitor in that document still admits. That is curator work. The calibration fixture includes one such trap and requires it to admit, so the leftover rate is counted rather than assumed solved. `CONTEXT_UNVERIFIED` as a ledger row type is not in this tree.

**Independence.** A Record span that links to a Claim-side domain is `SELF_SOURCED`. That is non-independence, not credibility.

**Standing.** Optional `standing` on a document: `binding` | `persuasive` | `interested` | `unrated`. Absent means unrated (today’s equality). Assay never infers or writes the field. Interested corroboration cannot override a binding contradiction. Claim / Record does not tag files; that is a curator job if someone continues the work.

**Coverage.** Every ledger and every refusal reports:

- `claimantChunks` — chunks of Claim documents
- `claimantCovered` — those overlapping an admitted from-span
- `claimantOmitted` — the rest
- `independentDocsAdmitted` — distinct Record documents on admitted sides

A zero fabrication rate is uninformative without coverage. Thresholds are not retuned from these numbers yet. A ROC-style answer-rate vs fabrication-rate sweep is not implemented.

Gold assertions live in `src/assay/calibration/`. They are not the Desktop test pile.

## What this is not

- A curator. Distinguishing legitimate contestation from manufactured doubt is not inferred here.
- Federated opacity, Merkle commit-and-reveal, or a peer council. Those are GIN / Receipts stories, not this instance. Uploads are SHA-256 of the full file; ledger quotes are in the clear.
- A second proposer pass over the whole opinion.
- A credibility, funding, or peer-review classifier.

The model proposes. The gate admits or denies. Limitations stay on the audit.
