import React, { useState } from 'react'
import { X, Check, X as XIcon, Trophy, RotateCcw, ChevronRight, Brain, Loader2 } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

function QuizQuestion({ q, index, total, onAnswer }) {
  const [selected, setSelected] = useState(null)

  const handleSelect = (optIndex) => {
    if (selected !== null) return
    setSelected(optIndex)
    onAnswer(optIndex === q.correct)
  }

  const getOptionStyle = (optIndex) => {
    const base = "w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-sm font-medium "
    if (selected === null) return base + "border-line-medium bg-white/3 hover:bg-violet-500/8 hover:border-violet-500/30 text-ink-800 hover:text-ink-900 cursor-pointer"
    if (optIndex === q.correct) return base + "border-emerald-400/40 bg-emerald-400/10 text-emerald-200 cursor-default"
    if (optIndex === selected) return base + "border-rose-400/40 bg-rose-400/10 text-rose-200 cursor-default"
    return base + "border-line-subtle bg-transparent text-ink-600 cursor-default"
  }

  return (
    <div className="reveal-1">
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xs font-mono text-ink-600">{index + 1} / {total}</span>
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={`h-1 w-4 rounded-full transition-colors ${i < index ? 'bg-violet-500' : i === index ? 'bg-emerald-300' : 'bg-line-medium'}`} />
          ))}
        </div>
      </div>

      <div className="mb-5 flex gap-3 items-start">
        <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-2xs font-bold text-violet-300">
          {index + 1}
        </span>
        <p className="text-ink-900 font-medium leading-relaxed text-[0.95rem]">{q.question}</p>
      </div>

      <div className="space-y-2 mb-4">
        {q.options.map((opt, optIndex) => (
          <button key={optIndex} onClick={() => handleSelect(optIndex)} className={getOptionStyle(optIndex)}>
            <span className={`flex-shrink-0 w-6 h-6 rounded-md border flex items-center justify-center text-2xs font-bold ${
              selected === null ? 'border-line-medium text-ink-600' :
              optIndex === q.correct ? 'border-emerald-400 text-emerald-300 bg-emerald-400/15' :
              optIndex === selected ? 'border-rose-400 text-rose-300 bg-rose-400/15' : 'border-line-subtle text-ink-600'
            }`}>{OPTION_LABELS[optIndex]}</span>
            <span>{opt}</span>
            {selected !== null && optIndex === q.correct && <Check size={15} className="ml-auto text-emerald-300 flex-shrink-0" />}
            {selected !== null && optIndex === selected && selected !== q.correct && <XIcon size={15} className="ml-auto text-rose-300 flex-shrink-0" />}
          </button>
        ))}
      </div>

      {selected !== null && (
        <div className={`rounded-xl px-4 py-3 text-sm border reveal-1 ${
          selected === q.correct ? 'bg-emerald-400/8 border-emerald-400/20 text-emerald-200' : 'bg-rose-400/8 border-rose-400/20 text-rose-200'
        }`}>
          <span className="font-semibold">{selected === q.correct ? 'Correct — ' : 'Not quite — '}</span>
          {q.explanation}
        </div>
      )}
    </div>
  )
}

function ResultScreen({ score, total, onRetry, onClose }) {
  const percent = Math.round((score / total) * 100)
  const grade = percent >= 80 ? { label: 'Excellent recall', color: '#B8F5D8' }
    : percent >= 60 ? { label: 'Solid grasp', color: '#A594F9' }
    : percent >= 40 ? { label: 'Worth a re-read', color: '#FFE3B3' }
    : { label: 'Revisit the notes', color: '#FFC9D9' }

  return (
    <div className="text-center py-4 reveal-1">
      <h3 className="font-display text-xl font-bold mb-1" style={{ color: grade.color }}>{grade.label}</h3>
      <p className="text-ink-600 text-sm mb-7">Quiz complete</p>

      <div className="relative w-28 h-28 mx-auto mb-7">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={grade.color} strokeWidth="9"
            strokeDasharray={`${2 * Math.PI * 50}`} strokeDashoffset={`${2 * Math.PI * 50 * (1 - percent / 100)}`}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-ink-900">{score}</span>
          <span className="text-2xs text-ink-600 font-mono">of {total}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2.5">
        <button onClick={onRetry} className="btn-cta"><RotateCcw size={14} />Retry</button>
        <button onClick={onClose} className="btn-ghost">Back to notes</button>
      </div>
    </div>
  )
}

export default function QuizModal({ notes, language, onClose }) {
  const [state, setState] = useState('idle')
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)

  const loadQuiz = async () => {
    setState('loading')
    try {
      const res = await axios.post('/api/generate-quiz', { notes, language })
      const data = res.data
      if (data.status === 'error') { toast.error(data.message || 'Couldn\'t prepare the quiz'); setState('idle'); return }
      setQuestions(data.questions); setCurrentQ(0); setScore(0); setAnswered(false); setState('quiz')
    } catch {
      toast.error('Couldn\'t prepare the quiz — try again')
      setState('idle')
    }
  }

  const handleAnswer = (isCorrect) => { if (isCorrect) setScore(s => s + 1); setAnswered(true) }
  const handleNext = () => {
    if (currentQ + 1 >= questions.length) setState('result')
    else { setCurrentQ(q => q + 1); setAnswered(false) }
  }
  const handleRetry = () => {
    setCurrentQ(0); setScore(0); setAnswered(false); setState('quiz')
    setQuestions(q => [...q].sort(() => Math.random() - 0.5))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md surface-raised rounded-2xl overflow-hidden reveal-1">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
              <Brain size={14} className="text-violet-300" />
            </div>
            <div>
              <h2 className="text-ink-900 font-display font-semibold text-sm">Quiz</h2>
              <p className="text-ink-600 text-2xs font-mono">{language === 'hindi' ? 'Hindi' : 'English'} · 10 questions</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-ink-600 hover:text-ink-900 transition-all">
            <X size={15} />
          </button>
        </div>

        <div className="p-6">
          {state === 'idle' && (
            <div className="text-center py-4">
              <p className="text-ink-700 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
                Ten questions, pulled straight from your notes — a quick way to check what stuck.
              </p>
              <button onClick={loadQuiz} className="btn-cta mx-auto"><Brain size={14} />Start quiz</button>
            </div>
          )}

          {state === 'loading' && (
            <div className="text-center py-10">
              <Loader2 size={26} className="text-violet-400 animate-spin mx-auto mb-4" />
              <p className="text-ink-900 font-medium text-sm">Preparing your questions</p>
            </div>
          )}

          {state === 'quiz' && questions.length > 0 && (
            <div>
              <QuizQuestion key={currentQ} q={questions[currentQ]} index={currentQ} total={questions.length} onAnswer={handleAnswer} />
              {answered && (
                <button onClick={handleNext} className="mt-4 w-full btn-cta justify-center reveal-1">
                  {currentQ + 1 >= questions.length ? <><Trophy size={14} />See results</> : <>Next <ChevronRight size={14} /></>}
                </button>
              )}
            </div>
          )}

          {state === 'result' && <ResultScreen score={score} total={questions.length} onRetry={handleRetry} onClose={onClose} />}
        </div>
      </div>
    </div>
  )
}
