'use client'

import { useState, useTransition } from 'react'
import { MessageSquare, Send, Sparkles, Trash2, Shield, Swords, Star, Scroll } from 'lucide-react'
import { createPostAction, deletePostAction } from '../actions'

type ProfilePost = { id: string; content: string; createdAt: string }

const CARD_COLORS = ['bg-[#06B6D4]', 'bg-[#A3E635]', 'bg-[#FF5722]', 'bg-[#FFE600]', 'bg-[#FF9800]', 'bg-[#E040FB]']

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

  return (
    <div className="min-h-screen max-w-5xl mx-auto p-4 md:p-8 text-black space-y-10">
      <header className="border-4 border-black bg-[#FFE600] shadow-[7px_7px_0_0_#000] overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
          <Shield size={120} className="text-black" />
        </div>
        <div className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center border-4 border-black bg-[#06B6D4] text-5xl font-black shadow-[4px_4px_0_0_#000]">
            {initials}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">{user.name}</h1>
            <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className="border-3 border-black bg-[#FF5722] text-white px-3 py-1 font-black uppercase flex items-center gap-2 shadow-[2px_2px_0_0_#000]">
                <Star size={16} /> Level {user.level}
              </span>
              <span className="border-3 border-black bg-white px-3 py-1 font-black uppercase text-gray-800 flex items-center gap-2 shadow-[2px_2px_0_0_#000]">
                <Swords size={16} /> {user.title}
              </span>
            </div>
            <p className="mt-4 font-bold text-lg bg-black text-white inline-block px-3 py-1 shadow-[2px_2px_0_0_#A3E635]">
              Your private startup log. Only you can create or delete these posts.
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <section>
            <h2 className="inline-flex items-center gap-3 border-4 border-black bg-white px-5 py-3 font-black text-2xl uppercase shadow-[4px_4px_0_0_#000] mb-6 relative -rotate-1">
              <Scroll /> Quest Log Feed
            </h2>
            
            <div className="space-y-6">
              {posts.map((post, index) => {
                const colorClass = CARD_COLORS[index % CARD_COLORS.length]
                return (
                  <article 
                    key={post.id} 
                    className={`border-4 border-black ${colorClass} p-6 shadow-[5px_5px_0_0_#000] transition-transform hover:-translate-y-1 hover:translate-x-1 hover:shadow-[3px_3px_0_0_#000]`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-xl uppercase tracking-tight text-black bg-white inline-block px-2 border-2 border-black">
                          {user.name}
                        </p>
                        <p className="text-sm font-bold uppercase text-black mt-2 bg-white/60 inline-block px-2">
                          {new Date(post.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => deletePost(post.id)} 
                        disabled={pending} 
                        className="border-3 border-black bg-white p-2 hover:bg-[#FF5722] hover:text-white transition-colors shadow-[2px_2px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none" 
                        aria-label="Delete post"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    <p className="mt-5 whitespace-pre-wrap font-bold text-lg bg-white/90 p-4 border-3 border-black">
                      {post.content}
                    </p>
                  </article>
                )
              })}

              {!posts.length && (
                <div className="border-4 border-dashed border-black bg-white p-12 text-center shadow-[5px_5px_0_0_#000]">
                  <Sparkles className="mx-auto text-[#06B6D4]" size={48} />
                  <p className="mt-4 font-black uppercase text-xl">No posts yet</p>
                  <p className="font-bold text-gray-600 mt-2">Publish your first quest update to see it here.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-1">
          <section className="border-4 border-black bg-white p-6 shadow-[7px_7px_0_0_#000] sticky top-8">
            <label className="font-black uppercase text-xl flex items-center gap-2 border-b-4 border-black pb-4 mb-4">
              <MessageSquare size={24} /> New Progress Note
            </label>
            <textarea 
              value={content} 
              onChange={(event) => setContent(event.target.value)} 
              maxLength={500} 
              className="min-h-40 w-full border-3 border-black bg-[#F4F0EA] p-4 font-bold focus:outline-none focus:ring-4 focus:ring-black transition-shadow text-lg resize-y" 
              placeholder="What did you learn from your hunt today?" 
            />
            <div className="mt-4 flex flex-col gap-4">
              <span className="font-black text-sm uppercase text-right bg-black text-white px-2 py-1 self-end border-2 border-black">
                {content.length} / 500
              </span>
              <button 
                type="button" 
                onClick={createPost} 
                disabled={pending || !content.trim()} 
                className="w-full flex justify-center items-center gap-2 border-4 border-black bg-[#A3E635] px-4 py-4 font-black uppercase text-xl shadow-[4px_4px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_#000] transition-all disabled:opacity-50 disabled:pointer-events-none active:translate-x-2 active:translate-y-2 active:shadow-none"
              >
                <Send size={20} /> Publish Log
              </button>
            </div>
            
            {notice && (
              <p role="status" className="mt-4 border-3 border-black bg-[#FF5722] text-white p-3 font-black uppercase shadow-[2px_2px_0_0_#000]">
                {notice}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
