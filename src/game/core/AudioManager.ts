import { useSettingsStore } from '../../stores/useSettingsStore'
import type { WeaponId } from '../../types/game.types'

class AudioManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private sfxGain: GainNode | null = null

  public init() {
    if (this.ctx) return
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return

    this.ctx = new AudioCtx()
    this.masterGain = this.ctx.createGain()
    this.sfxGain = this.ctx.createGain()

    const { masterVolume, sfxVolume } = useSettingsStore.getState()
    this.masterGain.gain.setValueAtTime(masterVolume, this.ctx.currentTime)
    this.sfxGain.gain.setValueAtTime(sfxVolume, this.ctx.currentTime)

    this.sfxGain.connect(this.masterGain)
    this.masterGain.connect(this.ctx.destination)

    // Subscribe to volume changes
    useSettingsStore.subscribe((state) => {
      if (!this.ctx || !this.masterGain || !this.sfxGain) return
      const now = this.ctx.currentTime
      this.masterGain.gain.setTargetAtTime(state.masterVolume, now, 0.05)
      this.sfxGain.gain.setTargetAtTime(state.sfxVolume, now, 0.05)
    })
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  // Gunshots
  public playGunshot(id: WeaponId) {
    if (!this.ctx || !this.sfxGain) return
    this.resume()
    const now = this.ctx.currentTime

    switch (id) {
      case 'ak47':
        this.playAK47Sound(now)
        break
      case 'm4a1':
        this.playM4A1Sound(now)
        break
      case 'awp':
        this.playAWPSound(now)
        break
      case 'deagle':
        this.playDeagleSound(now)
        break
      case 'knife':
        this.playKnifeSlash(now)
        break
    }
  }

  private playAK47Sound(now: number) {
    if (!this.ctx || !this.sfxGain) return
    // Heavy punch oscillator
    const osc = this.ctx.createOscillator()
    const oscGain = this.ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(160, now)
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.12)
    oscGain.gain.setValueAtTime(0.8, now)
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.14)

    // Noise burst
    const noise = this.createNoiseBuffer(0.18)
    const noiseNode = this.ctx.createBufferSource()
    noiseNode.buffer = noise
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(3200, now)
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.16)

    const noiseGain = this.ctx.createGain()
    noiseGain.gain.setValueAtTime(0.7, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18)

    osc.connect(oscGain)
    oscGain.connect(this.sfxGain)
    noiseNode.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(this.sfxGain)

    osc.start(now)
    osc.stop(now + 0.15)
    noiseNode.start(now)
    noiseNode.stop(now + 0.2)
  }

  private playM4A1Sound(now: number) {
    if (!this.ctx || !this.sfxGain) return
    // Snappy punch
    const osc = this.ctx.createOscillator()
    const oscGain = this.ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(200, now)
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.1)
    oscGain.gain.setValueAtTime(0.65, now)
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12)

    // Crisp high noise
    const noise = this.createNoiseBuffer(0.14)
    const noiseNode = this.ctx.createBufferSource()
    noiseNode.buffer = noise
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(2800, now)
    filter.Q.setValueAtTime(2.5, now)

    const noiseGain = this.ctx.createGain()
    noiseGain.gain.setValueAtTime(0.6, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.14)

    osc.connect(oscGain)
    oscGain.connect(this.sfxGain)
    noiseNode.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(this.sfxGain)

    osc.start(now)
    osc.stop(now + 0.12)
    noiseNode.start(now)
    noiseNode.stop(now + 0.15)
  }

  private playAWPSound(now: number) {
    if (!this.ctx || !this.sfxGain) return
    // Massive low boom
    const sub = this.ctx.createOscillator()
    const subGain = this.ctx.createGain()
    sub.type = 'sine'
    sub.frequency.setValueAtTime(180, now)
    sub.frequency.exponentialRampToValueAtTime(20, now + 0.45)
    subGain.gain.setValueAtTime(1.0, now)
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)

    // Crack
    const noise = this.createNoiseBuffer(0.6)
    const noiseNode = this.ctx.createBufferSource()
    noiseNode.buffer = noise
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(4500, now)
    filter.frequency.exponentialRampToValueAtTime(150, now + 0.5)

    const noiseGain = this.ctx.createGain()
    noiseGain.gain.setValueAtTime(0.9, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.005, now + 0.6)

    sub.connect(subGain)
    subGain.connect(this.sfxGain)
    noiseNode.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(this.sfxGain)

    sub.start(now)
    sub.stop(now + 0.5)
    noiseNode.start(now)
    noiseNode.stop(now + 0.65)
  }

  private playDeagleSound(now: number) {
    if (!this.ctx || !this.sfxGain) return
    const osc = this.ctx.createOscillator()
    const oscGain = this.ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(240, now)
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.15)
    oscGain.gain.setValueAtTime(0.85, now)
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18)

    const noise = this.createNoiseBuffer(0.2)
    const noiseNode = this.ctx.createBufferSource()
    noiseNode.buffer = noise
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(2200, now)

    const noiseGain = this.ctx.createGain()
    noiseGain.gain.setValueAtTime(0.7, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)

    osc.connect(oscGain)
    oscGain.connect(this.sfxGain)
    noiseNode.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(this.sfxGain)

    osc.start(now)
    osc.stop(now + 0.18)
    noiseNode.start(now)
    noiseNode.stop(now + 0.22)
  }

  private playKnifeSlash(now: number) {
    if (!this.ctx || !this.sfxGain) return
    const noise = this.createNoiseBuffer(0.12)
    const noiseNode = this.ctx.createBufferSource()
    noiseNode.buffer = noise
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(1800, now)
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.1)

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.5, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12)

    noiseNode.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxGain)

    noiseNode.start(now)
    noiseNode.stop(now + 0.14)
  }

  // Hitmarker sound
  public playHitmarker(isHeadshot: boolean) {
    if (!this.ctx || !this.sfxGain) return
    this.resume()
    const now = this.ctx.currentTime

    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.connect(gain)
      gain.connect(this.sfxGain)

      // In Web Audio API, start() MUST be called before stop()
      osc.start(now)

      if (isHeadshot) {
        // High bell ping for headshot
        osc.frequency.setValueAtTime(2400, now)
        osc.frequency.setValueAtTime(3200, now + 0.04)
        gain.gain.setValueAtTime(0.65, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18)
        osc.stop(now + 0.2)
      } else {
        // Crisp ding
        osc.frequency.setValueAtTime(1750, now)
        gain.gain.setValueAtTime(0.45, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
        osc.stop(now + 0.12)
      }
    } catch {
      // ignore audio state error
    }
  }

  // Reload sound
  public playReloadSound() {
    if (!this.ctx || !this.sfxGain) return
    this.resume()
    const now = this.ctx.currentTime

    // Click 1: Mag out
    this.playClick(now, 1200, 0.05)
    // Click 2: Mag in
    this.playClick(now + 0.7, 900, 0.07)
    // Click 3: Bolt slide
    this.playClick(now + 1.2, 1600, 0.08)
  }

  private playClick(time: number, freq: number, duration: number) {
    if (!this.ctx || !this.sfxGain) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, time)
    gain.gain.setValueAtTime(0.35, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration)
    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(time)
    osc.stop(time + duration + 0.01)
  }

  public playDryFire() {
    if (!this.ctx || !this.sfxGain) return
    this.resume()
    const now = this.ctx.currentTime
    this.playClick(now, 2200, 0.03)
  }

  // Footstep
  public playFootstep() {
    if (!this.ctx || !this.sfxGain) return
    this.resume()
    const now = this.ctx.currentTime

    const noise = this.createNoiseBuffer(0.08)
    const noiseNode = this.ctx.createBufferSource()
    noiseNode.buffer = noise
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(350, now)

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07)

    noiseNode.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxGain)

    noiseNode.start(now)
    noiseNode.stop(now + 0.09)
  }

  private createNoiseBuffer(duration: number): AudioBuffer {
    if (!this.ctx) throw new Error('No audio context')
    const bufferSize = this.ctx.sampleRate * duration
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    return buffer
  }
}

export const audioManager = new AudioManager()
