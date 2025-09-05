import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// 用户属性接口
export interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  realName?: string;
  role: 'admin' | 'user';
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 创建时可选的属性
export interface UserCreationAttributes 
  extends Optional<UserAttributes, 'id' | 'realName' | 'isActive' | 'lastLoginAt' | 'createdAt' | 'updatedAt'> {}

// 用户模型类
export class User extends Model<UserAttributes, UserCreationAttributes> 
  implements UserAttributes {
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public realName?: string;
  public role!: 'admin' | 'user';
  public isActive!: boolean;
  public lastLoginAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 初始化模型
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '用户名',
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '邮箱',
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '密码(加密后)',
    },
    realName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'real_name',
      comment: '真实姓名',
    },
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      allowNull: false,
      defaultValue: 'user',
      comment: '用户角色',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
      comment: '是否启用',
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at',
      comment: '最后登录时间',
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
    tableName: 'users',
    modelName: 'User',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['username'],
        unique: true,
      },
      {
        fields: ['email'],
        unique: true,
      },
      {
        fields: ['role'],
      },
      {
        fields: ['is_active'],
      },
    ],
  }
);

export default User;