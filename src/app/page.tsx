'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Sparkles, ImageIcon, History, Download, RefreshCw, Cloud, HardDrive, CheckCircle, AlertCircle } from 'lucide-react';
import { ImageGenerationForm } from '@/components/ImageGenerationForm';
import { ImageDisplay } from '@/components/ImageDisplay';
import { ImageGallery } from '@/components/ImageGallery';
import { ImageModal } from '@/components/ImageModal';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { SetupInstructions } from '@/components/SetupInstructions';
import { StorageStatus } from '@/components/StorageStatus';
import { imageStorage } from '@/utils/image-storage';
import { isSupabaseConfigured } from '@/lib/supabase';
import { SupabaseTest } from '@/utils/supabase-test';
import { initializeSupabaseDatabase } from '@/lib/supabase-init';
import { fixDatabaseSchema } from '@/utils/database-fixer';
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
  const [storageStatus, setStorageStatus] = useState<{
    type: 'cloud' | 'local';
    configured: boolean;
    connected: boolean;
    message: string;
  }>({ type: 'local', configured: false, connected: false, message: 'Checking storage...' });
  const [galleryImages, setGalleryImages] = useState<GeneratedImage[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  // Check storage status
  const checkStorageStatus = async () => {
    const configured = isSupabaseConfigured();
    
    if (!configured) {
      setStorageStatus({
        type: 'local',
        configured: false,
        connected: false,
        message: 'Using local storage (browser only)'
      });
      return;
    }

    // Test Supabase connection
    const connectionTest = await SupabaseTest.testConnection();
    
    setStorageStatus({
      type: connectionTest.success ? 'cloud' : 'local',
      configured: true,
      connected: connectionTest.success,
      message: connectionTest.message
    });

    if (connectionTest.success) {
      toast.success('Cloud Storage Connected', {
        description: 'Your images will be saved to Supabase cloud storage',
        duration: 3000
      });
    } else {
      toast.warning('Cloud Storage Failed', {
        description: 'Falling back to local storage. ' + connectionTest.message,
        duration: 5000
      });
    }
  };

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

  // Load gallery images
  const loadGalleryImages = async () => {
    setIsLoadingGallery(true);
    try {
      const images = await imageStorage.loadImages();
      setGalleryImages(images);
      setImageCount(images.length);
      setStorageInfo({ total: `${Math.round(images.length * 2.5)}MB` });
    } catch (error) {
      console.error('Failed to load gallery images:', error);
      setGalleryImages([]);
    } finally {
      setIsLoadingGallery(false);
    }
  };

  // Initialize client-side data to prevent hydration errors
  useEffect(() => {
    setIsClient(true);
    
    // Initialize Supabase database if configured
    const initializeDatabase = async () => {
      if (isSupabaseConfigured()) {
        try {
          console.log('🔄 Initializing Supabase database...');
          
          // First, fix any database schema issues
          console.log('🔧 Checking and fixing database schema...');
          await fixDatabaseSchema();
          console.log('✅ Database schema check completed');
          
          // Then initialize the database
          await initializeSupabaseDatabase();
          console.log('✅ Supabase database initialized successfully');
        } catch (error) {
          console.warn('⚠️ Supabase database initialization failed:', error);
          // Don't show error to user as this is optional
        }
      }
    };
    
    // Check storage and account status
    initializeDatabase();
    checkStorageStatus();
    checkAccountStatus();
    loadGalleryImages();
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
        // Generate UUID for the image
        const generateUUID = () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        };

        // Create the generated image object
        const generatedImage: GeneratedImage = {
          id: generateUUID(),
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

        // Update state first
        setCurrentImage(generatedImage);
        setGenerationStatus({ status: 'succeeded', progress: 100 });
        setActiveTab('display');
        
        // Save to storage with error handling
        try {
          await imageStorage.saveImage(generatedImage);
          console.log('✅ Image saved to storage successfully');
          toast.success('Image generated and saved successfully! Check the Gallery tab to view it.');
        } catch (saveError) {
          console.error('❌ Failed to save image to storage:', saveError);
          toast.error('Image generated but failed to save to gallery. You can still download it from here.');
          // Don't throw error here - image generation was successful
          // User can still see and download the image
        }

        // Update gallery images
        await loadGalleryImages();
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
  const handleImageDelete = useCallback(async (imageId: string) => {
    await imageStorage.deleteImage(imageId);
    toast.success('Image deleted successfully');
    
    // Update gallery images
    await loadGalleryImages();
    
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
              
              {/* Storage Status */}
              {isClient && (
                <div className={`hidden sm:flex items-center px-2 py-1 rounded-md text-sm ${
                  storageStatus.type === 'cloud' && storageStatus.connected
                    ? 'bg-blue-50 border border-blue-200 text-blue-700'
                    : storageStatus.configured && !storageStatus.connected
                    ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                    : 'bg-gray-50 border border-gray-200 text-gray-700'
                }`} title={storageStatus.message}>
                  {storageStatus.type === 'cloud' ? (
                    storageStatus.connected ? (
                      <><Cloud className="h-3 w-3 mr-1" />Cloud</>
                    ) : (
                      <><AlertCircle className="h-3 w-3 mr-1" />Cloud Error</>
                    )
                  ) : (
                    <><HardDrive className="h-3 w-3 mr-1" />Local</>
                  )}
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
              {/* Storage Status */}
              {isClient && (
                <StorageStatus status={storageStatus} />
              )}
              
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
                      onClick={loadGalleryImages}
                      disabled={isLoadingGallery}
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingGallery ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  {isLoadingGallery ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                      <span className="text-gray-500">Loading images...</span>
                    </div>
                  ) : (
                    <ImageGallery
                      images={galleryImages}
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
                  )}
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