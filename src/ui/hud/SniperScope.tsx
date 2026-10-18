import React from 'react'
import { useGameStore } from '../../stores/useGameStore'

export const SniperScope: React.FC = () => {
  const activeWeaponId = useGameStore((state) => state.activeWeaponId)
  const isAiming = useGameStore((state) => state.isAiming)

  if (activeWeaponId !== 'awp' || !isAiming) {
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
          <span>MAG: 10X</span>
          <span>CAL: .338 LAPUA</span>
        </div>
      </div>
    </div>
  )
}
