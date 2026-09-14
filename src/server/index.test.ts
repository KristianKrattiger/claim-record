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
    expect(html).toContain("claimantCovered")
  })
})
