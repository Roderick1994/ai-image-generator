// 测试前端修复后的图像生成功能
const fetch = require('node-fetch');

async function testImageGeneration() {
  console.log('🧪 测试图像生成功能...');
  
  const testData = {
    prompt: '一只可爱的小猫',
    model: 'server-configured', // 这个值会被服务器端忽略
    size: '1024x1024',
    quality: 'standard',
    style: 'vivid',
    n: 1
  };
  
  try {
    console.log('📤 发送请求到 /api/generate...');
    console.log('请求数据:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📥 响应状态:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 请求失败:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ 响应成功!');
    console.log('响应数据:', JSON.stringify(result, null, 2));
    
    // 验证响应格式
    if (result.success && result.imageUrl && result.images) {
      console.log('🎉 图像生成成功!');
      console.log('🖼️ 图像URL:', result.imageUrl);
      console.log('📊 图像数量:', result.images.length);
      
      // 验证图像URL是否有效
      if (result.imageUrl.startsWith('https://')) {
        console.log('✅ 图像URL格式正确');
      } else {
        console.log('⚠️ 图像URL格式可能有问题');
      }
    } else {
      console.log('❌ 响应格式不正确');
      console.log('期望格式: {success: true, imageUrl: string, images: array}');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testImageGeneration();