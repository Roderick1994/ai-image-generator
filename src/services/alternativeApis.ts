// 备用图像生成API服务实现

import { ImageGenerationRequest, ImageGenerationResponse } from '../types/image-generation';
import { FallbackService } from '../config/fallback';

// API服务接口
export interface ApiService {
  id: string;
  name: string;
  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
  checkHealth(): Promise<boolean>;
}

// OpenAI DALL-E 服务
export class OpenAIService implements ApiService {
  id = 'openai-dalle';
  name = 'OpenAI DALL-E';
  private apiKey: string;
  private endpoint: string;

  constructor(config: { apiKey: string; endpoint: string }) {
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint;
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const response = await fetch(`${this.endpoint}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: request.model?.includes('dall-e') ? request.model : 'dall-e-3',
        prompt: request.prompt,
        size: this.convertSize(request.size),
        quality: request.quality === 'hd' ? 'hd' : 'standard',
        style: request.style === 'natural' ? 'natural' : 'vivid',
        n: 1
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      id: data.id || 'openai-' + Date.now(),
      object: 'list' as const,
      created: data.created || Math.floor(Date.now() / 1000),
      data: data.data || []
    };
  }

  async checkHealth(): Promise<boolean> {
    try {
      // 简单的健康检查
      return true;
    } catch {
      return false;
    }
  }

  private convertSize(size?: string): string {
    // 转换尺寸格式
    switch (size) {
      case '256x256':
      case '512x512':
      case '1024x1024':
        return size;
      default:
        return '1024x1024';
    }
  }
}