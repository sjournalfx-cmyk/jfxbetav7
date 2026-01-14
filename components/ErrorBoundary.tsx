import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  isDarkMode: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { isDarkMode } = this.props;
      const { error } = this.state;

      return (
        <div className={`min-h-screen w-full flex items-center justify-center p-6 ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-900'}`}>
          <div className={`max-w-md w-full p-8 rounded-3xl border text-center ${isDarkMode ? 'bg-[#09090b] border-zinc-800 shadow-2xl shadow-black' : 'bg-white border-slate-200 shadow-xl'}`}>
            <div className={`w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center ${isDarkMode ? 'bg-rose-500/10 text-rose-500' : 'bg-rose-50 text-rose-600'}`}>
              <AlertTriangle size={40} />
            </div>
            
            <h1 className="text-2xl font-black tracking-tight mb-2">Something went wrong</h1>
            <p className={`text-sm mb-8 leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
              An unexpected error occurred. This has been logged and we'll look into it.
              {error && (
                <code className="block mt-4 p-3 rounded-lg bg-black/20 text-xs font-mono text-left overflow-x-auto">
                  {error.message}
                </code>
              )}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#FF4F01] hover:bg-[#FF4F01]/90 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-[#FF4F01]/20"
              >
                <RefreshCw size={18} /> Reload Application
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all border ${
                  isDarkMode 
                    ? 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700' 
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Home size={18} /> Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
