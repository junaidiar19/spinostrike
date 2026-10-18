import React from 'react'
import { Trophy, X } from 'lucide-react'
import { useGameStore } from '../../stores/useGameStore'

export const Scoreboard: React.FC = () => {
  const isScoreboardOpen = useGameStore((state) => state.isScoreboardOpen)
  const scoreboard = useGameStore((state) => state.scoreboard)
  const setIsScoreboardOpen = useGameStore((state) => state.setIsScoreboardOpen)

  if (!isScoreboardOpen) return null

  const ctPlayers = scoreboard.filter((p) => p.team === 'CT')
  const tPlayers = scoreboard.filter((p) => p.team === 'T')

  const ctScore = ctPlayers.reduce((acc, p) => acc + p.kills, 0)
  const tScore = tPlayers.reduce((acc, p) => acc + p.kills, 0)

  return (
    <div
      className="scoreboard-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsScoreboardOpen(false)
      }}
    >
      <div className="scoreboard-modal">
        {/* Header */}
        <div className="scoreboard-header">
          <div className="header-match-info">
            <Trophy size={20} className="trophy-gold" />
            <h2>TABEL SKOR TAKTIS</h2>
          </div>
          <button
            type="button"
            className="scoreboard-close-btn"
            onClick={() => setIsScoreboardOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Score comparison pill */}
        <div className="score-summary-bar">
          <div className="team-summary team-ct">
            <span className="team-name">COUNTER-TERRORISTS</span>
            <span className="team-score-num">{ctScore}</span>
          </div>
          <div className="vs-divider">VS</div>
          <div className="team-summary team-t">
            <span className="team-score-num">{tScore}</span>
            <span className="team-name">TERRORISTS</span>
          </div>
        </div>

        {/* Tables */}
        <div className="scoreboard-content">
          {/* CT Table */}
          <div className="team-table-box team-ct-box">
            <h3 className="team-box-title">COUNTER-TERRORISTS</h3>
            <table className="scoreboard-table">
              <thead>
                <tr>
                  <th>PLAYER</th>
                  <th>K</th>
                  <th>D</th>
                  <th>SCORE</th>
                  <th>PING</th>
                </tr>
              </thead>
              <tbody>
                {ctPlayers.map((p) => (
                  <tr key={p.id} className={p.id === 'player-1' ? 'row-self' : ''}>
                    <td className="player-col">
                      {p.name} {p.isBot && <span className="bot-tag">BOT</span>}
                    </td>
                    <td>{p.kills}</td>
                    <td>{p.deaths}</td>
                    <td>{p.score}</td>
                    <td>{p.ping}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* T Table */}
          <div className="team-table-box team-t-box">
            <h3 className="team-box-title">TERRORISTS</h3>
            <table className="scoreboard-table">
              <thead>
                <tr>
                  <th>PLAYER</th>
                  <th>K</th>
                  <th>D</th>
                  <th>SCORE</th>
                  <th>PING</th>
                </tr>
              </thead>
              <tbody>
                {tPlayers.map((p) => (
                  <tr key={p.id} className={p.id === 'player-1' ? 'row-self' : ''}>
                    <td className="player-col">
                      {p.name} {p.isBot && <span className="bot-tag">BOT</span>}
                    </td>
                    <td>{p.kills}</td>
                    <td>{p.deaths}</td>
                    <td>{p.score}</td>
                    <td>{p.ping}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="scoreboard-footer">
          <span>Tekan [TAB] atau klik di luar untuk menutup tabel</span>
        </div>
      </div>
    </div>
  )
}
