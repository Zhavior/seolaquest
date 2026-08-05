import { fireEvent, render, screen } from '@testing-library/react'
import { Trophy } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { ProfileCodex } from './ProfileCodex'

describe('ProfileCodex touch targets', () => {
  it('gives every action a target at least 44 CSS pixels high', () => {
    render(
      <ProfileCodex
        posts={[{ id: 'post-1', content: '[WIN] Interview booked', createdAt: '2026-08-01T12:00:00.000Z' }]}
        content="Ready to publish"
        setContent={vi.fn()}
        selectedTag="[WIN]"
        setSelectedTag={vi.fn()}
        notice=""
        slashedPosts={{}}
        pinnedPosts={{}}
        commentsMap={{}}
        commentInputs={{}}
        setCommentInputs={vi.fn()}
        openCommentBoxes={{}}
        user={{ name: 'Boyd', title: 'Hunter', level: 1 }}
        getSlashCount={() => 0}
        handleSlash={vi.fn()}
        handleTogglePin={vi.fn()}
        handleToggleCommentBox={vi.fn()}
        handleAddComment={vi.fn()}
        createPost={vi.fn()}
        deletePost={vi.fn()}
        pending={false}
        parsePostContent={() => ({ tag: '[WIN]', body: 'Interview booked' })}
        CARD_COLORS={['bg-card']}
        CATEGORY_TAGS={[{
          id: 'win',
          tag: '[WIN]',
          label: 'Win',
          icon: Trophy,
          bgColor: 'bg-lime-300',
          textColor: 'text-ink',
          desc: 'A win',
        }]}
      />,
    )

    expect(screen.getByRole('button', { name: 'Win' })).toHaveClass('min-h-11')
    expect(screen.getByRole('button', { name: /publish log/i })).toHaveClass('min-h-11')
    expect(screen.getByRole('button', { name: /delete log 1/i })).toHaveClass('h-11', 'w-11')
    expect(screen.getByRole('button', { name: /slash/i })).toHaveClass('min-h-11')
    expect(screen.getByRole('button', { name: /guild chat/i })).toHaveClass('min-h-11')
    expect(screen.getByRole('button', { name: /^pin$/i })).toHaveClass('min-h-11')
  })

  it('sizes the comment input and reply action after comments open', () => {
    const handleToggleCommentBox = vi.fn()
    const { rerender } = render(
      <ProfileCodex
        posts={[{ id: 'post-1', content: 'Interview booked', createdAt: '2026-08-01T12:00:00.000Z' }]}
        content=""
        setContent={vi.fn()}
        selectedTag="[WIN]"
        setSelectedTag={vi.fn()}
        notice=""
        slashedPosts={{}}
        pinnedPosts={{}}
        commentsMap={{}}
        commentInputs={{}}
        setCommentInputs={vi.fn()}
        openCommentBoxes={{}}
        user={{ name: 'Boyd', title: 'Hunter', level: 1 }}
        getSlashCount={() => 0}
        handleSlash={vi.fn()}
        handleTogglePin={vi.fn()}
        handleToggleCommentBox={handleToggleCommentBox}
        handleAddComment={vi.fn()}
        createPost={vi.fn()}
        deletePost={vi.fn()}
        pending={false}
        parsePostContent={() => ({ tag: null, body: 'Interview booked' })}
        CARD_COLORS={['bg-card']}
        CATEGORY_TAGS={[]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /guild chat/i }))
    expect(handleToggleCommentBox).toHaveBeenCalledWith('post-1')

    rerender(
      <ProfileCodex
        posts={[{ id: 'post-1', content: 'Interview booked', createdAt: '2026-08-01T12:00:00.000Z' }]}
        content=""
        setContent={vi.fn()}
        selectedTag="[WIN]"
        setSelectedTag={vi.fn()}
        notice=""
        slashedPosts={{}}
        pinnedPosts={{}}
        commentsMap={{}}
        commentInputs={{}}
        setCommentInputs={vi.fn()}
        openCommentBoxes={{ 'post-1': true }}
        user={{ name: 'Boyd', title: 'Hunter', level: 1 }}
        getSlashCount={() => 0}
        handleSlash={vi.fn()}
        handleTogglePin={vi.fn()}
        handleToggleCommentBox={handleToggleCommentBox}
        handleAddComment={vi.fn()}
        createPost={vi.fn()}
        deletePost={vi.fn()}
        pending={false}
        parsePostContent={() => ({ tag: null, body: 'Interview booked' })}
        CARD_COLORS={['bg-card']}
        CATEGORY_TAGS={[]}
      />,
    )

    expect(screen.getByRole('textbox', { name: /write a response/i })).toHaveClass('min-h-11')
    expect(screen.getByRole('button', { name: /reply/i })).toHaveClass('min-h-11')
  })
})
