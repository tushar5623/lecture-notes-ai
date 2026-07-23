import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, Languages, Sparkle, Key } from 'lucide-react'
import ApiKeyPanel from './ApiKeyPanel'
import { HERO_DELAYS, fadeUpVariant } from './motion/heroTiming'

export default function Header({ darkMode, setDarkMode, language, setLanguage, apiKey, onSaveKey, onRemoveKey, panelOpen, setPanelOpen }) {
  const [logoHover, setLogoHover] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const keyButtonRef = useRef(null)
  const hasKey = Boolean(apiKey)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className={`absolute inset-0 navbar-surface ${scrolled ? 'is-scrolled' : ''}`} />
      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 h-[68px] flex items-center justify-between">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-2.5 cursor-default group"
          onMouseEnter={() => setLogoHover(true)}
          onMouseLeave={() => setLogoHover(false)}
          variants={fadeUpVariant(HERO_DELAYS.logo)}
          initial="hidden"
          animate="visible"
        >
          <div className="relative w-8 h-8 rounded-[9px] flex items-center justify-center overflow-hidden"
               style={{ background: 'linear-gradient(155deg, #A594F9, #6E5FD4)' }}>
            <Sparkle size={15} className="text-canvas-900 fill-canvas-900" strokeWidth={2.5} />
            <div className={`absolute inset-0 transition-opacity duration-500 ${logoHover ? 'opacity-100' : 'opacity-0'}`}
                 style={{ background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)' }} />
          </div>
          <span className="font-display font-bold text-[15px] tracking-tight text-ink-900">
            Note<span className="text-violet-400">AI</span>
          </span>
        </motion.div>

        {/* Right controls */}
        <motion.div
          className="flex items-center gap-2"
          variants={fadeUpVariant(HERO_DELAYS.navbar)}
          initial="hidden"
          animate="visible"
        >
          {/* Model pill */}
          <div className="hidden sm:flex model-pill">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-300" />
            </span>
            <span className="text-2xs font-mono font-medium text-ink-800">Gemini 2.5</span>
          </div>

          {/* API key status pill */}
          <div
            className="hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={
              hasKey
                ? { background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.25)' }
                : { background: '#1C1C21', border: '1px solid #27272A' }
            }
            title={hasKey ? 'Using your personal API key' : 'Using the shared daily quota'}
          >
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${hasKey ? 'bg-emerald-300' : 'bg-ink-800'}`} />
            <span className={`text-2xs font-mono font-medium ${hasKey ? 'text-emerald-300' : 'text-ink-800'}`}>
              {hasKey ? 'Your key' : 'Shared key'}
            </span>
          </div>

          {/* API key button */}
          <button
            ref={keyButtonRef}
            onClick={() => setPanelOpen((v) => !v)}
            className="btn-ghost !px-2.5"
            aria-label="Manage API key"
            title="Manage API key"
          >
            <Key size={14} />
          </button>

          {/* Language toggle */}
          <button
            onClick={() => setLanguage(language === 'english' ? 'hindi' : 'english')}
            className="btn-ghost !px-2.5"
            title="Quiz language"
          >
            <Languages size={14} />
            <span className="text-2xs font-mono font-semibold">
              {language === 'english' ? 'EN' : 'HI'}
            </span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="btn-ghost !px-2.5"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </motion.div>
      </div>

      <ApiKeyPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        apiKey={apiKey}
        onSave={onSaveKey}
        onRemove={onRemoveKey}
        anchorRef={keyButtonRef}
      />
    </header>
  )
}
