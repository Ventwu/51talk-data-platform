import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';
import { ScheduledTask } from './ScheduledTask';

// 任务执行日志属性接口
export interface TaskExecutionLogAttributes {
  id: number;
  taskId: number;
  status: 'running' | 'success' | 'failed' | 'timeout';
  startTime: Date;
  endTime?: Date;
  duration?: number; // 执行时长(毫秒)
  result?: any; // JSON格式的执行结果
  errorMessage?: string;
  createdAt: Date;
}

// 创建时可选的属性
export interface TaskExecutionLogCreationAttributes 
  extends Optional<TaskExecutionLogAttributes, 'id' | 'endTime' | 'duration' | 'result' | 'errorMessage' | 'createdAt'> {}

// 任务执行日志模型类
export class TaskExecutionLog extends Model<TaskExecutionLogAttributes, TaskExecutionLogCreationAttributes> 
  implements TaskExecutionLogAttributes {
  public id!: number;
  public taskId!: number;
  public status!: 'running' | 'success' | 'failed' | 'timeout';
  public startTime!: Date;
  public endTime?: Date;
  public duration?: number;
  public result?: any;
  public errorMessage?: string;
  public readonly createdAt!: Date;

  // 关联属性
  public readonly task?: ScheduledTask;
}

// 初始化模型
TaskExecutionLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'task_id',
      comment: '任务ID',
      references: {
        model: 'scheduled_tasks',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('running', 'success', 'failed', 'timeout'),
      allowNull: false,
      comment: '执行状态',
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_time',
      defaultValue: DataTypes.NOW,
      comment: '开始时间',
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_time',
      comment: '结束时间',
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '执行时长(毫秒)',
    },
    result: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '执行结果(JSON格式)',
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message',
      comment: '错误信息',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
      defaultValue: DataTypes.NOW,
      comment: '创建时间',
    },
  },
  {
    sequelize,
    tableName: 'task_execution_logs',
    modelName: 'TaskExecutionLog',
    timestamps: false, // 只使用createdAt
    underscored: true,
    indexes: [
      {
        fields: ['task_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['start_time'],
      },
      {
        fields: ['end_time'],
      },
    ],
  }
);

// 定义关联关系
TaskExecutionLog.belongsTo(ScheduledTask, {
  foreignKey: 'taskId',
  as: 'task',
});

ScheduledTask.hasMany(TaskExecutionLog, {
  foreignKey: 'taskId',
  as: 'executionLogs',
});

export default TaskExecutionLog;