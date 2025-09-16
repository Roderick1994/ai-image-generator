import { ImageGenerationRequest, ImageGenerationResponse } from '@/types/image-generation';

// 豆包API配置
// 根据豆包官方文档：https://www.volcengine.com/docs/82379/1362931
// 图像生成使用 /chat/completions 端点
const DOUBAO_API_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const DOUBAO_IMAGE_ENDPOINT = '/images/generations';

// 豆包API错误类型
export class DoubaoApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'DoubaoApiError';
  }
}

// 豆包API请求接口
// 根据官方文档：https://www.volcengine.com/docs/82379/1362931
// 图像生成使用chat completions格式
interface DoubaoImageRequest {
  model: string;
  prompt: string;
  size?: string;
  response_format?: 'url' | 'b64_json';
  n?: number;
  sequential_image_generation?: 'auto' | 'manual';
  sequential_image_generation_options?: {
    max_images?: number;
  };
  watermark?: boolean;
  stream?: boolean;
}

// 豆包API响应接口
interface DoubaoImageResponse {
  id: string;
  object: string;
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

/**
 * 直接调用豆包API生成图像
 * @param request 图像生成请求参数
 * @param apiKey 豆包API密钥
 * @returns 生成的图像响应
 */
export async function generateImageWithDoubao(
  request: ImageGenerationRequest,
  apiKey: string
): Promise<ImageGenerationResponse> {
  console.log('🚀 开始调用豆包API生成图像');
  console.log('📝 请求参数:', {
    model: request.model,
    prompt: request.prompt?.substring(0, 100) + '...',
    size: request.size,
    seed: request.seed,
    n: request.n
  });

  // 验证API密钥
  if (!apiKey || !apiKey.trim()) {
    throw new DoubaoApiError('豆包API密钥未配置或为空');
  }

  // 验证必需参数
  if (!request.prompt || !request.prompt.trim()) {
    throw new DoubaoApiError('提示词不能为空');
  }

  // 构建豆包API请求体
  // 根据豆包官方文档，图像生成需要使用endpoint ID
  // endpoint ID格式：ep-xxxxxxxx
  let modelName = request.model && request.model.trim() ? request.model.trim() : '';
  
  console.log('🔍 检查模型名称:', modelName);
  
  // 验证模型名称
  if (!modelName) {
    throw new DoubaoApiError(
      '请提供有效的豆包模型Endpoint ID。\n获取方法：\n1. 登录火山方舟控制台\n2. 创建推理接入点\n3. 使用以"ep-"开头的接入点名称作为模型ID',
      400
    );
  }
  
  // 检查是否为endpoint ID格式
  if (!modelName.startsWith('ep-')) {
    console.warn('⚠️ 模型名称不是endpoint ID格式，可能导致调用失败');
    console.warn('💡 提示：豆包API需要使用endpoint ID（以"ep-"开头），而不是模型名称如"doubao-seedream-4.0"');
    console.warn('📖 获取endpoint ID方法：登录火山方舟控制台 -> 创建推理接入点 -> 使用接入点名称');
  }
  // 构建图像生成请求体
  const doubaoRequest: DoubaoImageRequest = {
    model: modelName,
    prompt: request.prompt.trim(),
    size: request.size || '1024x1024',
    response_format: 'url',
    n: request.n || 1,
    watermark: true,
    stream: false
  };

  // 如果有序列图像生成选项
  if (request.sequential_image_generation) {
    doubaoRequest.sequential_image_generation = 'auto';
    if (request.n && request.n > 1) {
      doubaoRequest.sequential_image_generation_options = {
        max_images: request.n
      };
    }
  }

  const url = `${DOUBAO_API_BASE_URL}${DOUBAO_IMAGE_ENDPOINT}`;
  console.log('🌐 请求URL:', url);
  console.log('📋 请求体:', JSON.stringify(doubaoRequest, null, 2));

  try {
    console.log('🔑 使用API密钥:', apiKey.substring(0, 8) + '...');
    console.log('📡 请求URL:', url);
    console.log('📝 请求体:', JSON.stringify(doubaoRequest, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(doubaoRequest)
    });

    console.log('📡 响应状态:', response.status, response.statusText);
    console.log('📋 响应头:', Object.fromEntries(response.headers.entries()));

    // 读取响应体
    const responseText = await response.text();
    console.log('📄 原始响应体:', responseText);

    if (!response.ok) {
      let errorMessage = `豆包API请求失败: ${response.status} ${response.statusText}`;
      let errorDetails = '';
      
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.error) {
          errorDetails = errorData.error.message || errorData.error;
          errorMessage += ` - ${errorDetails}`;
        }
        console.error('❌ 豆包API错误详情:', errorData);
      } catch (parseError) {
        console.error('❌ 无法解析错误响应:', parseError);
        errorMessage += ` - 响应体: ${responseText}`;
      }
      
      // 特殊处理404和500错误
      if (response.status === 404) {
        if (errorDetails.includes('does not exist') || errorDetails.includes('不存在') || errorDetails.includes('NotFound')) {
          errorMessage = `端点 "${modelName}" 不存在或无权限访问。\n\n🔧 解决方案：\n1. 确认端点ID格式正确（以"ep-"开头）\n2. 在火山方舟控制台检查端点是否存在且运行中\n3. 确认API密钥有该端点的访问权限\n4. 参考应用内的配置指南创建新端点`;
        }
      } else if (response.status === 500) {
        errorMessage = `豆包API服务器内部错误。\n\n🔧 可能的原因：\n1. 端点ID格式错误或不存在\n2. 请求参数不符合API规范\n3. 服务暂时不可用\n\n💡 建议：检查端点ID是否正确，稍后重试`;
      }
      
      throw new DoubaoApiError(errorMessage, response.status, responseText);
    }

    // 解析成功响应
    let doubaoResponse: DoubaoImageResponse;
    try {
      doubaoResponse = JSON.parse(responseText);
      console.log('✅ 豆包API响应解析成功:', doubaoResponse);
    } catch (parseError) {
      console.error('❌ 无法解析豆包API响应:', parseError);
      throw new DoubaoApiError('豆包API响应格式错误', 500, responseText);
    }

    // 转换为标准格式
    // 豆包图像生成API直接返回标准格式
    const standardResponse: ImageGenerationResponse = {
      id: doubaoResponse.id,
      object: doubaoResponse.object || 'list',
      created: doubaoResponse.created,
      data: doubaoResponse.data || []
    };
    
    // 验证响应数据
    if (!doubaoResponse.data || doubaoResponse.data.length === 0) {
      console.warn('⚠️ 豆包API响应中没有图像数据');
      throw new DoubaoApiError('豆包API响应格式异常：缺少图像数据', 500, responseText);
    }
    
    console.log('📝 豆包返回图像数据:', doubaoResponse.data);

    console.log('🎉 图像生成成功，返回', standardResponse.data.length, '张图片');
    return standardResponse;

  } catch (error) {
    console.error('💥 豆包API调用失败:', error);
    
    // 详细的错误信息
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🌐 网络连接问题，可能是DNS解析或网络不可达');
    }
    
    if (error instanceof DoubaoApiError) {
      throw error;
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new DoubaoApiError('网络连接失败，请检查网络连接');
    }
    
    throw new DoubaoApiError(`豆包API调用异常: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 测试豆包API连接
 * @param apiKey 豆包API密钥
 * @param modelId 豆包模型ID（可选，如果不提供则只测试API密钥有效性）
 * @returns 连接测试结果
 */
export async function testDoubaoConnection(apiKey: string, modelId?: string): Promise<boolean> {
  try {
    console.log('🔍 测试豆包API连接...');
    console.log('🔑 API密钥前缀:', apiKey.substring(0, 8) + '...');
    
    // 如果没有提供模型ID，只测试API密钥格式
    if (!modelId) {
      console.log('⚠️ 未提供模型ID，只验证API密钥格式');
      if (!apiKey || !apiKey.trim()) {
        throw new Error('API密钥为空');
      }
      // 简单的API密钥格式验证
      if (apiKey.length < 10) {
        throw new Error('API密钥格式可能不正确');
      }
      console.log('✅ API密钥格式验证通过');
      return true;
    }
    
    // 如果提供了模型ID，进行完整的API调用测试
    const testRequest: ImageGenerationRequest = {
      model: modelId,
      prompt: 'test image generation',
      size: '512x512',
      n: 1
    };
    
    await generateImageWithDoubao(testRequest, apiKey);
    console.log('✅ 豆包API连接测试成功');
    return true;
  } catch (error) {
    console.error('❌ 豆包API连接测试失败:', error);
    return false;
  }
}