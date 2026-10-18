import React, { useRef, useState } from 'react'
import {
  Crosshair,
  RotateCcw,
  ChevronsUp,
  ChevronsDown,
  Target,
  Trophy,
  Menu,
  PackagePlus
} from 'lucide-react'
import { gameEngine } from '../../game/core/GameEngine'
import { useGameStore } from '../../stores/useGameStore'
import { useSettingsStore } from '../../stores/useSettingsStore'
import type { WeaponSlot } from '../../types/game.types'

export const MobileControls: React.FC = () => {
  const isAiming = useGameStore((state) => state.isAiming)
  const activeWeaponId = useGameStore((state) => state.activeWeaponId)
  const currentSlot = useGameStore((state) => state.currentSlot)
  const setIsScoreboardOpen = useGameStore((state) => state.setIsScoreboardOpen)
  const setGameStatus = useGameStore((state) => state.setGameStatus)

  const touchControlsScale = useSettingsStore((state) => state.touchControlsScale)
  const touchControlsOpacity = useSettingsStore((state) => state.touchControlsOpacity)

  // Virtual Joystick State
  const [joystickActive, setJoystickActive] = useState(false)
  const [joystickBase, setJoystickBase] = useState({ x: 0, y: 0 })
  const [joystickKnob, setJoystickKnob] = useState({ x: 0, y: 0 })
  const joystickTouchId = useRef<number | null>(null)

  // Look Zone State
  const lookTouchId = useRef<number | null>(null)
  const lastLookPos = useRef<{ x: number; y: number } | null>(null)

  const leftZoneRef = useRef<HTMLDivElement>(null)
  const rightZoneRef = useRef<HTMLDivElement>(null)

  // 1. Handle Virtual Joystick (Left Screen Half)
  const handleJoystickStart = (e: React.TouchEvent) => {
    if (joystickTouchId.current !== null) return
    const touch = e.changedTouches[0]
    joystickTouchId.current = touch.identifier

    setJoystickBase({ x: touch.clientX, y: touch.clientY })
    setJoystickKnob({ x: touch.clientX, y: touch.clientY })
    setJoystickActive(true)
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
        break
      }
    }
  }

  const handleJoystickEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchId.current) {
        joystickTouchId.current = null
        setJoystickActive(false)
        gameEngine.inputManager.setMobileMove(0, 0)
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

  // Actions
  const handleShootStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    gameEngine.inputManager.setMobileAction('shoot', true)
  }
  const handleShootEnd = (e: React.TouchEvent) => {
    e.stopPropagation()
    gameEngine.inputManager.setMobileAction('shoot', false)
  }

  const handleJumpStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    gameEngine.inputManager.setMobileAction('jump', true)
  }
  const handleJumpEnd = (e: React.TouchEvent) => {
    e.stopPropagation()
    gameEngine.inputManager.setMobileAction('jump', false)
  }

  const handleCrouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    gameEngine.inputManager.setMobileAction('crouch', true)
  }
  const handleCrouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation()
    gameEngine.inputManager.setMobileAction('crouch', false)
  }

  const handleReload = (e: React.TouchEvent) => {
    e.stopPropagation()
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
    gameEngine.inputManager.setMobileAction('aim', true)
  }

  const handleSlot = (slot: WeaponSlot, e: React.TouchEvent) => {
    e.stopPropagation()
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
            <div
              className="virtual-joystick-knob"
              style={{
                transform: `translate(${joystickKnob.x - joystickBase.x}px, ${
                  joystickKnob.y - joystickBase.y
                }px)`
              }}
            />
          </div>
        )}
      </div>

      {/* Right Touch Look Zone */}
      <div
        ref={rightZoneRef}
        className="touch-zone touch-zone-right"
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
        onTouchCancel={handleLookEnd}
      />

      {/* Top Left Menu & Scoreboard Controls */}
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
          className="mobile-round-btn refill-btn"
          onTouchStart={handleRefillAmmo}
          title="Isi Ulang Cadangan Peluru"
        >
          <PackagePlus size={20} />
        </button>
      </div>

      {/* Quick Slot Selector (Right Side Top) - ALL 6 WEAPONS */}
      <div className="mobile-slot-bar">
        {[
          { slot: 1 as WeaponSlot, label: 'AK' },
          { slot: 2 as WeaponSlot, label: 'M4' },
          { slot: 3 as WeaponSlot, label: 'AWP' },
          { slot: 4 as WeaponSlot, label: 'SSG' },
          { slot: 5 as WeaponSlot, label: 'DGL' },
          { slot: 6 as WeaponSlot, label: 'KNIF' }
        ].map((item) => (
          <button
            key={item.slot}
            type="button"
            className={`slot-touch-btn ${currentSlot === item.slot ? 'active' : ''}`}
            onTouchStart={(e) => handleSlot(item.slot, e)}
          >
            {item.label}
          </button>
        ))}
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
        >
          <Crosshair size={32} />
          <span className="fire-label">FIRE</span>
        </button>
      </div>
    </div>
  )
}
