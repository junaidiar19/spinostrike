import React, { useEffect, useRef, useState } from 'react'
import { gameEngine } from './game/core/GameEngine'
import { useGameStore } from './stores/useGameStore'
import { useAuthStore } from './stores/useAuthStore'
import { useRoomStore } from './stores/useRoomStore'
import { Crosshair } from './ui/hud/Crosshair'
import { HealthBar } from './ui/hud/HealthBar'
import { AmmoCounter } from './ui/hud/AmmoCounter'
import { WeaponSelector } from './ui/hud/WeaponSelector'
import { KillFeed } from './ui/hud/KillFeed'
import { SniperScope } from './ui/hud/SniperScope'
import { Scoreboard } from './ui/hud/Scoreboard'
import { DamageIndicator } from './ui/hud/DamageIndicator'
import { MatchNotification } from './ui/hud/MatchNotification'
import { MobileControls } from './ui/mobile/MobileControls'
import { MainMenu } from './ui/screens/MainMenu'
import { MapSelectModal } from './ui/screens/MapSelectModal'
import { LoadoutModal } from './ui/screens/LoadoutModal'
import { SettingsModal } from './ui/screens/SettingsModal'
import { PauseModal } from './ui/screens/PauseModal'
import { RoomLobbyModal } from './ui/screens/RoomLobbyModal'
import { AuthModal } from './ui/screens/AuthModal'
import './index.css'

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const gameStatus = useGameStore((state) => state.gameStatus)
  const isMobile = useGameStore((state) => state.isMobile)
  const setGameStatus = useGameStore((state) => state.setGameStatus)
  const initSession = useAuthStore((state) => state.initSession)

  // Sub-modal states
  const [isMapSelectOpen, setIsMapSelectOpen] = useState(false)
  const [isLoadoutOpen, setIsLoadoutOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isEngineReady, setIsEngineReady] = useState(false)

  // Initialize Supabase Auth Session & Global Room Lobby Realtime
  useEffect(() => {
    initSession()
    useRoomStore.getState().initLobby()
  }, [initSession])

  // Initialize Three.js Game Engine once
  useEffect(() => {
    let mounted = true

    if (canvasRef.current) {
      gameEngine.init(canvasRef.current).then(() => {
        if (mounted) {
          gameEngine.start()
          setIsEngineReady(true)
        }
      })
    }

    return () => {
      mounted = false
      gameEngine.destroy()
    }
  }, [])

  const wasPointerLockedRef = useRef(false)

  // Handle Desktop Pointer Lock listener (open pause menu on intentional Escape / unlock)
  useEffect(() => {
    const handlePointerLockChange = () => {
      const isLocked = !!document.pointerLockElement
      if (isLocked) {
        wasPointerLockedRef.current = true
      } else {
        if (wasPointerLockedRef.current && !isMobile && gameStatus === 'PLAYING') {
          wasPointerLockedRef.current = false
          setGameStatus('PAUSED')
        }
      }
    }

    document.addEventListener('pointerlockchange', handlePointerLockChange)
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange)
    }
  }, [gameStatus, isMobile, setGameStatus])

  return (
    <div className="game-app-root">
      {/* 3D Canvas Mount Point */}
      <div ref={canvasRef} className="game-canvas-container" />

      {/* Red Damage Flash Screen Vignette & Directional Hit Indicator */}
      <DamageIndicator />

      {/* IN-GAME HUD (Visible during gameplay) */}
      {gameStatus === 'PLAYING' && isEngineReady && (
        <div className="hud-layer">
          <Crosshair />
          <SniperScope />
          <HealthBar />
          <AmmoCounter />
          <WeaponSelector />
          <KillFeed />
          <Scoreboard />
          <MatchNotification />
          {isMobile && <MobileControls />}
        </div>
      )}

      {/* MAIN MENU */}
      {gameStatus === 'MENU' && (
        <MainMenu
          onOpenMapSelect={() => setIsMapSelectOpen(true)}
          onOpenLoadout={() => setIsLoadoutOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* PAUSE MODAL */}
      {gameStatus === 'PAUSED' && (
        <PauseModal
          onOpenMapSelect={() => setIsMapSelectOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* MAP SELECT MODAL */}
      {isMapSelectOpen && (
        <MapSelectModal onClose={() => setIsMapSelectOpen(false)} />
      )}

      {/* LOADOUT MODAL */}
      {isLoadoutOpen && (
        <LoadoutModal onClose={() => setIsLoadoutOpen(false)} />
      )}

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}

      {/* MULTIPLAYER ROOM LOBBY MODAL */}
      <RoomLobbyModal />

      {/* SUPABASE AUTH & ACCOUNT MODAL */}
      <AuthModal />
    </div>
  )
}

export default App
