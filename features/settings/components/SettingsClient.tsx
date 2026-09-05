'use client'

import { motion, Variants } from 'framer-motion'
import { Save, User, Mail, Shield, Webhook, HelpCircle, Bug, Scroll, MessageSquare } from 'lucide-react'
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
    <div className="min-h-[100dvh] w-full bg-canvas relative">
      <div className="min-h-[100dvh] w-full max-w-[1400px] mx-auto p-4 md:p-8 relative z-10">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-8 relative z-10"
        >
          <motion.header variants={item} className="space-y-3">
            <p className="text-xs font-medium tracking-wide text-ink-muted">Your workspace</p>
            <h1 className="font-display text-4xl tracking-tight text-ink sm:text-5xl">Settings</h1>
            <p className="max-w-2xl text-base leading-relaxed text-ink-muted">
              Manage your profile, integrations, and saved preferences.
            </p>
          </motion.header>

          {notice && (
            <motion.div variants={item} role="status" className="rounded-[20px] border border-outline bg-card p-4 font-medium normal-case flex items-center justify-between shadow-sm animate-in fade-in">
              <span>{notice}</span>
              <button
                onClick={() => {
                  sfx.playHoverBlip()
                  setNotice('')
                }}
                aria-label="Dismiss notice"
                className="min-h-11 rounded-lg border border-outline bg-card px-3 py-1 font-semibold hover:bg-inset transition-colors shadow-none"
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
              <motion.section variants={item} className="rounded-[20px] border border-outline bg-card shadow-sm overflow-hidden flex flex-col">
                <div className="border-b border-outline bg-highlight p-4 flex items-center gap-3">
                  <User className="text-on-accent" size={28} />
                  <h2 className="font-display text-2xl font-semibold normal-case">Adventurer Profile</h2>
                </div>
                <div className="p-6 space-y-6 grow bg-card">
                  <label className="block">
                    <span className="font-semibold normal-case flex items-center gap-2 mb-2">Display Name</span>
                    <input
                      value={values.name}
                      onChange={(event) => setField('name', event.target.value)}
                      className="w-full rounded-[20px] border border-outline bg-card p-3 font-medium focus:outline-none focus:ring-4 focus:ring-accent  transition-transform"
                    />
                  </label>
                  <label className="block">
                    <span className="font-semibold normal-case flex items-center gap-2 mb-2">Hunter Title</span>
                    <input
                      value={values.title}
                      onChange={(event) => setField('title', event.target.value)}
                      className="w-full rounded-[20px] border border-outline bg-card p-3 font-medium focus:outline-none focus:ring-4 focus:ring-accent  transition-transform"
                    />
                  </label>
                  <div className="pt-4 border-t border-outline border-dashed">
                    <p className="font-medium flex items-center gap-2 normal-case">
                      <Shield size={18} /> Signed-in email
                    </p>
                    <p className="font-semibold bg-black text-white px-3 py-2 mt-2 inline-block shadow-none">
                      {initial.email || 'Not provided'}
                    </p>
                  </div>
                </div>
              </motion.section>

              {/* Integrations Section */}
              <motion.section variants={item} className="rounded-[20px] border border-outline bg-card shadow-sm overflow-hidden">
                <div className="border-b border-outline bg-forest p-4 flex items-center gap-3">
                  <Webhook className="text-on-forest" size={28} />
                  <h2 className="font-display text-2xl font-semibold normal-case text-on-forest">Guild Integrations</h2>
                </div>
                <div className="p-6 bg-card">
                  <label className="block">
                    <span className="font-semibold normal-case flex items-center gap-2 mb-2">CRM Webhook URL</span>
                    <input
                      value={values.crmWebhookUrl}
                      onChange={(event) => setField('crmWebhookUrl', event.target.value)}
                      placeholder="https://hooks.zapier.com/..."
                      className="w-full rounded-[20px] border border-outline bg-card p-3 font-medium focus:outline-none focus:ring-4 focus:ring-accent  transition-transform"
                    />
                  </label>
                  <p className="mt-3 text-xs font-medium text-ink-muted normal-case">
                    Connect your lead discoveries directly to Zapier, Make, or custom CRM endpoints.
                  </p>
                </div>
              </motion.section>

              {/* Scrolls & Alerts Section */}
              <motion.section variants={item} className="rounded-[20px] border border-outline bg-card shadow-sm overflow-hidden">
                <div className="border-b border-outline bg-highlight p-4 flex items-center gap-3">
                  <Mail className="text-on-accent" size={28} />
                  <h2 className="font-display text-2xl font-semibold normal-case">Scrolls & Alerts</h2>
                </div>
                <div className="p-6 bg-card space-y-4">
                  <p className="rounded-[20px] border border-outline bg-accent p-3 text-xs font-semibold normal-case">
                    Delivery is not active. These stored preferences do not send email or browser notifications.
                  </p>
                  <label className="flex items-center gap-4 p-3 rounded-[20px] border border-outline bg-card opacity-70 shadow-none">
                    <input
                      type="checkbox"
                      checked={values.emailDigest}
                      disabled
                      readOnly
                      className="w-6 h-6 rounded-[20px] border border-outline accent-[#06B6D4]"
                    />
                    <span className="font-semibold normal-case text-lg">Email digest preference (not active)</span>
                  </label>
                  <label className="flex items-center gap-4 p-3 rounded-[20px] border border-outline bg-card opacity-70 shadow-none">
                    <input
                      type="checkbox"
                      checked={values.radarAlerts}
                      disabled
                      readOnly
                      className="w-6 h-6 rounded-[20px] border border-outline accent-[#06B6D4]"
                    />
                    <span className="font-semibold normal-case text-lg">Browser alert preference (not active)</span>
                  </label>
                </div>
              </motion.section>
            </div>

            {/* RIGHT COLUMN: SUPPORT & OPERATIONS */}
            <div className="space-y-8 flex flex-col">
              {/* Guild Laws & Refund Terms */}
              <motion.section variants={item} className="rounded-[20px] border border-outline bg-card shadow-sm overflow-hidden">
                <div className="border-b border-outline bg-highlight p-4 flex items-center gap-3">
                  <Shield className="text-on-accent" size={28} />
                  <h2 className="font-display text-2xl font-semibold normal-case text-on-accent">Guild Laws & Laws of Mana</h2>
                </div>
                <div className="p-6 bg-card space-y-4">
                  <p className="text-sm font-medium text-ink normal-case">
                    Review the official Guild Codex, refund terms, Mana replenishment rules, and account cancellation guidelines.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      sfx.playHoverBlip()
                      setIsLawsOpen(true)
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-[20px] border border-outline bg-accent px-4 py-3 font-semibold normal-case text-on-accent shadow-none hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                  >
                    <HelpCircle size={20} /> Billing, cancellation & refund terms
                  </button>
                </div>
              </motion.section>

              {/* Communications & Feedback */}
              <motion.section variants={item} className="rounded-[20px] border border-outline bg-card shadow-sm overflow-hidden">
                <div className="border-b border-outline bg-highlight p-4 flex items-center gap-3">
                  <Scroll className="text-on-accent" size={28} />
                  <h2 className="font-display text-2xl font-semibold normal-case text-on-accent">Communications & Feedback</h2>
                </div>
                <div className="p-6 bg-card space-y-3">
                  {/* Slay a Glitch */}
                  <button
                    type="button"
                    disabled
                    className="w-full flex items-center justify-center gap-2 rounded-[20px] border border-outline bg-accent-2 px-4 py-3 font-semibold normal-case text-on-accent opacity-60 shadow-none"
                  >
                    <Bug size={20} /> Bug submission unavailable
                  </button>

                  {/* Send Scroll */}
                  <button
                    type="button"
                    disabled
                    className="w-full flex items-center justify-center gap-2 rounded-[20px] border border-outline bg-success px-4 py-3 font-semibold normal-case text-on-accent opacity-60 shadow-none"
                  >
                    <Scroll size={20} /> Feedback submission unavailable
                  </button>

                  <p className="rounded-lg border border-outline bg-card p-3 text-xs font-medium normal-case text-ink-muted">
                    No durable feedback destination is configured, so these controls submit nothing.
                  </p>

                  {/* Contact Guild Masters */}
                  <a
                    href="mailto:support@seolaquest.com?subject=Guild%20Master%20Dispatch"
                    onClick={() => sfx.playHoverBlip()}
                    className="w-full flex items-center justify-center gap-2 rounded-[20px] border border-outline bg-card px-4 py-3 font-semibold normal-case text-ink shadow-none hover:bg-inset hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
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
              className="flex items-center gap-3 rounded-[20px] border border-outline bg-accent px-8 py-3 text-base font-semibold normal-case text-on-accent shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:pointer-events-none active:translate-x-2 active:translate-y-2 active:shadow-none"
            >
              <Save size={20} /> {isPending ? 'Saving Changes…' : 'Save All Settings'}
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Modals */}
      <GuildLawsModal isOpen={isLawsOpen} onClose={() => setIsLawsOpen(false)} />
    </div>
  )
}
