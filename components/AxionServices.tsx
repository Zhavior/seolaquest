'use client'

import React, { useState } from 'react'

interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

export function AxionServices() {
  const [activeTab, setActiveTab] = useState<'billing' | 'x' | 'gemini'>('billing')

  // Stripe state
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // X state
  const [xText, setXText] = useState('')
  const [xPosting, setXPosting] = useState(false)
  const [xSuccessId, setXSuccessId] = useState<string | null>(null)
  const [xError, setXError] = useState<string | null>(null)

  // Gemini state
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [chatSending, setChatSending] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    setCheckoutError(null)

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()

      if (!res.ok) {
        setCheckoutError(data.error || 'Failed to initiate checkout.')
        setCheckoutLoading(false)
        return
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        setCheckoutError('No checkout URL returned.')
        setCheckoutLoading(false)
      }
    } catch {
      setCheckoutError('Network error. Unable to connect to checkout service.')
      setCheckoutLoading(false)
    }
  }

  const handleXPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!xText.trim() || xText.length > 280 || xPosting) return

    setXPosting(true)
    setXError(null)
    setXSuccessId(null)

    try {
      const res = await fetch('/api/x/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: xText }),
      })
      const data = await res.json()

      if (!res.ok) {
        setXError(data.error || 'Failed to publish post to X.')
      } else {
        setXSuccessId(data.id)
        setXText('')
      }
    } catch {
      setXError('Network error while posting to X.')
    } finally {
      setXPosting(false)
    }
  }

  const handleChatSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!chatInput.trim() || chatSending) return

    const userMessage = chatInput.trim()
    setChatInput('')
    setChatError(null)

    const updatedHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: userMessage }]
    setChatHistory(updatedHistory)
    setChatSending(true)

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: chatHistory.slice(-10), // Send last 10 messages for context
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setChatError(data.error || 'Failed to get response from Gemini.')
      } else if (data.reply) {
        setChatHistory((prev) => [...prev, { role: 'model', content: data.reply }])
      }
    } catch {
      setChatError('Network error. Failed to communicate with Gemini assistant.')
    } finally {
      setChatSending(false)
    }
  }

  const handleKeyDownChat = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleChatSubmit()
    }
  }

  return (
    <section className="w-full max-w-4xl mx-auto my-12 px-4">
      <div className="bg-white border-2 border-black shadow-[4px_4px_0_0_#000] p-6 rounded-none">
        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-2">
          Axion Core Platform Services
        </h2>
        <p className="text-sm text-black/70 mb-6">
          Production-ready integrated workflows for billing, social publishing, and AI assistant chat.
        </p>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 border-b-2 border-black pb-4 mb-6" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'billing'}
            onClick={() => setActiveTab('billing')}
            className={`touch-target px-4 py-2 font-bold uppercase text-sm border-2 border-black transition-all ${
              activeTab === 'billing'
                ? 'bg-[#FFE600] text-black shadow-[2px_2px_0_0_#000]'
                : 'bg-zinc-100 text-black/80 hover:bg-zinc-200'
            }`}
          >
            💳 Stripe Billing
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'x'}
            onClick={() => setActiveTab('x')}
            className={`touch-target px-4 py-2 font-bold uppercase text-sm border-2 border-black transition-all ${
              activeTab === 'x'
                ? 'bg-[#FFE600] text-black shadow-[2px_2px_0_0_#000]'
                : 'bg-zinc-100 text-black/80 hover:bg-zinc-200'
            }`}
          >
            📢 Publish to X
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'gemini'}
            onClick={() => setActiveTab('gemini')}
            className={`touch-target px-4 py-2 font-bold uppercase text-sm border-2 border-black transition-all ${
              activeTab === 'gemini'
                ? 'bg-[#FFE600] text-black shadow-[2px_2px_0_0_#000]'
                : 'bg-zinc-100 text-black/80 hover:bg-zinc-200'
            }`}
          >
            🤖 Gemini Chat
          </button>
        </div>

        {/* Tab 1: Billing */}
        {activeTab === 'billing' && (
          <div role="tabpanel" className="space-y-4">
            <div className="bg-zinc-50 border-2 border-black p-4">
              <h3 className="font-bold text-lg text-black mb-1">Subscription Upgrade</h3>
              <p className="text-sm text-black/70 mb-4">
                Subscribe to Axion Pro plan for full platform features and unthrottled API access.
              </p>

              {checkoutError && (
                <div
                  className="mb-4 p-3 bg-red-100 border-2 border-red-500 text-red-900 text-sm font-semibold"
                  role="alert"
                >
                  ⚠️ {checkoutError}
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="touch-target px-6 py-3 bg-[#FF4500] text-white font-extrabold uppercase border-2 border-black shadow-[3px_3px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? 'Redirecting to Stripe...' : 'Upgrade Now ($29/mo)'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: X Posting */}
        {activeTab === 'x' && (
          <div role="tabpanel" className="space-y-4">
            <form onSubmit={handleXPost} className="space-y-4">
              <div>
                <label htmlFor="x-post-input" className="block text-sm font-bold uppercase text-black mb-1">
                  Draft Post for X / Twitter
                </label>
                <textarea
                  id="x-post-input"
                  rows={4}
                  value={xText}
                  onChange={(e) => setXText(e.target.value)}
                  maxLength={280}
                  placeholder="What's happening in your product today?"
                  className="w-full p-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-[#FFE600] text-black font-sans text-base"
                />
                <div className="flex justify-between items-center text-xs mt-1 font-mono text-black/70">
                  <span>Authorized server-side OAuth 1.0a dispatch</span>
                  <span className={xText.length > 260 ? 'text-red-600 font-bold' : ''}>
                    {xText.length} / 280
                  </span>
                </div>
              </div>

              {xError && (
                <div
                  className="p-3 bg-red-100 border-2 border-red-500 text-red-900 text-sm font-semibold"
                  role="alert"
                >
                  ⚠️ {xError}
                </div>
              )}

              {xSuccessId && (
                <div
                  className="p-3 bg-green-100 border-2 border-green-600 text-green-950 text-sm font-semibold"
                  role="status"
                >
                  ✅ Published successfully! Post ID: <span className="font-mono">{xSuccessId}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={xPosting || !xText.trim()}
                className="touch-target px-6 py-3 bg-[#000000] text-white font-extrabold uppercase border-2 border-black shadow-[3px_3px_0_0_#FFE600] hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {xPosting ? 'Posting to X...' : 'Post to X'}
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Gemini Chat */}
        {activeTab === 'gemini' && (
          <div role="tabpanel" className="space-y-4">
            <div className="border-2 border-black bg-zinc-50 h-80 overflow-y-auto p-4 space-y-3">
              {chatHistory.length === 0 ? (
                <div className="text-center text-black/50 text-sm py-12">
                  👋 Ask Axion’s Gemini Assistant anything about your product workflows.
                </div>
              ) : (
                chatHistory.map((msg: ChatMessage, index: number) => (
                  <div
                    key={index}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] font-mono uppercase text-black/60 mb-0.5">
                      {msg.role === 'user' ? 'You' : 'Gemini Assistant'}
                    </span>
                    <div
                      className={`max-w-[85%] p-3 border-2 border-black text-sm break-word-safe ${
                        msg.role === 'user'
                          ? 'bg-[#FFE600] text-black font-medium shadow-[2px_2px_0_0_#000]'
                          : 'bg-white text-black shadow-[2px_2px_0_0_#000]'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {chatSending && (
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-mono uppercase text-black/60 mb-0.5">
                    Gemini Assistant
                  </span>
                  <div className="bg-white border-2 border-black p-3 text-xs italic text-black/70 animate-pulse">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            {chatError && (
              <div
                className="p-3 bg-red-100 border-2 border-red-500 text-red-900 text-sm font-semibold"
                role="alert"
              >
                ⚠️ {chatError}
              </div>
            )}

            <form onSubmit={handleChatSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <label htmlFor="gemini-chat-input" className="sr-only">
                  Type your prompt for Gemini
                </label>
                <textarea
                  id="gemini-chat-input"
                  rows={2}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDownChat}
                  placeholder="Ask Gemini... (Cmd/Ctrl + Enter to send)"
                  className="w-full p-2.5 border-2 border-black text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#FFE600]"
                />
              </div>
              <button
                type="submit"
                disabled={chatSending || !chatInput.trim()}
                className="touch-target self-end px-6 py-3 bg-[#FF4500] text-white font-extrabold uppercase border-2 border-black shadow-[3px_3px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {chatSending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}
