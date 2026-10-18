import type { WeaponConfig, WeaponId } from '../../../types/game.types'

export const WEAPON_DEFINITIONS: Record<WeaponId, WeaponConfig> = {
  ak47: {
    id: 'ak47',
    name: 'AK-47 Kalashnikov',
    slot: 1,
    type: 'rifle',
    damage: 36,
    headshotMultiplier: 3.5, // 126 damage -> 1-tap headshot kill!
    legMultiplier: 0.75,
    fireRate: 10.0, // 600 RPM
    clipSize: 30,
    maxReserve: 90,
    reloadTime: 2.5,
    recoilVertical: 0.045,
    recoilHorizontal: 0.015,
    spread: 0.012,
    zoomFov: 60,
    description: 'Senapan serbu legendaris dengan daya rusak mematikan dan 1-tap headshot kill.'
  },
  m4a1: {
    id: 'm4a1',
    name: 'M4A1 Carbine',
    slot: 2,
    type: 'rifle',
    damage: 32,
    headshotMultiplier: 3.0, // 96 damage (2-tap headshot or 1 head + 1 body)
    legMultiplier: 0.75,
    fireRate: 11.1, // 666 RPM
    clipSize: 30,
    maxReserve: 90,
    reloadTime: 2.7,
    recoilVertical: 0.032,
    recoilHorizontal: 0.01,
    spread: 0.008,
    zoomFov: 55,
    description: 'Senapan serbu presisi dengan recoil stabil dan laju tembak tinggi untuk pertempuran taktis.'
  },
  awp: {
    id: 'awp',
    name: 'AWP Magnum Sniper',
    slot: 3,
    type: 'sniper',
    damage: 115, // 1-shot kill to chest and head!
    headshotMultiplier: 4.0,
    legMultiplier: 0.75,
    fireRate: 0.85, // Bolt-action delay ~1.17s per shot
    clipSize: 5,
    maxReserve: 25,
    reloadTime: 3.4,
    recoilVertical: 0.12,
    recoilHorizontal: 0.03,
    spread: 0.002, // ultra pinpoint when scoped
    zoomFov: 18, // High-powered optical sniper scope
    description: 'Sniper rifle berdaya hancur dahsyat dengan zoom optik presisi tinggi. 1 peluru, 1 korban.'
  },
  ssg08: {
    id: 'ssg08',
    name: 'SSG-08 Scout Sniper',
    slot: 4,
    type: 'sniper',
    damage: 88,
    headshotMultiplier: 4.0, // 352 damage 1-shot headshot kill!
    legMultiplier: 0.75,
    fireRate: 1.25,
    clipSize: 10,
    maxReserve: 50,
    reloadTime: 2.8,
    recoilVertical: 0.08,
    recoilHorizontal: 0.02,
    spread: 0.003,
    zoomFov: 24,
    description: 'Senapan runduk ringan berkecepatan tinggi dengan magasin 10 peluru dan akurasi lompat mematikan.'
  },
  deagle: {
    id: 'deagle',
    name: 'Desert Eagle .50',
    slot: 5,
    type: 'pistol',
    damage: 54,
    headshotMultiplier: 3.2, // 172 headshot!
    legMultiplier: 0.7,
    fireRate: 3.8, // 228 RPM
    clipSize: 7,
    maxReserve: 35,
    reloadTime: 2.2,
    recoilVertical: 0.075,
    recoilHorizontal: 0.02,
    spread: 0.014,
    zoomFov: 65,
    description: 'Handgun bertenaga monster kaliber .50 AE. Mampu menjatuhkan lawan dengan satu peluru di kepala.'
  },
  knife: {
    id: 'knife',
    name: 'Tactical Knife',
    slot: 6,
    type: 'melee',
    damage: 55,
    headshotMultiplier: 1.5,
    legMultiplier: 1.0,
    fireRate: 2.2,
    clipSize: 1,
    maxReserve: 0,
    reloadTime: 0,
    recoilVertical: 0.01,
    recoilHorizontal: 0.01,
    spread: 0.001,
    description: 'Pisau taktis untuk serangan senyap jarak dekat. Serangan dari belakang menghasilkan instan kill.'
  }
}
