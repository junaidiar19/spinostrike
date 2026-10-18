import { supabase, isSupabaseConfigured } from './client'
import type { WeaponId } from '../../types/game.types'

export interface PlayerProfile {
  id: string
  nickname: string
  kills: number
  deaths: number
  headshots: number
  matches_played: number
  selected_primary: WeaponId
  selected_secondary: WeaponId
  updated_at?: string
}

const LOCAL_PROFILE_KEY = 'spinostrike_local_profile'

export const getProfile = async (userId: string): Promise<PlayerProfile | null> => {
  // 1. Check local storage first for instant response without network delays
  try {
    const local = localStorage.getItem(`${LOCAL_PROFILE_KEY}_${userId}`)
    if (local) return JSON.parse(local)
  } catch {
    // ignore
  }

  // 2. Query Supabase for registered accounts
  if (isSupabaseConfigured() && !userId.startsWith('guest_')) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && data) {
        try {
          localStorage.setItem(`${LOCAL_PROFILE_KEY}_${userId}`, JSON.stringify(data))
        } catch {
          // ignore
        }
        return data as PlayerProfile
      }
    } catch {
      // ignore
    }
  }

  return null
}

export const upsertProfile = async (
  profile: Partial<PlayerProfile> & { id: string }
): Promise<PlayerProfile> => {
  const existing = await getProfile(profile.id)
  const fullProfile: PlayerProfile = {
    id: profile.id,
    nickname: profile.nickname || existing?.nickname || 'Striker',
    kills: profile.kills ?? existing?.kills ?? 0,
    deaths: profile.deaths ?? existing?.deaths ?? 0,
    headshots: profile.headshots ?? existing?.headshots ?? 0,
    matches_played: profile.matches_played ?? existing?.matches_played ?? 0,
    selected_primary: profile.selected_primary || existing?.selected_primary || 'ak47',
    selected_secondary: profile.selected_secondary || existing?.selected_secondary || 'deagle',
    updated_at: new Date().toISOString()
  }

  // Save to local cache immediately
  try {
    localStorage.setItem(`${LOCAL_PROFILE_KEY}_${profile.id}`, JSON.stringify(fullProfile))
  } catch {
    // ignore
  }

  // Sync registered user to Supabase
  if (isSupabaseConfigured() && !profile.id.startsWith('guest_')) {
    try {
      await supabase.from('profiles').upsert(fullProfile)
    } catch {
      // table might not be initialized yet
    }
  }

  return fullProfile
}

export const recordCombatStats = async (
  userId: string,
  stats: { kills: number; deaths: number; headshots: number }
): Promise<void> => {
  const current = await getProfile(userId)
  if (!current) return

  await upsertProfile({
    id: userId,
    kills: current.kills + stats.kills,
    deaths: current.deaths + stats.deaths,
    headshots: current.headshots + stats.headshots,
    matches_played: current.matches_played + 1
  })
}

export const saveUserLoadout = async (
  userId: string,
  primary: WeaponId,
  secondary: WeaponId
): Promise<void> => {
  await upsertProfile({
    id: userId,
    selected_primary: primary,
    selected_secondary: secondary
  })
}
