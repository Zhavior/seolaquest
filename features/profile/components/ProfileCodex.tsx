import { motion, AnimatePresence } from 'framer-motion'
import { Scroll, MessageSquare, Flame, Send, Award, Pin, Trash2, Swords, MessageCircle, Sparkles } from 'lucide-react'
import { ProfilePost } from '@/features/profile/types'
import type { LucideIcon } from 'lucide-react'

type ProfileCodexProps = {
  posts: ProfilePost[]
  content: string
  setContent: (val: string) => void
  selectedTag: string
  setSelectedTag: (val: string) => void
  notice: string
  slashedPosts: Record<string, boolean>
  pinnedPosts: Record<string, boolean>
  commentsMap: Record<string, string[]>
  commentInputs: Record<string, string>
  setCommentInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>
  openCommentBoxes: Record<string, boolean>
  user: { name: string; title: string; level: number }
  getSlashCount: (id: string, index: number) => number
  handleSlash: (id: string, index: number) => void
  handleTogglePin: (id: string) => void
  handleToggleCommentBox: (id: string) => void
  handleAddComment: (id: string) => void
  createPost: () => void
  deletePost: (id: string) => void
  pending: boolean
  parsePostContent: (rawContent: string) => { tag: string | null; body: string }
  CARD_COLORS: string[]
  CATEGORY_TAGS: {
    id: string
    tag: string
    label: string
    icon: LucideIcon
    bgColor: string
    textColor: string
    desc: string
  }[]
}

export function ProfileCodex({
  posts,
  content,
  setContent,
  selectedTag,
  setSelectedTag,
  notice,
  slashedPosts,
  pinnedPosts,
  commentsMap,
  commentInputs,
  setCommentInputs,
  openCommentBoxes,
  user,
  getSlashCount,
  handleSlash,
  handleTogglePin,
  handleToggleCommentBox,
  handleAddComment,
  createPost,
  deletePost,
  pending,
  parsePostContent,
  CARD_COLORS,
  CATEGORY_TAGS
}: ProfileCodexProps) {
  return (
    <div className="bg-card border-4 border-outline shadow-brutal-lg p-6 space-y-6">
      <div className="flex justify-between items-center border-b-4 border-outline pb-4">
        <div className="flex items-center gap-2">
          <Scroll className="w-7 h-7 text-[#06B6D4]" />
          <h2 className="text-2xl font-black uppercase tracking-tight">THE HUNTER&apos;S CODEX</h2>
        </div>
        <span className="bg-black text-white border-2 border-outline px-2.5 py-1 text-xs font-black shadow-brutal-sm">
          {posts.length} {posts.length === 1 ? 'LOG' : 'LOGS'}
        </span>
      </div>

      {/* New Progress Note Creator Form */}
      <div className="border-4 border-outline bg-inset p-4 space-y-4 shadow-brutal">
        <div className="flex items-center justify-between">
          <label htmlFor="progress-log-content" className="font-black uppercase text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> CREATE PROGRESS LOG
          </label>
          <span className="bg-accent text-on-accent border border-outline text-xs font-black px-2 py-0.5 flex items-center gap-1">
            <Flame className="w-3 h-3 text-red-500 fill-current" /> +25 XP PER LOG
          </span>
        </div>

        {/* Tag Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CATEGORY_TAGS.map((cat) => {
            const Icon = cat.icon
            const isSelected = selectedTag === cat.tag
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedTag(cat.tag)}
                className={`flex min-h-11 items-center justify-center gap-1.5 border-2 border-outline p-2 text-xs font-black uppercase shadow-brutal-sm transition-all ${
                  isSelected 
                    ? `${cat.bgColor} ${cat.textColor} ring-2 ring-black` 
                    : 'bg-card text-ink hover:bg-inset'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>

        {/* Textarea */}
        <textarea 
          id="progress-log-content"
          aria-describedby="progress-log-count"
          value={content} 
          onChange={(event) => setContent(event.target.value)} 
          maxLength={500} 
          className="w-full min-h-[100px] border-3 border-outline bg-card p-3 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-black resize-y" 
          placeholder="What milestone or conquest did you complete today?" 
        />

        <div className="flex items-center justify-between">
          <span id="progress-log-count" className="text-xs font-black text-ink-muted">
            {content.length} / 500 CHARACTERS
          </span>

          <button 
            type="button" 
            onClick={createPost} 
            disabled={pending || !content.trim()} 
            className="flex min-h-11 items-center gap-2 border-3 border-outline bg-success px-4 py-2 text-sm font-black uppercase shadow-brutal-sm transition-all hover:bg-lime-400 active:translate-x-0.5 active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> PUBLISH LOG
          </button>
        </div>

        {notice && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            className="border-2 border-outline bg-[#A855F7] text-white p-2.5 font-black uppercase text-xs shadow-brutal-sm"
          >
            {notice}
          </motion.div>
        )}
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post, index) => {
          const colorClass = CARD_COLORS[index % CARD_COLORS.length]
          const { tag, body } = parsePostContent(post.content)
          const isPinned = pinnedPosts[post.id]
          const slashCount = getSlashCount(post.id, index)
          const isSlashed = slashedPosts[post.id]
          const postComments = commentsMap[post.id] || []
          const isCommentOpen = openCommentBoxes[post.id]

          const displayBadge = tag ? tag : `📜 LOG #${posts.length - index}`

          return (
            <motion.article 
              layout
              key={post.id} 
              className={`border-4 border-outline ${colorClass} p-5 shadow-brutal-lg transition-all relative ${
                isPinned ? 'ring-4 ring-black ring-offset-2' : ''
              }`}
            >
              {/* Header Row */}
              <div className="flex items-start justify-between gap-3 border-b-3 border-outline pb-3 mb-3 bg-white/90 p-2.5 border-2 border-outline">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-sm uppercase tracking-tight text-ink bg-card px-2 py-0.5 border border-outline shadow-brutal-sm">
                    {user.name}
                  </span>

                  <span className="font-black text-xs uppercase text-on-accent bg-accent px-2 py-0.5 border border-outline shadow-brutal-sm flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> {displayBadge}
                  </span>

                  {isPinned && (
                    <span className="font-black text-xs uppercase text-white bg-black px-2 py-0.5 border border-outline flex items-center gap-1 shadow-brutal-sm">
                      <Pin className="w-3 h-3 rotate-45" /> PINNED
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase text-ink bg-card px-2 py-0.5 border border-outline hidden sm:inline-block">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>

                  <button 
                    type="button" 
                    onClick={() => deletePost(post.id)} 
                    disabled={pending} 
                    aria-label={`Delete log ${index + 1}`}
                    className="flex h-11 w-11 items-center justify-center text-ink transition-colors hover:text-red-600" 
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Paper Content */}
              <div className="bg-[#FAF6EE] text-on-accent border-2 border-outline p-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] font-mono font-bold text-sm leading-relaxed">
                <p className="whitespace-pre-wrap text-ink">{body}</p>
              </div>

              {/* Actions Row */}
              <div className="mt-3 pt-2.5 flex flex-wrap items-center justify-between gap-2 border-t-2 border-outline">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSlash(post.id, index)}
                    className={`flex min-h-11 items-center gap-1 border-2 border-outline px-2.5 py-1 text-xs font-black uppercase shadow-brutal-sm transition-all active:translate-x-0.5 active:translate-y-0.5 ${
                      isSlashed 
                        ? 'bg-accent-2 text-white' 
                        : 'bg-card text-ink hover:bg-inset'
                    }`}
                  >
                    <Swords className={`w-3.5 h-3.5 ${isSlashed ? 'animate-bounce' : ''}`} />
                    [⚔️ SLASH] ({slashCount})
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleCommentBox(post.id)}
                    className={`flex min-h-11 items-center gap-1 border-2 border-outline px-2.5 py-1 text-xs font-black uppercase shadow-brutal-sm transition-all active:translate-x-0.5 active:translate-y-0.5 ${
                      isCommentOpen 
                        ? 'bg-info text-on-accent' 
                        : 'bg-card text-ink hover:bg-inset'
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    [💬 GUILD CHAT] ({postComments.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleTogglePin(post.id)}
                  className={`flex min-h-11 items-center gap-1 border-2 border-outline px-2.5 py-1 text-xs font-black uppercase shadow-brutal-sm transition-all active:translate-x-0.5 active:translate-y-0.5 ${
                    isPinned 
                      ? 'bg-accent text-on-accent' 
                      : 'bg-card text-ink hover:bg-inset'
                  }`}
                >
                  <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-black' : ''}`} />
                  {isPinned ? 'PINNED' : 'PIN'}
                </button>
              </div>

              {/* Comment Drawer */}
              <AnimatePresence>
                {isCommentOpen && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t-2 border-dashed border-outline space-y-2 overflow-hidden"
                  >
                    {postComments.length > 0 && (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {postComments.map((commentText, cIdx) => (
                          <div key={cIdx} className="bg-card border-2 border-outline p-2 text-xs font-bold shadow-brutal-sm flex items-start gap-2">
                            <span className="bg-black text-white px-1.5 py-0.5 text-xs font-black uppercase shrink-0">
                              GUILD MEMBER
                            </span>
                            <span className="text-ink">{commentText}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input 
                        type="text"
                        aria-label={`Write a response to log ${index + 1}`}
                        placeholder="Write a guild response..."
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        className="min-h-11 flex-1 border-2 border-outline bg-card p-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddComment(post.id)}
                        className="min-h-11 border-2 border-outline bg-success px-3 py-1.5 text-xs font-black uppercase shadow-brutal-sm hover:bg-lime-400 active:translate-x-0.5 active:translate-y-0.5"
                      >
                        Reply
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          )
        })}

        {!posts.length && (
          <div className="border-4 border-dashed border-outline bg-card p-8 text-center shadow-brutal">
            <Sparkles className="mx-auto text-[#06B6D4]" size={36} />
            <p className="mt-3 font-black uppercase text-lg">The Codex is empty</p>
            <p className="font-bold text-ink-muted text-xs mt-1">Publish your first progress log to record your conquests.</p>
          </div>
        )}
      </div>
    </div>
  )
}
