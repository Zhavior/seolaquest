'use client'

import { motion, Variants } from 'framer-motion'
import { Save, Settings, User, Mail, Shield, Webhook, HelpCircle, Bug, Scroll, MessageSquare, Sparkles } from 'lucide-react'
import { sfx } from '@/lib/sfx'
import { useSettingsForm } from '@/features/profile/hooks/useSettingsForm'

import GuildLawsModal from '@/features/settings/components/GuildLawsModal'
import DangerZoneCard from '@/features/settings/components/DangerZoneCard'

export default function SettingsClient({ initial }: { initial: { name: string; title: string; email: string; emailDigest: boolean; radarAlerts: boolean; crmWebhookUrl: string } }) {
  const {
    values,
    setField,
    isPending,
    notice,
    setNotice,
    save,
    isLawsOpen,
    setIsLawsOpen,
  } = useSettingsForm(initial)

  function handleToast(msg: string) {
    setNotice(msg)
  }

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  }

  const item: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 22 } }
  }

  return (
    <div className="min-h-[100dvh] w-full bg-surface relative select-none">
      {/* Authentic Parchment / Commander's Map Paper Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.07]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'multiply'
        }}
      />

      <div className="min-h-[100dvh] w-full max-w-[1400px] mx-auto p-4 md:p-8 font-black relative z-10">
        {/* Subtle Background Settings Emblem */}
        <div className="hidden md:block absolute top-0 right-0 -mr-24 -mt-24 opacity-[0.06] pointer-events-none">
          <Settings className="w-[650px] h-[650px] text-ink" />
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-8 relative z-10"
        >
          {/* Neo-Brutalist Ticker Banner */}
          <motion.div variants={item} className="w-full overflow-hidden border-4 border-outline bg-accent py-2 flex whitespace-nowrap shadow-brutal">
            <motion.div 
              animate={{ x: [0, -1000] }} 
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
              className="flex gap-10 text-lg md:text-xl uppercase tracking-widest font-black"
            >
              {[...Array(10)].map((_, i) => (
                <span key={i} className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-ink" /> ⚙️ BASECAMP SETTINGS LEDGER <Sparkles className="w-5 h-5 text-ink" /> 🛡️ ADVENTURER PREFERENCES & INTEGRATIONS
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Header */}
          <motion.div variants={item} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mt-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Settings className="w-8 h-8 text-[#06B6D4]" />
                <span className="bg-black text-[#FFE600] uppercase text-xs font-black tracking-widest px-3 py-1 border-2 border-outline -rotate-1">
                  COMMANDER&apos;S BASECAMP CONFIG
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl uppercase tracking-tight text-white drop-shadow-brutal-lg flex items-center gap-3" style={{ WebkitTextStroke: '2px black' }}>
                Basecamp Settings
              </h1>
              <p className="text-xl md:text-2xl mt-2 uppercase bg-black text-white inline-block px-4 py-1 -rotate-1 border-2 border-outline">
                Configure your adventurer profile, integrations, and operational scrolls
              </p>
            </div>
            
            <div className="flex items-center gap-3 border-4 border-outline bg-card px-5 py-3 shadow-brutal-lg">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-success border-2 border-outline"></span>
              </span>
              <div className="flex flex-col">
                <span className="text-xs uppercase text-ink-muted font-bold">Config Status</span>
                <span className="text-lg uppercase font-black leading-none text-ink">Ready & Synced</span>
              </div>
            </div>
          </motion.div>

          {notice && (
            <motion.div variants={item} role="status" className="border-4 border-outline bg-success p-4 font-black uppercase flex items-center justify-between shadow-brutal animate-in fade-in">
              <span>{notice}</span>
              <button
                onClick={() => {
                  sfx.playHoverBlip()
                  setNotice('')
                }}
                className="border-2 border-outline bg-card px-3 py-1 font-black hover:bg-inset transition-colors shadow-brutal-sm"
              >
                X
              </button>
            </motion.div>
          )}

          {/* Operations Center 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT COLUMN: ADVENTURER & GUILD */}
            <div className="space-y-8 flex flex-col">
              {/* Profile Section */}
              <motion.section variants={item} className="border-4 border-outline bg-card shadow-brutal-lg flex flex-col">
                <div className="border-b-4 border-outline bg-info p-4 flex items-center gap-3">
                  <User className="text-on-accent" size={28} />
                  <h2 className="text-2xl font-black uppercase">Adventurer Profile</h2>
                </div>
                <div className="p-6 space-y-6 grow bg-canvas">
                  <label className="block">
                    <span className="font-black uppercase flex items-center gap-2 mb-2">Display Name</span>
                    <input 
                      value={values.name} 
                      onChange={(event) => setField('name', event.target.value)} 
                      className="w-full border-3 border-outline bg-card p-3 font-bold focus:outline-none focus:ring-4 focus:ring-black focus:translate-x-1 focus:-translate-y-1 transition-transform" 
                    />
                  </label>
                  <label className="block">
                    <span className="font-black uppercase flex items-center gap-2 mb-2">Hunter Title</span>
                    <input 
                      value={values.title} 
                      onChange={(event) => setField('title', event.target.value)} 
                      className="w-full border-3 border-outline bg-card p-3 font-bold focus:outline-none focus:ring-4 focus:ring-black focus:translate-x-1 focus:-translate-y-1 transition-transform" 
                    />
                  </label>
                  <div className="pt-4 border-t-3 border-outline border-dashed">
                    <p className="font-bold flex items-center gap-2 uppercase">
                      <Shield size={18} /> Signed-in email
                    </p>
                    <p className="font-black bg-black text-white px-3 py-2 mt-2 inline-block shadow-brutal-sm">
                      {initial.email || 'Not provided'}
                    </p>
                  </div>
                </div>
              </motion.section>

              {/* Integrations Section */}
              <motion.section variants={item} className="border-4 border-outline bg-card shadow-brutal-lg">
                <div className="border-b-4 border-outline bg-accent-2 p-4 flex items-center gap-3">
                  <Webhook className="text-white" size={28} />
                  <h2 className="text-2xl font-black uppercase text-white">Guild Integrations</h2>
                </div>
                <div className="p-6 bg-canvas">
                  <label className="block">
                    <span className="font-black uppercase flex items-center gap-2 mb-2">CRM Webhook URL</span>
                    <input 
                      value={values.crmWebhookUrl} 
                      onChange={(event) => setField('crmWebhookUrl', event.target.value)} 
                      placeholder="https://hooks.zapier.com/..." 
                      className="w-full border-3 border-outline bg-card p-3 font-bold focus:outline-none focus:ring-4 focus:ring-black focus:translate-x-1 focus:-translate-y-1 transition-transform" 
                    />
                  </label>
                  <p className="mt-3 text-xs font-bold text-ink-muted uppercase">
                    Connect your lead discoveries directly to Zapier, Make, or custom CRM endpoints.
                  </p>
                </div>
              </motion.section>

              {/* Scrolls & Alerts Section */}
              <motion.section variants={item} className="border-4 border-outline bg-card shadow-brutal-lg">
                <div className="border-b-4 border-outline bg-success p-4 flex items-center gap-3">
                  <Mail className="text-on-accent" size={28} />
                  <h2 className="text-2xl font-black uppercase">Scrolls & Alerts</h2>
                </div>
                <div className="p-6 bg-canvas space-y-4">
                  <p className="border-3 border-outline bg-accent p-3 text-xs font-black uppercase">
                    Delivery is not active. These stored preferences do not send email or browser notifications.
                  </p>
                  <label className="flex items-center gap-4 p-3 border-3 border-outline bg-card opacity-70 shadow-brutal-sm">
                    <input 
                      type="checkbox" 
                      checked={values.emailDigest} 
                      disabled
                      readOnly
                      className="w-6 h-6 border-3 border-outline accent-[#06B6D4]"
                    /> 
                    <span className="font-black uppercase text-lg">Email digest preference (not active)</span>
                  </label>
                  <label className="flex items-center gap-4 p-3 border-3 border-outline bg-card opacity-70 shadow-brutal-sm">
                    <input 
                      type="checkbox" 
                      checked={values.radarAlerts} 
                      disabled
                      readOnly
                      className="w-6 h-6 border-3 border-outline accent-[#06B6D4]"
                    /> 
                    <span className="font-black uppercase text-lg">Browser alert preference (not active)</span>
                  </label>
                </div>
              </motion.section>
            </div>

            {/* RIGHT COLUMN: SUPPORT & OPERATIONS */}
            <div className="space-y-8 flex flex-col">
              {/* Guild Laws & Refund Terms */}
              <motion.section variants={item} className="border-4 border-outline bg-card shadow-brutal-lg">
                <div className="border-b-4 border-outline bg-info p-4 flex items-center gap-3">
                  <Shield className="text-on-accent" size={28} />
                  <h2 className="text-2xl font-black uppercase text-on-accent">Guild Laws & Laws of Mana</h2>
                </div>
                <div className="p-6 bg-canvas space-y-4">
                  <p className="text-sm font-bold text-ink uppercase">
                    Review the official Guild Codex, refund terms, Mana replenishment rules, and account cancellation guidelines.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      sfx.playHoverBlip()
                      setIsLawsOpen(true)
                    }}
                    className="w-full flex items-center justify-center gap-2 border-3 border-outline bg-accent px-4 py-3 font-black uppercase text-on-accent shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                  >
                    <HelpCircle size={20} /> Billing, cancellation & refund terms
                  </button>
                </div>
              </motion.section>

              {/* Communications & Feedback */}
              <motion.section variants={item} className="border-4 border-outline bg-card shadow-brutal-lg">
                <div className="border-b-4 border-outline bg-accent p-4 flex items-center gap-3">
                  <Scroll className="text-on-accent" size={28} />
                  <h2 className="text-2xl font-black uppercase text-on-accent">Communications & Feedback</h2>
                </div>
                <div className="p-6 bg-canvas space-y-3">
                  {/* Slay a Glitch */}
                  <button
                    type="button"
                    disabled
                    className="w-full flex items-center justify-center gap-2 border-3 border-outline bg-accent-2 px-4 py-3 font-black uppercase text-white opacity-60 shadow-brutal-sm"
                  >
                    <Bug size={20} /> Bug submission unavailable
                  </button>

                  {/* Send Scroll */}
                  <button
                    type="button"
                    disabled
                    className="w-full flex items-center justify-center gap-2 border-3 border-outline bg-success px-4 py-3 font-black uppercase text-on-accent opacity-60 shadow-brutal-sm"
                  >
                    <Scroll size={20} /> Feedback submission unavailable
                  </button>

                  <p className="border-2 border-outline bg-card p-3 text-xs font-bold uppercase text-ink-muted">
                    No durable feedback destination is configured, so these controls submit nothing.
                  </p>

                  {/* Contact Guild Masters */}
                  <a
                    href="mailto:support@seolaquest.com?subject=Guild%20Master%20Dispatch"
                    onClick={() => sfx.playHoverBlip()}
                    className="w-full flex items-center justify-center gap-2 border-3 border-outline bg-card px-4 py-3 font-black uppercase text-ink shadow-brutal-sm hover:bg-inset hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                  >
                    <MessageSquare size={20} /> ✉️ Contact Guild Masters
                  </a>
                </div>
              </motion.section>

              {/* Danger Zone */}
              <motion.div variants={item}>
                <DangerZoneCard onSuccessToast={handleToast} />
              </motion.div>
            </div>
          </div>

          {/* Save All Settings Bar */}
          <motion.div variants={item} className="flex justify-end pt-4">
            <button 
              type="button" 
              onClick={save} 
              disabled={isPending} 
              className="flex items-center gap-3 border-4 border-outline bg-info px-8 py-4 text-xl font-black uppercase text-on-accent shadow-brutal-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-brutal-sm transition-all disabled:opacity-50 disabled:pointer-events-none active:translate-x-2 active:translate-y-2 active:shadow-none"
            >
              <Save size={24} /> {isPending ? 'Saving Changes…' : 'Save All Settings'}
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Modals */}
      <GuildLawsModal isOpen={isLawsOpen} onClose={() => setIsLawsOpen(false)} />
    </div>
  )
}
