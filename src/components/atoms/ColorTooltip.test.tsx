import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { ColorTooltip } from './ColorTooltip'

const DEFAULT_PROPS = {
  position: { x: 200, y: 100 },
  selectedText: 'テスト文章',
  onColorSelect: vi.fn(),
  onClose: vi.fn(),
}

describe('ColorTooltip', () => {
  it('３つの色ボタンが表示される', () => {
    render(<ColorTooltip {...DEFAULT_PROPS} />)

    expect(screen.getByRole('button', { name: /redマーク/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /blueマーク/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /greenマーク/ })).toBeInTheDocument()
  })

  it('選択テキストのプレビューが表示される', () => {
    render(<ColorTooltip {...DEFAULT_PROPS} />)
    expect(screen.getByText(/テスト文章/)).toBeInTheDocument()
  })

  it('赤ボタンをクリックすると onColorSelect("red") が呼ばれる', async () => {
    const onColorSelect = vi.fn()
    render(<ColorTooltip {...DEFAULT_PROPS} onColorSelect={onColorSelect} />)

    await userEvent.click(screen.getByRole('button', { name: /redマーク/ }))

    expect(onColorSelect).toHaveBeenCalledWith('red')
  })

  it('青ボタンをクリックすると onColorSelect("blue") が呼ばれる', async () => {
    const onColorSelect = vi.fn()
    render(<ColorTooltip {...DEFAULT_PROPS} onColorSelect={onColorSelect} />)

    await userEvent.click(screen.getByRole('button', { name: /blueマーク/ }))

    expect(onColorSelect).toHaveBeenCalledWith('blue')
  })

  it('緑ボタンをクリックすると onColorSelect("green") が呼ばれる', async () => {
    const onColorSelect = vi.fn()
    render(<ColorTooltip {...DEFAULT_PROPS} onColorSelect={onColorSelect} />)

    await userEvent.click(screen.getByRole('button', { name: /greenマーク/ }))

    expect(onColorSelect).toHaveBeenCalledWith('green')
  })
})
