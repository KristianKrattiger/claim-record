import { createServer } from "node:http"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { ProposalClient } from "../assay/cartographer/propose.js"
import { anthropicClient } from "../instance/anthropic.js"
import { ollamaClient } from "../instance/ollama.js"
import { runClaimRecord, UploadError } from "../instance/run.js"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../web")
const PORT = Number(process.env["PORT"] ?? 8787)
const HOST = "127.0.0.1"

function clientNamed(name: string): ProposalClient {
  if (name === "ollama") return ollamaClient()
  if (name === "anthropic") return anthropicClient()
  throw new UploadError(`unknown client: ${name}`)
}

function send(res: import("node:http").ServerResponse, status: number, body: unknown, type = "application/json; charset=utf-8") {
  const bytes = typeof body === "string" ? body : `${JSON.stringify(body)}\n`
  res.writeHead(status, { "Content-Type": type, "Content-Length": Buffer.byteLength(bytes) })
  res.end(bytes)
}

export function createApp() {
  return createServer(async (req, res) => {
    const url = req.url ?? "/"
    if (req.method === "GET" && (url === "/" || url === "/index.html")) {
      send(res, 200, readFileSync(join(ROOT, "index.html"), "utf8"), "text/html; charset=utf-8")
      return
    }
    if (req.method !== "POST" || url !== "/assay") {
      send(res, 404, { error: "not found" })
      return
    }
    const chunks: Buffer[] = []
    for await (const c of req) chunks.push(c as Buffer)
    let body: {
      subject?: string
      claim?: { name: string; text: string }[]
      record?: { name: string; text: string }[]
      client?: string
      narrate?: boolean
    }
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") as typeof body
    } catch {
      send(res, 400, { error: "body is not JSON" })
      return
    }
    try {
      const out = await runClaimRecord({
        subject: body.subject ?? "",
        claim: body.claim ?? [],
        record: body.record ?? [],
        client: clientNamed(body.client ?? "anthropic"),
        narrate: body.narrate === true,
      })
      send(res, 200, { result: out.result, narrative: out.narrative ?? null })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const status = err instanceof UploadError ? 400 : 500
      send(res, status, { error: message })
    }
  })
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  createApp().listen(PORT, HOST, () => {
    console.error(`claim-record http://${HOST}:${PORT}`)
  })
}
