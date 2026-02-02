"use client";

import { Component, ReactNode } from "react";
import Link from "next/link";
import { reportError } from "@/lib/error-reporting";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    reportError(error, { componentStack: errorInfo?.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-ink flex items-center justify-center px-6 relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-red-500/5 blur-[120px] rounded-full"></div>
              <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-primary/5 blur-[120px] rounded-full"></div>
            </div>

            <div className="text-center relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <svg
                  className="w-10 h-10 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-paper mb-3 tracking-tight">
                Something went wrong
              </h1>
              <p className="text-secondary text-base mb-8 max-w-sm mx-auto leading-relaxed">
                An unexpected error occurred. We&apos;ve been notified and are
                looking into it.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: undefined });
                    window.location.reload();
                  }}
                  className="px-8 py-3 bg-primary text-white font-bold rounded-full hover:bg-primaryDark transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                >
                  Reload page
                </button>
                <Link
                  href="/"
                  className="px-8 py-3 text-secondary hover:text-paper transition-colors font-medium"
                >
                  Back to home
                </Link>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
