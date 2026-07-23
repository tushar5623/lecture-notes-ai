import React, { useEffect, useState } from 'react'
import SkeletonNotes from './SkeletonNotes'

const STEPS = [
  { label: 'Pulling captions from YouTube', duration: 3000 },
  { label: 'Breaking the lecture into segments', duration: 2000 },
  { label: 'Gemini is structuring your notes', duration: 8000 },
  { label: 'Final pass', duration: 1000 },
]

export default function LoadingState() {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    let elapsed = 0
    const totalTime = STEPS.reduce((a, s) => a + s.duration, 0)
    const interval = setInterval(() => {
      elapsed += 150
      let acc = 0
      for (let i = 0; i < STEPS.length; i++) {
        acc += STEPS[i].duration
        if (elapsed < acc) { setCurrentStep(i); break }
      }
      if (elapsed >= totalTime) clearInterval(interval)
    }, 150)
    return () => clearInterval(interval)
  }, [])

  // Generate pseudo-random but stable bar heights
  const bars = Array.from({ length: 28 }, (_, i) =>
    0.3 + 0.7 * Math.abs(Math.sin(i * 1.7 + 0.5))
  )

  return (
    <div className="max-w-md mx-auto px-5 py-10 text-center reveal-1">
      {/* Waveform — signature ingest visual */}
      <div className="flex items-end justify-center gap-[3px] h-14 mb-8">
        {bars.map((h, i) => (
          <div
            key={i}
            className="waveform-bar animate-waveform"
            style={{
              height: `${h * 100}%`,
              animationDelay: `${i * 0.045}s`,
              animationDuration: `${0.9 + (i % 4) * 0.15}s`,
            }}
          />
        ))}
      </div>

      <p className="font-display text-ink-900 font-semibold text-[0.95rem] mb-1.5 transition-all duration-300">
        {STEPS[currentStep].label}
      </p>
      <p className="text-ink-600 text-2xs font-mono">
        this usually takes under a minute
      </p>

      {/* Step dots */}
      <div className="flex items-center justify-center gap-1.5 mt-7">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === currentStep ? 'w-6 bg-violet-400' :
              i < currentStep ? 'w-1.5 bg-violet-500/40' : 'w-1.5 bg-line-medium'
            }`}
          />
        ))}
      </div>

      {/* Skeleton preview of the notes taking shape */}
      <SkeletonNotes />
    </div>
  )
}
