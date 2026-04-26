import React from 'react'
import { AlertOctagon, RefreshCw, Home } from 'lucide-react'

/**
 * AI Health Guardian — Error Boundary
 * Catches any unhandled React render errors and shows a friendly fallback.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    this.setState({ errorInfo: info })
    // In production, log to error tracking service here
    console.error('[ErrorBoundary] Caught error:', error, info)
  }

  reset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    // Navigate back to home
    try {
      const { useStore } = require('../store/useStore')
      useStore.getState().setActivePage('dashboard')
    } catch (_) {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 max-w-sm w-full text-center">
            {/* Icon */}
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertOctagon className="w-8 h-8 text-red-500" />
            </div>

            {/* Title */}
            <h1 className="text-xl font-black text-slate-900 mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              The app encountered an unexpected error. This is not your fault.
              Please try refreshing or going back home.
            </p>

            {/* Error detail (dev only) */}
            {import.meta.env?.DEV && this.state.error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl text-left">
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">Error Detail</p>
                <code className="text-[11px] text-red-700 font-mono break-all leading-relaxed">
                  {this.state.error.message}
                </code>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={this.reset}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Back Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </button>
            </div>

            {/* Disclaimer */}
            <p className="text-slate-400 text-[10px] mt-5">
              If this keeps happening, please clear your browser cache and try again.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
