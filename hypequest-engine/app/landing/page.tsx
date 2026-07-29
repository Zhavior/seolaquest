'use client'
import React, { useState } from 'react'
import { motion, type Variants, AnimatePresence } from 'framer-motion'
import { Sword, Scroll, Target, Compass, Shield, Flame, Wand, Axe, Gem, Sparkles } from 'lucide-react'
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs'
import Link from 'next/link'

// Brutalist RPG Container
const BrutalCard = ({ children, className = "", bgColor = "bg-[#fcf8f2]", texture = false }: any) => (
  <div className={`relative border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none ${bgColor} overflow-hidden ${className}`}>
    {texture && <div className="absolute inset-0 opacity-[0.3] mix-blend-multiply pointer-events-none" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/cream-paper.png')` }} />}
    <div className="relative z-10">{children}</div>
  </div>
)

const AnimatedWeapon = ({ Icon, delay, className }: any) => (
  <motion.div
    animate={{ y: [0, -20, 0], rotate: [-5, 5, -5] }}
    transition={{ duration: 4, repeat: Infinity, delay, ease: "easeInOut" }}
    className={`absolute text-black ${className}`}
  >
    <Icon size={120} strokeWidth={1.5} className="opacity-10" />
  </motion.div>
)

export default function LandingPage() {
  const { isLoaded, userId } = useAuth()
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 } }
  }

  return (
    <div className="min-h-screen bg-[#f4ebd8] text-black font-sans relative overflow-hidden selection:bg-[#ff4500] selection:text-white">
      
      {/* Paper texture overlay (very light, high performance) */}
      <div className="absolute inset-0 z-0 opacity-[0.4] mix-blend-multiply pointer-events-none" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/cream-paper.png')` }} />

      {/* Decorative Background Weapons */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <AnimatedWeapon Icon={Sword} delay={0} className="top-20 left-10" />
        <AnimatedWeapon Icon={Wand} delay={1} className="top-1/3 right-20" />
        <AnimatedWeapon Icon={Axe} delay={2} className="bottom-40 left-1/4" />
        <AnimatedWeapon Icon={Shield} delay={0.5} className="bottom-20 right-1/4" />
        <AnimatedWeapon Icon={Flame} delay={1.5} className="top-40 right-1/3" />
      </div>

      {/* TOP NAV */}
      <nav className="fixed top-0 w-full bg-[#f4ebd8]/90 backdrop-blur-md border-b-4 border-black z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ffd700] border-4 border-black flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform -rotate-6">
              <Sword size={20} strokeWidth={3} />
            </div>
            <span className="text-3xl font-black tracking-widest uppercase">HypeQuest</span>
          </div>
          <div className="flex gap-4">
            {isLoaded && !userId && (
              <>
                <SignInButton mode="modal">
                  <button className="hidden md:block font-bold uppercase tracking-wider hover:underline underline-offset-4 decoration-4">
                    Login
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-[#ff4500] text-white px-6 py-2 border-4 border-black font-black uppercase tracking-wider shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all">
                    Join Guild
                  </button>
                </SignUpButton>
              </>
            )}
            {isLoaded && userId && (
              <>
                <Link href="/">
                  <button className="bg-[#ff4500] text-white px-6 py-2 border-4 border-black font-black uppercase tracking-wider shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all">
                    Dashboard
                  </button>
                </Link>
                <UserButton />
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10 min-h-[90vh]">
        
        {/* Left: Copy */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex-1 text-center lg:text-left">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 font-bold uppercase tracking-widest text-sm border-2 border-black transform -rotate-2 mb-6 shadow-[4px_4px_0_0_rgba(255,69,0,1)]">
            <Flame size={16} className="text-[#ff4500]" /> The Ultimate SaaS RPG
          </motion.div>
          
          <motion.h1 variants={fadeUp} className="text-6xl md:text-8xl lg:text-[100px] font-black uppercase tracking-tighter leading-[0.9] text-black drop-shadow-[4px_4px_0_rgba(0,0,0,0.1)]">
            Stop Searching.<br/>
            <span className="text-[#ff4500] relative inline-block">
              Start Hunting.
              <svg className="absolute w-full h-4 -bottom-2 left-0 text-black" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5 L 100 10 L 0 10 Z" fill="currentColor"/>
              </svg>
            </span>
          </motion.h1>
          
          <motion.p variants={fadeUp} className="mt-8 text-xl md:text-3xl font-bold max-w-2xl mx-auto lg:mx-0 leading-tight">
            Turn social listening into an epic tabletop adventure. Deploy your party, uncover hidden bounties, and level up.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-6 bg-[#ffd700] border-4 border-black p-4 font-bold text-lg md:text-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform -rotate-1 max-w-xl mx-auto lg:mx-0">
            Automated Reddit & X keyword monitoring that turns buyer intent into immediate warm replies.
          </motion.div>
          
          <motion.div variants={fadeUp} className="mt-12 flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
            {isLoaded && !userId && (
              <SignUpButton mode="modal">
                <button className="bg-[#ff4500] text-white px-12 py-5 border-4 border-black font-black uppercase tracking-widest text-2xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-y-[4px] hover:translate-x-[4px] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center gap-3">
                  <Sword size={28} /> Start Free Hunt
                </button>
              </SignUpButton>
            )}
            {isLoaded && userId && (
              <Link href="/">
                <button className="bg-[#ff4500] text-white px-12 py-5 border-4 border-black font-black uppercase tracking-widest text-2xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-y-[4px] hover:translate-x-[4px] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center gap-3">
                  <Compass size={28} /> Deploy First Scout
                </button>
              </Link>
            )}
          </motion.div>
        </motion.div>

        {/* Right: The Brutalist Bounty Board */}
        <motion.div 
          className="flex-1 w-full max-w-lg mx-auto hidden lg:block"
          initial={{ opacity: 0, x: 100, rotate: 10 }}
          animate={{ opacity: 1, x: 0, rotate: 5 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          whileHover={{ rotate: 0, scale: 1.02 }}
        >
          <div className="bg-[#8b4513] p-8 border-4 border-black shadow-[16px_16px_0_0_rgba(0,0,0,1)] relative">
            {/* Nails */}
            <div className="absolute top-4 left-4 w-4 h-4 bg-gray-400 border-2 border-black rounded-full" />
            <div className="absolute top-4 right-4 w-4 h-4 bg-gray-400 border-2 border-black rounded-full" />
            
            <BrutalCard bgColor="bg-[#fdf9f1]" texture={true} className="p-8 transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
              <div className="text-center">
                <h3 className="font-black text-3xl uppercase tracking-widest border-b-4 border-black pb-4 mb-4">Bounty Notice</h3>
                <p className="font-bold text-xl italic mb-6">"Our tavern requires a new SaaS gamification engine..."</p>
                <div className="flex justify-between items-center font-black text-sm tracking-widest uppercase">
                  <span className="flex items-center gap-2 bg-[#ff4500] text-white px-3 py-1 border-2 border-black"><Target size={16}/> Reddit</span>
                  <span className="flex items-center gap-1 bg-[#ffd700] px-3 py-1 border-2 border-black"><Gem size={16}/> 100g</span>
                </div>
              </div>
            </BrutalCard>
          </div>
        </motion.div>
      </section>

      {/* THE QUEST LOG (Features) */}
      <section className="py-32 relative z-10 border-t-4 border-black bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-widest mb-4">
              The Adventurer's Log
            </h2>
            <div className="w-24 h-2 bg-[#ff4500] mx-auto border-2 border-black" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            {/* 1. Track Demand */}
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0 }}>
              <BrutalCard bgColor="bg-[#f4ebd8]" className="h-full p-8 flex flex-col items-center text-center transition-transform hover:-translate-y-2">
                <div className="w-24 h-24 mb-8 bg-[#4169e1] border-4 border-black flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform rotate-3">
                  <Target size={48} strokeWidth={2.5} className="text-black" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-widest mb-4">Track Demand</h3>
                <p className="font-bold text-lg leading-relaxed">List the incantations and keywords that signal a customer needs your B2B tool.</p>
              </BrutalCard>
            </motion.div>

            {/* 2. Scout Regions (Show, Don't Tell - Terminal UI) */}
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.1 }}>
              <BrutalCard bgColor="bg-[#f4ebd8]" className="h-full p-8 flex flex-col items-center text-center transition-transform hover:-translate-y-2">
                
                {/* Live Scout Terminal Window Mockup */}
                <div className="w-full bg-black border-4 border-black mb-6 text-left font-mono text-xs overflow-hidden shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform -rotate-2">
                  <div className="bg-[#ff4500] px-2 py-1 text-white font-black border-b-4 border-black uppercase tracking-widest flex items-center gap-2">
                    <Compass size={12}/> LIVE SCOUT: /r/SaaS
                  </div>
                  <div className="p-3 text-[#32cd32]">
                    <p className="mb-1">{`>`} Scanning: "how to get early users"</p>
                    <p className="mb-1 text-[#ffd700] animate-pulse">{`>`} BOUNTY DETECTED!</p>
                    <p className="text-gray-300 border-l-2 border-gray-600 pl-2 mt-2">"I just launched my MVP but I have no idea how to get my first 10 users..."</p>
                  </div>
                </div>

                <h3 className="text-2xl font-black uppercase tracking-widest mb-4">Scout Regions</h3>
                <p className="font-bold text-lg leading-relaxed">Deploy automated scouts into the wilds of Reddit to find warm leads instantly.</p>
              </BrutalCard>
            </motion.div>

            {/* 3. Claim Victory */}
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.2 }}>
              <BrutalCard bgColor="bg-[#f4ebd8]" className="h-full p-8 flex flex-col items-center text-center transition-transform hover:-translate-y-2">
                <div className="w-24 h-24 mb-8 bg-[#ffd700] border-4 border-black flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform -rotate-3">
                  <Gem size={48} strokeWidth={2.5} className="text-black" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-widest mb-4">Claim Victory</h3>
                <p className="font-bold text-lg leading-relaxed">Engage the warm lead, close the deal, and watch your guild's MRR soar.</p>
              </BrutalCard>
            </motion.div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-white pt-24 pb-12 border-t-8 border-[#ff4500] relative z-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12">
          
          <div className="col-span-1 md:col-span-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#ffd700] border-4 border-white flex items-center justify-center transform rotate-6">
                <Sword size={24} className="text-black" strokeWidth={3} />
              </div>
              <span className="text-4xl font-black uppercase tracking-widest">HYPEQUEST</span>
            </div>
            <p className="font-bold text-xl leading-relaxed text-gray-300">
              The legendary toolkit for SaaS founders who want to stop marketing and start hunting.
            </p>
          </div>
          
          <div className="col-span-1 md:col-span-3 md:col-start-7">
            <h4 className="text-lg font-black uppercase tracking-widest text-[#ff4500] mb-6">The Guild</h4>
            <ul className="space-y-4 font-bold text-lg">
              <li><Link href="/blog" className="hover:text-[#ffd700] transition-colors flex items-center gap-3 hover:translate-x-2"><Scroll size={20}/> Guild Ledger (Blog)</Link></li>
              <li><Link href="/" className="hover:text-[#ffd700] transition-colors flex items-center gap-3 hover:translate-x-2"><Compass size={20}/> Quest Board</Link></li>
            </ul>
          </div>
          
          <div className="col-span-1 md:col-span-3">
            <h4 className="text-lg font-black uppercase tracking-widest text-[#ff4500] mb-6">Support</h4>
            <ul className="space-y-4 font-bold text-lg">
              <li><a href="https://twitter.com" className="hover:text-[#ffd700] transition-colors flex items-center gap-3 hover:translate-x-2"><Target size={20}/> Town Crier (X)</a></li>
              <li><a href="mailto:support@hypequest.com" className="hover:text-[#ffd700] transition-colors flex items-center gap-3 hover:translate-x-2"><Wand size={20}/> Guildmaster</a></li>
            </ul>
          </div>

        </div>
      </footer>

    </div>
  )
}
