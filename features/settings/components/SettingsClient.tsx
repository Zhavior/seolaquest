'use client'

import { Save, Settings, User, Mail, Shield, Webhook, HelpCircle, Bug, Scroll, MessageSquare } from 'lucide-react'
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

  return (
    <div className="min-h-screen max-w-6xl mx-auto p-4 md:p-8 space-y-8 text-black">
      <header className="border-4 border-black bg-[#FFE600] p-6 shadow-[7px_7px_0_0_#000]">
        <h1 className="flex items-center gap-3 text-4xl font-black uppercase tracking-tight">
          <Settings size={36} /> Basecamp Settings
        </h1>
        <p className="mt-2 font-bold text-gray-800 text-lg uppercase">
          Configure your adventurer profile, integrations, and operational scrolls.
        </p>
      </header>

      {notice && (
        <div role="status" className="border-4 border-black bg-[#A3E635] p-4 font-black uppercase flex items-center justify-between shadow-[5px_5px_0_0_#000] animate-in fade-in">
          <span>{notice}</span>
          <button
            onClick={() => {
              sfx.playHoverBlip()
              setNotice('')
            }}
            className="border-2 border-black bg-white px-3 py-1 font-black hover:bg-gray-100 transition-colors shadow-[2px_2px_0_0_#000]"
          >
            X
          </button>
        </div>
      )}

      {/* Operations Center 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN: ADVENTURER & GUILD */}
        <div className="space-y-8 flex flex-col">
          {/* Profile Section */}
          <section className="border-4 border-black bg-white shadow-[7px_7px_0_0_#000] flex flex-col">
            <div className="border-b-4 border-black bg-[#06B6D4] p-4 flex items-center gap-3">
              <User className="text-black" size={28} />
              <h2 className="text-2xl font-black uppercase">Adventurer Profile</h2>
            </div>
            <div className="p-6 space-y-6 grow bg-[#F4F0EA]">
              <label className="block">
                <span className="font-black uppercase flex items-center gap-2 mb-2">Display Name</span>
                <input 
                  value={values.name} 
                  onChange={(event) => setField('name', event.target.value)} 
                  className="w-full border-3 border-black bg-white p-3 font-bold focus:outline-none focus:ring-4 focus:ring-black focus:translate-x-1 focus:-translate-y-1 transition-transform" 
                />
              </label>
              <label className="block">
                <span className="font-black uppercase flex items-center gap-2 mb-2">Hunter Title</span>
                <input 
                  value={values.title} 
                  onChange={(event) => setField('title', event.target.value)} 
                  className="w-full border-3 border-black bg-white p-3 font-bold focus:outline-none focus:ring-4 focus:ring-black focus:translate-x-1 focus:-translate-y-1 transition-transform" 
                />
              </label>
              <div className="pt-4 border-t-3 border-black border-dashed">
                <p className="font-bold flex items-center gap-2 uppercase">
                  <Shield size={18} /> Signed-in email
                </p>
                <p className="font-black bg-black text-white px-3 py-2 mt-2 inline-block shadow-[3px_3px_0_0_#000]">
                  {initial.email || 'Not provided'}
                </p>
              </div>
            </div>
          </section>

          {/* Integrations Section */}
          <section className="border-4 border-black bg-white shadow-[7px_7px_0_0_#000]">
            <div className="border-b-4 border-black bg-[#FF5722] p-4 flex items-center gap-3">
              <Webhook className="text-white" size={28} />
              <h2 className="text-2xl font-black uppercase text-white">Guild Integrations</h2>
            </div>
            <div className="p-6 bg-[#F4F0EA]">
              <label className="block">
                <span className="font-black uppercase flex items-center gap-2 mb-2">CRM Webhook URL</span>
                <input 
                  value={values.crmWebhookUrl} 
                  onChange={(event) => setField('crmWebhookUrl', event.target.value)} 
                  placeholder="https://hooks.zapier.com/..." 
                  className="w-full border-3 border-black bg-white p-3 font-bold focus:outline-none focus:ring-4 focus:ring-black focus:translate-x-1 focus:-translate-y-1 transition-transform" 
                />
              </label>
              <p className="mt-3 text-xs font-bold text-gray-700 uppercase">
                Connect your lead discoveries directly to Zapier, Make, or custom CRM endpoints.
              </p>
            </div>
          </section>

          {/* Scrolls & Alerts Section */}
          <section className="border-4 border-black bg-white shadow-[7px_7px_0_0_#000]">
            <div className="border-b-4 border-black bg-[#A3E635] p-4 flex items-center gap-3">
              <Mail className="text-black" size={28} />
              <h2 className="text-2xl font-black uppercase">Scrolls & Alerts</h2>
            </div>
            <div className="p-6 bg-[#F4F0EA] space-y-4">
              <p className="border-3 border-black bg-[#FFE600] p-3 text-xs font-black uppercase">
                Delivery is not active. These stored preferences do not send email or browser notifications.
              </p>
              <label className="flex items-center gap-4 p-3 border-3 border-black bg-white opacity-70 shadow-[2px_2px_0_0_#000]">
                <input 
                  type="checkbox" 
                  checked={values.emailDigest} 
                  disabled
                  readOnly
                  className="w-6 h-6 border-3 border-black accent-[#06B6D4]"
                /> 
                <span className="font-black uppercase text-lg">Email digest preference (not active)</span>
              </label>
              <label className="flex items-center gap-4 p-3 border-3 border-black bg-white opacity-70 shadow-[2px_2px_0_0_#000]">
                <input 
                  type="checkbox" 
                  checked={values.radarAlerts} 
                  disabled
                  readOnly
                  className="w-6 h-6 border-3 border-black accent-[#06B6D4]"
                /> 
                <span className="font-black uppercase text-lg">Browser alert preference (not active)</span>
              </label>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: SUPPORT & OPERATIONS */}
        <div className="space-y-8 flex flex-col">
          {/* Guild Laws & Refund Terms */}
          <section className="border-4 border-black bg-white shadow-[7px_7px_0_0_#000]">
            <div className="border-b-4 border-black bg-[#06B6D4] p-4 flex items-center gap-3">
              <Shield className="text-black" size={28} />
              <h2 className="text-2xl font-black uppercase text-black">Guild Laws & Laws of Mana</h2>
            </div>
            <div className="p-6 bg-[#F4F0EA] space-y-4">
              <p className="text-sm font-bold text-gray-800 uppercase">
                Review the official Guild Codex, refund terms, Mana replenishment rules, and account cancellation guidelines.
              </p>
              <button
                type="button"
                onClick={() => {
                  sfx.playHoverBlip()
                  setIsLawsOpen(true)
                }}
                className="w-full flex items-center justify-center gap-2 border-3 border-black bg-[#FFE600] px-4 py-3 font-black uppercase text-black shadow-[3px_3px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
              >
                <HelpCircle size={20} /> Billing, cancellation & refund terms
              </button>
            </div>
          </section>

          {/* Communications & Feedback */}
          <section className="border-4 border-black bg-white shadow-[7px_7px_0_0_#000]">
            <div className="border-b-4 border-black bg-[#FFE600] p-4 flex items-center gap-3">
              <Scroll className="text-black" size={28} />
              <h2 className="text-2xl font-black uppercase text-black">Communications & Feedback</h2>
            </div>
            <div className="p-6 bg-[#F4F0EA] space-y-3">
              {/* Slay a Glitch */}
              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-2 border-3 border-black bg-[#FF5722] px-4 py-3 font-black uppercase text-white opacity-60 shadow-[3px_3px_0_0_#000]"
              >
                <Bug size={20} /> Bug submission unavailable
              </button>

              {/* Send Scroll */}
              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-2 border-3 border-black bg-[#A3E635] px-4 py-3 font-black uppercase text-black opacity-60 shadow-[3px_3px_0_0_#000]"
              >
                <Scroll size={20} /> Feedback submission unavailable
              </button>

              <p className="border-2 border-black bg-white p-3 text-xs font-bold uppercase text-gray-700">
                No durable feedback destination is configured, so these controls submit nothing.
              </p>

              {/* Contact Guild Masters */}
              <a
                href="mailto:support@seolaquest.com?subject=Guild%20Master%20Dispatch"
                onClick={() => sfx.playHoverBlip()}
                className="w-full flex items-center justify-center gap-2 border-3 border-black bg-white px-4 py-3 font-black uppercase text-black shadow-[3px_3px_0_0_#000] hover:bg-gray-100 hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
              >
                <MessageSquare size={20} /> ✉️ Contact Guild Masters
              </a>
            </div>
          </section>

          {/* Danger Zone */}
          <DangerZoneCard onSuccessToast={handleToast} />
        </div>
      </div>

      {/* Save All Settings Bar */}
      <div className="flex justify-end pt-4">
        <button 
          type="button" 
          onClick={save} 
          disabled={isPending} 
          className="flex items-center gap-3 border-4 border-black bg-[#06B6D4] px-8 py-4 text-xl font-black uppercase text-black shadow-[6px_6px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_#000] transition-all disabled:opacity-50 disabled:pointer-events-none active:translate-x-2 active:translate-y-2 active:shadow-none"
        >
          <Save size={24} /> {isPending ? 'Saving Changes…' : 'Save All Settings'}
        </button>
      </div>

      {/* Modals */}
      <GuildLawsModal isOpen={isLawsOpen} onClose={() => setIsLawsOpen(false)} />
    </div>
  )
}
