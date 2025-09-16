// 测试豆包端点ID配置
const testEndpointConfig = async () => {
  console.log('🔍 测试豆包端点ID配置...');
  
  try {
    // 测试API健康检查
    const healthResponse = await fetch('http://localhost:3000/api/generate', {
      method: 'GET'
    });
    
    const healthResult = await healthResponse.json();
    console.log('✅ API健康检查:', healthResult);
    
    // 测试带有有效端点ID的请求
    const testRequest = {
      prompt: '一只可爱的小猫',
      model: 'ep-20241220161728-xxxxx', // 这是示例值，需要替换为真实的端点ID
      size: '1024x1024',
      n: 1
    };
    
    console.log('📤 发送测试请求:', testRequest);
    
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testRequest)
    });
    
    const result = await response.json();
    console.log('📥 响应状态:', response.status);
    console.log('📋 响应结果:', result);
    
    if (result.error) {
      console.error('❌ 错误信息:', result.error);
      if (result.error.includes('端点') || result.error.includes('endpoint')) {
        console.log('💡 解决方案:');
        console.log('1. 登录火山方舟控制台: https://console.volcengine.com/ark');
        console.log('2. 创建豆包图像生成推理端点');
        console.log('3. 获取以"ep-"开头的端点ID');
        console.log('4. 在前端表单中输入真实的端点ID');
      }
    } else if (result.success) {
      console.log('🎉 图像生成成功!');
      console.log('🖼️ 图像URL:', result.imageUrl);
    }
    
  } catch (error) {
    console.error('💥 测试失败:', error.message);
  }
};

// 运行测试
testEndpointConfig();