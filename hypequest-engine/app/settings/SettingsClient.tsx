'use client'

import { useState, useTransition } from 'react'
import { Save, Settings, User, Mail, Shield, Webhook } from 'lucide-react'
import { updateSettingsAction } from '../actions'

export default function SettingsClient({ initial }: { initial: { name: string; title: string; email: string; emailDigest: boolean; radarAlerts: boolean; crmWebhookUrl: string } }) {
  const [name, setName] = useState(initial.name)
  const [title, setTitle] = useState(initial.title)
  const [crmWebhookUrl, setCrmWebhookUrl] = useState(initial.crmWebhookUrl)
  const [emailDigest, setEmailDigest] = useState(initial.emailDigest)
  const [radarAlerts, setRadarAlerts] = useState(initial.radarAlerts)
  const [notice, setNotice] = useState('')
  const [pending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      const result = await updateSettingsAction({ name, title, emailDigest, radarAlerts, crmWebhookUrl })
      setNotice(result.ok ? 'Settings saved successfully.' : result.message ?? 'Could not save settings.')
    })
  }

  return (
    <div className="min-h-screen max-w-5xl mx-auto p-4 md:p-8 space-y-8 text-black">
      <header className="border-4 border-black bg-[#FFE600] p-6 shadow-[7px_7px_0_0_#000]">
        <h1 className="flex items-center gap-3 text-4xl font-black uppercase">
          <Settings size={36} /> Basecamp Settings
        </h1>
        <p className="mt-2 font-bold text-gray-800 text-lg">
          Configure your adventurer profile, integrations, and communication scrolls.
        </p>
      </header>

      {notice && (
        <div role="status" className="border-4 border-black bg-[#A3E635] p-4 font-black uppercase flex items-center justify-between shadow-[5px_5px_0_0_#000]">
          {notice}
          <button onClick={() => setNotice('')} className="border-2 border-black bg-white px-2 py-1 hover:bg-gray-100 transition-colors">
            X
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                value={name} 
                onChange={(event) => setName(event.target.value)} 
                className="w-full border-3 border-black bg-white p-3 font-bold focus:outline-none focus:ring-4 focus:ring-black focus:translate-x-1 focus:-translate-y-1 transition-transform" 
              />
            </label>
            <label className="block">
              <span className="font-black uppercase flex items-center gap-2 mb-2">Hunter Title</span>
              <input 
                value={title} 
                onChange={(event) => setTitle(event.target.value)} 
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

        <div className="space-y-8 flex flex-col">
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
                  value={crmWebhookUrl} 
                  onChange={(event) => setCrmWebhookUrl(event.target.value)} 
                  placeholder="https://hooks.zapier.com/..." 
                  className="w-full border-3 border-black bg-white p-3 font-bold focus:outline-none focus:ring-4 focus:ring-black focus:translate-x-1 focus:-translate-y-1 transition-transform" 
                />
              </label>
              <p className="mt-3 text-sm font-bold text-gray-700 uppercase">
                Connect your quests to Zapier, Make, or your CRM via webhook.
              </p>
            </div>
          </section>

          {/* Preferences Section */}
          <section className="border-4 border-black bg-white shadow-[7px_7px_0_0_#000]">
            <div className="border-b-4 border-black bg-[#A3E635] p-4 flex items-center gap-3">
              <Mail className="text-black" size={28} />
              <h2 className="text-2xl font-black uppercase">Scrolls & Alerts</h2>
            </div>
            <div className="p-6 bg-[#F4F0EA] space-y-4">
              <label className="flex items-center gap-4 cursor-pointer p-3 border-3 border-black bg-white hover:bg-yellow-50 transition-colors shadow-[2px_2px_0_0_#000]">
                <input 
                  type="checkbox" 
                  checked={emailDigest} 
                  onChange={(event) => setEmailDigest(event.target.checked)}
                  className="w-6 h-6 border-3 border-black accent-[#06B6D4] cursor-pointer"
                /> 
                <span className="font-black uppercase text-lg">Daily Email Digest</span>
              </label>
              <label className="flex items-center gap-4 cursor-pointer p-3 border-3 border-black bg-white hover:bg-yellow-50 transition-colors shadow-[2px_2px_0_0_#000]">
                <input 
                  type="checkbox" 
                  checked={radarAlerts} 
                  onChange={(event) => setRadarAlerts(event.target.checked)}
                  className="w-6 h-6 border-3 border-black accent-[#06B6D4] cursor-pointer"
                /> 
                <span className="font-black uppercase text-lg">Browser Radar Alerts</span>
              </label>
              <p className="text-sm font-bold text-gray-700 pt-2 uppercase">
                Note: Delivery systems are currently being constructed by the Guild engineers.
              </p>
            </div>
          </section>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          type="button" 
          onClick={save} 
          disabled={pending} 
          className="flex items-center gap-3 border-4 border-black bg-[#06B6D4] px-8 py-4 text-xl font-black uppercase text-black shadow-[6px_6px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_#000] transition-all disabled:opacity-50 disabled:pointer-events-none active:translate-x-2 active:translate-y-2 active:shadow-none"
        >
          <Save size={24} /> {pending ? 'Saving Changes…' : 'Save All Settings'}
        </button>
      </div>
    </div>
  )
}
