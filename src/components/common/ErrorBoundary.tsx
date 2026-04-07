/**
 * ErrorBoundary.tsx — React Error Boundary for ePRIME-RHU
 *
 * Catches unhandled rendering errors in child components and shows a
 * friendly fallback UI instead of a blank white screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeComponent />
 *   </ErrorBoundary>
 *
 *   // With a custom fallback:
 *   <ErrorBoundary fallback={<p>Something went wrong.</p>}>
 *     <SomeComponent />
 *   </ErrorBoundary>
 */

import React, { Component } from "react";
import { logger } from "@/utils/logger";
import { AlertTriangle, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  children: React.ReactNode;
  /** Override the default fallback UI */
  fallback?: React.ReactNode;
  /** Identifier shown in error logs (e.g. "PatientsPage") */
  name?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || "An unexpected rendering error occurred.",
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const context = `ErrorBoundary${this.props.name ? `.${this.props.name}` : ""}`;
    logger.error(context, error, {
      componentStack: info.componentStack ?? undefined,
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    // Use custom fallback if provided
    if (this.props.fallback) return this.props.fallback;

    // Default fallback UI
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertTriangle size={28} className="text-red-700" />
        </div>
        <h2 className="text-lg font-bold text-red-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-500 max-w-xs mb-6">
          {this.state.errorMessage}
        </p>
        <button
          onClick={this.handleReset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900 text-white text-sm font-semibold hover:bg-red-800 transition-colors"
        >
          <RefreshCw size={15} />
          Try Again
        </button>
        <p className="text-[11px] text-gray-400 mt-4">
          If this keeps happening, please contact your system administrator.
        </p>
      </div>
    );
  }
}

export default ErrorBoundary;
