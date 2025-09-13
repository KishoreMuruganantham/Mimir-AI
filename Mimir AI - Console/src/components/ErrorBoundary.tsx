import React, { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import type { AppError } from '@/types'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'page' | 'component' | 'global'
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

/**
 * Global Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    this.setState({ errorInfo })
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to external service (Sentry, LogRocket, etc.)
    this.logError(error, errorInfo)
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorDetails: AppError = {
      code: 'REACT_ERROR_BOUNDARY',
      message: error.message,
      details: {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorBoundaryLevel: this.props.level || 'component'
      },
      timestamp: new Date().toISOString(),
      userMessage: 'An unexpected error occurred. Please try again.',
      retryable: true
    }

    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorDetails })
      console.error('Error Boundary:', errorDetails)
    } else {
      console.error('Error Boundary:', errorDetails)
    }

    // Save to localStorage for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('app_errors') || '[]')
      existingErrors.push(errorDetails)
      // Keep only last 10 errors
      const recentErrors = existingErrors.slice(-10)
      localStorage.setItem('app_errors', JSON.stringify(recentErrors))
    } catch (e) {
      console.warn('Could not save error to localStorage:', e)
    }
  }

  protected handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private handleReportError = () => {
    const { error, errorInfo, errorId } = this.state
    const errorReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }

    // Copy error details to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2)).then(() => {
      alert('Error details copied to clipboard. Please share this with the support team.')
    }).catch(() => {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = JSON.stringify(errorReport, null, 2)
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('Error details copied to clipboard. Please share this with the support team.')
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI based on error level
      const { level = 'component', showDetails = false } = this.props
      const { error, errorId } = this.state

      if (level === 'global') {
        return (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
                <CardTitle className="text-2xl">Application Error</CardTitle>
                <CardDescription>
                  Something went wrong with the application. We apologize for the inconvenience.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {errorId && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-medium">Error ID: {errorId}</p>
                    <p className="text-xs text-muted-foreground">
                      Please include this ID when reporting the issue
                    </p>
                  </div>
                )}

                {showDetails && error && (
                  <details className="bg-muted p-3 rounded-lg">
                    <summary className="cursor-pointer text-sm font-medium">
                      Technical Details
                    </summary>
                    <div className="mt-2 space-y-2">
                      <div>
                        <p className="text-xs font-medium">Error Message:</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {error.message}
                        </p>
                      </div>
                      {process.env.NODE_ENV === 'development' && (
                        <div>
                          <p className="text-xs font-medium">Stack Trace:</p>
                          <pre className="text-xs text-muted-foreground bg-background p-2 rounded overflow-auto max-h-32">
                            {error.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={this.handleRetry} className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={this.handleGoHome} className="flex-1">
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                  <Button variant="outline" onClick={this.handleReportError}>
                    <Bug className="w-4 h-4 mr-2" />
                    Report Error
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }

      if (level === 'page') {
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                  <div>
                    <CardTitle>Page Error</CardTitle>
                    <CardDescription>
                      This page encountered an error and couldn't load properly.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {errorId && (
                  <div className="mb-4 bg-muted p-3 rounded-lg">
                    <p className="text-sm">Error ID: <code>{errorId}</code></p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={this.handleRetry} size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                  <Button variant="outline" onClick={this.handleGoHome} size="sm">
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                  {showDetails && (
                    <Button variant="outline" onClick={this.handleReportError} size="sm">
                      <Bug className="w-4 h-4 mr-2" />
                      Report
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }

      // Component level error
      return (
        <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-destructive">Component Error</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This component failed to load. {error?.message}
              </p>
              {errorId && (
                <p className="text-xs text-muted-foreground mt-2">
                  Error ID: {errorId}
                </p>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={this.handleRetry}
                className="mt-3"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component that wraps a component with an error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<Props>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

/**
 * Hook for programmatically throwing errors that will be caught by error boundaries
 */
export function useErrorHandler() {
  return (error: Error) => {
    throw error
  }
}

/**
 * Specialized error boundary for async operations
 */
interface AsyncErrorBoundaryProps extends Props {
  onRetry?: () => Promise<void>
  retryText?: string
}

export class AsyncErrorBoundary extends ErrorBoundary {
  private handleAsyncRetry = async () => {
    const { onRetry } = this.props as AsyncErrorBoundaryProps
    
    if (onRetry) {
      try {
        await onRetry()
        this.handleRetry()
      } catch (error) {
        console.error('Retry failed:', error)
        // Error will be caught by this error boundary again
        throw error
      }
    } else {
      this.handleRetry()
    }
  }

  render() {
    if (this.state.hasError) {
      const { retryText = 'Retry' } = this.props as AsyncErrorBoundaryProps
      
      // Override the retry button behavior for async operations
      return (
        <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-destructive">Operation Failed</h3>
              <p className="text-sm text-muted-foreground mt-1">
                An error occurred during the operation. {this.state.error?.message}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={this.handleAsyncRetry}
                className="mt-3"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                {retryText}
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
