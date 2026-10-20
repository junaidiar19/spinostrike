import { create } from 'zustand'
import type {
  GameStatus,
  HitmarkerState,
  KillFeedItem,
  MapId,
  PlayerScore,
  Team,
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
  lastWeaponId: WeaponId
  ammoToast: string | null
  matchDuration: number
  matchTimeRemaining: number
  matchTargetKills: number
  teamScores: { CT: number; T: number }
  isMatchEnded: boolean
  matchResult: 'VICTORY' | 'DEFEAT' | 'DRAW' | null

  // Actions
  setGameStatus: (status: GameStatus) => void
  setSelectedPrimary: (id: WeaponId) => void
  setSelectedSecondary: (id: WeaponId) => void
  setCurrentSlot: (slot: WeaponSlot) => void
  setActiveWeapon: (id: WeaponId) => void
  cycleWeapon: (direction: 'next' | 'prev') => void
  quickSwitchWeapon: () => void
  refillAmmo: (weaponId?: WeaponId) => void
  clearAmmoToast: () => void
  triggerAmmoNotice: (msg: string) => void
  updateWeaponState: (id: WeaponId, state: Partial<WeaponState>) => void
  setHealth: (hp: number) => void
  setArmor: (armor: number) => void
  applyDamageToPlayer: (
    rawDamage: number,
    killerBotId?: string,
    killerName?: string,
    killerTeam?: 'T' | 'CT',
    weaponName?: string,
    hitAngle?: number
  ) => void
  setIsAiming: (isAiming: boolean) => void
  setCrosshairSpread: (spread: number) => void
  triggerHitmarker: (isHeadshot: boolean) => void
  triggerDamageFlash: () => void
  triggerDirectionalDamage: (angle?: number) => void
  setCurrentMap: (map: MapId) => void
  addKillFeed: (item: Omit<KillFeedItem, 'id' | 'timestamp'>) => void
  setScoreboard: (scores: PlayerScore[]) => void
  updatePlayerName: (name: string) => void
  updateRemotePlayerName: (id: string, name: string) => void
  setPlayerTeam: (team: Team) => void
  addOrUpdatePlayerScore: (score: PlayerScore) => void
  removePlayerScore: (id: string) => void
  recordPlayerKill: (victimBotId: string, victimName: string, victimTeam: 'T' | 'CT', isHeadshot: boolean) => void
  recordPlayerDeath: (killerBotId: string, killerName: string, killerTeam: 'T' | 'CT', weaponName: string) => void
  respawnPlayer: () => void
  setMatchGraceTimer: (seconds: number) => void
  setSpawnProtection: (seconds: number) => void
  setIsMobile: (isMobile: boolean) => void
  setIsScoreboardOpen: (isOpen: boolean) => void
  tickMatchTimer: (dt: number) => void
  incrementTeamScore: (team: Team) => void
  endMatch: () => void
  restartMatch: () => void
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
  lastWeaponId: 'deagle',
  ammoToast: null,
  matchDuration: 300,
  matchTimeRemaining: 300,
  matchTargetKills: 25,
  teamScores: { CT: 0, T: 0 },
  isMatchEnded: false,
  matchResult: null,

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
      activeWeaponId: state.currentSlot === 5 ? id : state.activeWeaponId
    }))
  },

  setCurrentSlot: (slot) => {
    const slotToWeapon: Record<WeaponSlot, WeaponId> = {
      1: 'ak47',
      2: 'm4a1',
      3: 'awp',
      4: 'ssg08',
      5: 'deagle',
      6: 'knife'
    }
    const targetId = slotToWeapon[slot] || 'ak47'
    const current = get().activeWeaponId
    set({
      currentSlot: slot,
      activeWeaponId: targetId,
      lastWeaponId: current !== targetId ? current : get().lastWeaponId,
      isAiming: false
    })
  },

  setActiveWeapon: (id) => {
    const weaponToSlot: Record<WeaponId, WeaponSlot> = {
      ak47: 1,
      m4a1: 2,
      awp: 3,
      ssg08: 4,
      deagle: 5,
      knife: 6
    }
    const current = get().activeWeaponId
    set({
      activeWeaponId: id,
      currentSlot: weaponToSlot[id] || 1,
      lastWeaponId: current !== id ? current : get().lastWeaponId,
      isAiming: false
    })
  },

  cycleWeapon: (direction) => {
    const current = get().currentSlot
    let next: WeaponSlot = 1
    if (direction === 'next') {
      next = (current >= 6 ? 1 : current + 1) as WeaponSlot
    } else {
      next = (current <= 1 ? 6 : current - 1) as WeaponSlot
    }
    get().setCurrentSlot(next)
  },

  quickSwitchWeapon: () => {
    const { lastWeaponId, activeWeaponId } = get()
    if (lastWeaponId && lastWeaponId !== activeWeaponId) {
      get().setActiveWeapon(lastWeaponId)
    }
  },

  refillAmmo: (weaponId) => {
    set((state) => {
      const updated = { ...state.weaponStates }
      if (weaponId && weaponId !== 'knife') {
        const cfg = WEAPON_DEFINITIONS[weaponId]
        if (cfg) {
          updated[weaponId] = {
            ...updated[weaponId],
            clip: cfg.clipSize,
            reserve: cfg.maxReserve,
            isReloading: false,
            reloadProgress: 0
          }
        }
      } else {
        // Refill ALL firearms
        for (const id of Object.keys(updated) as WeaponId[]) {
          if (id === 'knife') continue
          const cfg = WEAPON_DEFINITIONS[id]
          if (cfg) {
            updated[id] = {
              ...updated[id],
              clip: cfg.clipSize,
              reserve: cfg.maxReserve,
              isReloading: false,
              reloadProgress: 0
            }
          }
        }
      }
      return {
        weaponStates: updated,
        ammoToast: 'AMMO RESTOCKED! Peluru cadangan semua senjata terisi penuh.'
      }
    })
    setTimeout(() => {
      set({ ammoToast: null })
    }, 2800)
  },

  clearAmmoToast: () => set({ ammoToast: null }),

  triggerAmmoNotice: (msg: string) => {
    set({ ammoToast: msg })
    setTimeout(() => {
      set({ ammoToast: null })
    }, 2500)
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
  applyDamageToPlayer: (rawDamage, killerBotId, killerName, killerTeam, weaponName, hitAngle) => {
    const state = get()
    if (state.isPlayerDead || state.spawnProtection > 0 || state.matchGraceTimer > 0) return

    const currentHp = state.health
    let currentArmor = state.armor

    // Tactical Shooter Kevlar Armor Mechanic:
    // Armor absorbs 60% of incoming damage, remaining 40% goes to HP.
    let hpDamage = rawDamage
    if (currentArmor > 0) {
      const absorbed = Math.min(currentArmor, Math.round(rawDamage * 0.6))
      currentArmor = Math.max(0, currentArmor - absorbed)
      hpDamage = Math.max(1, rawDamage - absorbed)
    }

    const newHp = Math.max(0, currentHp - hpDamage)
    set({
      health: newHp,
      armor: currentArmor
    })

    // Directional damage indicator & screen flash
    state.triggerDirectionalDamage(hitAngle)

    if (newHp <= 0 && !state.isPlayerDead) {
      state.recordPlayerDeath(
        killerBotId || 'bot-enemy',
        killerName || 'Bot',
        killerTeam || 'T',
        weaponName || 'AK-47'
      )
    }
  },
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

  updatePlayerName: (name: string) => {
    const formatted = `${name} (You)`
    set((state) => ({
      scoreboard: state.scoreboard.map((p) =>
        p.id === 'player-1' ? { ...p, name: formatted } : p
      )
    }))
  },

  updateRemotePlayerName: (id: string, name: string) => {
    set((state) => ({
      scoreboard: state.scoreboard.map((p) => (p.id === id ? { ...p, name } : p))
    }))
  },

  setPlayerTeam: (team: Team) => {
    set((state) => ({
      scoreboard: state.scoreboard.map((p) =>
        p.id === 'player-1' ? { ...p, team } : p
      )
    }))
  },

  addOrUpdatePlayerScore: (player: PlayerScore) => {
    set((state) => {
      const idx = state.scoreboard.findIndex((p) => p.id === player.id)
      if (idx >= 0) {
        const copy = [...state.scoreboard]
        copy[idx] = { ...copy[idx], ...player }
        return { scoreboard: copy }
      }
      return { scoreboard: [...state.scoreboard, player] }
    })
  },

  removePlayerScore: (id: string) => {
    set((state) => ({
      scoreboard: state.scoreboard.filter((p) => p.id !== id)
    }))
  },

  recordPlayerKill: (victimBotId, victimName, victimTeam, isHeadshot) => {
    const state = get()
    const activeWeapon = state.activeWeaponId.toUpperCase()
    const myPlayer = state.scoreboard.find((p) => p.id === 'player-1')
    const myName = myPlayer?.name || 'Striker (You)'
    const myTeam = myPlayer?.team || 'CT'

    state.addKillFeed({
      killerName: myName,
      killerTeam: myTeam,
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
    state.incrementTeamScore(myTeam)
  },

  recordPlayerDeath: (killerBotId, killerName, killerTeam, weaponName) => {
    const state = get()
    if (state.isPlayerDead) return // prevent multiple death triggers

    const myPlayer = state.scoreboard.find((p) => p.id === 'player-1')
    const myName = myPlayer?.name || 'Striker (You)'
    const myTeam = myPlayer?.team || 'CT'

    state.addKillFeed({
      killerName,
      killerTeam,
      victimName: myName,
      victimTeam: myTeam,
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
    state.incrementTeamScore(killerTeam)

    set({
      health: 0,
      isPlayerDead: true,
      killerInfo: { name: killerName, weapon: weaponName },
      respawnCountdown: 3,
      scoreboard: updatedScores
    })
  },

  respawnPlayer: () => {
    get().refillAmmo()
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
  tickMatchTimer: (dt: number) => {
    const state = get()
    if (state.isMatchEnded || state.gameStatus !== 'PLAYING') return

    const nextTime = Math.max(0, state.matchTimeRemaining - dt)
    set({ matchTimeRemaining: nextTime })

    if (nextTime <= 0) {
      state.endMatch()
    }
  },

  incrementTeamScore: (team: Team) => {
    const state = get()
    if (state.isMatchEnded) return

    const newScores = {
      ...state.teamScores,
      [team]: state.teamScores[team] + 1
    }
    set({ teamScores: newScores })

    if (newScores[team] >= state.matchTargetKills) {
      state.endMatch()
    }
  },

  endMatch: () => {
    const state = get()
    if (state.isMatchEnded) return

    const myPlayer = state.scoreboard.find((p) => p.id === 'player-1')
    const myTeam = myPlayer?.team || 'CT'
    const ctScore = state.teamScores.CT
    const tScore = state.teamScores.T

    let result: 'VICTORY' | 'DEFEAT' | 'DRAW' = 'DRAW'
    if (ctScore > tScore) {
      result = myTeam === 'CT' ? 'VICTORY' : 'DEFEAT'
    } else if (tScore > ctScore) {
      result = myTeam === 'T' ? 'VICTORY' : 'DEFEAT'
    } else {
      result = 'DRAW'
    }

    set({ isMatchEnded: true, matchResult: result, isScoreboardOpen: true })

    import('../game/core/AudioManager').then(({ audioManager }) => {
      if (result === 'VICTORY') {
        audioManager.playVictorySound()
      } else {
        audioManager.playDefeatSound()
      }
    }).catch(() => {})
  },

  restartMatch: () => {
    set({
      matchTimeRemaining: 300,
      teamScores: { CT: 0, T: 0 },
      isMatchEnded: false,
      matchResult: null,
      isScoreboardOpen: false
    })
  },

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
