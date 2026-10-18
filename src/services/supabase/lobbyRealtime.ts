import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './client'
import { useRoomStore, type RoomInfo } from '../../stores/useRoomStore'
import { useAuthStore } from '../../stores/useAuthStore'
import type { MapId } from '../../types/game.types'

export interface LobbyPresenceRecord {
  userId: string
  userName: string
  roomId: string
  roomName: string
  map: MapId
  mode: string
  maxPlayers: number
  isHost: boolean
  joinedAt: number
}

class LobbyRealtimeManager {
  private channel: RealtimeChannel | null = null
  private isInitialized = false
  private currentTrackedRoom: RoomInfo | null = null

  public init() {
    if (this.isInitialized) return
    this.isInitialized = true

    const session = useAuthStore.getState().session
    const localId = session?.id || `guest_${Math.random().toString(36).substring(2, 9)}`

    // Global lobby channel for real-time room discovery, broadcast & presence
    this.channel = supabase.channel('spinostrike_global_lobby', {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: localId }
      }
    })

    // 1. Broadcast Listeners
    this.channel
      .on('broadcast', { event: 'room_created' }, ({ payload }) => {
        if (!payload) return
        const room = payload as RoomInfo
        useRoomStore.getState().addOrUpdateRoom(room, true)
      })
      .on('broadcast', { event: 'request_active_rooms' }, () => {
        // If local client is currently inside an online room or hosting one, announce it
        const { activeRoomId, rooms } = useRoomStore.getState()
        if (activeRoomId) {
          const currentRoom = rooms.find((r) => r.id === activeRoomId) || this.currentTrackedRoom
          if (currentRoom) {
            this.broadcastAnnounceRoom(currentRoom)
          }
        }
      })
      .on('broadcast', { event: 'announce_room' }, ({ payload }) => {
        if (!payload) return
        const room = payload as RoomInfo
        useRoomStore.getState().addOrUpdateRoom(room, false)
      })
      .on('broadcast', { event: 'room_player_count' }, ({ payload }) => {
        if (!payload || !payload.roomId) return
        useRoomStore.getState().updateRoomPlayerCount(payload.roomId, payload.count)
      })

    // 2. Presence Listeners (Tracks live rooms & player counts)
    this.channel.on('presence', { event: 'sync' }, () => {
      if (!this.channel) return
      const presenceState = this.channel.presenceState<LobbyPresenceRecord>()
      this.handlePresenceSync(presenceState)
    })

    // 3. Subscribe to Global Lobby
    this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Request active room list from all connected clients
        this.requestRoomsSync()
        // Also fetch from DB if available
        this.fetchDatabaseRooms()
      }
    })
  }

  private handlePresenceSync(presenceState: Record<string, LobbyPresenceRecord[]>) {
    const roomPresenceMap = new Map<string, { room: Partial<RoomInfo>; count: number }>()

    Object.values(presenceState).forEach((presences) => {
      presences.forEach((p) => {
        if (!p.roomId) return
        const existing = roomPresenceMap.get(p.roomId)
        if (existing) {
          existing.count++
        } else {
          roomPresenceMap.set(p.roomId, {
            room: {
              id: p.roomId,
              name: p.roomName,
              map: p.map,
              mode: p.mode,
              maxPlayers: p.maxPlayers || 10,
              isCustom: true
            },
            count: 1
          })
        }
      })
    })

    useRoomStore.getState().syncPresenceRooms(roomPresenceMap)
  }

  public async fetchDatabaseRooms() {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!error && Array.isArray(data)) {
        data.forEach((row) => {
          const room: RoomInfo = {
            id: row.id,
            name: row.name,
            map: row.map as MapId,
            mode: row.mode || 'Team Deathmatch',
            playersCount: row.players_count || 1,
            maxPlayers: row.max_players || 10,
            ping: 16,
            isCustom: true,
            hostName: row.host_name,
            createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
          }
          useRoomStore.getState().addOrUpdateRoom(room, false)
        })
      }
    } catch {
      // Table doesn't exist yet, Realtime Broadcast & Presence works independently
    }
  }

  public broadcastRoomCreated(room: RoomInfo) {
    if (!this.channel) return
    this.channel.send({
      type: 'broadcast',
      event: 'room_created',
      payload: room
    })
  }

  public broadcastAnnounceRoom(room: RoomInfo) {
    if (!this.channel) return
    this.channel.send({
      type: 'broadcast',
      event: 'announce_room',
      payload: room
    })
  }

  public requestRoomsSync() {
    if (!this.channel) return
    this.channel.send({
      type: 'broadcast',
      event: 'request_active_rooms',
      payload: { timestamp: Date.now() }
    })
  }

  public broadcastPlayerCount(roomId: string, count: number) {
    if (!this.channel) return
    this.channel.send({
      type: 'broadcast',
      event: 'room_player_count',
      payload: { roomId, count }
    })
  }

  public async trackPlayerInRoom(room: RoomInfo, playerInfo: { id: string; name: string }) {
    this.currentTrackedRoom = room
    if (!this.channel) return

    try {
      await this.channel.track({
        userId: playerInfo.id,
        userName: playerInfo.name,
        roomId: room.id,
        roomName: room.name,
        map: room.map,
        mode: room.mode,
        maxPlayers: room.maxPlayers,
        isHost: true,
        joinedAt: Date.now()
      })
    } catch {
      // ignore
    }
  }

  public async untrackPlayerFromRoom() {
    this.currentTrackedRoom = null
    if (!this.channel) return
    try {
      await this.channel.untrack()
    } catch {
      // ignore
    }
  }
}

export const lobbyRealtimeManager = new LobbyRealtimeManager()
