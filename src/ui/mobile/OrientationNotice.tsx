import React, { useEffect, useState } from 'react'
import { Smartphone, Maximize, X } from 'lucide-react'
import { useGameStore } from '../../stores/useGameStore'

export const OrientationNotice: React.FC = () => {
  const isMobile = useGameStore((state) => state.isMobile)
  const [isPortrait, setIsPortrait] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window !== 'undefined') {
        const portrait = window.innerHeight > window.innerWidth
        setIsPortrait(portrait)
      }
    }

    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)

    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
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

  // Only show if mobile, in portrait mode, and not dismissed
  if (!isMobile || !isPortrait || isDismissed) {
    return null
  }

  return (
    <div className="orientation-notice-backdrop">
      <div className="orientation-notice-card">
        <button
          type="button"
          className="orientation-dismiss-btn"
          onClick={() => setIsDismissed(true)}
          title="Tutup pemberitahuan"
        >
          <X size={18} />
        </button>

        <div className="orientation-icon-wrapper">
          <Smartphone size={44} className="orientation-phone-icon" />
        </div>

        <h3 className="orientation-title">PUTAR LAYAR KE HORIZONTAL</h3>
        <p className="orientation-desc">
          SpinoStrike dirancang optimal dalam posisi <strong>Landscape (Mendatar)</strong> untuk
          kontrol joystick &amp; visual tembak 3D yang leluasa.
        </p>

        <div className="orientation-btn-row">
          <button
            type="button"
            className="btn-orientation-fullscreen"
            onClick={handleToggleFullscreen}
          >
            <Maximize size={16} /> LAYAR PENUH (FULLSCREEN)
          </button>
          <button
            type="button"
            className="btn-orientation-dismiss"
            onClick={() => setIsDismissed(true)}
          >
            Lanjutkan Tetap Tegak
          </button>
        </div>
      </div>
    </div>
  )
}
