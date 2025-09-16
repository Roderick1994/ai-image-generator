import { NextRequest, NextResponse } from 'next/server';

// API健康检查状态接口
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    doubao: {
      status: 'up' | 'down' | 'degraded';
      responseTime?: number;
      lastCheck: string;
      error?: string;
    };
  };
  uptime: number;
}

// 全局健康状态缓存
let healthCache: HealthStatus | null = null;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30000; // 30秒缓存

// 验证API密钥
function validateApiToken(): { isValid: boolean; error?: string } {
  const token = process.env.DOUBAO_API_KEY;
  
  if (!token) {
    return {
      isValid: false,
      error: 'DOUBAO API key is not configured'
    };
  }
  
  if (token === 'your_doubao_api_key_here' || token.includes('your_') || token.includes('_here')) {
    return {
      isValid: false,
      error: 'DOUBAO API key is still set to placeholder value'
    };
  }
  
  return { isValid: true };
}

// 检查豆包API健康状态
async function checkDoubaoHealth(): Promise<{
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // 验证API密钥
    const tokenValidation = validateApiToken();
    if (!tokenValidation.isValid) {
      return {
        status: 'down',
        error: tokenValidation.error
      };
    }

    // 发送简单的健康检查请求
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.DOUBAO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000) // 10秒超时
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        status: responseTime > 5000 ? 'degraded' : 'up',
        responseTime
      };
    } else if (response.status >= 500) {
      return {
        status: 'down',
        responseTime,
        error: `Server error: ${response.status}`
      };
    } else {
      return {
        status: 'degraded',
        responseTime,
        error: `API error: ${response.status}`
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'down',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 获取系统健康状态
async function getHealthStatus(): Promise<HealthStatus> {
  const now = Date.now();
  
  // 如果缓存有效，直接返回
  if (healthCache && (now - lastHealthCheck) < HEALTH_CHECK_INTERVAL) {
    return healthCache;
  }

  // 检查豆包API健康状态
  const doubaoHealth = await checkDoubaoHealth();
  
  // 计算整体状态
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (doubaoHealth.status === 'up') {
    overallStatus = 'healthy';
  } else if (doubaoHealth.status === 'degraded') {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'unhealthy';
  }

  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services: {
      doubao: {
        ...doubaoHealth,
        lastCheck: new Date().toISOString()
      }
    },
    uptime: process.uptime()
  };

  // 更新缓存
  healthCache = healthStatus;
  lastHealthCheck = now;

  return healthStatus;
}

// GET /api/health - 获取健康状态
export async function GET(request: NextRequest) {
  try {
    const healthStatus = await getHealthStatus();
    
    // 根据健康状态设置HTTP状态码
    let httpStatus = 200;
    if (healthStatus.status === 'degraded') {
      httpStatus = 200; // 部分可用
    } else if (healthStatus.status === 'unhealthy') {
      httpStatus = 503; // 服务不可用
    }

    return NextResponse.json(healthStatus, { status: httpStatus });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          doubao: {
            status: 'down',
            lastCheck: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Health check failed'
          }
        },
        uptime: process.uptime()
      },
      { status: 503 }
    );
  }
}

// POST /api/health - 强制刷新健康状态
export async function POST(request: NextRequest) {
  try {
    // 清除缓存，强制重新检查
    healthCache = null;
    lastHealthCheck = 0;
    
    const healthStatus = await getHealthStatus();
    
    return NextResponse.json({
      message: 'Health status refreshed',
      ...healthStatus
    });
  } catch (error) {
    console.error('Health refresh failed:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to refresh health status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}