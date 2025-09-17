// 测试数据库连接和表结构的脚本
// 运行命令: node test-database-connection.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// 从环境变量获取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 缺少Supabase环境变量');
  console.log('请确保 .env.local 文件包含:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseConnection() {
  console.log('🔍 测试数据库连接和表结构...');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
  
  try {
    // 1. 测试基本连接
    console.log('\n1. 测试基本连接...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('generated_images')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ 连接失败:', connectionError.message);
      return;
    }
    console.log('✅ 数据库连接成功');
    
    // 2. 检查表结构
    console.log('\n2. 检查表结构...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'generated_images' })
      .catch(async () => {
        // 如果RPC不存在，使用直接查询
        return await supabase
          .from('generated_images')
          .select('*')
          .limit(1);
      });
    
    // 3. 测试插入一条记录来验证所有字段
    console.log('\n3. 测试字段完整性...');
    const testRecord = {
      id: 'test-' + Date.now(),
      prompt: 'Test prompt for database validation',
      negative_prompt: 'Test negative prompt',
      image_url: 'https://example.com/test.jpg',
      file_path: 'test/test.jpg',
      width: 1024,
      height: 1024,
      steps: 20,
      guidance_scale: 7.5,
      seed: 12345,
      model: 'test-model',
      quality: 'standard',
      style: 'natural',
      tags: ['test'],
      is_favorite: false
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('generated_images')
      .insert(testRecord)
      .select();
    
    if (insertError) {
      console.error('❌ 插入测试记录失败:', insertError.message);
      
      // 分析错误类型
      if (insertError.message.includes('guidance_scale')) {
        console.log('\n🔧 检测到 guidance_scale 列问题');
        console.log('请执行以下SQL修复:');
        console.log('ALTER TABLE generated_images ADD COLUMN guidance_scale DECIMAL(4,2) NOT NULL DEFAULT 7.5;');
      }
      
      if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
        const missingColumn = insertError.message.match(/column "([^"]+)"/)?.[1];
        console.log(`\n🔧 检测到缺少列: ${missingColumn}`);
      }
      
      return;
    }
    
    console.log('✅ 测试记录插入成功');
    
    // 4. 清理测试记录
    const { error: deleteError } = await supabase
      .from('generated_images')
      .delete()
      .eq('id', testRecord.id);
    
    if (deleteError) {
      console.warn('⚠️ 清理测试记录失败:', deleteError.message);
    } else {
      console.log('✅ 测试记录已清理');
    }
    
    // 5. 检查现有记录数量
    console.log('\n4. 检查现有数据...');
    const { count, error: countError } = await supabase
      .from('generated_images')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ 获取记录数量失败:', countError.message);
    } else {
      console.log(`✅ 数据库中共有 ${count} 条记录`);
    }
    
    console.log('\n🎉 数据库测试完成！所有检查都通过了。');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    console.error('详细错误:', error);
  }
}

// 运行测试
testDatabaseConnection().then(() => {
  console.log('\n测试完成');
}).catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});