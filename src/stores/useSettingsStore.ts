import { create } from 'zustand'

interface SettingsState {
  playerName: string
  mouseSensitivity: number
  touchSensitivity: number
  masterVolume: number
  sfxVolume: number
  invertY: boolean
  touchControlsScale: number
  touchControlsOpacity: number

  setPlayerName: (name: string) => void
  setMouseSensitivity: (val: number) => void
  setTouchSensitivity: (val: number) => void
  setMasterVolume: (val: number) => void
  setSfxVolume: (val: number) => void
  setInvertY: (val: boolean) => void
  setTouchControlsScale: (val: number) => void
  setTouchControlsOpacity: (val: number) => void
}

const getStored = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(`spinostrike_${key}`)
    return item ? JSON.parse(item) : fallback
  } catch {
    return fallback
  }
}

const saveStored = (key: string, val: unknown) => {
  try {
    localStorage.setItem(`spinostrike_${key}`, JSON.stringify(val))
  } catch {
    // ignore
  }
}

export const useSettingsStore = create<SettingsState>((set) => ({
  playerName: getStored('playerName', 'Striker'),
  mouseSensitivity: getStored('mouseSensitivity', 1.8),
  touchSensitivity: getStored('touchSensitivity', 2.2),
  masterVolume: getStored('masterVolume', 0.8),
  sfxVolume: getStored('sfxVolume', 0.9),
  invertY: getStored('invertY', false),
  touchControlsScale: getStored('touchControlsScale', 1.0),
  touchControlsOpacity: getStored('touchControlsOpacity', 0.85),

  setPlayerName: (playerName) => {
    saveStored('playerName', playerName)
    set({ playerName })
  },
  setMouseSensitivity: (mouseSensitivity) => {
    saveStored('mouseSensitivity', mouseSensitivity)
    set({ mouseSensitivity })
  },
  setTouchSensitivity: (touchSensitivity) => {
    saveStored('touchSensitivity', touchSensitivity)
    set({ touchSensitivity })
  },
  setMasterVolume: (masterVolume) => {
    saveStored('masterVolume', masterVolume)
    set({ masterVolume })
  },
  setSfxVolume: (sfxVolume) => {
    saveStored('sfxVolume', sfxVolume)
    set({ sfxVolume })
  },
  setInvertY: (invertY) => {
    saveStored('invertY', invertY)
    set({ invertY })
  },
  setTouchControlsScale: (touchControlsScale) => {
    saveStored('touchControlsScale', touchControlsScale)
    set({ touchControlsScale })
  },
  setTouchControlsOpacity: (touchControlsOpacity) => {
    saveStored('touchControlsOpacity', touchControlsOpacity)
    set({ touchControlsOpacity })
  }
}))
