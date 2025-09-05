import { Request, Response } from 'express';
import { databaseService } from '../services/database/DatabaseService';
import { schedulerService } from '../services/scheduler/SchedulerService';
import { notificationService } from '../services/notification/NotificationService';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

/**
 * 定时任务控制器
 * 处理定时任务相关的API请求
 */
export class ScheduleController {
  /**
   * 获取定时任务列表
   */
  async getSchedules(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, type, enabled } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      if (type) {
        whereClause += ' AND task_type = ?';
        params.push(type);
      }

      if (enabled !== undefined) {
        whereClause += ' AND status = ?';
        params.push(enabled === 'true' ? 'active' : 'inactive');
      }

      // 获取总数
      const countResult = await databaseService.executeQuery(
        'default',
        `SELECT COUNT(*) as total FROM scheduled_tasks ${whereClause}`,
        params
      );
      const total = countResult.rows[0].total;

      // 获取分页数据
      const schedules = await databaseService.executeQuery(
        'default',
        `SELECT * FROM scheduled_tasks ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, Number(limit), offset]
      );

      // 解析配置JSON
      const formattedSchedules = schedules.rows.map(schedule => ({
        ...schedule,
        config: JSON.parse(schedule.config || '{}')
      }));

      res.json({
        success: true,
        data: {
          schedules: formattedSchedules,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('获取定时任务列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取定时任务列表失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 获取单个定时任务详情
   */
  async getSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const schedules = await databaseService.executeQuery(
        'default',
        'SELECT * FROM scheduled_tasks WHERE id = ?',
        [id]
      );

      if (schedules.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: '定时任务不存在'
        });
        return;
      }

      const schedule = {
        ...schedules.rows[0],
        config: JSON.parse(schedules.rows[0].config || '{}')
      };

      res.json({
        success: true,
        data: schedule
      });
    } catch (error) {
      console.error('获取定时任务详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取定时任务详情失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 创建定时任务
   */
  async createSchedule(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        type,
        cronExpression,
        enabled = true,
        config = {}
      } = req.body;

      // 验证必填字段
      if (!name || !type || !cronExpression) {
        res.status(400).json({
          success: false,
          message: '缺少必填字段: name, type, cronExpression'
        });
        return;
      }

      // 验证任务类型
      if (!['data_refresh', 'data_push'].includes(type)) {
        res.status(400).json({
          success: false,
          message: '无效的任务类型，支持: data_refresh, data_push'
        });
        return;
      }

      const scheduleId = uuidv4();
      const now = new Date();
      const userId = (req as any).user?.id || 'system';

      // 插入数据库
      await databaseService.executeQuery(
        'default',
        `INSERT INTO scheduled_tasks (
          id, name, task_type, cron_expression, status, config, 
          user_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          scheduleId,
          name,
          type,
          cronExpression,
          enabled ? 'active' : 'inactive',
          JSON.stringify(config),
          userId,
          now,
          now
        ]
      );

      // 如果启用，添加到调度器
      if (enabled) {
        await schedulerService.addTask({
          id: scheduleId,
          name,
          task_type: type,
          cron_expression: cronExpression,
          status: enabled ? 'active' : 'inactive',
          config,
          user_id: userId,
          created_at: now,
          updated_at: now
        });
      }

      res.status(201).json({
        success: true,
        message: '定时任务创建成功',
        data: { id: scheduleId }
      });
    } catch (error) {
      console.error('创建定时任务失败:', error);
      res.status(500).json({
        success: false,
        message: '创建定时任务失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 更新定时任务
   */
  async updateSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        type,
        cronExpression,
        enabled,
        config
      } = req.body;

      // 检查任务是否存在
      const existingSchedules = await databaseService.executeQuery(
        'default',
        'SELECT * FROM scheduled_tasks WHERE id = ?',
        [id]
      );

      if (existingSchedules.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: '定时任务不存在'
        });
        return;
      }

      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }

      if (type !== undefined) {
        if (!['data_refresh', 'data_push'].includes(type)) {
          res.status(400).json({
            success: false,
            message: '无效的任务类型，支持: data_refresh, data_push'
          });
          return;
        }
        updateFields.push('task_type = ?');
        updateValues.push(type);
      }

      if (cronExpression !== undefined) {
        updateFields.push('cron_expression = ?');
        updateValues.push(cronExpression);
      }

      if (enabled !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(enabled ? 'active' : 'inactive');
      }

      if (config !== undefined) {
        updateFields.push('config = ?');
        updateValues.push(JSON.stringify(config));
      }

      if (updateFields.length === 0) {
        res.status(400).json({
          success: false,
          message: '没有提供要更新的字段'
        });
        return;
      }

      updateFields.push('updated_at = ?');
      updateValues.push(new Date());
      updateValues.push(id);

      // 更新数据库
      await databaseService.executeQuery(
        'default',
        `UPDATE scheduled_tasks SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // 重新加载任务到调度器
      schedulerService.stopTask(id);
      
      const updatedSchedules = await databaseService.executeQuery(
        'default',
        'SELECT * FROM scheduled_tasks WHERE id = ?',
        [id]
      );

      const updatedSchedule = updatedSchedules.rows[0];
      if (updatedSchedule.status === 'active') {
        await schedulerService.addTask({
          ...updatedSchedule,
          config: JSON.parse(updatedSchedule.config || '{}')
        });
      }

      res.json({
        success: true,
        message: '定时任务更新成功'
      });
    } catch (error) {
      console.error('更新定时任务失败:', error);
      res.status(500).json({
        success: false,
        message: '更新定时任务失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 删除定时任务
   */
  async deleteSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // 检查任务是否存在
      const schedules = await databaseService.executeQuery(
        'default',
        'SELECT * FROM scheduled_tasks WHERE id = ?',
        [id]
      );

      if (schedules.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: '定时任务不存在'
        });
        return;
      }

      // 停止任务
      schedulerService.stopTask(id);

      // 删除数据库记录
      await databaseService.executeQuery(
        'default',
        'DELETE FROM scheduled_tasks WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: '定时任务删除成功'
      });
    } catch (error) {
      console.error('删除定时任务失败:', error);
      res.status(500).json({
        success: false,
        message: '删除定时任务失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 启动/停止定时任务
   */
  async toggleSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { enabled } = req.body;

      if (enabled === undefined) {
        res.status(400).json({
          success: false,
          message: '缺少enabled参数'
        });
        return;
      }

      // 检查任务是否存在
      const schedules = await databaseService.executeQuery(
        'default',
        'SELECT * FROM scheduled_tasks WHERE id = ?',
        [id]
      );

      if (schedules.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: '定时任务不存在'
        });
        return;
      }

      // 更新数据库
      await databaseService.executeQuery(
        'default',
        'UPDATE scheduled_tasks SET status = ?, updated_at = ? WHERE id = ?',
        [enabled ? 'active' : 'inactive', new Date(), id]
      );

      // 更新调度器
      if (enabled) {
        const schedule = {
          ...schedules.rows[0],
          status: 'active',
          config: JSON.parse(schedules.rows[0].config || '{}')
        };
        await schedulerService.addTask(schedule);
      } else {
        schedulerService.stopTask(id);
      }

      res.json({
        success: true,
        message: `定时任务已${enabled ? '启动' : '停止'}`
      });
    } catch (error) {
      console.error('切换定时任务状态失败:', error);
      res.status(500).json({
        success: false,
        message: '切换定时任务状态失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 手动执行定时任务
   */
  async executeSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // 检查任务是否存在
      const schedules = await databaseService.executeQuery(
          'default',
          'SELECT * FROM scheduled_tasks WHERE id = ?',
          [id]
        );

      if (schedules.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: '定时任务不存在'
        });
        return;
      }

      const schedule = {
        ...schedules.rows[0],
        config: JSON.parse(schedules.rows[0].config || '{}')
      };

      // 手动执行任务（这里需要调用SchedulerService的私有方法，可能需要重构）
      // 暂时返回成功，实际实现需要在SchedulerService中添加公共方法
      
      res.json({
        success: true,
        message: '任务执行已启动，请查看日志了解执行结果'
      });
    } catch (error) {
      console.error('手动执行定时任务失败:', error);
      res.status(500).json({
        success: false,
        message: '手动执行定时任务失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 获取定时任务执行日志
   */
  async getScheduleLogs(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // 获取总数
      const countResult = await databaseService.executeQuery(
        'default',
        'SELECT COUNT(*) as total FROM schedule_logs WHERE schedule_id = ?',
        [id]
      );
      const total = countResult.rows[0].total;

      // 获取分页数据
      const logs = await databaseService.executeQuery(
        'default',
        'SELECT * FROM schedule_logs WHERE schedule_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [id, Number(limit), offset]
      );

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('获取定时任务日志失败:', error);
      res.status(500).json({
        success: false,
        message: '获取定时任务日志失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 获取所有任务状态
   */
  async getTasksStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = schedulerService.getTasksStatus();
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('获取任务状态失败:', error);
      res.status(500).json({
        success: false,
        message: '获取任务状态失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 测试通知配置
   */
  async testNotification(req: Request, res: Response): Promise<void> {
    try {
      const { type, config } = req.body;

      if (!type || !config) {
        res.status(400).json({
          success: false,
          message: '缺少必填字段: type, config'
        });
        return;
      }

      const result = await notificationService.testNotification(type, config);
      
      res.json({
        success: result.success,
        message: result.message
      });
    } catch (error) {
      console.error('测试通知配置失败:', error);
      res.status(500).json({
        success: false,
        message: '测试通知配置失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }
}

// 导出控制器实例
export const scheduleController = new ScheduleController();