import React, { useState } from 'react'
import { X, ChevronLeft, ChevronRight, RotateCcw, Layers, Loader2, Shuffle } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

function FlipCard({ card, index, total }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xs font-mono text-ink-600">{index + 1} / {total}</span>
        <div className="flex gap-1">
          {Array.from({ length: Math.min(total, 10) }).map((_, i) => (
            <div key={i} className={`h-1 w-3.5 rounded-full transition-colors ${i < index ? 'bg-emerald-400' : i === index ? 'bg-violet-400' : 'bg-line-medium'}`} />
          ))}
        </div>
      </div>

      <div className="relative w-full cursor-pointer" style={{ height: '210px', perspective: '1000px' }} onClick={() => setFlipped(f => !f)}>
        <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
          <div className="absolute inset-0 rounded-2xl border border-violet-500/25 flex flex-col items-center justify-center p-6 text-center"
               style={{ background: 'linear-gradient(165deg, rgba(139,127,232,0.10), rgba(20,20,28,0.7))', backfaceVisibility: 'hidden' }}>
            <span className="text-2xs font-mono text-violet-400 mb-3 tracking-widest">TERM</span>
            <p className="text-ink-900 font-display font-semibold text-base leading-relaxed">{card.front}</p>
            <p className="text-ink-600 text-2xs mt-5 font-mono">tap to reveal</p>
          </div>

          <div className="absolute inset-0 rounded-2xl border border-emerald-400/20 flex flex-col items-center justify-center p-6 text-center"
               style={{ background: 'linear-gradient(165deg, rgba(184,245,216,0.08), rgba(20,20,28,0.7))', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <span className="text-2xs font-mono text-emerald-300 mb-3 tracking-widest">ANSWER</span>
            <p className="text-ink-800 text-sm leading-relaxed">{card.back}</p>
            <p className="text-ink-600 text-2xs mt-5 font-mono">tap to flip back</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FlashcardModal({ notes, language, onClose }) {
  const [state, setState] = useState('idle')
  const [cards, setCards] = useState([])
  const [currentCard, setCurrentCard] = useState(0)

  const loadCards = async () => {
    setState('loading')
    try {
      const res = await api.post('/api/generate-flashcards', { notes, language })
      const data = res.data
      if (data.status === 'error') { toast.error(data.message || 'Couldn\'t prepare flashcards'); setState('idle'); return }
      setCards(data.cards); setCurrentCard(0); setState('cards')
    } catch {
      toast.error('Couldn\'t prepare flashcards — try again')
      setState('idle')
    }
  }

  const handleShuffle = () => { setCards(c => [...c].sort(() => Math.random() - 0.5)); setCurrentCard(0); toast.success('Shuffled') }
  const handlePrev = () => setCurrentCard(c => Math.max(0, c - 1))
  const handleNext = () => setCurrentCard(c => Math.min(cards.length - 1, c + 1))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md surface-raised rounded-2xl overflow-hidden reveal-1">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-400/12 border border-emerald-400/25 flex items-center justify-center">
              <Layers size={13} className="text-emerald-300" />
            </div>
            <div>
              <h2 className="text-ink-900 font-display font-semibold text-sm">Flashcards</h2>
              <p className="text-ink-600 text-2xs font-mono">{language === 'hindi' ? 'Hindi' : 'English'} {state === 'cards' ? `· ${cards.length} cards` : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {state === 'cards' && (
              <button onClick={handleShuffle} className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-ink-600 hover:text-emerald-300 transition-all" title="Shuffle">
                <Shuffle size={13} />
              </button>
            )}
            <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-ink-600 hover:text-ink-900 transition-all">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {state === 'idle' && (
            <div className="text-center py-4">
              <p className="text-ink-700 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
                Twelve cards built from your notes. Flip through them whenever you've got a spare minute.
              </p>
              <button onClick={loadCards} className="btn-cta mx-auto" style={{ background: 'linear-gradient(180deg, #BFF2D9, #B8F5D8 50%, #8FE0B8)' }}>
                <Layers size={14} />Build flashcards
              </button>
            </div>
          )}

          {state === 'loading' && (
            <div className="text-center py-10">
              <Loader2 size={26} className="text-emerald-300 animate-spin mx-auto mb-4" />
              <p className="text-ink-900 font-medium text-sm">Pulling out key concepts</p>
            </div>
          )}

          {state === 'cards' && cards.length > 0 && (
            <div>
              <FlipCard key={currentCard} card={cards[currentCard]} index={currentCard} total={cards.length} />

              <div className="flex items-center justify-between mt-5">
                <button onClick={handlePrev} disabled={currentCard === 0} className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronLeft size={15} />Prev
                </button>
                <div className="flex gap-1.5">
                  {cards.map((_, i) => (
                    <button key={i} onClick={() => setCurrentCard(i)}
                      className={`rounded-full transition-all ${i === currentCard ? 'w-3.5 h-1.5 bg-emerald-300' : 'w-1.5 h-1.5 bg-line-medium hover:bg-line-strong'}`} />
                  ))}
                </div>
                <button onClick={handleNext} disabled={currentCard === cards.length - 1} className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed">
                  Next<ChevronRight size={15} />
                </button>
              </div>

              {currentCard === cards.length - 1 && (
                <button onClick={() => { setCurrentCard(0); toast.success('Back to the start') }}
                  className="mt-4 w-full btn-ghost justify-center !text-emerald-300 !border-emerald-400/20 hover:!bg-emerald-400/10">
                  <RotateCcw size={13} />Start over
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
