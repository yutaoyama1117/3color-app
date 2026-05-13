import type { ContentData } from '@/types/content'

export const DEMO_CONTENTS: ContentData[] = [
  {
    id: 'content-1',
    userId: 'demo-user',
    type: 'book',
    status: 'ready',
    title: '三色ボールペンで読む日本語',
    author: '齋藤 孝',
    bodyText: `読書とは単に文字を追う行為ではなく、著者との対話である。優れた読書家は、行間に潜む意図を読み取り、自分の経験と結びつけながら理解を深めていく。

３色ボールペンを使った読書法では、赤・青・緑の３色が異なる役割を担う。赤は客観的に見て最も重要な箇所、青はまあ重要な箇所、そして緑は主観的に面白いと感じた箇所に使う。

この方法の核心は「主観と客観を区別すること」にある。赤と青は客観的重要度の判断、緑は自分固有の感性の記録だ。この区別が、読書を単なるインプットから能動的な思考へと変える。

アウトプットを前提とした読書は、記憶の定着率を大幅に高める。人に説明することを想定しながら読むだけで、理解の深さが変わってくる。`,
    createdAt: new Date('2026-05-01'),
    updatedAt: new Date('2026-05-10'),
    lastMarkedAt: new Date('2026-05-10'),
    markCounts: { red: 3, blue: 5, green: 4 },
  },
  {
    id: 'content-2',
    userId: 'demo-user',
    type: 'web',
    status: 'ready',
    title: 'なぜ「書くこと」が思考を深めるのか',
    sourceUrl: 'https://example.com/writing-deepens-thinking',
    bodyText: `書くという行為は、単なるアウトプットではなく、思考そのものを形成する。頭の中で漠然としていたアイデアが、言葉として書き出された瞬間、具体的な輪郭を持ち始める。

ライティングの研究者たちは長年、書くことと考えることの関係を調査してきた。その結論は明快だ。書くことは思考を記録するのではなく、思考を生み出す。

特に効果的なのは「書きながら考える」アプローチだ。完成した考えを書くのではなく、不完全な思考を書き出しながら整理していく。`,
    createdAt: new Date('2026-05-05'),
    updatedAt: new Date('2026-05-08'),
    lastMarkedAt: new Date('2026-05-08'),
    markCounts: { red: 1, blue: 3, green: 6 },
  },
  {
    id: 'content-3',
    userId: 'demo-user',
    type: 'book',
    status: 'ready',
    title: 'FACTFULNESS',
    author: 'ハンス・ロスリング',
    bodyText: `私たちの世界認識は、驚くほど現実とかけ離れている。貧困・疾病・教育・環境など、あらゆる指標において、人々は実際よりも世界を悲観的に見ている。

本書が示すのは「ファクトフルネス」、つまり事実に基づいて世界を見る習慣だ。感情や本能的な偏見に流されず、データを冷静に読む力が今こそ必要とされている。

世界は少しずつ、しかし確実に良くなっている。この事実を知ることが、適切な行動への第一歩となる。`,
    createdAt: new Date('2026-04-20'),
    updatedAt: new Date('2026-04-28'),
    markCounts: { red: 2, blue: 4, green: 2 },
  },
]
