// 降级服务管理器

import {
  FallbackStrategy,
  FallbackService,
  FallbackEvent,
  ServiceMetrics,
  ServiceStatus,
  FallbackReason,
  DEFAULT_FALLBACK_STRATEGY,
  getAvailableFallbackServices,
  shouldTriggerFallback,
  getFallbackReason,
  getRandomMockImage,
  generatePlaceholderImage,
  MOCK_IMAGES
} from '../config/fallback';

import { ImageGenerationRequest, ImageGenerationResponse } from '../types/image-generation';

// 降级管理器类
export class FallbackManager {
  private strategy: FallbackStrategy;
  private serviceMetrics: Map<string, ServiceMetrics> = new Map();
  private fallbackEvents: FallbackEvent[] = [];
  private currentServiceIndex: number = 0;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(strategy: FallbackStrategy = DEFAULT_FALLBACK_STRATEGY) {
    this.strategy = strategy;
    this.initializeMetrics();
    
    if (strategy.enabled && strategy.healthCheckInterval > 0) {
      this.startHealthCheck();
    }
  }

  // 初始化服务指标
  private initializeMetrics(): void {
    this.strategy.fallbackServices.forEach(service => {
      this.serviceMetrics.set(service.id, {
        serviceId: service.id,
        status: ServiceStatus.UNKNOWN,
        responseTime: 0,
        successRate: 100,
        errorCount: 0,
        uptime: 0
      });
    });
  }

  // 启动健康检查
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.strategy.healthCheckInterval);
  }

  // 停止健康检查
  public stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  // 执行健康检查
  private async performHealthCheck(): Promise<void> {
    const availableServices = getAvailableFallbackServices(this.strategy);
    
    for (const service of availableServices) {
      if (service.type === 'api') {
        try {
          const startTime = Date.now();
          // 这里可以调用实际的健康检查API
          await this.checkServiceHealth(service);
          const responseTime = Date.now() - startTime;
          
          this.updateServiceMetrics(service.id, {
            status: ServiceStatus.HEALTHY,
            responseTime,
            lastSuccess: new Date().toISOString()
          });
        } catch (error) {
          this.updateServiceMetrics(service.id, {
            status: ServiceStatus.UNHEALTHY,
            lastError: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      } else {
        // 模拟服务和占位符服务始终可用
        this.updateServiceMetrics(service.id, {
          status: ServiceStatus.HEALTHY,
          responseTime: 100,
          lastSuccess: new Date().toISOString()
        });
      }
    }
  }

  // 检查服务健康状态
  private async checkServiceHealth(service: FallbackService): Promise<void> {
    if (!service.config?.endpoint) {
      throw new Error('Service endpoint not configured');
    }

    // 发送健康检查请求到 /api/health
    const response = await fetch('/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
    }

    const healthData = await response.json();
    if (healthData.status !== 'healthy') {
      throw new Error(`Service unhealthy: ${healthData.message || 'Unknown reason'}`);
    }
  }

  // 更新服务指标
  private updateServiceMetrics(serviceId: string, updates: Partial<ServiceMetrics>): void {
    const current = this.serviceMetrics.get(serviceId);
    if (current) {
      this.serviceMetrics.set(serviceId, { ...current, ...updates });
    }
  }

  // 记录降级事件
  private recordFallbackEvent(event: FallbackEvent): void {
    this.fallbackEvents.push(event);
    // 保留最近100个事件
    if (this.fallbackEvents.length > 100) {
      this.fallbackEvents = this.fallbackEvents.slice(-100);
    }
  }

  // 获取当前可用服务
  public getCurrentService(): FallbackService | null {
    const availableServices = getAvailableFallbackServices(this.strategy);
    
    // 查找健康的服务
    for (let i = 0; i < availableServices.length; i++) {
      const service = availableServices[i];
      const metrics = this.serviceMetrics.get(service.id);
      
      if (!metrics || metrics.status === ServiceStatus.HEALTHY || metrics.status === ServiceStatus.UNKNOWN) {
        this.currentServiceIndex = i;
        return service;
      }
    }
    
    // 如果没有健康的服务，返回优先级最高的
    return availableServices[0] || null;
  }

  // 获取下一个可用服务
  public getNextService(): FallbackService | null {
    const availableServices = getAvailableFallbackServices(this.strategy);
    
    if (availableServices.length === 0) {
      return null;
    }
    
    // 从当前服务的下一个开始查找
    for (let i = this.currentServiceIndex + 1; i < availableServices.length; i++) {
      const service = availableServices[i];
      const metrics = this.serviceMetrics.get(service.id);
      
      if (!metrics || metrics.status !== ServiceStatus.UNHEALTHY) {
        this.currentServiceIndex = i;
        return service;
      }
    }
    
    return null;
  }

  // 执行图像生成请求（带降级）
  public async generateImage(
    request: ImageGenerationRequest,
    retryCount: number = 0
  ): Promise<ImageGenerationResponse> {
    const currentService = this.getCurrentService();
    
    if (!currentService) {
      throw new Error('No available services for image generation');
    }

    try {
      const startTime = Date.now();
      let result: ImageGenerationResponse;

      switch (currentService.type) {
        case 'api':
          result = await this.callApiService(currentService, request);
          break;
        case 'mock':
          result = await this.callMockService(request);
          break;
        case 'placeholder':
          result = await this.callPlaceholderService(request);
          break;
        default:
          throw new Error(`Unsupported service type: ${currentService.type}`);
      }

      // 更新成功指标
      const responseTime = Date.now() - startTime;
      this.updateServiceMetrics(currentService.id, {
        status: ServiceStatus.HEALTHY,
        responseTime,
        lastSuccess: new Date().toISOString()
      });

      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      // 更新错误指标
      const metrics = this.serviceMetrics.get(currentService.id);
      if (metrics) {
        this.updateServiceMetrics(currentService.id, {
          status: ServiceStatus.UNHEALTHY,
          errorCount: metrics.errorCount + 1,
          lastError: errorObj.message
        });
      }

      // 判断是否应该降级
      const serviceStatus = this.serviceMetrics.get(currentService.id)?.status || ServiceStatus.UNKNOWN;
      const shouldFallback = shouldTriggerFallback(
        errorObj,
        retryCount,
        this.strategy.maxRetries,
        serviceStatus
      );

      if (shouldFallback && this.strategy.autoFallback) {
        const nextService = this.getNextService();
        
        if (nextService) {
          // 记录降级事件
          this.recordFallbackEvent({
            timestamp: new Date().toISOString(),
            reason: getFallbackReason(errorObj),
            fromService: currentService.id,
            toService: nextService.id,
            error: errorObj.message
          });

          // 递归调用下一个服务
          return this.generateImage(request, 0);
        }
      }

      // 如果还有重试机会且不需要降级
      if (retryCount < this.strategy.maxRetries && !shouldFallback) {
        await new Promise(resolve => setTimeout(resolve, this.strategy.retryDelay));
        return this.generateImage(request, retryCount + 1);
      }

      throw errorObj;
    }
  }

  // 调用API服务
  private async callApiService(
    service: FallbackService,
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed: ${response.status}`);
    }

    return response.json();
  }

  // 调用模拟服务
  private async callMockService(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const imageUrl = getRandomMockImage(request.size);
    
    return {
      id: 'mock-' + Date.now(),
      object: 'list' as const,
      created: Math.floor(Date.now() / 1000),
      data: [{
        url: imageUrl,
        revised_prompt: request.prompt
      }]
    };
  }

  // 调用占位符服务
  private async callPlaceholderService(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    // 解析尺寸
    const size = request.size || '1024x1024';
    const [width, height] = size.split('x').map(Number);
    const imageUrl = generatePlaceholderImage(width || 1024, height || 1024, request.prompt);
    
    return {
      id: 'placeholder-' + Date.now(),
      object: 'list' as const,
      created: Math.floor(Date.now() / 1000),
      data: [{
        url: imageUrl,
        revised_prompt: request.prompt
      }]
    };
  }

  // 获取服务状态
  public getServiceStatus(): { services: ServiceMetrics[]; events: FallbackEvent[] } {
    return {
      services: Array.from(this.serviceMetrics.values()),
      events: [...this.fallbackEvents]
    };
  }

  // 重置服务状态
  public resetServiceStatus(serviceId?: string): void {
    if (serviceId) {
      const metrics = this.serviceMetrics.get(serviceId);
      if (metrics) {
        this.updateServiceMetrics(serviceId, {
          status: ServiceStatus.UNKNOWN,
          errorCount: 0,
          lastError: undefined
        });
      }
    } else {
      this.initializeMetrics();
      this.fallbackEvents = [];
      this.currentServiceIndex = 0;
    }
  }

  // 强制切换到指定服务
  public switchToService(serviceId: string): boolean {
    const availableServices = getAvailableFallbackServices(this.strategy);
    const serviceIndex = availableServices.findIndex(s => s.id === serviceId);
    
    if (serviceIndex >= 0) {
      this.currentServiceIndex = serviceIndex;
      return true;
    }
    
    return false;
  }

  // 销毁管理器
  public destroy(): void {
    this.stopHealthCheck();
    this.serviceMetrics.clear();
    this.fallbackEvents = [];
  }
}

// 全局降级管理器实例
export const fallbackManager = new FallbackManager();

// 导出便捷函数
export async function generateImageWithFallback(
  request: ImageGenerationRequest
): Promise<ImageGenerationResponse> {
  return fallbackManager.generateImage(request);
}

export function getServiceStatus() {
  return fallbackManager.getServiceStatus();
}

export function resetServiceStatus(serviceId?: string) {
  return fallbackManager.resetServiceStatus(serviceId);
}

export function switchToService(serviceId: string) {
  return fallbackManager.switchToService(serviceId);
}