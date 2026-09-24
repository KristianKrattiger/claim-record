// The audit line the page prints above and below the ledger. Plain ES module
// so the browser loads it unbundled and vitest exercises the same bytes.

/** @param {unknown} s */
export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * `denied` by code, most frequent first, ties alphabetical: "2 DUPLICATE, 1 LOW_CONFIDENCE".
 * @param {ReadonlyArray<{ code?: string }> | undefined} denied
 */
export function denialTally(denied) {
  /** @type {Map<string, number>} */
  const counts = new Map()
  for (const d of denied ?? []) {
    const code = d.code ?? "?"
    counts.set(code, (counts.get(code) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([code, n]) => `${n} ${code}`)
    .join(", ")
}

/**
 * Every field is optional: a refusal carries a partial audit and an older
 * ledger may predate a counter. Unknown counts print as "?", unknown
 * denial counters as 0.
 * @param {Partial<Omit<import("../assay/types.js").Audit, "denied">> & { denied?: ReadonlyArray<{ code?: string }> }} audit
 */
export function formatAudit(audit) {
  const denials = denialTally(audit.denied)
  const denialPart = denials ? ` Denials: ${escapeHtml(denials)}.` : ""
  const previews = (audit.claimantOmittedPreviews ?? []).filter(Boolean)
  const list = previews.length
    ? `<ul>${previews.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>`
    : ""
  return `<div class="audit"><p>Coverage ${audit.claimantCovered ?? "?"} / ${audit.claimantChunks ?? "?"} claimant chunks (${audit.claimantOmitted ?? "?"} omitted). Proposed ${audit.proposed ?? "?"} / admitted ${audit.admitted ?? "?"}. Record docs on ledger: ${audit.independentDocsAdmitted ?? "?"} / ${audit.independentDocsTotal ?? "?"}. Issue-statement denials: ${audit.issueStatementDenied ?? 0}. Holding-competitor denials: ${audit.holdingCompetitorDenied ?? 0}. Context-unverified: ${audit.contextUnverified ?? 0}. Disputed: ${audit.disputed ?? 0}.${denialPart}</p>${list}</div>`
}
