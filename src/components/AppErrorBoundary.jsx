import { Component } from 'react'

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-svh items-center justify-center bg-slate-50 p-6">
          <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-slate-900">
              Erro ao carregar o aplicativo
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {this.state.error instanceof Error
                ? this.state.error.message
                : 'Falha inesperada.'}
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
