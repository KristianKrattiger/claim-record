import { createHash } from "node:crypto"
import type { PinnedCorpus, PinnedDoc, SourceRole } from "../assay/types.js"

export const LABELS = { claimant: "Claim", independent: "Record" } as const

export const ALLOWED_EXT = new Set([".txt", ".md"])

export interface Upload {
  name: string
  text: string
  role: SourceRole
}

export function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex")
}

export function extensionOf(name: string): string {
  const i = name.lastIndexOf(".")
  return i === -1 ? "" : name.slice(i).toLowerCase()
}

export function pinUpload(file: Upload, docId: string, fetchedAt: string): PinnedDoc {
  const hash = sha256(file.text)
  return {
    docId,
    url: `file:///${docId}`,
    label: file.name,
    role: file.role,
    kind: file.role === "claimant" ? "vendor_docs" : "review_site",
    fetchedAt,
    title: file.name,
    text: file.text,
    stability: "volatile",
    pin: { kind: "hash", sha256: hash },
    driftHash: hash,
  }
}

export function pinCorpus(files: Upload[], subject: string, fetchedAt = new Date().toISOString()): PinnedCorpus {
  const docs = files.map((f, i) => pinUpload(f, `d${i}`, fetchedAt))
  return { subject, docs, failures: [], labels: { ...LABELS } }
}
