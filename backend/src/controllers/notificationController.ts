import { Request, Response } from 'express';
import { NotificationConfig } from '../models/NotificationConfig';
import { notificationService } from '../services/notification/NotificationService';
import { AppError } from '../middleware/errorHandler';
import { Op } from 'sequelize';

/**
 * 通知配置控制器
 */
export class NotificationController {
  /**
   * 获取通知配置列表
   */
  async getNotificationConfigs(req: Request, res: Response): Promise<void> {
    try {
      const { type, isActive, page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      const whereClause: any = {};
      
      if (type) {
        whereClause.type = type;
      }
      
      if (isActive !== undefined) {
        whereClause.isActive = isActive === 'true';
      }
      
      const { rows: configs, count } = await NotificationConfig.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          {
            association: 'creator',
            attributes: ['id', 'username', 'email'],
          },
        ],
      });
      
      res.json({
        success: true,
        data: {
          configs,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(count / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error('获取通知配置列表失败:', error);
      throw new AppError('获取通知配置列表失败', 500);
    }
  }
  
  /**
   * 获取单个通知配置
   */
  async getNotificationConfig(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const config = await NotificationConfig.findByPk(id, {
        include: [
          {
            association: 'creator',
            attributes: ['id', 'username', 'email'],
          },
        ],
      });
      
      if (!config) {
        throw new AppError('通知配置不存在', 404);
      }
      
      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      console.error('获取通知配置失败:', error);
      throw new AppError('获取通知配置失败', 500);
    }
  }
  
  /**
   * 创建通知配置
   */
  async createNotificationConfig(req: Request, res: Response): Promise<void> {
    try {
      const { name, type, config, isActive = true } = req.body;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        throw new AppError('用户未认证', 401);
      }
      
      // 验证配置格式
      this.validateNotificationConfig(type, config);
      
      const newConfig = await NotificationConfig.create({
        name,
        type,
        config,
        isActive,
        createdBy: userId,
      });
      
      res.status(201).json({
        success: true,
        data: newConfig,
        message: '通知配置创建成功',
      });
    } catch (error) {
      console.error('创建通知配置失败:', error);
      throw new AppError('创建通知配置失败', 500);
    }
  }
  
  /**
   * 更新通知配置
   */
  async updateNotificationConfig(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, type, config, isActive } = req.body;
      
      const existingConfig = await NotificationConfig.findByPk(id);
      if (!existingConfig) {
        throw new AppError('通知配置不存在', 404);
      }
      
      // 验证配置格式
      if (type && config) {
        this.validateNotificationConfig(type, config);
      }
      
      await existingConfig.update({
        ...(name && { name }),
        ...(type && { type }),
        ...(config && { config }),
        ...(isActive !== undefined && { isActive }),
      });
      
      res.json({
        success: true,
        data: existingConfig,
        message: '通知配置更新成功',
      });
    } catch (error) {
      console.error('更新通知配置失败:', error);
      throw new AppError('更新通知配置失败', 500);
    }
  }
  
  /**
   * 删除通知配置
   */
  async deleteNotificationConfig(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const config = await NotificationConfig.findByPk(id);
      if (!config) {
        throw new AppError('通知配置不存在', 404);
      }
      
      await config.destroy();
      
      res.json({
        success: true,
        message: '通知配置删除成功',
      });
    } catch (error) {
      console.error('删除通知配置失败:', error);
      throw new AppError('删除通知配置失败', 500);
    }
  }
  
  /**
   * 测试通知配置
   */
  async testNotificationConfig(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { message = '这是一条测试消息' } = req.body;
      
      const config = await NotificationConfig.findByPk(id);
      if (!config) {
        throw new AppError('通知配置不存在', 404);
      }
      
      // 测试发送通知
      if (config.type === 'webhook') {
        throw new AppError('暂不支持webhook类型的测试', 400);
      }
      const result = await notificationService.testNotification(config.type as 'feishu' | 'wechat' | 'email', config.config);
      
      res.json({
        success: true,
        data: result,
        message: '通知测试完成',
      });
    } catch (error) {
      console.error('测试通知配置失败:', error);
      throw new AppError('测试通知配置失败', 500);
    }
  }
  
  /**
   * 获取支持的通知类型
   */
  async getSupportedTypes(req: Request, res: Response): Promise<void> {
    try {
      const types = [
        {
          type: 'feishu',
          name: '飞书',
          description: '通过飞书机器人发送消息',
          configSchema: {
            webhook: { type: 'string', required: true, description: 'Webhook URL' },
            secret: { type: 'string', required: false, description: '签名密钥' },
          },
        },
        {
          type: 'wechat',
          name: '企业微信',
          description: '通过企业微信机器人发送消息',
          configSchema: {
            webhook: { type: 'string', required: true, description: 'Webhook URL' },
          },
        },
        {
          type: 'email',
          name: '邮件',
          description: '通过SMTP发送邮件',
          configSchema: {
            host: { type: 'string', required: true, description: 'SMTP服务器' },
            port: { type: 'number', required: true, description: '端口号' },
            secure: { type: 'boolean', required: false, description: '是否使用SSL' },
            user: { type: 'string', required: true, description: '用户名' },
            pass: { type: 'string', required: true, description: '密码' },
            from: { type: 'string', required: true, description: '发件人' },
            to: { type: 'array', required: true, description: '收件人列表' },
          },
        },
        {
          type: 'webhook',
          name: 'Webhook',
          description: '通过HTTP请求发送通知',
          configSchema: {
            url: { type: 'string', required: true, description: '请求URL' },
            method: { type: 'string', required: false, description: '请求方法(默认POST)' },
            headers: { type: 'object', required: false, description: '请求头' },
          },
        },
      ];
      
      res.json({
        success: true,
        data: types,
      });
    } catch (error) {
      console.error('获取支持的通知类型失败:', error);
      throw new AppError('获取支持的通知类型失败', 500);
    }
  }
  
  /**
   * 验证通知配置格式
   */
  private validateNotificationConfig(type: string, config: any): void {
    switch (type) {
      case 'feishu':
        if (!config.webhook) {
          throw new AppError('飞书配置缺少webhook字段', 400);
        }
        break;
      case 'wechat':
        if (!config.webhook) {
          throw new AppError('企业微信配置缺少webhook字段', 400);
        }
        break;
      case 'email':
        const requiredEmailFields = ['host', 'port', 'user', 'pass', 'from', 'to'];
        for (const field of requiredEmailFields) {
          if (!config[field]) {
            throw new AppError(`邮件配置缺少${field}字段`, 400);
          }
        }
        break;
      case 'webhook':
        if (!config.url) {
          throw new AppError('Webhook配置缺少url字段', 400);
        }
        break;
      default:
        throw new AppError('不支持的通知类型', 400);
    }
  }
}

// 导出控制器实例
export const notificationController = new NotificationController();