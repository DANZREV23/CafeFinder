// server/src/services/metricsService.ts
import { logger } from '../utils/logger.js';

interface RouteMetric {
  requests: number;
  errors4xx: number;
  errors5xx: number;
  totalMs: number;
  slowRequests: number;
}

interface OperationalEvent {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  event: string;
  message: string;
  details?: any;
}

class MetricsService {
  private routeMetrics: Map<string, RouteMetric> = new Map();
  private recentEvents: OperationalEvent[] = [];
  private readonly MAX_EVENTS = 100;
  private readonly SLOW_THRESHOLD_MS = parseInt(process.env.SLOW_REQUEST_MS || '1000');
  private readonly SLOW_DB_QUERY_MS = parseInt(process.env.SLOW_DB_QUERY_MS || '500');

  recordRequest(route: string, statusCode: number, durationMs: number, requestId: string, method: string) {
    let metric = this.routeMetrics.get(route);
    if (!metric) {
      metric = {
        requests: 0,
        errors4xx: 0,
        errors5xx: 0,
        totalMs: 0,
        slowRequests: 0
      };
      this.routeMetrics.set(route, metric);
    }

    metric.requests++;
    metric.totalMs += durationMs;

    if (statusCode >= 500) {
      metric.errors5xx++;
    } else if (statusCode >= 400) {
      metric.errors4xx++;
    }

    if (durationMs > this.SLOW_THRESHOLD_MS) {
      metric.slowRequests++;
      logger.warn(`slow_request: ${method} ${route} took ${durationMs}ms`, {
        requestId,
        method,
        route,
        statusCode,
        durationMs,
        event: 'performance.slow_request'
      });
      
      this.recordEvent('WARN', 'slow_request', `${method} ${route} took ${durationMs}ms`, {
        requestId,
        durationMs,
        statusCode
      });
    }
  }

  recordOperation(type: string, name: string, durationMs: number, details?: any) {
    const threshold = type === 'database' ? this.SLOW_DB_QUERY_MS : this.SLOW_THRESHOLD_MS;
    
    if (durationMs > threshold) {
      logger.warn(`slow_operation: ${type}:${name} took ${durationMs}ms`, {
        type,
        name,
        durationMs,
        ...details,
        event: 'performance.slow_operation'
      });

      this.recordEvent('WARN', 'slow_operation', `${type}:${name} took ${durationMs}ms`, {
        type,
        name,
        durationMs,
        ...details
      });
    }
  }

  recordEvent(level: 'INFO' | 'WARN' | 'ERROR', event: string, message: string, details?: any) {
    const operationalEvent: OperationalEvent = {
      timestamp: new Date().toISOString(),
      level,
      event,
      message,
      details
    };

    this.recentEvents.unshift(operationalEvent);
    
    // Maintain bounded size
    if (this.recentEvents.length > this.MAX_EVENTS) {
      this.recentEvents.pop();
    }

    // Also log via standard logger
    if (level === 'ERROR') {
      logger.error(message, details, { event });
    } else if (level === 'WARN') {
      logger.warn(message, { event, details });
    } else {
      logger.info(message, { event, details });
    }
  }

  getMetrics() {
    const result: any[] = [];
    this.routeMetrics.forEach((metric, route) => {
      result.push({
        route,
        requests: metric.requests,
        errors4xx: metric.errors4xx,
        errors5xx: metric.errors5xx,
        averageMs: Math.round(metric.totalMs / metric.requests),
        slowRequests: metric.slowRequests
      });
    });
    return result;
  }

  getRecentEvents() {
    return this.recentEvents;
  }

  resetMetrics() {
    this.routeMetrics.clear();
  }
}

export const metricsService = new MetricsService();
