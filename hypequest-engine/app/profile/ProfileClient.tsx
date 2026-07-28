'use client'

import { useState, useTransition } from 'react'
import { MessageSquare, Send, Sparkles, Trash2 } from 'lucide-react'
import { createPostAction, deletePostAction } from '../actions'

type ProfilePost = { id: string; content: string; createdAt: string }

export default function ProfileClient({ user, initialPosts }: { user: { name: string; title: string; level: number }; initialPosts: ProfilePost[] }) {
  const [posts, setPosts] = useState(initialPosts)
  const [content, setContent] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, startTransition] = useTransition()
  const initials = user.name.slice(0, 2).toUpperCase()

  function createPost() {
    const draft = content.trim()
    if (!draft) return
    startTransition(async () => {
      const result = await createPostAction(draft)
      if (!result.ok) return setNotice(result.message ?? 'Could not publish post.')
      setPosts((current) => [{ id: `new-${Date.now()}`, content: draft, createdAt: new Date().toISOString() }, ...current])
      setContent('')
    })
  }

  function deletePost(id: string) {
    startTransition(async () => {
      const result = await deletePostAction(id)
      if (!result.ok) return setNotice(result.message ?? 'Could not delete post.')
      setPosts((current) => current.filter((post) => post.id !== id))
    })
  }

  return <div className="min-h-screen max-w-4xl mx-auto p-4 md:p-8 text-black"><header className="border-4 border-black bg-white p-6 shadow-[7px_7px_0_0_#000]"><div className="flex items-center gap-4"><div className="flex h-20 w-20 items-center justify-center border-3 border-black bg-[#06B6D4] text-2xl font-black">{initials}</div><div><h1 className="text-3xl font-black uppercase">{user.name}</h1><p className="font-bold uppercase text-gray-600">Level {user.level} · {user.title}</p><p className="mt-2 font-bold">Your private startup log. Only you can create or delete these posts.</p></div></div></header><section className="mt-8 border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000]"><label className="font-black uppercase">Share a progress note<textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={500} className="mt-3 min-h-28 w-full border-3 border-black bg-[#F4F0EA] p-3 font-bold" placeholder="What did you learn from your hunt?" /></label><div className="mt-3 flex justify-between gap-3"><span className="font-bold text-sm text-gray-600">{content.length}/500</span><button type="button" onClick={createPost} disabled={pending} className="flex items-center gap-2 border-3 border-black bg-[#A3E635] px-4 py-2 font-black uppercase shadow-[3px_3px_0_0_#000] disabled:opacity-50"><Send size={16} /> Publish</button></div>{notice && <p role="status" className="mt-3 border-2 border-black bg-[#FF5722] p-2 font-bold">{notice}</p>}</section><section className="mt-8"><h2 className="inline-flex items-center gap-2 border-3 border-black bg-[#FFE600] px-4 py-2 font-black text-2xl uppercase shadow-[3px_3px_0_0_#000]"><MessageSquare /> Your feed</h2><div className="mt-5 space-y-4">{posts.map((post) => <article key={post.id} className="border-4 border-black bg-white p-5 shadow-[5px_5px_0_0_#000]"><div className="flex items-start justify-between gap-3"><div><p className="font-black">{user.name}</p><p className="text-xs font-bold uppercase text-gray-600">{new Date(post.createdAt).toLocaleString()}</p></div><button type="button" onClick={() => deletePost(post.id)} disabled={pending} className="border-2 border-black bg-white p-2" aria-label="Delete post"><Trash2 size={16} /></button></div><p className="mt-3 whitespace-pre-wrap font-bold">{post.content}</p></article>)}{!posts.length && <div className="border-4 border-dashed border-black bg-white p-10 text-center shadow-[5px_5px_0_0_#000]"><Sparkles className="mx-auto" size={36} /><p className="mt-3 font-black uppercase">No posts yet</p></div>}</div></section></div>
}
