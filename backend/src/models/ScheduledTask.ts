import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';
import { User } from './User';

// 定时任务属性接口
export interface ScheduledTaskAttributes {
  id: number;
  name: string;
  description?: string;
  type: 'data_refresh' | 'notification' | 'report';
  cronExpression: string;
  config: any; // JSON配置
  status: 'active' | 'inactive' | 'error';
  lastRunAt?: Date;
  nextRunAt?: Date;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

// 创建时可选的属性
export interface ScheduledTaskCreationAttributes 
  extends Optional<ScheduledTaskAttributes, 'id' | 'lastRunAt' | 'nextRunAt' | 'createdAt' | 'updatedAt'> {}

// 定时任务模型类
export class ScheduledTask extends Model<ScheduledTaskAttributes, ScheduledTaskCreationAttributes> 
  implements ScheduledTaskAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public type!: 'data_refresh' | 'notification' | 'report';
  public cronExpression!: string;
  public config!: any;
  public status!: 'active' | 'inactive' | 'error';
  public lastRunAt?: Date;
  public nextRunAt?: Date;
  public createdBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 关联属性
  public readonly creator?: User;
}

// 初始化模型
ScheduledTask.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '任务名称',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '任务描述',
    },
    type: {
      type: DataTypes.ENUM('data_refresh', 'notification', 'report'),
      allowNull: false,
      comment: '任务类型',
    },
    cronExpression: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'cron_expression',
      comment: 'Cron表达式',
    },
    config: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: '任务配置(JSON格式)',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'error'),
      allowNull: false,
      defaultValue: 'inactive',
      comment: '任务状态',
    },
    lastRunAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_run_at',
      comment: '最后执行时间',
    },
    nextRunAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'next_run_at',
      comment: '下次执行时间',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
      comment: '创建者ID',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
      defaultValue: DataTypes.NOW,
      comment: '创建时间',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
      defaultValue: DataTypes.NOW,
      comment: '更新时间',
    },
  },
  {
    sequelize,
    tableName: 'scheduled_tasks',
    modelName: 'ScheduledTask',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['type'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['next_run_at'],
      },
      {
        fields: ['created_by'],
      },
      {
        fields: ['cron_expression'],
      },
    ],
  }
);

// 定义关联关系
ScheduledTask.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
});

export default ScheduledTask;