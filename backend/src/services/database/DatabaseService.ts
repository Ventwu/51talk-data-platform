import { DatabaseManager } from './DatabaseManager';
import { DatabaseAdapter, QueryResult, TableInfo } from './DatabaseAdapter';

/**
 * 数据库服务类
 * 提供高级数据库操作接口，封装常用的数据库操作
 */
export class DatabaseService {
  private databaseManager: DatabaseManager;

  constructor() {
    this.databaseManager = DatabaseManager.getInstance();
  }

  /**
   * 执行查询
   */
  async executeQuery(
    connectionName: string,
    sql: string,
    params?: any[]
  ): Promise<QueryResult> {
    try {
      const adapter = await this.databaseManager.getConnection(connectionName);
      return await adapter.query(sql, params);
    } catch (error) {
      console.error(`查询执行失败 [${connectionName}]:`, error);
      throw new Error(`查询执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 执行事务
   */
  async executeTransaction(
    connectionName: string,
    queries: Array<{ sql: string; params?: any[] }>
  ): Promise<QueryResult[]> {
    try {
      const adapter = await this.databaseManager.getConnection(connectionName);
      return await adapter.transaction(queries);
    } catch (error) {
      console.error(`事务执行失败 [${connectionName}]:`, error);
      throw new Error(`事务执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取表列表
   */
  async getTables(connectionName: string): Promise<string[]> {
    try {
      const adapter = await this.databaseManager.getConnection(connectionName);
      return await adapter.getTables();
    } catch (error) {
      console.error(`获取表列表失败 [${connectionName}]:`, error);
      throw new Error(`获取表列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取表结构信息
   */
  async getTableInfo(connectionName: string, tableName: string): Promise<TableInfo> {
    try {
      const adapter = await this.databaseManager.getConnection(connectionName);
      return await adapter.getTableInfo(tableName);
    } catch (error) {
      console.error(`获取表结构失败 [${connectionName}.${tableName}]:`, error);
      throw new Error(`获取表结构失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 分页查询
   */
  async executePagedQuery(
    connectionName: string,
    sql: string,
    page: number = 1,
    pageSize: number = 20,
    params?: any[]
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const adapter = await this.databaseManager.getConnection(connectionName);
      
      // 计算偏移量
      const offset = (page - 1) * pageSize;
      
      // 构建分页查询
      const pagedSql = adapter.buildPaginationQuery(sql, offset, pageSize);
      
      // 执行分页查询
      const result = await adapter.query(pagedSql, params);
      
      // 获取总记录数（如果原查询是SELECT语句）
      let total = 0;
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const countSql = `SELECT COUNT(*) as total FROM (${sql}) as count_query`;
        const countResult = await adapter.query(countSql, params);
        total = countResult.rows[0]?.total || 0;
      }
      
      const totalPages = Math.ceil(total / pageSize);
      
      return {
        data: result.rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages
        }
      };
    } catch (error) {
      console.error(`分页查询失败 [${connectionName}]:`, error);
      throw new Error(`分页查询失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 验证SQL查询
   */
  async validateQuery(connectionName: string, sql: string): Promise<{
    isValid: boolean;
    error?: string;
    columns?: string[];
  }> {
    try {
      const adapter = await this.databaseManager.getConnection(connectionName);
      
      // 尝试执行LIMIT 0查询来验证语法
      const testSql = adapter.buildPaginationQuery(sql, 0, 0);
      const result = await adapter.query(testSql);
      
      // 获取列名
      const columns = result.rows.length > 0 ? Object.keys(result.rows[0]) : [];
      
      return {
        isValid: true,
        columns
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 获取数据库连接信息
   */
  async getConnectionInfo(connectionName: string) {
    try {
      const adapter = await this.databaseManager.getConnection(connectionName);
      return await adapter.getConnectionInfo();
    } catch (error) {
      console.error(`获取连接信息失败 [${connectionName}]:`, error);
      throw new Error(`获取连接信息失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 测试数据库连接
   */
  async testConnection(connectionName: string): Promise<boolean> {
    return await this.databaseManager.testConnection(connectionName);
  }

  /**
   * 获取所有数据库连接状态
   */
  async getAllConnectionStatus() {
    return await this.databaseManager.getAllConnectionStatus();
  }

  /**
   * 获取数据库统计信息
   */
  async getDatabaseStats(connectionName: string): Promise<{
    tableCount: number;
    tables: Array<{
      name: string;
      columnCount: number;
    }>;
  }> {
    try {
      const tables = await this.getTables(connectionName);
      const tableStats = [];
      
      for (const tableName of tables) {
        try {
          const tableInfo = await this.getTableInfo(connectionName, tableName);
          tableStats.push({
            name: tableName,
            columnCount: tableInfo.columns.length
          });
        } catch (error) {
          console.warn(`获取表 ${tableName} 信息失败:`, error);
          tableStats.push({
            name: tableName,
            columnCount: 0
          });
        }
      }
      
      return {
        tableCount: tables.length,
        tables: tableStats
      };
    } catch (error) {
      console.error(`获取数据库统计信息失败 [${connectionName}]:`, error);
      throw new Error(`获取数据库统计信息失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 执行数据预览查询
   */
  async previewTableData(
    connectionName: string,
    tableName: string,
    limit: number = 100
  ): Promise<{
    columns: string[];
    data: any[];
    totalRows: number;
  }> {
    try {
      const adapter = await this.databaseManager.getConnection(connectionName);
      const escapedTableName = adapter.escapeIdentifier(tableName);
      
      // 获取表结构
      const tableInfo = await this.getTableInfo(connectionName, tableName);
      const columns = tableInfo.columns.map(col => col.name);
      
      // 获取总行数
      const countResult = await adapter.query(`SELECT COUNT(*) as total FROM ${escapedTableName}`);
      const totalRows = countResult.rows[0]?.total || 0;
      
      // 获取预览数据
      const dataResult = await adapter.query(
        adapter.buildPaginationQuery(`SELECT * FROM ${escapedTableName}`, 0, limit)
      );
      
      return {
        columns,
        data: dataResult.rows,
        totalRows
      };
    } catch (error) {
      console.error(`预览表数据失败 [${connectionName}.${tableName}]:`, error);
      throw new Error(`预览表数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}

// 导出单例实例
export const databaseService = new DatabaseService();