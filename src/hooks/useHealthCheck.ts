'use client';

import { useState, useEffect, useCallback } from 'react';

// 健康状态接口
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'checking';
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

interface UseHealthCheckOptions {
  interval?: number; // 检查间隔（毫秒）
  enabled?: boolean; // 是否启用自动检查
  onStatusChange?: (status: HealthStatus) => void; // 状态变化回调
}

interface UseHealthCheckReturn {
  health: HealthStatus | null;
  isChecking: boolean;
  error: string | null;
  checkHealth: () => Promise<void>;
  isHealthy: boolean;
  isDegraded: boolean;
  isUnhealthy: boolean;
}

export function useHealthCheck(options: UseHealthCheckOptions = {}): UseHealthCheckReturn {
  const {
    interval = 60000, // 默认1分钟检查一次
    enabled = true,
    onStatusChange
  } = options;

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 执行健康检查
  const checkHealth = useCallback(async () => {
    if (isChecking) return; // 防止重复检查
    
    setIsChecking(true);
    setError(null);

    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        // 设置较短的超时时间
        signal: AbortSignal.timeout(15000)
      });

      const healthData = await response.json();
      
      setHealth(healthData);
      
      // 触发状态变化回调
      if (onStatusChange) {
        onStatusChange(healthData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Health check failed';
      setError(errorMessage);
      
      // 设置错误状态
      const errorHealth: HealthStatus = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          doubao: {
            status: 'down',
            lastCheck: new Date().toISOString(),
            error: errorMessage
          }
        },
        uptime: 0
      };
      
      setHealth(errorHealth);
      
      if (onStatusChange) {
        onStatusChange(errorHealth);
      }
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, onStatusChange]);

  // 自动健康检查
  useEffect(() => {
    if (!enabled) return;

    // 立即执行一次检查
    checkHealth();

    // 设置定时检查
    const intervalId = setInterval(checkHealth, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, interval, checkHealth]);

  // 计算便捷状态
  const isHealthy = health?.status === 'healthy';
  const isDegraded = health?.status === 'degraded';
  const isUnhealthy = health?.status === 'unhealthy';

  return {
    health,
    isChecking,
    error,
    checkHealth,
    isHealthy,
    isDegraded,
    isUnhealthy
  };
}

// 健康状态显示组件的辅助函数
export function getHealthStatusColor(status: string): string {
  switch (status) {
    case 'healthy':
    case 'up':
      return 'text-green-600';
    case 'degraded':
      return 'text-yellow-600';
    case 'unhealthy':
    case 'down':
      return 'text-red-600';
    case 'checking':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
}

export function getHealthStatusIcon(status: string): string {
  switch (status) {
    case 'healthy':
    case 'up':
      return '🟢';
    case 'degraded':
      return '🟡';
    case 'unhealthy':
    case 'down':
      return '🔴';
    case 'checking':
      return '🔵';
    default:
      return '⚪';
  }
}

export function getHealthStatusText(status: string): string {
  switch (status) {
    case 'healthy':
      return '服务正常';
    case 'degraded':
      return '服务降级';
    case 'unhealthy':
      return '服务异常';
    case 'up':
      return '正常';
    case 'down':
      return '异常';
    case 'checking':
      return '检查中';
    default:
      return '未知';
  }
}