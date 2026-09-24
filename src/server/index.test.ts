import { afterEach, describe, expect, it } from "vitest"
import type { AddressInfo } from "node:net"
import { createApp } from "./index.js"

describe("createApp", () => {
  let server: ReturnType<typeof createApp> | undefined
  afterEach(() => new Promise<void>((resolve) => { server?.close(() => resolve()); server = undefined }))

  it("serves the UI with Narrate off by default", async () => {
    server = createApp()
    await new Promise<void>((r) => server!.listen(0, "127.0.0.1", r))
    const { port } = server.address() as AddressInfo
    const html = await (await fetch(`http://127.0.0.1:${port}/`)).text()
    expect(html).toContain("Claim / Record")
    expect(html).toContain("Not legal advice")
    expect(html).toContain("id=\"narrate\"")
    expect(html).not.toMatch(/id="narrate"[^>]*checked/)
    expect(html).toContain("context_unverified")
    expect(html).not.toMatch(/id="subject"[^>]*value="uptime"/)
    expect(html).toMatch(/id="subject"[^>]*value=""/)
    expect(html).toContain("must appear in the quotes")
    expect(html).toContain('from "./audit.js"')
  })

  it("serves the audit renderer the page imports", async () => {
    server = createApp()
    await new Promise<void>((r) => server!.listen(0, "127.0.0.1", r))
    const { port } = server.address() as AddressInfo
    const res = await fetch(`http://127.0.0.1:${port}/audit.js`)
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toContain("text/javascript")
    expect(await res.text()).toContain("export function formatAudit")
  })

  it("returns 400 for an empty subject", async () => {
    server = createApp()
    await new Promise<void>((r) => server!.listen(0, "127.0.0.1", r))
    const { port } = server.address() as AddressInfo
    const res = await fetch(`http://127.0.0.1:${port}/assay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: "", claim: [], record: [] }),
    })
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toBe("subject is required")
  })
})
