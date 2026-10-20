export type WeaponId = 'ak47' | 'm4a1' | 'awp' | 'ssg08' | 'deagle' | 'knife'

export type WeaponSlot = 1 | 2 | 3 | 4 | 5 | 6

export interface ArenaWeaponSlot {
  slot: WeaponSlot
  id: WeaponId
  name: string
  shortName: string
  key: string
  type: WeaponType
}

export const ALL_ARENA_WEAPONS: ArenaWeaponSlot[] = [
  { slot: 1, id: 'ak47', name: 'AK-47 Kalashnikov', shortName: 'AK-47', key: '1', type: 'rifle' },
  { slot: 2, id: 'm4a1', name: 'M4A1 Carbine', shortName: 'M4A1', key: '2', type: 'rifle' },
  { slot: 3, id: 'awp', name: 'AWP Magnum Sniper', shortName: 'AWP', key: '3', type: 'sniper' },
  { slot: 4, id: 'ssg08', name: 'SSG-08 Scout', shortName: 'SCOUT', key: '4', type: 'sniper' },
  { slot: 5, id: 'deagle', name: 'Desert Eagle .50', shortName: 'DEAGLE', key: '5', type: 'pistol' },
  { slot: 6, id: 'knife', name: 'Tactical Knife', shortName: 'KNIFE', key: '6', type: 'melee' }
]

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

export type MapId =
  | 'dust_arena'
  | 'warehouse'
  | 'arctic_outpost'
  | 'italian_villa'
  | 'cargo_harbor'

export interface MapMetadata {
  id: MapId
  name: string
  subtitle: string
  theme: string
  description: string
  accentColor: string
  previewImage: string
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
