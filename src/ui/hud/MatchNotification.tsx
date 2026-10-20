import React from 'react'
import { Skull, ShieldCheck, Trophy, MousePointer, PackagePlus } from 'lucide-react'
import { useGameStore } from '../../stores/useGameStore'
import { gameEngine } from '../../game/core/GameEngine'

export const MatchNotification: React.FC = () => {
  const isPlayerDead = useGameStore((state) => state.isPlayerDead)
  const killerInfo = useGameStore((state) => state.killerInfo)
  const respawnCountdown = useGameStore((state) => state.respawnCountdown)
  const matchGraceTimer = useGameStore((state) => state.matchGraceTimer)
  const spawnProtection = useGameStore((state) => state.spawnProtection)
  const isMobile = useGameStore((state) => state.isMobile)
  const setIsScoreboardOpen = useGameStore((state) => state.setIsScoreboardOpen)
  const ammoToast = useGameStore((state) => state.ammoToast)

  const isPointerLocked = gameEngine.inputManager?.isPointerLocked ?? false

  return (
    <>
      {/* 1. Tactical Hideout Preparation Grace Banner */}
      {matchGraceTimer > 0 && (
        <div className="tactical-banner-container grace-banner">
          <div className="tactical-banner-badge">
            <ShieldCheck size={18} className="shield-pulse-icon" />
            <span>PERSIAPAN TAKTIS • AREA PERSEMBUNYIAN</span>
            <span className="timer-tag">{Math.max(1, Math.ceil(matchGraceTimer))}s</span>
          </div>
          <p className="tactical-banner-sub">
            Anda berada di safezone persembunyian awal. Atur posisi taktis sebelum musuh bergerak!
          </p>
        </div>
      )}

      {/* 3. Spawn Shield Protection Banner (After respawn) */}
      {spawnProtection > 0 && matchGraceTimer <= 0 && !isPlayerDead && (
        <div className="tactical-banner-container shield-banner">
          <div className="tactical-banner-badge shield-badge">
            <ShieldCheck size={16} />
            <span>PERLINDUNGAN SPAWN AKTIF ({Math.max(1, Math.ceil(spawnProtection))}s)</span>
          </div>
        </div>
      )}

      {/* 4. Elimination & Respawn Full Overlay */}
      {isPlayerDead && (
        <div className="elimination-overlay">
          <div className="elimination-backdrop" />
          <div className="elimination-card">
            <div className="skull-container">
              <Skull size={48} className="skull-icon" />
            </div>
            <h2 className="elimination-title">TERELIMINASI</h2>
            <div className="elimination-details">
              <span className="killed-by-label">Dieliminasi oleh</span>
              <span className="killer-name">{killerInfo?.name || 'Musuh'}</span>
              <span className="killer-weapon">[{killerInfo?.weapon || 'Senjata'}]</span>
            </div>
            <div className="respawn-countdown-pill">
              <span className="respawn-pulse-dot" />
              <span>RESPAWN TAKTIS DALAM {Math.max(1, Math.ceil(respawnCountdown))} DETIK</span>
            </div>
            <button
              type="button"
              className="open-scoreboard-btn"
              onClick={() => setIsScoreboardOpen(true)}
            >
              <Trophy size={16} />
              <span>Buka Tabel Skor (TAB)</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Desktop Click to Lock Cursor Hint (When playing, not mobile, not locked) */}
      {!isMobile && !isPointerLocked && !isPlayerDead && (
        <div
          className="desktop-pointer-hint"
          onClick={() => gameEngine.inputManager?.requestPointerLock()}
        >
          <MousePointer size={14} className="pointer-icon" />
          <span>Klik Layar untuk Mengunci Kursor & Membidik Penuh (ESC untuk Jeda)</span>
        </div>
      )}

      {/* 6. Ammo Restock / Notice Toast */}
      {ammoToast && (
        <div className="ammo-restock-toast" role="alert">
          <PackagePlus size={18} className="toast-icon-pulse" />
          <span>{ammoToast}</span>
        </div>
      )}
    </>
  )
}
