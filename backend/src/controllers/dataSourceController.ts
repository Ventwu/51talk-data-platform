import { Request, Response, NextFunction } from 'express';
import { databaseService } from '../services/database/DatabaseService';
import { databaseManager } from '../services/database/DatabaseManager';
import { validateDatabaseConfig } from '../config/databases';
import { DatabaseConfig } from '../services/database/DatabaseAdapter';
import { AppError } from '../middleware/errorHandler';

/**
 * 数据源管理控制器
 */
export class DataSourceController {
  /**
   * 获取所有数据源列表
   */
  async getDataSources(req: Request, res: Response, next: NextFunction) {
    try {
      const connectionNames = databaseManager.getConfigNames();
      const dataSources = [];
      
      for (const [index, name] of connectionNames.entries()) {
        const config = databaseManager.getConfig(name);
        const status = await databaseManager.testConnection(name);
        
        dataSources.push({
          id: index + 1,
          name: name,
          type: config?.type,
          status: status ? 'connected' : 'disconnected',
          config: {
            type: config?.type,
            host: config?.host,
            port: config?.port,
            database: config?.database,
            // 不返回敏感信息
            username: config?.username ? '***' : undefined
          }
        });
      }
      
      res.json({
        success: true,
        data: dataSources
      });
    } catch (error) {
      console.error('获取数据源列表失败:', error);
      next(new AppError('获取数据源列表失败', 500));
    }
  }

  /**
   * 获取单个数据源详情
   */
  async getDataSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      if (!databaseManager.hasConfig(id)) {
        return next(new AppError('数据源不存在', 404));
      }
      
      const config = databaseManager.getConfig(id);
      const connectionInfo = await databaseService.getConnectionInfo(id);
      const stats = await databaseService.getDatabaseStats(id);
      
      res.json({
        success: true,
        data: {
          id,
          name: id,
          config: {
            type: config?.type,
            host: config?.host,
            port: config?.port,
            database: config?.database,
            username: config?.username ? '***' : undefined
          },
          connectionInfo,
          stats
        }
      });
    } catch (error) {
      console.error('获取数据源详情失败:', error);
      next(new AppError('获取数据源详情失败', 500));
    }
  }

  /**
   * 添加新数据源
   */
  async addDataSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, config } = req.body;
      
      if (!name || !config) {
        return next(new AppError('数据源名称和配置不能为空', 400));
      }
      
      if (databaseManager.hasConfig(name)) {
        return next(new AppError('数据源名称已存在', 400));
      }
      
      // 验证配置
      const validation = validateDatabaseConfig(config);
      if (!validation.isValid) {
        return next(new AppError(`配置验证失败: ${validation.errors.join(', ')}`, 400));
      }
      
      // 添加配置
      databaseManager.addConfig(name, config);
      
      // 测试连接
      const isConnected = await databaseManager.testConnection(name);
      
      res.status(201).json({
        success: true,
        message: '数据源添加成功',
        data: {
          id: name,
          name,
          status: isConnected ? 'connected' : 'disconnected'
        }
      });
    } catch (error) {
      console.error('添加数据源失败:', error);
      next(new AppError('添加数据源失败', 500));
    }
  }

  /**
   * 更新数据源配置
   */
  async updateDataSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { config } = req.body;
      
      if (!databaseManager.hasConfig(id)) {
        return next(new AppError('数据源不存在', 404));
      }
      
      if (!config) {
        return next(new AppError('配置不能为空', 400));
      }
      
      // 验证配置
      const validation = validateDatabaseConfig(config);
      if (!validation.isValid) {
        return next(new AppError(`配置验证失败: ${validation.errors.join(', ')}`, 400));
      }
      
      // 关闭旧连接
      await databaseManager.closeConnection(id);
      
      // 更新配置
      databaseManager.addConfig(id, config);
      
      // 测试新连接
      const isConnected = await databaseManager.testConnection(id);
      
      res.json({
        success: true,
        message: '数据源更新成功',
        data: {
          id,
          status: isConnected ? 'connected' : 'disconnected'
        }
      });
    } catch (error) {
      console.error('更新数据源失败:', error);
      next(new AppError('更新数据源失败', 500));
    }
  }

  /**
   * 删除数据源
   */
  async deleteDataSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      if (!databaseManager.hasConfig(id)) {
        return next(new AppError('数据源不存在', 404));
      }
      
      // 不允许删除主数据源
      if (id === 'primary') {
        return next(new AppError('不能删除主数据源', 400));
      }
      
      await databaseManager.removeConfig(id);
      
      res.json({
        success: true,
        message: '数据源删除成功'
      });
    } catch (error) {
      console.error('删除数据源失败:', error);
      next(new AppError('删除数据源失败', 500));
    }
  }

  /**
   * 测试数据源连接
   */
  async testDataSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { type, config } = req.body;
      
      // 如果提供了测试配置，使用临时配置测试
      if (type && config) {
        // 验证配置
        const validation = validateDatabaseConfig(config);
        if (!validation.isValid) {
          return next(new AppError(`配置验证失败: ${validation.errors.join(', ')}`, 400));
        }
        
        // 创建临时连接测试
        const tempConfigName = `temp_test_${Date.now()}`;
        try {
          databaseManager.addConfig(tempConfigName, config);
          const isConnected = await databaseManager.testConnection(tempConfigName);
          const connectionInfo = isConnected ? await databaseService.getConnectionInfo(tempConfigName) : null;
          
          // 清理临时配置
          await databaseManager.closeConnection(tempConfigName);
          databaseManager.removeConfig(tempConfigName);
          
          res.json({
            success: isConnected,
            message: isConnected ? '连接测试成功' : '连接测试失败',
            data: {
              connected: isConnected,
              connectionInfo
            }
          });
        } catch (testError) {
          // 清理临时配置
          try {
            await databaseManager.closeConnection(tempConfigName);
            databaseManager.removeConfig(tempConfigName);
          } catch (cleanupError) {
            console.error('清理临时配置失败:', cleanupError);
          }
          throw testError;
        }
      } else {
        // 测试已存在的数据源
        if (!databaseManager.hasConfig(id)) {
          return next(new AppError('数据源不存在', 404));
        }
        
        const isConnected = await databaseManager.testConnection(id);
        const connectionInfo = isConnected ? await databaseService.getConnectionInfo(id) : null;
        
        res.json({
          success: isConnected,
          message: isConnected ? '连接测试成功' : '连接测试失败',
          data: {
            connected: isConnected,
            connectionInfo
          }
        });
      }
    } catch (error) {
      console.error('测试连接失败:', error);
      res.json({
        success: false,
        message: '连接测试失败: ' + (error instanceof Error ? error.message : '未知错误')
      });
    }
  }

  /**
   * 获取数据源表列表
   */
  async getDataSourceTables(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      if (!databaseManager.hasConfig(id)) {
        return next(new AppError('数据源不存在', 404));
      }
      
      const tables = await databaseService.getTables(id);
      
      res.json({
        success: true,
        data: tables
      });
    } catch (error) {
      console.error('获取表列表失败:', error);
      next(new AppError('获取表列表失败', 500));
    }
  }

  /**
   * 获取表结构信息
   */
  async getTableInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, tableName } = req.params;
      
      if (!databaseManager.hasConfig(id)) {
        return next(new AppError('数据源不存在', 404));
      }
      
      const tableInfo = await databaseService.getTableInfo(id, tableName);
      
      res.json({
        success: true,
        data: tableInfo
      });
    } catch (error) {
      console.error('获取表结构失败:', error);
      next(new AppError('获取表结构失败', 500));
    }
  }

  /**
   * 预览表数据
   */
  async previewTableData(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, tableName } = req.params;
      const { limit = 100 } = req.query;
      
      if (!databaseManager.hasConfig(id)) {
        return next(new AppError('数据源不存在', 404));
      }
      
      const preview = await databaseService.previewTableData(
        id, 
        tableName, 
        parseInt(limit as string) || 100
      );
      
      res.json({
        success: true,
        data: preview
      });
    } catch (error) {
      console.error('预览表数据失败:', error);
      next(new AppError('预览表数据失败', 500));
    }
  }

  /**
   * 执行SQL查询
   */
  async executeQuery(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { sql, params, page = 1, pageSize = 100 } = req.body;
      
      if (!databaseManager.hasConfig(id)) {
        return next(new AppError('数据源不存在', 404));
      }
      
      if (!sql) {
        return next(new AppError('SQL语句不能为空', 400));
      }
      
      // 验证SQL（只允许SELECT语句）
      const trimmedSql = sql.trim().toUpperCase();
      if (!trimmedSql.startsWith('SELECT')) {
        return next(new AppError('只允许执行SELECT查询', 400));
      }
      
      // 验证SQL语法
      const validation = await databaseService.validateQuery(id, sql);
      if (!validation.isValid) {
        return next(new AppError(`SQL语法错误: ${validation.error}`, 400));
      }
      
      // 执行分页查询
      const result = await databaseService.executePagedQuery(
        id,
        sql,
        parseInt(page as string) || 1,
        parseInt(pageSize as string) || 100,
        params
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('执行查询失败:', error);
      next(new AppError('执行查询失败', 500));
    }
  }

  /**
   * 获取所有数据源状态
   */
  async getDataSourcesStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await databaseService.getAllConnectionStatus();
      const stats = databaseManager.getConnectionStats();
      
      res.json({
        success: true,
        data: {
          connections: status,
          stats
        }
      });
    } catch (error) {
      console.error('获取数据源状态失败:', error);
      next(new AppError('获取数据源状态失败', 500));
    }
  }
}

// 导出控制器实例
export const dataSourceController = new DataSourceController();