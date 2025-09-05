import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { executeQuery } from '../config/database';

// 扩展Request接口以包含用户信息
export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
    created_at: Date;
    updated_at: Date;
  };
}

// JWT认证中间件
export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: '访问令牌缺失' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: '服务器配置错误' });
    }

    // 验证JWT令牌
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // 从数据库获取用户信息
    const users = await executeQuery(
      'SELECT id, username, email, role, status FROM users WHERE id = ? AND status = "active"',
      [decoded.userId]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({ message: '用户不存在或已被禁用' });
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: users[0].id,
      username: users[0].username,
      email: users[0].email,
      role: users[0].role,
      created_at: users[0].created_at || new Date(),
      updated_at: users[0].updated_at || new Date()
    };

    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: '无效的访问令牌' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: '访问令牌已过期' });
    }
    
    console.error('认证中间件错误:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
};

// 角色权限检查中间件
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: '用户未认证' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: '权限不足' });
    }

    return next();
  };
};

// 管理员权限中间件
export const adminMiddleware = roleMiddleware(['admin', 'super_admin']);

// 可选认证中间件（不强制要求登录）
export const optionalAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next();
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    const users = await executeQuery(
      'SELECT id, username, email, role, status FROM users WHERE id = ? AND status = "active"',
      [decoded.userId]
    );

    if (users && users.length > 0) {
      req.user = {
        id: users[0].id,
        username: users[0].username,
        email: users[0].email,
        role: users[0].role,
        created_at: users[0].created_at || new Date(),
        updated_at: users[0].updated_at || new Date()
      };
    }

    return next();
  } catch (error) {
    // 可选认证失败时不阻止请求继续
    return next();
  }
};