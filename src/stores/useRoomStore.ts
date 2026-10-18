import { create } from 'zustand'
import { realtimeManager } from '../services/supabase/realtime'
import { lobbyRealtimeManager } from '../services/supabase/lobbyRealtime'
import { supabase } from '../services/supabase/client'
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
  isCustom?: boolean
  hostName?: string
  createdAt?: number
  isNew?: boolean
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
  createOnlineRoom: (roomName: string, mapId: MapId) => Promise<boolean>
  joinOnlineRoom: (roomId: string, mapId: MapId) => Promise<boolean>
  leaveOnlineRoom: () => void
  addOrUpdateRoom: (room: RoomInfo, markAsNew?: boolean) => void
  updateRoomPlayerCount: (roomId: string, count: number) => void
  syncPresenceRooms: (presenceRooms: Map<string, { room: Partial<RoomInfo>; count: number }>) => void
  initLobby: () => void
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

const loadSavedCustomRooms = (): RoomInfo[] => {
  try {
    const raw = localStorage.getItem('spinostrike_custom_rooms')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // ignore
  }
  return []
}

const saveCustomRooms = (rooms: RoomInfo[]) => {
  try {
    const customOnly = rooms.filter((r) => r.isCustom).slice(0, 15)
    localStorage.setItem('spinostrike_custom_rooms', JSON.stringify(customOnly))
  } catch {
    // ignore
  }
}

// Initial combined room list
const initialRooms: RoomInfo[] = (() => {
  const custom = loadSavedCustomRooms()
  const customIds = new Set(custom.map((r) => r.id))
  const filteredDefaults = defaultRooms.filter((r) => !customIds.has(r.id))
  return [...custom, ...filteredDefaults]
})()

export const useRoomStore = create<RoomStoreState>((set, get) => ({
  isRoomLobbyOpen: false,
  activeRoomId: null,
  myTeam: 'CT',
  isJoining: false,
  rooms: initialRooms,

  initLobby: () => {
    lobbyRealtimeManager.init()
  },

  openRoomLobby: () => {
    lobbyRealtimeManager.init()
    lobbyRealtimeManager.requestRoomsSync()
    lobbyRealtimeManager.fetchDatabaseRooms()
    set({ isRoomLobbyOpen: true })
  },

  closeRoomLobby: () => set({ isRoomLobbyOpen: false }),
  setMyTeam: (team: Team) => set({ myTeam: team }),

  createOnlineRoom: async (roomName: string, mapId: MapId) => {
    set({ isJoining: true })
    const { session } = useAuthStore.getState()
    const hostName = session?.nickname || 'Striker'
    const slug = roomName.trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 16) || 'room'
    const newRoomId = `room_${slug}_${Math.random().toString(36).substring(2, 7)}`

    const newRoom: RoomInfo = {
      id: newRoomId,
      name: roomName.trim() || 'Custom Battle Arena',
      map: mapId,
      mode: 'Team Deathmatch',
      playersCount: 1,
      maxPlayers: 10,
      ping: Math.floor(10 + Math.random() * 15),
      isCustom: true,
      hostName,
      createdAt: Date.now(),
      isNew: true
    }

    // 1. Add locally
    get().addOrUpdateRoom(newRoom, true)

    // 2. Broadcast immediately to all connected players/guests across the globe
    lobbyRealtimeManager.broadcastRoomCreated(newRoom)

    // 3. Persist to DB table if available
    try {
      await supabase.from('rooms').insert({
        id: newRoom.id,
        name: newRoom.name,
        map: newRoom.map,
        mode: newRoom.mode,
        players_count: 1,
        max_players: newRoom.maxPlayers,
        host_name: hostName,
        is_active: true
      })
    } catch {
      // Table doesn't exist yet, Realtime Broadcast & Presence already delivered the room
    }

    // 4. Join the room as Host
    return get().joinOnlineRoom(newRoom.id, newRoom.map)
  },

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

    // Connect to Supabase Realtime Game Channel
    const joined = await realtimeManager.joinRoom(roomId, playerInfo)

    if (joined) {
      const room = get().rooms.find((r) => r.id === roomId)
      if (room) {
        lobbyRealtimeManager.trackPlayerInRoom(room, playerInfo)
        const newCount = Math.min(room.maxPlayers, room.playersCount + 1)
        get().updateRoomPlayerCount(roomId, newCount)
        lobbyRealtimeManager.broadcastPlayerCount(roomId, newCount)
      }

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
    const currentRoomId = get().activeRoomId
    if (currentRoomId) {
      const room = get().rooms.find((r) => r.id === currentRoomId)
      if (room) {
        const newCount = Math.max(0, room.playersCount - 1)
        get().updateRoomPlayerCount(currentRoomId, newCount)
        lobbyRealtimeManager.broadcastPlayerCount(currentRoomId, newCount)
      }
    }
    lobbyRealtimeManager.untrackPlayerFromRoom()
    realtimeManager.leaveRoom()
    set({ activeRoomId: null })
  },

  addOrUpdateRoom: (room: RoomInfo, markAsNew = false) => {
    set((state) => {
      const existingIdx = state.rooms.findIndex((r) => r.id === room.id)
      let updatedRooms: RoomInfo[]
      if (existingIdx >= 0) {
        updatedRooms = [...state.rooms]
        updatedRooms[existingIdx] = {
          ...updatedRooms[existingIdx],
          ...room,
          playersCount: room.playersCount || updatedRooms[existingIdx].playersCount
        }
      } else {
        const roomWithNew = markAsNew ? { ...room, isNew: true } : room
        updatedRooms = [roomWithNew, ...state.rooms]
      }
      saveCustomRooms(updatedRooms)
      return { rooms: updatedRooms }
    })
  },

  updateRoomPlayerCount: (roomId: string, count: number) => {
    set((state) => {
      const updated = state.rooms.map((r) => (r.id === roomId ? { ...r, playersCount: count } : r))
      saveCustomRooms(updated)
      return { rooms: updated }
    })
  },

  syncPresenceRooms: (presenceRooms) => {
    set((state) => {
      let changed = false
      const updatedRooms = [...state.rooms]

      presenceRooms.forEach((data, roomId) => {
        const idx = updatedRooms.findIndex((r) => r.id === roomId)
        if (idx >= 0) {
          if (updatedRooms[idx].playersCount !== data.count) {
            updatedRooms[idx] = { ...updatedRooms[idx], playersCount: data.count }
            changed = true
          }
        } else if (data.room.name) {
          // New active room discovered via presence!
          const newRoom: RoomInfo = {
            id: roomId,
            name: data.room.name,
            map: (data.room.map as MapId) || 'dust_arena',
            mode: data.room.mode || 'Team Deathmatch',
            playersCount: data.count,
            maxPlayers: data.room.maxPlayers || 10,
            ping: 15,
            isCustom: true
          }
          updatedRooms.unshift(newRoom)
          changed = true
        }
      })

      if (changed) {
        saveCustomRooms(updatedRooms)
        return { rooms: updatedRooms }
      }
      return state
    })
  }
}))
