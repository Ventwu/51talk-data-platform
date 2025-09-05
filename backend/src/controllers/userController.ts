import { Request, Response } from 'express';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

/**
 * 用户管理控制器
 */
export class UserController {
  /**
   * 获取用户列表
   */
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const { 
        search, 
        role, 
        status, 
        page = 1, 
        limit = 10 
      } = req.query;
      
      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};
      
      // 搜索条件
      if (search) {
        whereClause[Op.or] = [
          { username: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { realName: { [Op.like]: `%${search}%` } },
        ];
      }
      
      if (role) {
        whereClause.role = role;
      }
      
      if (status) {
        whereClause.status = status;
      }
      
      const { rows: users, count } = await User.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['password'] }, // 排除密码字段
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']],
      });
      
      res.json({
        success: true,
        data: {
          users,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(count / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error('获取用户列表失败:', error);
      throw new AppError('获取用户列表失败', 500);
    }
  }
  
  /**
   * 获取单个用户信息
   */
  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
      });
      
      if (!user) {
        throw new AppError('用户不存在', 404);
      }
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw new AppError('获取用户信息失败', 500);
    }
  }
  
  /**
   * 获取当前用户信息
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        throw new AppError('用户未认证', 401);
      }
      
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
      });
      
      if (!user) {
        throw new AppError('用户不存在', 404);
      }
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('获取当前用户信息失败:', error);
      throw new AppError('获取当前用户信息失败', 500);
    }
  }
  
  /**
   * 创建用户
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { 
        username, 
        email, 
        password, 
        realName, 
        role = 'user', 
        isActive = true 
      } = req.body;
      
      // 检查用户名和邮箱是否已存在
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { username },
            { email },
          ],
        },
      });
      
      if (existingUser) {
        if (existingUser.username === username) {
          throw new AppError('用户名已存在', 400);
        }
        if (existingUser.email === email) {
          throw new AppError('邮箱已存在', 400);
        }
      }
      
      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        realName,
        role,
        isActive,
      });
      
      // 返回用户信息（不包含密码）
      const userResponse = newUser.toJSON();
      delete (userResponse as any).password;
      
      res.status(201).json({
        success: true,
        data: userResponse,
        message: '用户创建成功',
      });
    } catch (error) {
      console.error('创建用户失败:', error);
      throw new AppError('创建用户失败', 500);
    }
  }
  
  /**
   * 更新用户信息
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { username, email, realName, role, status } = req.body;
      
      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('用户不存在', 404);
      }
      
      // 检查用户名和邮箱是否已被其他用户使用
      if (username || email) {
        const whereClause: any = {
          id: { [Op.ne]: id },
        };
        
        const orConditions = [];
        if (username) orConditions.push({ username });
        if (email) orConditions.push({ email });
        
        if (orConditions.length > 0) {
          whereClause[Op.or] = orConditions;
          
          const existingUser = await User.findOne({ where: whereClause });
          if (existingUser) {
            if (existingUser.username === username) {
              throw new AppError('用户名已存在', 400);
            }
            if (existingUser.email === email) {
              throw new AppError('邮箱已存在', 400);
            }
          }
        }
      }
      
      await user.update({
        ...(username && { username }),
        ...(email && { email }),
        ...(realName && { realName }),
        ...(role && { role }),
        ...(status && { status }),
      });
      
      // 返回更新后的用户信息（不包含密码）
      const userResponse = user.toJSON();
      delete (userResponse as any).password;
      
      res.json({
        success: true,
        data: userResponse,
        message: '用户信息更新成功',
      });
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw new AppError('更新用户信息失败', 500);
    }
  }
  
  /**
   * 更新当前用户信息
   */
  async updateCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { username, email, realName } = req.body;
      
      if (!userId) {
        throw new AppError('用户未认证', 401);
      }
      
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('用户不存在', 404);
      }
      
      // 检查用户名和邮箱是否已被其他用户使用
      if (username || email) {
        const whereClause: any = {
          id: { [Op.ne]: userId },
        };
        
        const orConditions = [];
        if (username) orConditions.push({ username });
        if (email) orConditions.push({ email });
        
        if (orConditions.length > 0) {
          whereClause[Op.or] = orConditions;
          
          const existingUser = await User.findOne({ where: whereClause });
          if (existingUser) {
            if (existingUser.username === username) {
              throw new AppError('用户名已存在', 400);
            }
            if (existingUser.email === email) {
              throw new AppError('邮箱已存在', 400);
            }
          }
        }
      }
      
      await user.update({
        ...(username && { username }),
        ...(email && { email }),
        ...(realName && { realName }),
      });
      
      // 返回更新后的用户信息（不包含密码）
      const userResponse = user.toJSON();
      delete (userResponse as any).password;
      
      res.json({
        success: true,
        data: userResponse,
        message: '个人信息更新成功',
      });
    } catch (error) {
      console.error('更新个人信息失败:', error);
      throw new AppError('更新个人信息失败', 500);
    }
  }
  
  /**
   * 修改密码
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!userId) {
        throw new AppError('用户未认证', 401);
      }
      
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('用户不存在', 404);
      }
      
      // 验证当前密码
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new AppError('当前密码错误', 400);
      }
      
      // 加密新密码
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      
      await user.update({ password: hashedNewPassword });
      
      res.json({
        success: true,
        message: '密码修改成功',
      });
    } catch (error) {
      console.error('修改密码失败:', error);
      throw new AppError('修改密码失败', 500);
    }
  }
  
  /**
   * 删除用户
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.id;
      
      // 不能删除自己
      if (id === currentUserId) {
        throw new AppError('不能删除自己的账户', 400);
      }
      
      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('用户不存在', 404);
      }
      
      await user.destroy();
      
      res.json({
        success: true,
        message: '用户删除成功',
      });
    } catch (error) {
      console.error('删除用户失败:', error);
      throw new AppError('删除用户失败', 500);
    }
  }
  
  /**
   * 重置用户密码
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      
      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('用户不存在', 404);
      }
      
      // 加密新密码
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      await user.update({ password: hashedPassword });
      
      res.json({
        success: true,
        message: '密码重置成功',
      });
    } catch (error) {
      console.error('重置密码失败:', error);
      throw new AppError('重置密码失败', 500);
    }
  }
  
  /**
   * 获取用户统计信息
   */
  async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { isActive: true } });
      const adminUsers = await User.count({ where: { role: 'admin' } });
      const userUsers = await User.count({ where: { role: 'user' } });
      
      res.json({
        success: true,
        data: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          admin: adminUsers,
          user: userUsers,
        },
      });
    } catch (error) {
      console.error('获取用户统计信息失败:', error);
      throw new AppError('获取用户统计信息失败', 500);
    }
  }
}

// 导出控制器实例
export const userController = new UserController();