import { describe, expect, it } from "vitest"
import type { Ledger, LedgerRow } from "../assay/types.js"
import { checkCitations, narrate, NarratorError } from "./narrate.js"

function side(docId: string, text: string, start = 0) {
  return { docId, start, end: start + text.length, text, tag: "EXACT" as const }
}

function row(over: Partial<LedgerRow> & Pick<LedgerRow, "status" | "sides">): LedgerRow {
  return {
    topic: over.topic ?? "t",
    statement: over.statement ?? "a claim",
    relation: over.relation ?? "contradicts",
    ...over,
  }
}

function ledger(rows: LedgerRow[]): Ledger {
  return {
    outcome: "ledger",
    subject: "uptime",
    generatedAt: "2026-09-13T00:00:00.000Z",
    docs: [],
    failures: [],
    rows,
    audit: { proposed: 1, admitted: rows.length, denied: [], claimantChunks: 0, claimantCovered: 0, claimantOmitted: 0, independentDocsAdmitted: 0 },
  }
}

describe("checkCitations", () => {
  const divergent = ledger([row({
    status: "divergent",
    relation: "contradicts",
    sides: [side("c", "We guarantee 99.99% uptime."), side("r", "four outages")],
    provenance: { class: "provisional", reasons: ["volatile-source"] },
  })])

  it("copies span text, offsets, and provenance without upgrading", () => {
    const n = checkCitations(divergent, [{
      text: "The claim and the record disagree.",
      citations: [{ rowIndex: 0, sideIndex: 0 }, { rowIndex: 0, sideIndex: 1 }],
    }])
    expect(n.paragraphs[0]!.citations[0]!.text).toBe("We guarantee 99.99% uptime.")
    expect(n.paragraphs[0]!.citations[0]!.provenance).toEqual({
      class: "provisional", reasons: ["volatile-source"],
    })
  })

  it("rejects a citation that does not name a ledger side", () => {
    expect(() => checkCitations(divergent, [{
      text: "x", citations: [{ rowIndex: 0, sideIndex: 9 }],
    }])).toThrow(NarratorError)
  })

  it("rejects citing only one side of a divergent row", () => {
    expect(() => checkCitations(divergent, [{
      text: "x", citations: [{ rowIndex: 0, sideIndex: 0 }],
    }])).toThrow(/both sides/)
  })
})

describe("narrate stub", () => {
  it("cites every side of each row", () => {
    const l = ledger([row({
      status: "unverified",
      relation: "unsupported",
      statement: "uptime guarantee",
      sides: [side("c", "We guarantee 99.99% uptime.")],
    })])
    const n = narrate(l, { subject: "uptime", docs: [], failures: [] })
    expect(n.paragraphs).toHaveLength(1)
    expect(n.paragraphs[0]!.citations[0]!.text).toBe("We guarantee 99.99% uptime.")
  })
})
