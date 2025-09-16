import { createClient } from '@supabase/supabase-js';

// 数据库初始化状态
let initializationPromise: Promise<boolean> | null = null;
let isInitialized = false;

// 日志函数（仅在开发环境输出）
const log = {
  info: (msg: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 [Supabase Init]', msg);
    }
  },
  success: (msg: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [Supabase Init]', msg);
    }
  },
  error: (msg: string) => {
    console.error('❌ [Supabase Init]', msg);
  },
  warning: (msg: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ [Supabase Init]', msg);
    }
  }
};

// 创建 Supabase 客户端
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('缺少必要的 Supabase 环境变量');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// 检查表是否存在
async function checkTableExists(supabase: any, tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    // 如果没有错误或者错误是空结果，说明表存在
    return !error || error.code === 'PGRST116';
  } catch (error) {
    return false;
  }
}

// 检查存储桶是否存在
async function checkBucketExists(supabase: any, bucketName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);
    return !error && data;
  } catch (error) {
    return false;
  }
}

// 创建数据库表（简化版，主要用于检查）
async function ensureTableExists(supabase: any): Promise<boolean> {
  const tableExists = await checkTableExists(supabase, 'generated_images');
  
  if (tableExists) {
    log.success('数据库表 generated_images 已存在');
    return true;
  }

  log.warning('数据库表不存在，请运行 npm run setup-supabase 进行初始化');
  return false;
}

// 创建存储桶（简化版，主要用于检查）
async function ensureBucketExists(supabase: any): Promise<boolean> {
  const bucketExists = await checkBucketExists(supabase, 'images');
  
  if (bucketExists) {
    log.success('存储桶 images 已存在');
    return true;
  }

  log.warning('存储桶不存在，请运行 npm run setup-supabase 进行初始化');
  return false;
}

// 快速验证数据库状态
async function quickValidation(supabase: any): Promise<boolean> {
  try {
    // 并行检查表和存储桶
    const [tableExists, bucketExists] = await Promise.all([
      checkTableExists(supabase, 'generated_images'),
      checkBucketExists(supabase, 'images')
    ]);

    if (tableExists && bucketExists) {
      log.success('数据库状态验证通过');
      return true;
    }

    if (!tableExists) {
      log.warning('数据库表 generated_images 不存在');
    }
    if (!bucketExists) {
      log.warning('存储桶 images 不存在');
    }
    
    log.info('请运行 npm run setup-supabase 完成数据库初始化');
    return false;
  } catch (error) {
    log.error(`数据库验证失败: ${error instanceof Error ? error.message : '未知错误'}`);
    return false;
  }
}

// 初始化数据库（主函数）
export async function initializeSupabaseDatabase(): Promise<boolean> {
  // 如果已经初始化过，直接返回结果
  if (isInitialized) {
    return true;
  }

  // 如果正在初始化，等待初始化完成
  if (initializationPromise) {
    return await initializationPromise;
  }

  // 开始初始化
  initializationPromise = (async () => {
    try {
      log.info('开始数据库状态检查...');
      
      const supabase = createSupabaseClient();
      
      // 快速验证数据库状态
      const isValid = await quickValidation(supabase);
      
      if (isValid) {
        isInitialized = true;
        log.success('数据库初始化检查完成');
        return true;
      } else {
        log.warning('数据库未完全初始化，某些功能可能不可用');
        return false;
      }
    } catch (error) {
      log.error(`数据库初始化失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return false;
    }
  })();

  return await initializationPromise;
}

// 重置初始化状态（用于测试或重新初始化）
export function resetInitializationState(): void {
  initializationPromise = null;
  isInitialized = false;
}

// 获取初始化状态
export function getInitializationStatus(): {
  isInitialized: boolean;
  isInitializing: boolean;
} {
  return {
    isInitialized,
    isInitializing: initializationPromise !== null && !isInitialized
  };
}

// 手动触发完整初始化（调用设置脚本）
export async function runFullSetup(): Promise<boolean> {
  try {
    log.info('开始完整数据库设置...');
    
    // 在浏览器环境中，我们不能直接运行 Node.js 脚本
    // 这里提供一个提示信息
    if (typeof window !== 'undefined') {
      log.warning('请在终端中运行: npm run setup-supabase');
      return false;
    }

    // 在服务器端，也不应该动态导入 Node.js 脚本
    // 因为这会导致打包工具尝试处理 Node.js 专用模块
    log.warning('请在终端中运行: npm run setup-supabase');
    log.info('设置脚本需要在 Node.js 环境中独立运行，不能在应用程序中直接调用');
    return false;
  } catch (error) {
    log.error(`完整设置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    return false;
  }
}

// 导出便捷函数
export { createSupabaseClient };

// 默认导出初始化函数
export default initializeSupabaseDatabase;