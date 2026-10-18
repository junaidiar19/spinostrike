import React from 'react'
import { useGameStore } from '../../stores/useGameStore'

export const DamageIndicator: React.FC = () => {
  const damageFlash = useGameStore((state) => state.damageFlash)
  const damageAngle = useGameStore((state) => state.damageAngle)

  if (!damageFlash) return null

  return (
    <div className="damage-indicator-root">
      {/* Red screen perimeter vignette */}
      <div className="damage-flash-overlay" />

      {/* Directional Hit Indicator Arc */}
      {typeof damageAngle === 'number' && (
        <div
          className="directional-indicator-box"
          style={{
            transform: `translate(-50%, -50%) rotate(${damageAngle}rad)`
          }}
        >
          <svg
            className="directional-indicator-svg"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Top Red Arc pointing towards shooter */}
            <path
              d="M 60 40 A 100 100 0 0 1 140 40"
              stroke="#ef4444"
              strokeWidth="12"
              strokeLinecap="round"
              filter="drop-shadow(0 0 8px rgba(239, 68, 68, 0.9))"
            />
            {/* Tactical chevron */}
            <polygon
              points="100,24 110,38 90,38"
              fill="#ef4444"
              filter="drop-shadow(0 0 6px rgba(239, 68, 68, 1))"
            />
          </svg>
        </div>
      )}
    </div>
  )
}
