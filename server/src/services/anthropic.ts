import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ExtractedBenefit {
  name: string
  total_amount: number | null
  category_group: string | null
  category_group_total: number | null
  notes: string | null
}

const SYSTEM_PROMPT = `You are a benefits extraction specialist. Your job is to read employer benefit documents and extract every distinct benefit category with its dollar limit.

Some items share a combined dollar limit under a parent category (e.g. "Paramedical Services" covers Massage Therapy, Chiropractic, Physiotherapy, etc. with one shared $500 limit). When this is the case, set "category_group" to the parent category name and "category_group_total" to the shared dollar limit for ALL sub-items in that group.

Return ONLY valid JSON — an array of objects with these exact keys:
- "name": string — the specific benefit name (e.g. "Registered Massage Therapy", "Physiotherapy", "Dietitian")
- "total_amount": number or null — the individual dollar limit for this item only (null if it shares a group limit)
- "category_group": string or null — the parent category name if this item shares a combined limit (e.g. "Paramedical Services"), otherwise null
- "category_group_total": number or null — the combined dollar limit shared across all items in the group, otherwise null
- "notes": string or null — any important usage notes (e.g. "per visit maximum $80", "requires referral", "unlimited virtual visits")

Be thorough: extract ALL benefit line items, not just the major ones. Do not include explanatory text outside the JSON array.`

export async function analyzeDocument(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<ExtractedBenefit[]> {
  const base64 = fileBuffer.toString('base64')

  const isImage = mimeType.startsWith('image/')
  const isPdf = mimeType === 'application/pdf'

  if (!isImage && !isPdf) {
    throw new Error(`Unsupported file type: ${mimeType}`)
  }

  let content: Anthropic.MessageParam['content']

  if (isPdf) {
    content = [
      {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: base64,
        },
      } as Anthropic.DocumentBlockParam,
      {
        type: 'text',
        text: 'Extract all benefit categories and their annual dollar limits from this document. Return only the JSON array as described.',
      },
    ]
  } else {
    content = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: base64,
        },
      },
      {
        type: 'text',
        text: 'Extract all benefit categories and their annual dollar limits from this document. Return only the JSON array as described.',
      },
    ]
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  })

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as Anthropic.TextBlock).text)
    .join('')

  console.log('Anthropic raw response (first 500 chars):', text.slice(0, 500))
  console.log('Stop reason:', response.stop_reason)

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    // Last-resort: try to extract a JSON array from the text
    const match = cleaned.match(/\[[\s\S]*\]/)
    if (!match) {
      console.error('Full Anthropic response:', text)
      throw new Error('Anthropic response did not contain valid JSON')
    }
    parsed = JSON.parse(match[0])
  }

  if (!Array.isArray(parsed)) throw new Error('Expected a JSON array from Anthropic')

  return (parsed as ExtractedBenefit[]).map((item) => ({
    name: String(item.name ?? 'Unknown benefit'),
    total_amount: item.total_amount != null ? Number(item.total_amount) : null,
    category_group: item.category_group != null ? String(item.category_group) : null,
    category_group_total: item.category_group_total != null ? Number(item.category_group_total) : null,
    notes: item.notes != null ? String(item.notes) : null,
  }))
}
