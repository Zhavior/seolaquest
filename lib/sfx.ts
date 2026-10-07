'use client'

// Original, lightweight cues: no audio downloads on the navigation path.
const NOTES = {
  click: [523.25],
  confirm: [659.25, 783.99],
  discovery: [523.25, 1046.5],
  reward: [523.25, 659.25, 783.99],
  level: [523.25, 659.25, 783.99, 1046.5],
  warning: [392, 329.63],
} as const

class RetroSFX {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private enabled = true
  private volume = 0.5
  private listeners = new Set<() => void>()
  private lastCue = ''
  private lastCueAt = -Infinity

  constructor() {
    if (typeof window === 'undefined') return
    try {
      const enabled = localStorage.getItem('coquest_sfx_enabled')
      if (enabled !== null) this.enabled = enabled === 'true'
      const saved = localStorage.getItem('coquest_sfx_volume')
      const volume = saved === null ? 0.5 : Number(saved)
      if (Number.isFinite(volume)) this.volume = Math.max(0, Math.min(1, volume))
    } catch { /* Private browsing can disable storage. */ }

    // Unlock on a gesture so later server-confirmed results can make sound.
    const unlock = () => {
      if (this.enabled && this.volume > 0) this.initCtx()
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('keydown', unlock, { passive: true })
  }

  private initCtx() {
    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        const AudioCtx = window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!AudioCtx) return false
        this.ctx = new AudioCtx()
        this.master = this.ctx.createGain()
        this.master.connect(this.ctx.destination)
      }
      this.master!.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime)
      if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {})
      return true
    } catch { return false }
  }

  public subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
  public isEnabled = () => this.enabled
  public getVolume = () => this.volume

  private persist() {
    try {
      localStorage.setItem('coquest_sfx_enabled', String(this.enabled))
      localStorage.setItem('coquest_sfx_volume', String(this.volume))
    } catch { /* Sound controls still work without storage. */ }
    if (typeof document !== 'undefined') document.documentElement.classList.toggle('sfx-muted', !this.enabled)
    // Also silence notes that are already playing when the user mutes.
    this.master?.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx!.currentTime)
    this.listeners.forEach((listener) => listener())
  }

  public setEnabled(value: boolean) {
    this.enabled = value
    this.persist()
  }
  public setVolume(value: number) {
    if (!Number.isFinite(value)) return
    this.volume = Math.max(0, Math.min(1, value))
    this.persist()
  }
  public toggle() {
    this.setEnabled(!this.enabled)
    if (this.enabled) this.playConfirm()
    return this.enabled
  }

  private play(cue: keyof typeof NOTES) {
    if (!this.enabled || this.volume === 0 || typeof document === 'undefined' || document.hidden) return
    const nowMs = Date.now()
    if (cue === this.lastCue && nowMs - this.lastCueAt < 150) return
    this.lastCue = cue
    this.lastCueAt = nowMs
    if (!this.initCtx() || !this.ctx || !this.master) return
    try {
      const ctx = this.ctx
      const duration = cue === 'click' ? 0.07 : 0.18
      NOTES[cue].forEach((frequency, index) => {
        const start = ctx.currentTime + index * 0.11
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(frequency, start)
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(cue === 'click' ? 0.025 : 0.045, start + 0.008)
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
        osc.connect(gain)
        gain.connect(this.master!)
        osc.onended = () => { osc.disconnect(); gain.disconnect() }
        osc.start(start)
        osc.stop(start + duration + 0.01)
      })
    } catch { /* Audio must never interrupt an action. */ }
  }

  public playConfirm() { this.play('confirm') }
  public playDiscovery() { this.play('discovery') }
  public playQuestComplete() { this.play('reward') }
  public playLevelUp() { this.play('level') }
  public playCriticalWarning() { this.play('warning') }

  // Existing navigation callers retain quiet feedback, without implying a reward.
  public playCoinDrop() { this.play('click') }
  public playSidebarExpand() { this.play('click') }
  public playSidebarCollapse() { this.play('click') }
  public playSwordSlash() { this.play('click') }
  public playRadarBlip() { this.play('click') }
  public playBountyUnlock() { this.play('reward') }
  public playElixirDrink() { this.play('confirm') }
  // Hover and keyboard focus are intentionally silent throughout the app.
  public playHoverBlip() {}
  public playSidebarHover() {}
}

export const sfx = new RetroSFX()
