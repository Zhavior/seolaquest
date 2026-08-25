import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { QuestPending, QuestRoutePending } from './QuestPending'

describe('QuestPending', () => {
  it('announces streamed content without drawing placeholder panels', () => {
    const { container } = render(<QuestPending label="Loading quests" />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading quests')
    expect(container.innerHTML).not.toContain('border')
    expect(container.innerHTML).not.toContain('shadow')
  })

  it('provides the same quiet status inside the route shell', () => {
    const { container } = render(<QuestRoutePending label="Opening Guild Hall" />)

    expect(screen.getByRole('status')).toHaveTextContent('Opening Guild Hall')
    expect(container.innerHTML).not.toContain('border')
    expect(container.innerHTML).not.toContain('shadow')
  })
})
