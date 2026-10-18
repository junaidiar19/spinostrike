import React from 'react'
import { Flame, RefreshCw } from 'lucide-react'
import { useGameStore } from '../../stores/useGameStore'
import { WEAPON_DEFINITIONS } from '../../game/weapons/definitions/weapons'

export const AmmoCounter: React.FC = () => {
  const activeWeaponId = useGameStore((state) => state.activeWeaponId)
  const currentSlot = useGameStore((state) => state.currentSlot)
  const weaponState = useGameStore((state) => state.weaponStates[activeWeaponId])
  const activeConfig = WEAPON_DEFINITIONS[activeWeaponId]

  const isKnife = activeWeaponId === 'knife'
  const isLowAmmo = !isKnife && weaponState.clip <= Math.ceil(activeConfig.clipSize * 0.25)

  return (
    <div className="hud-panel hud-bottom-right">
      <div className="ammo-weapon-header">
        <span className="slot-badge">SLOT {currentSlot}</span>
        <span className="weapon-title">{activeConfig.name}</span>
      </div>

      <div className="ammo-display">
        {isKnife ? (
          <div className="ammo-melee-label">
            <Flame size={20} className="melee-flame" />
            <span>MELEE TACTICAL</span>
          </div>
        ) : (
          <>
            <div className={`ammo-numbers ${isLowAmmo ? 'ammo-critical' : ''}`}>
              <span className="ammo-clip">{weaponState.clip}</span>
              <span className="ammo-slash">/</span>
              <span className="ammo-reserve">{weaponState.reserve}</span>
            </div>

            {weaponState.isReloading && (
              <div className="reload-progress-container">
                <div className="reload-label">
                  <RefreshCw size={13} className="spin-icon" />
                  <span>RELOADING...</span>
                </div>
                <div className="reload-track">
                  <div
                    className="reload-fill"
                    style={{ width: `${Math.round(weaponState.reloadProgress * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
