import { z } from "zod"
import type { ProposalClient } from "../assay/cartographer/propose.js"
import { ProposalBatchSchema } from "../assay/cartographer/schema.js"

// Ollama's `format: "json"` only constrains output to be *valid* JSON, not any
// particular shape — a model left to guess field names from prose alone (the
// way the Anthropic client's schema-typed structured output never has to)
// will invent its own. Passing the real JSON Schema switches Ollama to
// grammar-constrained decoding against these exact fields, the same guarantee
// `betaZodOutputFormat` gives the Anthropic client.
const RESPONSE_FORMAT = z.toJSONSchema(ProposalBatchSchema)

export function ollamaClient(opts: { host?: string; model?: string } = {}): ProposalClient {
  const host = (opts.host ?? process.env["OLLAMA_HOST"] ?? "http://127.0.0.1:11434").replace(/\/$/, "")
  const model = opts.model ?? process.env["OLLAMA_MODEL"] ?? "llama3.2"
  return {
    async propose({ system, user }) {
      const response = await fetch(`${host}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          format: RESPONSE_FORMAT,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      })
      if (!response.ok) {
        throw new Error(`ollama: ${response.status} ${await response.text()}`)
      }
      const body = await response.json() as { message?: { content?: string } }
      const raw = body.message?.content
      if (!raw) throw new Error("ollama: empty message")
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        throw new Error("ollama: message was not JSON")
      }
      const batch = ProposalBatchSchema.parse(parsed)
      return { proposals: batch.proposals }
    },
  }
}
