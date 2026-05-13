import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { TextRenderer, buildSegments } from './TextRenderer'
import type { MarkData } from '@/types/mark'

const SAMPLE_TEXT = '読書とは著者との対話である。優れた読書家は行間を読む。'

const MARKS: MarkData[] = [
  {
    id: 'm1',
    contentId: 'c1',
    color: 'red',
    markedText: '著者との対話',
    charOffsetStart: 4,
    charOffsetEnd: 10,
    createdAt: new Date(),
  },
  {
    id: 'm2',
    contentId: 'c1',
    color: 'blue',
    markedText: '行間を読む',
    charOffsetStart: 21,
    charOffsetEnd: 26,
    createdAt: new Date(),
  },
]

describe('buildSegments', () => {
  it('マークなしの場合はプレーンテキスト1セグメントになる', () => {
    const segments = buildSegments('テスト', [])
    expect(segments).toHaveLength(1)
    expect(segments[0].type).toBe('plain')
    expect(segments[0].text).toBe('テスト')
  })

  it('マーク箇所が正しく分割される', () => {
    const segments = buildSegments(SAMPLE_TEXT, MARKS)

    const markedSegments = segments.filter((s) => s.type === 'marked')
    expect(markedSegments).toHaveLength(2)
    expect(markedSegments[0].text).toBe('著者との対話')
    expect(markedSegments[1].text).toBe('行間を読む')
  })

  it('先頭マーク前のプレーンテキストが生成される', () => {
    const segments = buildSegments(SAMPLE_TEXT, MARKS)
    expect(segments[0].type).toBe('plain')
    expect(segments[0].text).toBe('読書とは')
  })

  it('末尾マーク後のプレーンテキストが生成される', () => {
    const segments = buildSegments(SAMPLE_TEXT, MARKS)
    const last = segments[segments.length - 1]
    expect(last.type).toBe('plain')
    expect(last.text).toBe('。')
  })
})

describe('TextRenderer', () => {
  it('マーク箇所に data-color 属性が付与される', () => {
    render(<TextRenderer text={SAMPLE_TEXT} marks={MARKS} onMarkClick={vi.fn()} />)

    const redMark = document.querySelector('[data-color="red"]')
    const blueMark = document.querySelector('[data-color="blue"]')
    expect(redMark).toBeInTheDocument()
    expect(blueMark).toBeInTheDocument()
  })

  it('マークをクリックすると onMarkClick が正しいIDで呼ばれる', async () => {
    const onMarkClick = vi.fn()
    render(<TextRenderer text={SAMPLE_TEXT} marks={MARKS} onMarkClick={onMarkClick} />)

    const mark = screen.getByRole('button', { name: /redマーク/ })
    await userEvent.click(mark)

    expect(onMarkClick).toHaveBeenCalledWith('m1')
  })
})
