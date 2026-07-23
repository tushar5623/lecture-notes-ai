import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { MotionConfig } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import Header from './components/Header'
import URLInput from './components/URLInput'
import LoadingState from './components/LoadingState'
import NotesOutput from './components/NotesOutput'
import ErrorState from './components/ErrorState'
import Features from './components/Features'
import UsageBanner from './components/UsageBanner'

const STATE = { IDLE: 'idle', LOADING: 'loading', SUCCESS: 'success', ERROR: 'error' }
const API_KEY_STORAGE = 'notio_gemini_api_key'

export default function App() {
  const [appState, setAppState] = useState(STATE.IDLE)
  const [notes, setNotes] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [darkMode, setDarkMode] = useState(true)
  const [language, setLanguage] = useState('english')
  const [videoUrl, setVideoUrl] = useState('')
  const [transcriptTimestamps, setTranscriptTimestamps] = useState([])
  const [apiKey, setApiKey] = useState('')
  const [keyPanelOpen, setKeyPanelOpen] = useState(false)

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    if (darkMode) { html.classList.add('dark'); body.classList.remove('light') }
    else { html.classList.remove('dark'); body.classList.add('light') }
  }, [darkMode])

  // Restore a remembered key on load
  useEffect(() => {
    const stored = localStorage.getItem(API_KEY_STORAGE)
    if (stored) setApiKey(stored)
  }, [])

  const handleSaveKey = (key, remember) => {
    setApiKey(key)
    if (remember) localStorage.setItem(API_KEY_STORAGE, key)
    else localStorage.removeItem(API_KEY_STORAGE)
  }

  const handleRemoveKey = () => {
    setApiKey('')
    localStorage.removeItem(API_KEY_STORAGE)
  }

  const handleSubmit = async (url) => {
    setAppState(STATE.LOADING)
    setNotes(''); setErrorMsg(''); setVideoUrl(url); setTranscriptTimestamps([])

    try {
      const payload = { url, ...(apiKey && { api_key: apiKey }) }
      const response = await api.post('/api/generate-notes', payload, { timeout: 600000, headers: { 'Content-Type': 'application/json' } })
      const data = response.data

      if (data.status === 'error' || data.error) {
        setErrorMsg(data.message || data.error || 'Unknown error from server')
        setAppState(STATE.ERROR)
        return
      }

      const notesText = data.notes || data.data?.notes
      if (notesText) {
        setNotes(notesText)
        if (data.transcript_timestamps) setTranscriptTimestamps(data.transcript_timestamps)
        setAppState(STATE.SUCCESS)
      } else {
        setErrorMsg('Server returned an empty response')
        setAppState(STATE.ERROR)
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED') setErrorMsg('Request timed out. The video may be too long.')
      else if (err.response) setErrorMsg(err.response.data?.message || err.response.data?.error || `Server error ${err.response.status}`)
      else setErrorMsg('Could not connect to backend. Make sure FastAPI is running on port 8000.')
      setAppState(STATE.ERROR)
    }
  }

  const handleReset = () => {
    setAppState(STATE.IDLE); setNotes(''); setErrorMsg(''); setVideoUrl(''); setTranscriptTimestamps([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <MotionConfig reducedMotion="user">
    <div style={{ minHeight: '100vh' }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1C1C21', color: '#E4E4E7', border: '1px solid #27272A', fontSize: '13px', borderRadius: '10px' },
          success: { iconTheme: { primary: '#34D399', secondary: '#1C1C21' } },
          error: { iconTheme: { primary: '#FB7185', secondary: '#1C1C21' } },
        }}
      />

      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        language={language}
        setLanguage={setLanguage}
        apiKey={apiKey}
        onSaveKey={handleSaveKey}
        onRemoveKey={handleRemoveKey}
        panelOpen={keyPanelOpen}
        setPanelOpen={setKeyPanelOpen}
      />

      <UsageBanner hasApiKey={Boolean(apiKey)} onAddKey={() => setKeyPanelOpen(true)} />

      <main>
        {appState === STATE.IDLE && (<><URLInput onSubmit={handleSubmit} isLoading={false} /><Features /></>)}
        {appState === STATE.LOADING && (<><URLInput onSubmit={handleSubmit} isLoading={true} /><LoadingState /></>)}
        {appState === STATE.SUCCESS && (
          <div style={{ paddingTop: '2rem' }}>
            <NotesOutput notes={notes} onReset={handleReset} language={language} videoUrl={videoUrl} transcriptTimestamps={transcriptTimestamps} />
          </div>
        )}
        {appState === STATE.ERROR && (<><URLInput onSubmit={handleSubmit} isLoading={false} /><ErrorState message={errorMsg} onReset={handleReset} /></>)}
      </main>

      <footer style={{ borderTop: '1px solid #1C1C21', padding: '2rem 1.5rem', marginTop: '1rem' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#27272A', fontSize: '0.75rem' }}>
            Notio — built for students who'd rather learn than transcribe
          </p>
        </div>
      </footer>
    </div>
    </MotionConfig>
  )
}
