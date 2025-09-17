'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Shuffle, Wand2, Loader2 } from 'lucide-react';
import {
  ImageGenerationFormData,
  ImageGenerationRequest,
  FormValidationErrors,
  DEFAULT_FORM_VALUES,
  IMAGE_RESOLUTIONS,
  SCHEDULERS,
  DOUBAO_MODELS,
  DOUBAO_SIZES,
  STYLE_OPTIONS,
} from '@/types/image-generation';

interface ImageGenerationFormProps {
  onSubmit: (data: ImageGenerationRequest) => void;
  isGenerating: boolean;
}

export function ImageGenerationForm({ onSubmit, isGenerating }: ImageGenerationFormProps) {
  const [formData, setFormData] = useState<ImageGenerationFormData>(DEFAULT_FORM_VALUES);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<FormValidationErrors>({});
  const [isAnySelectOpen, setIsAnySelectOpen] = useState(false);

  // Handle backdrop click to close selects
  const handleBackdropClick = () => {
    setIsAnySelectOpen(false);
  };

  // Function to check if any select is open
  const checkSelectStates = useCallback(() => {
    // Check for Radix UI Select content with open state
    const openSelectContents = document.querySelectorAll('[data-radix-select-content][data-state="open"], [data-state="open"][role="listbox"]');
    // Also check for select triggers with open state
    const openSelectTriggers = document.querySelectorAll('[data-radix-select-trigger][data-state="open"], [data-state="open"][role="combobox"]');
    // Check for any element with data-state="open" that might be a select component
    const anyOpenSelects = document.querySelectorAll('[data-state="open"]');
    
    const isOpen = openSelectContents.length > 0 || openSelectTriggers.length > 0 || 
                   Array.from(anyOpenSelects).some(el => 
                     el.getAttribute('role') === 'listbox' || 
                     el.getAttribute('role') === 'combobox' ||
                     el.hasAttribute('data-radix-select-content') ||
                     el.hasAttribute('data-radix-select-trigger')
                   );
    
    // Simplified debug logging
    if (isOpen !== isAnySelectOpen) {
      console.log('🔍 Select state changed:', { 
        from: isAnySelectOpen, 
        to: isOpen, 
        openElements: anyOpenSelects.length 
      });
    }
    
    setIsAnySelectOpen(isOpen);
  }, [isAnySelectOpen]);

  // Monitor DOM changes and events to detect select state changes
  useEffect(() => {
    // Use both MutationObserver and event listeners for better detection
    const observer = new MutationObserver(() => {
      setTimeout(checkSelectStates, 0);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state']
    });

    // Also listen for click events on select triggers
    const handleClick = () => {
      setTimeout(checkSelectStates, 0);
    };

    // Listen for keyboard events that might open/close selects
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === 'Space') {
        setTimeout(checkSelectStates, 0);
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    // Initial check
    checkSelectStates();

    return () => {
      observer.disconnect();
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [checkSelectStates]);

  const handleInputChange = (field: keyof ImageGenerationFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleResolutionChange = (resolution: string) => {
    const selected = IMAGE_RESOLUTIONS.find(r => `${r.width}x${r.height}` === resolution);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        size: resolution,
        width: selected.width,
        height: selected.height,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormValidationErrors = {};

    if (!formData.prompt.trim()) {
      newErrors.prompt = 'Prompt is required';
    } else if (formData.prompt.length > 1000) {
      newErrors.prompt = 'Prompt must be less than 1000 characters';
    }

    if (formData.negative_prompt && formData.negative_prompt.length > 1000) {
      newErrors.negative_prompt = 'Negative prompt must be less than 1000 characters';
    }

    // Model validation removed - endpoint ID is configured server-side

    if (formData.width < 256 || formData.width > 2048) {
      newErrors.width = 'Width must be between 256 and 2048';
    }

    if (formData.height < 256 || formData.height > 2048) {
      newErrors.height = 'Height must be between 256 and 2048';
    }

    if (formData.num_inference_steps < 1 || formData.num_inference_steps > 100) {
      newErrors.num_inference_steps = 'Steps must be between 1 and 100';
    }

    if (formData.guidance_scale < 1 || formData.guidance_scale > 20) {
      newErrors.guidance_scale = 'Guidance scale must be between 1 and 20';
    }

    if (formData.seed && (isNaN(Number(formData.seed)) || Number(formData.seed) < 0)) {
      newErrors.seed = 'Seed must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const requestData: ImageGenerationRequest = {
      prompt: formData.prompt,
      model: formData.model,
      size: formData.size,
      seed: formData.seed ? Number(formData.seed) : undefined,
      sequential_image_generation: formData.sequential_image_generation,
      n: formData.n,
      quality: formData.quality,
      style: formData.style,
      // Legacy Replicate parameters for backward compatibility
      negative_prompt: formData.negative_prompt || undefined,
      width: formData.width,
      height: formData.height,
      num_inference_steps: formData.num_inference_steps,
      guidance_scale: formData.guidance_scale,
      scheduler: formData.scheduler,
    };

    onSubmit(requestData);
  };

  const generateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 1000000);
    handleInputChange('seed', randomSeed.toString());
  };

  return (
    <>
      {/* Background overlay when any select is open */}
      {isAnySelectOpen && (
        <div 
          className="fixed inset-0 z-[2147483647] bg-black/20 backdrop-blur-sm transition-all duration-200"
          onClick={handleBackdropClick}
          style={{ zIndex: 2147483647 }}
        />
      )}
      
      <Card className="w-full max-w-2xl mx-auto relative z-[2147483648]" style={{ zIndex: 2147483648 }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI Image Generation
          </CardTitle>
        </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt *</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the image you want to generate..."
              value={formData.prompt}
              onChange={(e) => handleInputChange('prompt', e.target.value)}
              className={errors.prompt ? 'border-red-500' : ''}
              rows={3}
            />
            {errors.prompt && (
              <p className="text-sm text-red-500">{errors.prompt}</p>
            )}
          </div>

          {/* Negative Prompt */}
          <div className="space-y-2">
            <Label htmlFor="negative_prompt">Negative Prompt</Label>
            <Textarea
              id="negative_prompt"
              placeholder="What you don&apos;t want in the image..."
              value={formData.negative_prompt}
              onChange={(e) => handleInputChange('negative_prompt', e.target.value)}
              className={errors.negative_prompt ? 'border-red-500' : ''}
              rows={2}
            />
            {errors.negative_prompt && (
              <p className="text-sm text-red-500">{errors.negative_prompt}</p>
            )}
          </div>

          {/* API Configuration Info - Hidden for better UX */}

          {/* Resolution */}
          <div className="space-y-2 mb-6">
            <Label>Resolution</Label>
            <Select
              value={formData.size}
              onValueChange={(value) => handleInputChange('size', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOUBAO_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quality */}
          <div className="space-y-2 mb-6">
            <Label>Quality</Label>
            <Select
              value={formData.quality}
              onValueChange={(value) => handleInputChange('quality', value as 'standard' | 'hd')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="hd">HD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Style */}
          <div className="space-y-2 mb-6">
            <Label>Style</Label>
            <Select
              value={formData.style}
              onValueChange={(value) => handleInputChange('style', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Options */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                Advanced Options
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              {/* Number of Images */}
              <div className="space-y-2">
                <Label htmlFor="n">Number of Images</Label>
                <Input
                  id="n"
                  type="number"
                  value={formData.n}
                  onChange={(e) => handleInputChange('n', Number(e.target.value))}
                  min={1}
                  max={4}
                />
              </div>

              {/* Sequential Image Generation */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sequential_image_generation"
                  checked={formData.sequential_image_generation}
                  onChange={(e) => handleInputChange('sequential_image_generation', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="sequential_image_generation">Sequential Image Generation (组图)</Label>
              </div>

              {/* Custom Dimensions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    value={formData.width}
                    onChange={(e) => handleInputChange('width', Number(e.target.value))}
                    min={256}
                    max={2048}
                    step={64}
                  />
                  {errors.width && (
                    <p className="text-sm text-red-500">{errors.width}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', Number(e.target.value))}
                    min={256}
                    max={2048}
                    step={64}
                  />
                  {errors.height && (
                    <p className="text-sm text-red-500">{errors.height}</p>
                  )}
                </div>
              </div>

              {/* Inference Steps */}
              <div className="space-y-2">
                <Label htmlFor="steps">Inference Steps: {formData.num_inference_steps}</Label>
                <Input
                  id="steps"
                  type="range"
                  min="1"
                  max="100"
                  value={formData.num_inference_steps}
                  onChange={(e) => handleInputChange('num_inference_steps', Number(e.target.value))}
                  className="w-full"
                />
                {errors.num_inference_steps && (
                  <p className="text-sm text-red-500">{errors.num_inference_steps}</p>
                )}
              </div>

              {/* Guidance Scale */}
              <div className="space-y-2">
                <Label htmlFor="guidance">Guidance Scale: {formData.guidance_scale}</Label>
                <Input
                  id="guidance"
                  type="range"
                  min="1"
                  max="20"
                  step="0.1"
                  value={formData.guidance_scale}
                  onChange={(e) => handleInputChange('guidance_scale', Number(e.target.value))}
                  className="w-full"
                />
                {errors.guidance_scale && (
                  <p className="text-sm text-red-500">{errors.guidance_scale}</p>
                )}
              </div>

              {/* Scheduler */}
              <div className="space-y-2 mb-6">
                <Label>Scheduler</Label>
                <Select
                  value={formData.scheduler}
                  onValueChange={(value) => handleInputChange('scheduler', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULERS.map((scheduler) => (
                      <SelectItem key={scheduler} value={scheduler}>
                        {scheduler}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Seed */}
              <div className="space-y-2">
                <Label htmlFor="seed">Seed (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="seed"
                    type="number"
                    placeholder="Random seed"
                    value={formData.seed}
                    onChange={(e) => handleInputChange('seed', e.target.value)}
                    className={errors.seed ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={generateRandomSeed}
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>
                {errors.seed && (
                  <p className="text-sm text-red-500">{errors.seed}</p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Image
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
    </>
  );
}