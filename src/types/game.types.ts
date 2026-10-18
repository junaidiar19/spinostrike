export type WeaponId = 'ak47' | 'm4a1' | 'awp' | 'deagle' | 'knife'

export type WeaponSlot = 1 | 2 | 3 // 1: Primary, 2: Secondary, 3: Melee

export type WeaponType = 'rifle' | 'sniper' | 'pistol' | 'melee'

export interface WeaponConfig {
  id: WeaponId
  name: string
  slot: WeaponSlot
  type: WeaponType
  damage: number
  headshotMultiplier: number
  legMultiplier: number
  fireRate: number // shots per second
  clipSize: number
  maxReserve: number
  reloadTime: number // seconds
  recoilVertical: number
  recoilHorizontal: number
  spread: number
  zoomFov?: number // for ADS/Scope
  description: string
}

export interface WeaponState {
  id: WeaponId
  clip: number
  reserve: number
  isReloading: boolean
  reloadProgress: number
}

export type GameStatus = 'MENU' | 'PLAYING' | 'PAUSED' | 'MAP_SELECT' | 'LOADOUT_SELECT' | 'SETTINGS'

export type Team = 'CT' | 'T'

export type MapId = 'dust_arena' | 'warehouse'

export interface MapMetadata {
  id: MapId
  name: string
  subtitle: string
  theme: string
  description: string
  accentColor: string
}

export interface KillFeedItem {
  id: string
  killerName: string
  killerTeam: Team
  victimName: string
  victimTeam: Team
  weaponName: string
  isHeadshot: boolean
  timestamp: number
}

export interface PlayerScore {
  id: string
  name: string
  team: Team
  kills: number
  deaths: number
  score: number
  ping: number
  isBot: boolean
}

export interface HitmarkerState {
  active: boolean
  isHeadshot: boolean
  timestamp: number
}
