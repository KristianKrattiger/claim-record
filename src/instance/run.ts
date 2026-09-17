import { assay } from "../assay/index.js"
import type { ProposalClient } from "../assay/cartographer/propose.js"
import type { AssayResult, PinnedCorpus } from "../assay/types.js"
import { ALLOWED_EXT, extensionOf, pinCorpus, type Upload } from "./pin.js"
import { claimRecord } from "./profile.js"
import { narrate, type Narrative } from "../narrator/narrate.js"

export class UploadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UploadError"
  }
}

export interface RunInput {
  subject: string
  claim: { name: string; text: string }[]
  record: { name: string; text: string }[]
  client: ProposalClient
  narrate?: boolean
}

export interface RunOutput {
  result: AssayResult
  corpus: PinnedCorpus
  narrative?: Narrative
}

function files(list: { name: string; text: string }[], role: Upload["role"]): Upload[] {
  return list.map((f) => {
    if (!ALLOWED_EXT.has(extensionOf(f.name))) {
      throw new UploadError(`only .txt and .md files: ${f.name}`)
    }
    return { name: f.name, text: f.text, role }
  })
}

export async function runClaimRecord(input: RunInput): Promise<RunOutput> {
  const subject = input.subject.trim()
  if (!subject) throw new UploadError("subject is required")
  const uploads = [...files(input.claim, "claimant"), ...files(input.record, "independent")]
  const corpus = pinCorpus(uploads, subject)
  const result = await assay(corpus, { subject }, {
    client: input.client,
    profile: claimRecord("frontier"),
    runs: 1,
    // More files → more independent chunks, so a 10-opinion record pile is not
    // squeezed into the same 40-slot budget as a two-file uptime fixture.
    candidates: Math.max(40, 8 * uploads.length),
  })
  if (!input.narrate || result.outcome !== "ledger") return { result, corpus }
  return { result, corpus, narrative: narrate(result, corpus) }
}
