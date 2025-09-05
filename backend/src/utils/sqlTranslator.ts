import { DatabaseType } from '../config/database';

/**
 * SQL语句转换器
 * 用于在不同数据库类型之间转换SQL语句
 */
export class SQLTranslator {
  /**
   * 转换数据类型
   */
  static translateDataType(type: string, fromDb: DatabaseType, toDb: DatabaseType): string {
    const typeMap: Record<DatabaseType, Record<string, string>> = {
      [DatabaseType.MYSQL]: {
        'INT': 'INT',
        'VARCHAR': 'VARCHAR',
        'TEXT': 'TEXT',
        'DATETIME': 'DATETIME',
        'TIMESTAMP': 'TIMESTAMP',
        'BOOLEAN': 'BOOLEAN',
        'JSON': 'JSON',
        'DECIMAL': 'DECIMAL',
        'BIGINT': 'BIGINT'
      },
      [DatabaseType.POSTGRESQL]: {
        'INT': 'INTEGER',
        'VARCHAR': 'VARCHAR',
        'TEXT': 'TEXT',
        'DATETIME': 'TIMESTAMP',
        'TIMESTAMP': 'TIMESTAMP',
        'BOOLEAN': 'BOOLEAN',
        'JSON': 'JSONB',
        'DECIMAL': 'DECIMAL',
        'BIGINT': 'BIGINT'
      },
      [DatabaseType.SQLITE]: {
        'INT': 'INTEGER',
        'VARCHAR': 'TEXT',
        'TEXT': 'TEXT',
        'DATETIME': 'TEXT',
        'TIMESTAMP': 'TEXT',
        'BOOLEAN': 'INTEGER',
        'JSON': 'TEXT',
        'DECIMAL': 'REAL',
        'BIGINT': 'INTEGER'
      }
    };

    const normalizedType = type.toUpperCase().split('(')[0]; // 移除长度限制
    return typeMap[toDb][normalizedType] || type;
  }

  /**
   * 转换自增主键语法
   */
  static translateAutoIncrement(dbType: DatabaseType): string {
    switch (dbType) {
      case DatabaseType.MYSQL:
        return 'AUTO_INCREMENT';
      case DatabaseType.POSTGRESQL:
        return 'SERIAL';
      case DatabaseType.SQLITE:
        return 'AUTOINCREMENT';
      default:
        return 'AUTO_INCREMENT';
    }
  }

  /**
   * 转换当前时间戳函数
   */
  static translateCurrentTimestamp(dbType: DatabaseType): string {
    switch (dbType) {
      case DatabaseType.MYSQL:
        return 'CURRENT_TIMESTAMP';
      case DatabaseType.POSTGRESQL:
        return 'CURRENT_TIMESTAMP';
      case DatabaseType.SQLITE:
        return 'CURRENT_TIMESTAMP';
      default:
        return 'CURRENT_TIMESTAMP';
    }
  }

  /**
   * 转换LIMIT语法
   */
  static translateLimit(limit: number, offset: number = 0, dbType: DatabaseType): string {
    switch (dbType) {
      case DatabaseType.MYSQL:
      case DatabaseType.SQLITE:
        return offset > 0 ? `LIMIT ${limit} OFFSET ${offset}` : `LIMIT ${limit}`;
      case DatabaseType.POSTGRESQL:
        return offset > 0 ? `LIMIT ${limit} OFFSET ${offset}` : `LIMIT ${limit}`;
      default:
        return `LIMIT ${limit}`;
    }
  }

  /**
   * 转换字符串连接语法
   */
  static translateConcat(fields: string[], dbType: DatabaseType): string {
    switch (dbType) {
      case DatabaseType.MYSQL:
        return `CONCAT(${fields.join(', ')})`;
      case DatabaseType.POSTGRESQL:
        return fields.join(' || ');
      case DatabaseType.SQLITE:
        return fields.join(' || ');
      default:
        return `CONCAT(${fields.join(', ')})`;
    }
  }

  /**
   * 转换日期格式化函数
   */
  static translateDateFormat(dateField: string, format: string, dbType: DatabaseType): string {
    switch (dbType) {
      case DatabaseType.MYSQL:
        return `DATE_FORMAT(${dateField}, '${format}')`;
      case DatabaseType.POSTGRESQL:
        // PostgreSQL使用不同的格式字符串
        const pgFormat = format.replace(/%Y/g, 'YYYY').replace(/%m/g, 'MM').replace(/%d/g, 'DD');
        return `TO_CHAR(${dateField}, '${pgFormat}')`;
      case DatabaseType.SQLITE:
        // SQLite使用strftime
        return `strftime('${format}', ${dateField})`;
      default:
        return `DATE_FORMAT(${dateField}, '${format}')`;
    }
  }

  /**
   * 转换JSON查询语法
   */
  static translateJsonQuery(field: string, path: string, dbType: DatabaseType): string {
    switch (dbType) {
      case DatabaseType.MYSQL:
        return `JSON_EXTRACT(${field}, '$.${path}')`;
      case DatabaseType.POSTGRESQL:
        return `${field}->>'${path}'`;
      case DatabaseType.SQLITE:
        return `JSON_EXTRACT(${field}, '$.${path}')`;
      default:
        return `JSON_EXTRACT(${field}, '$.${path}')`;
    }
  }

  /**
   * 转换UPSERT语法（插入或更新）
   */
  static translateUpsert(
    table: string,
    insertData: Record<string, any>,
    updateData: Record<string, any>,
    conflictColumns: string[],
    dbType: DatabaseType
  ): string {
    const insertColumns = Object.keys(insertData).join(', ');
    const insertValues = Object.keys(insertData).map(key => `?`).join(', ');
    const updateSet = Object.keys(updateData).map(key => `${key} = ?`).join(', ');

    switch (dbType) {
      case DatabaseType.MYSQL:
        return `INSERT INTO ${table} (${insertColumns}) VALUES (${insertValues}) ON DUPLICATE KEY UPDATE ${updateSet}`;
      
      case DatabaseType.POSTGRESQL:
        const conflictClause = conflictColumns.join(', ');
        return `INSERT INTO ${table} (${insertColumns}) VALUES (${insertValues}) ON CONFLICT (${conflictClause}) DO UPDATE SET ${updateSet}`;
      
      case DatabaseType.SQLITE:
        return `INSERT OR REPLACE INTO ${table} (${insertColumns}) VALUES (${insertValues})`;
      
      default:
        return `INSERT INTO ${table} (${insertColumns}) VALUES (${insertValues}) ON DUPLICATE KEY UPDATE ${updateSet}`;
    }
  }

  /**
   * 转换完整的CREATE TABLE语句
   */
  static translateCreateTable(
    tableName: string,
    columns: Array<{
      name: string;
      type: string;
      nullable?: boolean;
      primaryKey?: boolean;
      autoIncrement?: boolean;
      defaultValue?: any;
    }>,
    fromDb: DatabaseType,
    toDb: DatabaseType,
    ifNotExists: boolean = true
  ): string {
    const columnDefinitions = columns.map(col => {
      let definition = `${col.name} ${this.translateDataType(col.type, fromDb, toDb)}`;
      
      // 特殊处理SQLite的自增主键
      if (toDb === DatabaseType.SQLITE && col.primaryKey && col.autoIncrement) {
        definition = `${col.name} INTEGER PRIMARY KEY AUTOINCREMENT`;
      } else if (toDb === DatabaseType.POSTGRESQL && col.primaryKey && col.autoIncrement) {
        definition = `${col.name} SERIAL PRIMARY KEY`;
      } else {
        if (col.primaryKey) {
          definition += ' PRIMARY KEY';
        }
        
        if (col.autoIncrement) {
          definition += ` ${this.translateAutoIncrement(toDb)}`;
        }
      }
      
      if (col.nullable === false && !(toDb === DatabaseType.SQLITE && col.primaryKey && col.autoIncrement)) {
        definition += ' NOT NULL';
      }
      
      if (col.defaultValue !== undefined) {
        if (col.defaultValue === 'CURRENT_TIMESTAMP') {
          definition += ` DEFAULT ${this.translateCurrentTimestamp(toDb)}`;
        } else {
          definition += ` DEFAULT ${col.defaultValue}`;
        }
      }
      
      return definition;
    });

    const createStatement = ifNotExists ? 'CREATE TABLE IF NOT EXISTS' : 'CREATE TABLE';
    return `${createStatement} ${tableName} (${columnDefinitions.join(', ')})`;
  }

  /**
   * 获取数据库特定的引号字符
   */
  static getQuoteChar(dbType: DatabaseType): string {
    switch (dbType) {
      case DatabaseType.MYSQL:
        return '`';
      case DatabaseType.POSTGRESQL:
        return '"';
      case DatabaseType.SQLITE:
        return '"';
      default:
        return '`';
    }
  }

  /**
   * 转换表名和列名的引用
   */
  static quoteIdentifier(identifier: string, dbType: DatabaseType): string {
    const quote = this.getQuoteChar(dbType);
    return `${quote}${identifier}${quote}`;
  }
}

/**
 * 数据库迁移助手
 */
export class DatabaseMigrationHelper {
  /**
   * 生成跨数据库的建表语句
   */
  static generateCreateTableSQL(dbType: DatabaseType): Record<string, string> {
    const tables = {
      users: {
        columns: [
          { name: 'id', type: 'INT', primaryKey: true, autoIncrement: true },
          { name: 'username', type: 'VARCHAR(50)', nullable: false },
          { name: 'email', type: 'VARCHAR(100)', nullable: false },
          { name: 'password_hash', type: 'VARCHAR(255)', nullable: false },
          { name: 'role', type: 'VARCHAR(20)', defaultValue: "'user'" },
          { name: 'status', type: 'VARCHAR(20)', defaultValue: "'active'" },
          { name: 'last_login_at', type: 'TIMESTAMP' },
          { name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' }
        ]
      },
      data_sources: {
        columns: [
          { name: 'id', type: 'INT', primaryKey: true, autoIncrement: true },
          { name: 'name', type: 'VARCHAR(100)', nullable: false },
          { name: 'type', type: 'VARCHAR(50)', nullable: false },
          { name: 'config', type: 'JSON', nullable: false },
          { name: 'user_id', type: 'INT', nullable: false },
          { name: 'status', type: 'VARCHAR(20)', defaultValue: "'active'" },
          { name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' }
        ]
      },
      dashboards: {
        columns: [
          { name: 'id', type: 'INT', primaryKey: true, autoIncrement: true },
          { name: 'name', type: 'VARCHAR(100)', nullable: false },
          { name: 'description', type: 'TEXT' },
          { name: 'config', type: 'JSON' },
          { name: 'user_id', type: 'INT', nullable: false },
          { name: 'is_public', type: 'BOOLEAN', defaultValue: 'false' },
          { name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' }
        ]
      },
      charts: {
        columns: [
          { name: 'id', type: 'INT', primaryKey: true, autoIncrement: true },
          { name: 'name', type: 'VARCHAR(100)', nullable: false },
          { name: 'type', type: 'VARCHAR(50)', nullable: false },
          { name: 'config', type: 'JSON', nullable: false },
          { name: 'dashboard_id', type: 'INT', nullable: false },
          { name: 'data_source_id', type: 'INT', nullable: false },
          { name: 'position_x', type: 'INT', defaultValue: '0' },
          { name: 'position_y', type: 'INT', defaultValue: '0' },
          { name: 'width', type: 'INT', defaultValue: '4' },
          { name: 'height', type: 'INT', defaultValue: '3' },
          { name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' }
        ]
      },
      scheduled_tasks: {
        columns: [
          { name: 'id', type: 'INT', primaryKey: true, autoIncrement: true },
          { name: 'name', type: 'VARCHAR(100)', nullable: false },
          { name: 'description', type: 'TEXT' },
          { name: 'cron_expression', type: 'VARCHAR(100)', nullable: false },
          { name: 'task_type', type: 'VARCHAR(50)', nullable: false },
          { name: 'config', type: 'JSON' },
          { name: 'user_id', type: 'INT', nullable: false },
          { name: 'status', type: 'VARCHAR(20)', defaultValue: "'active'" },
          { name: 'last_run_time', type: 'TIMESTAMP' },
          { name: 'next_run_time', type: 'TIMESTAMP' },
          { name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' }
        ]
      },
      notifications: {
        columns: [
          { name: 'id', type: 'INT', primaryKey: true, autoIncrement: true },
          { name: 'title', type: 'VARCHAR(200)', nullable: false },
          { name: 'content', type: 'TEXT', nullable: false },
          { name: 'type', type: 'VARCHAR(50)', nullable: false },
          { name: 'user_id', type: 'INT', nullable: false },
          { name: 'status', type: 'VARCHAR(20)', defaultValue: "'unread'" },
          { name: 'metadata', type: 'JSON' },
          { name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' },
          { name: 'read_at', type: 'TIMESTAMP' }
        ]
      },
      system_configs: {
        columns: [
          { name: 'id', type: 'INT', primaryKey: true, autoIncrement: true },
          { name: 'category', type: 'VARCHAR(50)', nullable: false },
          { name: 'config_key', type: 'VARCHAR(100)', nullable: false },
          { name: 'config_value', type: 'TEXT' },
          { name: 'description', type: 'TEXT' },
          { name: 'is_public', type: 'BOOLEAN', defaultValue: 'false' },
          { name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' }
        ]
      },
      operation_logs: {
        columns: [
          { name: 'id', type: 'INT', primaryKey: true, autoIncrement: true },
          { name: 'user_id', type: 'INT' },
          { name: 'operation_type', type: 'VARCHAR(50)', nullable: false },
          { name: 'resource_type', type: 'VARCHAR(50)', nullable: false },
          { name: 'resource_id', type: 'VARCHAR(100)' },
          { name: 'details', type: 'JSON' },
          { name: 'ip_address', type: 'VARCHAR(45)' },
          { name: 'user_agent', type: 'TEXT' },
          { name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' }
        ]
      },
      data_cache: {
        columns: [
          { name: 'id', type: 'INT', primaryKey: true, autoIncrement: true },
          { name: 'cache_key', type: 'VARCHAR(255)', nullable: false },
          { name: 'cache_value', type: 'TEXT' },
          { name: 'expires_at', type: 'TIMESTAMP' },
          { name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' }
        ]
      }
    };

    const result: Record<string, string> = {};
    
    Object.entries(tables).forEach(([tableName, tableConfig]) => {
      result[tableName] = SQLTranslator.translateCreateTable(
        tableName,
        tableConfig.columns,
        DatabaseType.MYSQL, // 假设从MySQL转换
        dbType,
        true // 使用 IF NOT EXISTS
      );
    });

    return result;
  }

  /**
   * 生成数据库初始化脚本
   */
  static generateInitScript(dbType: DatabaseType): string {
    const tables = this.generateCreateTableSQL(dbType);
    const scripts = Object.values(tables);
    
    return scripts.join(';\n\n') + ';';
  }
}

export default SQLTranslator;