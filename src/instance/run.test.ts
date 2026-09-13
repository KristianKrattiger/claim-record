import { describe, expect, it } from "vitest"
import type { ProposalClient } from "../assay/cartographer/propose.js"
import { runClaimRecord, UploadError } from "./run.js"

function client(proposals: object[]): ProposalClient {
  return { propose: async () => ({ proposals: proposals as never, stopReason: "end_turn" }) }
}

describe("runClaimRecord", () => {
  it("refuses CORPUS_INSUFFICIENT before calling the model when Record is empty", async () => {
    let called = false
    const c: ProposalClient = { propose: async () => { called = true; return { proposals: [] } } }
    const out = await runClaimRecord({
      subject: "uptime",
      claim: [{ name: "a.txt", text: "We guarantee 99.99% uptime." }],
      record: [],
      client: c,
    })
    expect(out.result.outcome).toBe("refusal")
    if (out.result.outcome === "refusal") expect(out.result.reason).toBe("CORPUS_INSUFFICIENT")
    expect(called).toBe(false)
  })

  it("refuses a fabricated quote", async () => {
    const out = await runClaimRecord({
      subject: "uptime",
      claim: [{ name: "a.txt", text: "We guarantee 99.99% uptime for every account." }],
      record: [{ name: "b.txt", text: "The service ran without incident." }],
      client: client([{
        type: "unsupported", topic: "uptime", statement: "uptime guarantee",
        from: { docId: "d0", quote: "We promise flawless uptime forever" },
        to: null, rationale: "fabricated", confidence: 0.9,
      }]),
    })
    expect(out.result.outcome).toBe("refusal")
    if (out.result.outcome === "refusal") expect(out.result.reason).toBe("NO_GROUNDING")
  })

  it("rejects a pdf upload", async () => {
    await expect(runClaimRecord({
      subject: "uptime",
      claim: [{ name: "a.pdf", text: "x" }],
      record: [{ name: "b.txt", text: "y" }],
      client: client([]),
    })).rejects.toThrow(UploadError)
  })

  it("does not narrate unless asked, and only on a ledger", async () => {
    const silent = await runClaimRecord({
      subject: "uptime",
      claim: [{ name: "a.txt", text: "We guarantee 99.99% uptime for every account." }],
      record: [{ name: "b.txt", text: "The service ran without incident." }],
      client: client([]),
      narrate: true,
    })
    expect(silent.result.outcome).toBe("refusal")
    expect(silent.narrative).toBeUndefined()
  })

  it("ledgers an anchored unsupported claim and narrates only when asked", async () => {
    const proposal = {
      type: "unsupported", topic: "uptime", statement: "uptime guarantee",
      from: { docId: "d0", quote: "We guarantee 99.99% uptime for every account." },
      to: null, rationale: "no record confirms this figure", confidence: 0.6,
    }
    const base = {
      subject: "uptime",
      claim: [{ name: "a.txt", text: "We guarantee 99.99% uptime for every account." }],
      record: [{ name: "b.txt", text: "The service ran without incident for the past year." }],
      client: client([proposal]),
    }
    const off = await runClaimRecord(base)
    expect(off.result.outcome).toBe("ledger")
    expect(off.narrative).toBeUndefined()
    const on = await runClaimRecord({ ...base, narrate: true })
    expect(on.narrative?.paragraphs.length).toBeGreaterThan(0)
    expect(on.narrative!.paragraphs[0]!.citations[0]!.text).toBe("We guarantee 99.99% uptime for every account.")
  })
})
