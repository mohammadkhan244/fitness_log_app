import { Component, type ReactNode } from 'react';

interface State { hasError: boolean; error?: Error; componentStack?: string }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, info: { componentStack: string }) {
    this.setState({ componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center gap-4">
          <p className="text-red-400 text-sm font-semibold">Something went wrong</p>
          <p className="text-gray-500 text-xs max-w-xs break-words">{this.state.error?.message}</p>
          {this.state.componentStack && (
            <pre className="text-gray-600 text-[10px] max-w-xs max-h-32 overflow-auto text-left bg-gray-900 rounded-lg p-2 whitespace-pre-wrap break-words">
              {this.state.componentStack.trim()}
            </pre>
          )}
          <button
            onClick={() => this.setState({ hasError: false, componentStack: undefined })}
            className="px-5 h-10 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm rounded-xl transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
