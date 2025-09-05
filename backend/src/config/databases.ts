import { DatabaseConfig } from '../services/database/DatabaseAdapter';
import { databaseManager } from '../services/database/DatabaseManager';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 数据库配置定义
 */
interface DatabaseConfigs {
  [key: string]: DatabaseConfig;
}

/**
 * 默认数据库配置
 */
const defaultDatabaseConfigs: DatabaseConfigs = {
  // 主数据库 - 根据环境变量动态配置
  primary: (() => {
    const dbType = process.env.DB_TYPE || 'mysql';
    
    if (dbType === 'sqlite') {
      return {
        type: 'sqlite' as const,
        database: process.env.DB_FILENAME || './data/database.sqlite',
        options: {
          mode: 'OPEN_READWRITE | OPEN_CREATE'
        }
      };
    }
    
    if (dbType === 'postgresql') {
      return {
        type: 'postgresql' as const,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || '51talk_data_platform',
        options: {
          ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
          connectionTimeoutMillis: 30000,
          idleTimeoutMillis: 30000,
          max: 20
        }
      };
    }
    
    // 默认MySQL配置
    return {
      type: 'mysql' as const,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || '51talk_data_platform',
      options: {
        charset: 'utf8mb4',
        timezone: '+08:00',
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true
      }
    };
  })(),

  // PostgreSQL 示例配置
  postgres_example: {
    type: 'postgresql',
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432'),
    username: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || '',
    database: process.env.PG_DATABASE || 'example_db',
    options: {
      ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      max: 20
    }
  },

  // SQLite 示例配置
  sqlite_example: {
    type: 'sqlite',
    database: process.env.SQLITE_PATH || './data/example.db',
    options: {
      mode: 'OPEN_READWRITE | OPEN_CREATE'
    }
  },

  // 测试数据库 - SQLite
  test: {
    type: 'sqlite',
    database: ':memory:', // 内存数据库，用于测试
    options: {}
  }
};

/**
 * 从环境变量加载数据库配置
 */
function loadDatabaseConfigsFromEnv(): DatabaseConfigs {
  const configs: DatabaseConfigs = { ...defaultDatabaseConfigs };

  // 支持通过环境变量动态添加数据库配置
  // 格式: DB_CONFIG_<NAME>_TYPE, DB_CONFIG_<NAME>_HOST, etc.
  const envKeys = Object.keys(process.env);
  const configNames = new Set<string>();

  // 查找所有数据库配置名称
  envKeys.forEach(key => {
    const match = key.match(/^DB_CONFIG_([A-Z_]+)_TYPE$/);
    if (match) {
      configNames.add(match[1].toLowerCase());
    }
  });

  // 为每个配置名称构建配置对象
  configNames.forEach(name => {
    const prefix = `DB_CONFIG_${name.toUpperCase()}`;
    const type = process.env[`${prefix}_TYPE`] as 'mysql' | 'postgresql' | 'sqlite';
    
    if (type) {
      const config: DatabaseConfig = {
        type,
        database: '', // 临时值，后面会根据类型设置
        options: {}
      };

      // 根据数据库类型设置配置
      if (type === 'mysql' || type === 'postgresql') {
        config.host = process.env[`${prefix}_HOST`] || 'localhost';
        config.port = parseInt(process.env[`${prefix}_PORT`] || (type === 'mysql' ? '3306' : '5432'));
        config.username = process.env[`${prefix}_USER`] || (type === 'mysql' ? 'root' : 'postgres');
        config.password = process.env[`${prefix}_PASSWORD`] || '';
        config.database = process.env[`${prefix}_DATABASE`] || name;
      } else if (type === 'sqlite') {
        config.database = process.env[`${prefix}_PATH`] || `./data/${name}.db`;
      }

      configs[name] = config;
      console.log(`📝 从环境变量加载数据库配置: ${name} (${type})`);
    }
  });

  return configs;
}

/**
 * 初始化数据库配置
 */
export async function initializeDatabaseConfigs(): Promise<void> {
  try {
    console.log('🔧 初始化数据库配置...');
    
    // 加载配置
    const configs = loadDatabaseConfigsFromEnv();
    
    // 添加配置到数据库管理器
    Object.entries(configs).forEach(([name, config]) => {
      databaseManager.addConfig(name, config);
    });
    
    console.log(`✅ 数据库配置初始化完成，共加载 ${Object.keys(configs).length} 个配置`);
    
    // 测试主数据库连接
    if (configs.primary) {
      try {
        const isConnected = await databaseManager.testConnection('primary');
        if (isConnected) {
          console.log('✅ 主数据库连接测试成功');
        } else {
          console.warn('⚠️ 主数据库连接测试失败');
        }
      } catch (error) {
        console.error('❌ 主数据库连接测试出错:', error);
      }
    }
    
  } catch (error) {
    console.error('❌ 数据库配置初始化失败:', error);
    throw error;
  }
}

/**
 * 获取数据库配置
 */
export function getDatabaseConfig(name: string): DatabaseConfig | undefined {
  return databaseManager.getConfig(name);
}

/**
 * 添加数据库配置
 */
export function addDatabaseConfig(name: string, config: DatabaseConfig): void {
  databaseManager.addConfig(name, config);
}

/**
 * 移除数据库配置
 */
export async function removeDatabaseConfig(name: string): Promise<void> {
  await databaseManager.removeConfig(name);
}

/**
 * 获取所有数据库配置名称
 */
export function getDatabaseConfigNames(): string[] {
  return databaseManager.getConfigNames();
}

/**
 * 验证数据库配置
 */
export function validateDatabaseConfig(config: DatabaseConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 检查必需字段
  if (!config.type) {
    errors.push('数据库类型不能为空');
  } else if (!['mysql', 'postgresql', 'sqlite'].includes(config.type)) {
    errors.push('不支持的数据库类型');
  }
  
  if (config.type === 'mysql' || config.type === 'postgresql') {
    if (!config.host) errors.push('主机地址不能为空');
    if (!config.port || config.port <= 0 || config.port > 65535) errors.push('端口号无效');
    if (!config.username) errors.push('用户名不能为空');
    if (!config.database) errors.push('数据库名不能为空');
  } else if (config.type === 'sqlite') {
    if (!config.database) errors.push('数据库文件路径不能为空');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 导出默认配置（用于测试）
 */
export { defaultDatabaseConfigs };