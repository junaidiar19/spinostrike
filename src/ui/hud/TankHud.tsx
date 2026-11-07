import React from 'react'
import { Shield, Crosshair, LogOut } from 'lucide-react'
import { useGameStore } from '../../stores/useGameStore'
import { gameEngine } from '../../game/core/GameEngine'

export const TankHud: React.FC = () => {
  const isDrivingTank = useGameStore((state) => state.isDrivingTank)
  const isNearTank = useGameStore((state) => state.isNearTank)
  const tankHealth = useGameStore((state) => state.tankHealth)
  const tankMaxHealth = useGameStore((state) => state.tankMaxHealth)
  const tankCannonReady = useGameStore((state) => state.tankCannonReady)
  const tankCannonCooldown = useGameStore((state) => state.tankCannonCooldown)
  const isMobile = useGameStore((state) => state.isMobile)

  const handleBoardTank = () => {
    gameEngine.inputManager.triggerTankInteract()
  }

  const handleExitTank = () => {
    gameEngine.inputManager.triggerTankInteract()
  }

  return (
    <>
      {/* 1. Proximity prompt when player is walking near an unoccupied tank */}
      {isNearTank && !isDrivingTank && (
        <div className="tank-prompt-overlay" onClick={isMobile ? handleBoardTank : undefined}>
          <div className="tank-prompt-card">
            <div className="tank-prompt-icon-wrap">
              <Shield size={24} className="tank-prompt-icon" />
            </div>
            <div className="tank-prompt-text-col">
              <span className="tank-prompt-title">TANK TEMPUR TERSEDIA</span>
              <span className="tank-prompt-sub">
                {isMobile ? 'KETUK DI SINI UNTUK NAIK TANK' : 'TEKAN TOMBOL [E] PADA KEYBOARD UNTUK NAIK'}
              </span>
            </div>
            {isMobile ? (
              <button type="button" className="btn-tank-board" onClick={handleBoardTank}>
                NAIK TANK
              </button>
            ) : (
              <div className="tank-key-badge-indicator flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/50 px-3 py-1.5 rounded-lg">
                <kbd className="px-2.5 py-1 bg-amber-400 text-black font-extrabold text-sm rounded shadow">E</kbd>
                <span className="text-xs font-bold text-emerald-300">MASUK TANK</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Cockpit / Driving HUD when piloting the tank */}
      {isDrivingTank && (
        <div className="tank-driving-hud">
          {/* Top Tank Reticle Guide */}
          <div className="tank-crosshair-center">
            <Crosshair size={36} className="tank-reticle-icon" />
            <div className="tank-bore-circle" />
          </div>

          {/* Bottom Tank Dashboard */}
          <div className="tank-dashboard-card">
            {/* Header info */}
            <div className="tank-dash-header">
              <div className="tank-id-badge">
                <Shield size={16} />
                <span>TANK TEMPUR UTAMA • 120mm CANNON</span>
              </div>
              <button type="button" className="btn-tank-exit" onClick={handleExitTank} title="Keluar dari Tank (Tekan [E])">
                <LogOut size={14} />
                <span>{isMobile ? 'KELUAR' : '[E] KELUAR TANK'}</span>
              </button>
            </div>

            {/* Armor Durability Bar */}
            <div className="tank-armor-wrap">
              <div className="tank-armor-label-row">
                <span className="tank-armor-title">ARMOR TANK</span>
                <span className="tank-armor-value">
                  {tankHealth} / {tankMaxHealth} HP
                </span>
              </div>
              <div className="tank-armor-bar-bg">
                <div
                  className="tank-armor-bar-fill"
                  style={{
                    width: `${Math.max(0, Math.min(100, (tankHealth / tankMaxHealth) * 100))}%`,
                    backgroundColor: tankHealth > 200 ? '#10b981' : tankHealth > 90 ? '#f59e0b' : '#ef4444'
                  }}
                />
              </div>
            </div>

            {/* Cannon Reload Status */}
            <div className="tank-cannon-status-row">
              <span className="cannon-caliber-label">AMUNISI: HE EXPLOSIVE SHELL</span>
              <span className={`cannon-status-pill ${tankCannonReady ? 'ready' : 'reloading'}`}>
                {tankCannonReady ? '⚡ MERIAM SIAP TEMBAK' : `⏳ RELOAD: ${tankCannonCooldown.toFixed(1)}s`}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

