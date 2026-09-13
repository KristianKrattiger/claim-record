# Claim / Record

A local field instance of Assay: two labeled piles in, a grounded ledger or a typed refusal out.

This is not a legal product and not legal advice. It checks whether quotes in a Claim pile are exact substrings of the bytes you uploaded, against a Record pile.

Assay itself is vendored from [Receipts](https://github.com/KristianKrattiger/receipts) (`src/assay`, git subtree). Do not publish it as a package from here.

## Run locally

```bash
npm install
cp .env.example .env   # then set ANTHROPIC_API_KEY, or run Ollama
npm test
npm start
```

Open http://127.0.0.1:8787

- Drop `.txt` or `.md` files into **Claim** and **Record**
- Enter a subject
- Choose Anthropic (API key in `.env`) or Ollama (`OLLAMA_HOST`, `OLLAMA_MODEL`)
- Run. One pile only refuses `CORPUS_INSUFFICIENT` without a model call.

**Narrate (experimental)** is off by default. It restates ledger rows with citations; it does not invent quotes.

## Sync Assay

Receipts stays the source of truth:

```bash
git subtree pull --prefix=src/assay <path-to-receipts> assay-split
```
