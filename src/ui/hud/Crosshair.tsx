import React from 'react'
import { useGameStore } from '../../stores/useGameStore'

export const Crosshair: React.FC = () => {
  const crosshairSpread = useGameStore((state) => state.crosshairSpread)
  const isAiming = useGameStore((state) => state.isAiming)
  const activeWeaponId = useGameStore((state) => state.activeWeaponId)
  const hitmarker = useGameStore((state) => state.hitmarker)

  // Hide crosshair when scoped in with AWP
  if (activeWeaponId === 'awp' && isAiming) {
    return null
  }

  const gap = Math.min(28, 6 + crosshairSpread * 0.8)

  return (
    <div className="crosshair-container">
      {/* 4 CS-Style Crosshair Lines */}
      <div className="crosshair-bar crosshair-top" style={{ transform: `translate(-50%, calc(-100% - ${gap}px))` }} />
      <div className="crosshair-bar crosshair-bottom" style={{ transform: `translate(-50%, ${gap}px)` }} />
      <div className="crosshair-bar crosshair-left" style={{ transform: `translate(calc(-100% - ${gap}px), -50%)` }} />
      <div className="crosshair-bar crosshair-right" style={{ transform: `translate(${gap}px, -50%)` }} />

      {/* Center Dot */}
      <div className="crosshair-dot" />

      {/* Hitmarker Graphic */}
      {hitmarker.active && (
        <div className={`hitmarker ${hitmarker.isHeadshot ? 'headshot' : ''}`}>
          <div className="hitmarker-line diagonal-1" />
          <div className="hitmarker-line diagonal-2" />
          {hitmarker.isHeadshot && <span className="headshot-indicator">CRIT</span>}
        </div>
      )}
    </div>
  )
}
