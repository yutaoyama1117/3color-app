import type { MarkData } from '@/types/mark'

export const DEMO_CONTENT_ID = 'demo-content-1'

export const DEMO_BODY_TEXT = `読書とは単に文字を追う行為ではなく、著者との対話である。優れた読書家は、行間に潜む意図を読み取り、自分の経験と結びつけながら理解を深めていく。

３色ボールペンを使った読書法では、赤・青・緑の３色が異なる役割を担う。赤は客観的に見て最も重要な箇所、青はまあ重要な箇所、そして緑は主観的に面白いと感じた箇所に使う。

この方法の核心は「主観と客観を区別すること」にある。赤と青は客観的重要度の判断、緑は自分固有の感性の記録だ。この区別が、読書を単なるインプットから能動的な思考へと変える。

アウトプットを前提とした読書は、記憶の定着率を大幅に高める。人に説明することを想定しながら読むだけで、理解の深さが変わってくる。`

/** デモ用のサンプルマークデータ */
export const DEMO_MARKS: MarkData[] = [
  {
    id: 'mark-1',
    contentId: DEMO_CONTENT_ID,
    color: 'red',
    markedText: '著者との対話',
    charOffsetStart: 18,
    charOffsetEnd: 24,
    createdAt: new Date('2026-05-01'),
  },
  {
    id: 'mark-2',
    contentId: DEMO_CONTENT_ID,
    color: 'blue',
    markedText: '行間に潜む意図を読み取り',
    charOffsetStart: 33,
    charOffsetEnd: 44,
    comment: '批判的読解の基本',
    createdAt: new Date('2026-05-01'),
  },
  {
    id: 'mark-3',
    contentId: DEMO_CONTENT_ID,
    color: 'green',
    markedText: '主観と客観を区別すること',
    charOffsetStart: 182,
    charOffsetEnd: 193,
    comment: '自分の読書に足りていない視点',
    createdAt: new Date('2026-05-02'),
  },
]
