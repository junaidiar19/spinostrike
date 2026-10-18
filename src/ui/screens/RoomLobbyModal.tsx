import React, { useState } from 'react'
import { Users, Wifi, Shield, Skull, X, Plus } from 'lucide-react'
import { useRoomStore } from '../../stores/useRoomStore'
import { MAP_METADATA } from '../../game/maps/MapManager'
import type { MapId } from '../../types/game.types'

export const RoomLobbyModal: React.FC = () => {
  const {
    isRoomLobbyOpen,
    closeRoomLobby,
    rooms,
    myTeam,
    setMyTeam,
    joinOnlineRoom,
    isJoining
  } = useRoomStore()

  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '')
  const [customRoomName, setCustomRoomName] = useState('')
  const [customMap, setCustomMap] = useState<MapId>('dust_arena')
  const [isCreating, setIsCreating] = useState(false)

  if (!isRoomLobbyOpen) return null

  const handleJoinSelected = async () => {
    const room = rooms.find((r) => r.id === selectedRoomId)
    if (!room) return
    await joinOnlineRoom(room.id, room.map)
  }

  const handleCreateAndJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    const roomIdSuffix = customRoomName.trim().replace(/\s+/g, '_').toLowerCase() || 'custom'
    const newRoomId = `room_${roomIdSuffix}_${Date.now().toString(36)}`
    await joinOnlineRoom(newRoomId, customMap)
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

        {/* Main Content: Room List or Create Form */}
        <div className="lobby-content">
          {!isCreating ? (
            <>
              <div className="lobby-actions-bar">
                <span className="lobby-section-title">LOBBY MULTIPLAYER ONLINE</span>
                <button
                  type="button"
                  className="btn-create-toggle"
                  onClick={() => setIsCreating(true)}
                >
                  <Plus size={16} />
                  <span>HOST NEW ROOM</span>
                </button>
              </div>

              <div className="room-list-scroll">
                {rooms.map((room) => {
                  const mapMeta = MAP_METADATA[room.map]
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
                        </div>
                        <div className="room-meta-row">
                          <span className="room-mode">{room.mode}</span>
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
              <h3 className="section-label">HOST A NEW MATCH ROOM</h3>
              <div className="setting-field">
                <label htmlFor="create-room-name">Room Name / Title</label>
                <input
                  id="create-room-name"
                  type="text"
                  className="setting-text-input"
                  value={customRoomName}
                  onChange={(e) => setCustomRoomName(e.target.value)}
                  placeholder="Tactical 5v5 Scrim"
                  required
                />
              </div>

              <div className="setting-field">
                <label>Select Deployment Map</label>
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
                  CANCEL
                </button>
                <button type="submit" className="btn-confirm-loadout" disabled={isJoining}>
                  {isJoining ? 'HOSTING...' : 'CREATE & DEPLOY'}
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
              disabled={isJoining}
            >
              {isJoining ? 'MENYAMBUNGKAN KE ROOM...' : 'DEPLOY TO SELECTED ROOM'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
