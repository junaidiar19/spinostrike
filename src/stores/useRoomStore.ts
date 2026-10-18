import { create } from 'zustand'
import { realtimeManager } from '../services/supabase/realtime'
import { useAuthStore } from './useAuthStore'
import { useGameStore } from './useGameStore'
import { gameEngine } from '../game/core/GameEngine'
import type { MapId, Team } from '../types/game.types'

export interface RoomInfo {
  id: string
  name: string
  map: MapId
  mode: string
  playersCount: number
  maxPlayers: number
  ping: number
}

interface RoomStoreState {
  isRoomLobbyOpen: boolean
  activeRoomId: string | null
  myTeam: Team
  isJoining: boolean
  rooms: RoomInfo[]

  openRoomLobby: () => void
  closeRoomLobby: () => void
  setMyTeam: (team: Team) => void
  joinOnlineRoom: (roomId: string, mapId: MapId) => Promise<boolean>
  leaveOnlineRoom: () => void
}

const defaultRooms: RoomInfo[] = [
  {
    id: 'room_dust_public',
    name: 'Asia East • Sandstone 5v5 Casual',
    map: 'dust_arena',
    mode: 'Team Deathmatch',
    playersCount: 4,
    maxPlayers: 10,
    ping: 18
  },
  {
    id: 'room_warehouse_tdm',
    name: 'Singapore • Warehouse Close-Quarters',
    map: 'warehouse',
    mode: 'Team Deathmatch',
    playersCount: 6,
    maxPlayers: 10,
    ping: 24
  },
  {
    id: 'room_competitive_dust',
    name: 'Jakarta • Tactical Dust Ranked',
    map: 'dust_arena',
    mode: 'Competitive TDM',
    playersCount: 2,
    maxPlayers: 10,
    ping: 12
  }
]

export const useRoomStore = create<RoomStoreState>((set, get) => ({
  isRoomLobbyOpen: false,
  activeRoomId: null,
  myTeam: 'CT',
  isJoining: false,
  rooms: defaultRooms,

  openRoomLobby: () => set({ isRoomLobbyOpen: true }),
  closeRoomLobby: () => set({ isRoomLobbyOpen: false }),
  setMyTeam: (team: Team) => set({ myTeam: team }),

  joinOnlineRoom: async (roomId: string, mapId: MapId) => {
    set({ isJoining: true })
    const { session } = useAuthStore.getState()
    const { myTeam } = get()

    const playerInfo = {
      id: session?.id || `guest_${Math.random().toString(36).substring(2, 8)}`,
      name: session?.nickname || 'Striker',
      team: myTeam
    }

    // Load corresponding map in 3D engine
    useGameStore.getState().setCurrentMap(mapId)
    gameEngine.loadMap(mapId)

    // Connect to Supabase Realtime Channel
    const joined = await realtimeManager.joinRoom(roomId, playerInfo)

    if (joined) {
      set({ activeRoomId: roomId, isJoining: false, isRoomLobbyOpen: false })
      useGameStore.getState().setGameStatus('PLAYING')
      gameEngine.inputManager.requestPointerLock()
      return true
    } else {
      set({ isJoining: false })
      return false
    }
  },

  leaveOnlineRoom: () => {
    realtimeManager.leaveRoom()
    set({ activeRoomId: null })
  }
}))
