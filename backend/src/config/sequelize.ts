import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 创建Sequelize实例
 */
function createSequelizeInstance(): Sequelize {
  const dbType = (process.env.DB_TYPE || 'mysql') as 'mysql' | 'postgres' | 'sqlite';
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306');
  const username = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'talk51_data_platform';

  const config: any = {
    host,
    port,
    dialect: dbType,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  };

  // 对于SQLite，不需要host、port、username、password
  if (dbType === 'sqlite') {
    const sqliteStorage = process.env.DB_FILENAME || './data/database.sqlite';
    return new Sequelize({
      dialect: 'sqlite',
      storage: sqliteStorage,
      logging: config.logging,
      pool: config.pool,
    });
  }

  return new Sequelize(database, username, password, config);
}

// 创建全局Sequelize实例
export const sequelize = createSequelizeInstance();

/**
 * 初始化数据库连接
 */
export const initSequelize = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Sequelize数据库连接成功');
  } catch (error) {
    console.error('❌ Sequelize数据库连接失败:', error);
    throw error;
  }
};

/**
 * 同步数据库模型
 */
export const syncModels = async (force: boolean = false): Promise<void> => {
  try {
    await sequelize.sync({ force });
    console.log('✅ 数据库模型同步成功');
  } catch (error) {
    console.error('❌ 数据库模型同步失败:', error);
    throw error;
  }
};

/**
 * 关闭数据库连接
 */
export const closeSequelize = async (): Promise<void> => {
  try {
    await sequelize.close();
    console.log('✅ Sequelize数据库连接已关闭');
  } catch (error) {
    console.error('❌ 关闭Sequelize数据库连接失败:', error);
    throw error;
  }
};

export default sequelize;