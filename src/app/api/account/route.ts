import { NextRequest, NextResponse } from 'next/server';

// Validate API token
function validateApiToken(token: string | undefined): { isValid: boolean; error?: string; type?: string } {
  if (!token) {
    return {
      isValid: false,
      error: 'DOUBAO API key is not configured. Please add your API key to continue.',
      type: 'configuration_error'
    };
  }

  if (token === 'your_doubao_api_key_here' || token.includes('your_') || token.includes('_here')) {
    return {
      isValid: false,
      error: 'Please replace the placeholder with your actual DOUBAO API key.',
      type: 'configuration_error'
    };
  }

  if (token.length < 10) {
    return {
      isValid: false,
      error: 'Invalid DOUBAO API key format. Please check your API key.',
      type: 'authentication_error'
    };
  }

  return { isValid: true };
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 开始检查账户状态...');
    const token = process.env.DOUBAO_API_KEY;
    console.log('🔑 API密钥状态:', token ? `已配置 (${token.substring(0, 8)}...)` : '未配置');
    
    // Validate token
    const validation = validateApiToken(token);
    console.log('✅ 密钥验证结果:', validation);
    if (!validation.isValid) {
      console.log('❌ 密钥验证失败:', validation.error);
      return NextResponse.json(
        {
          error: validation.error,
          type: validation.type,
          action: 'Please configure your DOUBAO API key in the environment variables.'
        },
        { status: 401 }
      );
    }

    // Try to validate the API key by making a test call to DOUBAO API
    try {
      console.log('🌐 开始测试豆包API连接...');
      
      // Import the test function from doubaoApi service
      const { testDoubaoConnection } = await import('@/services/doubaoApi');
      
      // Test the API key (without endpoint ID, just basic validation)
      const isValid = await testDoubaoConnection(token!);
      
      console.log('✅ 豆包API密钥测试结果:', isValid);
      
      if (isValid) {
        return NextResponse.json({
          status: 'active',
          message: 'DOUBAO API key is valid and ready to generate images',
          hasAccess: true
        });
      } else {
        return NextResponse.json(
          {
            error: 'Invalid DOUBAO API key format or configuration.',
            type: 'authentication_error',
            action: 'Please verify your DOUBAO API key is correct.',
            status: 'unauthorized',
            hasAccess: false
          },
          { status: 401 }
        );
      }
    } catch (error: any) {
      console.error('💥 账户检查错误:', error);
      console.error('❌ 错误类型:', error.constructor.name);
      console.error('📝 错误消息:', error.message);
      console.error('🔍 错误堆栈:', error.stack);
      
      return NextResponse.json(
        {
          error: 'Unable to validate DOUBAO API key. Please check your configuration.',
          type: 'api_error',
          action: 'Please verify your API key and internet connection.',
          status: 'unknown',
          hasAccess: false,
          debug: {
            errorType: error.constructor.name,
            errorMessage: error.message
          }
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Account status check failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to check account status',
        type: 'server_error',
        action: 'Please try again later.'
      },
      { status: 500 }
    );
  }
}