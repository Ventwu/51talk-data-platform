# 数据库配置指南

## 概述

51Talk数据中台支持多种数据库类型，包括MySQL、PostgreSQL和SQLite。通过统一的数据库连接器接口，可以轻松切换不同的数据库后端。

## 支持的数据库类型

### MySQL
- **推荐用于**: 生产环境
- **特点**: 高性能、成熟稳定、丰富的生态系统
- **版本要求**: MySQL 5.7+

### PostgreSQL
- **推荐用于**: 需要复杂查询和高级功能的场景
- **特点**: 功能丰富、支持JSON、强大的查询优化器
- **版本要求**: PostgreSQL 10+

### SQLite
- **推荐用于**: 开发环境、测试环境、小型部署
- **特点**: 轻量级、无需服务器、易于部署
- **版本要求**: SQLite 3.25+

## 环境配置

### 1. 环境变量设置

复制 `.env.example` 到 `.env` 并根据你的数据库类型进行配置：

#### MySQL 配置
```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=talk51_data_platform
```

#### PostgreSQL 配置
```env
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=talk51_data_platform
```

#### SQLite 配置
```env
DB_TYPE=sqlite
DB_FILENAME=./data/database.sqlite
```

### 2. 数据库准备

#### MySQL
```sql
-- 创建数据库
CREATE DATABASE talk51_data_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（可选）
CREATE USER 'talk51_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON talk51_data_platform.* TO 'talk51_user'@'localhost';
FLUSH PRIVILEGES;
```

#### PostgreSQL
```sql
-- 创建数据库
CREATE DATABASE talk51_data_platform;

-- 创建用户（可选）
CREATE USER talk51_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE talk51_data_platform TO talk51_user;
```

#### SQLite
无需预先创建，系统会自动创建数据库文件。确保 `data` 目录存在且有写权限。

## 数据库初始化

### 1. 初始化表结构
```bash
# 初始化数据库表结构和基础数据
npm run db:init
```

### 2. 测试数据库连接
```bash
# 运行数据库连接和功能测试
npm run db:test
```

### 3. 备份数据库结构
```bash
# 备份当前数据库结构到文件
npm run db:backup-schema
```

### 4. 重置数据库（危险操作）
```bash
# 删除所有表（仅用于开发环境）
npm run db:drop-all
```

## 数据库表结构

### 核心表

1. **users** - 用户表
   - 存储用户账户信息
   - 包含角色和状态管理

2. **data_sources** - 数据源表
   - 存储各种数据源配置
   - 支持多种数据源类型

3. **dashboards** - 仪表盘表
   - 存储仪表盘配置和布局
   - 支持公开和私有仪表盘

4. **charts** - 图表表
   - 存储图表配置和位置信息
   - 关联数据源和仪表盘

### 功能表

5. **scheduled_tasks** - 定时任务表
   - 存储定时任务配置
   - 支持cron表达式

6. **notifications** - 通知表
   - 存储用户通知信息
   - 支持多种通知类型

7. **system_configs** - 系统配置表
   - 存储系统级配置参数
   - 支持分类管理

8. **operation_logs** - 操作日志表
   - 记录用户操作历史
   - 支持审计和追踪

9. **data_cache** - 数据缓存表
   - 存储查询结果缓存
   - 支持过期时间管理

## 数据库迁移

### 跨数据库迁移

系统提供了 `SQLTranslator` 工具来帮助在不同数据库之间迁移：

```typescript
import { SQLTranslator, DatabaseType } from './src/utils/sqlTranslator';

// 转换数据类型
const pgType = SQLTranslator.translateDataType('VARCHAR(100)', DatabaseType.MYSQL, DatabaseType.POSTGRESQL);

// 转换建表语句
const createTableSQL = SQLTranslator.translateCreateTable(
  'users',
  columns,
  DatabaseType.MYSQL,
  DatabaseType.POSTGRESQL
);
```

### 数据导出导入

#### MySQL
```bash
# 导出数据
mysqldump -u username -p database_name > backup.sql

# 导入数据
mysql -u username -p database_name < backup.sql
```

#### PostgreSQL
```bash
# 导出数据
pg_dump -U username database_name > backup.sql

# 导入数据
psql -U username database_name < backup.sql
```

#### SQLite
```bash
# 导出数据
sqlite3 database.sqlite .dump > backup.sql

# 导入数据
sqlite3 new_database.sqlite < backup.sql
```

## 性能优化

### 索引策略

系统自动创建以下索引：
- 用户表：email, username, status
- 数据源表：user_id, type, status
- 仪表盘表：user_id, is_public
- 图表表：dashboard_id, data_source_id
- 操作日志表：user_id, operation_type, created_at

### 连接池配置

```typescript
// MySQL/PostgreSQL 连接池配置
const poolConfig = {
  min: 2,
  max: 10,
  acquireTimeoutMillis: 30000,
  idleTimeoutMillis: 30000
};
```

### 查询优化建议

1. **使用参数化查询**：防止SQL注入，提高性能
2. **合理使用索引**：避免全表扫描
3. **分页查询**：大数据集使用LIMIT/OFFSET
4. **缓存策略**：频繁查询使用缓存

## 故障排除

### 常见问题

#### 1. 连接失败
```
Error: connect ECONNREFUSED
```
**解决方案**：
- 检查数据库服务是否启动
- 验证连接参数（主机、端口、用户名、密码）
- 检查防火墙设置

#### 2. 权限错误
```
Error: Access denied for user
```
**解决方案**：
- 检查用户权限
- 确认密码正确
- 验证数据库访问权限

#### 3. SQLite 文件权限
```
Error: SQLITE_CANTOPEN: unable to open database file
```
**解决方案**：
- 检查文件路径是否存在
- 确认目录写权限
- 创建必要的目录结构

### 调试模式

启用数据库查询日志：
```env
LOG_LEVEL=debug
```

这将输出所有SQL查询，帮助调试问题。

## 最佳实践

### 1. 环境隔离
- **开发环境**：使用SQLite，快速启动
- **测试环境**：使用与生产相同的数据库类型
- **生产环境**：使用MySQL或PostgreSQL

### 2. 备份策略
- 定期备份数据库
- 测试备份恢复流程
- 保留多个备份版本

### 3. 监控指标
- 连接池使用率
- 查询执行时间
- 错误率统计
- 数据库大小增长

### 4. 安全考虑
- 使用强密码
- 限制数据库访问IP
- 定期更新数据库版本
- 加密敏感数据

## 扩展功能

### 1. 读写分离

可以扩展连接器支持读写分离：

```typescript
interface ReadWriteConnector {
  readConnector: DatabaseConnector;
  writeConnector: DatabaseConnector;
}
```

### 2. 分库分表

对于大数据量场景，可以实现分库分表策略：

```typescript
interface ShardingConnector {
  getConnector(shardKey: string): DatabaseConnector;
}
```

### 3. 缓存集成

结合Redis实现查询缓存：

```typescript
interface CachedConnector extends DatabaseConnector {
  executeWithCache(sql: string, params?: any[], ttl?: number): Promise<any[]>;
}
```

## 参考资料

- [MySQL 官方文档](https://dev.mysql.com/doc/)
- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [SQLite 官方文档](https://www.sqlite.org/docs.html)
- [Node.js 数据库最佳实践](https://nodejs.org/en/docs/guides/database/)