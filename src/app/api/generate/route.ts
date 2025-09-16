import { NextRequest, NextResponse } from 'next/server';
import { ImageGenerationRequest, ImageGenerationResponse } from '@/types/image-generation';
import { generateImageWithDoubao, DoubaoApiError } from '@/services/doubaoApi';

// 验证API token
function validateApiToken(): boolean {
  const token = process.env.DOUBAO_API_KEY;
  return !!token && token.trim() !== '';
}

export async function POST(request: NextRequest) {
  try {
    // 验证API token（基础检查）
    if (!validateApiToken()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'DOUBAO API key is not configured. Please add DOUBAO_API_KEY to your .env.local file.',
          errorType: 'configuration',
          suggestion: 'Please configure your DOUBAO API key in the .env.local file'
        },
        { status: 401 }
      );
    }

    // 解析请求体
    const body: ImageGenerationRequest = await request.json();
    
    // 验证必需参数
    if (!body.prompt || body.prompt.trim() === '') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Prompt is required',
          errorType: 'validation'
        },
        { status: 400 }
      );
    }

    console.log('🎨 Image generation request:', {
      model: body.model || 'default',
      size: body.size || '1024x1024',
      prompt: body.prompt.substring(0, 100) + (body.prompt.length > 100 ? '...' : '')
    });

    // 使用环境变量中配置的端点ID，确保安全性
    const endpointId = process.env.DOUBAO_ENDPOINT_ID;
    if (!endpointId || !endpointId.startsWith('ep-')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'DOUBAO endpoint ID is not configured or invalid. Please add DOUBAO_ENDPOINT_ID to your .env.local file.',
          errorType: 'configuration'
        },
        { status: 500 }
      );
    }

    // 使用服务器端配置的端点ID，忽略前端传递的model参数
    const requestWithEndpoint = {
      ...body,
      model: endpointId
    };

    // 直接使用豆包API生成图像
    const apiKey = process.env.DOUBAO_API_KEY!;
    const doubaoResponse = await generateImageWithDoubao(requestWithEndpoint, apiKey);
    
    console.log('✅ Image generation completed:', {
      id: doubaoResponse.id,
      imageCount: doubaoResponse.data.length,
      hasImages: doubaoResponse.data.length > 0
    });

    // 转换为前端期望的格式
    const result = {
      success: true,
      imageUrl: doubaoResponse.data[0]?.url || doubaoResponse.data[0]?.b64_json,
      images: doubaoResponse.data.map(item => item.url || item.b64_json).filter(Boolean),
      metadata: {
        serviceType: 'doubao-api',
        model: body.model || process.env.DOUBAO_ENDPOINT_ID || 'ep-未配置',
        responseId: doubaoResponse.id,
        created: doubaoResponse.created
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('💥 Image generation failed:', error);
    
    // 处理豆包API特定错误
    if (error instanceof DoubaoApiError) {
      let statusCode = error.statusCode || 500;
      let errorType = 'doubao_api_error';
      let suggestion = 'Please try again later.';
      
      if (statusCode === 401) {
        errorType = 'authentication';
        suggestion = 'Please check your DOUBAO API key configuration.';
      } else if (statusCode === 402) {
        errorType = 'payment';
        suggestion = 'Please check your account balance.';
      } else if (statusCode === 429) {
        errorType = 'rate_limit';
        suggestion = 'Please wait a moment before making another request.';
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          errorType,
          suggestion,
          details: error.response
        },
        { status: statusCode }
      );
    }
    
    // 处理其他错误
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        errorType: 'server_error',
        suggestion: 'Please try again later or contact support if the problem persists.'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for health check or API status
export async function GET(request: NextRequest) {
  try {
    // 验证API token（基础检查）
    if (!validateApiToken()) {
      return NextResponse.json(
        { 
          error: 'DOUBAO API key is not configured. Please add DOUBAO_API_KEY to your .env.local file.',
          type: 'configuration_error',
          action: 'Please configure your DOUBAO API key in .env.local file'
        },
        { status: 401 }
      );
    }

    // 返回豆包API状态
    return NextResponse.json({
      status: 'ready',
      api: 'DOUBAO-SEEDREAM',
      service: {
        name: 'doubao-api',
        status: 'healthy',
        endpoint: 'https://ark.cn-beijing.volces.com/api/v3/images/generations'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking API status:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to check API status',
        type: 'server_error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}