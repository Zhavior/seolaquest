import { useState, useTransition } from 'react'
import confetti from 'canvas-confetti'
import { createPostAction, deletePostAction } from '@/features/guild/actions'
import { ProfilePost, QuestItem, InventorySlot } from '../types'
import { Trophy, FlaskConical, Skull, Scroll } from 'lucide-react'

export const CARD_COLORS = [
  'bg-[#06B6D4]', 
  'bg-[#A3E635]', 
  'bg-[#FFE600]', 
  'bg-[#FF9800]', 
  'bg-[#E040FB]', 
  'bg-[#FF5722]'
]

export const CATEGORY_TAGS = [
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

export function useProfileState(initialPosts: ProfilePost[]) {
  const [posts, setPosts] = useState<ProfilePost[]>(initialPosts)
  const [content, setContent] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('[⚔️ VICTORY]')
  const [notice, setNotice] = useState('')
  const [pending, startTransition] = useTransition()

  // Active Quests State
  const [quests, setQuests] = useState<QuestItem[]>([])
  const [newQuestTitle, setNewQuestTitle] = useState('')

  // Inventory Slots State
  const inventorySlots: InventorySlot[] = []

  // Interactive post states
  const [slashes, setSlashes] = useState<Record<string, number>>({})
  const [slashedPosts, setSlashedPosts] = useState<Record<string, boolean>>({})
  const [pinnedPosts, setPinnedPosts] = useState<Record<string, boolean>>({})
  const [commentsMap, setCommentsMap] = useState<Record<string, string[]>>({})
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [openCommentBoxes, setOpenCommentBoxes] = useState<Record<string, boolean>>({})

  // Quest Handlers
  const addQuest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestTitle.trim()) return
    setQuests((prev) => [
      ...prev,
      { id: Date.now(), title: newQuestTitle.trim(), xp: 0, dueDate: 'Not set', completed: false, priority: 'MED' }
    ])
    setNewQuestTitle('')
  }

  const toggleQuest = (id: number | string) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const nextState = !q.completed
          if (nextState) {
            confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } })
          }
          return { ...q, completed: nextState }
        }
        return q
      })
    )
  }

  function getSlashCount(id: string) {
    if (slashes[id] !== undefined) return slashes[id]
    return 0
  }

  function handleSlash(id: string) {
    const isCurrentlySlashed = slashedPosts[id]
    const currentCount = getSlashCount(id)
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
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
      setNotice('Log published.')
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

  return {
    posts,
    setPosts,
    content,
    setContent,
    selectedTag,
    setSelectedTag,
    notice,
    setNotice,
    pending,
    quests,
    newQuestTitle,
    setNewQuestTitle,
    inventorySlots,
    slashes,
    setSlashes,
    slashedPosts,
    setSlashedPosts,
    pinnedPosts,
    setPinnedPosts,
    commentsMap,
    setCommentsMap,
    commentInputs,
    setCommentInputs,
    openCommentBoxes,
    setOpenCommentBoxes,
    addQuest,
    toggleQuest,
    getSlashCount,
    handleSlash,
    handleTogglePin,
    handleToggleCommentBox,
    handleAddComment,
    createPost,
    deletePost,
    parsePostContent
  }
}
