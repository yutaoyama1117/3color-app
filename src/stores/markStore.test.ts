import { describe, it, expect, beforeEach } from 'vitest'
import { useMarkStore } from './markStore'

// 各テスト前にstoreをリセット
beforeEach(() => {
  useMarkStore.setState({ marks: [] })
})

describe('markStore', () => {
  describe('addMark', () => {
    it('マークを追加するとstateに反映される', () => {
      const { addMark } = useMarkStore.getState()
      addMark({
        contentId: 'content-1',
        color: 'red',
        markedText: '重要な一文',
        charOffsetStart: 0,
        charOffsetEnd: 5,
      })

      const { marks } = useMarkStore.getState()
      expect(marks).toHaveLength(1)
      expect(marks[0].color).toBe('red')
      expect(marks[0].markedText).toBe('重要な一文')
      expect(marks[0].contentId).toBe('content-1')
    })

    it('複数マークを追加できる', () => {
      const { addMark } = useMarkStore.getState()
      addMark({ contentId: 'c1', color: 'red', markedText: 'A', charOffsetStart: 0, charOffsetEnd: 1 })
      addMark({ contentId: 'c1', color: 'blue', markedText: 'B', charOffsetStart: 2, charOffsetEnd: 3 })
      addMark({ contentId: 'c1', color: 'green', markedText: 'C', charOffsetStart: 4, charOffsetEnd: 5 })

      expect(useMarkStore.getState().marks).toHaveLength(3)
    })
  })

  describe('removeMark', () => {
    it('指定IDのマークが削除される', () => {
      const { addMark } = useMarkStore.getState()
      addMark({ contentId: 'c1', color: 'red', markedText: 'テスト', charOffsetStart: 0, charOffsetEnd: 3 })

      const added = useMarkStore.getState().marks[0]
      useMarkStore.getState().removeMark(added.id)

      expect(useMarkStore.getState().marks).toHaveLength(0)
    })

    it('存在しないIDを削除しても他のマークは影響を受けない', () => {
      const { addMark } = useMarkStore.getState()
      addMark({ contentId: 'c1', color: 'blue', markedText: 'テスト', charOffsetStart: 0, charOffsetEnd: 3 })

      useMarkStore.getState().removeMark('non-existent-id')

      expect(useMarkStore.getState().marks).toHaveLength(1)
    })
  })

  describe('updateMarkColor', () => {
    it('マークの色を変更できる', () => {
      const { addMark, updateMarkColor } = useMarkStore.getState()
      addMark({ contentId: 'c1', color: 'red', markedText: 'テスト', charOffsetStart: 0, charOffsetEnd: 3 })

      const id = useMarkStore.getState().marks[0].id
      updateMarkColor(id, 'green')

      expect(useMarkStore.getState().marks[0].color).toBe('green')
    })
  })

  describe('updateMarkComment', () => {
    it('コメントを追加・更新できる', () => {
      const { addMark, updateMarkComment } = useMarkStore.getState()
      addMark({ contentId: 'c1', color: 'green', markedText: 'テスト', charOffsetStart: 0, charOffsetEnd: 3 })

      const id = useMarkStore.getState().marks[0].id
      updateMarkComment(id, '面白い発見')

      expect(useMarkStore.getState().marks[0].comment).toBe('面白い発見')
    })
  })
})
