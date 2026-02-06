import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

const lang = navigator.language.startsWith('ru') ? 'ru' : 'en';
// Ensure fallback for translations
const t = TRANSLATIONS[lang]?.error_boundary || { title: "Error", message: "Module failed.", reload_button: "Reload UI" };

export class ErrorBoundary extends Component<Props, State> {
  // Explicitly declare state property for TypeScript
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-950 p-8">
            <div className="w-full max-w-lg text-center glass-panel p-8 rounded-2xl border border-red-500/30">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6 animate-pulse" />
                <h1 className="text-2xl font-bold text-white mb-4">{t.title}</h1>
                <p className="text-slate-400 mb-8">{t.message}</p>
                <button 
                    onClick={this.handleReload}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg transition-all mx-auto"
                >
                    <RefreshCw className="w-4 h-4" />
                    {t.reload_button}
                </button>
            </div>
        </div>
      );
    }

    // Fix: Access props via explicit cast to avoid TS error about missing 'props' property
    return (this as any).props.children;
  }
}