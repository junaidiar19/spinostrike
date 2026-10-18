import React from 'react'
import { Settings, Volume2, MousePointer, Smartphone, X } from 'lucide-react'
import { useSettingsStore } from '../../stores/useSettingsStore'

interface Props {
  onClose: () => void
}

export const SettingsModal: React.FC<Props> = ({ onClose }) => {
  const {
    playerName,
    mouseSensitivity,
    touchSensitivity,
    masterVolume,
    sfxVolume,
    invertY,
    touchControlsScale,
    touchControlsOpacity,
    setPlayerName,
    setMouseSensitivity,
    setTouchSensitivity,
    setMasterVolume,
    setSfxVolume,
    setInvertY,
    setTouchControlsScale,
    setTouchControlsOpacity
  } = useSettingsStore()

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <div className="modal-title-row">
            <Settings size={22} className="modal-title-icon" />
            <h2>GAME & CONTROL SETTINGS</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-scrollable-content">
          {/* Player Profile */}
          <div className="settings-group">
            <h3 className="group-title">OPERATIVE PROFILE</h3>
            <div className="setting-field">
              <label htmlFor="player-name-input">Callsign / Nickname</label>
              <input
                id="player-name-input"
                type="text"
                className="setting-text-input"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.substring(0, 16))}
              />
            </div>
          </div>

          {/* Mouse & Keyboard (Desktop) */}
          <div className="settings-group">
            <div className="group-title-row">
              <MousePointer size={18} />
              <h3 className="group-title">DESKTOP / LAPTOP CONTROLS</h3>
            </div>

            <div className="setting-slider-item">
              <div className="slider-header">
                <span className="slider-label">Mouse Aim Sensitivity</span>
                <span className="slider-val">{mouseSensitivity.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="4.0"
                step="0.1"
                value={mouseSensitivity}
                onChange={(e) => setMouseSensitivity(parseFloat(e.target.value))}
                className="slider-input"
              />
            </div>

            <div className="setting-toggle-item">
              <label className="toggle-label" htmlFor="invert-y-check">
                <span>Invert Vertical Look (Y-Axis)</span>
                <input
                  id="invert-y-check"
                  type="checkbox"
                  checked={invertY}
                  onChange={(e) => setInvertY(e.target.checked)}
                />
              </label>
            </div>

            <div className="touchpad-tip-box" style={{
              marginTop: 10,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              fontSize: 12,
              color: '#94a3b8',
              lineHeight: 1.4
            }}>
              <span style={{ color: '#38bdf8', fontWeight: 800, display: 'block', marginBottom: 2 }}>
                💡 Tips Pengguna Touchpad Laptop:
              </span>
              Jika touchpad laptop Anda sulit ditekan sambil digeser, gunakan tombol keyboard <strong style={{ color: '#f8fafc' }}>[ F ]</strong> untuk Menembak dan <strong style={{ color: '#f8fafc' }}>[ E ]</strong> untuk Membidik (Scope) tanpa perlu menekan touchpad!
            </div>
          </div>

          {/* Touch Controls (Mobile) */}
          <div className="settings-group">
            <div className="group-title-row">
              <Smartphone size={18} />
              <h3 className="group-title">SMARTPHONE TOUCH CONTROLS</h3>
            </div>

            <div className="setting-slider-item">
              <div className="slider-header">
                <span className="slider-label">Touch Swipe Sensitivity</span>
                <span className="slider-val">{touchSensitivity.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="5.0"
                step="0.2"
                value={touchSensitivity}
                onChange={(e) => setTouchSensitivity(parseFloat(e.target.value))}
                className="slider-input"
              />
            </div>

            <div className="setting-slider-item">
              <div className="slider-header">
                <span className="slider-label">Touch Button Scale</span>
                <span className="slider-val">{touchControlsScale.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={touchControlsScale}
                onChange={(e) => setTouchControlsScale(parseFloat(e.target.value))}
                className="slider-input"
              />
            </div>

            <div className="setting-slider-item">
              <div className="slider-header">
                <span className="slider-label">Button Opacity</span>
                <span className="slider-val">{Math.round(touchControlsOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="1.0"
                step="0.05"
                value={touchControlsOpacity}
                onChange={(e) => setTouchControlsOpacity(parseFloat(e.target.value))}
                className="slider-input"
              />
            </div>
          </div>

          {/* Audio */}
          <div className="settings-group">
            <div className="group-title-row">
              <Volume2 size={18} />
              <h3 className="group-title">AUDIO & SFX</h3>
            </div>

            <div className="setting-slider-item">
              <div className="slider-header">
                <span className="slider-label">Master Volume</span>
                <span className="slider-val">{Math.round(masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={masterVolume}
                onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                className="slider-input"
              />
            </div>

            <div className="setting-slider-item">
              <div className="slider-header">
                <span className="slider-label">Weapons & Combat SFX</span>
                <span className="slider-val">{Math.round(sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sfxVolume}
                onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                className="slider-input"
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-save-settings" onClick={onClose}>
            SAVE & CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}
