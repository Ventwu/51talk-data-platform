import { Request, Response, NextFunction } from 'express';
import { executeQuery } from '../config/database';

/**
 * 操作日志记录中间件
 */
export const loggingMiddleware = (action: string, resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    // 重写res.send方法以捕获响应
    res.send = function(data: any) {
      res.locals.responseData = data;
      return originalSend.call(this, data);
    };
    
    // 重写res.json方法以捕获响应
    res.json = function(data: any) {
      res.locals.responseData = data;
      return originalJson.call(this, data);
    };
    
    // 监听响应完成事件
    res.on('finish', async () => {
      try {
        const userId = (req as any).user?.id;
        if (!userId) return; // 如果没有用户信息，不记录日志
        
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        const resourceId = req.params.id || req.body.id || null;
        
        // 构建详细信息
        const details: any = {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          userAgent: userAgent,
        };
        
        // 根据HTTP方法和状态码确定具体操作
        let specificAction = action;
        if (res.statusCode >= 200 && res.statusCode < 300) {
          switch (req.method) {
            case 'POST':
              specificAction = `创建${resourceType}`;
              if (req.body) {
                details.requestData = {
                  ...req.body,
                  password: req.body.password ? '***' : undefined, // 隐藏密码
                };
              }
              break;
            case 'PUT':
            case 'PATCH':
              specificAction = `更新${resourceType}`;
              if (req.body) {
                details.requestData = {
                  ...req.body,
                  password: req.body.password ? '***' : undefined,
                };
              }
              break;
            case 'DELETE':
              specificAction = `删除${resourceType}`;
              break;
            case 'GET':
              if (req.params.id) {
                specificAction = `查看${resourceType}`;
              } else {
                specificAction = `查询${resourceType}列表`;
              }
              break;
          }
        } else {
          specificAction = `${action}失败`;
          details.error = res.locals.responseData;
        }
        
        // 记录操作日志
        await executeQuery(
          `INSERT INTO operation_logs 
           (user_id, action, resource_type, resource_id, details, ip_address, user_agent) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            specificAction,
            resourceType,
            resourceId,
            JSON.stringify(details),
            ipAddress,
            userAgent,
          ]
        );
      } catch (error) {
        console.error('记录操作日志失败:', error);
        // 不影响主要业务流程
      }
    });
    
    next();
  };
};

/**
 * 手动记录操作日志的工具函数
 */
export const logOperation = async (
  userId: number,
  action: string,
  resourceType: string,
  resourceId?: string | number,
  details?: any,
  ipAddress?: string,
  userAgent?: string
) => {
  try {
    await executeQuery(
      `INSERT INTO operation_logs 
       (user_id, action, resource_type, resource_id, details, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        resourceType,
        resourceId?.toString() || null,
        details ? JSON.stringify(details) : null,
        ipAddress || null,
        userAgent || null,
      ]
    );
  } catch (error) {
    console.error('记录操作日志失败:', error);
  }
};

/**
 * 常用的操作日志记录中间件
 */
export const logUserOperation = loggingMiddleware('用户操作', '用户');
export const logDashboardOperation = loggingMiddleware('仪表盘操作', '仪表盘');
export const logDataSourceOperation = loggingMiddleware('数据源操作', '数据源');
export const logChartOperation = loggingMiddleware('图表操作', '图表');
export const logScheduleOperation = loggingMiddleware('定时任务操作', '定时任务');
export const logNotificationOperation = loggingMiddleware('通知配置操作', '通知配置');
export const logSystemOperation = loggingMiddleware('系统配置操作', '系统配置');