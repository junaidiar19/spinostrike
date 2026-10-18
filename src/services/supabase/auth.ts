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
export const AUTH_USER_KEY = 'spinostrike_auth_user'

export const getStoredGuestSession = (): UserSession => {
  try {
    const data = localStorage.getItem(GUEST_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      // If nickname was the old robotic Operative_ prefix, clean it up to Striker or settings name
      if (parsed.nickname && parsed.nickname.startsWith('Operative_')) {
        const customName = localStorage.getItem('spinostrike_playerName')
        parsed.nickname = (customName && JSON.parse(customName)) || 'Striker'
        localStorage.setItem(GUEST_KEY, JSON.stringify(parsed))
      }
      return parsed
    }
  } catch {
    // fallback
  }

  let defaultName = 'Striker'
  try {
    const customName = localStorage.getItem('spinostrike_playerName')
    if (customName) {
      const parsed = JSON.parse(customName)
      if (typeof parsed === 'string' && parsed.trim()) defaultName = parsed.trim()
    }
  } catch {
    // ignore
  }

  const guestId = `guest_${Math.random().toString(36).substring(2, 10)}`
  const guestSession: UserSession = {
    id: guestId,
    nickname: defaultName,
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
): Promise<{ session: UserSession | null; error: string | null; requiresConfirmation?: boolean }> => {
  try {
    const cleanEmail = email.trim().toLowerCase()
    const cleanNickname = nickname.trim()

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      return {
        session: null,
        error: 'Format email tidak valid. Pastikan format email benar (contoh: pemain@gmail.com) tanpa spasi.'
      }
    }

    if (pass.length < 6) {
      return {
        session: null,
        error: 'Kata sandi minimal 6 karakter.'
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: pass,
      options: {
        data: {
          nickname: cleanNickname
        }
      }
    })

    if (error) {
      const raw = error.message.toLowerCase()
      let msg = error.message
      if (raw.includes('invalid') && raw.includes('email')) {
        msg = 'Format alamat email tidak valid menurut server. Pastikan email menggunakan domain umum (contoh: nama@gmail.com).'
      } else if (raw.includes('already registered') || raw.includes('user already exists')) {
        msg = 'Email ini sudah terdaftar. Silakan pilih tab SIGN IN untuk masuk.'
      } else if (raw.includes('rate limit')) {
        msg = 'Terlalu banyak percobaan pendaftaran. Harap tunggu beberapa saat.'
      }
      return { session: null, error: msg }
    }

    if (!data.user) return { session: null, error: 'Pendaftaran akun gagal.' }

    const userSession: UserSession = {
      id: data.user.id,
      email: data.user.email,
      nickname: cleanNickname || data.user.user_metadata?.nickname || data.user.email?.split('@')[0] || 'Striker',
      isGuest: false
    }

    // Persist authenticated user session
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userSession))

    try {
      await upsertProfile({
        id: userSession.id,
        nickname: userSession.nickname,
        selected_primary: 'ak47' as WeaponId,
        selected_secondary: 'deagle' as WeaponId
      })
    } catch {
      // Offline or RLS pending confirmation
    }

    const requiresConfirmation = !data.session
    return { session: userSession, error: null, requiresConfirmation }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kendala saat pendaftaran.'
    return { session: null, error: msg }
  }
}

export const signInWithEmail = async (
  email: string,
  pass: string
): Promise<{ session: UserSession | null; error: string | null }> => {
  try {
    const cleanEmail = email.trim().toLowerCase()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: pass
    })

    if (error) {
      const raw = error.message.toLowerCase()
      let msg = error.message
      if (raw.includes('invalid login credentials')) {
        msg = 'Email atau kata sandi salah. Silakan periksa kembali.'
      } else if (raw.includes('email not confirmed')) {
        msg = 'Email belum dikonfirmasi. Silakan buka tautan konfirmasi di inbox email Anda, atau gunakan mode Guest Play.'
      }
      return { session: null, error: msg }
    }
    if (!data.user) return { session: null, error: 'Login gagal.' }

    const profile = await getProfile(data.user.id)
    const userMetaNickname = data.user.user_metadata?.nickname
    const resolvedNickname =
      profile?.nickname || userMetaNickname || data.user.email?.split('@')[0] || 'Striker'

    const userSession: UserSession = {
      id: data.user.id,
      email: data.user.email,
      nickname: resolvedNickname,
      isGuest: false
    }

    // Persist authenticated user session
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userSession))

    return { session: userSession, error: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kendala saat login.'
    return { session: null, error: msg }
  }
}

export const signOutUser = async (): Promise<void> => {
  localStorage.removeItem(AUTH_USER_KEY)
  try {
    await supabase.auth.signOut()
  } catch {
    // ignore
  }
}
