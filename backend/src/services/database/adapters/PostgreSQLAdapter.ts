import { Pool, PoolClient } from 'pg';
import { DatabaseAdapter, DatabaseConfig, QueryResult, ConnectionInfo, TableInfo, ColumnInfo } from '../DatabaseAdapter';

/**
 * PostgreSQL数据库适配器
 */
export class PostgreSQLAdapter extends DatabaseAdapter {
  private pool: Pool | null = null;

  constructor(config: DatabaseConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    try {
      const poolConfig = {
        host: this.config.host || 'localhost',
        port: this.config.port || 5432,
        user: this.config.username,
        password: this.config.password || '',
        database: this.config.database,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 60000,
        ...this.config.options
      };

      this.pool = new Pool(poolConfig);
      
      // 测试连接
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      
      this.isConnected = true;
      console.log(`✅ PostgreSQL数据库连接成功: ${this.config.database}`);
    } catch (error) {
      this.isConnected = false;
      console.error('❌ PostgreSQL数据库连接失败:', error);
      throw new Error(`PostgreSQL连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
      }
      this.isConnected = false;
      console.log('PostgreSQL数据库连接已关闭');
    } catch (error) {
      console.error('关闭PostgreSQL连接失败:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.pool) {
        return false;
      }
      
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error('PostgreSQL连接测试失败:', error);
      return false;
    }
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    if (!this.pool) {
      throw new Error('数据库未连接');
    }

    try {
      const result = await this.pool.query(sql, params || []);
      
      return {
        rows: result.rows || [],
        rowCount: result.rowCount || 0,
        fields: result.fields
      };
    } catch (error) {
      console.error('PostgreSQL查询错误:', error);
      throw new Error(`查询执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async transaction(queries: Array<{ sql: string; params?: any[] }>): Promise<QueryResult[]> {
    if (!this.pool) {
      throw new Error('数据库未连接');
    }

    const client: PoolClient = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const results: QueryResult[] = [];
      for (const query of queries) {
        const result = await client.query(query.sql, query.params || []);
        results.push({
          rows: result.rows || [],
          rowCount: result.rowCount || 0,
          fields: result.fields
        });
      }
      
      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('PostgreSQL事务执行失败:', error);
      throw new Error(`事务执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      client.release();
    }
  }

  async getConnectionInfo(): Promise<ConnectionInfo> {
    const version = await this.getVersion();
    return {
      isConnected: this.isConnected,
      database: this.config.database,
      type: 'PostgreSQL',
      version: version
    };
  }

  async getTables(): Promise<string[]> {
    const result = await this.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    return result.rows.map((row: any) => row.table_name);
  }

  async getTableInfo(tableName: string): Promise<TableInfo> {
    const result = await this.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
        CASE WHEN column_default LIKE 'nextval%' THEN true ELSE false END as is_auto_increment
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT ku.column_name
        FROM information_schema.table_constraints tc
        INNER JOIN information_schema.key_column_usage ku
        ON tc.constraint_name = ku.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_name = $1
      ) pk ON c.column_name = pk.column_name
      WHERE c.table_name = $1
      ORDER BY c.ordinal_position
    `, [tableName]);
    
    const columns: ColumnInfo[] = result.rows.map((row: any) => ({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES',
      defaultValue: row.column_default,
      isPrimaryKey: row.is_primary_key,
      isAutoIncrement: row.is_auto_increment
    }));

    return {
      tableName,
      columns
    };
  }

  async getVersion(): Promise<string> {
    const result = await this.query('SELECT version()');
    return result.rows[0]?.version || 'Unknown';
  }

  escapeIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`;
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
      return value ? 'true' : 'false';
    }
    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }
    return `'${String(value).replace(/'/g, "''")}'`;
  }

  buildPaginationQuery(sql: string, offset: number, limit: number): string {
    return `${sql} LIMIT ${limit} OFFSET ${offset}`;
  }
}