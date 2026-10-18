import React from 'react'
import { useGameStore } from '../../stores/useGameStore'
import { gameEngine } from '../../game/core/GameEngine'
import { ALL_ARENA_WEAPONS } from '../../types/game.types'
import type { WeaponId } from '../../types/game.types'

export const WeaponSelector: React.FC = () => {
  const currentSlot = useGameStore((state) => state.currentSlot)
  const weaponStates = useGameStore((state) => state.weaponStates)

  const handleSelect = (id: WeaponId) => {
    useGameStore.getState().setActiveWeapon(id)
    gameEngine.player.initWeapon(id)
  }

  return (
    <div className="weapon-selector-hud" role="toolbar" aria-label="Tactical Arsenal">
      <div className="weapon-selector-inner">
        {ALL_ARENA_WEAPONS.map((item) => {
          const isActive = currentSlot === item.slot
          const state = weaponStates[item.id]
          const isKnife = item.id === 'knife'
          const ammoLabel = isKnife ? 'MELEE' : `${state?.clip ?? 0}/${state?.reserve ?? 0}`

          return (
            <button
              key={item.slot}
              type="button"
              className={`weapon-slot-pill ${isActive ? 'active' : ''}`}
              onClick={() => handleSelect(item.id)}
              title={`${item.name} (Tekan [${item.key}] atau scroll mouse untuk ganti)`}
            >
              <div className="pill-top-row">
                <span className="key-hint">{item.key}</span>
                <span className="slot-name">{item.shortName}</span>
              </div>
              <span className={`pill-ammo-badge ${!isKnife && state?.clip === 0 ? 'empty' : ''}`}>
                {ammoLabel}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
