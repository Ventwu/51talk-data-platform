/**
 * 数据库适配器接口
 * 定义统一的数据库操作接口，支持多种数据库类型
 */

export interface DatabaseConfig {
  type: 'mysql' | 'postgresql' | 'sqlite';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database: string;
  options?: Record<string, any>;
}

export interface QueryResult {
  rows: any[];
  rowCount: number;
  fields?: any[];
}

export interface ConnectionInfo {
  isConnected: boolean;
  database: string;
  type: string;
  version?: string;
}

export interface TableInfo {
  tableName: string;
  columns: ColumnInfo[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  isPrimaryKey: boolean;
  isAutoIncrement: boolean;
}

/**
 * 数据库适配器抽象类
 */
export abstract class DatabaseAdapter {
  protected config: DatabaseConfig;
  protected connection: any;
  protected isConnected: boolean = false;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  /**
   * 建立数据库连接
   */
  abstract connect(): Promise<void>;

  /**
   * 关闭数据库连接
   */
  abstract disconnect(): Promise<void>;

  /**
   * 测试连接
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * 执行查询
   */
  abstract query(sql: string, params?: any[]): Promise<QueryResult>;

  /**
   * 执行事务
   */
  abstract transaction(queries: Array<{ sql: string; params?: any[] }>): Promise<QueryResult[]>;

  /**
   * 获取连接信息
   */
  abstract getConnectionInfo(): Promise<ConnectionInfo>;

  /**
   * 获取数据库表列表
   */
  abstract getTables(): Promise<string[]>;

  /**
   * 获取表结构信息
   */
  abstract getTableInfo(tableName: string): Promise<TableInfo>;

  /**
   * 获取数据库版本
   */
  abstract getVersion(): Promise<string>;

  /**
   * 检查连接状态
   */
  isConnectionActive(): boolean {
    return this.isConnected;
  }

  /**
   * 获取配置信息
   */
  getConfig(): DatabaseConfig {
    return { ...this.config };
  }

  /**
   * 转义SQL标识符
   */
  abstract escapeIdentifier(identifier: string): string;

  /**
   * 转义SQL值
   */
  abstract escapeValue(value: any): string;

  /**
   * 构建分页查询
   */
  abstract buildPaginationQuery(sql: string, offset: number, limit: number): string;
}

/**
 * 数据库适配器工厂
 */
export class DatabaseAdapterFactory {
  static async create(config: DatabaseConfig): Promise<DatabaseAdapter> {
    const { MySQLAdapter } = await import('./adapters/MySQLAdapter');
    const { PostgreSQLAdapter } = await import('./adapters/PostgreSQLAdapter');
    const { SQLiteAdapter } = await import('./adapters/SQLiteAdapter');

    switch (config.type) {
      case 'mysql':
        return new MySQLAdapter(config);
      case 'postgresql':
        return new PostgreSQLAdapter(config);
      case 'sqlite':
        return new SQLiteAdapter(config);
      default:
        throw new Error(`不支持的数据库类型: ${config.type}`);
    }
  }
}