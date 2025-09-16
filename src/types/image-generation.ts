// TypeScript interfaces and types for AI image generation application

export interface ImageGenerationRequest {
  prompt: string;
  model?: string;
  image?: string; // Base64 encoded image for i2i models
  size?: string; // Format: "widthxheight"
  seed?: number;
  sequential_image_generation?: boolean; // 组图功能
  n?: number; // Number of images to generate
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural' | 'realistic' | 'cartoon' | 'oil_painting' | 'watercolor' | 'sketch' | 'cyberpunk' | 'classical_art' | 'modern_art';
  response_format?: 'url' | 'b64_json';
  // Legacy Replicate parameters for backward compatibility
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  scheduler?: string;
}

export interface ImageGenerationResponse {
  id: string;
  object: 'list';
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
  // Legacy Replicate format for backward compatibility
  status?: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string[];
  error?: string;
  logs?: string;
  metrics?: {
    predict_time?: number;
  };
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  negative_prompt?: string;
  width: number;
  height: number;
  seed?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
  scheduler?: string;
  model_version: string;
  created_at: string;
  generation_time?: number;
  tags?: string[];
  is_favorite?: boolean;
  quality?: string;
  size?: string;
  // Legacy properties for backward compatibility
  isFavorite?: boolean;
  createdAt?: string;
  model?: string;
  imageUrl?: string;
}

export interface ImageGenerationFormData {
  prompt: string;
  model: string;
  size: string;
  seed: string;
  sequential_image_generation: boolean;
  n: number;
  quality: 'standard' | 'hd';
  style: 'vivid' | 'natural' | 'realistic' | 'cartoon' | 'oil_painting' | 'watercolor' | 'sketch' | 'cyberpunk' | 'classical_art' | 'modern_art';
  // Legacy Replicate parameters for backward compatibility
  negative_prompt: string;
  width: number;
  height: number;
  num_inference_steps: number;
  guidance_scale: number;
  scheduler: string;
}

export interface ImageResolution {
  label: string;
  width: number;
  height: number;
}

export interface GenerationProgress {
  status: 'idle' | 'starting' | 'processing' | 'completed' | 'error';
  progress?: number;
  message?: string;
  logs?: string[];
}

export interface ImageModalData {
  image: GeneratedImage;
  isOpen: boolean;
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
}

export interface LocalStorageImageData {
  images: GeneratedImage[];
  lastUpdated: string;
}

export interface DownloadOptions {
  format: 'png' | 'jpg' | 'webp';
  quality?: number;
  filename?: string;
}

export interface ErrorState {
  hasError: boolean;
  message: string;
  type: 'network' | 'api' | 'validation' | 'storage' | 'unknown';
}

export interface FormValidationErrors {
  prompt?: string;
  model?: string;
  size?: string;
  quality?: string;
  style?: string;
  n?: string;
  sequential_image_generation?: string;
  negative_prompt?: string;
  width?: string;
  height?: string;
  num_inference_steps?: string;
  guidance_scale?: string;
  scheduler?: string;
  seed?: string;
}

export interface GenerationStatus {
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  progress: number;
}

// Constants for image generation
export const IMAGE_RESOLUTIONS: ImageResolution[] = [
  { label: '512x512', width: 512, height: 512 },
  { label: '768x768', width: 768, height: 768 },
  { label: '1024x1024', width: 1024, height: 1024 },
  { label: '512x768 (Portrait)', width: 512, height: 768 },
  { label: '768x512 (Landscape)', width: 768, height: 512 },
  { label: '1024x1792 (Portrait)', width: 1024, height: 1792 },
  { label: '1792x1024 (Landscape)', width: 1792, height: 1024 },
];

// DOUBAO API supported sizes
export const DOUBAO_SIZES = [
  '512x512',
  '768x768', 
  '1024x1024',
  '512x768',
  '768x512',
  '1024x1792',
  '1792x1024'
] as const;

// DOUBAO API supported models
export const DOUBAO_MODELS = [
  'doubao-seedream-4.0',
  'doubao-seedream-3.0-t2i'
] as const;

export const SCHEDULERS = [
  'DPMSolverMultistep',
  'HeunDiscrete',
  'KarrasDPM',
  'K_EULER_ANCESTRAL',
  'K_EULER',
  'PNDM',
  'DDIM',
];

export const STYLE_OPTIONS = [
  { value: 'vivid', label: 'Vivid (鲜艳)' },
  { value: 'natural', label: 'Natural (自然)' },
  { value: 'realistic', label: 'Realistic (写实)' },
  { value: 'cartoon', label: 'Cartoon (卡通)' },
  { value: 'oil_painting', label: 'Oil Painting (油画)' },
  { value: 'watercolor', label: 'Watercolor (水彩)' },
  { value: 'sketch', label: 'Sketch (素描)' },
  { value: 'cyberpunk', label: 'Cyberpunk (赛博朋克)' },
  { value: 'classical_art', label: 'Classical Art (古典艺术)' },
  { value: 'modern_art', label: 'Modern Art (现代艺术)' },
] as const;

export const DEFAULT_FORM_VALUES: ImageGenerationFormData = {
  prompt: '',
  model: 'server-configured', // 端点ID在服务器端配置
  size: '1024x1024',
  seed: '',
  sequential_image_generation: false,
  n: 1,
  quality: 'standard',
  style: 'vivid',
  // Legacy Replicate parameters for backward compatibility
  negative_prompt: '',
  width: 1024,
  height: 1024,
  num_inference_steps: 50,
  guidance_scale: 7.5,
  scheduler: 'DPMSolverMultistep',
};

export const STORAGE_KEYS = {
  GENERATED_IMAGES: 'ai_generated_images',
  USER_PREFERENCES: 'ai_generation_preferences',
} as const;