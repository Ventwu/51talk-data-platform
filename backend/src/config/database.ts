import mysql from 'mysql2/promise';
import { Pool as PgPool } from 'pg';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import dotenv from 'dotenv';

dotenv.config();

// 数据库类型枚举
export enum DatabaseType {
  MYSQL = 'mysql',
  POSTGRESQL = 'postgresql',
  SQLITE = 'sqlite'
}

// 数据库连接配置接口
export interface DatabaseConfig {
  type: DatabaseType;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database: string;
  connectionLimit?: number;
  acquireTimeout?: number;
  timeout?: number;
  // SQLite特有配置
  filename?: string;
}

// 从环境变量获取数据库配置
export const getDatabaseConfig = (): DatabaseConfig => {
  const type = (process.env.DB_TYPE || 'mysql') as DatabaseType;
  
  const baseConfig: DatabaseConfig = {
    type,
    database: process.env.DB_NAME || 'talk51_data_platform'
  };

  switch (type) {
    case DatabaseType.MYSQL:
      return {
        ...baseConfig,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000
      };
    
    case DatabaseType.POSTGRESQL:
      return {
        ...baseConfig,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000
      };
    
    case DatabaseType.SQLITE:
      return {
        ...baseConfig,
        filename: process.env.DB_FILENAME || './data/database.sqlite'
      };
    
    default:
      throw new Error(`不支持的数据库类型: ${type}`);
  }
};

// 数据库连接器接口
export interface DatabaseConnector {
  testConnection(): Promise<boolean>;
  executeQuery(sql: string, params?: any[]): Promise<any>;
  executeTransaction(queries: Array<{ sql: string; params?: any[] }>): Promise<any>;
  close(): Promise<void>;
  getNowFunction(): string;
}

// MySQL连接器
class MySQLConnector implements DatabaseConnector {
  private pool: mysql.Pool;

  constructor(config: DatabaseConfig) {
    this.pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: config.connectionLimit || 10,
      queueLimit: 0,
      idleTimeout: config.timeout || 60000
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      console.log('✅ MySQL数据库连接成功');
      return true;
    } catch (error) {
      console.error('❌ MySQL数据库连接失败:', error);
      return false;
    }
  }

  async executeQuery(sql: string, params?: any[]): Promise<any> {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('MySQL查询错误:', error);
      throw error;
    }
  }

  async executeTransaction(queries: Array<{ sql: string; params?: any[] }>): Promise<any> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const results = [];
      for (const query of queries) {
        const [result] = await connection.execute(query.sql, query.params);
        results.push(result);
      }
      
      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  getNowFunction(): string {
    return 'NOW()';
  }

  async close(): Promise<void> {
    try {
      await this.pool.end();
      console.log('MySQL连接池已关闭');
    } catch (error) {
      console.error('关闭MySQL连接池失败:', error);
    }
  }
}

// PostgreSQL连接器
class PostgreSQLConnector implements DatabaseConnector {
  private pool: PgPool;

  constructor(config: DatabaseConfig) {
    this.pool = new PgPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      max: config.connectionLimit || 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: config.acquireTimeout || 60000
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('✅ PostgreSQL数据库连接成功');
      return true;
    } catch (error) {
      console.error('❌ PostgreSQL数据库连接失败:', error);
      return false;
    }
  }

  async executeQuery(sql: string, params?: any[]): Promise<any> {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows;
    } catch (error) {
      console.error('PostgreSQL查询错误:', error);
      throw error;
    }
  }

  async executeTransaction(queries: Array<{ sql: string; params?: any[] }>): Promise<any> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const results = [];
      for (const query of queries) {
        const result = await client.query(query.sql, query.params);
        results.push(result.rows);
      }
      
      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  getNowFunction(): string {
    return 'NOW()';
  }

  async close(): Promise<void> {
    try {
      await this.pool.end();
      console.log('PostgreSQL连接池已关闭');
    } catch (error) {
      console.error('关闭PostgreSQL连接池失败:', error);
    }
  }
}

// SQLite连接器
class SQLiteConnector implements DatabaseConnector {
  private db: Database | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  private async getDatabase(): Promise<Database> {
    if (!this.db) {
      this.db = await open({
        filename: this.config.filename!,
        driver: sqlite3.Database
      });
    }
    return this.db;
  }

  async testConnection(): Promise<boolean> {
    try {
      const db = await this.getDatabase();
      await db.get('SELECT 1');
      console.log('✅ SQLite数据库连接成功');
      return true;
    } catch (error) {
      console.error('❌ SQLite数据库连接失败:', error);
      return false;
    }
  }

  async executeQuery(sql: string, params?: any[]): Promise<any> {
    try {
      const db = await this.getDatabase();
      if (sql.trim().toLowerCase().startsWith('select')) {
        return await db.all(sql, params);
      } else {
        const result = await db.run(sql, params);
        return { insertId: result.lastID, affectedRows: result.changes };
      }
    } catch (error) {
      console.error('SQLite查询错误:', error);
      throw error;
    }
  }

  async executeTransaction(queries: Array<{ sql: string; params?: any[] }>): Promise<any> {
    const db = await this.getDatabase();
    try {
      await db.exec('BEGIN TRANSACTION');
      
      const results = [];
      for (const query of queries) {
        if (query.sql.trim().toLowerCase().startsWith('select')) {
          const result = await db.all(query.sql, query.params);
          results.push(result);
        } else {
          const result = await db.run(query.sql, query.params);
          results.push({ insertId: result.lastID, affectedRows: result.changes });
        }
      }
      
      await db.exec('COMMIT');
      return results;
    } catch (error) {
      await db.exec('ROLLBACK');
      throw error;
    }
  }

  getNowFunction(): string {
    return 'datetime("now")';
  }

  async close(): Promise<void> {
    try {
      if (this.db) {
        await this.db.close();
        this.db = null;
        console.log('SQLite数据库连接已关闭');
      }
    } catch (error) {
      console.error('关闭SQLite数据库连接失败:', error);
    }
  }
}

// 数据库连接器工厂
export class DatabaseConnectorFactory {
  static create(config: DatabaseConfig): DatabaseConnector {
    switch (config.type) {
      case DatabaseType.MYSQL:
        return new MySQLConnector(config);
      case DatabaseType.POSTGRESQL:
        return new PostgreSQLConnector(config);
      case DatabaseType.SQLITE:
        return new SQLiteConnector(config);
      default:
        throw new Error(`不支持的数据库类型: ${config.type}`);
    }
  }
}

// 全局数据库连接器实例
let dbConnector: DatabaseConnector;

// 初始化数据库连接
export const initDatabase = async (): Promise<DatabaseConnector> => {
  if (!dbConnector) {
    const config = getDatabaseConfig();
    dbConnector = DatabaseConnectorFactory.create(config);
    
    // 测试连接
    const isConnected = await dbConnector.testConnection();
    if (!isConnected) {
      throw new Error('数据库连接失败');
    }
  }
  return dbConnector;
};

// 获取数据库连接器实例
export const getDatabase = (): DatabaseConnector => {
  if (!dbConnector) {
    throw new Error('数据库未初始化，请先调用 initDatabase()');
  }
  return dbConnector;
};

// 兼容性函数（保持向后兼容）
export const testConnection = async (): Promise<boolean> => {
  try {
    const db = await initDatabase();
    return await db.testConnection();
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    return false;
  }
};

export const executeQuery = async (sql: string, params?: any[]): Promise<any> => {
  const db = getDatabase();
  return await db.executeQuery(sql, params);
};

export const executeTransaction = async (queries: Array<{ sql: string; params?: any[] }>): Promise<any> => {
  const db = getDatabase();
  return await db.executeTransaction(queries);
};

export const closeDatabase = async (): Promise<void> => {
  if (dbConnector) {
    await dbConnector.close();
  }
};

// 优雅关闭
process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabase();
  process.exit(0);
});

export default { initDatabase, getDatabase, closeDatabase };