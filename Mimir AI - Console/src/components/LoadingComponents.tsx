import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  className?: string
  text?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  className = '',
  text 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  }

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  )
}

interface SkeletonProps {
  className?: string
  lines?: number
  width?: string
  height?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '',
  lines = 1,
  width = '100%',
  height = '1rem'
}) => {
  if (lines === 1) {
    return (
      <div 
        className={`animate-pulse bg-muted rounded ${className}`}
        style={{ width, height }}
      />
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse bg-muted rounded"
          style={{ 
            width: index === lines - 1 ? '75%' : width, 
            height 
          }}
        />
      ))}
    </div>
  )
}

interface LoadingCardProps {
  title?: string
  description?: string
  lines?: number
  className?: string
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  lines = 3,
  className = ''
}) => {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton width="60%" height="1.25rem" />
            <Skeleton width="80%" height="0.875rem" />
          </div>
          <Skeleton lines={lines} height="0.875rem" />
        </div>
      </CardContent>
    </Card>
  )
}

interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  text?: string
  className?: string
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  text = 'Loading...',
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
          <LoadingSpinner text={text} />
        </div>
      )}
    </div>
  )
}

interface LoadingButtonProps {
  isLoading: boolean
  children: React.ReactNode
  loadingText?: string
  disabled?: boolean
  onClick?: () => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  children,
  loadingText = 'Loading...',
  disabled,
  onClick,
  variant = 'default',
  size = 'default',
  className = ''
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      disabled={isLoading || disabled}
      onClick={onClick}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}

interface DataLoadingStateProps {
  isLoading: boolean
  error?: Error | null
  isEmpty?: boolean
  emptyMessage?: string
  errorMessage?: string
  onRetry?: () => void
  children: React.ReactNode
  className?: string
}

export const DataLoadingState: React.FC<DataLoadingStateProps> = ({
  isLoading,
  error,
  isEmpty = false,
  emptyMessage = 'No data available',
  errorMessage = 'An error occurred while loading data',
  onRetry,
  children,
  className = ''
}) => {
  if (isLoading) {
    return (
      <div className={`p-8 ${className}`}>
        <LoadingSpinner size="large" text="Loading data..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error</h3>
        <p className="text-muted-foreground mb-4">
          {errorMessage}
        </p>
        {error.message && (
          <p className="text-sm text-muted-foreground mb-4 font-mono">
            {error.message}
          </p>
        )}
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="text-muted-foreground">
          {emptyMessage}
        </div>
      </div>
    )
  }

  return <>{children}</>
}

interface ProgressBarProps {
  progress: number
  className?: string
  showPercentage?: boolean
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = '',
  showPercentage = false
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-secondary rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-sm text-muted-foreground mt-1 text-center">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  )
}

export default {
  LoadingSpinner,
  Skeleton,
  LoadingCard,
  LoadingOverlay,
  LoadingButton,
  DataLoadingState,
  ProgressBar
}
