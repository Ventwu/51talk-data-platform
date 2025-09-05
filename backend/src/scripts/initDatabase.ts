import { DatabaseConnector, getDatabase, DatabaseType, initDatabase } from '../config/database';
import { DatabaseMigrationHelper } from '../utils/sqlTranslator';
import fs from 'fs';
import path from 'path';

/**
 * 数据库初始化脚本
 */
export class DatabaseInitializer {
  private connector: DatabaseConnector;
  private dbType: DatabaseType;

  constructor(connector: DatabaseConnector, dbType: DatabaseType) {
    this.connector = connector;
    this.dbType = dbType;
  }

  /**
   * 初始化数据库表结构
   */
  async initializeTables(): Promise<void> {
    console.log(`正在初始化 ${this.dbType} 数据库表结构...`);

    try {
      // 获取建表语句
      const createTableSQLs = DatabaseMigrationHelper.generateCreateTableSQL(this.dbType);

      // 按顺序创建表
      const tableOrder = ['users', 'data_sources', 'dashboards', 'charts', 'scheduled_tasks', 'notifications', 'system_configs', 'operation_logs', 'data_cache'];
      
      for (const tableName of tableOrder) {
        if (createTableSQLs[tableName]) {
          console.log(`创建表: ${tableName}`);
          console.log(`SQL: ${createTableSQLs[tableName]}`);
          await this.connector.executeQuery(createTableSQLs[tableName]);
          console.log(`✓ 表 ${tableName} 创建成功`);
        }
      }

      // 创建索引
      await this.createIndexes();

      // 插入初始数据
      await this.insertInitialData();

      console.log('✓ 数据库初始化完成');
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建索引
   */
  private async createIndexes(): Promise<void> {
    console.log('创建数据库索引...');

    const indexes = [
      // 用户表索引
      'CREATE INDEX idx_users_email ON users(email)',
      'CREATE INDEX idx_users_username ON users(username)',
      'CREATE INDEX idx_users_status ON users(status)',
      
      // 数据源表索引
      'CREATE INDEX idx_data_sources_user_id ON data_sources(user_id)',
      'CREATE INDEX idx_data_sources_type ON data_sources(type)',
      'CREATE INDEX idx_data_sources_status ON data_sources(status)',
      
      // 仪表盘表索引
      'CREATE INDEX idx_dashboards_user_id ON dashboards(user_id)',
      'CREATE INDEX idx_dashboards_is_public ON dashboards(is_public)',
      
      // 图表表索引
      'CREATE INDEX idx_charts_dashboard_id ON charts(dashboard_id)',
      'CREATE INDEX idx_charts_data_source_id ON charts(data_source_id)',
      
      // 定时任务表索引
      'CREATE INDEX idx_scheduled_tasks_user_id ON scheduled_tasks(user_id)',
      'CREATE INDEX idx_scheduled_tasks_status ON scheduled_tasks(status)',
      'CREATE INDEX idx_scheduled_tasks_next_run ON scheduled_tasks(next_run_time)',
      
      // 通知表索引
      'CREATE INDEX idx_notifications_user_id ON notifications(user_id)',
      'CREATE INDEX idx_notifications_type ON notifications(type)',
      'CREATE INDEX idx_notifications_status ON notifications(status)',
      
      // 系统配置表索引
      'CREATE INDEX idx_system_configs_category ON system_configs(category)',
      'CREATE INDEX idx_system_configs_key ON system_configs(config_key)',
      
      // 操作日志表索引
      'CREATE INDEX idx_operation_logs_user_id ON operation_logs(user_id)',
      'CREATE INDEX idx_operation_logs_operation ON operation_logs(operation_type)',
      'CREATE INDEX idx_operation_logs_resource ON operation_logs(resource_type)',
      'CREATE INDEX idx_operation_logs_created_at ON operation_logs(created_at)',
      
      // 数据缓存表索引
      'CREATE INDEX idx_data_cache_key ON data_cache(cache_key)',
      'CREATE INDEX idx_data_cache_expires_at ON data_cache(expires_at)'
    ];

    for (const indexSQL of indexes) {
      try {
        await this.connector.executeQuery(indexSQL);
        console.log(`✓ 索引创建成功: ${indexSQL.split(' ')[2]}`);
      } catch (error: any) {
        // 忽略索引已存在的错误
        if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
          console.warn(`索引创建警告: ${error.message}`);
        }
      }
    }
  }

  /**
   * 插入初始数据
   */
  private async insertInitialData(): Promise<void> {
    console.log('插入初始数据...');

    try {
      // 检查是否已有管理员用户
      const adminExists = await this.connector.executeQuery(
        'SELECT COUNT(*) as count FROM users WHERE role = ?',
        ['admin']
      );

      if (adminExists[0].count === 0) {
        // 创建默认管理员用户
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await this.connector.executeQuery(
          'INSERT INTO users (username, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
          ['admin', 'admin@51talk.com', hashedPassword, 'admin', 'active']
        );
        console.log('✓ 默认管理员用户创建成功 (用户名: admin, 密码: admin123)');
      }

      // 插入系统配置
      const systemConfigs = [
        {
          category: 'system',
          key: 'site_name',
          value: '51Talk数据中台',
          description: '网站名称'
        },
        {
          category: 'system',
          key: 'site_description',
          value: '51Talk在线教育数据分析平台',
          description: '网站描述'
        },
        {
          category: 'system',
          key: 'max_dashboard_count',
          value: '50',
          description: '每个用户最大仪表盘数量'
        },
        {
          category: 'cache',
          key: 'default_ttl',
          value: '3600',
          description: '默认缓存过期时间（秒）'
        },
        {
          category: 'notification',
          key: 'email_enabled',
          value: 'false',
          description: '是否启用邮件通知'
        }
      ];

      for (const config of systemConfigs) {
        try {
          await this.connector.executeQuery(
            'INSERT INTO system_configs (category, config_key, config_value, description) VALUES (?, ?, ?, ?)',
            [config.category, config.key, config.value, config.description]
          );
        } catch (error: any) {
          // 忽略重复键错误
          if (!error.message.includes('duplicate') && !error.message.includes('UNIQUE')) {
            console.warn(`系统配置插入警告: ${error.message}`);
          }
        }
      }
      console.log('✓ 系统配置插入完成');

    } catch (error) {
      console.error('初始数据插入失败:', error);
      throw error;
    }
  }

  /**
   * 检查表是否存在
   */
  async checkTableExists(tableName: string): Promise<boolean> {
    try {
      let sql: string;
      
      switch (this.dbType) {
        case DatabaseType.MYSQL:
          sql = 'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?';
          break;
        case DatabaseType.POSTGRESQL:
          sql = 'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = ?';
          break;
        case DatabaseType.SQLITE:
          sql = 'SELECT COUNT(*) as count FROM sqlite_master WHERE type = "table" AND name = ?';
          break;
        default:
          return false;
      }

      const result = await this.connector.executeQuery(sql, [tableName]);
      return result[0].count > 0;
    } catch (error) {
      console.error(`检查表 ${tableName} 是否存在时出错:`, error);
      return false;
    }
  }

  /**
   * 删除所有表（危险操作）
   */
  async dropAllTables(): Promise<void> {
    console.log('警告: 正在删除所有表...');
    
    const tables = ['operation_logs', 'data_cache', 'system_configs', 'notifications', 'scheduled_tasks', 'charts', 'dashboards', 'data_sources', 'users'];
    
    for (const table of tables) {
      try {
        await this.connector.executeQuery(`DROP TABLE IF EXISTS ${table}`);
        console.log(`✓ 表 ${table} 删除成功`);
      } catch (error) {
        console.warn(`删除表 ${table} 时出错:`, error);
      }
    }
  }

  /**
   * 备份数据库结构
   */
  async backupSchema(outputPath: string): Promise<void> {
    console.log('备份数据库结构...');
    
    try {
      const schema = DatabaseMigrationHelper.generateInitScript(this.dbType);
      
      // 确保输出目录存在
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, schema, 'utf8');
      console.log(`✓ 数据库结构已备份到: ${outputPath}`);
    } catch (error) {
      console.error('备份数据库结构失败:', error);
      throw error;
    }
  }
}

/**
 * 命令行工具函数
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // 强制使用SQLite进行初始化
    process.env.DB_TYPE = 'sqlite';
    process.env.DB_FILENAME = './data/database.sqlite';
    
    // 初始化数据库连接
    await initDatabase();
    const connector = getDatabase();
    const dbType = process.env.DB_TYPE as DatabaseType || DatabaseType.SQLITE;
    
    const initializer = new DatabaseInitializer(connector, dbType);
    
    console.log('开始初始化数据库...');
    await initializer.initializeTables();
    console.log('数据库初始化完成!');
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

/**
 * 如果直接运行此脚本
 */
if (require.main === module) {
  initializeDatabase();
}

export default DatabaseInitializer;