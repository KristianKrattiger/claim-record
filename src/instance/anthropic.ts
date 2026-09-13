import Anthropic from "@anthropic-ai/sdk"
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod"
import type { ProposalClient } from "../assay/cartographer/propose.js"
import { ProposalBatchSchema } from "../assay/cartographer/schema.js"

export const MODEL = process.env["ANTHROPIC_MODEL"] ?? "claude-opus-5"

export function anthropicClient(): ProposalClient {
  const workspaceId = process.env["ANTHROPIC_WORKSPACE_ID"]
  const sdk = new Anthropic(
    workspaceId ? { defaultHeaders: { "anthropic-workspace-id": workspaceId } } : {},
  )
  return {
    async propose({ system, user }) {
      const response = await sdk.beta.messages.parse({
        model: MODEL,
        max_tokens: 16000,
        system,
        messages: [{ role: "user", content: user }],
        output_format: betaZodOutputFormat(ProposalBatchSchema),
      })
      if (response.stop_reason === "refusal") {
        throw new Error("proposer: model declined")
      }
      const parsed = response.parsed_output
      if (!parsed) throw new Error("proposer: structured output failed to parse")
      return { proposals: parsed.proposals, stopReason: response.stop_reason }
    },
  }
}
