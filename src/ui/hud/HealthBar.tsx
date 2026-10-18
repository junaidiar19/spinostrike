import React from 'react'
import { Heart, Shield } from 'lucide-react'
import { useGameStore } from '../../stores/useGameStore'

export const HealthBar: React.FC = () => {
  const health = useGameStore((state) => state.health)
  const armor = useGameStore((state) => state.armor)

  const isLowHealth = health <= 25

  return (
    <div className="hud-panel hud-bottom-left">
      {/* Health */}
      <div className={`status-item ${isLowHealth ? 'status-critical' : ''}`}>
        <div className="status-icon-box hp-icon">
          <Heart size={20} className="icon-pulse" />
        </div>
        <div className="status-info">
          <div className="status-meta">
            <span className="status-label">HEALTH</span>
            <span className="status-value">{health}</span>
          </div>
          <div className="status-bar-track">
            <div
              className="status-bar-fill hp-fill"
              style={{ width: `${health}%` }}
            />
          </div>
        </div>
      </div>

      {/* Armor */}
      <div className="status-item">
        <div className="status-icon-box armor-icon">
          <Shield size={20} />
        </div>
        <div className="status-info">
          <div className="status-meta">
            <span className="status-label">ARMOR</span>
            <span className="status-value">{armor}</span>
          </div>
          <div className="status-bar-track">
            <div
              className="status-bar-fill armor-fill"
              style={{ width: `${armor}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
