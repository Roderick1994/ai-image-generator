'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Sparkles, ImageIcon, History, Download, RefreshCw } from 'lucide-react';
import { ImageGenerationForm } from '@/components/ImageGenerationForm';
import { ImageDisplay } from '@/components/ImageDisplay';
import { ImageGallery } from '@/components/ImageGallery';
import { ImageModal } from '@/components/ImageModal';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { SetupInstructions } from '@/components/SetupInstructions';
import { imageStorage } from '@/utils/image-storage';
import type { GeneratedImage, ImageGenerationRequest, ImageGenerationFormData, GenerationStatus } from '@/types/image-generation';

type ActiveTab = 'generate' | 'display' | 'gallery';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('generate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [galleryKey, setGalleryKey] = useState(0);
  const [showSetupInstructions, setShowSetupInstructions] = useState(false);
  const [accountStatus, setAccountStatus] = useState<{
    status: string;
    hasAccess: boolean;
    message?: string;
    lastChecked?: Date;
  } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [imageCount, setImageCount] = useState(0);
  const [storageInfo, setStorageInfo] = useState({ total: '0MB' });

  // Check account status
  const checkAccountStatus = async () => {
    try {
      const response = await fetch('/api/account');
      const result = await response.json();
      
      setAccountStatus({
        status: result.status || 'unknown',
        hasAccess: result.hasAccess || false,
        message: result.message || result.error,
        lastChecked: new Date()
      });
      
      // Show warning if account has issues
      if (!result.hasAccess && result.type === 'payment_error') {
        toast.warning('Account Status', {
          description: result.error,
          action: {
            label: 'Add Credits',
            onClick: () => window.open('https://replicate.com/account/billing', '_blank')
          },
          duration: 10000
        });
      }
    } catch (error) {
      console.error('Failed to check account status:', error);
    }
  };

  // Timer for elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

  // Initialize client-side data to prevent hydration errors
  useEffect(() => {
    setIsClient(true);
    const count = imageStorage.getAll().length;
    setImageCount(count);
    setStorageInfo({ total: `${Math.round(count * 2.5)}MB` });
  }, []);

  // Check account status on component mount
  useEffect(() => {
    checkAccountStatus();
  }, []);

  // Handle image generation
  const handleGenerate = async (formData: ImageGenerationRequest) => {
    setIsGenerating(true);
    setError(null);
    setGenerationStatus({ status: 'starting', progress: 0 });
    setElapsedTime(0);

    try {
      // Start generation
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        // Handle specific error types
        if (result.type === 'configuration_error' || result.type === 'authentication_error') {
          const errorMessage = `${result.error}\n\n${result.action || ''}`;
          setError(errorMessage);
          toast.error('API Configuration Error', {
            description: result.error,
            action: {
              label: 'Setup Guide',
              onClick: () => setShowSetupInstructions(true)
            },
            duration: 10000
          });
          return;
        }
        
        // Handle payment-related errors
        if (result.type === 'payment_error') {
          const errorMessage = `${result.error}\n\n${result.action || ''}`;
          setError(errorMessage);
          toast.error('Payment Required', {
            description: result.error,
            action: {
              label: 'Add Credits',
              onClick: () => window.open('https://replicate.com/account/billing', '_blank')
            },
            duration: 15000
          });
          return;
        }
        
        // Handle rate limit errors
        if (result.type === 'rate_limit_error') {
          const errorMessage = `${result.error}\n\n${result.action || ''}`;
          setError(errorMessage);
          toast.error('Rate Limit Exceeded', {
            description: result.error,
            duration: 8000
          });
          return;
        }
        
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      // Handle synchronous response from Doubao API
      if (result.success && result.imageUrl) {
        // Create the generated image object
        const generatedImage: GeneratedImage = {
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: result.imageUrl,
          prompt: formData.prompt,
          negative_prompt: formData.negative_prompt,
          width: formData.width || 1024,
          height: formData.height || 1024,
          num_inference_steps: formData.num_inference_steps,
          guidance_scale: formData.guidance_scale,
          scheduler: formData.scheduler,
          seed: formData.seed,
          model_version: 'doubao',
          created_at: new Date().toISOString(),
        };

        // Update image count and storage info
        const newCount = imageStorage.getAll().length + 1;
        setImageCount(newCount);
        setStorageInfo({ total: `${Math.round(newCount * 2.5)}MB` });

        // Save to storage
        imageStorage.add(generatedImage);

        // Update state
        setCurrentImage(generatedImage);
        setGenerationStatus({ status: 'succeeded', progress: 100 });
        setActiveTab('display');
        
        toast.success('Image generated successfully!');
      } else {
        throw new Error('Failed to generate image: No image URL returned');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setGenerationStatus({ status: 'failed', progress: 0 });
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle image selection from gallery
  const handleImageSelect = useCallback((image: GeneratedImage) => {
    setCurrentImage(image);
    setActiveTab('display');
  }, []);

  // Handle image modal
  const handleImageClick = useCallback((image: GeneratedImage) => {
    setSelectedImage(image);
  }, []);



  // Handle image deletion
  const handleImageDelete = useCallback((imageId: string) => {
    imageStorage.delete(imageId);
    toast.success('Image deleted successfully');
    setGalleryKey(prev => prev + 1);
    
    // Update image count and storage info
    const newCount = imageStorage.getAll().length;
    setImageCount(newCount);
    setStorageInfo({ total: `${Math.round(newCount * 2.5)}MB` });
    
    // Clear current image if it was deleted
    if (currentImage?.id === imageId) {
      setCurrentImage(null);
    }
    
    // Clear selected image if it was deleted
    if (selectedImage?.id === imageId) {
      setSelectedImage(null);
    }
  }, [currentImage, selectedImage]);



  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  AI Image Generator
                </h1>
                <p className="text-sm text-gray-500">Create stunning images with AI</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {accountStatus && (
                <div className={`hidden sm:flex items-center px-2 py-1 rounded-md text-sm ${
                  accountStatus.hasAccess 
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <div className={`h-2 w-2 rounded-full mr-2 ${
                    accountStatus.hasAccess ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  {accountStatus.hasAccess ? 'Account Active' : 'Payment Required'}
                </div>
              )}
              {isClient && (
                <>
                  <div className="hidden sm:flex items-center px-2 py-1 border border-gray-300 rounded-md text-sm">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    {imageCount} images
                  </div>
                  <div className="hidden sm:flex items-center px-2 py-1 border border-gray-300 rounded-md text-sm">
                    <Download className="h-3 w-3 mr-1" />
                    {storageInfo.total}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'generate'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate</span>
            </button>
            <button
              onClick={() => setActiveTab('display')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'display'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              <span>Display</span>
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'gallery'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <History className="h-4 w-4" />
              <span>Gallery</span>
            </button>
          </div>

          {activeTab === 'generate' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-6 border-b">
                  <h3 className="flex items-center space-x-2 text-lg font-semibold">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <span>Create New Image</span>
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Enter a detailed prompt and customize settings to generate your perfect image
                  </p>
                </div>
                <div className="p-6">
                  <ImageGenerationForm
                    onSubmit={handleGenerate}
                    isGenerating={isGenerating}
                  />
                </div>
              </div>

              {(isGenerating || error) && (
                <div className="space-y-4">
                  <LoadingIndicator
                    progress={{
                      status: error ? 'error' : 
                        generationStatus?.status === 'succeeded' ? 'completed' :
                        generationStatus?.status === 'failed' ? 'error' :
                        generationStatus?.status === 'canceled' ? 'error' :
                        generationStatus?.status || 'starting',
                      progress: generationStatus?.progress || 0,
                      message: error || undefined
                    }}
                  />
                  {error && (
                    <div className="space-y-4">
                      {error.includes('API token') && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-orange-800">
                                  Configuration Required
                                </h3>
                                <p className="text-sm text-orange-700 mt-1">
                                  Your Replicate API token needs to be configured to generate images.
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setShowSetupInstructions(true)}
                              className="px-3 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors"
                            >
                              Setup Guide
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {(error.includes('Payment Required') || error.includes('insufficient credits') || error.includes('billing')) && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-red-800">
                                  Payment Required
                                </h3>
                                <p className="text-sm text-red-700 mt-1">
                                  Your DOUBAO account needs credits to generate images. Please add credits to continue.
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => window.open('https://console.volcengine.com/ark/region:ark+cn-beijing/billing', '_blank')}
                              className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                            >
                              Add Credits
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {error.includes('rate limit') && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-yellow-800">
                                Rate Limit Exceeded
                              </h3>
                              <p className="text-sm text-yellow-700 mt-1">
                                You&apos;ve made too many requests. Please wait a moment before trying again.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {(error.includes('500 Internal Server Error') || error.includes('豆包API服务器内部错误')) && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-red-800">
                                豆包API服务器错误
                              </h3>
                              <div className="text-sm text-red-700 mt-2 space-y-2">
                                <p>🔧 <strong>可能的原因：</strong></p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                  <li>端点ID格式错误或不存在</li>
                                  <li>请求参数不符合API规范</li>
                                  <li>服务暂时不可用</li>
                                </ul>
                                <p className="mt-3">💡 <strong>建议解决方案：</strong></p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                  <li>检查端点ID是否以&quot;ep-&quot;开头且格式正确</li>
                                  <li>确认端点在火山方舟控制台中存在且运行中</li>
                                  <li>稍后重试或联系技术支持</li>
                                </ul>
                              </div>
                            </div>
                            <button
                              onClick={() => window.open('https://console.volcengine.com/ark', '_blank')}
                              className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors whitespace-nowrap"
                            >
                              检查端点
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {(error.includes('端点') && error.includes('不存在')) && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-orange-800">
                                端点配置错误
                              </h3>
                              <p className="text-sm text-orange-700 mt-1">
                                您输入的端点ID不存在或无权限访问。请检查端点配置。
                              </p>
                            </div>
                            <button
                              onClick={() => setShowSetupInstructions(true)}
                              className="px-3 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors whitespace-nowrap"
                            >
                              配置指南
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'display' && (
            <div className="space-y-6">
              {currentImage ? (
                <ImageDisplay
                  image={currentImage}
                  onView={handleImageClick}
                  onDownload={async (image, options) => {
                    try {
                      const link = document.createElement('a');
                      link.href = image.url;
                      const format = options?.format || 'png';
                      const filename = options?.filename || `ai-generated-${image.id}.${format}`;
                      link.download = filename;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } catch (error) {
                      console.error('Download failed:', error);
                    }
                  }}
                />
              ) : (
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="flex flex-col items-center justify-center py-16 px-6">
                    <ImageIcon className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      No Image to Display
                    </h3>
                    <p className="text-gray-500 text-center mb-6">
                      Generate a new image or select one from your gallery to view it here
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setActiveTab('generate')}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white rounded-md flex items-center space-x-2 transition-colors"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Generate Image</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('gallery')}
                        className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md flex items-center space-x-2 transition-colors"
                      >
                        <History className="h-4 w-4" />
                        <span>View Gallery</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="flex items-center space-x-2 text-lg font-semibold">
                        <History className="h-5 w-5 text-blue-500" />
                        <span>Image Gallery</span>
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Browse and manage your generated images
                      </p>
                    </div>
                    <button
                      className="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md flex items-center space-x-2 transition-colors text-sm"
                      onClick={() => setGalleryKey(prev => prev + 1)}
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <ImageGallery
                    key={galleryKey}
                    images={imageStorage.getAll()}
                    onImageClick={handleImageClick}
                    onDownload={async (image) => {
                      // Handle download functionality
                      const link = document.createElement('a');
                      link.href = image.url;
                      link.download = `ai-generated-${image.id}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    onDelete={handleImageDelete}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedImage && (
        <ImageModal
          image={selectedImage}
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          onDownload={async (image, options) => {
            // Handle download functionality
            const link = document.createElement('a');
            link.href = image.url;
            const format = options?.format || 'png';
            const filename = options?.filename || `ai-generated-${image.id}.${format}`;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          onDelete={handleImageDelete}
        />
      )}

      <SetupInstructions
        isOpen={showSetupInstructions}
        onClose={() => setShowSetupInstructions(false)}
      />

      <footer className="border-t bg-white/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Powered by DOUBAO &amp; SEEDREAM</span>
              {isClient && (
                <>
                  <span className="text-gray-300">•</span>
                  <span>{imageCount} images generated</span>
                </>
              )}
            </div>
            {isClient && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Storage: {storageInfo.total}</span>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}