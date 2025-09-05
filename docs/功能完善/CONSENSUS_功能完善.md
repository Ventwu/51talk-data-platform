# CONSENSUS - 功能完善共识文档

## 明确的需求描述

### 核心目标
完善51Talk数据中台的缺失功能，将其从基础的数据管理平台升级为功能完整的数据可视化和分析平台。

### 具体需求

**1. 仪表盘设计器 (优先级: 高)**
- 实现拖拽式布局编辑器
- 支持网格布局和自由布局
- 提供组件库和预设模板
- 支持组件配置和样式定制
- 实现仪表盘的保存、加载和分享

**2. 高级图表功能 (优先级: 高)**
- 实现图表实时数据刷新
- 支持图表联动和钻取
- 提供图表主题和样式配置
- 实现图表数据的筛选和排序
- 支持图表导出为图片和PDF

**3. 数据查询引擎 (优先级: 中)**
- 实现SQL查询编辑器
- 支持查询结果缓存
- 提供查询历史和收藏
- 实现数据预处理和转换
- 支持查询性能分析

**4. 权限管理系统 (优先级: 中)**
- 实现基于RBAC的权限控制
- 支持数据源级别权限管理
- 实现仪表盘共享和协作
- 提供用户组织架构管理
- 支持操作日志审计

**5. 实时数据功能 (优先级: 低)**
- 实现WebSocket实时数据推送
- 支持实时告警和通知
- 提供数据流处理能力
- 实现系统性能监控
- 支持实时数据可视化

## 技术实现方案

### 前端技术方案

**1. 仪表盘设计器**
```typescript
// 技术栈选择
- react-grid-layout: 拖拽布局引擎
- react-dnd: 拖拽交互
- zustand: 状态管理
- immer: 不可变数据

// 核心组件架构
DashboardDesigner/
├── LayoutEditor/          # 布局编辑器
├── ComponentLibrary/      # 组件库
├── PropertyPanel/         # 属性配置面板
├── ToolBar/              # 工具栏
└── PreviewMode/          # 预览模式
```

**2. 图表增强**
```typescript
// 实时数据刷新
- socket.io-client: WebSocket客户端
- react-query: 数据缓存和同步
- 自定义useRealTimeChart Hook

// 图表配置
- 扩展现有ChartConfig接口
- 实现ChartThemeProvider
- 支持动态样式配置
```

**3. 查询编辑器**
```typescript
// SQL编辑器
- @monaco-editor/react: 代码编辑器
- sql-formatter: SQL格式化
- 语法高亮和自动补全

// 查询管理
- 查询历史存储
- 收藏查询管理
- 查询结果缓存
```

### 后端技术方案

**1. 实时数据服务**
```typescript
// WebSocket服务
- socket.io: WebSocket服务器
- Redis: 消息队列和缓存
- 事件驱动架构

// 数据推送机制
class RealTimeService {
  async subscribeToChart(chartId: string, socketId: string)
  async publishChartData(chartId: string, data: any)
  async unsubscribe(socketId: string)
}
```

**2. 权限管理服务**
```typescript
// RBAC权限模型
interface Permission {
  resource: string;    // 资源类型
  action: string;      // 操作类型
  conditions?: any;    // 条件限制
}

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

interface User {
  id: string;
  roles: Role[];
  groups: Group[];
}
```

**3. 查询引擎优化**
```typescript
// 查询缓存策略
class QueryCacheService {
  async getCachedResult(queryHash: string)
  async setCachedResult(queryHash: string, result: any, ttl: number)
  async invalidateCache(pattern: string)
}

// 查询性能分析
class QueryAnalyzer {
  async analyzeQuery(sql: string, dataSourceId: string)
  async getExecutionPlan(sql: string)
  async getPerformanceMetrics(queryId: string)
}
```

### 数据库设计扩展

**1. 仪表盘设计器相关表**
```sql
-- 仪表盘布局配置
CREATE TABLE dashboard_layouts (
  id VARCHAR(36) PRIMARY KEY,
  dashboard_id VARCHAR(36) NOT NULL,
  layout_config JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 组件模板
CREATE TABLE component_templates (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  config JSON NOT NULL,
  preview_image VARCHAR(255),
  is_public BOOLEAN DEFAULT FALSE,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**2. 权限管理相关表**
```sql
-- 角色表
CREATE TABLE roles (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 权限表
CREATE TABLE permissions (
  id VARCHAR(36) PRIMARY KEY,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  conditions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 角色权限关联表
CREATE TABLE role_permissions (
  role_id VARCHAR(36),
  permission_id VARCHAR(36),
  PRIMARY KEY (role_id, permission_id)
);

-- 用户角色关联表
CREATE TABLE user_roles (
  user_id VARCHAR(36),
  role_id VARCHAR(36),
  assigned_by VARCHAR(36),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id)
);
```

**3. 查询管理相关表**
```sql
-- 查询历史表
CREATE TABLE query_history (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  data_source_id VARCHAR(36) NOT NULL,
  query_text TEXT NOT NULL,
  query_hash VARCHAR(64) NOT NULL,
  execution_time INT,
  result_rows INT,
  status ENUM('success', 'error', 'timeout') NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 收藏查询表
CREATE TABLE saved_queries (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  query_text TEXT NOT NULL,
  data_source_id VARCHAR(36) NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 技术约束

### 兼容性约束
- 必须与现有React 18 + TypeScript架构兼容
- 必须与现有Ant Design组件库兼容
- 必须与现有Node.js + Express后端兼容
- 必须与现有MySQL + Redis数据层兼容

### 性能约束
- 仪表盘加载时间 < 3秒
- 图表渲染时间 < 1秒
- 实时数据延迟 < 500ms
- 支持并发用户数 > 100
- 查询响应时间 < 5秒

### 安全约束
- 所有API接口必须有权限验证
- 敏感数据必须加密存储
- SQL注入防护
- XSS攻击防护
- CSRF攻击防护

## 集成方案

### 与现有系统集成

**1. 前端集成**
- 扩展现有路由配置
- 复用现有组件和Hooks
- 扩展现有类型定义
- 保持现有样式规范

**2. 后端集成**
- 扩展现有控制器
- 复用现有中间件
- 扩展现有服务层
- 保持现有API规范

**3. 数据库集成**
- 通过数据库迁移脚本添加新表
- 保持现有表结构不变
- 通过外键关联新旧数据
- 保持数据一致性

### 部署集成
- 更新Docker配置
- 更新nginx配置
- 更新环境变量
- 更新部署脚本

## 任务边界限制

### 包含的功能
- ✅ 仪表盘设计器核心功能
- ✅ 图表实时刷新和配置
- ✅ SQL查询编辑器
- ✅ 基础权限管理
- ✅ WebSocket实时通信
- ✅ 系统监控基础功能

### 不包含的功能
- ❌ 复杂的数据挖掘算法
- ❌ 机器学习模型集成
- ❌ 大数据处理引擎
- ❌ 移动端原生应用
- ❌ 第三方系统深度集成

## 验收标准

### 功能验收
1. **仪表盘设计器**
   - [ ] 可以拖拽添加图表组件
   - [ ] 可以调整组件大小和位置
   - [ ] 可以配置组件属性
   - [ ] 可以保存和加载仪表盘
   - [ ] 支持预览和编辑模式切换

2. **图表增强功能**
   - [ ] 图表支持实时数据刷新
   - [ ] 支持图表主题配置
   - [ ] 支持图表联动
   - [ ] 支持图表导出
   - [ ] 支持图表钻取

3. **查询编辑器**
   - [ ] SQL语法高亮和自动补全
   - [ ] 查询结果展示和导出
   - [ ] 查询历史管理
   - [ ] 收藏查询功能
   - [ ] 查询性能分析

4. **权限管理**
   - [ ] 角色和权限管理界面
   - [ ] 数据源权限控制
   - [ ] 仪表盘访问控制
   - [ ] 操作日志记录
   - [ ] 用户组织架构

5. **实时数据**
   - [ ] WebSocket连接管理
   - [ ] 实时数据推送
   - [ ] 实时告警通知
   - [ ] 系统性能监控
   - [ ] 连接状态显示

### 技术验收
- [ ] 代码通过ESLint和TypeScript检查
- [ ] 核心功能有单元测试覆盖
- [ ] API接口有完整文档
- [ ] 数据库迁移脚本正确执行
- [ ] 性能指标满足要求

### 用户体验验收
- [ ] 界面操作流畅，响应及时
- [ ] 错误提示清晰友好
- [ ] 功能引导完整易懂
- [ ] 移动端基本可用
- [ ] 浏览器兼容性良好

## 质量保证

### 代码质量
- 遵循现有代码规范
- 使用TypeScript严格模式
- 组件和函数有完整的类型定义
- 关键逻辑有单元测试
- 代码有适当的注释

### 性能优化
- 使用React.memo优化组件渲染
- 使用useMemo和useCallback优化计算
- 实现虚拟滚动优化长列表
- 使用懒加载优化资源加载
- 实现查询结果缓存

### 安全保障
- 所有用户输入进行验证和清理
- 实现SQL注入防护
- 使用HTTPS加密传输
- 敏感数据加密存储
- 实现访问频率限制

## 风险控制

### 技术风险
- **风险**: 仪表盘设计器性能问题
- **缓解**: 使用虚拟化技术，限制组件数量

### 兼容性风险
- **风险**: 新功能与现有系统冲突
- **缓解**: 充分测试，渐进式部署

### 时间风险
- **风险**: 开发时间超出预期
- **缓解**: 分阶段实现，优先核心功能

---

**文档版本**: v1.0  
**创建时间**: 2024-01-15  
**最后更新**: 2024-01-15  
**状态**: 已确认  
**负责人**: AI Assistant