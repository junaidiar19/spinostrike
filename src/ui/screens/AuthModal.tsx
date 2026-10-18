import React, { useState } from 'react'
import { User, LogIn, UserPlus, LogOut, X, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'

export const AuthModal: React.FC = () => {
  const {
    session,
    profile,
    authError,
    isLoading,
    isAuthModalOpen,
    loginAsGuest,
    loginWithEmail,
    registerWithEmail,
    logout,
    closeAuthModal
  } = useAuthStore()

  const [activeTab, setActiveTab] = useState<'guest' | 'login' | 'register'>('guest')
  const [nickname, setNickname] = useState(session?.nickname || '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (!isAuthModalOpen) return null

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) return
    await loginAsGuest(nickname.trim())
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    await loginWithEmail(email, password)
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !nickname) return
    await registerWithEmail(email, password, nickname)
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <div className="modal-title-row">
            <User size={22} className="modal-title-icon" />
            <h2>PLAYER ACCOUNT & CLOUD STATS</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={closeAuthModal}>
            <X size={20} />
          </button>
        </div>

        {/* Current Status Banner */}
        <div className="auth-status-strip">
          <div className="auth-avatar-box">
            <User size={24} />
          </div>
          <div className="auth-info">
            <span className="auth-name">{session?.nickname || 'Guest Striker'}</span>
            <span className="auth-badge">
              {session?.isGuest ? 'AKUN TAMU (TERSIMPAN OTOMATIS)' : 'OPERATIF RESMI'}
            </span>
          </div>
          {!session?.isGuest && (
            <button type="button" className="btn-logout" onClick={logout}>
              <LogOut size={16} />
              <span>LOGOUT</span>
            </button>
          )}
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="auth-error-alert">
            <AlertCircle size={16} />
            <span>{authError}</span>
          </div>
        )}

        {/* Tab Selector */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${activeTab === 'guest' ? 'active' : ''}`}
            onClick={() => setActiveTab('guest')}
          >
            GUEST PLAY
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            SIGN IN
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            CREATE ACCOUNT
          </button>
        </div>

        {/* Tab Content */}
        <div className="auth-tab-body">
          {activeTab === 'guest' && (
            <form onSubmit={handleGuestSubmit} className="auth-form">
              <p className="auth-desc">
                Bermain langsung tanpa akun! Statistik dan senjata Anda tersimpan otomatis di profil ini.
              </p>
              <div className="setting-field">
                <label htmlFor="guest-nickname">Ganti Callsign / Nickname</label>
                <input
                  id="guest-nickname"
                  type="text"
                  className="setting-text-input"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.substring(0, 16))}
                  placeholder="Striker_01"
                />
              </div>
              <button type="submit" className="btn-auth-submit" disabled={isLoading}>
                {isLoading ? 'SAVING...' : 'UPDATE CALLSIGN & PLAY'}
              </button>
            </form>
          )}

          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="auth-form">
              <div className="setting-field">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  className="setting-text-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operative@spinostrike.com"
                  required
                />
              </div>
              <div className="setting-field">
                <label htmlFor="login-pass">Password</label>
                <input
                  id="login-pass"
                  type="password"
                  className="setting-text-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-auth-submit" disabled={isLoading}>
                <LogIn size={18} />
                <span>{isLoading ? 'SIGNING IN...' : 'MASUK KE AKUN'}</span>
              </button>
            </form>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="auth-form">
              <div className="setting-field">
                <label htmlFor="reg-nickname">Operative Nickname</label>
                <input
                  id="reg-nickname"
                  type="text"
                  className="setting-text-input"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.substring(0, 16))}
                  placeholder="Commander_Ace"
                  required
                />
              </div>
              <div className="setting-field">
                <label htmlFor="reg-email">Email</label>
                <input
                  id="reg-email"
                  type="email"
                  className="setting-text-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="commander@spinostrike.com"
                  required
                />
              </div>
              <div className="setting-field">
                <label htmlFor="reg-pass">Password (Min 6 Karakter)</label>
                <input
                  id="reg-pass"
                  type="password"
                  className="setting-text-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <button type="submit" className="btn-auth-submit" disabled={isLoading}>
                <UserPlus size={18} />
                <span>{isLoading ? 'CREATING...' : 'CREATE ACCOUNT & SYNC STATS'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Stats Preview */}
        {profile && (
          <div className="auth-profile-stats">
            <div className="mini-stat">
              <span className="mini-val">{profile.kills}</span>
              <span className="mini-lbl">KILLS</span>
            </div>
            <div className="mini-stat">
              <span className="mini-val">{profile.deaths}</span>
              <span className="mini-lbl">DEATHS</span>
            </div>
            <div className="mini-stat">
              <span className="mini-val">
                {profile.deaths > 0 ? (profile.kills / profile.deaths).toFixed(2) : profile.kills.toFixed(2)}
              </span>
              <span className="mini-lbl">K/D RATIO</span>
            </div>
            <div className="mini-stat">
              <span className="mini-val">{profile.headshots}</span>
              <span className="mini-lbl">HEADSHOTS</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
