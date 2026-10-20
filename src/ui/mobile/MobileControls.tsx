import React, { useRef, useState, useEffect } from 'react'
import {
  Crosshair,
  RotateCcw,
  ChevronsUp,
  ChevronsDown,
  Target,
  Trophy,
  Menu,
  PackagePlus,
  Maximize,
  Minimize,
  Zap
} from 'lucide-react'
import { gameEngine } from '../../game/core/GameEngine'
import { useGameStore } from '../../stores/useGameStore'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { ALL_ARENA_WEAPONS, type WeaponSlot } from '../../types/game.types'

export const MobileControls: React.FC = () => {
  const isAiming = useGameStore((state) => state.isAiming)
  const activeWeaponId = useGameStore((state) => state.activeWeaponId)
  const currentSlot = useGameStore((state) => state.currentSlot)
  const weaponStates = useGameStore((state) => state.weaponStates)
  const setIsScoreboardOpen = useGameStore((state) => state.setIsScoreboardOpen)
  const setGameStatus = useGameStore((state) => state.setGameStatus)

  const touchControlsScale = useSettingsStore((state) => state.touchControlsScale)
  const touchControlsOpacity = useSettingsStore((state) => state.touchControlsOpacity)

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Virtual Joystick State
  const [joystickActive, setJoystickActive] = useState(false)
  const [isAutoSprinting, setIsAutoSprinting] = useState(false)
  const [joystickBase, setJoystickBase] = useState({ x: 0, y: 0 })
  const [joystickKnob, setJoystickKnob] = useState({ x: 0, y: 0 })
  const joystickTouchId = useRef<number | null>(null)

  // Look Zone State
  const lookTouchId = useRef<number | null>(null)
  const lastLookPos = useRef<{ x: number; y: number } | null>(null)

  // Primary Fire Button State
  const fireTouchId = useRef<number | null>(null)

  // Left Fire Button State
  const leftFireTouchId = useRef<number | null>(null)

  const leftZoneRef = useRef<HTMLDivElement>(null)
  const rightZoneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
    }
  }, [])

  const handleToggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {})
      } else {
        document.exitFullscreen().catch(() => {})
      }
    } catch {
      // ignore
    }
  }

  // 1. Handle Virtual Joystick (Left Screen Half)
  const handleJoystickStart = (e: React.TouchEvent) => {
    if (joystickTouchId.current !== null) return
    const touch = e.changedTouches[0]
    joystickTouchId.current = touch.identifier

    setJoystickBase({ x: touch.clientX, y: touch.clientY })
    setJoystickKnob({ x: touch.clientX, y: touch.clientY })
    setJoystickActive(true)
    setIsAutoSprinting(false)
  }

  const handleJoystickMove = (e: React.TouchEvent) => {
    if (joystickTouchId.current === null) return
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      if (touch.identifier === joystickTouchId.current) {
        const dx = touch.clientX - joystickBase.x
        const dy = touch.clientY - joystickBase.y
        const distance = Math.hypot(dx, dy)
        const maxRadius = 48

        const angle = Math.atan2(dy, dx)
        const clampedDist = Math.min(distance, maxRadius)
        const knobX = joystickBase.x + Math.cos(angle) * clampedDist
        const knobY = joystickBase.y + Math.sin(angle) * clampedDist

        setJoystickKnob({ x: knobX, y: knobY })

        // Normalized vector (-1 to 1)
        const normX = (Math.cos(angle) * clampedDist) / maxRadius
        const normY = (Math.sin(angle) * clampedDist) / maxRadius
        gameEngine.inputManager.setMobileMove(normX, normY)

        // Auto-Sprint detection: If dragged forward past 72% radius
        const sprintActive = clampedDist > maxRadius * 0.72 && normY < -0.55
        setIsAutoSprinting(sprintActive)
        gameEngine.inputManager.setMobileSprint(sprintActive)
        break
      }
    }
  }

  const handleJoystickEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchId.current) {
        joystickTouchId.current = null
        setJoystickActive(false)
        setIsAutoSprinting(false)
        gameEngine.inputManager.setMobileMove(0, 0)
        gameEngine.inputManager.setMobileSprint(false)
        break
      }
    }
  }

  // 2. Handle Touch Look (Right Screen Half)
  const handleLookStart = (e: React.TouchEvent) => {
    if (lookTouchId.current !== null) return
    const touch = e.changedTouches[0]
    lookTouchId.current = touch.identifier
    lastLookPos.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleLookMove = (e: React.TouchEvent) => {
    if (lookTouchId.current === null || !lastLookPos.current) return
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      if (touch.identifier === lookTouchId.current) {
        const dx = touch.clientX - lastLookPos.current.x
        const dy = touch.clientY - lastLookPos.current.y
        lastLookPos.current = { x: touch.clientX, y: touch.clientY }

        gameEngine.inputManager.addMobileLook(dx, dy)
        break
      }
    }
  }

  const handleLookEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId.current) {
        lookTouchId.current = null
        lastLookPos.current = null
        break
      }
    }
  }

  // 3. Primary Right Fire Button (Dedicated firing: zero camera shift on tap/hold)
  const handleShootStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    const touch = e.changedTouches[0]
    fireTouchId.current = touch.identifier

    gameEngine.inputManager.setMobileAction('shoot', true)
    gameEngine.inputManager.triggerHaptic(22)
  }

  const handleShootEnd = (e: React.TouchEvent) => {
    e.stopPropagation()
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === fireTouchId.current) {
        fireTouchId.current = null
        gameEngine.inputManager.setMobileAction('shoot', false)
        break
      }
    }
  }

  // 4. Secondary Left Fire Button (For 3-Finger / Claw Grip)
  const handleLeftShootStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    const touch = e.changedTouches[0]
    leftFireTouchId.current = touch.identifier
    gameEngine.inputManager.setMobileAction('shoot', true)
    gameEngine.inputManager.triggerHaptic(22)
  }

  const handleLeftShootEnd = (e: React.TouchEvent) => {
    e.stopPropagation()
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === leftFireTouchId.current) {
        leftFireTouchId.current = null
        gameEngine.inputManager.setMobileAction('shoot', false)
        break
      }
    }
  }

  // 5. Jump, Crouch, Reload, Aim Actions
  const handleJumpStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    gameEngine.inputManager.setMobileAction('jump', true)
    gameEngine.inputManager.triggerHaptic(15)
  }
  const handleJumpEnd = (e: React.TouchEvent) => {
    e.stopPropagation()
    gameEngine.inputManager.setMobileAction('jump', false)
  }

  const handleCrouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    gameEngine.inputManager.setMobileAction('crouch', true)
    gameEngine.inputManager.triggerHaptic(15)
  }
  const handleCrouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation()
    gameEngine.inputManager.setMobileAction('crouch', false)
  }

  const handleReload = (e: React.TouchEvent) => {
    e.stopPropagation()
    gameEngine.inputManager.triggerHaptic(25)
    const active = useGameStore.getState().activeWeaponId
    const st = useGameStore.getState().weaponStates[active]
    if (st && st.reserve === 0 && active !== 'knife') {
      useGameStore.getState().refillAmmo(active)
    } else {
      gameEngine.inputManager.setMobileAction('reload', true)
    }
  }

  const handleRefillAmmo = (e: React.TouchEvent) => {
    e.stopPropagation()
    gameEngine.inputManager.triggerHaptic(40)
    useGameStore.getState().refillAmmo()
  }

  const handleAim = (e: React.TouchEvent) => {
    e.stopPropagation()
    gameEngine.inputManager.triggerHaptic(20)
    gameEngine.inputManager.setMobileAction('aim', true)
  }

  const handleSlot = (slot: WeaponSlot, e: React.TouchEvent) => {
    e.stopPropagation()
    gameEngine.inputManager.triggerHaptic(15)
    gameEngine.inputManager.setRequestedSlot(slot)
  }

  return (
    <div
      className="mobile-controls-layer"
      style={{
        opacity: touchControlsOpacity,
        transform: `scale(${touchControlsScale})`,
        transformOrigin: 'bottom center'
      }}
    >
      {/* Left Touch Joystick Zone */}
      <div
        ref={leftZoneRef}
        className="touch-zone touch-zone-left"
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickEnd}
      >
        {joystickActive && (
          <div
            className="virtual-joystick-base"
            style={{ left: joystickBase.x, top: joystickBase.y }}
          >
            {isAutoSprinting && (
              <div className="joystick-sprint-badge">
                <Zap size={12} className="sprint-icon" /> SPRINT
              </div>
            )}
            <div
              className={`virtual-joystick-knob ${isAutoSprinting ? 'knob-sprint' : ''}`}
              style={{
                transform: `translate(${joystickKnob.x - joystickBase.x}px, ${
                  joystickKnob.y - joystickBase.y
                }px)`
              }}
            />
          </div>
        )}
      </div>

      {/* Left Fire Button (Dedicated 3-Finger / Claw Grip) */}
      <button
        type="button"
        className="mobile-left-fire-btn"
        onTouchStart={handleLeftShootStart}
        onTouchEnd={handleLeftShootEnd}
        onTouchCancel={handleLeftShootEnd}
        title="Tombol Tembak Kiri (Claw Grip)"
      >
        <Crosshair size={26} />
        <span className="left-fire-text">TEMBAK</span>
      </button>

      {/* Right Touch Look Zone */}
      <div
        ref={rightZoneRef}
        className="touch-zone touch-zone-right"
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
        onTouchCancel={handleLookEnd}
      />

      {/* Top Left Menu, Scoreboard, Fullscreen & Refill */}
      <div className="mobile-top-bar">
        <button
          type="button"
          className="mobile-round-btn menu-btn"
          onTouchStart={() => setGameStatus('PAUSED')}
          title="Menu / Jeda"
        >
          <Menu size={20} />
        </button>
        <button
          type="button"
          className="mobile-round-btn score-btn"
          onTouchStart={() => setIsScoreboardOpen(true)}
          title="Tabel Skor"
        >
          <Trophy size={20} />
        </button>
        <button
          type="button"
          className="mobile-round-btn fullscreen-btn"
          onTouchStart={handleToggleFullscreen}
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Fullscreen)'}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
        <button
          type="button"
          className="mobile-round-btn refill-btn"
          onTouchStart={handleRefillAmmo}
          title="Isi Ulang Cadangan Peluru"
        >
          <PackagePlus size={20} />
        </button>
      </div>

      {/* Quick Slot Selector (Right Side Top) - ALL 6 WEAPONS with Clean Ammo Display */}
      <div className="mobile-slot-bar">
        {ALL_ARENA_WEAPONS.map((item) => {
          const isActive = currentSlot === item.slot
          const state = weaponStates[item.id]
          const isKnife = item.id === 'knife'
          const ammo = isKnife ? '⚔️' : `${state?.clip ?? 0}`

          return (
            <button
              key={item.slot}
              type="button"
              className={`slot-touch-btn ${isActive ? 'active' : ''}`}
              onTouchStart={(e) => handleSlot(item.slot, e)}
            >
              <span className="slot-btn-label">{item.shortName}</span>
              <span className={`slot-btn-ammo ${!isKnife && state?.clip === 0 ? 'empty' : ''}`}>
                {ammo}
              </span>
            </button>
          )
        })}
      </div>

      {/* Right Side Tactical Action Cluster */}
      <div className="mobile-action-cluster">
        <div className="mobile-action-secondary-group">
          <div className="mobile-action-row">
            {/* Aim / Scope Button */}
            <button
              type="button"
              className={`mobile-action-btn btn-aim ${isAiming ? 'aim-active' : ''}`}
              onTouchStart={handleAim}
            >
              <Target size={20} />
              <span className="btn-label">
                {activeWeaponId === 'awp' || activeWeaponId === 'ssg08' ? 'SCOPE' : 'AIM'}
              </span>
            </button>

            {/* Reload Button */}
            <button
              type="button"
              className="mobile-action-btn btn-reload"
              onTouchStart={handleReload}
            >
              <RotateCcw size={18} />
              <span className="btn-label">RELOAD</span>
            </button>
          </div>

          <div className="mobile-action-row">
            {/* Crouch Button */}
            <button
              type="button"
              className="mobile-action-btn btn-crouch"
              onTouchStart={handleCrouchStart}
              onTouchEnd={handleCrouchEnd}
            >
              <ChevronsDown size={20} />
              <span className="btn-label">DUCK</span>
            </button>

            {/* Jump Button */}
            <button
              type="button"
              className="mobile-action-btn btn-jump"
              onTouchStart={handleJumpStart}
              onTouchEnd={handleJumpEnd}
            >
              <ChevronsUp size={20} />
              <span className="btn-label">JUMP</span>
            </button>
          </div>
        </div>

        {/* Large Primary Fire Button */}
        <button
          type="button"
          className="mobile-fire-btn"
          onTouchStart={handleShootStart}
          onTouchEnd={handleShootEnd}
          onTouchCancel={handleShootEnd}
        >
          <Crosshair size={32} />
          <span className="fire-label">FIRE</span>
        </button>
      </div>
    </div>
  )
}
