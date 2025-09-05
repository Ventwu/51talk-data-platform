import { DatabaseConnector, getDatabase, DatabaseType, initDatabase } from '../config/database';
import { DatabaseInitializer } from './initDatabase';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 数据库连接测试工具
 */
export class DatabaseTester {
  private connector: DatabaseConnector;
  private dbType: DatabaseType;

  constructor(connector: DatabaseConnector, dbType: DatabaseType) {
    this.connector = connector;
    this.dbType = dbType;
  }

  /**
   * 测试数据库连接
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log(`测试 ${this.dbType} 数据库连接...`);
      
      // 执行简单查询
      let testQuery: string;
      switch (this.dbType) {
        case DatabaseType.MYSQL:
          testQuery = 'SELECT 1 as test';
          break;
        case DatabaseType.POSTGRESQL:
          testQuery = 'SELECT 1 as test';
          break;
        case DatabaseType.SQLITE:
          testQuery = 'SELECT 1 as test';
          break;
        default:
          testQuery = 'SELECT 1 as test';
      }

      const result = await this.connector.executeQuery(testQuery);
      
      if (result && result.length > 0 && result[0].test === 1) {
        console.log('✓ 数据库连接测试成功');
        return true;
      } else {
        console.error('✗ 数据库连接测试失败: 查询结果异常');
        return false;
      }
    } catch (error) {
      console.error('✗ 数据库连接测试失败:', error);
      return false;
    }
  }

  /**
   * 测试数据库版本信息
   */
  async testVersion(): Promise<void> {
    try {
      console.log('获取数据库版本信息...');
      
      let versionQuery: string;
      switch (this.dbType) {
        case DatabaseType.MYSQL:
          versionQuery = 'SELECT VERSION() as version';
          break;
        case DatabaseType.POSTGRESQL:
          versionQuery = 'SELECT version() as version';
          break;
        case DatabaseType.SQLITE:
          versionQuery = 'SELECT sqlite_version() as version';
          break;
        default:
          versionQuery = 'SELECT VERSION() as version';
      }

      const result = await this.connector.executeQuery(versionQuery);
      console.log(`数据库版本: ${result[0].version}`);
    } catch (error) {
      console.error('获取数据库版本失败:', error);
    }
  }

  /**
   * 测试基本CRUD操作
   */
  async testCRUD(): Promise<boolean> {
    try {
      console.log('测试基本CRUD操作...');
      
      const testTableName = 'test_crud_table';
      
      // 1. 创建测试表
      console.log('1. 创建测试表...');
      let createTableSQL: string;
      
      switch (this.dbType) {
        case DatabaseType.MYSQL:
          createTableSQL = `
            CREATE TABLE ${testTableName} (
              id INT AUTO_INCREMENT PRIMARY KEY,
              name VARCHAR(100) NOT NULL,
              value TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;
          break;
        case DatabaseType.POSTGRESQL:
          createTableSQL = `
            CREATE TABLE ${testTableName} (
              id SERIAL PRIMARY KEY,
              name VARCHAR(100) NOT NULL,
              value TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;
          break;
        case DatabaseType.SQLITE:
          createTableSQL = `
            CREATE TABLE ${testTableName} (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              value TEXT,
              created_at TEXT DEFAULT (datetime('now'))
            )`;
          break;
        default:
          throw new Error(`不支持的数据库类型: ${this.dbType}`);
      }
      
      await this.connector.executeQuery(createTableSQL);
      console.log('✓ 测试表创建成功');

      // 2. 插入数据
      console.log('2. 插入测试数据...');
      await this.connector.executeQuery(
        `INSERT INTO ${testTableName} (name, value) VALUES (?, ?)`,
        ['test_name', 'test_value']
      );
      console.log('✓ 数据插入成功');

      // 3. 查询数据
      console.log('3. 查询测试数据...');
      const selectResult = await this.connector.executeQuery(
        `SELECT * FROM ${testTableName} WHERE name = ?`,
        ['test_name']
      );
      
      if (selectResult.length > 0 && selectResult[0].name === 'test_name') {
        console.log('✓ 数据查询成功');
      } else {
        throw new Error('查询结果不匹配');
      }

      // 4. 更新数据
      console.log('4. 更新测试数据...');
      await this.connector.executeQuery(
        `UPDATE ${testTableName} SET value = ? WHERE name = ?`,
        ['updated_value', 'test_name']
      );
      
      const updateResult = await this.connector.executeQuery(
        `SELECT value FROM ${testTableName} WHERE name = ?`,
        ['test_name']
      );
      
      if (updateResult[0].value === 'updated_value') {
        console.log('✓ 数据更新成功');
      } else {
        throw new Error('更新结果不匹配');
      }

      // 5. 删除数据
      console.log('5. 删除测试数据...');
      await this.connector.executeQuery(
        `DELETE FROM ${testTableName} WHERE name = ?`,
        ['test_name']
      );
      
      const deleteResult = await this.connector.executeQuery(
        `SELECT COUNT(*) as count FROM ${testTableName} WHERE name = ?`,
        ['test_name']
      );
      
      if (deleteResult[0].count === 0) {
        console.log('✓ 数据删除成功');
      } else {
        throw new Error('删除操作失败');
      }

      // 6. 删除测试表
      console.log('6. 清理测试表...');
      await this.connector.executeQuery(`DROP TABLE ${testTableName}`);
      console.log('✓ 测试表清理完成');

      console.log('✓ CRUD操作测试全部通过');
      return true;
    } catch (error) {
      console.error('✗ CRUD操作测试失败:', error);
      return false;
    }
  }

  /**
   * 测试事务操作
   */
  async testTransaction(): Promise<boolean> {
    try {
      console.log('测试事务操作...');
      
      const testTableName = 'test_transaction_table';
      
      // 创建测试表
      let createTableSQL: string;
      switch (this.dbType) {
        case DatabaseType.MYSQL:
          createTableSQL = `CREATE TABLE ${testTableName} (id INT AUTO_INCREMENT PRIMARY KEY, value VARCHAR(100))`;
          break;
        case DatabaseType.POSTGRESQL:
          createTableSQL = `CREATE TABLE ${testTableName} (id SERIAL PRIMARY KEY, value VARCHAR(100))`;
          break;
        case DatabaseType.SQLITE:
          createTableSQL = `CREATE TABLE ${testTableName} (id INTEGER PRIMARY KEY AUTOINCREMENT, value TEXT)`;
          break;
        default:
          throw new Error(`不支持的数据库类型: ${this.dbType}`);
      }
      
      await this.connector.executeQuery(createTableSQL);
      
      // 测试事务提交
      console.log('测试事务提交...');
      const commitQueries = [
        { sql: `INSERT INTO ${testTableName} (value) VALUES (?)`, params: ['commit_test'] },
        { sql: `INSERT INTO ${testTableName} (value) VALUES (?)`, params: ['commit_test2'] }
      ];
      
      await this.connector.executeTransaction(commitQueries);
      
      const countResult = await this.connector.executeQuery(`SELECT COUNT(*) as count FROM ${testTableName}`);
      if (countResult[0].count === 2) {
        console.log('✓ 事务提交测试成功');
      } else {
        throw new Error('事务提交后数据不正确');
      }
      
      // 测试事务回滚
      console.log('测试事务回滚...');
      try {
        const rollbackQueries = [
          { sql: `INSERT INTO ${testTableName} (value) VALUES (?)`, params: ['rollback_test'] },
          { sql: 'SELECT * FROM non_existent_table', params: [] } // 故意错误的SQL
        ];
        await this.connector.executeTransaction(rollbackQueries);
      } catch (error) {
        // 预期的错误，事务应该回滚
        console.log('✓ 事务回滚触发成功');
      }
      
      const finalCountResult = await this.connector.executeQuery(`SELECT COUNT(*) as count FROM ${testTableName}`);
      if (finalCountResult[0].count === 2) {
        console.log('✓ 事务回滚测试成功');
      } else {
        throw new Error('事务回滚失败');
      }
      
      // 清理测试表
      await this.connector.executeQuery(`DROP TABLE ${testTableName}`);
      
      console.log('✓ 事务操作测试全部通过');
      return true;
    } catch (error) {
      console.error('✗ 事务操作测试失败:', error);
      return false;
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests(): Promise<boolean> {
    console.log(`\n=== 开始测试 ${this.dbType} 数据库 ===\n`);
    
    const tests = [
      { name: '连接测试', test: () => this.testConnection() },
      { name: '版本信息', test: () => this.testVersion().then(() => true) },
      { name: 'CRUD操作', test: () => this.testCRUD() },
      { name: '事务操作', test: () => this.testTransaction() }
    ];
    
    let allPassed = true;
    
    for (const { name, test } of tests) {
      console.log(`\n--- ${name} ---`);
      try {
        const passed = await test();
        if (!passed) {
          allPassed = false;
        }
      } catch (error) {
        console.error(`${name} 测试异常:`, error);
        allPassed = false;
      }
    }
    
    console.log(`\n=== ${this.dbType} 数据库测试${allPassed ? '全部通过' : '存在失败'} ===\n`);
    return allPassed;
  }
}

/**
 * 主测试函数
 */
export async function runDatabaseTests(): Promise<void> {
  try {
    console.log('开始数据库连接器测试...');
    
    // 强制使用SQLite进行测试
    process.env.DB_TYPE = 'sqlite';
    process.env.DB_FILENAME = './test_database.sqlite';
    
    // 初始化数据库连接
    await initDatabase();
    
    const connector = getDatabase();
    const dbType = process.env.DB_TYPE as DatabaseType || DatabaseType.SQLITE;
    
    const tester = new DatabaseTester(connector, dbType);
    const allPassed = await tester.runAllTests();
    
    if (allPassed) {
      console.log('🎉 所有数据库测试通过!');
    } else {
      console.log('❌ 部分数据库测试失败!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('数据库测试运行失败:', error);
    process.exit(1);
  }
}

/**
 * 如果直接运行此脚本
 */
if (require.main === module) {
  runDatabaseTests();
}

export default DatabaseTester;