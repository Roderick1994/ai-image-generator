'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Image as ImageIcon, Clock, Zap } from 'lucide-react';
import { GenerationProgress } from '@/types/image-generation';

interface LoadingIndicatorProps {
  progress: GenerationProgress;
  className?: string;
}

export function LoadingIndicator({ progress, className = '' }: LoadingIndicatorProps) {
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'starting':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <ImageIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <Zap className="h-5 w-5 text-red-500" />;
      default:
        return <Loader2 className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusMessage = () => {
    if (progress.message) {
      return progress.message;
    }

    switch (progress.status) {
      case 'starting':
        return 'Initializing image generation...';
      case 'processing':
        return 'Generating your image...';
      case 'completed':
        return 'Image generation completed!';
      case 'error':
        return 'An error occurred during generation';
      default:
        return 'Preparing...';
    }
  };

  const getProgressValue = () => {
    if (progress.progress !== undefined) {
      return progress.progress;
    }

    switch (progress.status) {
      case 'starting':
        return 10;
      case 'processing':
        return 50;
      case 'completed':
        return 100;
      case 'error':
        return 0;
      default:
        return 0;
    }
  };

  if (progress.status === 'idle') {
    return null;
  }

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Status Header */}
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div className="flex-1">
              <h3 className="font-medium text-sm">{getStatusMessage()}</h3>
              {progress.status === 'processing' && (
                <p className="text-xs text-muted-foreground mt-1">
                  This may take 30-60 seconds...
                </p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {progress.status !== 'error' && (
            <div className="space-y-2">
              <Progress 
                value={getProgressValue()} 
                className="w-full h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(getProgressValue())}%</span>
                {progress.status === 'processing' && (
                  <span>Estimated time: 45s</span>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {progress.status === 'error' && progress.message && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{progress.message}</p>
            </div>
          )}

          {/* Logs */}
          {progress.logs && progress.logs.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Generation Logs
              </h4>
              <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-md p-3">
                {progress.logs.map((log, index) => (
                  <div key={index} className="text-xs font-mono text-gray-600 mb-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Animation for processing state */}
          {progress.status === 'processing' && (
            <div className="flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton loader for when no progress data is available
export function LoadingSkeleton() {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex justify-between">
              <div className="h-3 bg-gray-100 rounded animate-pulse w-8"></div>
              <div className="h-3 bg-gray-100 rounded animate-pulse w-20"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}