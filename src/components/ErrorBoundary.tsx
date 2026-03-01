import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: '#0f172a',
            color: 'white',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f87171', marginBottom: 16 }}>
            Something went wrong
          </h1>
          <pre
            style={{
              backgroundColor: '#1e293b',
              padding: 16,
              borderRadius: 8,
              overflow: 'auto',
              fontSize: 14,
              textAlign: 'left',
              maxWidth: '100%',
            }}
          >
            {this.state.error.toString()}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
