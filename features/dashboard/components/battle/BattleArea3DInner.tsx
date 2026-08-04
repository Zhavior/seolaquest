'use client'

import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Float } from '@react-three/drei'
import * as THREE from 'three'
import { questStore, useQuestStore, triggerDemoScanSequence } from '@/lib/quest/queue'
import { Play, Trees, Landmark, Flame, Volume2, VolumeX } from 'lucide-react'
import { sfx } from '@/lib/sfx'

type BiomeType = 'reddit-forest' | 'x-wastes' | 'linkedin-citadel'

// --- HELPER COMPONENT FOR ARCADE VOXEL BLOCKS WITH BLACK BORDERS ---
function ArcadeVoxelBlock({
  position,
  args,
  color,
  emissive,
  emissiveIntensity = 0,
}: {
  position: [number, number, number]
  args: [number, number, number]
  color: string
  emissive?: string
  emissiveIntensity?: number
}) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={args} />
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          emissive={emissive || color}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(args[0] * 1.01, args[1] * 1.01, args[2] * 1.01)]} />
        <lineBasicMaterial color="#000000" linewidth={2.5} />
      </lineSegments>
    </group>
  )
}

// --- 3D ARCADE DIORAMA PLATFORM ---
function DioramaPlatform({ biome }: { biome: BiomeType }) {
  const baseColor = biome === 'x-wastes' ? '#180707' : biome === 'linkedin-citadel' ? '#0f051d' : '#022c22'
  const pathColor = biome === 'x-wastes' ? '#450a0a' : biome === 'linkedin-citadel' ? '#3b0764' : '#11382b'

  return (
    <group position={[0, -0.5, 0]}>
      {/* Arcade Stage Platform Ground Box */}
      <ArcadeVoxelBlock position={[0, 0, 0]} args={[18, 1, 10]} color={baseColor} />

      {/* Arcade Cobblestone Path Voxel Strip */}
      <ArcadeVoxelBlock position={[0, 0.51, 0]} args={[14, 0.02, 2.5]} color={pathColor} />
    </group>
  )
}

// --- 3D ARCADE VOXEL TREES & SPIRES ---
function ArcadeTree({ position, biome }: { position: [number, number, number]; biome: BiomeType }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      // Stepped arcade 8-bit sway
      const stepTime = Math.floor(state.clock.elapsedTime * 4)
      groupRef.current.rotation.z = (stepTime % 2 === 0 ? 0.04 : -0.04)
    }
  })

  if (biome === 'linkedin-citadel') {
    return (
      <group ref={groupRef} position={position}>
        <ArcadeVoxelBlock position={[0, 1.5, 0]} args={[0.7, 3, 0.7]} color="#1e1b4b" />
        <ArcadeVoxelBlock position={[0, 3.3, 0]} args={[0.9, 0.9, 0.9]} color="#a855f7" emissive="#a855f7" emissiveIntensity={0.6} />
      </group>
    )
  }

  if (biome === 'x-wastes') {
    return (
      <group ref={groupRef} position={position}>
        <ArcadeVoxelBlock position={[0, 1.5, 0]} args={[0.8, 3.2, 0.8]} color="#450a0a" />
      </group>
    )
  }

  // Arcade Pixel Forest Tree
  return (
    <group ref={groupRef} position={position}>
      {/* Voxel Trunk */}
      <ArcadeVoxelBlock position={[0, 0.5, 0]} args={[0.4, 1, 0.4]} color="#3f2305" />
      {/* Voxel Foliage Cubes */}
      <ArcadeVoxelBlock position={[0, 1.4, 0]} args={[1.6, 0.8, 1.6]} color="#10b981" />
      <ArcadeVoxelBlock position={[0, 2.1, 0]} args={[1.2, 0.7, 1.2]} color="#059669" />
      <ArcadeVoxelBlock position={[0, 2.7, 0]} args={[0.8, 0.6, 0.8]} color="#34d399" />
    </group>
  )
}

// --- 3D ARCADE CAMPFIRE WITH VOXEL LIGHT ---
function ArcadeCampfire() {
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    if (lightRef.current) {
      // Stepped 8-bit flame flicker
      const step = Math.floor(state.clock.elapsedTime * 6) % 3
      lightRef.current.intensity = 3 + step * 1.2
    }
  })

  return (
    <group position={[-5, 0.05, 0]}>
      {/* Voxel Logs */}
      <ArcadeVoxelBlock position={[0, 0.1, 0]} args={[1.2, 0.25, 0.4]} color="#522e0e" />

      {/* 8-Bit Voxel Flame */}
      <Float speed={4} rotationIntensity={0} floatIntensity={0.2}>
        <ArcadeVoxelBlock position={[0, 0.6, 0]} args={[0.5, 0.6, 0.5]} color="#f59e0b" emissive="#ef4444" emissiveIntensity={0.8} />
      </Float>

      {/* Dynamic 3D Arcade Point Light */}
      <pointLight ref={lightRef} color="#f59e0b" intensity={4} distance={10} castShadow />
    </group>
  )
}

// --- 3D ARCADE VOXEL CHARACTERS (WARRIOR, MAGE, HUNTER) ---
interface Agent3DProps {
  role: 'Warrior' | 'Mage' | 'Hunter'
  level: number
  position: [number, number, number]
  targetX: number
}

function ArcadeAgent({ role, level, position, targetX }: Agent3DProps) {
  const groupRef = useRef<THREE.Group>(null)
  const currentX = useRef(position[0])

  const bodyColor = role === 'Warrior' ? '#d97706' : role === 'Mage' ? '#2563eb' : '#16a34a'
  const hatColor = role === 'Warrior' ? '#ef4444' : role === 'Mage' ? '#06b6d4' : '#22c55e'
  const playerTag = role === 'Warrior' ? 'P1' : role === 'Mage' ? 'P2' : 'P3'

  useFrame((state) => {
    if (groupRef.current) {
      const dx = targetX - currentX.current
      const isMoving = Math.abs(dx) > 0.1

      if (isMoving) {
        currentX.current += dx * 0.09
        // Stepped 8-bit arcade bounce walking
        const stepY = Math.floor(state.clock.elapsedTime * 10) % 2 === 0 ? 0.3 : 0
        groupRef.current.position.y = stepY
      } else {
        // Idle 8-bit arcade breather
        const idleY = Math.floor(state.clock.elapsedTime * 4) % 2 === 0 ? 0.06 : 0
        groupRef.current.position.y = idleY
      }
      groupRef.current.position.x = currentX.current
    }
  })

  return (
    <group ref={groupRef} position={[position[0], 0, position[2]]}>
      {/* Voxel Torso Body */}
      <ArcadeVoxelBlock position={[0, 0.75, 0]} args={[0.7, 0.9, 0.5]} color={bodyColor} />

      {/* Voxel Head */}
      <ArcadeVoxelBlock position={[0, 1.45, 0]} args={[0.55, 0.55, 0.55]} color="#ffe0b2" />

      {/* Arcade Visor / Eyes */}
      <ArcadeVoxelBlock position={[0, 1.48, 0.28]} args={[0.45, 0.18, 0.05]} color="#000000" />
      <ArcadeVoxelBlock position={[-0.1, 1.48, 0.3]} args={[0.1, 0.1, 0.05]} color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.8} />
      <ArcadeVoxelBlock position={[0.1, 1.48, 0.3]} args={[0.1, 0.1, 0.05]} color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.8} />

      {/* Voxel Class Helmet / Wizard Hat */}
      {role === 'Mage' ? (
        <group>
          <ArcadeVoxelBlock position={[0, 1.85, 0]} args={[0.75, 0.15, 0.75]} color={hatColor} />
          <ArcadeVoxelBlock position={[0, 2.15, 0]} args={[0.45, 0.45, 0.45]} color={hatColor} />
          <ArcadeVoxelBlock position={[0, 2.45, 0]} args={[0.25, 0.25, 0.25]} color={hatColor} />
        </group>
      ) : role === 'Warrior' ? (
        <group>
          <ArcadeVoxelBlock position={[0, 1.85, 0]} args={[0.65, 0.25, 0.6]} color={hatColor} />
          <ArcadeVoxelBlock position={[0, 2.05, 0]} args={[0.2, 0.3, 0.2]} color="#ffe600" emissive="#ffe600" emissiveIntensity={0.5} />
        </group>
      ) : (
        <ArcadeVoxelBlock position={[0, 1.82, 0]} args={[0.65, 0.2, 0.6]} color={hatColor} />
      )}

      {/* Voxel Arms */}
      <ArcadeVoxelBlock position={[-0.45, 0.75, 0]} args={[0.2, 0.7, 0.3]} color={bodyColor} />
      <ArcadeVoxelBlock position={[0.45, 0.75, 0]} args={[0.2, 0.7, 0.3]} color={bodyColor} />

      {/* Voxel 3D Weapon */}
      <group position={[0.55, 0.75, 0.2]}>
        {role === 'Warrior' ? (
          <group>
            <ArcadeVoxelBlock position={[0, 0.3, 0]} args={[0.15, 1.1, 0.1]} color="#e2e8f0" />
            <ArcadeVoxelBlock position={[0, -0.2, 0]} args={[0.4, 0.15, 0.15]} color="#ffe600" />
          </group>
        ) : role === 'Mage' ? (
          <group>
            <ArcadeVoxelBlock position={[0, 0.2, 0]} args={[0.1, 1.3, 0.1]} color="#78350f" />
            <ArcadeVoxelBlock position={[0, 0.8, 0]} args={[0.3, 0.3, 0.3]} color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.9} />
          </group>
        ) : (
          <group>
            <ArcadeVoxelBlock position={[0, 0, 0]} args={[0.12, 1.0, 0.12]} color="#eab308" />
          </group>
        )}
      </group>

      {/* 3D Floating Arcade Player Tag */}
      <Text
        position={[0, 2.7, 0]}
        fontSize={0.28}
        color="#ffe600"
        outlineWidth={0.04}
        outlineColor="#000000"
      >
        {`[${playerTag}] LVL ${level} ${role.toUpperCase()}`}
      </Text>
    </group>
  )
}

// --- 3D ARCADE VOXEL MONSTER ---
function ArcadeMonster({ position, name, relevance }: { position: [number, number, number]; name: string; relevance: number }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      // 8-Bit Stepped Arcade Boss Wobble
      const stepY = Math.floor(state.clock.elapsedTime * 6) % 2 === 0 ? 0.12 : 0
      groupRef.current.position.y = position[1] + stepY
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Voxel Boss Body */}
      <ArcadeVoxelBlock position={[0, 1.0, 0]} args={[1.3, 1.3, 1.1]} color="#d97706" />

      {/* Voxel Boss Horns */}
      <ArcadeVoxelBlock position={[-0.45, 1.85, 0]} args={[0.25, 0.5, 0.25]} color="#7f1d1d" />
      <ArcadeVoxelBlock position={[0.45, 1.85, 0]} args={[0.25, 0.5, 0.25]} color="#7f1d1d" />

      {/* Glowing 8-Bit Eyes */}
      <ArcadeVoxelBlock position={[-0.3, 1.2, 0.58]} args={[0.2, 0.2, 0.05]} color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
      <ArcadeVoxelBlock position={[0.3, 1.2, 0.58]} args={[0.2, 0.2, 0.05]} color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />

      {/* Floating Arcade Boss HP Badge */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.34}
        color="#ff5722"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {`👾 BOSS: ${name.toUpperCase()} [${relevance}%]` }
      </Text>
    </group>
  )
}

// --- 3D SCENE CONTROLLER ---
function SceneController({
  activeBiome,
  agentsTargetX,
  activeMonster,
}: {
  activeBiome: BiomeType
  agentsTargetX: number
  activeMonster: { name: string; relevance: number } | null
}) {
  return (
    <>
      {/* Ambient Lighting */}
      <ambientLight intensity={activeBiome === 'x-wastes' ? 0.6 : 0.85} />

      {/* 3D Directional Sun Light casting real shadows */}
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.6}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <DioramaPlatform biome={activeBiome} />

      {/* Perimeter Arcade Voxel Trees */}
      <ArcadeTree position={[-7.5, 0, -3.5]} biome={activeBiome} />
      <ArcadeTree position={[-6, 0, -4]} biome={activeBiome} />
      <ArcadeTree position={[6.5, 0, -3.5]} biome={activeBiome} />
      <ArcadeTree position={[7.5, 0, 3.5]} biome={activeBiome} />

      <ArcadeCampfire />

      {/* 3D Arcade Agents */}
      <ArcadeAgent role="Warrior" level={12} position={[-6.2, 0, 0.8]} targetX={agentsTargetX - 1.2} />
      <ArcadeAgent role="Mage" level={14} position={[-5, 0, -0.8]} targetX={agentsTargetX} />
      <ArcadeAgent role="Hunter" level={11} position={[-3.8, 0, 0.8]} targetX={agentsTargetX + 1.2} />

      {/* 3D Arcade Boss Monster */}
      {activeMonster && (
        <ArcadeMonster position={[4.5, 0, 0]} name={activeMonster.name} relevance={activeMonster.relevance} />
      )}
    </>
  )
}

export function BattleArea3DInner() {
  const latestLog = useQuestStore((s) => s.expedition.logs[0] || '⚔️ Arcade Expedition Ready')
  const expeditionStatus = useQuestStore((s) => s.expedition.status)
  const [activeBiome, setActiveBiome] = useState<BiomeType>('reddit-forest')
  const [audioMuted, setAudioMuted] = useState(false)
  const [agentsTargetX, setAgentsTargetX] = useState(-5)
  const [activeMonster, setActiveMonster] = useState<{ name: string; relevance: number } | null>(null)

  const toggleAudio = () => {
    const isNowEnabled = sfx.toggle()
    setAudioMuted(!isNowEnabled)
  }

  // Subscribe to Zustand Quest Store Events
  useEffect(() => {
    const interval = setInterval(() => {
      const event = questStore.getState().popEvent()
      if (!event) return

      if (event.type === 'quest_started') {
        sfx.playRadarBlip()
        questStore.getState().setExpeditionStatus('combat')
        setAgentsTargetX(1.5)
      } else if (event.type === 'enemy_spawned') {
        sfx.playCriticalWarning()
        setActiveMonster({ name: event.name, relevance: event.relevanceScore })
      } else if (event.type === 'enemy_defeated') {
        sfx.playSwordSlash()
        sfx.playCoinDrop()
        setActiveMonster(null)
        setAgentsTargetX(-5)
        questStore.getState().setExpeditionStatus('patrolling')
      } else if (event.type === 'loot_found') {
        sfx.playBountyUnlock()
      } else if (event.type === 'mana_consumed') {
        sfx.playRadarBlip()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full h-full select-none bg-emerald-950">
      {/* React Three Fiber 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [12, 10, 14], fov: 40 }}
        className="w-full h-full absolute inset-0"
      >
        <OrbitControls
          enableZoom={false}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 6}
          rotateSpeed={0.5}
        />
        <SceneController
          activeBiome={activeBiome}
          agentsTargetX={agentsTargetX}
          activeMonster={activeMonster}
        />
      </Canvas>

      {/* --- MICRO-UI OVERLAY --- */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <span className="border-2 border-black bg-black px-3 py-1 font-mono text-xs font-black uppercase text-[#FFE600] shadow-[3px_3px_0_0_#000]">
          🕹️ 8-BIT ARCADE ENGINE: {activeBiome.replace('-', ' ').toUpperCase()} [{expeditionStatus.toUpperCase()}]
        </span>
      </div>

      {/* Top Center Biome Selector */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 hidden md:flex items-center gap-1 border-2 border-black bg-black/90 p-1 shadow-[3px_3px_0_0_#000]">
        <button
          type="button"
          onClick={() => setActiveBiome('reddit-forest')}
          className={`flex items-center gap-1 px-2.5 py-1 font-mono text-[10px] font-black uppercase border border-black ${
            activeBiome === 'reddit-forest' ? 'bg-[#10B981] text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          <Trees className="w-3 h-3" /> Forest
        </button>
        <button
          type="button"
          onClick={() => setActiveBiome('x-wastes')}
          className={`flex items-center gap-1 px-2.5 py-1 font-mono text-[10px] font-black uppercase border border-black ${
            activeBiome === 'x-wastes' ? 'bg-[#EF4444] text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          <Flame className="w-3 h-3" /> Wastes
        </button>
        <button
          type="button"
          onClick={() => setActiveBiome('linkedin-citadel')}
          className={`flex items-center gap-1 px-2.5 py-1 font-mono text-[10px] font-black uppercase border border-black ${
            activeBiome === 'linkedin-citadel' ? 'bg-[#A855F7] text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          <Landmark className="w-3 h-3" /> Citadel
        </button>
      </div>

      {/* Top Right Controls & Audio Mute Toggle */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleAudio}
          className="border-2 border-black bg-black p-1.5 text-white shadow-[2px_2px_0_0_#000] hover:bg-zinc-800"
          title={audioMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {audioMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-[#FFE600]" />}
        </button>

        <span className="border-2 border-black bg-black px-3 py-1 font-mono text-xs font-black uppercase text-[#06B6D4] shadow-[3px_3px_0_0_#000]">
          INSERT COIN (5 MP)
        </span>
        <button
          type="button"
          onClick={triggerDemoScanSequence}
          className="flex items-center gap-1 border-2 border-black bg-[#FF5722] px-3 py-1 text-xs font-black uppercase text-white hover:bg-orange-600 shadow-[3px_3px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px]"
          title="Trigger 8-Bit Arcade Pulse"
        >
          <Play className="h-3.5 w-3.5 fill-white" />
          Pulse Scan
        </button>
      </div>

      {/* Bottom Floating Combat Log */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <div className="w-full border-2 border-black bg-black/90 px-3.5 py-2 font-mono text-xs font-black text-white shadow-[4px_4px_0_0_#000] backdrop-blur-md overflow-hidden whitespace-nowrap text-ellipsis flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 overflow-hidden text-ellipsis">
            <span className="text-[#FFE600] shrink-0">ARCADE LOG:</span>
            <span className="truncate">{latestLog}</span>
          </div>
          <span className="text-[10px] uppercase text-[#06B6D4] font-black shrink-0 hidden sm:inline-block ml-4">
            🕹️ 8-BIT VOXEL AGENTS READY
          </span>
        </div>
      </div>
    </div>
  )
}
