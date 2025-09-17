'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  Copy,
  Share2,
  X,
  Calendar,
  Clock,
  Settings,
  Palette,
  Zap,
  Hash,
} from 'lucide-react';
import { GeneratedImage, DownloadOptions } from '@/types/image-generation';
import { toast } from 'sonner';

interface ImageModalProps {
  image: GeneratedImage | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (image: GeneratedImage, options?: DownloadOptions) => void;
  onDelete?: (imageId: string) => void;
}

export function ImageModal({ 
  image, 
  isOpen, 
  onClose, 
  onDownload,
  onDelete 
}: ImageModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (isOpen && image) {
      setImageLoaded(false);
    }
  }, [isOpen, image]);

  if (!image) return null;

  const handleDownload = async (format: 'png' | 'jpg' | 'webp' = 'png') => {
    if (!onDownload) return;
    
    setIsLoading(true);
    try {
      const options: DownloadOptions = {
        format,
        filename: `ai-generated-${image.id}-full.${format}`,
      };
      await onDownload(image, options);
      toast.success(`Full resolution image downloaded as ${format.toUpperCase()}`);
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

  const handleCopySettings = async () => {
    const settings = {
      prompt: image.prompt,
      negative_prompt: image.negative_prompt,
      width: image.width,
      height: image.height,
      guidance_scale: image.guidance_scale,
      num_inference_steps: image.num_inference_steps,
      scheduler: image.scheduler,
      seed: image.seed,
    };
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
      toast.success('Generation settings copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy settings');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Generated Image',
          text: `Check out this AI-generated image: "${image.prompt}"`,
          url: image.url,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      try {
        await navigator.clipboard.writeText(image.url);
        toast.success('Image URL copied to clipboard');
      } catch (error) {
        toast.error('Failed to share image');
      }
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this image?')) {
      onDelete(image.id);
      onClose();
      toast.success('Image deleted');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatGenerationTime = (time?: number) => {
    if (!time) return 'Unknown';
    return `${time.toFixed(1)} seconds`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
          {/* Image Section */}
          <div className="lg:col-span-2 relative bg-black">
            <div className="relative h-full min-h-[400px] lg:min-h-[600px]">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="animate-pulse text-white">Loading full resolution...</div>
                </div>
              )}
              <Image
                src={image.url}
                alt={image.prompt}
                fill
                className={`object-contain transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageLoaded(true);
                  toast.error('Failed to load full resolution image');
                }}
                unoptimized
              />
              
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Details Section */}
          <div className="bg-white border-l">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-lg">Image Details</DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="h-[calc(90vh-80px)] px-6">
              <div className="space-y-6 pb-6">
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleDownload('png')}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PNG
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload('jpg')}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download JPG
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleShare}
                    className="w-full"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleDelete}
                      className="w-full"
                    >
                      Delete
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Prompt Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Prompt
                    </h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyPrompt}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {image.prompt}
                  </p>
                </div>

                {/* Negative Prompt */}
                {image.negative_prompt && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-600">Negative Prompt</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {image.negative_prompt}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Generation Settings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Generation Settings
                    </h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopySettings}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Dimensions</label>
                      <Badge variant="secondary" className="w-full justify-center">
                        {image.width} × {image.height}
                      </Badge>
                    </div>
                    
                    {image.seed && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Seed</label>
                        <Badge variant="outline" className="w-full justify-center">
                          <Hash className="h-3 w-3 mr-1" />
                          {image.seed}
                        </Badge>
                      </div>
                    )}
                    
                    {image.guidance_scale && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Guidance Scale</label>
                        <Badge variant="outline" className="w-full justify-center">
                          {image.guidance_scale}
                        </Badge>
                      </div>
                    )}
                    
                    {image.num_inference_steps && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Steps</label>
                        <Badge variant="outline" className="w-full justify-center">
                          {image.num_inference_steps}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {image.scheduler && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Scheduler</label>
                      <Badge variant="outline" className="w-full justify-center">
                        {image.scheduler}
                      </Badge>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Metadata */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Metadata
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{formatDate(image.created_at)}</span>
                    </div>
                    
                    {image.generation_time && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Generation Time:</span>
                        <span className="font-medium">{formatGenerationTime(image.generation_time)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Model:</span>
                      <span className="font-medium">{image.model_version}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}