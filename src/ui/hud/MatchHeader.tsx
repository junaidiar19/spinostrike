import React from 'react'
import { Shield, Flame, Clock } from 'lucide-react'
import { useGameStore } from '../../stores/useGameStore'

export const MatchHeader: React.FC = () => {
  const teamScores = useGameStore((state) => state.teamScores)
  const timeRemaining = useGameStore((state) => state.matchTimeRemaining)
  const targetKills = useGameStore((state) => state.matchTargetKills)
  const isMatchEnded = useGameStore((state) => state.isMatchEnded)

  if (isMatchEnded) return null

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = Math.floor(timeRemaining % 60)
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  const isLowTime = timeRemaining <= 30 && timeRemaining > 0

  return (
    <div className="match-header-strip">
      {/* CT (Counter-Terrorist) Team Score */}
      <div className="match-team-block ct-block">
        <div className="team-badge ct-badge">
          <Shield size={14} />
          <span>CT</span>
        </div>
        <div className="team-score ct-score">{teamScores.CT}</div>
      </div>

      {/* Center Timer & Target Kills */}
      <div className={`match-timer-center ${isLowTime ? 'timer-low' : ''}`}>
        <div className="match-timer-display">
          <Clock size={13} className="timer-icon" />
          <span>{timeFormatted}</span>
        </div>
        <div className="match-target-pill">
          TARGET: {targetKills} KILLS
        </div>
      </div>

      {/* T (Terrorist) Team Score */}
      <div className="match-team-block t-block">
        <div className="team-score t-score">{teamScores.T}</div>
        <div className="team-badge t-badge">
          <span>T</span>
          <Flame size={14} />
        </div>
      </div>
    </div>
  )
}
