import sqlite3 from 'sqlite3';
import { DatabaseAdapter, DatabaseConfig, QueryResult, ConnectionInfo, TableInfo, ColumnInfo } from '../DatabaseAdapter';

/**
 * SQLite数据库适配器
 */
export class SQLiteAdapter extends DatabaseAdapter {
  private db: sqlite3.Database | null = null;

  constructor(config: DatabaseConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const dbPath = this.config.database;
        
        this.db = new sqlite3.Database(dbPath, (err) => {
          if (err) {
            this.isConnected = false;
            console.error('❌ SQLite数据库连接失败:', err);
            reject(new Error(`SQLite连接失败: ${err.message}`));
          } else {
            this.isConnected = true;
            console.log(`✅ SQLite数据库连接成功: ${dbPath}`);
            resolve();
          }
        });
      } catch (error) {
        this.isConnected = false;
        console.error('❌ SQLite数据库连接失败:', error);
        reject(new Error(`SQLite连接失败: ${error instanceof Error ? error.message : '未知错误'}`));
      }
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('关闭SQLite连接失败:', err);
            reject(err);
          } else {
            this.db = null;
            this.isConnected = false;
            console.log('SQLite数据库连接已关闭');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  async testConnection(): Promise<boolean> {
    if (!this.db) {
      return false;
    }

    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('SQLite连接测试失败:', error);
      return false;
    }
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    if (!this.db) {
      throw new Error('数据库未连接');
    }

    return new Promise((resolve, reject) => {
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        this.db!.all(sql, params || [], (err, rows) => {
          if (err) {
            console.error('SQLite查询错误:', err);
            reject(new Error(`查询执行失败: ${err.message}`));
          } else {
            resolve({
              rows: rows || [],
              rowCount: rows ? rows.length : 0
            });
          }
        });
      } else {
        this.db!.run(sql, params || [], function(err) {
          if (err) {
            console.error('SQLite执行错误:', err);
            reject(new Error(`执行失败: ${err.message}`));
          } else {
            resolve({
              rows: [],
              rowCount: this.changes || 0
            });
          }
        });
      }
    });
  }

  async transaction(queries: Array<{ sql: string; params?: any[] }>): Promise<QueryResult[]> {
    if (!this.db) {
      throw new Error('数据库未连接');
    }

    const db = this.db;
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        const results: QueryResult[] = [];
        let completed = 0;
        let hasError = false;

        const executeNext = (index: number) => {
          if (index >= queries.length) {
            if (!hasError) {
              db.run('COMMIT', (err) => {
                if (err) {
                  reject(new Error(`事务提交失败: ${err.message}`));
                } else {
                  resolve(results);
                }
              });
            }
            return;
          }

          const query = queries[index];
          if (query.sql.trim().toUpperCase().startsWith('SELECT')) {
            db.all(query.sql, query.params || [], (err, rows) => {
              if (err && !hasError) {
                hasError = true;
                db.run('ROLLBACK');
                reject(new Error(`事务执行失败: ${err.message}`));
              } else if (!hasError) {
                results.push({
                  rows: rows || [],
                  rowCount: rows ? rows.length : 0
                });
                executeNext(index + 1);
              }
            });
          } else {
            db.run(query.sql, query.params || [], function(err) {
              if (err && !hasError) {
                hasError = true;
                db.run('ROLLBACK');
                reject(new Error(`事务执行失败: ${err.message}`));
              } else if (!hasError) {
                results.push({
                  rows: [],
                  rowCount: this.changes || 0
                });
                executeNext(index + 1);
              }
            });
          }
        };

        executeNext(0);
      });
    });
  }

  async getConnectionInfo(): Promise<ConnectionInfo> {
    const version = await this.getVersion();
    return {
      isConnected: this.isConnected,
      database: this.config.database,
      type: 'SQLite',
      version: version
    };
  }

  async getTables(): Promise<string[]> {
    const result = await this.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    return result.rows.map((row: any) => row.name);
  }

  async getTableInfo(tableName: string): Promise<TableInfo> {
    const result = await this.query(`PRAGMA table_info(${this.escapeIdentifier(tableName)})`);
    
    const columns: ColumnInfo[] = result.rows.map((row: any) => ({
      name: row.name,
      type: row.type,
      nullable: row.notnull === 0,
      defaultValue: row.dflt_value,
      isPrimaryKey: row.pk === 1,
      isAutoIncrement: row.type.toUpperCase().includes('INTEGER') && row.pk === 1
    }));

    return {
      tableName,
      columns
    };
  }

  async getVersion(): Promise<string> {
    const result = await this.query('SELECT sqlite_version() as version');
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
      return value ? '1' : '0';
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