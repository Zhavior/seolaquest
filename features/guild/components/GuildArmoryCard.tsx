import { motion, Variants } from 'framer-motion'
import { Flame, Sparkles, Crosshair, Target, Clock } from 'lucide-react'
import { ChannelBreakdown } from '@/features/guild/types'

type GuildArmoryCardProps = {
  item: Variants
  deadliestArtifact: string
  deadliestWeaponCount: number
  channels: ChannelBreakdown[]
  criticalHitRate: number
  scoutSpeed: string
}

export function GuildArmoryCard({
  item,
  deadliestArtifact,
  deadliestWeaponCount,
  channels,
  scoutSpeed
}: GuildArmoryCardProps) {
  return (
    <motion.div 
      variants={item}
      className="md:col-span-6 border-4 border-black bg-white p-6 md:p-8 shadow-[6px_6px_0_0_#000] flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-6 border-b-4 border-black pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#FF5722] p-2.5 border-2 border-black shadow-[2px_2px_0_0_#000]">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl uppercase font-black leading-none">The Armory</h2>
              <p className="text-xs uppercase font-bold text-gray-500 mt-0.5">Weapon Proficiency Matrix</p>
            </div>
          </div>
          <span className="text-xs font-black uppercase bg-[#FFE600] border-2 border-black px-3 py-1 shadow-[2px_2px_0_0_#000]">
            TOP ARTIFACTS
          </span>
        </div>
        
        {/* Top Keyword = "Legendary Weapon" */}
        <p className="text-xs font-black uppercase text-gray-500 mb-2 tracking-wider">
          Top Keyword • Legendary Weapon Artifact
        </p>
        
        <div className="bg-[#F4F0EA] border-4 border-black p-5 relative overflow-hidden mb-6 shadow-[4px_4px_0_0_#000]">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#FF5722]" />
            <span className="text-xs font-black uppercase bg-[#FF5722] text-white px-2 py-0.5 border border-black">
              MEASURED KEYWORD
            </span>
          </div>

          <h3 className="text-xl md:text-2xl font-black text-black uppercase break-words relative z-10 leading-snug">
            &quot;{deadliestArtifact}&quot;
          </h3>
          
          <div className="mt-4 flex justify-between items-end relative z-10 pt-4 border-t-2 border-black/20">
            <div className="flex flex-col">
              <span className="text-xs uppercase font-extrabold text-gray-600">Contacted lead records</span>
              <span className="text-3xl md:text-4xl font-black text-[#FF5722] drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                {deadliestWeaponCount} records
              </span>
            </div>
            <Crosshair className="w-12 h-12 text-black opacity-80" />
          </div>
          
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ background: 'repeating-linear-gradient(45deg, #000, #000 10px, transparent 10px, transparent 20px)' }}></div>
        </div>

        {/* Channel Distribution Pie/Bar */}
        <div className="space-y-3 mb-6">
          <p className="text-xs font-black uppercase text-gray-500 tracking-wider">
            Channel Origin Distribution
          </p>
          
          <div className="space-y-2 border-2 border-black bg-[#F4F0EA] p-4 shadow-[3px_3px_0_0_#000]">
            {channels.length === 0 && <p className="text-sm font-bold text-gray-600">No stored channel distribution yet.</p>}
            {channels.map((chan, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-black uppercase">
                  <span>{chan.name}</span>
                  <span>{chan.percent}%</span>
                </div>
                <div className="w-full bg-white border-2 border-black h-4 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${chan.percent}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                    className="h-full border-r-2 border-black"
                    style={{ backgroundColor: chan.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scout Speed & Critical Hits Matrix */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border-4 border-black p-4 bg-[#F4F0EA] shadow-[3px_3px_0_0_#000]">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-red-600" />
            <p className="text-xs font-black text-gray-600 uppercase">Critical Hit Rate</p>
          </div>
          <p className="text-xl font-black text-black">Not measured</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">No conversion event model</p>
        </div>
        
        <div className="border-4 border-black p-4 bg-[#F4F0EA] shadow-[3px_3px_0_0_#000]">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-black text-gray-600 uppercase">Scout Speed</p>
          </div>
          <p className="text-2xl font-black text-black truncate">{scoutSpeed}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">Only shown when measured</p>
        </div>
      </div>
    </motion.div>
  )
}
