import React from 'react'
import { useGameStore } from '../../stores/useGameStore'

export const SniperScope: React.FC = () => {
  const activeWeaponId = useGameStore((state) => state.activeWeaponId)
  const isAiming = useGameStore((state) => state.isAiming)

  const isSniper = activeWeaponId === 'awp' || activeWeaponId === 'ssg08'

  if (!isSniper || !isAiming) {
    return null
  }

  return (
    <div className="sniper-scope-overlay">
      {/* Outer Black Mask with Circular Opening */}
      <div className="scope-lens-frame">
        {/* Reticle Lines */}
        <div className="scope-line scope-line-v" />
        <div className="scope-line scope-line-h" />

        {/* Mil-dot indicators */}
        <div className="scope-mil-dots">
          <div className="dot dot-1" />
          <div className="dot dot-2" />
          <div className="dot dot-3" />
        </div>

        {/* Tactical Rangefinder Text */}
        <div className="scope-hud-text">
          <span>MAG: {activeWeaponId === 'awp' ? '10X HIGH POWER' : '6X TACTICAL SCOUT'}</span>
          <span>CAL: {activeWeaponId === 'awp' ? '.338 MAGNUM' : '7.62x51mm NATO'}</span>
        </div>
      </div>
    </div>
  )
}
