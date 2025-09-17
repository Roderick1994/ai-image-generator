'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Copy, Share2, Heart, Clock } from 'lucide-react';
import { GeneratedImage, DownloadOptions } from '@/types/image-generation';
import { toast } from 'sonner';

interface ImageDisplayProps {
  image: GeneratedImage;
  onView?: (image: GeneratedImage) => void;
  onDownload?: (image: GeneratedImage, options?: DownloadOptions) => void;
  onSave?: (image: GeneratedImage) => void;
  className?: string;
  showMetadata?: boolean;
}

export function ImageDisplay({ 
  image, 
  onView, 
  onDownload, 
  onSave, 
  className = '',
  showMetadata = true 
}: ImageDisplayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleDownload = async (format: 'png' | 'jpg' | 'webp' = 'png') => {
    if (!onDownload) return;
    
    setIsLoading(true);
    try {
      const options: DownloadOptions = {
        format,
        filename: `ai-generated-${image.id}.${format}`,
      };
      await onDownload(image, options);
      toast.success(`Image downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to download image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(image.prompt);
      toast.success('Prompt copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy prompt');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Generated Image',
          text: image.prompt,
          url: image.url,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(image.url);
        toast.success('Image URL copied to clipboard');
      } catch (error) {
        toast.error('Failed to share image');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatGenerationTime = (time?: number) => {
    if (!time) return 'Unknown';
    return `${time.toFixed(1)}s`;
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="relative">
        {/* Image */}
        <div className="aspect-square relative bg-gray-100">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse bg-gray-200 w-full h-full flex items-center justify-center">
                <div className="text-gray-400">Loading...</div>
              </div>
            </div>
          )}
          <Image
            src={image.url}
            alt={image.prompt}
            fill
            className={`object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageLoaded(true);
              toast.error('Failed to load image');
            }}
            unoptimized
          />
          
          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="flex gap-2">
              {onView && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onView(image)}
                  className="bg-white/90 hover:bg-white"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleDownload('png')}
                disabled={isLoading}
                className="bg-white/90 hover:bg-white"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleShare}
                className="bg-white/90 hover:bg-white"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showMetadata && (
        <CardContent className="p-4">
          {/* Prompt */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">Prompt</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyPrompt}
                  className="h-6 px-2"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm text-gray-600 line-clamp-3">{image.prompt}</p>
            </div>

            {/* Negative Prompt */}
            {image.negative_prompt && (
              <div>
                <h4 className="font-medium text-xs text-gray-500 mb-1">Negative Prompt</h4>
                <p className="text-xs text-gray-500 line-clamp-2">{image.negative_prompt}</p>
              </div>
            )}

            {/* Metadata Badges */}
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">
                {image.width}×{image.height}
              </Badge>
              {image.seed && (
                <Badge variant="outline" className="text-xs">
                  Seed: {image.seed}
                </Badge>
              )}
              {image.guidance_scale && (
                <Badge variant="outline" className="text-xs">
                  CFG: {image.guidance_scale}
                </Badge>
              )}
              {image.num_inference_steps && (
                <Badge variant="outline" className="text-xs">
                  Steps: {image.num_inference_steps}
                </Badge>
              )}
            </div>

            {/* Generation Info */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(image.created_at)}
              </div>
              {image.generation_time && (
                <div>
                  Generated in {formatGenerationTime(image.generation_time)}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload('png')}
                disabled={isLoading}
                className="flex-1"
              >
                <Download className="h-3 w-3 mr-1" />
                PNG
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload('jpg')}
                disabled={isLoading}
                className="flex-1"
              >
                <Download className="h-3 w-3 mr-1" />
                JPG
              </Button>
              {onSave && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSave(image)}
                  className="px-3"
                >
                  <Heart className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Skeleton loader for image display
export function ImageDisplaySkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square bg-gray-200 animate-pulse"></div>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-3 bg-gray-100 rounded animate-pulse mb-1"></div>
            <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3"></div>
          </div>
          <div className="flex gap-1">
            <div className="h-5 bg-gray-200 rounded animate-pulse w-16"></div>
            <div className="h-5 bg-gray-200 rounded animate-pulse w-12"></div>
            <div className="h-5 bg-gray-200 rounded animate-pulse w-14"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse flex-1"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse flex-1"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-10"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}