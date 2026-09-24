import { describe, expect, it } from "vitest"
import { denialTally, escapeHtml, formatAudit } from "./audit.js"

const base = {
  proposed: 7, admitted: 3, denied: [],
  claimantChunks: 10, claimantCovered: 4, claimantOmitted: 6, claimantOmittedPreviews: [],
  independentDocsTotal: 3, independentDocsAdmitted: 2,
  issueStatementDenied: 1, holdingCompetitorDenied: 2, contextUnverified: 1, disputed: 2,
}

describe("formatAudit", () => {
  it("prints coverage, admission, both denial counters, and context_unverified", () => {
    const html = formatAudit(base)
    expect(html).toContain("Coverage 4 / 10 claimant chunks (6 omitted).")
    expect(html).toContain("Proposed 7 / admitted 3.")
    expect(html).toContain("Record docs on ledger: 2 / 3.")
    expect(html).toContain("Issue-statement denials: 1.")
    expect(html).toContain("Holding-competitor denials: 2.")
    expect(html).toContain("Context-unverified: 1.")
    expect(html).toContain("Disputed: 2.")
  })

  it("tallies denials by code, most frequent first, and omits the sentence when there are none", () => {
    expect(formatAudit(base)).not.toContain("Denials:")
    const denied = [
      { proposalId: "a", code: "LOW_CONFIDENCE" },
      { proposalId: "b", code: "HOLDING_COMPETITOR" },
      { proposalId: "c", code: "HOLDING_COMPETITOR" },
      { proposalId: "d", code: "DUPLICATE" },
    ]
    expect(denialTally(denied)).toBe("2 HOLDING_COMPETITOR, 1 DUPLICATE, 1 LOW_CONFIDENCE")
    expect(formatAudit({ ...base, denied })).toContain("Denials: 2 HOLDING_COMPETITOR, 1 DUPLICATE, 1 LOW_CONFIDENCE.")
  })

  it("lists omitted previews as escaped list items and drops blank ones", () => {
    const html = formatAudit({ ...base, claimantOmittedPreviews: ["<b>Section 10(b)</b>", "", "Rule 10b-5 & scienter"] })
    expect(html).toContain("<li>&lt;b&gt;Section 10(b)&lt;/b&gt;</li>")
    expect(html).toContain("<li>Rule 10b-5 &amp; scienter</li>")
    expect(html).not.toContain("<li></li>")
    expect(html).not.toContain("<b>")
  })

  it("renders a missing audit as unknowns rather than throwing", () => {
    const html = formatAudit({})
    expect(html).toContain("Coverage ? / ? claimant chunks (? omitted).")
    expect(html).toContain("Holding-competitor denials: 0.")
    expect(html).not.toContain("<ul>")
  })
})

describe("escapeHtml", () => {
  it("escapes the four HTML-significant characters", () => {
    expect(escapeHtml(`<a href="x">&</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;")
  })
})
