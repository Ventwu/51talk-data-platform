import { Request, Response } from 'express';
import { executeQuery } from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * 操作日志控制器
 */
export class LogController {
  /**
   * 获取操作日志列表
   */
  async getOperationLogs(req: Request, res: Response): Promise<void> {
    try {
      const { 
        userId, 
        action, 
        resource, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 20 
      } = req.query;
      
      const offset = (Number(page) - 1) * Number(limit);
      const whereConditions: string[] = [];
      const params: any[] = [];
      
      if (userId) {
        whereConditions.push('ol.user_id = ?');
        params.push(userId);
      }
      
      if (action) {
        whereConditions.push('ol.action = ?');
        params.push(action);
      }
      
      if (resource) {
        whereConditions.push('ol.resource_type = ?');
        params.push(resource);
      }
      
      if (startDate) {
        whereConditions.push('ol.created_at >= ?');
        params.push(startDate);
      }
      
      if (endDate) {
        whereConditions.push('ol.created_at <= ?');
        params.push(endDate);
      }
      
      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM operation_logs ol 
        ${whereClause}
      `;
      
      const dataQuery = `
        SELECT 
          ol.id,
          ol.user_id,
          u.username,
          u.real_name,
          ol.action,
          ol.resource_type,
          ol.resource_id,
          ol.details,
          ol.ip_address,
          ol.user_agent,
          ol.created_at
        FROM operation_logs ol
        LEFT JOIN users u ON ol.user_id = u.id
        ${whereClause}
        ORDER BY ol.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const [countResult, logs] = await Promise.all([
        executeQuery(countQuery, params),
        executeQuery(dataQuery, [...params, Number(limit), offset]),
      ]);
      
      const total = countResult[0]?.total || 0;
      
      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error('获取操作日志失败:', error);
      throw new AppError('获取操作日志失败', 500);
    }
  }
  
  /**
   * 获取单个操作日志详情
   */
  async getOperationLog(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const logs = await executeQuery(
        `SELECT 
          ol.id,
          ol.user_id,
          u.username,
          u.real_name,
          ol.action,
          ol.resource_type,
          ol.resource_id,
          ol.details,
          ol.ip_address,
          ol.user_agent,
          ol.created_at
        FROM operation_logs ol
        LEFT JOIN users u ON ol.user_id = u.id
        WHERE ol.id = ?`,
        [id]
      );
      
      if (!logs || logs.length === 0) {
        throw new AppError('操作日志不存在', 404);
      }
      
      res.json({
        success: true,
        data: logs[0],
      });
    } catch (error) {
      console.error('获取操作日志详情失败:', error);
      throw new AppError('获取操作日志详情失败', 500);
    }
  }
  
  /**
   * 记录操作日志
   */
  async createOperationLog(req: Request, res: Response): Promise<void> {
    try {
      const { 
        action, 
        resourceType, 
        resourceId, 
        details 
      } = req.body;
      
      const userId = (req as any).user?.id;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      if (!userId) {
        throw new AppError('用户未认证', 401);
      }
      
      const result = await executeQuery(
        `INSERT INTO operation_logs 
         (user_id, action, resource_type, resource_id, details, ip_address, user_agent) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, action, resourceType, resourceId, JSON.stringify(details), ipAddress, userAgent]
      );
      
      const newLog = await executeQuery(
        `SELECT 
          ol.id,
          ol.user_id,
          u.username,
          ol.action,
          ol.resource_type,
          ol.resource_id,
          ol.details,
          ol.ip_address,
          ol.user_agent,
          ol.created_at
        FROM operation_logs ol
        LEFT JOIN users u ON ol.user_id = u.id
        WHERE ol.id = ?`,
        [result.insertId]
      );
      
      res.status(201).json({
        success: true,
        data: newLog[0],
        message: '操作日志记录成功',
      });
    } catch (error) {
      console.error('记录操作日志失败:', error);
      throw new AppError('记录操作日志失败', 500);
    }
  }
  
  /**
   * 批量删除操作日志
   */
  async deleteOperationLogs(req: Request, res: Response): Promise<void> {
    try {
      const { ids, beforeDate } = req.body;
      
      if (ids && Array.isArray(ids) && ids.length > 0) {
        // 删除指定ID的日志
        const placeholders = ids.map(() => '?').join(',');
        await executeQuery(
          `DELETE FROM operation_logs WHERE id IN (${placeholders})`,
          ids
        );
        
        res.json({
          success: true,
          message: `成功删除 ${ids.length} 条操作日志`,
        });
      } else if (beforeDate) {
        // 删除指定日期之前的日志
        const result = await executeQuery(
          'DELETE FROM operation_logs WHERE created_at < ?',
          [beforeDate]
        );
        
        res.json({
          success: true,
          message: `成功删除 ${result.affectedRows} 条操作日志`,
        });
      } else {
        throw new AppError('请提供要删除的日志ID或日期', 400);
      }
    } catch (error) {
      console.error('删除操作日志失败:', error);
      throw new AppError('删除操作日志失败', 500);
    }
  }
  
  /**
   * 获取操作统计信息
   */
  async getOperationStats(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      
      const whereConditions: string[] = [];
      const params: any[] = [];
      
      if (startDate) {
        whereConditions.push('created_at >= ?');
        params.push(startDate);
      }
      
      if (endDate) {
        whereConditions.push('created_at <= ?');
        params.push(endDate);
      }
      
      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';
      
      const [actionStats, resourceStats, userStats, dailyStats] = await Promise.all([
        // 按操作类型统计
        executeQuery(
          `SELECT action, COUNT(*) as count 
           FROM operation_logs ${whereClause} 
           GROUP BY action 
           ORDER BY count DESC`,
          params
        ),
        // 按资源类型统计
        executeQuery(
          `SELECT resource_type, COUNT(*) as count 
           FROM operation_logs ${whereClause} 
           GROUP BY resource_type 
           ORDER BY count DESC`,
          params
        ),
        // 按用户统计
        executeQuery(
          `SELECT 
             ol.user_id, 
             u.username, 
             u.real_name, 
             COUNT(*) as count 
           FROM operation_logs ol
           LEFT JOIN users u ON ol.user_id = u.id
           ${whereClause}
           GROUP BY ol.user_id, u.username, u.real_name 
           ORDER BY count DESC 
           LIMIT 10`,
          params
        ),
        // 按日期统计（最近7天）
        executeQuery(
          `SELECT 
             DATE(created_at) as date, 
             COUNT(*) as count 
           FROM operation_logs 
           WHERE created_at >= datetime('now', '-7 days')
           GROUP BY DATE(created_at) 
           ORDER BY date DESC`,
          []
        ),
      ]);
      
      res.json({
        success: true,
        data: {
          actionStats,
          resourceStats,
          userStats,
          dailyStats,
        },
      });
    } catch (error) {
      console.error('获取操作统计信息失败:', error);
      throw new AppError('获取操作统计信息失败', 500);
    }
  }
  
  /**
   * 导出操作日志
   */
  async exportOperationLogs(req: Request, res: Response): Promise<void> {
    try {
      const { 
        userId, 
        action, 
        resource, 
        startDate, 
        endDate, 
        format = 'csv' 
      } = req.query;
      
      const whereConditions: string[] = [];
      const params: any[] = [];
      
      if (userId) {
        whereConditions.push('ol.user_id = ?');
        params.push(userId);
      }
      
      if (action) {
        whereConditions.push('ol.action = ?');
        params.push(action);
      }
      
      if (resource) {
        whereConditions.push('ol.resource_type = ?');
        params.push(resource);
      }
      
      if (startDate) {
        whereConditions.push('ol.created_at >= ?');
        params.push(startDate);
      }
      
      if (endDate) {
        whereConditions.push('ol.created_at <= ?');
        params.push(endDate);
      }
      
      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';
      
      const logs = await executeQuery(
        `SELECT 
          ol.id,
          u.username,
          u.real_name,
          ol.action,
          ol.resource_type,
          ol.resource_id,
          ol.details,
          ol.ip_address,
          ol.created_at
        FROM operation_logs ol
        LEFT JOIN users u ON ol.user_id = u.id
        ${whereClause}
        ORDER BY ol.created_at DESC
        LIMIT 10000`, // 限制导出数量
        params
      );
      
      if (format === 'csv') {
        // 生成CSV格式
        const csvHeader = 'ID,用户名,真实姓名,操作,资源类型,资源ID,详情,IP地址,创建时间\n';
        const csvContent = logs.map((log: any) => 
          `${log.id},${log.username || ''},${log.real_name || ''},${log.action},${log.resource_type},${log.resource_id || ''},"${(log.details || '').replace(/"/g, '""')}",${log.ip_address || ''},${log.created_at}`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="operation_logs_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send('\uFEFF' + csvHeader + csvContent); // 添加BOM以支持中文
      } else {
        // 返回JSON格式
        res.json({
          success: true,
          data: logs,
        });
      }
    } catch (error) {
      console.error('导出操作日志失败:', error);
      throw new AppError('导出操作日志失败', 500);
    }
  }
}

// 导出控制器实例
export const logController = new LogController();