import React from 'react'
import { Play, Settings, MapPin, Home, RotateCcw } from 'lucide-react'
import { useGameStore } from '../../stores/useGameStore'
import { gameEngine } from '../../game/core/GameEngine'

interface Props {
  onOpenSettings: () => void
  onOpenMapSelect: () => void
}

export const PauseModal: React.FC<Props> = ({ onOpenSettings, onOpenMapSelect }) => {
  const setGameStatus = useGameStore((state) => state.setGameStatus)
  const currentMap = useGameStore((state) => state.currentMap)

  const handleResume = () => {
    setGameStatus('PLAYING')
    gameEngine.inputManager.requestPointerLock()
  }

  const handleRestart = () => {
    gameEngine.loadMap(currentMap)
    setGameStatus('PLAYING')
    gameEngine.inputManager.requestPointerLock()
  }

  const handleMainMenu = () => {
    gameEngine.inputManager.exitPointerLock()
    setGameStatus('MENU')
  }

  return (
    <div className="pause-modal-backdrop">
      <div className="pause-modal-card">
        <h2 className="pause-title">MATCH PAUSED</h2>

        <div className="pause-menu-actions">
          <button type="button" className="btn-pause-action btn-resume" onClick={handleResume}>
            <Play size={20} />
            <span>RESUME COMBAT</span>
          </button>

          <button type="button" className="btn-pause-action" onClick={handleRestart}>
            <RotateCcw size={20} />
            <span>RESTART ROUND</span>
          </button>

          <button type="button" className="btn-pause-action" onClick={onOpenMapSelect}>
            <MapPin size={20} />
            <span>SWITCH MAP</span>
          </button>

          <button type="button" className="btn-pause-action" onClick={onOpenSettings}>
            <Settings size={20} />
            <span>SETTINGS</span>
          </button>

          <button type="button" className="btn-pause-action btn-danger" onClick={handleMainMenu}>
            <Home size={20} />
            <span>QUIT TO MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  )
}
