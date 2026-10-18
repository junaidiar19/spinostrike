import React from 'react'
import { Flame, RefreshCw, RotateCcw, PackagePlus } from 'lucide-react'
import { useGameStore } from '../../stores/useGameStore'
import { WEAPON_DEFINITIONS } from '../../game/weapons/definitions/weapons'
import { audioManager } from '../../game/core/AudioManager'
import { gameEngine } from '../../game/core/GameEngine'

export const AmmoCounter: React.FC = () => {
  const activeWeaponId = useGameStore((state) => state.activeWeaponId)
  const currentSlot = useGameStore((state) => state.currentSlot)
  const weaponState = useGameStore((state) => state.weaponStates[activeWeaponId])
  const activeConfig = WEAPON_DEFINITIONS[activeWeaponId]

  const isKnife = activeWeaponId === 'knife'
  const isLowAmmo = !isKnife && weaponState.clip <= Math.ceil(activeConfig.clipSize * 0.25)
  const isCompletelyEmpty = !isKnife && weaponState.clip === 0 && weaponState.reserve === 0

  const handleReload = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (isKnife || weaponState.isReloading) return
    if (weaponState.reserve > 0 && weaponState.clip < activeConfig.clipSize) {
      gameEngine.inputManager.reloadRequested = true
    } else if (weaponState.reserve === 0) {
      handleRefill()
    }
  }

  const handleRefill = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    audioManager.playReloadSound()
    useGameStore.getState().refillAmmo()
  }

  return (
    <div className="hud-panel hud-bottom-right" role="region" aria-label="Ammunition Display">
      <div className="ammo-weapon-header">
        <span className="slot-badge">SLOT {currentSlot}</span>
        <span className="weapon-title">{activeConfig.name}</span>
      </div>

      <div className="ammo-display" onClick={handleReload} title="Klik untuk isi ulang peluru / magazine">
        {isKnife ? (
          <div className="ammo-melee-label">
            <Flame size={20} className="melee-flame" />
            <span>MELEE TACTICAL (UNLIMITED)</span>
          </div>
        ) : (
          <>
            <div className={`ammo-numbers ${isLowAmmo ? 'ammo-critical' : ''} ${isCompletelyEmpty ? 'ammo-empty-glow' : ''}`}>
              <span className="ammo-clip">{weaponState.clip}</span>
              <span className="ammo-slash">/</span>
              <span className="ammo-reserve">{weaponState.reserve}</span>
            </div>

            {weaponState.isReloading && (
              <div className="reload-progress-container">
                <div className="reload-label">
                  <RefreshCw size={13} className="spin-icon" />
                  <span>MEMASUKKAN PELURU...</span>
                </div>
                <div className="reload-track">
                  <div
                    className="reload-fill"
                    style={{ width: `${Math.round(weaponState.reloadProgress * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Quick Interactive Tactical Buttons for Desktop/Laptop/Tablet */}
            <div className="ammo-actions-row">
              <button
                type="button"
                className={`btn-hud-ammo btn-hud-reload ${weaponState.clip < activeConfig.clipSize && weaponState.reserve > 0 ? 'pulse-prompt' : ''}`}
                onClick={handleReload}
                disabled={weaponState.isReloading || weaponState.clip >= activeConfig.clipSize}
                title="Isi ulang magazine peluru (Shortcut: R)"
              >
                <RotateCcw size={13} />
                <span>RELOAD [R]</span>
              </button>

              <button
                type="button"
                className={`btn-hud-ammo btn-hud-refill ${isCompletelyEmpty || weaponState.reserve === 0 ? 'pulse-refill-alert' : ''}`}
                onClick={handleRefill}
                title="Isi penuh cadangan peluru semua senjata (Shortcut: T)"
              >
                <PackagePlus size={13} />
                <span>REFILL [T]</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
