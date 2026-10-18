import React, { useState } from 'react'
import { Users, Wifi, Shield, Skull, X, Plus, RotateCw, Radio, Sparkles } from 'lucide-react'
import { useRoomStore } from '../../stores/useRoomStore'
import { lobbyRealtimeManager } from '../../services/supabase/lobbyRealtime'
import { MAP_METADATA } from '../../game/maps/MapManager'
import { useAuthStore } from '../../stores/useAuthStore'
import type { MapId } from '../../types/game.types'

export const RoomLobbyModal: React.FC = () => {
  const { session, openAuthModal } = useAuthStore()
  const {
    isRoomLobbyOpen,
    closeRoomLobby,
    rooms,
    myTeam,
    setMyTeam,
    createOnlineRoom,
    joinOnlineRoom,
    isJoining
  } = useRoomStore()

  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '')
  const [customRoomName, setCustomRoomName] = useState('')
  const [customMap, setCustomMap] = useState<MapId>('dust_arena')
  const [isCreating, setIsCreating] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  if (!isRoomLobbyOpen) return null

  const handleJoinSelected = async () => {
    const room = rooms.find((r) => r.id === selectedRoomId)
    if (!room) return
    await joinOnlineRoom(room.id, room.map)
  }

  const handleCreateAndJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customRoomName.trim()) return
    await createOnlineRoom(customRoomName, customMap)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    lobbyRealtimeManager.requestRoomsSync()
    await lobbyRealtimeManager.fetchDatabaseRooms()
    setTimeout(() => setIsRefreshing(false), 600)
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog modal-lobby">
        <div className="modal-header">
          <div className="modal-title-row">
            <Users size={22} className="modal-title-icon" />
            <h2>SERVER ROOM MULTIPLAYER</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={closeRoomLobby}>
            <X size={20} />
          </button>
        </div>

        {/* Team Selection Bar */}
        <div className="team-select-container">
          <span className="team-select-label">CHOOSE YOUR TEAM:</span>
          <div className="team-buttons">
            <button
              type="button"
              className={`btn-team-pick btn-ct ${myTeam === 'CT' ? 'active' : ''}`}
              onClick={() => setMyTeam('CT')}
            >
              <Shield size={18} />
              <span>COUNTER-TERRORISTS</span>
            </button>
            <button
              type="button"
              className={`btn-team-pick btn-t ${myTeam === 'T' ? 'active' : ''}`}
              onClick={() => setMyTeam('T')}
            >
              <Skull size={18} />
              <span>TERRORISTS</span>
            </button>
          </div>
        </div>

        {/* Callsign / Nickname Bar in Lobby */}
        <div className="lobby-user-bar">
          <div className="lobby-user-info">
            <span className="lobby-user-lbl">CALLSIGN ANDA:</span>
            <span className="lobby-user-name">{session?.nickname || 'Striker'}</span>
            <span className="lobby-user-team-badge" style={{ color: myTeam === 'CT' ? '#38bdf8' : '#ef4444' }}>
              • {myTeam === 'CT' ? 'COUNTER-TERRORISTS' : 'TERRORISTS'}
            </span>
          </div>
          <button
            type="button"
            className="btn-lobby-rename"
            onClick={openAuthModal}
            title="Ganti Callsign / Nickname Anda"
          >
            ✏️ GANTI NAMA
          </button>
        </div>

        {/* Main Content: Room List or Create Form */}
        <div className="lobby-content">
          {!isCreating ? (
            <>
              <div className="lobby-actions-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="lobby-section-title">LOBBY MULTIPLAYER ONLINE</span>
                  <button
                    type="button"
                    className="btn-refresh-rooms"
                    onClick={handleRefresh}
                    title="Sinkronisasi & Perbarui Daftar Room"
                    disabled={isRefreshing}
                  >
                    <RotateCw size={13} className={isRefreshing ? 'spin-icon' : ''} />
                    <span>{isRefreshing ? 'MEMPERBARUI...' : 'REFRESH'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="btn-create-toggle"
                  onClick={() => setIsCreating(true)}
                >
                  <Plus size={16} />
                  <span>BUAT ROOM BARU</span>
                </button>
              </div>

              <div className="room-list-scroll">
                {rooms.map((room) => {
                  const mapMeta = MAP_METADATA[room.map] || MAP_METADATA.dust_arena
                  const isSelected = selectedRoomId === room.id

                  return (
                    <div
                      key={room.id}
                      className={`room-item-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedRoomId(room.id)}
                    >
                      <div className="room-info-col">
                        <div className="room-title-row">
                          <h4 className="room-name">{room.name}</h4>
                          <span
                            className="room-map-badge"
                            style={{ backgroundColor: mapMeta.accentColor }}
                          >
                            {mapMeta.name}
                          </span>
                          {room.isCustom && (
                            <span className="room-live-pill">
                              <Radio size={10} className="pulse-dot" />
                              LIVE HOST
                            </span>
                          )}
                          {room.isNew && (
                            <span className="room-new-pill">
                              <Sparkles size={10} />
                              BARU
                            </span>
                          )}
                        </div>
                        <div className="room-meta-row">
                          <span className="room-mode">{room.mode}</span>
                          {room.hostName && (
                            <span className="room-host-tag">Host: {room.hostName}</span>
                          )}
                          <span className="room-ping">
                            <Wifi size={13} className="ping-icon" />
                            {room.ping}ms
                          </span>
                        </div>
                      </div>

                      <div className="room-status-col">
                        <div className="player-slots-badge">
                          <Users size={14} />
                          <span>
                            {room.playersCount} / {room.maxPlayers}
                          </span>
                        </div>
                        <button
                          type="button"
                          className={`btn-join-room ${isSelected ? 'btn-selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            joinOnlineRoom(room.id, room.map)
                          }}
                          disabled={isJoining}
                        >
                          {isJoining && isSelected ? 'CONNECTING...' : 'JOIN'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <form onSubmit={handleCreateAndJoin} className="create-room-form">
              <h3 className="section-label">BUAT ROOM MATCH BARU</h3>
              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>
                Room yang Anda buat akan langsung muncul di layar lobi semua pemain & guest secara real-time.
              </p>

              <div className="setting-field">
                <label htmlFor="create-room-name">Nama / Judul Room</label>
                <input
                  id="create-room-name"
                  type="text"
                  className="setting-text-input"
                  value={customRoomName}
                  onChange={(e) => setCustomRoomName(e.target.value)}
                  placeholder="Contoh: Arena Jakarta 5v5"
                  maxLength={32}
                  required
                  autoFocus
                />
              </div>

              <div className="setting-field">
                <label>Pilih Arena Peta (Map)</label>
                <div className="map-picker-row">
                  <button
                    type="button"
                    className={`btn-map-choice ${customMap === 'dust_arena' ? 'active' : ''}`}
                    onClick={() => setCustomMap('dust_arena')}
                  >
                    Sandstone Arena (Dust II)
                  </button>
                  <button
                    type="button"
                    className={`btn-map-choice ${customMap === 'warehouse' ? 'active' : ''}`}
                    onClick={() => setCustomMap('warehouse')}
                  >
                    Tactical Warehouse
                  </button>
                </div>
              </div>

              <div className="form-action-row">
                <button
                  type="button"
                  className="btn-back-lobby"
                  onClick={() => setIsCreating(false)}
                >
                  BATAL
                </button>
                <button type="submit" className="btn-confirm-loadout" disabled={isJoining || !customRoomName.trim()}>
                  {isJoining ? 'MEMBUAT & MEMBUKA ROOM...' : 'BUAT & MASUK ARENA'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="modal-footer">
          {!isCreating && (
            <button
              type="button"
              className="btn-deploy-room"
              onClick={handleJoinSelected}
              disabled={isJoining || !selectedRoomId}
            >
              {isJoining ? 'MENYAMBUNGKAN KE ROOM...' : 'GABUNG KE ROOM TERPILIH'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
