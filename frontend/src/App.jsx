import React, { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useStore } from './store/useStore'
import Navbar from './components/Navbar'
import ErrorBoundary from './components/ErrorBoundary'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './services/firebase'
import GlobalVoiceAssistant from './components/GlobalVoiceAssistant'

// Pages
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import Profile from './pages/Profile'
import SymptomChecker from './pages/SymptomChecker'
import History from './pages/History'
import Interactions from './pages/Interactions'

// Check Flow
import SearchMedicine from './pages/check/SearchMedicine'
import ScanStrip from './pages/check/ScanStrip'
import VoiceInput from './pages/check/VoiceInput'
import Analyzing from './pages/check/Analyzing'
import ResultPage from './pages/check/ResultPage'

const PAGES = {
  home:         Home,
  dashboard:    Dashboard,
  auth:         Auth,
  onboarding:   Onboarding,
  profile:      Profile,
  symptoms:     SymptomChecker,
  history:      History,
  interactions:  Interactions,
  search:       SearchMedicine,
  scan:         ScanStrip,
  voice:        VoiceInput,
  analyzing:    Analyzing,
  result:       ResultPage,
}

// Pages that should NOT show the navbar
const NAVBAR_HIDDEN_PAGES = []

export default function App() {
  const { activePage, setActivePage, setUser, setAuthLoading } = useStore()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setAuthLoading(false)
    })
    return () => unsub()
  }, [setUser, setAuthLoading])

  const Page = PAGES[activePage] || Home
  const showNavbar = !NAVBAR_HIDDEN_PAGES.includes(activePage)

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-medical">
        {showNavbar && <Navbar />}

        <main className={showNavbar ? 'with-nav' : ''}>
          <Page />
        </main>

        <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#fff',
            color: '#0f172a',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            boxShadow: '0 10px 20px -4px rgba(0,0,0,0.12)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            padding: '10px 16px',
          },
          success: {
            iconTheme: { primary: '#16a34a', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#fff' },
          },
          duration: 3000,
        }}
      />
      <GlobalVoiceAssistant />
      </div>
    </ErrorBoundary>
  )
}
