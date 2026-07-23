import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

// Three softly blurred gradient blobs that drift very slowly behind the hero.
// Colors reuse the existing violet/mint palette (no new brand colors introduced).
// Movement is transform-only (x/y/scale) so it stays GPU-accelerated and cheap.
const BLOBS = [
  {
    className: '-top-24 left-1/4 w-72 h-72',
    color: 'radial-gradient(circle, #8B7FE8, transparent 70%)',
    opacity: 0.7,
    duration: 22,
    range: { x: [0, 30, -10, 0], y: [0, -20, 15, 0], scale: [1, 1.08, 0.96, 1] },
  },
  {
    className: 'top-10 right-1/4 w-60 h-60',
    color: 'radial-gradient(circle, #B8F5D8, transparent 70%)',
    opacity: 0.7,
    duration: 26,
    delay: 2,
    range: { x: [0, -25, 15, 0], y: [0, 18, -12, 0], scale: [1, 0.94, 1.06, 1] },
  },
  {
    className: 'top-32 left-1/2 w-80 h-80',
    color: 'radial-gradient(circle, #6E5FD4, transparent 70%)',
    opacity: 0.7,
    duration: 19,
    delay: 4,
    range: { x: [0, 20, -25, 0], y: [0, -15, 10, 0], scale: [1, 1.05, 0.97, 1] },
  },
]

export default function AuroraBackground() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {BLOBS.map((blob, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-[40px] ${blob.className}`}
          style={{ background: blob.color, opacity: blob.opacity }}
          animate={
            reduceMotion
              ? {}
              : { x: blob.range.x, y: blob.range.y, scale: blob.range.scale }
          }
          transition={{
            duration: blob.duration,
            delay: blob.delay || 0,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
