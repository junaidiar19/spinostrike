import React from 'react'
import { useGameStore } from '../../stores/useGameStore'
import { WEAPON_DEFINITIONS } from '../../game/weapons/definitions/weapons'
import { gameEngine } from '../../game/core/GameEngine'
import type { WeaponSlot } from '../../types/game.types'

export const WeaponSelector: React.FC = () => {
  const currentSlot = useGameStore((state) => state.currentSlot)
  const selectedPrimary = useGameStore((state) => state.selectedPrimary)
  const selectedSecondary = useGameStore((state) => state.selectedSecondary)

  const slots: { slot: WeaponSlot; name: string; key: string }[] = [
    { slot: 1, name: WEAPON_DEFINITIONS[selectedPrimary].name.split(' ')[0], key: '1' },
    { slot: 2, name: WEAPON_DEFINITIONS[selectedSecondary].name.split(' ')[0], key: '2' },
    { slot: 3, name: 'KNIFE', key: '3' }
  ]

  const handleSelect = (slot: WeaponSlot) => {
    gameEngine.inputManager.setRequestedSlot(slot)
  }

  return (
    <div className="weapon-selector-hud">
      {slots.map((item) => {
        const isActive = currentSlot === item.slot
        return (
          <button
            key={item.slot}
            type="button"
            className={`weapon-slot-pill ${isActive ? 'active' : ''}`}
            onClick={() => handleSelect(item.slot)}
          >
            <span className="key-hint">{item.key}</span>
            <span className="slot-name">{item.name}</span>
          </button>
        )
      })}
    </div>
  )
}
