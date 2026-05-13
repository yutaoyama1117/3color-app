import Anthropic from '@anthropic-ai/sdk'

let cached: Anthropic | null = null

/** Anthropic SDK インスタンスを取得（lazy init） */
export function getClaudeClient(): Anthropic {
  if (cached) return cached
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY が設定されていません')
  cached = new Anthropic({ apiKey })
  return cached
}

/** プロンプトを送信してテキスト応答を取得する */
export async function sendPrompt(prompt: string, maxTokens = 2000): Promise<string> {
  const client = getClaudeClient()
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })

  const textBlock = response.content.find((c) => c.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude からの応答が空でした')
  }
  return textBlock.text
}
