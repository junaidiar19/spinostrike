import { supabase } from './client'
import { getProfile, upsertProfile } from './profile'
import type { WeaponId } from '../../types/game.types'

export interface UserSession {
  id: string
  nickname: string
  email?: string
  isGuest: boolean
}

const GUEST_KEY = 'spinostrike_guest_session'

export const getStoredGuestSession = (): UserSession => {
  try {
    const data = localStorage.getItem(GUEST_KEY)
    if (data) return JSON.parse(data)
  } catch {
    // fallback
  }

  const guestId = `guest_${Math.random().toString(36).substring(2, 10)}`
  const guestSession: UserSession = {
    id: guestId,
    nickname: `Operative_${guestId.substring(6, 10).toUpperCase()}`,
    isGuest: true
  }
  localStorage.setItem(GUEST_KEY, JSON.stringify(guestSession))
  return guestSession
}

export const signInGuest = async (customNickname?: string): Promise<UserSession> => {
  const session = getStoredGuestSession()
  if (customNickname && customNickname.trim()) {
    session.nickname = customNickname.trim()
    localStorage.setItem(GUEST_KEY, JSON.stringify(session))
  }

  // Ensure profile exists in Supabase
  try {
    await upsertProfile({
      id: session.id,
      nickname: session.nickname,
      selected_primary: 'ak47',
      selected_secondary: 'deagle'
    })
  } catch {
    // offline or table not yet initialized
  }

  return session
}

export const signUpWithEmail = async (
  email: string,
  pass: string,
  nickname: string
): Promise<{ session: UserSession | null; error: string | null }> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass
    })

    if (error) return { session: null, error: error.message }
    if (!data.user) return { session: null, error: 'User registration failed' }

    const userSession: UserSession = {
      id: data.user.id,
      email: data.user.email,
      nickname: nickname.trim() || data.user.email?.split('@')[0] || 'Striker',
      isGuest: false
    }

    await upsertProfile({
      id: userSession.id,
      nickname: userSession.nickname,
      selected_primary: 'ak47' as WeaponId,
      selected_secondary: 'deagle' as WeaponId
    })

    return { session: userSession, error: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { session: null, error: msg }
  }
}

export const signInWithEmail = async (
  email: string,
  pass: string
): Promise<{ session: UserSession | null; error: string | null }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass
    })

    if (error) return { session: null, error: error.message }
    if (!data.user) return { session: null, error: 'User login failed' }

    const profile = await getProfile(data.user.id)

    const userSession: UserSession = {
      id: data.user.id,
      email: data.user.email,
      nickname: profile?.nickname || data.user.email?.split('@')[0] || 'Striker',
      isGuest: false
    }

    return { session: userSession, error: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { session: null, error: msg }
  }
}

export const signOutUser = async (): Promise<void> => {
  try {
    await supabase.auth.signOut()
  } catch {
    // ignore
  }
}
