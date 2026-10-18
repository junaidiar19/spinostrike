import { create } from 'zustand'
import type {
  GameStatus,
  HitmarkerState,
  KillFeedItem,
  MapId,
  PlayerScore,
  WeaponId,
  WeaponSlot,
  WeaponState
} from '../types/game.types'
import { WEAPON_DEFINITIONS } from '../game/weapons/definitions/weapons'

interface GameStoreState {
  gameStatus: GameStatus
  selectedPrimary: WeaponId
  selectedSecondary: WeaponId
  currentSlot: WeaponSlot
  activeWeaponId: WeaponId
  weaponStates: Record<WeaponId, WeaponState>
  health: number
  armor: number
  isAiming: boolean
  crosshairSpread: number
  hitmarker: HitmarkerState
  damageFlash: boolean
  damageAngle: number | null
  currentMap: MapId
  killfeed: KillFeedItem[]
  scoreboard: PlayerScore[]
  isMobile: boolean
  isScoreboardOpen: boolean
  isPlayerDead: boolean
  killerInfo: { name: string; weapon: string } | null
  respawnCountdown: number
  matchGraceTimer: number
  spawnProtection: number

  // Actions
  setGameStatus: (status: GameStatus) => void
  setSelectedPrimary: (id: WeaponId) => void
  setSelectedSecondary: (id: WeaponId) => void
  setCurrentSlot: (slot: WeaponSlot) => void
  updateWeaponState: (id: WeaponId, state: Partial<WeaponState>) => void
  setHealth: (hp: number) => void
  setArmor: (armor: number) => void
  setIsAiming: (isAiming: boolean) => void
  setCrosshairSpread: (spread: number) => void
  triggerHitmarker: (isHeadshot: boolean) => void
  triggerDamageFlash: () => void
  triggerDirectionalDamage: (angle?: number) => void
  setCurrentMap: (map: MapId) => void
  addKillFeed: (item: Omit<KillFeedItem, 'id' | 'timestamp'>) => void
  setScoreboard: (scores: PlayerScore[]) => void
  recordPlayerKill: (victimBotId: string, victimName: string, victimTeam: 'T' | 'CT', isHeadshot: boolean) => void
  recordPlayerDeath: (killerBotId: string, killerName: string, killerTeam: 'T' | 'CT', weaponName: string) => void
  respawnPlayer: () => void
  setMatchGraceTimer: (seconds: number) => void
  setSpawnProtection: (seconds: number) => void
  setIsMobile: (isMobile: boolean) => void
  setIsScoreboardOpen: (isOpen: boolean) => void
  resetPlayerStats: () => void
}

const initialWeaponStates: Record<WeaponId, WeaponState> = {
  ak47: {
    id: 'ak47',
    clip: WEAPON_DEFINITIONS.ak47.clipSize,
    reserve: WEAPON_DEFINITIONS.ak47.maxReserve,
    isReloading: false,
    reloadProgress: 0
  },
  m4a1: {
    id: 'm4a1',
    clip: WEAPON_DEFINITIONS.m4a1.clipSize,
    reserve: WEAPON_DEFINITIONS.m4a1.maxReserve,
    isReloading: false,
    reloadProgress: 0
  },
  awp: {
    id: 'awp',
    clip: WEAPON_DEFINITIONS.awp.clipSize,
    reserve: WEAPON_DEFINITIONS.awp.maxReserve,
    isReloading: false,
    reloadProgress: 0
  },
  ssg08: {
    id: 'ssg08',
    clip: WEAPON_DEFINITIONS.ssg08.clipSize,
    reserve: WEAPON_DEFINITIONS.ssg08.maxReserve,
    isReloading: false,
    reloadProgress: 0
  },
  deagle: {
    id: 'deagle',
    clip: WEAPON_DEFINITIONS.deagle.clipSize,
    reserve: WEAPON_DEFINITIONS.deagle.maxReserve,
    isReloading: false,
    reloadProgress: 0
  },
  knife: {
    id: 'knife',
    clip: 1,
    reserve: 0,
    isReloading: false,
    reloadProgress: 0
  }
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  gameStatus: 'MENU',
  selectedPrimary: 'ak47',
  selectedSecondary: 'deagle',
  currentSlot: 1,
  activeWeaponId: 'ak47',
  weaponStates: initialWeaponStates,
  health: 100,
  armor: 100,
  isAiming: false,
  crosshairSpread: 1.0,
  hitmarker: { active: false, isHeadshot: false, timestamp: 0 },
  damageFlash: false,
  damageAngle: null,
  currentMap: 'dust_arena',
  killfeed: [],
  scoreboard: [
    { id: 'player-1', name: 'Striker (You)', team: 'CT', kills: 0, deaths: 0, score: 0, ping: 12, isBot: false },
    { id: 'bot-1', name: 'Bot Bravo', team: 'T', kills: 0, deaths: 0, score: 0, ping: 25, isBot: true },
    { id: 'bot-2', name: 'Bot Viper', team: 'T', kills: 0, deaths: 0, score: 0, ping: 30, isBot: true },
    { id: 'bot-3', name: 'Bot Ghost', team: 'CT', kills: 0, deaths: 0, score: 0, ping: 18, isBot: true },
    { id: 'bot-4', name: 'Bot Rex', team: 'T', kills: 0, deaths: 0, score: 0, ping: 22, isBot: true }
  ],
  isMobile: false,
  isScoreboardOpen: false,
  isPlayerDead: false,
  killerInfo: null,
  respawnCountdown: 0,
  matchGraceTimer: 0,
  spawnProtection: 0,

  setGameStatus: (status) => set({ gameStatus: status }),

  setSelectedPrimary: (id) => {
    set((state) => ({
      selectedPrimary: id,
      activeWeaponId: state.currentSlot === 1 ? id : state.activeWeaponId
    }))
  },

  setSelectedSecondary: (id) => {
    set((state) => ({
      selectedSecondary: id,
      activeWeaponId: state.currentSlot === 2 ? id : state.activeWeaponId
    }))
  },

  setCurrentSlot: (slot) => {
    const { selectedPrimary, selectedSecondary } = get()
    let activeId: WeaponId = 'knife'
    if (slot === 1) activeId = selectedPrimary
    else if (slot === 2) activeId = selectedSecondary
    else activeId = 'knife'

    set({ currentSlot: slot, activeWeaponId: activeId, isAiming: false })
  },

  updateWeaponState: (id, updated) => {
    set((state) => ({
      weaponStates: {
        ...state.weaponStates,
        [id]: { ...state.weaponStates[id], ...updated }
      }
    }))
  },

  setHealth: (hp) => set({ health: Math.max(0, Math.min(100, hp)) }),
  setArmor: (armor) => set({ armor: Math.max(0, Math.min(100, armor)) }),
  setIsAiming: (isAiming) => set({ isAiming }),
  setCrosshairSpread: (crosshairSpread) => set({ crosshairSpread }),

  triggerHitmarker: (isHeadshot) => {
    set({
      hitmarker: {
        active: true,
        isHeadshot,
        timestamp: Date.now()
      }
    })
    setTimeout(() => {
      set((state) => {
        if (Date.now() - state.hitmarker.timestamp >= 150) {
          return { hitmarker: { ...state.hitmarker, active: false } }
        }
        return state
      })
    }, 180)
  },

  triggerDamageFlash: () => {
    set({ damageFlash: true })
    setTimeout(() => set({ damageFlash: false }), 250)
  },

  triggerDirectionalDamage: (angle?: number) => {
    set({
      damageFlash: true,
      damageAngle: typeof angle === 'number' ? angle : null
    })
    setTimeout(() => {
      set({ damageFlash: false, damageAngle: null })
    }, 450)
  },

  setCurrentMap: (currentMap) => set({ currentMap }),

  addKillFeed: (item) => {
    const newItem: KillFeedItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now()
    }
    set((state) => ({
      killfeed: [newItem, ...state.killfeed.slice(0, 4)]
    }))
  },

  setScoreboard: (scoreboard) => set({ scoreboard }),

  recordPlayerKill: (victimBotId, victimName, victimTeam, isHeadshot) => {
    const state = get()
    const activeWeapon = state.activeWeaponId.toUpperCase()
    state.addKillFeed({
      killerName: 'Striker (You)',
      killerTeam: 'CT',
      victimName,
      victimTeam,
      weaponName: activeWeapon,
      isHeadshot
    })

    const updatedScores = state.scoreboard.map((p) => {
      if (p.id === 'player-1') {
        return { ...p, kills: p.kills + 1, score: p.score + (isHeadshot ? 150 : 100) }
      }
      if (p.id === victimBotId) {
        return { ...p, deaths: p.deaths + 1 }
      }
      return p
    })
    set({ scoreboard: updatedScores })
  },

  recordPlayerDeath: (killerBotId, killerName, killerTeam, weaponName) => {
    const state = get()
    if (state.isPlayerDead) return // prevent multiple death triggers

    state.addKillFeed({
      killerName,
      killerTeam,
      victimName: 'Striker (You)',
      victimTeam: 'CT',
      weaponName,
      isHeadshot: false
    })

    const updatedScores = state.scoreboard.map((p) => {
      if (p.id === killerBotId) {
        return { ...p, kills: p.kills + 1, score: p.score + 100 }
      }
      if (p.id === 'player-1') {
        return { ...p, deaths: p.deaths + 1 }
      }
      return p
    })

    set({
      health: 0,
      isPlayerDead: true,
      killerInfo: { name: killerName, weapon: weaponName },
      respawnCountdown: 3,
      scoreboard: updatedScores
    })
  },

  respawnPlayer: () => {
    set({
      health: 100,
      armor: 100,
      isPlayerDead: false,
      killerInfo: null,
      respawnCountdown: 0,
      spawnProtection: 3.5, // 3.5s of invulnerability & bot ignore upon respawn
      damageFlash: false
    })
  },

  setMatchGraceTimer: (seconds) => set({ matchGraceTimer: seconds }),
  setSpawnProtection: (seconds) => set({ spawnProtection: seconds }),

  setIsMobile: (isMobile) => set({ isMobile }),
  setIsScoreboardOpen: (isScoreboardOpen) => set({ isScoreboardOpen }),

  resetPlayerStats: () => {
    set({
      health: 100,
      armor: 100,
      isAiming: false,
      isPlayerDead: false,
      killerInfo: null,
      respawnCountdown: 0,
      damageFlash: false,
      weaponStates: initialWeaponStates
    })
  }
}))
