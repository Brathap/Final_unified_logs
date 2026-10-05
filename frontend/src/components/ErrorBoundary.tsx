import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-xl w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-8 space-y-6">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Application Error Recovered</h1>
                <p className="text-xs text-slate-500 font-mono">ULPF Runtime Incident Isolation</p>
              </div>
            </div>

            <div className="p-4 bg-slate-100 rounded-xl text-xs font-mono text-slate-800 overflow-x-auto border border-slate-200">
              <div className="font-bold text-rose-600 mb-1">
                {this.state.error?.name}: {this.state.error?.message}
              </div>
              <pre className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                {this.state.error?.stack}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
              <span className="text-xs text-slate-400 font-mono">NTRO SIH26156 SOC UI</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
