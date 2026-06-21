import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { errorHandler, AppError } from '@/lib/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: AppError | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = errorHandler.handle(error, 'ErrorBoundary');
    this.setState({ error: appError });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-6">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Algo salió mal
            </h1>
            
            <p className="text-gray-600 mb-2">
              {this.state.error?.userMessage || 'Ocurrió un error inesperado.'}
            </p>
            
            {import.meta.env.DEV && this.state.error?.message && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Detalles técnicos
                </summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto">
                  {this.state.error.message}
                  {this.state.error.details && (
                    <>{'\n'}{JSON.stringify(this.state.error.details, null, 2)}</>
                  )}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                <RefreshCw className="w-4 h-4" />
                Intentar nuevamente
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition"
              >
                <Home className="w-4 h-4" />
                Ir al inicio
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;