import { Request, Response, NextFunction } from 'express';

// 自定义错误类
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 错误处理中间件
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  // 记录错误日志
  console.error('错误详情:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // MySQL错误处理
  if (err.code === 'ER_DUP_ENTRY') {
    const message = '数据已存在，请检查重复项';
    error = new AppError(message, 400);
  }

  if (err.code === 'ER_NO_SUCH_TABLE') {
    const message = '数据表不存在';
    error = new AppError(message, 500);
  }

  if (err.code === 'ER_BAD_FIELD_ERROR') {
    const message = '数据字段错误';
    error = new AppError(message, 400);
  }

  // JWT错误处理
  if (err.name === 'JsonWebTokenError') {
    const message = '无效的访问令牌';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = '访问令牌已过期';
    error = new AppError(message, 401);
  }

  // 验证错误处理
  if (err.name === 'ValidationError') {
    const message = '数据验证失败';
    error = new AppError(message, 400);
  }

  // 类型转换错误
  if (err.name === 'CastError') {
    const message = '数据格式错误';
    error = new AppError(message, 400);
  }

  // 文件上传错误
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = '文件大小超出限制';
    error = new AppError(message, 400);
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = '文件数量超出限制';
    error = new AppError(message, 400);
  }

  // 网络连接错误
  if (err.code === 'ECONNREFUSED') {
    const message = '数据库连接失败';
    error = new AppError(message, 500);
  }

  if (err.code === 'ETIMEDOUT') {
    const message = '请求超时';
    error = new AppError(message, 408);
  }

  // 默认错误响应
  const statusCode = error.statusCode || 500;
  const message = error.message || '服务器内部错误';

  // 开发环境返回详细错误信息
  const isDevelopment = process.env.NODE_ENV === 'development';

  const errorResponse: any = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  };

  // 开发环境添加错误堆栈
  if (isDevelopment) {
    errorResponse.stack = err.stack;
    errorResponse.details = err;
  }

  // 生产环境不暴露敏感信息
  if (!isDevelopment && statusCode === 500) {
    errorResponse.message = '服务器内部错误';
  }

  res.status(statusCode).json(errorResponse);
};

// 异步错误捕获包装器
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404错误处理
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`接口 ${req.originalUrl} 不存在`, 404);
  next(error);
};

// 未捕获异常处理
process.on('uncaughtException', (err: Error) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});

// 未处理的Promise拒绝
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});