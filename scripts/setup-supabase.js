#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 颜色输出函数
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`
};

// 日志函数
const log = {
  info: (msg) => console.log(colors.blue('ℹ'), msg),
  success: (msg) => console.log(colors.green('✓'), msg),
  error: (msg) => console.log(colors.red('✗'), msg),
  warning: (msg) => console.log(colors.yellow('⚠'), msg),
  step: (msg) => console.log(colors.cyan('→'), msg)
};

// 加载环境变量
function loadEnvVariables() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local 文件不存在，请先配置 Supabase 环境变量');
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });

  return envVars;
}

// 创建 Supabase 客户端
function createSupabaseClient() {
  const env = loadEnvVariables();
  
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('缺少必要的 Supabase 环境变量');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// 重试机制
async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      log.warning(`操作失败，${delay}ms 后重试... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// 检查表是否存在
async function checkTableExists(supabase, tableName) {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);
    
    return !error && data && data.length > 0;
  } catch (error) {
    return false;
  }
}

// 检查存储桶是否存在
async function checkBucketExists(supabase, bucketName) {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);
    return !error && data;
  } catch (error) {
    return false;
  }
}

// 创建数据库表
async function createTables(supabase) {
  log.step('检查并创建数据库表...');
  
  const tableExists = await checkTableExists(supabase, 'generated_images');
  
  if (tableExists) {
    log.success('数据库表 generated_images 已存在');
    return true;
  }

  log.info('创建 generated_images 表...');
  log.warning('请在 Supabase 控制台的 SQL Editor 中执行以下 SQL:');
  
  const createTableSQL = `
-- 创建 generated_images 表
CREATE TABLE IF NOT EXISTS public.generated_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  image_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  width INTEGER NOT NULL DEFAULT 1024,
  height INTEGER NOT NULL DEFAULT 1024,
  quality TEXT DEFAULT 'standard',
  style TEXT DEFAULT 'natural',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON public.generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON public.generated_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_images_tags ON public.generated_images USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_generated_images_prompt ON public.generated_images USING GIN(to_tsvector('english', prompt));

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_generated_images_updated_at
  BEFORE UPDATE ON public.generated_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Users can view their own images" ON public.generated_images
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own images" ON public.generated_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own images" ON public.generated_images
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images" ON public.generated_images
  FOR DELETE USING (auth.uid() = user_id);

-- 授予权限
GRANT ALL PRIVILEGES ON public.generated_images TO authenticated;
GRANT SELECT ON public.generated_images TO anon;
  `;

  console.log('\n' + colors.cyan('='.repeat(60)));
  console.log(colors.yellow('请复制以下 SQL 到 Supabase 控制台执行:'));
  console.log(colors.cyan('='.repeat(60)));
  console.log(createTableSQL);
  console.log(colors.cyan('='.repeat(60)) + '\n');

  // 等待用户确认
  log.info('SQL 已显示，请手动在 Supabase 控制台执行');
  log.success('数据库表创建步骤完成（需手动执行 SQL）');
  return true;
}

// 创建存储桶
async function createStorageBucket(supabase) {
  log.step('检查并创建存储桶...');
  
  const bucketExists = await checkBucketExists(supabase, 'images');
  
  if (bucketExists) {
    log.success('存储桶 images 已存在');
    return true;
  }

  log.info('创建 images 存储桶...');
  
  const { error } = await supabase.storage.createBucket('images', {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 10485760 // 10MB
  });

  if (error) {
    log.warning(`存储桶创建失败: ${error.message}`);
    log.info('请在 Supabase 控制台手动创建 images 存储桶');
  } else {
    log.success('存储桶创建成功');
  }

  // 显示存储策略 SQL
  const storagePolicy = `
-- 存储桶策略（请在 Supabase 控制台的 SQL Editor 中执行）
CREATE POLICY "Users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'images'
  );

CREATE POLICY "Users can delete their images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
  `;

  console.log('\n' + colors.cyan('='.repeat(60)));
  console.log(colors.yellow('存储桶策略 SQL:'));
  console.log(colors.cyan('='.repeat(60)));
  console.log(storagePolicy);
  console.log(colors.cyan('='.repeat(60)) + '\n');

  return true;
}

// 验证设置
async function verifySetup(supabase) {
  log.step('验证数据库设置...');
  
  let hasIssues = false;
  
  // 验证表
  const tableExists = await checkTableExists(supabase, 'generated_images');
  if (tableExists) {
    log.success('✓ 数据库表 generated_images 存在');
  } else {
    log.warning('✗ 数据库表 generated_images 不存在');
    hasIssues = true;
  }
  
  // 验证存储桶
  const bucketExists = await checkBucketExists(supabase, 'images');
  if (bucketExists) {
    log.success('✓ 存储桶 images 存在');
  } else {
    log.warning('✗ 存储桶 images 不存在');
    hasIssues = true;
  }
  
  if (hasIssues) {
    log.warning('部分组件未正确设置，请按照上面的说明手动完成配置');
    return false;
  }
  
  // 测试数据库连接
  try {
    const { error } = await supabase
      .from('generated_images')
      .select('id')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 是空结果，这是正常的
      log.warning(`数据库连接测试警告: ${error.message}`);
    } else {
      log.success('✓ 数据库连接测试通过');
    }
  } catch (testError) {
    log.warning('数据库连接测试跳过（可能需要手动配置）');
  }
  
  log.success('数据库设置验证完成');
  return true;
}

// 主函数
async function main() {
  console.log(colors.cyan('🚀 Supabase 数据库自动设置工具\n'));
  
  try {
    log.step('加载环境变量...');
    const supabase = createSupabaseClient();
    log.success('Supabase 客户端创建成功');
    
    // 创建表
    await retryOperation(() => createTables(supabase));
    
    // 创建存储桶
    await retryOperation(() => createStorageBucket(supabase));
    
    // 验证设置
    await retryOperation(() => verifySetup(supabase));
    
    console.log('\n' + colors.green('🎉 Supabase 数据库设置向导完成！'));
    console.log(colors.cyan('\n📋 下一步操作:'));
    console.log('1. 打开 Supabase 控制台: https://supabase.com/dashboard');
    console.log('2. 进入您的项目 → SQL Editor');
    console.log('3. 执行上面显示的 SQL 语句');
    console.log('4. 重新运行此脚本验证设置: npm run setup-supabase');
    console.log(colors.cyan('\n完成后您就可以使用云端存储功能了！'));
    
  } catch (error) {
    console.log('\n' + colors.red('❌ 设置失败:'));
    log.error(error.message);
    
    console.log('\n' + colors.yellow('💡 故障排除建议:'));
    console.log('1. 检查 .env.local 文件中的 Supabase 配置');
    console.log('2. 确保 Supabase 项目已正确创建');
    console.log('3. 验证 SERVICE_ROLE_KEY 权限');
    console.log('4. 检查网络连接');
    
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  createSupabaseClient,
  createTables,
  createStorageBucket,
  verifySetup
};