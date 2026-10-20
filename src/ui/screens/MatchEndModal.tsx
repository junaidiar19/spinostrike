import React from 'react'
import { Trophy, RotateCcw, Map, Home, Skull, Target, Crosshair, Award } from 'lucide-react'
import { useGameStore } from '../../stores/useGameStore'
import { gameEngine } from '../../game/core/GameEngine'

interface MatchEndModalProps {
  onOpenMapSelect: () => void
}

export const MatchEndModal: React.FC<MatchEndModalProps> = ({ onOpenMapSelect }) => {
  const isMatchEnded = useGameStore((state) => state.isMatchEnded)
  const matchResult = useGameStore((state) => state.matchResult)
  const teamScores = useGameStore((state) => state.teamScores)
  const scoreboard = useGameStore((state) => state.scoreboard)
  const setGameStatus = useGameStore((state) => state.setGameStatus)

  if (!isMatchEnded) return null

  // Find local player stats
  const localPlayer = scoreboard.find((p) => p.id === 'player-1')
  const myKills = localPlayer?.kills || 0
  const myDeaths = localPlayer?.deaths || 0
  const myScore = localPlayer?.score || 0
  const kdRatio = myDeaths > 0 ? (myKills / myDeaths).toFixed(1) : myKills.toString()

  // Find MVP (highest score)
  const sorted = [...scoreboard].sort((a, b) => b.score - a.score)
  const mvp = sorted[0]

  const handlePlayAgain = () => {
    gameEngine.startMatch()
  }

  const handleSelectMap = () => {
    onOpenMapSelect()
  }

  const handleBackToMenu = () => {
    setGameStatus('MENU')
  }

  const isVictory = matchResult === 'VICTORY'
  const isDefeat = matchResult === 'DEFEAT'

  return (
    <div className="match-end-overlay">
      <div className={`match-end-card ${isVictory ? 'card-victory' : isDefeat ? 'card-defeat' : 'card-draw'}`}>
        {/* Banner Header */}
        <div className="match-end-banner">
          <div className="banner-icon-wrap">
            {isVictory ? (
              <Trophy size={48} className="banner-trophy-icon" />
            ) : (
              <Skull size={48} className="banner-skull-icon" />
            )}
          </div>
          <h1 className="banner-title">
            {isVictory ? 'KEMENANGAN TELAK' : isDefeat ? 'KEKALAHAN RONDE' : 'HASIL PERTANDINGAN SERI'}
          </h1>
          <p className="banner-subtitle">
            {isVictory
              ? 'Misi Selesai! Tim Anda berhasil mendominasi sektor pertempuran.'
              : isDefeat
              ? 'Sektor jatuh ke tangan lawan. Atur ulang formasi dan balas di ronde berikutnya!'
              : 'Waktu habis dengan perolehan skor imbang di kedua kubu.'}
          </p>
        </div>

        {/* Final Team Score Box */}
        <div className="match-end-scores-strip">
          <div className="end-score-team ct-side">
            <span className="team-name">COUNTER-TERRORIST</span>
            <span className="team-points">{teamScores.CT}</span>
          </div>
          <div className="end-score-vs">VS</div>
          <div className="end-score-team t-side">
            <span className="team-points">{teamScores.T}</span>
            <span className="team-name">TERRORIST</span>
          </div>
        </div>

        {/* MVP Card */}
        {mvp && (
          <div className="match-mvp-card">
            <div className="mvp-badge">
              <Award size={16} /> MVP OF THE MATCH
            </div>
            <div className="mvp-details">
              <span className="mvp-name">{mvp.name}</span>
              <span className="mvp-meta">
                {mvp.kills} KILLS &bull; {mvp.score} PTS
              </span>
            </div>
          </div>
        )}

        {/* Local Player Stats Grid */}
        <div className="match-personal-stats">
          <div className="personal-stat-box">
            <Target size={18} className="stat-icon" />
            <span className="stat-val">{myKills}</span>
            <span className="stat-label">KILLS</span>
          </div>
          <div className="personal-stat-box">
            <Skull size={18} className="stat-icon" />
            <span className="stat-val">{myDeaths}</span>
            <span className="stat-label">DEATHS</span>
          </div>
          <div className="personal-stat-box">
            <Crosshair size={18} className="stat-icon" />
            <span className="stat-val">{kdRatio}</span>
            <span className="stat-label">K/D RATIO</span>
          </div>
          <div className="personal-stat-box">
            <Trophy size={18} className="stat-icon" />
            <span className="stat-val">{myScore}</span>
            <span className="stat-label">TOTAL SKOR</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="match-end-actions">
          <button type="button" className="btn-end-primary" onClick={handlePlayAgain}>
            <RotateCcw size={18} /> MAIN LAGI
          </button>
          <button type="button" className="btn-end-secondary" onClick={handleSelectMap}>
            <Map size={18} /> GANTI PETA
          </button>
          <button type="button" className="btn-end-subtle" onClick={handleBackToMenu}>
            <Home size={18} /> MENU UTAMA
          </button>
        </div>
      </div>
    </div>
  )
}
