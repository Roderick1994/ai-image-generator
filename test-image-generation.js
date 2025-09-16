// 测试图像生成功能
const testImageGeneration = async () => {
  console.log('🧪 开始测试图像生成功能...');
  
  const testData = {
    prompt: '一只可爱的小猫',
    negative_prompt: '',
    width: 1024,
    height: 1024,
    num_inference_steps: 20,
    guidance_scale: 7.5,
    scheduler: 'DPMSolverMultistep',
    seed: Math.floor(Math.random() * 1000000)
  };
  
  try {
    console.log('📤 发送请求到 /api/generate...');
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    console.log('📥 响应状态:', response.status);
    const result = await response.json();
    console.log('📋 响应结果:', result);
    
    if (result.success && result.imageUrl) {
      console.log('✅ 测试成功！图像生成正常');
      console.log('🖼️ 图像URL:', result.imageUrl);
      return true;
    } else {
      console.log('❌ 测试失败：没有返回图像URL');
      return false;
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return false;
  }
};

// 运行测试
testImageGeneration().then(success => {
  console.log(success ? '🎉 所有测试通过！' : '💥 测试失败！');
  process.exit(success ? 0 : 1);
});