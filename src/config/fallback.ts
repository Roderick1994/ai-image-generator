// 服务降级和备用方案配置

// 备用图像生成服务配置
export interface FallbackService {
  id: string;
  name: string;
  type: 'api' | 'mock' | 'placeholder';
  enabled: boolean;
  priority: number; // 优先级，数字越小优先级越高
  config?: {
    endpoint?: string;
    apiKey?: string;
    models?: string[];
    timeout?: number;
  };
}

// 降级策略配置
export interface FallbackStrategy {
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  healthCheckInterval: number;
  autoFallback: boolean;
  fallbackServices: FallbackService[];
}

// 默认降级策略
export const DEFAULT_FALLBACK_STRATEGY: FallbackStrategy = {
  enabled: true,
  maxRetries: 3,
  retryDelay: 1000,
  healthCheckInterval: 30000,
  autoFallback: true,
  fallbackServices: [
    {
      id: 'doubao-primary',
      name: '豆包 API (主要)',
      type: 'api',
      enabled: true,
      priority: 1,
      config: {
        endpoint: 'https://ark.cn-beijing.volces.com/api/v3',
        models: ['Doubao-Seedream-4.0', 'Doubao-SeedEdit-3.0-i2i', 'Doubao-Seedance-1.0-pro'],
        timeout: 30000
      }
    },
    {
      id: 'openai-dalle',
      name: 'OpenAI DALL-E',
      type: 'api',
      enabled: false, // 默认禁用，需要用户配置API密钥
      priority: 2,
      config: {
        endpoint: 'https://api.openai.com/v1',
        models: ['dall-e-3', 'dall-e-2'],
        timeout: 60000
      }
    },
    {
      id: 'stability-ai',
      name: 'Stability AI',
      type: 'api',
      enabled: false, // 默认禁用，需要用户配置API密钥
      priority: 3,
      config: {
        endpoint: 'https://api.stability.ai/v1',
        models: ['stable-diffusion-xl-1024-v1-0', 'stable-diffusion-v1-6'],
        timeout: 60000
      }
    },
    {
      id: 'replicate-api',
      name: 'Replicate API',
      type: 'api',
      enabled: false, // 默认禁用，需要用户配置API密钥
      priority: 4,
      config: {
        endpoint: 'https://api.replicate.com/v1',
        models: ['stability-ai/sdxl', 'black-forest-labs/flux-schnell'],
        timeout: 120000
      }
    },
    {
      id: 'mock-service',
      name: '模拟服务',
      type: 'mock',
      enabled: true,
      priority: 5
    },
    {
      id: 'placeholder-service',
      name: '占位符服务',
      type: 'placeholder',
      enabled: true,
      priority: 6
    }
  ]
};

// 模拟图像URL池
export const MOCK_IMAGES = [
  'https://picsum.photos/1024/1024?random=1',
  'https://picsum.photos/1024/1024?random=2',
  'https://picsum.photos/1024/1024?random=3',
  'https://picsum.photos/1024/1024?random=4',
  'https://picsum.photos/1024/1024?random=5',
  'https://picsum.photos/768/768?random=6',
  'https://picsum.photos/512/512?random=7',
  'https://picsum.photos/1792/1024?random=8',
  'https://picsum.photos/1024/1792?random=9',
  'https://picsum.photos/768/512?random=10'
];

// 占位符图像生成
export function generatePlaceholderImage(width: number = 1024, height: number = 1024, prompt: string = ''): string {
  // 使用 placeholder.com 或类似服务生成占位符
  const backgroundColor = '4A90E2';
  const textColor = 'FFFFFF';
  const text = encodeURIComponent(prompt.slice(0, 50) || 'AI Generated Image');
  
  return `https://via.placeholder.com/${width}x${height}/${backgroundColor}/${textColor}?text=${text}`;
}

// 获取随机模拟图像
export function getRandomMockImage(size?: string): string {
  const randomIndex = Math.floor(Math.random() * MOCK_IMAGES.length);
  let imageUrl = MOCK_IMAGES[randomIndex];
  
  // 根据尺寸调整URL
  if (size) {
    const [width, height] = size.split('x').map(Number);
    if (width && height) {
      imageUrl = `https://picsum.photos/${width}/${height}?random=${randomIndex + Date.now()}`;
    }
  }
  
  return imageUrl;
}

// 服务状态枚举
export enum ServiceStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown'
}

// 降级原因枚举
export enum FallbackReason {
  API_ERROR = 'api_error',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  AUTHENTICATION_ERROR = 'authentication_error',
  PAYMENT_ERROR = 'payment_error',
  HEALTH_CHECK_FAILED = 'health_check_failed'
}

// 降级事件接口
export interface FallbackEvent {
  timestamp: string;
  reason: FallbackReason;
  fromService: string;
  toService: string;
  error?: string;
  requestId?: string;
}

// 服务监控指标
export interface ServiceMetrics {
  serviceId: string;
  status: ServiceStatus;
  responseTime: number;
  successRate: number;
  errorCount: number;
  lastError?: string;
  lastSuccess?: string;
  uptime: number;
}

// 获取可用的降级服务
export function getAvailableFallbackServices(strategy: FallbackStrategy = DEFAULT_FALLBACK_STRATEGY): FallbackService[] {
  return strategy.fallbackServices
    .filter(service => service.enabled)
    .sort((a, b) => a.priority - b.priority);
}

// 判断是否应该触发降级
export function shouldTriggerFallback(
  error: Error,
  retryCount: number,
  maxRetries: number,
  serviceStatus: ServiceStatus
): boolean {
  // 如果重试次数已达上限
  if (retryCount >= maxRetries) {
    return true;
  }
  
  // 如果服务状态不健康
  if (serviceStatus === ServiceStatus.UNHEALTHY) {
    return true;
  }
  
  // 特定错误类型立即触发降级
  const errorMessage = error.message.toLowerCase();
  const immediateFailurePatterns = [
    'authentication',
    'unauthorized',
    'payment required',
    'forbidden',
    'not found'
  ];
  
  return immediateFailurePatterns.some(pattern => errorMessage.includes(pattern));
}

// 获取降级原因
export function getFallbackReason(error: Error): FallbackReason {
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('timeout')) {
    return FallbackReason.TIMEOUT;
  }
  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return FallbackReason.RATE_LIMIT;
  }
  if (errorMessage.includes('500') || errorMessage.includes('503')) {
    return FallbackReason.SERVICE_UNAVAILABLE;
  }
  if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
    return FallbackReason.AUTHENTICATION_ERROR;
  }
  if (errorMessage.includes('402') || errorMessage.includes('payment')) {
    return FallbackReason.PAYMENT_ERROR;
  }
  
  return FallbackReason.API_ERROR;
}