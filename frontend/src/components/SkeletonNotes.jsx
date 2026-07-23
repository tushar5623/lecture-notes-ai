import React from 'react'
import { motion } from 'framer-motion'

// A single shimmer bar. Widths are passed as tailwind width classes so the
// block shapes can be varied per "line" without new CSS per instance.
function Bar({ w = 'w-full', h = 'h-3', className = '' }) {
  return <div className={`skeleton-bar ${w} ${h} ${className}`} />
}

// Mirrors the real .notes-content shape: h1 -> paragraph lines -> h2 -> list -> h2 -> paragraph
// so the skeleton reads as "notes are forming" rather than a generic spinner.
export default function SkeletonNotes() {
  return (
    <motion.div
      className="max-w-2xl mx-auto px-5 mt-10"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="surface rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Title */}
        <Bar w="w-2/3" h="h-5" />

        {/* Paragraph */}
        <div className="space-y-2.5">
          <Bar w="w-full" />
          <Bar w="w-11/12" />
          <Bar w="w-4/5" />
        </div>

        {/* Subheading */}
        <Bar w="w-1/3" h="h-4" className="!opacity-80" />

        {/* List */}
        <div className="space-y-2.5 pl-1">
          <Bar w="w-5/6" />
          <Bar w="w-3/4" />
          <Bar w="w-4/5" />
        </div>

        {/* Subheading */}
        <Bar w="w-2/5" h="h-4" className="!opacity-80" />

        {/* Paragraph */}
        <div className="space-y-2.5">
          <Bar w="w-full" />
          <Bar w="w-10/12" />
        </div>
      </div>
    </motion.div>
  )
}
