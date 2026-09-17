import type { FieldProfile } from "../assay/types.js"
import { CLAIM_RECORD_SYSTEM } from "./prompt.js"

/**
 * Claim/Record: a party's checkable statements against a pile of opinions.
 *
 * The lexicon is the one the engine shipped until the field profile existed,
 * moved here verbatim minus the trailing-question-mark rule, which the engine
 * keeps as structure. Retrieval mixes claimant terms into the query because
 * "10(b)" tokenizes to nothing distinctive, and pins document ends because
 * holdings sit at the ends of opinions.
 */
export type PromptTier = "frontier" | "small"

// Claim/Record has one prompt; both tiers return it until a small-model
// prompt is written. The tier exists so the two instances present the same
// shape.
export function claimRecord(tier: PromptTier): FieldProfile {
  void tier
  return {
    name: "claim-record",
    system: CLAIM_RECORD_SYSTEM,
    lexicon: {
      holding: /\bwe hold\b|\bheld:|\bwe conclude\b|\bwe reverse\b/i,
      issue: new RegExp(
        [
          String.raw`\bgranted certiorari\b`,
          String.raw`\bquestion presented\b`,
          String.raw`\bpetition for (?:a )?writ of certiorari\b`,
          String.raw`\bwe (?:must |now )?(?:decide|consider|resolve|determine) whether\b`,
          String.raw`\bthis case (?:requires us to consider|presents the question)\b`,
          String.raw`\bto resolve (?:the )?(?:question|conflict|issue)\b`,
          String.raw`\bthe (?:question|issue)(?: in this case| before (?:us|the court)| presented)? is whether\b`,
          String.raw`\bwhether .{0,80} will lie\b`,
          String.raw`^["“']?whether\b`,
        ].join("|"),
        "i",
      ),
      argument: /\bpetitioner argues\b|\brespondent (?:argues|contends)\b|\bsome courts have held\b|\bthe court below\b/i,
    },
    retrieval: { queryTerms: "subject+claimant", pinEnds: true },
  }
}
