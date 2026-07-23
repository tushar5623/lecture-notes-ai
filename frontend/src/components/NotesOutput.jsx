import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Copy, Check, RotateCcw, BookOpen,
  ChevronUp, Hash, FileDown, ChevronDown, Brain, Layers, ArrowUpRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'
import QuizModal from './QuizModal'
import FlashcardModal from './FlashcardModal'
import TimestampPanel from './TimestampPanel'

function estimateReadTime(text) {
  const words = text.split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

function countSections(text) {
  return (text.match(/^#{1,3}\s/gm) || []).length
}

function markdownToDocxParagraphs(markdown) {
  const lines = markdown.split('\n')
  const paragraphs = []

  for (const line of lines) {
    if (!line.trim()) { paragraphs.push(new Paragraph({ text: '' })); continue }

    if (line.startsWith('# ')) {
      paragraphs.push(new Paragraph({
        text: line.replace(/^# /, ''), heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 150 }
      }))
    } else if (line.startsWith('## ')) {
      paragraphs.push(new Paragraph({
        text: line.replace(/^## /, ''), heading: HeadingLevel.HEADING_2,
        spacing: { before: 250, after: 100 }
      }))
    } else if (line.startsWith('### ')) {
      paragraphs.push(new Paragraph({
        text: line.replace(/^### /, ''), heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 80 }
      }))
    } else if (line.match(/^[-*+] /)) {
      const text = line.replace(/^[-*+] /, '').replace(/\*\*(.*?)\*\*/g, '$1')
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: '• ' + text, size: 24 })],
        indent: { left: 400 }, spacing: { before: 60, after: 60 }
      }))
    } else if (line.match(/^---+$/)) {
      paragraphs.push(new Paragraph({
        text: '─'.repeat(50), alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 }
      }))
    } else {
      const parts = line.split(/\*\*(.*?)\*\*/)
      const runs = parts.map((part, i) => new TextRun({ text: part, bold: i % 2 === 1, size: 24 }))
      paragraphs.push(new Paragraph({ children: runs, spacing: { before: 80, after: 80 } }))
    }
  }
  return paragraphs
}

export default function NotesOutput({ notes, onReset, language, videoUrl, transcriptTimestamps }) {
  const [copied, setCopied] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [exporting, setExporting] = useState(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [showFlashcards, setShowFlashcards] = useState(false)
  const [notesLang, setNotesLang] = useState('english')
  const [hinglishNotes, setHinglishNotes] = useState('')
  const [translating, setTranslating] = useState(false)
  const notesRef = useRef(null)
  const exportMenuRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400)
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) setExportMenuOpen(false)
    }
    window.addEventListener('scroll', handleScroll)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayedNotes)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLangToggle = async () => {
    // Switch back to English instantly
    if (notesLang === 'hinglish') {
      setNotesLang('english')
      return
    }
    // Already generated — just switch
    if (hinglishNotes) {
      setNotesLang('hinglish')
      return
    }
    // First time — call API
    setTranslating(true)
    try {
      const res = await api.post('/api/translate-notes', { notes })
      if (res.data.status === 'error') {
        toast.error(res.data.message || 'Translation failed')
        return
      }
      setHinglishNotes(res.data.notes)
      setNotesLang('hinglish')
      toast.success('Notes converted to Hinglish!')
    } catch {
      toast.error('Could not translate notes')
    } finally {
      setTranslating(false)
    }
  }

  const handleDownloadMd = () => {
    const blob = new Blob([notes], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `lecture-notes-${Date.now()}.md`; a.click()
    URL.revokeObjectURL(url)
    toast.success('Markdown saved')
    setExportMenuOpen(false)
  }

  const handleDownloadTxt = () => {
    const plain = notes
      .replace(/#{1,6}\s+/g, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/^[-*+]\s+/gm, '• ')
    const blob = new Blob([plain], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `lecture-notes-${Date.now()}.txt`; a.click()
    URL.revokeObjectURL(url)
    toast.success('Text file saved')
    setExportMenuOpen(false)
  }

  const handleDownloadPDF = async () => {
    setExporting('pdf')
    setExportMenuOpen(false)
    toast.loading('Building your PDF...', { id: 'pdf-toast' })
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 15
      const maxWidth = pageWidth - margin * 2
      let y = margin

      const safeAddText = (textLines, x, startY, lineHeight) => {
        let currentY = startY
        for (const line of textLines) {
          if (currentY + lineHeight > pageHeight - margin) { pdf.addPage(); currentY = margin }
          pdf.text(line, x, currentY)
          currentY += lineHeight
        }
        return currentY
      }

      pdf.setFontSize(20); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(110, 95, 212)
      pdf.text('Lecture Notes', margin, y); y += 9

      pdf.setFontSize(9); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(120, 120, 120)
      pdf.text(`Generated by NoteAI • ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, margin, y); y += 5

      pdf.setDrawColor(139, 127, 232); pdf.setLineWidth(0.5)
      pdf.line(margin, y, pageWidth - margin, y); y += 8

      const lines = notes.split('\n')
      for (const line of lines) {
        if (!line.trim()) { y += 3; if (y > pageHeight - margin) { pdf.addPage(); y = margin }; continue }

        if (line.startsWith('# ')) {
          y += 4; pdf.setFontSize(16); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(110, 95, 212)
          const wrapped = pdf.splitTextToSize(line.replace(/^# /, ''), maxWidth)
          y = safeAddText(wrapped, margin, y, 7); y += 2

        } else if (line.startsWith('## ')) {
          y += 3; pdf.setFontSize(13); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(14, 116, 144)
          const wrapped = pdf.splitTextToSize(line.replace(/^## /, ''), maxWidth)
          y = safeAddText(wrapped, margin, y, 6); y += 2

        } else if (line.startsWith('### ')) {
          y += 2; pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(21, 128, 61)
          const wrapped = pdf.splitTextToSize(line.replace(/^### /, ''), maxWidth)
          y = safeAddText(wrapped, margin, y, 5.5); y += 1

        } else if (line.match(/^[-*+] /)) {
          const text = line.replace(/^[-*+] /, '').replace(/\*\*(.*?)\*\*/g, '$1')
          pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(40, 40, 40)
          const wrapped = pdf.splitTextToSize(text, maxWidth - 8)
          const blockHeight = wrapped.length * 5
          if (y + blockHeight > pageHeight - margin) { pdf.addPage(); y = margin }
          pdf.text('-', margin + 2, y)
          y = safeAddText(wrapped, margin + 7, y, 5); y += 1

        } else if (line.match(/^\s{2,}[-*+] /)) {
          const text = line.replace(/^\s+[-*+] /, '').replace(/\*\*(.*?)\*\*/g, '$1')
          pdf.setFontSize(9.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(70, 70, 70)
          const wrapped = pdf.splitTextToSize(text, maxWidth - 16)
          const blockHeight = wrapped.length * 4.8
          if (y + blockHeight > pageHeight - margin) { pdf.addPage(); y = margin }
          pdf.text('>', margin + 10, y)
          y = safeAddText(wrapped, margin + 14, y, 4.8); y += 1

        } else if (line.match(/^---+$/)) {
          y += 3; if (y + 4 > pageHeight - margin) { pdf.addPage(); y = margin }
          pdf.setDrawColor(180, 180, 220); pdf.setLineWidth(0.3)
          pdf.line(margin, y, pageWidth - margin, y); y += 5

        } else {
          const text = line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
          pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(40, 40, 40)
          const wrapped = pdf.splitTextToSize(text, maxWidth)
          y = safeAddText(wrapped, margin, y, 5); y += 1
        }
      }

      const totalPages = pdf.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i); pdf.setFontSize(8); pdf.setTextColor(150, 150, 150)
        pdf.text(`NoteAI • Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' })
      }

      pdf.save(`lecture-notes-${Date.now()}.pdf`)
      toast.success('PDF saved', { id: 'pdf-toast' })
    } catch (err) {
      toast.error('Couldn\'t build the PDF — try again', { id: 'pdf-toast' })
      console.error(err)
    } finally {
      setExporting(null)
    }
  }

  const handleDownloadDocx = async () => {
    setExporting('docx')
    setExportMenuOpen(false)
    toast.loading('Building your document...', { id: 'docx-toast' })
    try {
      const paragraphs = markdownToDocxParagraphs(notes)
      const doc = new Document({
        styles: { default: { document: { run: { font: 'Calibri', size: 24 } } } },
        sections: [{
          properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Lecture Notes', bold: true, size: 48, color: '6E5FD4' })],
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [new TextRun({
                text: `Generated by NoteAI • ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`,
                size: 18, color: '888888'
              })],
              spacing: { after: 400 }
            }),
            ...paragraphs
          ]
        }]
      })
      const blob = await Packer.toBlob(doc)
      saveAs(blob, `lecture-notes-${Date.now()}.docx`)
      toast.success('Document saved', { id: 'docx-toast' })
    } catch (err) {
      toast.error('Couldn\'t build the document — try again', { id: 'docx-toast' })
      console.error(err)
    } finally {
      setExporting(null)
    }
  }

  const displayedNotes = notesLang === 'hinglish' ? hinglishNotes : notes
  const readTime = estimateReadTime(notes)
  const sections = countSections(notes)

  return (
    <div className="max-w-3xl mx-auto px-5 pb-20 reveal-1">
      {/* Toolbar */}
      <div className="surface rounded-2xl px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-3 relative z-20 overflow-visible">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <BookOpen size={13} className="text-violet-400" />
            <span className="text-2xs font-mono text-ink-700">
              <span className="text-ink-900 font-semibold">{readTime}</span> min
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Hash size={13} className="text-emerald-300" />
            <span className="text-2xs font-mono text-ink-700">
              <span className="text-ink-900 font-semibold">{sections}</span> sections
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Hinglish toggle */}
          <button
            onClick={handleLangToggle}
            disabled={translating}
            className={`btn-ghost ${notesLang === 'hinglish' ? '!text-amber-300 !border-amber-500/30 !bg-amber-500/10' : ''}`}
            title={notesLang === 'hinglish' ? 'Switch to English' : 'Convert to Hinglish'}
          >
            {translating
              ? <div className="w-3 h-3 border border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
              : <span style={{ fontSize: '11px' }}>🇮🇳</span>
            }
            <span className="hidden sm:inline">
              {translating ? 'Converting…' : notesLang === 'hinglish' ? 'Hinglish' : 'Hinglish'}
            </span>
          </button>

          <button onClick={() => setShowQuiz(true)} className="btn-ghost !text-violet-300 !border-violet-500/25 hover:!bg-violet-500/10">
            <Brain size={13} />
            <span className="hidden sm:inline">Quiz</span>
          </button>

          <button onClick={() => setShowFlashcards(true)} className="btn-ghost !text-emerald-300 !border-emerald-500/20 hover:!bg-emerald-500/10">
            <Layers size={13} />
            <span className="hidden sm:inline">Flashcards</span>
          </button>

          <button onClick={handleCopy} className="btn-ghost">
            {copied ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              disabled={!!exporting}
              className="btn-ghost !text-canvas-900 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #C4B8FF, #8B7FE8)', border: 'none' }}
            >
              {exporting ? <div className="w-3 h-3 border border-canvas-900/40 border-t-canvas-900 rounded-full animate-spin" /> : <FileDown size={13} />}
              <span>Export</span>
              <ChevronDown size={11} className={`transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {exportMenuOpen && (
<div className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden z-[999] reveal-1"
  style={{ background: '#1C1C21', border: '1px solid #2E2E35', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>                <div className="p-1.5">
                  {[
                    { label: 'Markdown', sub: '.md', action: handleDownloadMd },
                    { label: 'Plain text', sub: '.txt', action: handleDownloadTxt },
                    { label: 'PDF document', sub: '.pdf', action: handleDownloadPDF },
                    { label: 'Word document', sub: '.docx', action: handleDownloadDocx },
                  ].map(({ label, sub, action }) => (
                    <button key={label} onClick={action}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/6 text-ink-800 hover:text-ink-900 text-sm font-medium transition-all text-left">
                      <span>{label}</span>
                      <span className="text-2xs font-mono text-ink-600">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={onReset} className="btn-ghost">
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      <TimestampPanel videoUrl={videoUrl} transcriptWithTimestamps={transcriptTimestamps} />

      {/* Notes content */}
      <div ref={notesRef} className="surface-raised rounded-2xl p-6 sm:p-9 relative z-10">
        <div className="notes-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedNotes}</ReactMarkdown>
        </div>
      </div>

      <div className="mt-7 flex justify-center">
        <button onClick={onReset} className="btn-ghost">
          <ArrowUpRight size={14} />
          Start a new lecture
        </button>
      </div>

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 z-30"
          style={{ background: 'linear-gradient(155deg, #A594F9, #6E5FD4)', boxShadow: '0 8px 24px -6px rgba(139,127,232,0.5)' }}
        >
          <ChevronUp size={17} className="text-canvas-900" />
        </button>
      )}

      {showQuiz && <QuizModal notes={notes} language={language || 'english'} onClose={() => setShowQuiz(false)} />}
      {showFlashcards && <FlashcardModal notes={notes} language={language || 'english'} onClose={() => setShowFlashcards(false)} />}
    </div>
  )
}
