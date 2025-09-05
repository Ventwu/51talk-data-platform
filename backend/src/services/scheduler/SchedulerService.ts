import cron from 'node-cron';
import { databaseService } from '../database/DatabaseService';
import { NotificationService } from '../notification/NotificationService';
import { AppError } from '../../middleware/errorHandler';

/**
 * 定时任务配置接口
 */
export interface ScheduleConfig {
  id: string;
  name: string;
  task_type: 'data_refresh' | 'data_push';
  cron_expression: string;
  status: 'active' | 'inactive';
  config: {
    chartId?: string;
    dataSourceId?: string;
    query?: string;
    webhookUrl?: string;
    notificationType?: 'feishu' | 'wechat' | 'email';
    recipients?: string[];
    template?: string;
  };
  user_id: string;
  created_at: Date;
  updated_at: Date;
  last_run_time?: Date;
  next_run_time?: Date;
}

/**
 * 定时任务服务
 * 负责管理数据刷新和推送任务
 */
export class SchedulerService {
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * 初始化定时任务服务
   * 从数据库加载所有启用的任务
   */
  async initialize() {
    try {
      console.log('正在初始化定时任务服务...');
      
      // 从数据库加载所有启用的任务
      const schedules = await databaseService.executeQuery(
        'primary',
        'SELECT * FROM scheduled_tasks WHERE status = \'active\''
      );

      for (const schedule of schedules.rows) {
        const config: ScheduleConfig = {
          id: schedule.id,
          name: schedule.name,
          task_type: schedule.task_type,
          cron_expression: schedule.cron_expression,
          status: schedule.status,
          config: JSON.parse(schedule.config || '{}'),
          user_id: schedule.user_id,
          created_at: new Date(schedule.created_at),
          updated_at: new Date(schedule.updated_at),
          last_run_time: schedule.last_run_time ? new Date(schedule.last_run_time) : undefined,
          next_run_time: schedule.next_run_time ? new Date(schedule.next_run_time) : undefined
        };
        await this.addTask(config);
      }

      console.log(`定时任务服务初始化完成，加载了 ${schedules.rows.length} 个任务`);
    } catch (error) {
      console.error('定时任务服务初始化失败:', error);
      throw new AppError(`定时任务服务初始化失败: ${error}`, 500);
    }
  }

  /**
   * 添加定时任务
   */
  async addTask(config: ScheduleConfig): Promise<void> {
    try {
      // 验证cron表达式
      if (!cron.validate(config.cron_expression)) {
        throw new AppError('无效的cron表达式', 400);
      }

      // 如果任务已存在，先停止
      if (this.tasks.has(config.id)) {
        this.stopTask(config.id);
      }

      // 创建任务
      const task = cron.schedule(config.cron_expression, async () => {
        await this.executeTask(config);
      }, {
        scheduled: false,
        timezone: 'Asia/Shanghai'
      });

      // 保存任务
      this.tasks.set(config.id, task);

      // 如果启用，立即开始
      if (config.status === 'active') {
        task.start();
        console.log(`定时任务 ${config.name} (${config.id}) 已启动`);
      }

      // 更新下次运行时间
      await this.updateNextRunTime(config.id, config.cron_expression);
    } catch (error) {
      console.error(`添加定时任务失败:`, error);
      throw new AppError(`添加定时任务失败: ${error}`, 500);
    }
  }

  /**
   * 停止定时任务
   */
  stopTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.stop();
      this.tasks.delete(taskId);
      console.log(`定时任务 ${taskId} 已停止`);
    }
  }

  /**
   * 启动定时任务
   */
  startTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.start();
      console.log(`定时任务 ${taskId} 已启动`);
    }
  }

  /**
   * 执行定时任务
   */
  private async executeTask(config: ScheduleConfig): Promise<void> {
    const startTime = new Date();
    console.log(`开始执行定时任务: ${config.name} (${config.id})`);

    try {
      // 更新最后运行时间
      await this.updateLastRunTime(config.id, startTime);

      switch (config.task_type) {
        case 'data_refresh':
          await this.executeDataRefresh(config);
          break;
        case 'data_push':
          await this.executeDataPush(config);
          break;
        default:
          throw new Error(`不支持的任务类型: ${config.task_type}`);
      }

      console.log(`定时任务 ${config.name} 执行成功，耗时: ${Date.now() - startTime.getTime()}ms`);
    } catch (error) {
      console.error(`定时任务 ${config.name} 执行失败:`, error);
      
      // 记录错误日志
      await this.logTaskError(config.id, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * 执行数据刷新任务
   */
  private async executeDataRefresh(config: ScheduleConfig): Promise<void> {
    const { chartId, dataSourceId, query } = config.config;

    if (chartId) {
      // 刷新图表数据缓存
      const charts = await databaseService.executeQuery(
        'primary',
        'SELECT * FROM charts WHERE id = ?',
        [chartId]
      );

      if (charts.rows.length === 0) {
        throw new Error(`图表 ${chartId} 不存在`);
      }

      const chart = charts.rows[0];
      // 这里可以实现数据缓存刷新逻辑
      console.log(`刷新图表 ${chart.name} 的数据`);
    } else if (dataSourceId && query) {
      // 执行自定义查询
      const dataSources = await databaseService.executeQuery(
        'primary',
        'SELECT name FROM data_sources WHERE id = ?',
        [dataSourceId]
      );

      if (dataSources.rows.length === 0) {
        throw new Error(`数据源 ${dataSourceId} 不存在`);
      }

      const dataSourceName = dataSources.rows[0].name;
      const result = await databaseService.executeQuery(dataSourceName, query);
      console.log(`执行数据刷新查询，返回 ${result.rows.length} 条记录`);
    }
  }

  /**
   * 执行数据推送任务
   */
  private async executeDataPush(config: ScheduleConfig): Promise<void> {
    const { chartId, dataSourceId, query, notificationType, webhookUrl, recipients, template } = config.config;

    let data: any[] = [];
    let title = '数据推送';

    // 获取数据
    if (chartId) {
      const result = await databaseService.executeQuery(
        'primary',
        `SELECT c.*, ds.name as ds_name FROM charts c 
         LEFT JOIN data_sources ds ON c.data_source_id = ds.id 
         WHERE c.id = ?`,
        [chartId]
      );

      if (result.rows.length === 0) {
        throw new Error(`图表 ${chartId} 不存在`);
      }

      const chart = result.rows[0];
      title = `图表数据推送: ${chart.name}`;
      
      if (chart.query_sql && chart.ds_name) {
        const result = await databaseService.executeQuery(chart.ds_name, chart.query_sql);
        data = result.rows;
      }
    } else if (dataSourceId && query) {
      const dataSources = await databaseService.executeQuery(
      'primary',
        'SELECT name FROM data_sources WHERE id = ?',
        [dataSourceId]
      );

      if (dataSources.rows.length === 0) {
        throw new Error(`数据源 ${dataSourceId} 不存在`);
      }

      const dataSourceName = dataSources.rows[0].name;
      const result = await databaseService.executeQuery(dataSourceName, query);
      data = result.rows;
      title = '自定义查询数据推送';
    }

    // 发送通知
    if (notificationType && data.length > 0) {
      const message = this.formatDataMessage(data, template);
      
      switch (notificationType) {
        case 'feishu':
          if (webhookUrl) {
            await this.notificationService.sendFeishuMessage(webhookUrl, title, message);
          }
          break;
        case 'wechat':
          if (webhookUrl) {
            await this.notificationService.sendWechatMessage(webhookUrl, title, message);
          }
          break;
        case 'email':
          if (recipients && recipients.length > 0) {
            await this.notificationService.sendEmail(recipients, title, message);
          }
          break;
      }
    }

    console.log(`数据推送完成，推送了 ${data.length} 条记录`);
  }

  /**
   * 格式化数据消息
   */
  private formatDataMessage(data: any[], template?: string): string {
    if (template) {
      // 使用自定义模板
      return template.replace(/\{\{data\}\}/g, JSON.stringify(data, null, 2));
    }

    // 默认格式
    if (data.length === 0) {
      return '暂无数据';
    }

    const summary = `共 ${data.length} 条记录`;
    const preview = data.slice(0, 5).map((row, index) => {
      const fields = Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(', ');
      return `${index + 1}. ${fields}`;
    }).join('\n');

    return `${summary}\n\n数据预览:\n${preview}${data.length > 5 ? '\n...' : ''}`;
  }

  /**
   * 更新任务最后运行时间
   */
  private async updateLastRunTime(taskId: string, runTime: Date): Promise<void> {
    try {
      await databaseService.executeQuery(
      'primary',
        'UPDATE scheduled_tasks SET last_run_time = ? WHERE id = ?',
        [runTime, taskId]
      );
    } catch (error) {
      console.error('更新任务运行时间失败:', error);
    }
  }

  /**
   * 更新任务下次运行时间
   */
  private async updateNextRunTime(taskId: string, cronExpression: string): Promise<void> {
    try {
      // 这里可以使用cron-parser库来计算下次运行时间
      // 暂时使用简单的逻辑
      const nextRun = new Date(Date.now() + 60 * 60 * 1000); // 1小时后
      
      await databaseService.executeQuery(
        'primary',
        'UPDATE scheduled_tasks SET next_run_time = ? WHERE id = ?',
        [nextRun, taskId]
      );
    } catch (error) {
      console.error('更新任务下次运行时间失败:', error);
    }
  }

  /**
   * 记录任务错误日志
   */
  private async logTaskError(taskId: string, error: string): Promise<void> {
    try {
      await databaseService.executeQuery(
        'primary',
        'INSERT INTO schedule_logs (schedule_id, status, error_message, created_at) VALUES (?, ?, ?, NOW())',
        [taskId, 'error', error]
      );
    } catch (logError) {
      console.error('记录任务错误日志失败:', logError);
    }
  }

  /**
   * 获取所有任务状态
   */
  getTasksStatus(): { [key: string]: { running: boolean; nextRun?: Date } } {
    const status: { [key: string]: { running: boolean; nextRun?: Date } } = {};
    
    this.tasks.forEach((task, taskId) => {
      status[taskId] = {
        running: true // 如果任务在Map中，说明正在运行
      };
    });
    
    return status;
  }

  /**
   * 停止所有任务
   */
  stopAllTasks(): void {
    this.tasks.forEach((task, taskId) => {
      task.stop();
      console.log(`定时任务 ${taskId} 已停止`);
    });
    this.tasks.clear();
    console.log('所有定时任务已停止');
  }
}

// 导出服务实例
export const schedulerService = new SchedulerService();