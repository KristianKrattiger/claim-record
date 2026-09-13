import type { Ledger, PinnedCorpus, RowProvenance } from "../assay/types.js"

export interface CitationRef {
  rowIndex: number
  sideIndex: number
}

export interface Citation extends CitationRef {
  docId: string
  start: number
  end: number
  text: string
  provenance?: RowProvenance
}

export interface NarrativeParagraph {
  text: string
  citations: Citation[]
}

export interface Narrative {
  paragraphs: NarrativeParagraph[]
}

export class NarratorError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NarratorError"
  }
}

/**
 * Expand and gate citations. Every cited span must be byte-identical to the
 * ledger row. Divergent rows may not be cited on only one side. Provenance is
 * copied, never upgraded.
 */
export function checkCitations(ledger: Ledger, draft: { text: string; citations: CitationRef[] }[]): Narrative {
  return {
    paragraphs: draft.map((p) => {
      const citations: Citation[] = p.citations.map((c) => {
        const row = ledger.rows[c.rowIndex]
        if (!row) throw new NarratorError(`no row ${c.rowIndex}`)
        const side = row.sides[c.sideIndex]
        if (!side) throw new NarratorError(`no side ${c.rowIndex}.${c.sideIndex}`)
        return {
          ...c,
          docId: side.docId,
          start: side.start,
          end: side.end,
          text: side.text,
          ...(row.provenance ? { provenance: { class: row.provenance.class, reasons: [...row.provenance.reasons] } } : {}),
        }
      })
      const byRow = new Map<number, Set<number>>()
      for (const c of citations) {
        const set = byRow.get(c.rowIndex) ?? new Set()
        set.add(c.sideIndex)
        byRow.set(c.rowIndex, set)
      }
      for (const [rowIndex, sides] of byRow) {
        const row = ledger.rows[rowIndex]!
        if (row.status === "divergent" && sides.size < row.sides.length) {
          throw new NarratorError(`divergent row ${rowIndex} must cite both sides`)
        }
      }
      return { text: p.text, citations }
    }),
  }
}

/** Stub narrator: one paragraph per row, citing every side. No model. */
export function narrate(ledger: Ledger, _corpus: PinnedCorpus): Narrative {
  const draft = ledger.rows.map((row, rowIndex) => ({
    text: row.statement,
    citations: row.sides.map((_, sideIndex) => ({ rowIndex, sideIndex })),
  }))
  return checkCitations(ledger, draft)
}
