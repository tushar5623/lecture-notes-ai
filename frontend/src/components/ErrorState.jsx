import React from 'react'
import { TriangleAlert, RotateCcw } from 'lucide-react'

export default function ErrorState({ message, onReset }) {
  const isQuotaError = message?.toLowerCase().includes('429') || message?.toLowerCase().includes('quota')
  const isTranscriptError = message?.toLowerCase().includes('transcript') || message?.toLowerCase().includes('caption')
  const isBusyError = message?.toLowerCase().includes('503') || message?.toLowerCase().includes('unavailable')

  let heading = "Something interrupted this"
  let body = "Give it another go — most hiccups here are temporary."

  if (isQuotaError) {
    heading = "Taking a short breather"
    body = "We've hit today's processing limit. Try again in a minute."
  } else if (isBusyError) {
    heading = "High demand right now"
    body = "The model is busier than usual. A retry in a moment should clear it."
  } else if (isTranscriptError) {
    heading = "No captions on this one"
    body = "This video doesn't have subtitles available yet. Try a different lecture."
  }

  return (
    <div className="max-w-sm mx-auto px-5 py-10 text-center reveal-1">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5"
           style={{ background: 'linear-gradient(155deg, rgba(255,201,217,0.15), rgba(255,201,217,0.04))', border: '1px solid rgba(255,201,217,0.2)' }}>
        <TriangleAlert size={18} className="text-rose-300" strokeWidth={2} />
      </div>

      <h3 className="font-display text-ink-900 font-semibold text-base mb-1.5">{heading}</h3>
      <p className="text-ink-700 text-sm leading-relaxed mb-7 max-w-xs mx-auto">{body}</p>

      <button onClick={onReset} className="btn-cta">
        <RotateCcw size={14} />
        Try again
      </button>
    </div>
  )
}
