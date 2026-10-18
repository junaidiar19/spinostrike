import { create } from 'zustand'
import {
  signInGuest,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  getStoredGuestSession,
  type UserSession
} from '../services/supabase/auth'
import { getProfile, upsertProfile, type PlayerProfile } from '../services/supabase/profile'
import { useGameStore } from './useGameStore'
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
  },

  loginWithEmail: async (email: string, pass: string) => {
    set({ isLoading: true, authError: null })
    const { session, error } = await signInWithEmail(email, pass)
    if (error || !session) {
      set({ authError: error || 'Login failed', isLoading: false })
      return false
    }
    const profile = await getProfile(session.id)
    set({ session, profile, isLoading: false, isAuthModalOpen: false })
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
    return true
  },

  logout: async () => {
    await signOutUser()
    const guest = getStoredGuestSession()
    const profile = await getProfile(guest.id)
    set({ session: guest, profile, authError: null })
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
