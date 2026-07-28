'use client'
import React from 'react'
import { motion, type Variants } from 'framer-motion'
import { Zap, Crosshair } from 'lucide-react'
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export default function LandingPage() {
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  }

  return (
    <div className="min-h-screen bg-[#F4F0EA] text-black selection:bg-[#FFE600] selection:text-black">
      
      {/* MINIMALIST TOP NAV */}
      <nav className="fixed top-0 w-full bg-[#F4F0EA]/90 backdrop-blur-md border-b-4 border-black z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#FF5722] p-1.5 border-3 border-black rotate-[-6deg] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Zap size={24} className="text-white fill-white" />
            </div>
            <span className="text-2xl font-black uppercase tracking-tighter">HypeQuest</span>
          </div>
          <div className="flex gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="hidden md:block bg-transparent border-3 border-black px-6 py-2 font-black uppercase tracking-wider hover:bg-gray-100 transition-colors">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-[#A3E635] border-3 border-black px-6 py-2 font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all">
                  Get Started
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/">
                <button className="bg-[#A3E635] border-3 border-black px-6 py-2 mr-4 font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all">
                  Dashboard
                </button>
              </Link>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* CINEMATIC HERO SECTION */}
      <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 1, type: "spring" }}
          className="absolute top-20 left-10 md:left-32 opacity-20 pointer-events-none"
        >
          <Crosshair size={120} />
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-5xl relative z-10">
          <div className="inline-block bg-[#06B6D4] text-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-2deg] mb-8 font-black uppercase tracking-widest text-sm md:text-base">
            The Ultimate SaaS Growth RPG
          </div>
          <h1 className="text-6xl md:text-8xl lg:text-[120px] font-black uppercase tracking-tighter leading-[0.85] text-black">
            Stop Searching.<br/>
            <span className="text-[#FF5722] drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">Start Hunting.</span>
          </h1>
          <p className="mt-10 text-xl md:text-3xl font-bold max-w-3xl mx-auto text-gray-800 leading-relaxed">
            Turn social listening into an 8-bit adventure. Deploy your party, scan the network for leads, and level up your startup.
          </p>
          
          <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center">
            <SignedOut>
              <SignUpButton mode="modal">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-[#FFE600] border-4 border-black px-12 py-6 font-black uppercase text-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-4 w-full sm:w-auto">
                  <Zap size={28} className="fill-black" /> Play Now
                </motion.button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-[#FFE600] border-4 border-black px-12 py-6 font-black uppercase text-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-4 w-full sm:w-auto">
                  <Zap size={28} className="fill-black" /> Enter Dashboard
                </motion.button>
              </Link>
            </SignedIn>
          </div>
        </motion.div>
      </section>

      {/* SCROLL-DRIVEN FEATURE SHOWCASE */}
      <section className="py-32 bg-black text-white border-y-8 border-[#FF5722]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">How It Works</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Track demand", desc: "Add the phrases that signal a customer needs help.", color: "bg-[#06B6D4]" },
              { step: "02", title: "Scan Reddit", desc: "Run a scan of public Reddit search results and review new matches.", color: "bg-[#A3E635]" },
              { step: "03", title: "Follow up", desc: "Open the original post, contact the lead, and keep a simple record of your progress.", color: "bg-[#FF5722]" }
            ].map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }} viewport={{ once: true }} className="bg-white text-black p-8 border-4 border-white shadow-[8px_8px_0px_0px_rgba(255,230,0,1)] flex flex-col">
                <div className={`${feature.color} w-16 h-16 border-4 border-black flex items-center justify-center text-3xl font-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8 rotate-[-3deg]`}>
                  {feature.step}
                </div>
                <h3 className="text-3xl font-black uppercase mb-4">{feature.title}</h3>
                <p className="font-bold text-gray-700 text-lg leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
