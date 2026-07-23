import React from 'react'
import { motion } from 'framer-motion'
import { Zap, Brain, FileDown, Clock3, Languages, ShieldCheck } from 'lucide-react'
import { scrollFadeUpVariant, staggerContainer } from './motion/heroTiming'

const FEATURES = [
  {
    icon: Zap, accent: '#FFE3B3',
    title: 'Reads captions instantly',
    desc: 'Pulls subtitles straight from YouTube — no waiting on transcription queues.'
  },
  {
    icon: Brain, accent: '#C4B8FF',
    title: 'Structured by Gemini',
    desc: 'Headings, bullets, and emphasis applied the way a top student would write them.'
  },
  {
    icon: FileDown, accent: '#B8F5D8',
    title: 'Leaves in any format',
    desc: 'Markdown, plain text, PDF, or Word — pick what your workflow already uses.'
  },
  {
    icon: Clock3, accent: '#FFC9D9',
    title: 'Handles the long ones',
    desc: 'Three-hour lectures get chunked intelligently so nothing gets cut short.'
  },
  {
    icon: Languages, accent: '#A594F9',
    title: 'Quizzes you in Hindi or English',
    desc: 'Test recall in whichever language clicks. Notes stay in clean English.'
  },
  {
    icon: ShieldCheck, accent: '#9A9AA8',
    title: 'Nothing to sign up for',
    desc: 'No account, no tracking. Your key lives in your own backend, full stop.'
  },
]

export default function Features() {
  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    card.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    card.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

  return (
    <section className="max-w-5xl mx-auto px-5 pb-24">
      <motion.div
        className="text-center mb-12"
        variants={scrollFadeUpVariant()}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
      >
        <p className="eyebrow mb-3">What you get</p>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink-900">
          Less typing. More understanding.
        </h2>
      </motion.div>

      <motion.div
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={staggerContainer(0.09)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {FEATURES.map((f) => {
          const Icon = f.icon
          return (
            <motion.div
              key={f.title}
              className="feature-card"
              variants={scrollFadeUpVariant()}
              onMouseMove={handleMouseMove}
            >
              <div className="feature-card-inner">
                <div
                  className="feature-icon w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    background: `linear-gradient(155deg, ${f.accent}22, ${f.accent}08)`,
                    border: `1px solid ${f.accent}33`
                  }}
                >
                  <Icon size={17} style={{ color: f.accent }} strokeWidth={2} />
                </div>
                <h3 className="font-display font-semibold text-ink-900 text-[0.95rem] mb-1.5">
                  {f.title}
                </h3>
                <p className="text-ink-700 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </section>
  )
}
