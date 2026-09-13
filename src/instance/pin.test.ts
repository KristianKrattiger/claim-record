import { describe, expect, it } from "vitest"
import { ALLOWED_EXT, extensionOf, pinCorpus, pinUpload, sha256, LABELS } from "./pin.js"

describe("pinUpload", () => {
  it("hashes the bytes and labels the role", () => {
    const d = pinUpload(
      { name: "claim.txt", text: "We guarantee 99.99% uptime.", role: "claimant" },
      "d0",
      "2026-09-13T00:00:00.000Z",
    )
    expect(d.role).toBe("claimant")
    expect(d.pin).toEqual({ kind: "hash", sha256: sha256("We guarantee 99.99% uptime.") })
    expect(d.stability).toBe("volatile")
    expect(d.url).toBe("file:///d0")
  })
})

describe("pinCorpus", () => {
  it("stamps Claim/Record labels", () => {
    const c = pinCorpus([
      { name: "a.txt", text: "claim", role: "claimant" },
      { name: "b.txt", text: "record", role: "independent" },
    ], "uptime", "2026-09-13T00:00:00.000Z")
    expect(c.labels).toEqual(LABELS)
    expect(c.docs).toHaveLength(2)
    expect(c.docs[0]!.docId).toBe("d0")
    expect(c.docs[1]!.role).toBe("independent")
  })
})

describe("extensionOf", () => {
  it("allows txt and md only", () => {
    expect(extensionOf("a.TXT")).toBe(".txt")
    expect(ALLOWED_EXT.has(extensionOf("note.md"))).toBe(true)
    expect(ALLOWED_EXT.has(extensionOf("filing.pdf"))).toBe(false)
  })
})
