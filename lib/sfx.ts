'use client'

class RetroSFX {
  private ctx: AudioContext | null = null
  private enabled = true
  private lastHoverTime = 0
  private unlockListenerAttached = false

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('coquest_sfx_enabled')
        if (saved !== null) {
          this.enabled = saved === 'true'
        }
      } catch {
        // Ignore storage errors
      }
      this.attachUnlockListeners()
    }
  }

  private attachUnlockListeners() {
    if (typeof window === 'undefined' || this.unlockListenerAttached) return
    this.unlockListenerAttached = true

    const unlock = () => {
      this.initCtx()
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume()
      }
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('touchstart', unlock)
    }

    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('keydown', unlock, { passive: true })
    window.addEventListener('touchstart', unlock, { passive: true })
  }

  private initCtx() {
    if (typeof window === 'undefined') return false
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) this.ctx = new AudioCtx()
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {})
    }
    return !!this.ctx
  }

  private withCtx(run: (ctx: AudioContext) => void) {
    if (!this.enabled || !this.initCtx() || !this.ctx) return
    try {
      run(this.ctx)
    } catch {
      // Graceful fallback if Web Audio is restricted
    }
  }

  public isEnabled(): boolean {
    return this.enabled
  }

  public setEnabled(val: boolean) {
    this.enabled = val
    try {
      localStorage.setItem('coquest_sfx_enabled', String(val))
    } catch {
      // Ignore storage errors
    }
  }

  public toggle(): boolean {
    const next = !this.enabled
    this.setEnabled(next)
    if (next) this.playCoinDrop()
    return next
  }

  public playHoverBlip() {
    const nowMs = Date.now()
    if (nowMs - this.lastHoverTime < 35) return
    this.lastHoverTime = nowMs

    this.withCtx((ctx) => {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'square'
      osc.frequency.setValueAtTime(880, now)

      gain.gain.setValueAtTime(0.03, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.onended = () => {
        try {
          osc.disconnect()
          gain.disconnect()
        } catch {}
      }

      osc.start(now)
      osc.stop(now + 0.04)
    })
  }

  public playSidebarHover() {
    const nowMs = Date.now()
    if (nowMs - this.lastHoverTime < 35) return
    this.lastHoverTime = nowMs

    this.withCtx((ctx) => {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(840, now)
      osc.frequency.exponentialRampToValueAtTime(980, now + 0.035)

      gain.gain.setValueAtTime(0.02, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.onended = () => {
        try {
          osc.disconnect()
          gain.disconnect()
        } catch {}
      }

      osc.start(now)
      osc.stop(now + 0.035)
    })
  }

  public playSidebarExpand() {
    this.withCtx((ctx) => {
      const now = ctx.currentTime
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = 'triangle'
      osc1.frequency.setValueAtTime(320, now)
      osc1.frequency.exponentialRampToValueAtTime(760, now + 0.09)

      osc2.type = 'square'
      osc2.frequency.setValueAtTime(480, now)
      osc2.frequency.exponentialRampToValueAtTime(1140, now + 0.09)

      gain.gain.setValueAtTime(0.035, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.onended = () => {
        try {
          osc1.disconnect()
          osc2.disconnect()
          gain.disconnect()
        } catch {}
      }

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.09)
      osc2.stop(now + 0.09)
    })
  }

  public playSidebarCollapse() {
    this.withCtx((ctx) => {
      const now = ctx.currentTime
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = 'triangle'
      osc1.frequency.setValueAtTime(760, now)
      osc1.frequency.exponentialRampToValueAtTime(320, now + 0.09)

      osc2.type = 'square'
      osc2.frequency.setValueAtTime(1140, now)
      osc2.frequency.exponentialRampToValueAtTime(480, now + 0.09)

      gain.gain.setValueAtTime(0.035, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.onended = () => {
        try {
          osc1.disconnect()
          osc2.disconnect()
          gain.disconnect()
        } catch {}
      }

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.09)
      osc2.stop(now + 0.09)
    })
  }

  public playCoinDrop() {
    this.withCtx((ctx) => {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(1200, now)
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.12)

      gain.gain.setValueAtTime(0.05, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.onended = () => {
        try {
          osc.disconnect()
          gain.disconnect()
        } catch {}
      }

      osc.start(now)
      osc.stop(now + 0.12)
    })
  }

  public playLevelUp() {
    this.withCtx((ctx) => {
      const now = ctx.currentTime
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = 'square'
      osc2.type = 'triangle'

      osc1.frequency.setValueAtTime(440, now)
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.18)
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.36)

      osc2.frequency.setValueAtTime(660, now)
      osc2.frequency.exponentialRampToValueAtTime(990, now + 0.18)
      osc2.frequency.exponentialRampToValueAtTime(1560, now + 0.36)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.onended = () => {
        try {
          osc1.disconnect()
          osc2.disconnect()
          gain.disconnect()
        } catch {}
      }

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.45)
      osc2.stop(now + 0.45)
    })
  }

  public playCriticalWarning() {
    this.withCtx((ctx) => {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.linearRampToValueAtTime(180, now + 0.08)
      osc.frequency.linearRampToValueAtTime(220, now + 0.16)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.exponentialRampToValueAtTime(0.04, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.onended = () => {
        try {
          osc.disconnect()
          gain.disconnect()
        } catch {}
      }

      osc.start(now)
      osc.stop(now + 0.22)
    })
  }

  public playRadarBlip() {
    this.withCtx((ctx) => {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(1040, now)
      osc.frequency.exponentialRampToValueAtTime(1480, now + 0.07)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.exponentialRampToValueAtTime(0.03, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.onended = () => {
        try {
          osc.disconnect()
          gain.disconnect()
        } catch {}
      }

      osc.start(now)
      osc.stop(now + 0.08)
    })
  }

  public playBountyUnlock() {
    this.withCtx((ctx) => {
      const now = ctx.currentTime
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = 'triangle'
      osc2.type = 'square'

      osc1.frequency.setValueAtTime(523.25, now)
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.12)
      osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.24)

      osc2.frequency.setValueAtTime(659.25, now)
      osc2.frequency.exponentialRampToValueAtTime(987.77, now + 0.24)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.onended = () => {
        try {
          osc1.disconnect()
          osc2.disconnect()
          gain.disconnect()
        } catch {}
      }

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.3)
      osc2.stop(now + 0.3)
    })
  }

  public playElixirDrink() {
    this.withCtx((ctx) => {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(740, now)
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.08)
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.18)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.exponentialRampToValueAtTime(0.04, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.onended = () => {
        try {
          osc.disconnect()
          gain.disconnect()
        } catch {}
      }

      osc.start(now)
      osc.stop(now + 0.22)
    })
  }

  public playSwordSlash() {
    this.withCtx((ctx) => {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const filter = ctx.createBiquadFilter()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(320, now)
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.12)

      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(1400, now)
      filter.Q.setValueAtTime(3, now)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.onended = () => {
        try {
          osc.disconnect()
          filter.disconnect()
          gain.disconnect()
        } catch {}
      }

      osc.start(now)
      osc.stop(now + 0.14)
    })
  }
}

export const sfx = new RetroSFX()
