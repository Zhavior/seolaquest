'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, Calendar, Flame } from 'lucide-react'
import { Post } from '@/lib/blog-types'
import { sfx } from '@/lib/sfx'

interface BlogHeroCardProps {
  post: Post
}

export function BlogHeroCard({ post }: BlogHeroCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group relative overflow-hidden border-4 border-black bg-white shadow-[8px_8px_0_0_#000] hover:shadow-[12px_12px_0_0_#000] transition-all"
    >
      {/* Neo-Brutalist Top Accent Bar */}
      <div 
        className="h-3 w-full border-b-4 border-black" 
        style={{ backgroundColor: post.coverColor || '#FFE600' }} 
      />

      <div className="p-6 md:p-8">
        {/* Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 border-3 border-black bg-[#FFE600] px-3 py-1 text-xs font-black uppercase text-black shadow-[2px_2px_0_0_#000]">
              <Flame size={14} className="fill-red-500 text-red-500 animate-pulse" /> FEATURED QUEST
            </span>
            <span className="inline-flex items-center gap-1 border-3 border-black bg-[#00FFFF] px-3 py-1 text-xs font-black uppercase text-black shadow-[2px_2px_0_0_#000]">
              {post.tag}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-black uppercase text-zinc-600">
            <span className="flex items-center gap-1">
              <Clock size={14} /> {post.readTimeMinutes} MIN READ
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} /> {post.date}
            </span>
          </div>
        </div>

        {/* Hero Title */}
        <Link
          href={`/blog/${post.slug}`}
          onClick={() => sfx.playCoinDrop()}
          onMouseEnter={() => sfx.playHoverBlip()}
          className="block"
        >
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-black group-hover:text-[#8A2BE2] transition-colors leading-tight mb-4">
            {post.title}
          </h2>
        </Link>

        {/* Hero Description */}
        <p className="text-sm md:text-base font-bold text-zinc-700 leading-relaxed mb-6 line-clamp-3">
          {post.description}
        </p>

        {/* Footer Author & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t-3 border-black">
          {/* Author Crest */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-[#FF3333] text-white font-black text-lg shadow-[2px_2px_0_0_#000]">
              {post.authorAvatar}
            </div>
            <div>
              <p className="font-black text-sm uppercase text-black">{post.author}</p>
              <p className="text-[11px] font-bold uppercase text-zinc-500">{post.authorRole}</p>
            </div>
          </div>

          {/* Action Button */}
          <Link
            href={`/blog/${post.slug}`}
            onClick={() => sfx.playCoinDrop()}
            onMouseEnter={() => sfx.playHoverBlip()}
            className="inline-flex items-center justify-center gap-2 border-3 border-black bg-[#FFE600] px-6 py-3 font-black uppercase text-black shadow-[4px_4px_0_0_#000] hover:bg-[#00FFFF] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <span>Read Article</span>
            <ArrowRight size={18} strokeWidth={3} />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
