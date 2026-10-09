import { Component, type ReactNode } from 'react';

interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center gap-4">
          <p className="text-red-400 text-sm font-semibold">Something went wrong</p>
          <p className="text-gray-500 text-xs max-w-xs break-words">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
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
