import React, { useState } from 'react'
import { Clock3, ArrowUpRight, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

function formatTime(seconds) {
  const s = Math.floor(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function TimestampPanel({ videoUrl, transcriptWithTimestamps }) {
  const [state, setState] = useState('idle')
  const [timestamps, setTimestamps] = useState([])
  const [collapsed, setCollapsed] = useState(false)

  const loadTimestamps = async () => {
    if (!transcriptWithTimestamps || transcriptWithTimestamps.length === 0) {
      toast.error('No timing data available for this video')
      return
    }
    setState('loading')
    try {
      const res = await api.post('/api/generate-timestamps', { transcript: transcriptWithTimestamps, video_url: videoUrl })
      const data = res.data
      if (data.status === 'error') { toast.error(data.message || 'Couldn\'t map the timestamps'); setState('idle'); return }
      setTimestamps(data.timestamps); setState('done')
    } catch {
      toast.error('Couldn\'t map the timestamps — try again')
      setState('idle')
    }
  }

  const openYouTube = (seconds) => {
    let baseUrl = videoUrl.replace(/[?&]t=\d+/, '')
    const separator = baseUrl.includes('?') ? '&' : '?'
    window.open(`${baseUrl}${separator}t=${Math.floor(seconds)}`, '_blank')
  }

  if (state === 'idle') {
    return (
      <div className="max-w-3xl mx-auto mb-4">
        <button onClick={loadTimestamps}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl surface hover:border-amber-300/25 text-ink-700 hover:text-amber-200 text-sm font-medium transition-all group">
          <Clock3 size={14} className="text-amber-200/70" />
          Jump to key moments in the video
        </button>
      </div>
    )
  }

  if (state === 'loading') {
    return (
      <div className="max-w-3xl mx-auto mb-4">
        <div className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl surface text-ink-700 text-sm">
          <Loader2 size={14} className="animate-spin text-amber-200" />
          Finding key moments...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto mb-4">
      <div className="surface rounded-2xl overflow-hidden">
        <button onClick={() => setCollapsed(c => !c)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/3 transition-all">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,227,179,0.12)', border: '1px solid rgba(255,227,179,0.2)' }}>
              <Clock3 size={12} className="text-amber-200" />
            </div>
            <span className="text-ink-900 font-display font-semibold text-sm">Key moments</span>
            <span className="text-2xs font-mono text-amber-200/80">{timestamps.length}</span>
          </div>
          {collapsed ? <ChevronDown size={14} className="text-ink-600" /> : <ChevronUp size={14} className="text-ink-600" />}
        </button>

        {!collapsed && (
          <div className="px-4 pb-4 grid gap-1.5">
            {timestamps.map((item, i) => (
              <button key={i} onClick={() => openYouTube(item.seconds)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/2 hover:bg-amber-300/8 border border-transparent hover:border-amber-300/20 transition-all group text-left">
                <span className="flex-shrink-0 font-mono text-2xs font-semibold text-amber-200 bg-amber-300/10 px-2 py-1 rounded-lg min-w-[50px] text-center">
                  {formatTime(item.seconds)}
                </span>
                <span className="flex-1 text-ink-700 group-hover:text-ink-900 text-sm transition-colors">{item.topic}</span>
                <ArrowUpRight size={13} className="flex-shrink-0 text-ink-600 group-hover:text-amber-200 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
