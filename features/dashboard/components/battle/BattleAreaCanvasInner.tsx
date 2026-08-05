'use client'

import { useEffect, useRef, useState } from 'react'
import { questStore, useQuestStore, triggerDemoScanSequence } from '@/lib/quest/queue'
import { Play, Trees, Landmark, Flame, Volume2, VolumeX } from 'lucide-react'
import { sfx } from '@/lib/sfx'

type BiomeType = 'reddit-forest' | 'x-wastes' | 'linkedin-citadel'

export function BattleAreaCanvasInner() {
  const containerRef = useRef<HTMLDivElement>(null)
  const latestLog = useQuestStore((s) => s.expedition.logs[0] || '⚔️ Expedition ready')
  const expeditionStatus = useQuestStore((s) => s.expedition.status)
  const [activeBiome, setActiveBiome] = useState<BiomeType>('reddit-forest')
  const [audioMuted, setAudioMuted] = useState(false)

  const toggleAudio = () => {
    const isNowEnabled = sfx.toggle()
    setAudioMuted(!isNowEnabled)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let app: InstanceType<typeof import('pixi.js').Application> | null = null
    let isDestroyed = false

    const initPixi = async () => {
      // Dynamic client-side import of PixiJS for 100% SSR isolation
      const { Application, Container, Graphics, Text, TextStyle } = await import('pixi.js')

      if (isDestroyed || !containerRef.current) return

      app = new Application()
      await app.init({
        background: activeBiome === 'x-wastes' ? '#180707' : activeBiome === 'linkedin-citadel' ? '#0f051d' : '#022c22',
        width: container.clientWidth || 800,
        height: container.clientHeight || 400,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
      })

      if (isDestroyed || !containerRef.current) {
        app.destroy(true, { children: true })
        return
      }

      container.appendChild(app.canvas)

      // Resize handling refinement
      const resizeObserver = new ResizeObserver(() => {
        if (app && app.renderer && container) {
          app.renderer.resize(container.clientWidth, container.clientHeight)
        }
      })
      resizeObserver.observe(container)

      // Tab Visibility Idle Throttling
      const handleVisibilityChange = () => {
        if (document.hidden) {
          app?.ticker?.stop()
        } else {
          app?.ticker?.start()
        }
      }
      document.addEventListener('visibilitychange', handleVisibilityChange)

      // Layer Containers Setup
      const worldStage = new Container()
      const envLayer = new Container()
      const pathLayer = new Container()
      const agentLayer = new Container()
      const monsterLayer = new Container()
      const fxLayer = new Container()
      const uiVignetteLayer = new Container()

      worldStage.addChild(envLayer)
      worldStage.addChild(pathLayer)
      worldStage.addChild(agentLayer)
      worldStage.addChild(monsterLayer)
      worldStage.addChild(fxLayer)
      worldStage.addChild(uiVignetteLayer)
      app.stage.addChild(worldStage)

      // --- ENVIRONMENT & BIOME SETUP ---
      const drawEnvironment = (width: number, height: number, biome: BiomeType) => {
        envLayer.removeChildren()
        pathLayer.removeChildren()
        uiVignetteLayer.removeChildren()

        const baseColor = biome === 'x-wastes' ? '#180707' : biome === 'linkedin-citadel' ? '#0f051d' : '#022c22'
        const gridColor = biome === 'x-wastes' ? 0x450a0a : biome === 'linkedin-citadel' ? 0x3b0764 : 0x064e3b

        // Base ground
        const bg = new Graphics()
        bg.rect(0, 0, width, height)
        bg.fill(baseColor)
        envLayer.addChild(bg)

        // Checkerboard Grid Tiles
        const gridG = new Graphics()
        const tileSize = 32
        for (let x = 0; x < width; x += tileSize) {
          for (let y = 0; y < height; y += tileSize) {
            if ((x / tileSize + y / tileSize) % 2 === 0) {
              gridG.rect(x, y, tileSize, tileSize)
              gridG.fill({ color: gridColor, alpha: 0.3 })
            }
          }
        }
        envLayer.addChild(gridG)

        // Cobblestone Campfire Path
        const pathG = new Graphics()
        pathG.rect(100, height / 2 - 20, width - 200, 40)
        pathG.fill({ color: biome === 'x-wastes' ? 0x291414 : biome === 'linkedin-citadel' ? 0x22103b : 0x11382b, alpha: 0.6 })
        pathG.stroke({ width: 2, color: 0x000000 })
        pathLayer.addChild(pathG)

        // Ambient Decorative Elements
        const decorG = new Graphics()
        for (let i = 0; i < 28; i++) {
          const dx = (Math.sin(i * 99) * 0.5 + 0.5) * width
          const dy = (Math.cos(i * 33) * 0.5 + 0.5) * height

          if (biome === 'reddit-forest') {
            decorG.rect(dx, dy, 4, 4)
            decorG.fill(i % 2 === 0 ? 0xf59e0b : 0x10b981)
          } else if (biome === 'x-wastes') {
            decorG.poly([dx, dy, dx + 6, dy - 4, dx + 10, dy + 2])
            decorG.fill(0x7f1d1d)
          } else {
            decorG.poly([dx, dy - 8, dx - 4, dy, dx + 4, dy])
            decorG.fill(0xc084fc)
          }
        }
        envLayer.addChild(decorG)

        // Retro CRT Scanlines Effect Overlay
        const crtG = new Graphics()
        for (let y = 0; y < height; y += 4) {
          crtG.rect(0, y, width, 1.5)
          crtG.fill({ color: 0x000000, alpha: 0.14 })
        }
        uiVignetteLayer.addChild(crtG)
      }

      drawEnvironment(app.screen.width, app.screen.height, activeBiome)

      // Swaying Trees / Pillars
      interface TreeEntity {
        container: InstanceType<typeof Container>
        baseX: number
        swayOffset: number
      }

      const trees: TreeEntity[] = []
      const createTree = (x: number, y: number, scale = 1) => {
        const treeCont = new Container()
        treeCont.x = x
        treeCont.y = y

        if (activeBiome === 'linkedin-citadel') {
          const pillar = new Graphics()
          pillar.rect(-10 * scale, -70 * scale, 20 * scale, 70 * scale)
          pillar.fill(0x1e1b4b)
          pillar.stroke({ width: 3, color: 0x000000 })
          pillar.rect(-6 * scale, -60 * scale, 12 * scale, 40 * scale)
          pillar.fill(0xa855f7)
          treeCont.addChild(pillar)
        } else if (activeBiome === 'x-wastes') {
          const spire = new Graphics()
          spire.poly([0, -80 * scale, -20 * scale, 0, 20 * scale, 0])
          spire.fill(0x450a0a)
          spire.stroke({ width: 3, color: 0x000000 })
          treeCont.addChild(spire)
        } else {
          const trunk = new Graphics()
          trunk.rect(-7 * scale, -12 * scale, 14 * scale, 26 * scale)
          trunk.fill(0x3f2305)
          trunk.stroke({ width: 2, color: 0x000000 })
          treeCont.addChild(trunk)

          const foliage = new Graphics()
          foliage.poly([0, -70 * scale, -32 * scale, -24 * scale, 32 * scale, -24 * scale])
          foliage.fill(0x10b981)
          foliage.stroke({ width: 2, color: 0x000000 })
          foliage.poly([0, -52 * scale, -26 * scale, -12 * scale, 26 * scale, -12 * scale])
          foliage.fill(0x059669)
          foliage.stroke({ width: 2, color: 0x000000 })

          treeCont.addChild(foliage)
        }

        envLayer.addChild(treeCont)

        trees.push({
          container: treeCont,
          baseX: x,
          swayOffset: Math.random() * Math.PI * 2,
        })
      }

      const screenW = app.screen.width
      const screenH = app.screen.height
      createTree(60, screenH - 80, 1.1)
      createTree(130, screenH - 120, 0.9)
      createTree(screenW - 70, screenH - 90, 1.2)
      createTree(screenW - 140, screenH - 130, 0.85)

      // Campfire with Radial Warmth Glow
      const campfireCont = new Container()
      campfireCont.x = 180
      campfireCont.y = screenH / 2 + 30

      const fireGlow = new Graphics()
      fireGlow.circle(0, 0, 50)
      fireGlow.fill({ color: 0xf59e0b, alpha: 0.22 })
      campfireCont.addChild(fireGlow)

      const logs = new Graphics()
      logs.rect(-16, -5, 32, 10)
      logs.fill(0x522e0e)
      logs.stroke({ width: 2, color: 0x000000 })
      campfireCont.addChild(logs)

      const flame = new Graphics()
      campfireCont.addChild(flame)
      envLayer.addChild(campfireCont)

      // Floating Ambient Fireflies
      interface Firefly {
        g: InstanceType<typeof Graphics>
        baseX: number
        baseY: number
        offset: number
        speed: number
      }
      const fireflies: Firefly[] = []
      for (let i = 0; i < 16; i++) {
        const ffG = new Graphics()
        ffG.rect(-2, -2, 4, 4)
        ffG.fill(activeBiome === 'x-wastes' ? 0xef4444 : activeBiome === 'linkedin-citadel' ? 0xc084fc : 0xa3e635)
        ffG.stroke({ width: 1, color: 0x000000 })
        fxLayer.addChild(ffG)

        fireflies.push({
          g: ffG,
          baseX: Math.random() * screenW,
          baseY: Math.random() * screenH,
          offset: Math.random() * Math.PI * 2,
          speed: 0.5 + Math.random() * 0.8,
        })
      }

      // --- HIGH-GRAPHIC AGENTS (WARRIOR, MAGE, HUNTER) ---
      interface AgentEntity {
        container: InstanceType<typeof Container>
        role: 'Warrior' | 'Mage' | 'Hunter'
        color: number
        baseX: number
        baseY: number
        targetX: number
        targetY: number
        cape: InstanceType<typeof Graphics>
        weapon: InstanceType<typeof Graphics>
        levelText: InstanceType<typeof Text>
      }

      const agents: AgentEntity[] = []

      const createAgent = (role: 'Warrior' | 'Mage' | 'Hunter', color: number, levelNum: number, offsetX: number, offsetY: number) => {
        const agCont = new Container()
        const spawnX = 140 + offsetX
        const spawnY = screenH / 2 + offsetY
        agCont.x = spawnX
        agCont.y = spawnY

        const shadow = new Graphics()
        shadow.ellipse(0, 16, 14, 6)
        shadow.fill({ color: 0x000000, alpha: 0.45 })
        agCont.addChild(shadow)

        const cape = new Graphics()
        cape.poly([-10, -18, -16, 12, 12, 12, 10, -18])
        cape.fill(role === 'Warrior' ? 0xd97706 : role === 'Mage' ? 0x0284c7 : 0x15803d)
        cape.stroke({ width: 2, color: 0x000000 })
        agCont.addChild(cape)

        const g = new Graphics()
        g.rect(-11, -20, 22, 30)
        g.fill(color)
        g.stroke({ width: 3, color: 0x000000 })

        g.rect(-7, -14, 14, 12)
        g.fill(0xffe600)
        g.stroke({ width: 2, color: 0x000000 })

        g.rect(-9, -36, 18, 16)
        g.fill(0xffe0b2)
        g.stroke({ width: 3, color: 0x000000 })

        g.rect(-5, -30, 4, 4)
        g.fill(0x000000)
        g.rect(3, -30, 4, 4)
        g.fill(0x000000)

        if (role === 'Warrior') {
          g.rect(-12, -42, 24, 8)
          g.fill(0xef4444)
          g.stroke({ width: 2, color: 0x000000 })
        } else if (role === 'Mage') {
          g.poly([0, -52, -12, -36, 12, -36])
          g.fill(0x06b6d4)
          g.stroke({ width: 2, color: 0x000000 })
        } else {
          g.rect(-11, -40, 22, 6)
          g.fill(0x22c55e)
          g.stroke({ width: 2, color: 0x000000 })
        }

        agCont.addChild(g)

        const weapon = new Graphics()
        if (role === 'Warrior') {
          weapon.rect(12, -26, 6, 32)
          weapon.fill(0xe2e8f0)
          weapon.stroke({ width: 2, color: 0x000000 })
          weapon.rect(8, -4, 14, 4)
          weapon.fill(0xd97706)
          weapon.stroke({ width: 2, color: 0x000000 })
        } else if (role === 'Mage') {
          weapon.rect(12, -34, 4, 42)
          weapon.fill(0x78350f)
          weapon.stroke({ width: 2, color: 0x000000 })
          weapon.circle(14, -38, 7)
          weapon.fill(0x06b6d4)
          weapon.stroke({ width: 2, color: 0x000000 })
        } else {
          weapon.poly([10, -32, 20, -14, 10, 4])
          weapon.stroke({ width: 3, color: 0x000000 })
        }
        agCont.addChild(weapon)

        const style = new TextStyle({
          fontFamily: 'monospace',
          fontSize: 9,
          fontWeight: '900',
          fill: '#ffe600',
          stroke: { color: '#000000', width: 3 },
        })
        const label = new Text({ text: `LVL ${levelNum} ${role.toUpperCase()}`, style })
        label.anchor.set(0.5, 1)
        label.y = -44
        agCont.addChild(label)

        agentLayer.addChild(agCont)

        agents.push({
          container: agCont,
          role,
          color,
          baseX: spawnX,
          baseY: spawnY,
          targetX: spawnX,
          targetY: spawnY,
          cape,
          weapon,
          levelText: label,
        })
      }

      createAgent('Warrior', 0xd97706, 12, -35, -10)
      createAgent('Mage', 0x2563eb, 14, 0, 20)
      createAgent('Hunter', 0x16a34a, 11, 35, -15)

      // --- HIGH-GRAPHIC MONSTERS & PORTALS ---
      interface ActiveMonster {
        id: string
        container: InstanceType<typeof Container>
        name: string
        hp: number
        maxHp: number
        relevance: number
        x: number
        y: number
        hpBarFront: InstanceType<typeof Graphics>
      }

      const activeMonsters: ActiveMonster[] = []

      const spawnMonster = (id: string, name: string, hp: number, maxHp: number, relevance: number) => {
        sfx.playCriticalWarning()

        const monCont = new Container()
        const spawnX = app!.screen.width - 180
        const spawnY = app!.screen.height / 2

        monCont.x = spawnX
        monCont.y = spawnY

        // Portal Effect on Spawn
        const portalG = new Graphics()
        portalG.ellipse(0, 20, 30, 10)
        portalG.fill({ color: 0x7c3aed, alpha: 0.8 })
        portalG.stroke({ width: 3, color: 0x000000 })
        monCont.addChild(portalG)

        const g = new Graphics()
        g.rect(-20, -26, 40, 42)
        g.fill(activeBiome === 'x-wastes' ? 0x991b1b : 0xd97706)
        g.stroke({ width: 4, color: 0x000000 })

        g.poly([-20, -26, -28, -44, -10, -26])
        g.fill(0x7f1d1d)
        g.stroke({ width: 3, color: 0x000000 })
        g.poly([20, -26, 28, -44, 10, -26])
        g.fill(0x7f1d1d)
        g.stroke({ width: 3, color: 0x000000 })

        g.rect(-12, -16, 7, 7)
        g.fill(0xef4444)
        g.rect(5, -16, 7, 7)
        g.fill(0xef4444)

        monCont.addChild(g)

        const barBg = new Graphics()
        barBg.rect(-40, -52, 80, 12)
        barBg.fill(0x000000)
        monCont.addChild(barBg)

        const hpFront = new Graphics()
        hpFront.rect(-38, -50, 76, 8)
        hpFront.fill(0x22c55e)
        monCont.addChild(hpFront)

        const titleStyle = new TextStyle({
          fontFamily: 'monospace',
          fontSize: 10,
          fontWeight: '900',
          fill: '#ffe600',
          stroke: { color: '#000000', width: 3 },
        })
        const mLabel = new Text({ text: `${name.toUpperCase()} [${relevance}%]`, style: titleStyle })
        mLabel.anchor.set(0.5, 1)
        mLabel.y = -56
        monCont.addChild(mLabel)

        monsterLayer.addChild(monCont)

        activeMonsters.push({
          id,
          container: monCont,
          name,
          hp,
          maxHp,
          relevance,
          x: spawnX,
          y: spawnY,
          hpBarFront: hpFront,
        })
      }

      // --- PROJECTILES & BOUNCING LOOT PARTICLES ---
      interface ProjectileFX {
        g: InstanceType<typeof Graphics>
        x: number
        y: number
        targetX: number
        targetY: number
        speed: number
        color: number
      }
      const projectiles: ProjectileFX[] = []

      const fireProjectile = (startX: number, startY: number, targetX: number, targetY: number, color = 0x06b6d4) => {
        sfx.playSwordSlash()

        const pG = new Graphics()
        pG.circle(0, 0, 6)
        pG.fill(color)
        pG.stroke({ width: 2, color: 0x000000 })
        pG.x = startX
        pG.y = startY
        fxLayer.addChild(pG)

        projectiles.push({
          g: pG,
          x: startX,
          y: startY,
          targetX,
          targetY,
          speed: 12,
          color,
        })
      }

      // Bouncing Loot Particles (Coins & Mana Gems)
      interface BouncingParticle {
        g: InstanceType<typeof Graphics>
        x: number
        y: number
        vx: number
        vy: number
        bounce: number
        life: number
      }
      const bouncingLoot: BouncingParticle[] = []

      const spawnBouncingLootBurst = (startX: number, startY: number) => {
        sfx.playCoinDrop()
        sfx.playBountyUnlock()

        for (let i = 0; i < 10; i++) {
          const coinG = new Graphics()
          coinG.circle(0, 0, 5)
          coinG.fill(i % 2 === 0 ? 0xffe600 : 0x06b6d4)
          coinG.stroke({ width: 1.5, color: 0x000000 })
          coinG.x = startX
          coinG.y = startY
          fxLayer.addChild(coinG)

          bouncingLoot.push({
            g: coinG,
            x: startX,
            y: startY,
            vx: (Math.random() - 0.5) * 8,
            vy: -6 - Math.random() * 5,
            bounce: 0,
            life: 80,
          })
        }
      }

      interface FloatingTextFX {
        text: InstanceType<typeof Text>
        vy: number
        life: number
      }
      const floatingTexts: FloatingTextFX[] = []

      const addFloatingText = (msg: string, x: number, y: number, color = '#ffe600') => {
        const style = new TextStyle({
          fontFamily: 'monospace',
          fontSize: 13,
          fontWeight: '900',
          fill: color,
          stroke: { color: '#000000', width: 4 },
        })
        const txt = new Text({ text: msg, style })
        txt.anchor.set(0.5, 0.5)
        txt.x = x
        txt.y = y
        fxLayer.addChild(txt)

        floatingTexts.push({
          text: txt,
          vy: -1.5,
          life: 65,
        })
      }

      // Screen Shake Impulse Variable
      let screenShakeTicks = 0

      const triggerScreenShake = () => {
        screenShakeTicks = 12
      }

      // --- MAIN TICKER LOOP ---
      let tickCount = 0

      app.ticker.add(() => {
        tickCount++

        // Screen Shake Decay
        if (screenShakeTicks > 0) {
          screenShakeTicks--
          app!.stage.x = (Math.random() - 0.5) * 10
          app!.stage.y = (Math.random() - 0.5) * 10
        } else {
          app!.stage.x = 0
          app!.stage.y = 0
        }

        // 1. Event Queue Dispatcher
        const event = questStore.getState().popEvent()
        if (event) {
          if (event.type === 'quest_started') {
            sfx.playRadarBlip()
            questStore.getState().setExpeditionStatus('combat')
            agents.forEach((ag, idx) => {
              ag.targetX = app!.screen.width * 0.5 + idx * 35 - 35
            })
          } else if (event.type === 'enemy_spawned') {
            spawnMonster(event.enemyId, event.name, event.hp, event.maxHp, event.relevanceScore)
            agents.forEach((ag) => {
              fireProjectile(ag.container.x, ag.container.y - 20, app!.screen.width - 180, app!.screen.height / 2, ag.role === 'Mage' ? 0x06b6d4 : 0xf59e0b)
            })
          } else if (event.type === 'enemy_defeated') {
            triggerScreenShake()
            sfx.playSwordSlash()

            const mIdx = activeMonsters.findIndex((m) => m.id === event.enemyId || activeMonsters.length > 0)
            if (mIdx !== -1) {
              const targetMon = activeMonsters[mIdx]
              addFloatingText(`💥 CRITICAL -${event.damage} RELEVANCE`, targetMon.container.x, targetMon.container.y - 25, '#ef4444')
              spawnBouncingLootBurst(targetMon.container.x, targetMon.container.y)
              monsterLayer.removeChild(targetMon.container)
              activeMonsters.splice(mIdx, 1)
            } else {
              addFloatingText(`💥 CRITICAL -${event.damage} RELEVANCE`, app!.screen.width - 180, app!.screen.height / 2 - 25, '#ef4444')
              spawnBouncingLootBurst(app!.screen.width - 180, app!.screen.height / 2)
            }
            agents.forEach((ag) => {
              ag.targetX = ag.baseX
            })
            questStore.getState().setExpeditionStatus('patrolling')
          } else if (event.type === 'loot_found') {
            sfx.playBountyUnlock()
            addFloatingText(`💎 +${event.mpReward} MP | ${event.leadTitle}`, app!.screen.width / 2, app!.screen.height / 2 - 60, '#ffe600')
          } else if (event.type === 'mana_consumed') {
            sfx.playRadarBlip()
          }
        }

        // 2. Animate Swaying Trees
        trees.forEach((t) => {
          t.container.rotation = Math.sin(tickCount * 0.03 + t.swayOffset) * 0.05
        })

        // 3. Animate Ambient Fireflies
        fireflies.forEach((ff) => {
          ff.g.x = ff.baseX + Math.sin(tickCount * 0.02 * ff.speed + ff.offset) * 30
          ff.g.y = ff.baseY + Math.cos(tickCount * 0.03 * ff.speed + ff.offset) * 20
        })

        // 4. Animate Campfire Flickering Glow
        fireGlow.scale.set(1 + Math.sin(tickCount * 0.1) * 0.08)
        flame.clear()
        const flameHeight = 18 + Math.sin(tickCount * 0.25) * 5
        flame.poly([
          0, -flameHeight,
          -9 + Math.cos(tickCount * 0.3) * 2, -4,
          9 + Math.sin(tickCount * 0.3) * 2, -4,
        ])
        flame.fill(tickCount % 4 < 2 ? 0xf59e0b : 0xef4444)

        // 5. Animate Agent Motion & Capes
        agents.forEach((ag) => {
          const dx = ag.targetX - ag.container.x
          const dy = ag.targetY - ag.container.y

          if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
            ag.container.x += dx * 0.08
            ag.container.y += dy * 0.08
            ag.container.y = ag.baseY + Math.abs(Math.sin(tickCount * 0.25)) * -8
            ag.cape.rotation = Math.sin(tickCount * 0.3) * 0.2
          } else {
            ag.container.y = ag.baseY + Math.sin(tickCount * 0.05) * 2
            ag.cape.rotation = Math.sin(tickCount * 0.05) * 0.05
          }
        })

        // 6. Update Projectiles
        for (let i = projectiles.length - 1; i >= 0; i--) {
          const p = projectiles[i]
          const dx = p.targetX - p.x
          const dy = p.targetY - p.y
          const dist = Math.hypot(dx, dy)

          if (dist < 12) {
            fxLayer.removeChild(p.g)
            projectiles.splice(i, 1)
          } else {
            p.x += (dx / dist) * p.speed
            p.y += (dy / dist) * p.speed
            p.g.x = p.x
            p.g.y = p.y
          }
        }

        // 7. Update Bouncing Loot Coins
        for (let i = bouncingLoot.length - 1; i >= 0; i--) {
          const bl = bouncingLoot[i]
          bl.x += bl.vx
          bl.y += bl.vy
          bl.vy += 0.45 // gravity

          const groundY = screenH / 2 + 35
          if (bl.y >= groundY) {
            bl.y = groundY
            bl.vy = -bl.vy * 0.55 // bounce
            bl.bounce++
          }

          bl.g.x = bl.x
          bl.g.y = bl.y
          bl.life--
          if (bl.life <= 0) {
            fxLayer.removeChild(bl.g)
            bouncingLoot.splice(i, 1)
          }
        }

        // 8. Update Floating Text FX
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
          const ft = floatingTexts[i]
          ft.text.y += ft.vy
          ft.life--
          ft.text.alpha = ft.life / 65
          if (ft.life <= 0) {
            fxLayer.removeChild(ft.text)
            floatingTexts.splice(i, 1)
          }
        }
      })
    }

    initPixi()

    return () => {
      isDestroyed = true
      document.removeEventListener('visibilitychange', () => {})
      if (app) {
        app.destroy(true, { children: true })
      }
    }
  }, [activeBiome])

  return (
    <div className="relative w-full h-full select-none">
      {/* 2D Canvas Container */}
      <div ref={containerRef} className="w-full h-full absolute inset-0" />

      {/* --- MICRO-UI OVERLAY --- */}
      {/* Top Left Expedition Status */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <span className="border-2 border-black bg-black px-3 py-1 font-mono text-xs font-black uppercase text-[#FFE600] shadow-[3px_3px_0_0_#000]">
          ⚔️ LIVE EXPEDITION: {activeBiome.replace('-', ' ').toUpperCase()} [{expeditionStatus.toUpperCase()}]
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

      {/* Top Right Controls & Mute Toggle */}
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
          5 MP / SCAN
        </span>
        <button
          type="button"
          onClick={triggerDemoScanSequence}
          className="flex items-center gap-1 border-2 border-black bg-[#FFE600] px-3 py-1 text-xs font-black uppercase text-black hover:bg-yellow-300 shadow-[3px_3px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px]"
          title="Trigger Live Expedition Pulse"
        >
          <Play className="h-3.5 w-3.5 fill-black" />
          Pulse Scan
        </button>
      </div>

      {/* Bottom Floating Combat Log */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <div className="w-full border-2 border-black bg-black/90 px-3.5 py-2 font-mono text-xs font-black text-white shadow-[4px_4px_0_0_#000] backdrop-blur-md overflow-hidden whitespace-nowrap text-ellipsis flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 overflow-hidden text-ellipsis">
            <span className="text-[#FFE600] shrink-0">EXPEDITION LOG:</span>
            <span className="truncate">{latestLog}</span>
          </div>
          <span className="text-[10px] uppercase text-[#06B6D4] font-black shrink-0 hidden sm:inline-block ml-4">
            AGENTS 3/3 READY
          </span>
        </div>
      </div>
    </div>
  )
}
