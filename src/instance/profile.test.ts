import { describe, expect, it } from "vitest"
import { claimRecord } from "./profile.js"

describe("claimRecord", () => {
  it("returns the same profile for both prompt tiers (one prompt serves both, for now)", () => {
    expect(claimRecord("frontier")).toEqual(claimRecord("small"))
  })
})
