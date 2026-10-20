import React from 'react'
import { Check, MapPin, X } from 'lucide-react'
import { useGameStore } from '../../stores/useGameStore'
import { MAP_METADATA } from '../../game/maps/MapManager'
import { gameEngine } from '../../game/core/GameEngine'
import type { MapId } from '../../types/game.types'

interface Props {
  onClose: () => void
}

export const MapSelectModal: React.FC<Props> = ({ onClose }) => {
  const currentMap = useGameStore((state) => state.currentMap)
  const setCurrentMap = useGameStore((state) => state.setCurrentMap)

  const handleSelectMap = (mapId: MapId) => {
    setCurrentMap(mapId)
    gameEngine.loadMap(mapId)
    onClose()
  }

  const mapList = Object.values(MAP_METADATA)

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <div className="modal-title-row">
            <MapPin size={22} className="modal-title-icon" />
            <h2>SELECT TACTICAL MAP</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="map-cards-grid">
          {mapList.map((map) => {
            const isSelected = currentMap === map.id
            return (
              <div
                key={map.id}
                className={`map-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectMap(map.id)}
              >
                <div className="map-card-thumbnail-wrapper">
                  <img
                    src={map.previewImage}
                    alt={map.name}
                    className="map-card-thumbnail-img"
                    loading="lazy"
                  />
                  <div className="map-card-thumbnail-overlay" />
                  <div
                    className="map-card-accent-bar"
                    style={{ backgroundColor: map.accentColor }}
                  />
                  <div className="map-card-badge-row">
                    <span
                      className="map-theme-badge"
                      style={{ borderLeft: `3px solid ${map.accentColor}` }}
                    >
                      {map.theme}
                    </span>
                    {isSelected && (
                      <span className="map-active-badge">
                        <Check size={14} /> ACTIVE
                      </span>
                    )}
                  </div>
                </div>

                <div className="map-card-body">
                  <h3 className="map-card-name">{map.name}</h3>
                  <span className="map-card-subtitle">{map.subtitle}</span>
                  <p className="map-card-desc">{map.description}</p>

                  <button
                    type="button"
                    className={`btn-select-map ${isSelected ? 'btn-active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectMap(map.id)
                    }}
                  >
                    {isSelected ? 'CURRENTLY SELECTED' : 'DEPLOY TO MAP'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
