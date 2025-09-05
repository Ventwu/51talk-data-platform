import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';
import { User } from './User';

// 通知配置属性接口
export interface NotificationConfigAttributes {
  id: number;
  name: string;
  type: 'feishu' | 'wechat' | 'email' | 'webhook';
  config: any; // JSON配置
  isActive: boolean;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

// 创建时可选的属性
export interface NotificationConfigCreationAttributes 
  extends Optional<NotificationConfigAttributes, 'id' | 'isActive' | 'createdAt' | 'updatedAt'> {}

// 通知配置模型类
export class NotificationConfig extends Model<NotificationConfigAttributes, NotificationConfigCreationAttributes> 
  implements NotificationConfigAttributes {
  public id!: number;
  public name!: string;
  public type!: 'feishu' | 'wechat' | 'email' | 'webhook';
  public config!: any;
  public isActive!: boolean;
  public createdBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 关联属性
  public readonly creator?: User;
}

// 初始化模型
NotificationConfig.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '配置名称',
    },
    type: {
      type: DataTypes.ENUM('feishu', 'wechat', 'email', 'webhook'),
      allowNull: false,
      comment: '通知类型',
    },
    config: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: '通知配置(JSON格式)',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
      comment: '是否启用',
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
    tableName: 'notification_configs',
    modelName: 'NotificationConfig',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['type'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['created_by'],
      },
      {
        fields: ['type', 'is_active'],
      },
    ],
  }
);

// 定义关联关系
NotificationConfig.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
});

export default NotificationConfig;