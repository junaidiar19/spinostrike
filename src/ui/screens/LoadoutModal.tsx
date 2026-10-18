import React from 'react'
import { Crosshair, X, Check } from 'lucide-react'
import { useGameStore } from '../../stores/useGameStore'
import { WEAPON_DEFINITIONS } from '../../game/weapons/definitions/weapons'
import { gameEngine } from '../../game/core/GameEngine'
import type { WeaponId } from '../../types/game.types'

interface Props {
  onClose: () => void
}

export const LoadoutModal: React.FC<Props> = ({ onClose }) => {
  const selectedPrimary = useGameStore((state) => state.selectedPrimary)
  const setSelectedPrimary = useGameStore((state) => state.setSelectedPrimary)
  const currentSlot = useGameStore((state) => state.currentSlot)

  const primaryOptions: WeaponId[] = ['ak47', 'm4a1', 'awp']

  const handlePickPrimary = (id: WeaponId) => {
    setSelectedPrimary(id)
    if (currentSlot === 1) {
      gameEngine.player.initWeapon(id)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <div className="modal-title-row">
            <Crosshair size={22} className="modal-title-icon" />
            <h2>WEAPON ARSENAL & LOADOUT</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="loadout-section">
          <h3 className="section-label">SELECT PRIMARY WEAPON</h3>
          <div className="loadout-grid">
            {primaryOptions.map((id) => {
              const weapon = WEAPON_DEFINITIONS[id]
              const isSelected = selectedPrimary === id

              return (
                <div
                  key={id}
                  className={`weapon-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handlePickPrimary(id)}
                >
                  <div className="weapon-card-header">
                    <h4>{weapon.name}</h4>
                    {isSelected && (
                      <span className="equipped-badge">
                        <Check size={14} /> EQUIPPED
                      </span>
                    )}
                  </div>

                  <p className="weapon-card-desc">{weapon.description}</p>

                  {/* Weapon Stat Bars */}
                  <div className="weapon-stat-bars">
                    <div className="stat-row">
                      <span className="stat-label">DAMAGE</span>
                      <div className="stat-track">
                        <div
                          className="stat-fill"
                          style={{ width: `${Math.min(100, (weapon.damage / 115) * 100)}%` }}
                        />
                      </div>
                      <span className="stat-number">{weapon.damage}</span>
                    </div>

                    <div className="stat-row">
                      <span className="stat-label">FIRE RATE</span>
                      <div className="stat-track">
                        <div
                          className="stat-fill"
                          style={{ width: `${Math.min(100, (weapon.fireRate / 12) * 100)}%` }}
                        />
                      </div>
                      <span className="stat-number">{weapon.fireRate} r/s</span>
                    </div>

                    <div className="stat-row">
                      <span className="stat-label">MAGAZINE</span>
                      <div className="stat-track">
                        <div
                          className="stat-fill"
                          style={{ width: `${(weapon.clipSize / 30) * 100}%` }}
                        />
                      </div>
                      <span className="stat-number">{weapon.clipSize}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`btn-equip-weapon ${isSelected ? 'btn-active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePickPrimary(id)
                    }}
                  >
                    {isSelected ? 'EQUIPPED IN SLOT 1' : 'EQUIP WEAPON'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="loadout-section">
          <h3 className="section-label">SECONDARY & MELEE (STANDARD ISSUE)</h3>
          <div className="standard-issue-row">
            <div className="standard-card">
              <h4>Desert Eagle .50</h4>
              <p>7 Bullets, High Stun Punch, Slot 2</p>
            </div>
            <div className="standard-card">
              <h4>Tactical Combat Knife</h4>
              <p>Close Quarter Silent Blade, Slot 3</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-confirm-loadout" onClick={onClose}>
            CONFIRM LOADOUT
          </button>
        </div>
      </div>
    </div>
  )
}
