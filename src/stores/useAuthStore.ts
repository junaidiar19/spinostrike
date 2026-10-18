import { create } from 'zustand'
import {
  signInGuest,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  getStoredGuestSession,
  AUTH_USER_KEY,
  type UserSession
} from '../services/supabase/auth'
import { getProfile, upsertProfile, type PlayerProfile } from '../services/supabase/profile'
import { supabase } from '../services/supabase/client'
import { useGameStore } from './useGameStore'
import { useSettingsStore } from './useSettingsStore'
import type { WeaponId } from '../types/game.types'

interface AuthStoreState {
  session: UserSession | null
  profile: PlayerProfile | null
  isLoading: boolean
  isAuthModalOpen: boolean
  authError: string | null

  // Actions
  initSession: () => Promise<void>
  loginAsGuest: (nickname?: string) => Promise<void>
  loginWithEmail: (email: string, pass: string) => Promise<boolean>
  registerWithEmail: (email: string, pass: string, nickname: string) => Promise<boolean>
  logout: () => Promise<void>
  openAuthModal: () => void
  closeAuthModal: () => void
  updateProfileLoadout: (primary: WeaponId, secondary: WeaponId) => Promise<void>
  recordMatchEnd: (kills: number, deaths: number, headshots: number) => Promise<void>
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: true,
  isAuthModalOpen: false,
  authError: null,

  initSession: async () => {
    set({ isLoading: true })

    // 1. Check if user is currently signed in to Supabase Auth
    try {
      const { data: authData } = await supabase.auth.getSession()
      if (authData?.session?.user) {
        const user = authData.session.user
        const profile = await getProfile(user.id)
        const nickname =
          profile?.nickname ||
          (user.user_metadata?.nickname as string) ||
          user.email?.split('@')[0] ||
          'Striker'

        const authSession: UserSession = {
          id: user.id,
          email: user.email,
          nickname,
          isGuest: false
        }

        set({
          session: authSession,
          profile: profile || {
            id: user.id,
            nickname,
            kills: 0,
            deaths: 0,
            headshots: 0,
            matches_played: 0,
            selected_primary: 'ak47',
            selected_secondary: 'deagle'
          },
          isLoading: false
        })

        // Sync to Game Store and Settings Store
        useGameStore.getState().updatePlayerName(nickname)
        useSettingsStore.getState().setPlayerName(nickname)

        if (profile?.selected_primary) {
          useGameStore.getState().setSelectedPrimary(profile.selected_primary)
        }
        return
      }
    } catch {
      // offline fallback
    }

    // 2. Check if there was an active saved authenticated account session in localStorage
    try {
      const savedAuth = localStorage.getItem(AUTH_USER_KEY)
      if (savedAuth) {
        const parsed: UserSession = JSON.parse(savedAuth)
        if (parsed && parsed.nickname && !parsed.isGuest) {
          const profile = await getProfile(parsed.id)
          set({
            session: parsed,
            profile: profile || {
              id: parsed.id,
              nickname: parsed.nickname,
              kills: 0,
              deaths: 0,
              headshots: 0,
              matches_played: 0,
              selected_primary: 'ak47',
              selected_secondary: 'deagle'
            },
            isLoading: false
          })

          useGameStore.getState().updatePlayerName(parsed.nickname)
          useSettingsStore.getState().setPlayerName(parsed.nickname)
          return
        }
      }
    } catch {
      // ignore
    }

    // 3. Fallback to Guest Session
    const guestSession = getStoredGuestSession()
    const profile = await getProfile(guestSession.id)

    set({
      session: guestSession,
      profile: profile || {
        id: guestSession.id,
        nickname: guestSession.nickname,
        kills: 0,
        deaths: 0,
        headshots: 0,
        matches_played: 0,
        selected_primary: 'ak47',
        selected_secondary: 'deagle'
      },
      isLoading: false
    })

    useGameStore.getState().updatePlayerName(guestSession.nickname)
    useSettingsStore.getState().setPlayerName(guestSession.nickname)

    // Sync selected weapon to game store
    if (profile?.selected_primary) {
      useGameStore.getState().setSelectedPrimary(profile.selected_primary)
    }
  },

  loginAsGuest: async (nickname?: string) => {
    set({ isLoading: true, authError: null })
    const session = await signInGuest(nickname)
    const profile = await getProfile(session.id)
    set({ session, profile, isLoading: false, isAuthModalOpen: false })

    useGameStore.getState().updatePlayerName(session.nickname)
    useSettingsStore.getState().setPlayerName(session.nickname)
  },

  loginWithEmail: async (email: string, pass: string) => {
    set({ isLoading: true, authError: null })
    const { session, error } = await signInWithEmail(email, pass)
    if (error || !session) {
      set({ authError: error || 'Login gagal.', isLoading: false })
      return false
    }
    const profile = await getProfile(session.id)
    set({ session, profile, isLoading: false, isAuthModalOpen: false })

    useGameStore.getState().updatePlayerName(session.nickname)
    useSettingsStore.getState().setPlayerName(session.nickname)
    return true
  },

  registerWithEmail: async (email: string, pass: string, nickname: string) => {
    set({ isLoading: true, authError: null })
    const { session, error, requiresConfirmation } = await signUpWithEmail(email, pass, nickname)
    if (error || !session) {
      set({ authError: error || 'Pendaftaran gagal.', isLoading: false })
      return false
    }
    const profile = await getProfile(session.id)
    set({
      session,
      profile: profile || {
        id: session.id,
        nickname: session.nickname,
        kills: 0,
        deaths: 0,
        headshots: 0,
        matches_played: 0,
        selected_primary: 'ak47',
        selected_secondary: 'deagle'
      },
      isLoading: false,
      isAuthModalOpen: requiresConfirmation ? true : false,
      authError: requiresConfirmation
        ? 'Pendaftaran berhasil! Tautan konfirmasi telah dikirim ke email Anda. Silakan verifikasi email Anda untuk login penuh, atau gunakan mode Guest Play.'
        : null
    })

    useGameStore.getState().updatePlayerName(session.nickname)
    useSettingsStore.getState().setPlayerName(session.nickname)
    return true
  },

  logout: async () => {
    await signOutUser()
    const guest = getStoredGuestSession()
    const profile = await getProfile(guest.id)
    set({ session: guest, profile, authError: null })

    useGameStore.getState().updatePlayerName(guest.nickname)
    useSettingsStore.getState().setPlayerName(guest.nickname)
  },

  openAuthModal: () => set({ isAuthModalOpen: true, authError: null }),
  closeAuthModal: () => set({ isAuthModalOpen: false, authError: null }),

  updateProfileLoadout: async (primary: WeaponId, secondary: WeaponId) => {
    const { session, profile } = get()
    if (!session) return

    const updated = await upsertProfile({
      id: session.id,
      selected_primary: primary,
      selected_secondary: secondary
    })
    set({ profile: { ...profile, ...updated } })
  },

  recordMatchEnd: async (kills: number, deaths: number, headshots: number) => {
    const { session, profile } = get()
    if (!session || !profile) return

    const updated = await upsertProfile({
      id: session.id,
      kills: profile.kills + kills,
      deaths: profile.deaths + deaths,
      headshots: profile.headshots + headshots,
      matches_played: profile.matches_played + 1
    })
    set({ profile: updated })
  }
}))
