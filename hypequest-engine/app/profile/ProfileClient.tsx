'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Trash2, 
  Shield, 
  Swords, 
  Star, 
  Scroll, 
  FlaskConical, 
  Skull, 
  Trophy, 
  Pin, 
  Flame,
  Award,
  MessageCircle
} from 'lucide-react'
import { createPostAction, deletePostAction } from '../actions'

type ProfilePost = { id: string; content: string; createdAt: string }

const CARD_COLORS = [
  'bg-[#06B6D4]', 
  'bg-[#A3E635]', 
  'bg-[#FFE600]', 
  'bg-[#FF9800]', 
  'bg-[#E040FB]', 
  'bg-[#FF5722]'
]

const CATEGORY_TAGS = [
  { 
    id: 'victory',
    tag: '[⚔️ VICTORY]', 
    label: 'VICTORY', 
    icon: Trophy, 
    bgColor: 'bg-[#A3E635]', 
    textColor: 'text-black', 
    desc: 'Closed a deal / won a client' 
  },
  { 
    id: 'experiment',
    tag: '[🧪 EXPERIMENT]', 
    label: 'EXPERIMENT', 
    icon: FlaskConical, 
    bgColor: 'bg-[#06B6D4]', 
    textColor: 'text-black', 
    desc: 'Tested new keywords / copy' 
  },
  { 
    id: 'defeat',
    tag: '[💀 DEFEAT]', 
    label: 'DEFEAT', 
    icon: Skull, 
    bgColor: 'bg-[#FF5722]', 
    textColor: 'text-white', 
    desc: 'Lost a lead / code bug fixed' 
  },
  { 
    id: 'milestone',
    tag: '[📜 MILESTONE]', 
    label: 'MILESTONE', 
    icon: Scroll, 
    bgColor: 'bg-[#FFE600]', 
    textColor: 'text-black', 
    desc: 'New feature deployed' 
  },
]

export default function ProfileClient({ user, initialPosts }: { user: { name: string; title: string; level: number }; initialPosts: ProfilePost[] }) {
  const [posts, setPosts] = useState(initialPosts)
  const [content, setContent] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('[⚔️ VICTORY]')
  const [notice, setNotice] = useState('')
  const [pending, startTransition] = useTransition()

  // Interactive post states
  const [slashes, setSlashes] = useState<Record<string, number>>({})
  const [slashedPosts, setSlashedPosts] = useState<Record<string, boolean>>({})
  const [pinnedPosts, setPinnedPosts] = useState<Record<string, boolean>>({})
  const [commentsMap, setCommentsMap] = useState<Record<string, string[]>>({})
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [openCommentBoxes, setOpenCommentBoxes] = useState<Record<string, boolean>>({})

  const initials = user.name.slice(0, 2).toUpperCase()

  function getSlashCount(id: string, index: number) {
    if (slashes[id] !== undefined) return slashes[id]
    const base = (index * 7 + 12) % 35 + 3
    return base
  }

  function handleSlash(id: string, index: number) {
    const isCurrentlySlashed = slashedPosts[id]
    const currentCount = getSlashCount(id, index)
    setSlashedPosts((prev) => ({ ...prev, [id]: !isCurrentlySlashed }))
    setSlashes((prev) => ({ ...prev, [id]: isCurrentlySlashed ? currentCount - 1 : currentCount + 1 }))
  }

  function handleTogglePin(id: string) {
    setPinnedPosts((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleToggleCommentBox(id: string) {
    setOpenCommentBoxes((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleAddComment(id: string) {
    const text = (commentInputs[id] || '').trim()
    if (!text) return
    setCommentsMap((prev) => ({
      ...prev,
      [id]: [...(prev[id] || []), text]
    }))
    setCommentInputs((prev) => ({ ...prev, [id]: '' }))
  }

  function createPost() {
    const draft = content.trim()
    if (!draft) return

    const formattedContent = draft.startsWith('[') ? draft : `${selectedTag} ${draft}`

    startTransition(async () => {
      const result = await createPostAction(formattedContent)
      if (!result.ok) return setNotice(result.message ?? 'Could not publish post.')
      setPosts((current) => [{ id: `new-${Date.now()}`, content: formattedContent, createdAt: new Date().toISOString() }, ...current])
      setContent('')
      setNotice('✨ Log published! +25 XP added to your Hunter Level!')
      setTimeout(() => setNotice(''), 4000)
    })
  }

  function deletePost(id: string) {
    startTransition(async () => {
      const result = await deletePostAction(id)
      if (!result.ok) return setNotice(result.message ?? 'Could not delete post.')
      setPosts((current) => current.filter((post) => post.id !== id))
    })
  }

  function parsePostContent(rawContent: string) {
    const tagMatch = rawContent.match(/^(\[[^\]]+\])\s*([\s\S]*)/)
    if (tagMatch) {
      return { tag: tagMatch[1], body: tagMatch[2] }
    }
    return { tag: null, body: rawContent }
  }

  return (
    <div className="min-h-screen max-w-5xl mx-auto p-4 md:p-8 text-black space-y-10">
      {/* 🛡️ Enhanced Profile Hero Header */}
      <header className="border-4 border-black bg-[#FFE600] shadow-[7px_7px_0_0_#000] overflow-hidden relative">
        <div className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center border-4 border-black bg-[#06B6D4] text-5xl font-black shadow-[4px_4px_0_0_#000]">
              {initials}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">{user.name}</h1>
              
              <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="border-3 border-black bg-[#FF5722] text-white px-3 py-1 font-black uppercase text-sm flex items-center gap-2 shadow-[2px_2px_0_0_#000]">
                  <Star size={16} /> Level {user.level}
                </span>
                <span className="border-3 border-black bg-white px-3 py-1 font-black uppercase text-sm text-gray-800 flex items-center gap-2 shadow-[2px_2px_0_0_#000]">
                  <Swords size={16} /> {user.title}
                </span>
              </div>

              {/* Subtitle rebranded */}
              <p className="mt-4 font-bold text-base md:text-lg bg-black text-white inline-block px-3 py-1.5 shadow-[3px_3px_0_0_#A3E635]">
                Document your guild's conquests, daily learnings, and startup milestones.
              </p>

              {/* 🧪 Stat Quick-Bar */}
              <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <span className="border-3 border-black bg-[#A855F7] text-white px-3 py-1 font-black text-xs uppercase flex items-center gap-1.5 shadow-[2px_2px_0_0_#000]">
                  🧪 Mana: 100 / 100
                </span>
                <span className="border-3 border-black bg-[#06B6D4] text-black px-3 py-1 font-black text-xs uppercase flex items-center gap-1.5 shadow-[2px_2px_0_0_#000]">
                  🗡️ Active Agents: 3 Scouts
                </span>
                <span className="border-3 border-black bg-[#FF5722] text-white px-3 py-1 font-black text-xs uppercase flex items-center gap-1.5 shadow-[2px_2px_0_0_#000]">
                  🔥 Streak: 7-Day Questing
                </span>
              </div>
            </div>
          </div>

          {/* 🛡️ Guild Crest / Class Icon Shield Container */}
          <div className="hidden lg:flex flex-col items-center justify-center border-4 border-black bg-white p-4 shadow-[5px_5px_0_0_#000] rotate-2 hover:rotate-0 transition-transform shrink-0 w-44">
            <div className="flex items-center gap-1.5 font-black text-[11px] uppercase bg-black text-[#FFE600] px-2 py-0.5 border-2 border-black mb-2 shadow-[1px_1px_0_0_#000]">
              <Shield size={13} /> GUILD CREST
            </div>
            <div className="w-16 h-16 bg-[#06B6D4] border-3 border-black flex items-center justify-center shadow-[3px_3px_0_0_#000] my-1">
              <Swords size={34} className="text-black" />
            </div>
            <span className="mt-2 font-black text-xs uppercase tracking-wider bg-[#FFE600] px-2 py-0.5 border-2 border-black text-center shadow-[1px_1px_0_0_#000]">
              DRAGON SLAYER
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Feed Section */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between gap-4 mb-6">
              {/* 📜 Re-branded Title */}
              <h2 className="inline-flex items-center gap-3 border-4 border-black bg-white px-5 py-3 font-black text-2xl uppercase shadow-[4px_4px_0_0_#000] -rotate-1">
                <Scroll className="text-[#06B6D4]" /> 📜 THE HUNTER'S CODEX
              </h2>
              <span className="border-3 border-black bg-black text-white px-3 py-1 font-black text-xs uppercase shadow-[2px_2px_0_0_#A3E635]">
                {posts.length} {posts.length === 1 ? 'Entry' : 'Entries'}
              </span>
            </div>
            
            <div className="space-y-6">
              {posts.map((post, index) => {
                const colorClass = CARD_COLORS[index % CARD_COLORS.length]
                const { tag, body } = parsePostContent(post.content)
                const isPinned = pinnedPosts[post.id]
                const slashCount = getSlashCount(post.id, index)
                const isSlashed = slashedPosts[post.id]
                const postComments = commentsMap[post.id] || []
                const isCommentOpen = openCommentBoxes[post.id]

                const displayBadge = tag ? tag : `📜 QUEST LOG #${posts.length - index}`

                return (
                  <motion.article 
                    layout
                    key={post.id} 
                    className={`border-4 border-black ${colorClass} p-6 shadow-[6px_6px_0_0_#000] transition-all relative ${
                      isPinned ? 'ring-4 ring-black ring-offset-2' : ''
                    }`}
                  >
                    {/* Top Header Row */}
                    <div className="flex items-start justify-between gap-3 border-b-3 border-black pb-4 mb-4 bg-white/80 p-3 border-2 border-black">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-lg uppercase tracking-tight text-black bg-white px-2 py-0.5 border-2 border-black shadow-[2px_2px_0_0_#000]">
                          {user.name}
                        </span>

                        {/* 📜 Entry Class Badge (Top Right / Header Pill) */}
                        <span className="font-black text-xs uppercase text-black bg-[#FFE600] px-2.5 py-1 border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1">
                          <Award size={14} /> {displayBadge}
                        </span>

                        {isPinned && (
                          <span className="font-black text-xs uppercase text-white bg-black px-2 py-1 border-2 border-black flex items-center gap-1 shadow-[2px_2px_0_0_#06B6D4]">
                            <Pin size={12} className="rotate-45" /> PINNED TO TAVERN
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-black bg-white/80 px-2 py-1 border border-black hidden sm:inline-block">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>

                        {/* Delete Button Icon: Cleanly directly on header bar without white box */}
                        <button 
                          type="button" 
                          onClick={() => deletePost(post.id)} 
                          disabled={pending} 
                          className="p-1.5 text-black hover:text-[#FF5722] hover:bg-black/15 transition-all active:scale-90 border-2 border-transparent hover:border-black" 
                          aria-label="Delete post"
                          title="Delete entry"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>

                    {/* 📜 Paper / Parchment Inner Fill Content */}
                    <div className="bg-[#FAF6EE] text-black border-3 border-black p-5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] relative font-mono font-bold text-lg leading-relaxed">
                      {/* Paper Pin Icon Decoration */}
                      <div className="absolute top-2 right-3 text-amber-800/30 pointer-events-none">
                        <Pin size={18} className="rotate-45" />
                      </div>
                      <p className="whitespace-pre-wrap relative z-10 text-gray-900">
                        {body}
                      </p>
                    </div>

                    {/* ⚔️ Interactive Reactions / Guild Chat / Pin Buttons */}
                    <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 border-t-3 border-black">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* [⚔️ SLASH] Like Button */}
                        <button
                          type="button"
                          onClick={() => handleSlash(post.id, index)}
                          className={`flex items-center gap-1.5 border-3 border-black px-3 py-1.5 font-black text-xs uppercase shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all ${
                            isSlashed 
                              ? 'bg-[#FF5722] text-white' 
                              : 'bg-white text-black hover:bg-zinc-100'
                          }`}
                        >
                          <Swords size={16} className={isSlashed ? 'animate-bounce' : ''} />
                          [⚔️ SLASH] ({slashCount})
                        </button>

                        {/* [💬 GUILD CHAT] Comment Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleCommentBox(post.id)}
                          className={`flex items-center gap-1.5 border-3 border-black px-3 py-1.5 font-black text-xs uppercase shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all ${
                            isCommentOpen 
                              ? 'bg-[#06B6D4] text-black' 
                              : 'bg-white text-black hover:bg-zinc-100'
                          }`}
                        >
                          <MessageCircle size={16} />
                          [💬 GUILD CHAT] ({postComments.length})
                        </button>
                      </div>

                      {/* [📌 PIN TO TAVERN] Pin Button */}
                      <button
                        type="button"
                        onClick={() => handleTogglePin(post.id)}
                        className={`flex items-center gap-1.5 border-3 border-black px-3 py-1.5 font-black text-xs uppercase shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all ${
                          isPinned 
                            ? 'bg-[#FFE600] text-black' 
                            : 'bg-white text-black hover:bg-zinc-100'
                        }`}
                      >
                        <Pin size={14} className={isPinned ? 'fill-black' : ''} />
                        {isPinned ? '[📌 PINNED]' : '[📌 PIN TO TAVERN]'}
                      </button>
                    </div>

                    {/* Expandable Guild Chat Comment Drawer */}
                    <AnimatePresence>
                      {isCommentOpen && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-3 border-t-2 border-dashed border-black space-y-3 overflow-hidden"
                        >
                          {postComments.length > 0 && (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                              {postComments.map((commentText, cIdx) => (
                                <div key={cIdx} className="bg-white border-2 border-black p-2 text-xs font-bold shadow-[2px_2px_0_0_#000] flex items-start gap-2">
                                  <span className="bg-black text-white px-1.5 py-0.5 text-[10px] font-black uppercase shrink-0">
                                    GUILD MEMBER
                                  </span>
                                  <span className="text-gray-900">{commentText}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <input 
                              type="text"
                              placeholder="Write a guild response..."
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                              className="flex-1 border-2 border-black p-2 font-bold text-xs bg-white focus:outline-none focus:ring-2 focus:ring-black"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddComment(post.id)}
                              className="border-2 border-black bg-[#A3E635] px-3 py-2 font-black text-xs uppercase shadow-[2px_2px_0_0_#000] hover:bg-lime-400 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
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
                <div className="border-4 border-dashed border-black bg-white p-12 text-center shadow-[5px_5px_0_0_#000]">
                  <Sparkles className="mx-auto text-[#06B6D4]" size={48} />
                  <p className="mt-4 font-black uppercase text-xl">The Codex is empty</p>
                  <p className="font-bold text-gray-600 mt-2">Publish your first quest update to see it here.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Sidebar: "New Progress Note" Log Creator */}
        <div className="lg:col-span-1">
          <section className="border-4 border-black bg-white p-6 shadow-[7px_7px_0_0_#000] sticky top-8 space-y-5">
            <label className="font-black uppercase text-xl flex items-center gap-2 border-b-4 border-black pb-4">
              <MessageSquare size={24} /> New Progress Note
            </label>

            {/* 🏷️ Entry Tags / Category Pills */}
            <div className="space-y-2">
              <span className="font-black text-xs uppercase text-gray-700 block">
                Select Entry Tag:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORY_TAGS.map((cat) => {
                  const Icon = cat.icon
                  const isSelected = selectedTag === cat.tag
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedTag(cat.tag)}
                      className={`border-3 border-black p-2.5 font-black text-xs uppercase text-left flex flex-col gap-1 transition-all shadow-[2px_2px_0_0_#000] ${
                        isSelected 
                          ? `${cat.bgColor} ${cat.textColor} ring-2 ring-black scale-[1.02]` 
                          : 'bg-white text-black hover:bg-zinc-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon size={14} />
                        <span>{cat.label}</span>
                      </div>
                      <span className="text-[9px] opacity-80 font-bold line-clamp-1">
                        {cat.desc}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Textarea */}
            <div className="space-y-2">
              <textarea 
                value={content} 
                onChange={(event) => setContent(event.target.value)} 
                maxLength={500} 
                className="min-h-36 w-full border-3 border-black bg-[#F4F0EA] p-4 font-bold focus:outline-none focus:ring-4 focus:ring-black transition-shadow text-base resize-y" 
                placeholder="What did you learn from your hunt today?" 
              />
              <div className="flex justify-between items-center text-xs font-black uppercase">
                <span className="bg-black text-[#FFE600] px-2 py-0.5 border border-black">
                  Tag: {selectedTag.split(' ')[0] + ']'}
                </span>
                <span className="bg-black text-white px-2 py-0.5 border border-black">
                  {content.length} / 500
                </span>
              </div>
            </div>

            {/* ✨ Gamified XP Reward Banner */}
            <div className="border-3 border-black bg-[#FFE600] p-3 shadow-[3px_3px_0_0_#000] flex items-center gap-2 font-black text-xs uppercase text-black">
              <Flame size={18} className="text-[#FF5722] fill-[#FF5722] shrink-0" />
              <span>Publishing a log grants <strong className="bg-black text-[#FFE600] px-1 py-0.5 border border-black">+25 XP</strong> to your Hunter Level!</span>
            </div>

            {/* Submit Button */}
            <button 
              type="button" 
              onClick={createPost} 
              disabled={pending || !content.trim()} 
              className="w-full flex justify-center items-center gap-2 border-4 border-black bg-[#A3E635] px-4 py-4 font-black uppercase text-xl shadow-[4px_4px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_#000] transition-all disabled:opacity-50 disabled:pointer-events-none active:translate-x-2 active:translate-y-2 active:shadow-none"
            >
              <Send size={20} /> Publish Log
            </button>
            
            {notice && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                role="status" 
                className="border-3 border-black bg-[#A855F7] text-white p-3 font-black uppercase text-xs shadow-[2px_2px_0_0_#000]"
              >
                {notice}
              </motion.p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
