import { readdirSync, readFileSync } from "node:fs"
import { dirname, isAbsolute, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const SRC = resolve(fileURLToPath(new URL(".", import.meta.url)), "..")
const FROM = /(?:\bfrom\s+|\bimport\s*\(\s*)["']([^"']+)["']/g
const ALLOWED = new Set(["zod", "vitest", "@anthropic-ai/sdk", "@anthropic-ai/sdk/helpers/beta/zod"])

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "assay") continue
      out.push(...walk(path))
    } else if (entry.name.endsWith(".ts")) out.push(path)
  }
  return out
}

describe("field instance isolation", () => {
  it("does not import Receipts fetch, report, or analyze-live", () => {
    const leaks: string[] = []
    for (const file of walk(SRC)) {
      const src = readFileSync(file, "utf8")
      FROM.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = FROM.exec(src))) {
        const spec = match[1]!
        if (spec.startsWith("node:") || ALLOWED.has(spec)) continue
        if (spec.startsWith(".")) {
          const resolved = resolve(dirname(file), spec)
          const rel = relative(SRC, resolved)
          if (rel.startsWith("..") || isAbsolute(rel)) leaks.push(`${relative(SRC, file)}: ${spec}`)
          if (/[\\/](fetch|report|analyze-live)/.test(spec)) leaks.push(`${relative(SRC, file)}: ${spec}`)
          continue
        }
        leaks.push(`${relative(SRC, file)}: ${spec}`)
      }
    }
    expect(leaks).toEqual([])
  })
})
