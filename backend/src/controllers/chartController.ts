import { Request, Response } from 'express';
import { databaseService } from '../services/database/DatabaseService';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

/**
 * 图表控制器
 * 处理图表相关的API请求
 */
export class ChartController {
  /**
   * 获取图表列表
   */
  async getCharts(req: AuthRequest, res: Response) {
    const { page = 1, limit = 10, dataSourceId, type, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (dataSourceId) {
      whereClause += ' AND data_source_id = ?';
      params.push(dataSourceId);
    }
    
    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }
    
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    try {
      // 获取图表列表
      const charts = await databaseService.executeQuery(
        'default',
        `SELECT c.*, ds.name as data_source_name, u.username as creator_name 
         FROM charts c 
         LEFT JOIN data_sources ds ON c.data_source_id = ds.id 
         LEFT JOIN users u ON c.created_by = u.id 
         ${whereClause} 
         ORDER BY c.updated_at DESC 
         LIMIT ? OFFSET ?`,
        [...params, Number(limit), offset]
      );
      
      // 获取总数
      const totalResult = await databaseService.executeQuery(
        'default',
        `SELECT COUNT(*) as total FROM charts c ${whereClause}`,
        params
      );
      
      const total = totalResult.rows[0].total;
      
      res.json({
        success: true,
        data: {
          charts,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      throw new AppError(`获取图表列表失败: ${error}`, 500);
    }
  }
  
  /**
   * 获取单个图表详情
   */
  async getChart(req: AuthRequest, res: Response) {
    const { id } = req.params;
    
    try {
      const charts = await databaseService.executeQuery(
        'default',
        `SELECT c.*, ds.name as data_source_name, u.username as creator_name 
         FROM charts c 
         LEFT JOIN data_sources ds ON c.data_source_id = ds.id 
         LEFT JOIN users u ON c.created_by = u.id 
         WHERE c.id = ?`,
        [id]
      );
      
      if (charts.rows.length === 0) {
        throw new AppError('图表不存在', 404);
      }
      
      const chart = charts.rows[0];
      
      // 解析配置JSON
      if (chart.config) {
        try {
          chart.config = JSON.parse(chart.config);
        } catch (error) {
          chart.config = {};
        }
      }
      
      res.json({
        success: true,
        data: chart
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`获取图表详情失败: ${error}`, 500);
    }
  }
  
  /**
   * 创建图表
   */
  async createChart(req: AuthRequest, res: Response) {
    const { name, type, dataSourceId, dashboard_id, query, config, description } = req.body;
    const userId = req.user?.id;
    
    if (!name || !type || !dataSourceId || !dashboard_id) {
      throw new AppError('图表名称、类型、数据源和仪表盘不能为空', 400);
    }
    
    // 验证图表类型
    const validTypes = ['line', 'bar', 'pie', 'scatter', 'area', 'gauge', 'table', 'card'];
    if (!validTypes.includes(type)) {
      throw new AppError('不支持的图表类型', 400);
    }
    
    // 验证配置格式
    let configStr = '{}';
    if (config) {
      try {
        configStr = typeof config === 'string' ? config : JSON.stringify(config);
        JSON.parse(configStr); // 验证JSON格式
      } catch (error) {
        throw new AppError('配置格式错误', 400);
      }
    }
    
    try {
      const result = await databaseService.executeQuery(
        'default',
        `INSERT INTO charts (name, type, dashboard_id, data_source_id, query_sql, config, description, status, created_by, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, datetime("now"), datetime("now"))`,
        [name, type, dashboard_id, dataSourceId, query || '', configStr, description || '', userId]
      );
      
      res.status(201).json({
        success: true,
        message: '图表创建成功',
        data: {
          id: result.rowCount > 0 ? result.rows[0]?.id || 'generated' : 'generated',
          name,
          type,
          dataSourceId,
          status: 'draft'
        }
      });
    } catch (error) {
      throw new AppError(`创建图表失败: ${error}`, 500);
    }
  }
  
  /**
   * 更新图表
   */
  async updateChart(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { name, dashboard_id, query, config, description, status } = req.body;
    
    try {
      // 检查图表是否存在
      const charts = await databaseService.executeQuery(
        'default',
        'SELECT id FROM charts WHERE id = ?',
        [id]
      );
      
      if (charts.rows.length === 0) {
        throw new AppError('图表不存在', 404);
      }
      
      // 验证配置格式
      let configStr;
      if (config !== undefined) {
        try {
          configStr = typeof config === 'string' ? config : JSON.stringify(config);
          JSON.parse(configStr); // 验证JSON格式
        } catch (error) {
          throw new AppError('配置格式错误', 400);
        }
      }
      
      // 构建更新字段
      const updateFields = [];
      const updateValues = [];
      
      if (name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }
      
      if (dashboard_id !== undefined) {
        updateFields.push('dashboard_id = ?');
        updateValues.push(dashboard_id);
      }
      
      if (query !== undefined) {
        updateFields.push('query_sql = ?');
        updateValues.push(query);
      }
      
      if (configStr !== undefined) {
        updateFields.push('config = ?');
        updateValues.push(configStr);
      }
      
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }
      
      if (status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }
      
      updateFields.push('updated_at = datetime("now")');
      updateValues.push(id);
      
      await databaseService.executeQuery(
        'default',
        `UPDATE charts SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
      
      res.json({
        success: true,
        message: '图表更新成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`更新图表失败: ${error}`, 500);
    }
  }
  
  /**
   * 删除图表
   */
  async deleteChart(req: AuthRequest, res: Response) {
    const { id } = req.params;
    
    try {
      // 检查图表是否存在
      const charts = await databaseService.executeQuery(
        'default',
        'SELECT id FROM charts WHERE id = ?',
        [id]
      );
      
      if (charts.rows.length === 0) {
        throw new AppError('图表不存在', 404);
      }
      
      await databaseService.executeQuery(
        'default',
        'DELETE FROM charts WHERE id = ?',
        [id]
      );
      
      res.json({
        success: true,
        message: '图表删除成功'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`删除图表失败: ${error}`, 500);
    }
  }
  
  /**
   * 执行图表查询并获取数据
   */
  async getChartData(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { refresh = false } = req.query;
    
    try {
      // 获取图表配置
      const charts = await databaseService.executeQuery(
        'default',
        `SELECT c.*, ds.id as ds_id, ds.name as ds_name 
         FROM charts c 
         LEFT JOIN data_sources ds ON c.data_source_id = ds.id 
         WHERE c.id = ?`,
        [id]
      );
      
      if (charts.rows.length === 0) {
        throw new AppError('图表不存在', 404);
      }
      
      const chart = charts.rows[0];
      
      if (!chart.query_sql) {
        throw new AppError('图表未配置查询语句', 400);
      }
      
      if (!chart.ds_id) {
        throw new AppError('图表未关联数据源', 400);
      }
      
      // 执行查询
      const data = await databaseService.executeQuery(
        chart.ds_name,
        chart.query_sql
      );
      
      res.json({
        success: true,
        data: {
          chartId: id,
          chartName: chart.name,
          chartType: chart.type,
          data,
          config: chart.config ? JSON.parse(chart.config) : {},
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`获取图表数据失败: ${error}`, 500);
    }
  }
  
  /**
   * 预览图表查询结果
   */
  async previewChartQuery(req: AuthRequest, res: Response) {
    const { dataSourceId, query } = req.body;
    
    if (!dataSourceId || !query) {
      throw new AppError('数据源ID和查询语句不能为空', 400);
    }
    
    try {
      // 获取数据源名称
      const dataSources = await databaseService.executeQuery(
        'default',
        'SELECT name FROM data_sources WHERE id = ?',
        [dataSourceId]
      );
      
      if (dataSources.rows.length === 0) {
        throw new AppError('数据源不存在', 404);
      }
      
      const dataSourceName = dataSources.rows[0].name;
      
      // 执行查询（限制返回行数）
      const limitedQuery = query.toLowerCase().includes('limit') 
        ? query 
        : `${query} LIMIT 100`;
      
      const data = await databaseService.executeQuery(
        dataSourceName,
        limitedQuery
      );
      
      res.json({
        success: true,
        data: {
          query: limitedQuery,
          rows: data.rows.length,
          data: data.rows.slice(0, 10), // 只返回前10行用于预览
          columns: data.rows.length > 0 ? Object.keys(data.rows[0]) : []
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`预览查询失败: ${error}`, 500);
    }
  }
}

// 导出控制器实例
export const chartController = new ChartController();