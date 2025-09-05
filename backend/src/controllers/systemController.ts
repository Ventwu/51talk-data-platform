import { Request, Response } from 'express';
import { executeQuery } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Op } from 'sequelize';

/**
 * 系统配置控制器
 */
export class SystemController {
  /**
   * 获取系统配置列表
   */
  async getSystemConfigs(req: Request, res: Response): Promise<void> {
    try {
      const { category, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      let whereClause = '';
      const params: any[] = [];
      
      if (category) {
        whereClause = 'WHERE category = ?';
        params.push(category);
      }
      
      const countQuery = `SELECT COUNT(*) as total FROM system_configs ${whereClause}`;
      const dataQuery = `
        SELECT id, config_key, config_value, category, description, 
               is_public, created_at, updated_at 
        FROM system_configs 
        ${whereClause}
        ORDER BY category, config_key 
        LIMIT ? OFFSET ?
      `;
      
      const [countResult, configs] = await Promise.all([
        executeQuery(countQuery, params),
        executeQuery(dataQuery, [...params, Number(limit), offset]),
      ]);
      
      const total = countResult[0]?.total || 0;
      
      res.json({
        success: true,
        data: {
          configs,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error('获取系统配置失败:', error);
      throw new AppError('获取系统配置失败', 500);
    }
  }
  
  /**
   * 获取公开的系统配置
   */
  async getPublicConfigs(req: Request, res: Response): Promise<void> {
    try {
      const configs = await executeQuery(
        'SELECT config_key, config_value, category FROM system_configs WHERE is_public = 1 ORDER BY category, config_key'
      );
      
      // 按分类组织配置
      const groupedConfigs: { [key: string]: any } = {};
      configs.forEach((config: any) => {
        if (!groupedConfigs[config.category]) {
          groupedConfigs[config.category] = {};
        }
        groupedConfigs[config.category][config.config_key] = config.config_value;
      });
      
      res.json({
        success: true,
        data: groupedConfigs,
      });
    } catch (error) {
      console.error('获取公开配置失败:', error);
      throw new AppError('获取公开配置失败', 500);
    }
  }
  
  /**
   * 获取单个系统配置
   */
  async getSystemConfig(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      
      const configs = await executeQuery(
        'SELECT * FROM system_configs WHERE config_key = ?',
        [key]
      );
      
      if (!configs || configs.length === 0) {
        throw new AppError('配置项不存在', 404);
      }
      
      res.json({
        success: true,
        data: configs[0],
      });
    } catch (error) {
      console.error('获取配置项失败:', error);
      throw new AppError('获取配置项失败', 500);
    }
  }
  
  /**
   * 创建系统配置
   */
  async createSystemConfig(req: Request, res: Response): Promise<void> {
    try {
      const { 
        configKey, 
        configValue, 
        category, 
        description, 
        isPublic = false 
      } = req.body;
      
      // 检查配置键是否已存在
      const existingConfigs = await executeQuery(
        'SELECT id FROM system_configs WHERE config_key = ?',
        [configKey]
      );
      
      if (existingConfigs && existingConfigs.length > 0) {
        throw new AppError('配置键已存在', 400);
      }
      
      const result = await executeQuery(
        `INSERT INTO system_configs (config_key, config_value, category, description, is_public) 
         VALUES (?, ?, ?, ?, ?)`,
        [configKey, configValue, category, description, isPublic ? 1 : 0]
      );
      
      const newConfig = await executeQuery(
        'SELECT * FROM system_configs WHERE id = ?',
        [result.insertId]
      );
      
      res.status(201).json({
        success: true,
        data: newConfig[0],
        message: '系统配置创建成功',
      });
    } catch (error) {
      console.error('创建系统配置失败:', error);
      throw new AppError('创建系统配置失败', 500);
    }
  }
  
  /**
   * 更新系统配置
   */
  async updateSystemConfig(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const { configValue, category, description, isPublic } = req.body;
      
      // 检查配置是否存在
      const existingConfigs = await executeQuery(
        'SELECT id FROM system_configs WHERE config_key = ?',
        [key]
      );
      
      if (!existingConfigs || existingConfigs.length === 0) {
        throw new AppError('配置项不存在', 404);
      }
      
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      
      if (configValue !== undefined) {
        updateFields.push('config_value = ?');
        updateValues.push(configValue);
      }
      
      if (category !== undefined) {
        updateFields.push('category = ?');
        updateValues.push(category);
      }
      
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }
      
      if (isPublic !== undefined) {
        updateFields.push('is_public = ?');
        updateValues.push(isPublic ? 1 : 0);
      }
      
      if (updateFields.length === 0) {
        throw new AppError('没有提供要更新的字段', 400);
      }
      
      updateFields.push('updated_at = datetime("now")');
      updateValues.push(key);
      
      await executeQuery(
        `UPDATE system_configs SET ${updateFields.join(', ')} WHERE config_key = ?`,
        updateValues
      );
      
      const updatedConfig = await executeQuery(
        'SELECT * FROM system_configs WHERE config_key = ?',
        [key]
      );
      
      res.json({
        success: true,
        data: updatedConfig[0],
        message: '系统配置更新成功',
      });
    } catch (error) {
      console.error('更新系统配置失败:', error);
      throw new AppError('更新系统配置失败', 500);
    }
  }
  
  /**
   * 删除系统配置
   */
  async deleteSystemConfig(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      
      // 检查配置是否存在
      const existingConfigs = await executeQuery(
        'SELECT id FROM system_configs WHERE config_key = ?',
        [key]
      );
      
      if (!existingConfigs || existingConfigs.length === 0) {
        throw new AppError('配置项不存在', 404);
      }
      
      await executeQuery(
        'DELETE FROM system_configs WHERE config_key = ?',
        [key]
      );
      
      res.json({
        success: true,
        message: '系统配置删除成功',
      });
    } catch (error) {
      console.error('删除系统配置失败:', error);
      throw new AppError('删除系统配置失败', 500);
    }
  }
  
  /**
   * 批量更新系统配置
   */
  async batchUpdateConfigs(req: Request, res: Response): Promise<void> {
    try {
      const { configs } = req.body;
      
      if (!Array.isArray(configs) || configs.length === 0) {
        throw new AppError('配置数据格式错误', 400);
      }
      
      // 开始事务
      await executeQuery('START TRANSACTION');
      
      try {
        for (const config of configs) {
          const { configKey, configValue } = config;
          
          if (!configKey) {
            throw new AppError('配置键不能为空', 400);
          }
          
          // 检查配置是否存在
          const existingConfigs = await executeQuery(
            'SELECT id FROM system_configs WHERE config_key = ?',
            [configKey]
          );
          
          if (existingConfigs && existingConfigs.length > 0) {
            // 更新现有配置
            await executeQuery(
              'UPDATE system_configs SET config_value = ?, updated_at = datetime("now") WHERE config_key = ?',
              [configValue, configKey]
            );
          } else {
            // 创建新配置
            await executeQuery(
              `INSERT INTO system_configs (config_key, config_value, category, description, is_public) 
               VALUES (?, ?, ?, ?, ?)`,
              [configKey, configValue, config.category || 'general', config.description || '', config.isPublic ? 1 : 0]
            );
          }
        }
        
        await executeQuery('COMMIT');
        
        res.json({
          success: true,
          message: '批量更新配置成功',
        });
      } catch (error) {
        await executeQuery('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('批量更新配置失败:', error);
      throw new AppError('批量更新配置失败', 500);
    }
  }
  
  /**
   * 获取系统信息
   */
  async getSystemInfo(req: Request, res: Response): Promise<void> {
    try {
      // 获取数据库统计信息
      const [userCount, dataSourceCount, dashboardCount, chartCount] = await Promise.all([
        executeQuery('SELECT COUNT(*) as count FROM users'),
        executeQuery('SELECT COUNT(*) as count FROM data_sources'),
        executeQuery('SELECT COUNT(*) as count FROM dashboards'),
        executeQuery('SELECT COUNT(*) as count FROM charts'),
      ]);
      
      // 获取系统版本信息
      const systemInfo = {
        version: process.env.APP_VERSION || '1.0.0',
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        statistics: {
          users: userCount[0]?.count || 0,
          dataSources: dataSourceCount[0]?.count || 0,
          dashboards: dashboardCount[0]?.count || 0,
          charts: chartCount[0]?.count || 0,
        },
      };
      
      res.json({
        success: true,
        data: systemInfo,
      });
    } catch (error) {
      console.error('获取系统信息失败:', error);
      throw new AppError('获取系统信息失败', 500);
    }
  }
  
  /**
   * 获取配置分类列表
   */
  async getConfigCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await executeQuery(
        'SELECT DISTINCT category FROM system_configs ORDER BY category'
      );
      
      res.json({
        success: true,
        data: categories.map((item: any) => item.category),
      });
    } catch (error) {
      console.error('获取配置分类失败:', error);
      throw new AppError('获取配置分类失败', 500);
    }
  }
}

// 导出控制器实例
export const systemController = new SystemController();