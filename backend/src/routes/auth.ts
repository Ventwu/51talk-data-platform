import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { executeQuery } from '../config/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 用户注册
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password, role = 'user' } = req.body;

  // 验证必填字段
  if (!username || !email || !password) {
    throw new AppError('用户名、邮箱和密码不能为空', 400);
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('邮箱格式不正确', 400);
  }

  // 验证密码强度
  if (password.length < 6) {
    throw new AppError('密码长度至少6位', 400);
  }

  // 检查用户是否已存在
  const existingUsers = await executeQuery(
    'SELECT id FROM users WHERE username = ? OR email = ?',
    [username, email]
  );

  if (existingUsers.length > 0) {
    throw new AppError('用户名或邮箱已存在', 400);
  }

  // 加密密码
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // 创建用户
  const result = await executeQuery(
    'INSERT INTO users (username, email, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, "active", datetime("now"))',
    [username, email, hashedPassword, role]
  );

  res.status(201).json({
    success: true,
    message: '用户注册成功',
    data: {
      id: result.insertId,
      username,
      email,
      role
    }
  });
}));

// 用户登录
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // 验证必填字段
  if (!email || !password) {
    throw new AppError('邮箱和密码不能为空', 400);
  }

  // 查找用户
  const users = await executeQuery(
    'SELECT id, username, email, password_hash, role, status FROM users WHERE email = ? AND status = "active"',
    [email]
  );

  if (users.length === 0) {
    throw new AppError('用户名或密码错误', 401);
  }

  const user = users[0];

  // 验证密码
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('用户名或密码错误', 401);
  }

  // 生成JWT令牌
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new AppError('服务器配置错误', 500);
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );

  // 更新最后登录时间
  await executeQuery(
    'UPDATE users SET last_login_at = datetime("now") WHERE id = ?',
    [user.id]
  );

  res.json({
    success: true,
    message: '登录成功',
    data: {
      access_token: token,
      refresh_token: token, // 暂时使用相同的token，后续可以实现真正的refresh token
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    }
  });
}));

// 获取当前用户信息
router.get('/me', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  const users = await executeQuery(
    'SELECT id, username, email, role, created_at, last_login_at FROM users WHERE id = ?',
    [userId]
  );

  if (users.length === 0) {
    throw new AppError('用户不存在', 404);
  }

  res.json({
    success: true,
    data: users[0]
  });
}));

// 修改密码
router.put('/change-password', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.id;

  // 验证必填字段
  if (!currentPassword || !newPassword) {
    throw new AppError('当前密码和新密码不能为空', 400);
  }

  // 验证新密码强度
  if (newPassword.length < 6) {
    throw new AppError('新密码长度至少6位', 400);
  }

  // 获取用户当前密码
  const users = await executeQuery(
    'SELECT password_hash FROM users WHERE id = ?',
    [userId]
  );

  if (users.length === 0) {
    throw new AppError('用户不存在', 404);
  }

  // 验证当前密码
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password_hash);
  if (!isCurrentPasswordValid) {
    throw new AppError('当前密码错误', 400);
  }

  // 加密新密码
  const saltRounds = 12;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // 更新密码
  await executeQuery(
    'UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?',
    [hashedNewPassword, userId]
  );

  res.json({
    success: true,
    message: '密码修改成功'
  });
}));

// 刷新令牌
router.post('/refresh', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new AppError('用户信息不存在', 401);
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new AppError('服务器配置错误', 500);
  }

  // 生成新的JWT令牌
  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );

  res.json({
    success: true,
    message: '令牌刷新成功',
    data: { token }
  });
}));

// 登出（客户端处理，服务端记录日志）
router.post('/logout', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  // 这里可以添加登出日志记录
  console.log(`用户 ${req.user?.username} 已登出`);
  
  res.json({
    success: true,
    message: '登出成功'
  });
}));

export default router;