import { Component } from 'react'
import type { ReactNode } from 'react'

interface State { err: boolean }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { err: false }

  static getDerivedStateFromError(): State {
    return { err: true }
  }

  componentDidCatch(error: unknown) {
    // In production this would go to the observability pipeline (MRB-19).
    console.error('App error:', error)
  }

  render() {
    if (!this.state.err) return this.props.children
    return (
      <div className="crash">
        <div className="crash-card">
          <div className="crash-logo">🎩</div>
          <h2>Something went wrong</h2>
          <p>We hit a snag loading the page. Try reloading. If it keeps happening, reset your local data.</p>
          <div className="crash-btns">
            <button className="btn orange" onClick={() => window.location.reload()}>Reload</button>
            <button className="btn sec" onClick={() => { try { localStorage.removeItem('mrben.v1') } catch { /* ignore */ } window.location.reload() }}>Reset data</button>
          </div>
        </div>
      </div>
    )
  }
}
