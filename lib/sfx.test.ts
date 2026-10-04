import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const makeParam = () => ({ setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() })
const oscillators: Array<{ start: ReturnType<typeof vi.fn> }> = []
const masterGain = makeParam()
class AudioContextStub {
  state = 'running'
  currentTime = 0
  destination = {}
  private gains = 0
  createGain() { return { gain: this.gains++ === 0 ? masterGain : makeParam(), connect: vi.fn(), disconnect: vi.fn() } }
  createOscillator() {
    const osc = { type: '', frequency: makeParam(), connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null }
    oscillators.push(osc)
    return osc
  }
}
const load = async () => (await vi.importActual<typeof import('./sfx')>('./sfx')).sfx
beforeEach(() => {
  vi.resetModules()
  localStorage.clear()
  oscillators.length = 0
  vi.clearAllMocks()
  vi.stubGlobal('AudioContext', AudioContextStub)
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('sound preferences and browser safety', () => {
  it('persists mute/volume and immediately mutes active audio', async () => {
    const sfx = await load()
    sfx.playQuestComplete()
    expect(oscillators).toHaveLength(3)
    sfx.setVolume(0.2)
    expect(masterGain.setValueAtTime).toHaveBeenLastCalledWith(0.2, 0)
    sfx.setEnabled(false)
    expect(masterGain.setValueAtTime).toHaveBeenLastCalledWith(0, 0)
    sfx.playLevelUp()
    expect(oscillators).toHaveLength(3)
    vi.resetModules()
    const restored = await load()
    expect(restored.isEnabled()).toBe(false)
    expect(restored.getVolume()).toBe(0.2)
  })

  it('keeps hover silent and avoids repeating a burst of identical cues', async () => {
    const sfx = await load()
    sfx.playHoverBlip()
    sfx.playSidebarHover()
    expect(oscillators).toHaveLength(0)
    sfx.playConfirm()
    sfx.playConfirm()
    expect(oscillators).toHaveLength(2)
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    sfx.playLevelUp()
    expect(oscillators).toHaveLength(2)
  })

  it('clamps volume and remains usable when audio is unavailable', async () => {
    const sfx = await load()
    sfx.setVolume(100)
    expect(sfx.getVolume()).toBe(1)
    sfx.setVolume(NaN)
    expect(sfx.getVolume()).toBe(1)
    vi.stubGlobal('AudioContext', class { constructor() { throw new Error('unavailable') } })
    expect(() => sfx.playDiscovery()).not.toThrow()
    sfx.setVolume(0)
    expect(() => sfx.playConfirm()).not.toThrow()
  })
})
