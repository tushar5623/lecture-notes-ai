import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Gauge, X } from 'lucide-react'

const DISMISS_KEY = 'usageBannerDismissed'

export default function UsageBanner({ hasApiKey, onAddKey }) {
  const [usage, setUsage] = useState(null)
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === 'true')

  useEffect(() => {
    if (hasApiKey) return
    let cancelled = false
    axios.get('/api/usage')
      .then((res) => { if (!cancelled) setUsage(res.data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [hasApiKey])

  if (hasApiKey || dismissed || !usage) return null

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, 'true')
    setDismissed(true)
  }

  const pct = Math.min(100, Math.round((usage.count / usage.limit) * 100))

  return (
    <div className="w-full" style={{ animation: 'usageBannerIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <style>{`
        @keyframes usageBannerIn {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-4">
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: '#141417', border: '1px solid #27272A' }}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
               style={{ background: 'rgba(165, 148, 249, 0.12)' }}>
            <Gauge size={14} className="text-violet-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-ink-900 leading-snug">
              You've used <span className="font-mono font-semibold">{usage.count}</span> of today's{' '}
              <span className="font-mono font-semibold">{usage.limit}</span> shared requests — add your own key for unlimited use
            </p>
            <div className="mt-1.5 h-1 w-full max-w-[200px] rounded-full overflow-hidden" style={{ background: '#27272A' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, #A594F9, #6E5FD4)',
                  transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
                }}
              />
            </div>
          </div>

          <button
            onClick={onAddKey}
            className="flex-shrink-0 rounded-lg px-3 py-1.5 text-2xs font-mono font-semibold text-canvas-900 transition-all duration-150 hover:opacity-90 hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.97]"
            style={{ background: 'linear-gradient(155deg, #A594F9, #6E5FD4)' }}
          >
            Add your key
          </button>

          <button onClick={handleDismiss} className="btn-ghost !p-1.5 flex-shrink-0" aria-label="Dismiss">
            <X size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
