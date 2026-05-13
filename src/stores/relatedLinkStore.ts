import { create } from 'zustand'

export interface RelatedLink {
  id: string
  fromMarkId: string
  toMarkId: string
  linkType: 'ai_suggested' | 'user_defined'
  similarity?: number
  acceptedAt?: Date
  createdAt: Date
}

interface RelatedLinkStore {
  links: RelatedLink[]
  /** マーク間の関連リンクを追加（重複チェックあり） */
  addLink: (input: {
    fromMarkId: string
    toMarkId: string
    linkType: 'ai_suggested' | 'user_defined'
    similarity?: number
  }) => string
  /** 特定マークから出ているリンクを取得 */
  getLinksFrom: (markId: string) => RelatedLink[]
  /** 既にリンクされているかチェック */
  isLinked: (fromMarkId: string, toMarkId: string) => boolean
}

export const useRelatedLinkStore = create<RelatedLinkStore>((set, get) => ({
  links: [],

  addLink: (input) => {
    if (get().isLinked(input.fromMarkId, input.toMarkId)) {
      return get().links.find(
        (l) => l.fromMarkId === input.fromMarkId && l.toMarkId === input.toMarkId,
      )!.id
    }
    const id = `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const link: RelatedLink = {
      id,
      ...input,
      acceptedAt: new Date(),
      createdAt: new Date(),
    }
    set((state) => ({ links: [link, ...state.links] }))
    return id
  },

  getLinksFrom: (markId) => get().links.filter((l) => l.fromMarkId === markId),

  isLinked: (fromMarkId, toMarkId) =>
    get().links.some(
      (l) =>
        (l.fromMarkId === fromMarkId && l.toMarkId === toMarkId) ||
        (l.fromMarkId === toMarkId && l.toMarkId === fromMarkId),
    ),
}))
