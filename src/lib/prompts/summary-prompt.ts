interface MarkInput {
  text: string
  comment?: string
}

interface SummaryPromptInput {
  title: string
  author?: string
  redMarks: MarkInput[]
  blueMarks: MarkInput[]
  greenMarks: MarkInput[]
}

/** AI要約生成のプロンプトを組み立てる */
export function buildSummaryPrompt(input: SummaryPromptInput): string {
  const formatMarks = (marks: MarkInput[]) =>
    marks.length === 0
      ? '（なし）'
      : marks.map((m, i) => `${i + 1}. ${m.text}${m.comment ? `（メモ: ${m.comment}）` : ''}`).join('\n')

  const allComments = [...input.redMarks, ...input.blueMarks, ...input.greenMarks]
    .filter((m) => m.comment)
    .map((m) => m.comment)
    .join(' / ') || '（なし）'

  return `あなたは読書メモの整理アシスタントです。
以下はユーザーが３色ボールペン方式でマーキングしたテキストです。

【ルール】
🔴 赤 = 客観的に最も重要な箇所
🔵 青 = 客観的にまあ重要な箇所
🟢 緑 = ユーザーが主観的に面白いと感じた箇所

【コンテンツ情報】
タイトル: ${input.title}
著者: ${input.author ?? '不明'}

【赤マーク（${input.redMarks.length}件）】
${formatMarks(input.redMarks)}

【青マーク（${input.blueMarks.length}件）】
${formatMarks(input.blueMarks)}

【緑マーク（${input.greenMarks.length}件）】
${formatMarks(input.greenMarks)}

【ユーザーのコメント】
${allComments}

以下の形式で **JSON のみ** を出力してください（前後の説明文や \`\`\`json 等のマークダウン記法は不要）。日本語で出力してください。

{
  "red_summary": "赤マークの要点まとめ（200字以内）",
  "blue_summary": "青マークの要点まとめ（200字以内）",
  "green_summary": "緑マークから読み取れるユーザーの関心・気づき（200字以内）",
  "overall": "このコンテンツ全体を通じた学びの総括（300字以内）",
  "key_insight": "最も重要な一文（50字以内）"
}`
}
