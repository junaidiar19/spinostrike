import React, { useState, useEffect } from 'react'
import {
  Play,
  MapPin,
  Crosshair,
  Settings,
  Laptop,
  Smartphone,
  ShieldAlert,
  Users,
  User,
  Download
} from 'lucide-react'
import { useGameStore } from '../../stores/useGameStore'
import { useRoomStore } from '../../stores/useRoomStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { gameEngine } from '../../game/core/GameEngine'
import { MAP_METADATA } from '../../game/maps/MapManager'
import { WEAPON_DEFINITIONS } from '../../game/weapons/definitions/weapons'
import { audioManager } from '../../game/core/AudioManager'
import type { WeaponId } from '../../types/game.types'

interface Props {
  onOpenMapSelect: () => void
  onOpenLoadout: () => void
  onOpenSettings: () => void
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const MainMenu: React.FC<Props> = ({
  onOpenMapSelect,
  onOpenLoadout,
  onOpenSettings
}) => {
  const setGameStatus = useGameStore((state) => state.setGameStatus)
  const currentMap = useGameStore((state) => state.currentMap)
  const selectedPrimary = useGameStore((state) => state.selectedPrimary)
  const [activeTab, setActiveTab] = useState<'desktop' | 'mobile'>('desktop')
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isAppInstalled, setIsAppInstalled] = useState(false)

  useEffect(() => {
    // Check if running in standalone display mode (PWA installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone)

    if (isStandalone) {
      setIsAppInstalled(true)
      return
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setIsAppInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (installPrompt) {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === 'accepted') {
        setIsAppInstalled(true)
      }
      setInstallPrompt(null)
    } else {
      alert(
        'Untuk memasang SpinoStrike di perangkat ini:\n\n' +
        '📱 HP Android (Chrome): Ketuk menu titik tiga (⋮) di kanan atas, pilih "Pasang aplikasi" / "Tambahkan ke Layar Utama".\n' +
        '🍎 iPhone/iPad (Safari): Ketuk tombol Bagikan (Share), scroll ke bawah lalu pilih "Tambahkan ke Layar Utama".\n' +
        '💻 Laptop (Chrome/Edge): Klik ikon instal (komputer dengan panah) di sisi kanan bilah alamat (URL) atas.'
      )
    }
  }

  const currentMapMeta = MAP_METADATA[currentMap]
  const currentWeaponMeta = WEAPON_DEFINITIONS[selectedPrimary]

  const handleStartGame = () => {
    audioManager.init()
    audioManager.resume()
    gameEngine.startMatch()
    setGameStatus('PLAYING')
    // On desktop, request pointer lock
    gameEngine.inputManager.requestPointerLock()
  }

  return (
    <div className="main-menu-overlay">
      {/* Background vignette & tactical scanlines */}
      <div className="menu-scanlines" />

      <div className="menu-container">
        <div className="menu-grid-wrapper">
          <div className="menu-left-pane">
            {/* Title & Branding */}
            <div className="menu-branding">
              <div className="menu-badge">
                <ShieldAlert size={16} />
                <span>PERTEMPURAN TAKTIS • MULTIPLAYER ONLINE</span>
              </div>
              <h1 className="game-title">
                SPINO<span>STRIKE</span>
              </h1>
              <p className="game-tagline">AKSI TEMBAK TAKTIS • LAPTOP & SMARTPHONE</p>
            </div>

            {/* Current Match Briefing Bar */}
            <div className="match-briefing-strip">
              <div className="briefing-item" onClick={onOpenMapSelect}>
                <MapPin size={18} className="briefing-icon" />
                <div className="briefing-text">
                  <span className="briefing-label">DEPLOYMENT MAP</span>
                  <span className="briefing-val">{currentMapMeta.name}</span>
                </div>
              </div>

              <div className="briefing-item" onClick={onOpenLoadout}>
                <Crosshair size={18} className="briefing-icon" />
                <div className="briefing-text">
                  <span className="briefing-label">PRIMARY WEAPON</span>
                  <span className="briefing-val">{currentWeaponMeta.name}</span>
                </div>
              </div>
            </div>

            {/* Quick Weapon Selector Pills (Fast Sniper & Rifle Equip) */}
            <div className="quick-weapon-pills">
              <span className="quick-weapon-label">PILIH SENJATA CEPAT:</span>
              {(['ak47', 'm4a1', 'awp', 'ssg08'] as WeaponId[]).map((id) => {
                const w = WEAPON_DEFINITIONS[id]
                const isEquipped = selectedPrimary === id
                return (
                  <button
                    key={id}
                    type="button"
                    className={`btn-quick-weapon ${isEquipped ? 'active' : ''}`}
                    onClick={() => {
                      useGameStore.getState().setSelectedPrimary(id)
                      gameEngine.player.initWeapon(id)
                    }}
                  >
                    {w.type === 'sniper' ? '🎯 ' : '⚡ '}
                    {id === 'awp' ? 'AWP SNIPER' : id === 'ssg08' ? 'SCOUT SNIPER' : w.name.split(' ')[0]}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="menu-right-pane">
            {/* Main Action Buttons */}
            <div className="menu-actions-stack">
              <div className="menu-primary-actions">
                <button type="button" className="btn-main btn-deploy" onClick={handleStartGame}>
                  <Play size={24} className="btn-icon-pulse" />
                  <div className="btn-deploy-text">
                    <span className="btn-title">PLAY OFFLINE VS BOTS</span>
                    <span className="btn-sub">PRACTICE & WARMUP</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="btn-main btn-multiplayer"
                  onClick={() => useRoomStore.getState().openRoomLobby()}
                >
                  <Users size={24} />
                  <div className="btn-deploy-text">
                    <span className="btn-title">ONLINE MULTIPLAYER</span>
                    <span className="btn-sub">GABUNG KE SERVER BATTLE</span>
                  </div>
                </button>
              </div>

              <div className="menu-secondary-grid">
                <button type="button" className="btn-secondary" onClick={onOpenMapSelect}>
                  <MapPin size={18} />
                  <span>MAPS</span>
                </button>

                <button type="button" className="btn-secondary" onClick={onOpenLoadout}>
                  <Crosshair size={18} />
                  <span>LOADOUT</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => useAuthStore.getState().openAuthModal()}
                >
                  <User size={18} />
                  <span>ACCOUNT</span>
                </button>

                <button type="button" className="btn-secondary" onClick={onOpenSettings}>
                  <Settings size={18} />
                  <span>SETTINGS</span>
                </button>

                <button
                  type="button"
                  className={`btn-secondary btn-install-app`}
                  onClick={handleInstallClick}
                  title={isAppInstalled ? 'Game telah terpasang' : 'Pasang SpinoStrike ke Layar Utama'}
                >
                  <Download size={18} />
                  <span>{isAppInstalled ? 'TERPASANG' : 'PASANG APP'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Guide Tabs */}
        <div className="controls-guide-box">
          <div className="guide-tabs-header">
            <button
              type="button"
              className={`guide-tab-btn ${activeTab === 'desktop' ? 'active' : ''}`}
              onClick={() => setActiveTab('desktop')}
            >
              <Laptop size={16} />
              <span>LAPTOP / PC GUIDE</span>
            </button>
            <button
              type="button"
              className={`guide-tab-btn ${activeTab === 'mobile' ? 'active' : ''}`}
              onClick={() => setActiveTab('mobile')}
            >
              <Smartphone size={16} />
              <span>SMARTPHONE GUIDE</span>
            </button>
          </div>

          <div className="guide-tab-content">
            {activeTab === 'desktop' ? (
              <div className="keys-grid">
                <div className="key-item">
                  <span className="key-kbd">WASD</span>
                  <span className="key-desc">Movement</span>
                </div>
                <div className="key-item">
                  <span className="key-kbd">MOUSE</span>
                  <span className="key-desc">Aim & Look</span>
                </div>
                <div className="key-item">
                  <span className="key-kbd">KLIK / F</span>
                  <span className="key-desc">Shoot (Tembak)</span>
                </div>
                <div className="key-item">
                  <span className="key-kbd">R-KLIK / E</span>
                  <span className="key-desc">Scope (Bidikan)</span>
                </div>
                <div className="key-item">
                  <span className="key-kbd">SPACE</span>
                  <span className="key-desc">Jump</span>
                </div>
                <div className="key-item">
                  <span className="key-kbd">CTRL / C</span>
                  <span className="key-desc">Crouch</span>
                </div>
                <div className="key-item">
                  <span className="key-kbd">R</span>
                  <span className="key-desc">Reload</span>
                </div>
                <div className="key-item">
                  <span className="key-kbd">1 - 3</span>
                  <span className="key-desc">Weapons</span>
                </div>
                <div className="key-item">
                  <span className="key-kbd">TAB</span>
                  <span className="key-desc">Scoreboard</span>
                </div>
              </div>
            ) : (
              <div className="mobile-guide-grid">
                <div className="mobile-guide-item">
                  <span className="mobile-guide-highlight">Layar Kiri</span>
                  <p>Sentuh & geser di mana saja untuk menggerakkan Virtual Joystick.</p>
                </div>
                <div className="mobile-guide-item">
                  <span className="mobile-guide-highlight">Layar Kanan</span>
                  <p>Sapukan jari (swipe) untuk mengarahkan bidikan kamera.</p>
                </div>
                <div className="mobile-guide-item">
                  <span className="mobile-guide-highlight">Tombol Tembak</span>
                  <p>Tombol tembak besar di sisi kanan untuk semprotan peluru.</p>
                </div>
                <div className="mobile-guide-item">
                  <span className="mobile-guide-highlight">AIM & Slot</span>
                  <p>Gunakan tombol AIM untuk zoom sniper dan tombol 1-2-3 untuk ganti senjata cepat.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="menu-footer">
          <span>SPINOSTRIKE • EDISI TEMPUR TAKTIS RESMI</span>
        </div>
      </div>
    </div>
  )
}
