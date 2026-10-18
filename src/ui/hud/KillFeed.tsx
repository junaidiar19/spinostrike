import { Skull } from 'lucide-react'
import { useGameStore } from '../../stores/useGameStore'

export const KillFeed: React.FC = () => {
  const killfeed = useGameStore((state) => state.killfeed)

  if (killfeed.length === 0) return null

  return (
    <div className="killfeed-container">
      {killfeed.map((item) => (
        <div key={item.id} className="killfeed-entry">
          <span className={`player-tag team-${item.killerTeam.toLowerCase()}`}>
            {item.killerName}
          </span>

          <div className="kill-weapon-badge">
            <span className="kill-weapon-text">{item.weaponName}</span>
            {item.isHeadshot && <Skull size={14} className="headshot-skull" />}
          </div>

          <span className={`player-tag team-${item.victimTeam.toLowerCase()}`}>
            {item.victimName}
          </span>
        </div>
      ))}
    </div>
  )
}
