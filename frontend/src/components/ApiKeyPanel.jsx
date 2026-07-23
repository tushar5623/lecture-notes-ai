import React, { useState, useEffect, useRef } from 'react'
import { Key, ChevronDown, ExternalLink, X, Check, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ApiKeyPanel({ isOpen, onClose, apiKey, onSave, onRemove, anchorRef }) {
  const [inputValue, setInputValue] = useState('')
  const [remember, setRemember] = useState(true)
  const [showGuide, setShowGuide] = useState(!apiKey)
  const panelRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setInputValue('')
      setShowGuide(!apiKey)
    }
  }, [isOpen, apiKey])

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          anchorRef?.current && !anchorRef.current.contains(e.target)) {
        onClose()
      }
    }
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose, anchorRef])

  if (!isOpen) return null

  const isLooselyValid = (key) => key.trim().startsWith('AI') && key.trim().length >= 20

  const handleSave = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) {
      toast.error('Paste a key first')
      return
    }
    if (!isLooselyValid(trimmed)) {
      toast.error('That doesn\'t look like a Gemini key — it should start with "AI"')
      return
    }
    onSave(trimmed, remember)
    toast.success('Key added — your requests now use your own quota')
    onClose()
  }

  const handleRemove = () => {
    onRemove()
    toast.success('Key removed — back to shared mode')
    onClose()
  }

  return (
    <div
      ref={panelRef}
      className="absolute top-[60px] right-5 sm:right-8 z-50 w-[340px] rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(20, 20, 24, 0.97)',
        border: '1px solid #27272A',
        boxShadow: '0 20px 50px -12px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(20px)',
        transformOrigin: 'top right',
        animation: 'apiKeyPanelIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <style>{`
        @keyframes apiKeyPanelIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes apiKeyCheckIn {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes apiKeyGuideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-line-subtle">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
               style={{ background: 'linear-gradient(155deg, #A594F9, #6E5FD4)' }}>
            <Key size={12} className="text-canvas-900" strokeWidth={2.5} />
          </div>
          <span className="font-display font-semibold text-[13px] text-ink-900">
            Your API key
          </span>
        </div>
        <button onClick={onClose} className="btn-ghost !p-1.5" aria-label="Close">
          <X size={13} />
        </button>
      </div>

      <div className="px-4 py-4 space-y-3.5">
        {apiKey ? (
          <div className="flex items-center justify-between rounded-xl px-3 py-2.5"
               style={{ background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
            <div className="flex items-center gap-2">
              <Check size={13} className="text-emerald-300" style={{ animation: 'apiKeyCheckIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }} />
              <span className="text-2xs font-mono text-ink-800">
                {apiKey.slice(0, 6)}••••••••{apiKey.slice(-4)}
              </span>
            </div>
            <button
              onClick={handleRemove}
              className="flex items-center gap-1 text-2xs font-mono font-semibold text-ink-800 hover:text-rose-300 transition-colors"
            >
              <Trash2 size={11} /> Remove
            </button>
          </div>
        ) : (
          <>
            <p className="text-2xs text-ink-800 leading-relaxed">
              Add your own Gemini key to skip the shared daily limit. It's sent with each request and never stored on our server.
            </p>
            <input
              type="password"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="AIza..."
              autoFocus
              className="w-full rounded-xl px-3 py-2.5 text-[13px] font-mono text-ink-900 placeholder-ink-800/50 outline-none transition-colors"
              style={{ background: '#0F0F12', border: '1px solid #27272A' }}
              onFocus={(e) => e.target.style.borderColor = '#A594F9'}
              onBlur={(e) => e.target.style.borderColor = '#27272A'}
            />

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-violet-400"
              />
              <span className="text-2xs text-ink-800">
                Remember this key on this device
              </span>
            </label>

            <button
              onClick={handleSave}
              className="w-full rounded-xl py-2.5 text-[13px] font-semibold text-canvas-900 transition-all duration-150 hover:opacity-90 hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98]"
              style={{ background: 'linear-gradient(155deg, #A594F9, #6E5FD4)' }}
            >
              Save key
            </button>
          </>
        )}

        {/* Collapsible guide */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1C1C21' }}>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-2xs font-mono font-semibold text-ink-800 hover:text-ink-900 transition-colors"
          >
            How to get a free key
            <ChevronDown size={13} className={`transition-transform ${showGuide ? 'rotate-180' : ''}`} />
          </button>

          {showGuide && (
            <div
              className="px-3 pb-3 space-y-2"
              style={{ animation: 'apiKeyGuideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              {[
                'Go to Google AI Studio',
                'Sign in with your Google account',
                'Click "Get API key" in the left sidebar',
                'Click "Create API key"',
                'Copy the key and paste it above',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-ink-800 mt-0.5"
                        style={{ background: '#1C1C21' }}>
                    {i + 1}
                  </span>
                  <span className="text-2xs text-ink-800 leading-relaxed pt-0.5">{step}</span>
                </div>
              ))}

              <a
                href="https://aistudio.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-2xs font-mono font-semibold text-ink-900 transition-colors"
                style={{ background: '#1C1C21' }}
              >
                Open AI Studio <ExternalLink size={11} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
