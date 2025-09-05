const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

// 创建数据库连接
async function createConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    return connection;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    throw error;
  }
}

// 执行SQL文件
async function executeSqlFile(connection, filePath) {
  try {
    const sql = await fs.readFile(filePath, 'utf8');
    console.log(`📄 正在执行 ${path.basename(filePath)}...`);
    
    // 分割SQL语句（处理多语句）
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }
    
    console.log(`✅ ${path.basename(filePath)} 执行完成`);
  } catch (error) {
    console.error(`❌ 执行 ${path.basename(filePath)} 失败:`, error.message);
    throw error;
  }
}

// 检查数据库是否存在
async function checkDatabaseExists(connection, dbName) {
  try {
    const [rows] = await connection.execute(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [dbName]
    );
    return rows.length > 0;
  } catch (error) {
    console.error('检查数据库存在性失败:', error.message);
    return false;
  }
}

// 检查表是否存在
async function checkTableExists(connection, dbName, tableName) {
  try {
    const [rows] = await connection.execute(
      'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
      [dbName, tableName]
    );
    return rows.length > 0;
  } catch (error) {
    console.error('检查表存在性失败:', error.message);
    return false;
  }
}

// 主迁移函数
async function migrate() {
  let connection;
  
  try {
    console.log('🚀 开始数据库迁移...');
    
    // 创建连接
    connection = await createConnection();
    
    const dbName = 'talk51_data_platform';
    
    // 检查数据库是否已存在
    const dbExists = await checkDatabaseExists(connection, dbName);
    
    if (dbExists) {
      console.log(`⚠️  数据库 ${dbName} 已存在`);
      
      // 检查是否已初始化
      await connection.execute(`USE ${dbName}`);
      const tableExists = await checkTableExists(connection, dbName, 'users');
      
      if (tableExists) {
        console.log('⚠️  数据库已初始化，跳过迁移');
        
        // 检查是否需要更新
        const [configRows] = await connection.execute(
          'SELECT config_value FROM system_configs WHERE config_key = "database_initialized"'
        );
        
        if (configRows.length > 0) {
          console.log('✅ 数据库迁移已完成');
          return;
        }
      }
    }
    
    // 执行schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    await executeSqlFile(connection, schemaPath);
    
    // 执行init.sql
    const initPath = path.join(__dirname, 'init.sql');
    await executeSqlFile(connection, initPath);
    
    console.log('🎉 数据库迁移完成！');
    
    // 显示统计信息
    await connection.execute(`USE ${dbName}`);
    const [stats] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM data_sources) as data_sources_count,
        (SELECT COUNT(*) FROM dashboards) as dashboards_count,
        (SELECT COUNT(*) FROM charts) as charts_count
    `);
    
    console.log('📊 数据库统计:');
    console.log(`   用户数: ${stats[0].users_count}`);
    console.log(`   数据源数: ${stats[0].data_sources_count}`);
    console.log(`   仪表盘数: ${stats[0].dashboards_count}`);
    console.log(`   图表数: ${stats[0].charts_count}`);
    
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 回滚函数
async function rollback() {
  let connection;
  
  try {
    console.log('🔄 开始数据库回滚...');
    
    connection = await createConnection();
    const dbName = 'talk51_data_platform';
    
    // 检查数据库是否存在
    const dbExists = await checkDatabaseExists(connection, dbName);
    
    if (!dbExists) {
      console.log('⚠️  数据库不存在，无需回滚');
      return;
    }
    
    // 删除数据库
    await connection.execute(`DROP DATABASE IF EXISTS ${dbName}`);
    console.log('✅ 数据库回滚完成');
    
  } catch (error) {
    console.error('❌ 数据库回滚失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 重置函数（回滚后重新迁移）
async function reset() {
  console.log('🔄 开始数据库重置...');
  await rollback();
  await migrate();
  console.log('🎉 数据库重置完成！');
}

// 命令行参数处理
const command = process.argv[2];

switch (command) {
  case 'migrate':
  case 'up':
    migrate();
    break;
  case 'rollback':
  case 'down':
    rollback();
    break;
  case 'reset':
    reset();
    break;
  case 'status':
    checkStatus();
    break;
  default:
    console.log('📖 使用方法:');
    console.log('  node migrate.js migrate   # 执行数据库迁移');
    console.log('  node migrate.js rollback  # 回滚数据库');
    console.log('  node migrate.js reset     # 重置数据库');
    console.log('  node migrate.js status    # 检查数据库状态');
    break;
}

// 检查数据库状态
async function checkStatus() {
  let connection;
  
  try {
    console.log('🔍 检查数据库状态...');
    
    connection = await createConnection();
    const dbName = 'talk51_data_platform';
    
    // 检查数据库是否存在
    const dbExists = await checkDatabaseExists(connection, dbName);
    
    if (!dbExists) {
      console.log('❌ 数据库不存在');
      return;
    }
    
    console.log('✅ 数据库存在');
    
    // 检查表结构
    await connection.execute(`USE ${dbName}`);
    
    const tables = ['users', 'data_sources', 'dashboards', 'charts', 'dashboard_permissions', 'data_cache', 'operation_logs', 'system_configs'];
    
    console.log('📋 表状态:');
    for (const table of tables) {
      const exists = await checkTableExists(connection, dbName, table);
      console.log(`   ${table}: ${exists ? '✅' : '❌'}`);
    }
    
    // 检查数据
    const [stats] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM data_sources) as data_sources_count,
        (SELECT COUNT(*) FROM dashboards) as dashboards_count,
        (SELECT COUNT(*) FROM charts) as charts_count
    `);
    
    console.log('📊 数据统计:');
    console.log(`   用户数: ${stats[0].users_count}`);
    console.log(`   数据源数: ${stats[0].data_sources_count}`);
    console.log(`   仪表盘数: ${stats[0].dashboards_count}`);
    console.log(`   图表数: ${stats[0].charts_count}`);
    
  } catch (error) {
    console.error('❌ 检查数据库状态失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = {
  migrate,
  rollback,
  reset,
  checkStatus
};