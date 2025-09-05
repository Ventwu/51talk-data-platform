# 51Talk数据中台业务功能开发 - 共识文档

## 1. 项目概述

### 1.1 项目目标
构建51Talk运营数据中台，实现多数据源统一管理、可视化仪表盘设计和数据分析展示的MVP版本。

### 1.2 核心价值
- 统一数据源管理，支持多种数据库类型
- 可视化仪表盘设计器，支持拖拽式操作
- 丰富的图表组件库，支持复杂配置
- 自动化数据刷新和智能推送通知

## 2. 需求描述和验收标准

### 2.1 第一阶段：核心MVP功能

#### 2.1.1 多数据库支持
**需求描述：**
- 支持MySQL、PostgreSQL、SQLite三种数据库
- 提供统一的数据源管理界面
- 支持数据源连接测试和配置管理

**验收标准：**
- [ ] 能够成功连接MySQL、PostgreSQL、SQLite数据库
- [ ] 提供数据源CRUD操作界面
- [ ] 连接测试功能正常工作
- [ ] 支持数据源配置的导入导出
- [ ] 数据库连接池管理正常

#### 2.1.2 图表组件库
**需求描述：**
- 基于ECharts开发可配置图表组件
- 支持柱状图、折线图、饼图、表格等基础图表
- 提供可视化配置界面
- 支持样式、数据、交互的深度定制

**验收标准：**
- [ ] 实现至少6种基础图表类型
- [ ] 每种图表支持至少10个配置项
- [ ] 提供实时预览功能
- [ ] 支持图表配置的保存和加载
- [ ] 图表响应式适配正常

#### 2.1.3 仪表盘设计器
**需求描述：**
- 拖拽式仪表盘创建界面
- 支持图表组件的自由布局
- 提供网格布局和自适应布局
- 支持仪表盘的保存、加载和分享

**验收标准：**
- [ ] 拖拽功能流畅无卡顿
- [ ] 支持组件的复制、删除、调整大小
- [ ] 网格对齐功能正常
- [ ] 仪表盘数据持久化正常
- [ ] 支持仪表盘预览和编辑模式切换

### 2.2 第二阶段：数据处理功能

#### 2.2.1 定时数据刷新
**需求描述：**
- 支持设置数据源的自动刷新频率
- 提供手动刷新功能
- 数据更新状态实时反馈
- 支持增量更新和全量更新

**验收标准：**
- [ ] 定时任务调度正常工作
- [ ] 支持秒、分钟、小时、天级别的刷新频率
- [ ] 数据更新进度可视化
- [ ] 更新失败时有错误提示和重试机制
- [ ] 支持数据更新历史记录查看

#### 2.2.2 通知推送系统
**需求描述：**
- 支持飞书机器人webhook推送
- 支持企业微信应用机器人推送
- 可配置推送规则和模板
- 支持数据异常告警推送

**验收标准：**
- [ ] 飞书机器人推送功能正常
- [ ] 企业微信机器人推送功能正常
- [ ] 推送模板可自定义配置
- [ ] 支持推送规则的条件设置
- [ ] 推送失败时有重试机制

### 2.3 第三阶段：用户系统

#### 2.3.1 用户认证和权限控制
**需求描述：**
- 用户注册、登录、注销功能
- 基于角色的权限控制(RBAC)
- 支持页面级和功能级权限控制
- JWT token认证机制

**验收标准：**
- [ ] 用户认证流程完整
- [ ] 权限控制粒度合理
- [ ] 支持多角色管理
- [ ] Token刷新机制正常
- [ ] 安全性符合企业标准

## 3. 技术实现方案

### 3.1 技术架构

#### 3.1.1 前端技术栈
- **框架**: React 18 + TypeScript
- **UI库**: Ant Design
- **图表库**: ECharts
- **状态管理**: Redux Toolkit
- **路由**: React Router v6
- **构建工具**: Vite

#### 3.1.2 后端技术栈
- **运行时**: Node.js 18+
- **框架**: Express.js
- **ORM**: Sequelize
- **认证**: JWT
- **定时任务**: node-cron
- **数据库**: MySQL/PostgreSQL/SQLite

### 3.2 系统架构设计

#### 3.2.1 分层架构
```
┌─────────────────┐
│   前端应用层     │ (React + Ant Design)
├─────────────────┤
│   API网关层     │ (Express Router)
├─────────────────┤
│   业务服务层     │ (Service Layer)
├─────────────────┤
│   数据访问层     │ (Sequelize ORM)
├─────────────────┤
│   数据源层      │ (MySQL/PostgreSQL/SQLite)
└─────────────────┘
```

#### 3.2.2 核心模块设计

**数据源管理模块**
- DatabaseService: 数据库连接管理
- DataSourceController: 数据源CRUD操作
- ConnectionPool: 连接池管理

**图表组件模块**
- ChartComponent: 基础图表组件
- ChartConfig: 图表配置管理
- ChartRenderer: 图表渲染引擎

**仪表盘模块**
- DashboardDesigner: 仪表盘设计器
- LayoutManager: 布局管理器
- DashboardService: 仪表盘数据服务

**数据处理模块**
- DataRefreshService: 数据刷新服务
- ScheduleManager: 定时任务管理
- NotificationService: 通知推送服务

### 3.3 数据库设计

#### 3.3.1 核心表结构

**数据源配置表 (data_sources)**
```sql
CREATE TABLE data_sources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  type ENUM('mysql', 'postgresql', 'sqlite') NOT NULL,
  host VARCHAR(255),
  port INT,
  database_name VARCHAR(100),
  username VARCHAR(100),
  password VARCHAR(255),
  config JSON,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**仪表盘配置表 (dashboards)**
```sql
CREATE TABLE dashboards (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  layout JSON NOT NULL,
  config JSON,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**图表配置表 (charts)**
```sql
CREATE TABLE charts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  data_source_id INT,
  query_config JSON,
  chart_config JSON,
  refresh_interval INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (data_source_id) REFERENCES data_sources(id)
);
```

## 4. 技术约束和集成方案

### 4.1 技术约束
- Node.js版本: >= 18.0.0
- 数据库版本: MySQL >= 8.0, PostgreSQL >= 12, SQLite >= 3.35
- 浏览器兼容性: Chrome >= 90, Firefox >= 88, Safari >= 14
- 内存要求: 最小2GB，推荐4GB
- 存储要求: 最小10GB可用空间

### 4.2 集成方案
- 与现有系统通过REST API集成
- 支持SSO单点登录集成
- 数据源支持只读连接，避免影响业务系统
- 支持数据缓存机制，减少数据库压力

### 4.3 安全要求
- 数据库连接信息加密存储
- API接口支持HTTPS
- 敏感数据传输加密
- 定期安全漏洞扫描

## 5. 任务边界和限制

### 5.1 包含范围
- 数据中台核心功能开发
- 基础图表组件库
- 仪表盘设计器
- 数据刷新和通知功能
- 基础用户认证和权限控制

### 5.2 不包含范围
- 复杂的数据分析算法
- 机器学习和AI功能
- 移动端应用开发
- 第三方系统深度集成
- 高级数据治理功能

### 5.3 技术限制
- 暂不支持实时流数据处理
- 不支持大数据量(>1000万行)的实时查询
- 图表类型限制在ECharts支持范围内
- 推送通知仅支持飞书和企业微信

## 6. 验收标准总结

### 6.1 功能验收
- [ ] 所有核心功能模块正常工作
- [ ] 用户界面友好，操作流畅
- [ ] 数据准确性和一致性
- [ ] 性能指标满足要求

### 6.2 技术验收
- [ ] 代码质量符合规范
- [ ] 单元测试覆盖率 >= 80%
- [ ] 集成测试通过
- [ ] 安全测试通过

### 6.3 文档验收
- [ ] API文档完整
- [ ] 用户使用手册
- [ ] 部署运维文档
- [ ] 开发者文档

## 7. 风险评估

### 7.1 技术风险
- **中等风险**: 多数据库兼容性问题
- **低风险**: 图表组件性能优化
- **中等风险**: 大数据量查询性能

### 7.2 进度风险
- **低风险**: 开发资源充足
- **中等风险**: 第三方依赖更新
- **低风险**: 测试时间充裕

### 7.3 业务风险
- **低风险**: 需求变更可能性小
- **中等风险**: 用户接受度
- **低风险**: 与现有系统冲突

---

**文档版本**: v1.0  
**创建时间**: 2024-01-24  
**最后更新**: 2024-01-24  
**状态**: 已确认