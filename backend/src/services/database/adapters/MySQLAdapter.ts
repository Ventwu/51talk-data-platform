import mysql from 'mysql2/promise';
import { DatabaseAdapter, DatabaseConfig, QueryResult, ConnectionInfo, TableInfo, ColumnInfo } from '../DatabaseAdapter';

/**
 * MySQL数据库适配器
 */
export class MySQLAdapter extends DatabaseAdapter {
  private pool: mysql.Pool | null = null;

  constructor(config: DatabaseConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    try {
      const poolConfig: mysql.PoolOptions = {
        host: this.config.host || 'localhost',
        port: this.config.port || 3306,
        user: this.config.username,
        password: this.config.password || '',
        database: this.config.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ...this.config.options
      };

      this.pool = mysql.createPool(poolConfig);
      
      // 测试连接
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      
      this.isConnected = true;
      console.log(`✅ MySQL数据库连接成功: ${this.config.database}`);
    } catch (error) {
      this.isConnected = false;
      console.error('❌ MySQL数据库连接失败:', error);
      throw new Error(`MySQL连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
      }
      this.isConnected = false;
      console.log('MySQL数据库连接已关闭');
    } catch (error) {
      console.error('关闭MySQL连接失败:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.pool) {
        return false;
      }
      
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      return true;
    } catch (error) {
      console.error('MySQL连接测试失败:', error);
      return false;
    }
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    if (!this.pool) {
      throw new Error('数据库未连接');
    }

    try {
      const [rows, fields] = await this.pool.execute(sql, params || []);
      
      return {
        rows: Array.isArray(rows) ? rows : [],
        rowCount: Array.isArray(rows) ? rows.length : 0,
        fields: fields
      };
    } catch (error) {
      console.error('MySQL查询错误:', error);
      throw new Error(`查询执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async transaction(queries: Array<{ sql: string; params?: any[] }>): Promise<QueryResult[]> {
    if (!this.pool) {
      throw new Error('数据库未连接');
    }

    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const results: QueryResult[] = [];
      for (const query of queries) {
        const [rows, fields] = await connection.execute(query.sql, query.params || []);
        results.push({
          rows: Array.isArray(rows) ? rows : [],
          rowCount: Array.isArray(rows) ? rows.length : 0,
          fields: fields
        });
      }
      
      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      console.error('MySQL事务执行失败:', error);
      throw new Error(`事务执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      connection.release();
    }
  }

  async getConnectionInfo(): Promise<ConnectionInfo> {
    const version = await this.getVersion();
    return {
      isConnected: this.isConnected,
      database: this.config.database,
      type: 'MySQL',
      version: version
    };
  }

  async getTables(): Promise<string[]> {
    const result = await this.query('SHOW TABLES');
    return result.rows.map((row: any) => Object.values(row)[0] as string);
  }

  async getTableInfo(tableName: string): Promise<TableInfo> {
    const result = await this.query('DESCRIBE ??', [tableName]);
    
    const columns: ColumnInfo[] = result.rows.map((row: any) => ({
      name: row.Field,
      type: row.Type,
      nullable: row.Null === 'YES',
      defaultValue: row.Default,
      isPrimaryKey: row.Key === 'PRI',
      isAutoIncrement: row.Extra.includes('auto_increment')
    }));

    return {
      tableName,
      columns
    };
  }

  async getVersion(): Promise<string> {
    const result = await this.query('SELECT VERSION() as version');
    return result.rows[0]?.version || 'Unknown';
  }

  escapeIdentifier(identifier: string): string {
    return `\`${identifier.replace(/`/g, '``')}\``;
  }

  escapeValue(value: any): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`;
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'boolean') {
      return value ? '1' : '0';
    }
    if (value instanceof Date) {
      return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
    }
    return `'${String(value).replace(/'/g, "''")}'`;
  }

  buildPaginationQuery(sql: string, offset: number, limit: number): string {
    return `${sql} LIMIT ${limit} OFFSET ${offset}`;
  }
}