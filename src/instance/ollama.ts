import type { ProposalClient } from "../assay/cartographer/propose.js"
import { ProposalBatchSchema } from "../assay/cartographer/schema.js"

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
          format: "json",
          messages: [
            { role: "system", content: system },
            { role: "user", content: `${user}\n\nRespond with JSON of the form {"proposals":[...]}` },
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
