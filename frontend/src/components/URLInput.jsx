import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, AlertCircle, Command } from 'lucide-react'
import AuroraBackground from './AuroraBackground'
import { HERO_DELAYS, fadeUpVariant } from './motion/heroTiming'

const EXAMPLES = [
  { label: 'Data structures', url: 'https://www.youtube.com/watch?v=rfscVS0vtbw' },
  { label: 'Operating systems', url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc' },
  { label: 'System design', url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY' },
]

function isValidYouTubeUrl(url) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/.test(url)
}

export default function URLInput({ onSubmit, isLoading }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!url.trim()) { setError('Paste a lecture link to begin'); return }
    if (!isValidYouTubeUrl(url.trim())) { setError('That link doesn\'t look like a YouTube video'); return }
    setError('')
    onSubmit(url.trim())
  }

  return (
    <section className="relative pt-20 sm:pt-28 pb-14 px-5 overflow-hidden">
      {/* Ambient aurora background — slow, subtle, low opacity */}
      <AuroraBackground />

      <div className="relative max-w-2xl mx-auto text-center">
        {/* Eyebrow */}
        <motion.div
          className="inline-flex items-center gap-2 mb-7"
          variants={fadeUpVariant(HERO_DELAYS.heading)}
          initial="hidden"
          animate="visible"
        >
          <span className="eyebrow">Built for lecture-heavy weeks</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="font-display text-[2.6rem] sm:text-[3.4rem] leading-[1.05] font-bold tracking-tight mb-5"
          variants={fadeUpVariant(HERO_DELAYS.heading)}
          initial="hidden"
          animate="visible"
        >
          <span className="text-ink-900">Every lecture,</span>
          <br />
          <span className="text-gradient-violet">already organized.</span>
        </motion.h1>

        <motion.p
          className="text-ink-700 text-[1.05rem] leading-relaxed mb-10 max-w-md mx-auto"
          variants={fadeUpVariant(HERO_DELAYS.description)}
          initial="hidden"
          animate="visible"
        >
          Drop a YouTube link. Walk away with structured notes,
          a quiz, and flashcards — before your coffee's cold.
        </motion.p>

        {/* Hero input — signature element */}
        <motion.form
          onSubmit={handleSubmit}
          variants={fadeUpVariant(HERO_DELAYS.searchbar)}
          initial="hidden"
          animate="visible"
        >
          <div className="hero-input-shell">
            <div className={`hero-input-inner flex items-center gap-2 px-2 py-2 transition-shadow duration-300 ${
              focused ? 'shadow-[0_0_0_4px_rgba(139,127,232,0.12)]' : ''
            }`}>
              <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ml-1"
                   style={{ background: 'linear-gradient(155deg, rgba(255,90,90,0.15), rgba(255,90,90,0.05))' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF6B6B"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6Z"/></svg>
              </div>

              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError('') }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Paste any YouTube lecture URL"
                className="flex-1 bg-transparent text-ink-900 placeholder-ink-600 outline-none text-[0.95rem] py-2"
                disabled={isLoading}
              />

              {!url && (
                <kbd className="hidden sm:flex items-center gap-0.5 text-2xs text-ink-600 border border-line-medium rounded-md px-1.5 py-0.5 mr-1 font-mono">
                  <Command size={9} />V
                </kbd>
              )}

              <motion.button
                type="submit"
                disabled={isLoading || !url.trim()}
                className="btn-cta !rounded-xl flex-shrink-0 overflow-hidden"
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isLoading ? (
                    <motion.span
                      key="loading"
                      className="inline-flex items-center gap-2"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="w-3.5 h-3.5 border-2 border-canvas-900/30 border-t-canvas-900 rounded-full animate-spin" />
                      <span className="hidden sm:inline">Working</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      className="inline-flex items-center gap-2"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <span>Generate</span>
                      <ArrowRight size={15} className="btn-cta-icon" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 mt-3 text-rose-300 text-sm">
              <AlertCircle size={13} />
              <span>{error}</span>
            </div>
          )}
        </motion.form>

        {/* Examples */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-2 mt-6"
          variants={fadeUpVariant(HERO_DELAYS.tags)}
          initial="hidden"
          animate="visible"
        >
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => { setUrl(ex.url); setError('') }}
              disabled={isLoading}
              className="text-2xs font-mono text-ink-600 hover:text-violet-300 border border-line-subtle hover:border-violet-500/30 rounded-full px-3 py-1.5 transition-all disabled:opacity-40"
            >
              {ex.label}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
