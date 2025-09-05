# API 文档

本文档详细描述了51Talk数据中台的所有API接口。

## 📋 目录

- [基础信息](#基础信息)
- [认证接口](#认证接口)
- [用户管理](#用户管理)
- [数据源管理](#数据源管理)
- [仪表盘管理](#仪表盘管理)
- [图表管理](#图表管理)
- [系统管理](#系统管理)
- [错误码说明](#错误码说明)

## 🔧 基础信息

### 服务地址

- **开发环境**: `http://localhost:3000`
- **测试环境**: `https://api-test.51talk-data.com`
- **生产环境**: `https://api.51talk-data.com`

### 请求格式

- **Content-Type**: `application/json`
- **字符编码**: `UTF-8`
- **请求方法**: `GET`, `POST`, `PUT`, `DELETE`

### 响应格式

所有API响应都遵循统一的格式：

```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 成功响应

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "示例数据"
  },
  "message": "操作成功"
}
```

#### 错误响应

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "请求参数验证失败",
  "details": {
    "field": "email",
    "reason": "邮箱格式不正确"
  }
}
```

#### 分页响应

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 认证方式

使用JWT Bearer Token进行认证：

```http
Authorization: Bearer <your-jwt-token>
```

## 🔐 认证接口

### 用户登录

**POST** `/api/auth/login`

用户登录获取访问令牌。

#### 请求参数

```json
{
  "username": "string",     // 用户名或邮箱
  "password": "string"      // 密码
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "expiresIn": 3600,
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "admin",
      "avatar": "https://example.com/avatar.jpg"
    }
  },
  "message": "登录成功"
}
```

### 用户注册

**POST** `/api/auth/register`

注册新用户账户。

#### 请求参数

```json
{
  "username": "string",     // 用户名 (3-20字符)
  "email": "string",        // 邮箱地址
  "password": "string"      // 密码 (8-50字符，包含字母和数字)
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "new_user",
    "email": "newuser@example.com",
    "role": "user",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "注册成功"
}
```

### 刷新令牌

**POST** `/api/auth/refresh`

使用刷新令牌获取新的访问令牌。

#### 请求参数

```json
{
  "refreshToken": "string"  // 刷新令牌
}
```

### 用户登出

**POST** `/api/auth/logout`

**需要认证**

登出当前用户，使令牌失效。

#### 响应示例

```json
{
  "success": true,
  "message": "登出成功"
}
```

### 获取当前用户信息

**GET** `/api/auth/me`

**需要认证**

获取当前登录用户的详细信息。

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "admin",
    "avatar": "https://example.com/avatar.jpg",
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLoginAt": "2024-01-15T10:30:00Z"
  }
}
```

## 👥 用户管理

### 获取用户列表

**GET** `/api/users`

**需要认证** | **需要管理员权限**

获取系统中所有用户的列表。

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 (1-100) |
| search | string | 否 | - | 搜索关键词 (用户名/邮箱) |
| role | string | 否 | - | 角色筛选 (admin/user) |
| status | string | 否 | - | 状态筛选 (active/inactive) |

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "status": "active",
      "avatar": "https://example.com/avatar1.jpg",
      "createdAt": "2024-01-01T00:00:00Z",
      "lastLoginAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 获取用户详情

**GET** `/api/users/:id`

**需要认证**

获取指定用户的详细信息。

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 用户ID |

### 创建用户

**POST** `/api/users`

**需要认证** | **需要管理员权限**

创建新用户。

#### 请求参数

```json
{
  "username": "string",     // 用户名
  "email": "string",        // 邮箱
  "password": "string",     // 密码
  "role": "string",         // 角色 (admin/user)
  "avatar": "string"        // 头像URL (可选)
}
```

### 更新用户

**PUT** `/api/users/:id`

**需要认证**

更新用户信息。普通用户只能更新自己的信息，管理员可以更新任何用户。

#### 请求参数

```json
{
  "username": "string",     // 用户名 (可选)
  "email": "string",        // 邮箱 (可选)
  "role": "string",         // 角色 (可选，仅管理员)
  "avatar": "string",       // 头像URL (可选)
  "status": "string"        // 状态 (可选，仅管理员)
}
```

### 删除用户

**DELETE** `/api/users/:id`

**需要认证** | **需要管理员权限**

删除指定用户。

### 修改密码

**PUT** `/api/users/:id/password`

**需要认证**

修改用户密码。

#### 请求参数

```json
{
  "currentPassword": "string",  // 当前密码
  "newPassword": "string"       // 新密码
}
```

## 🔌 数据源管理

### 获取数据源列表

**GET** `/api/data-sources`

**需要认证**

获取用户可访问的数据源列表。

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |
| search | string | 否 | - | 搜索关键词 |
| type | string | 否 | - | 数据源类型 |
| status | string | 否 | - | 连接状态 |

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "主数据库",
      "type": "mysql",
      "status": "active",
      "description": "生产环境主数据库",
      "createdBy": {
        "id": 1,
        "username": "admin"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "lastTestAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

### 获取数据源详情

**GET** `/api/data-sources/:id`

**需要认证**

获取指定数据源的详细信息（敏感配置信息会被隐藏）。

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "主数据库",
    "type": "mysql",
    "status": "active",
    "description": "生产环境主数据库",
    "config": {
      "host": "localhost",
      "port": 3306,
      "database": "production",
      "username": "app_user",
      "password": "***"
    },
    "createdBy": {
      "id": 1,
      "username": "admin"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-10T15:30:00Z"
  }
}
```

### 创建数据源

**POST** `/api/data-sources`

**需要认证**

创建新的数据源。

#### 请求参数

```json
{
  "name": "string",         // 数据源名称
  "type": "string",         // 类型 (mysql/postgresql/mongodb/redis/api)
  "description": "string",  // 描述 (可选)
  "config": {               // 连接配置
    "host": "string",
    "port": "number",
    "database": "string",
    "username": "string",
    "password": "string"
  }
}
```

#### MySQL配置示例

```json
{
  "name": "MySQL数据库",
  "type": "mysql",
  "description": "生产环境MySQL数据库",
  "config": {
    "host": "localhost",
    "port": 3306,
    "database": "production",
    "username": "app_user",
    "password": "secure_password",
    "ssl": false,
    "connectionLimit": 10
  }
}
```

#### API数据源配置示例

```json
{
  "name": "外部API",
  "type": "api",
  "description": "第三方数据API",
  "config": {
    "baseUrl": "https://api.example.com",
    "apiKey": "your_api_key",
    "timeout": 30000,
    "headers": {
      "Content-Type": "application/json"
    }
  }
}
```

### 更新数据源

**PUT** `/api/data-sources/:id`

**需要认证**

更新数据源信息。只有创建者或管理员可以更新。

### 删除数据源

**DELETE** `/api/data-sources/:id`

**需要认证**

删除数据源。删除前会检查是否有关联的图表。

### 测试数据源连接

**POST** `/api/data-sources/:id/test`

**需要认证**

测试数据源连接是否正常。

#### 响应示例

```json
{
  "success": true,
  "data": {
    "status": "success",
    "message": "连接测试成功",
    "responseTime": 150,
    "details": {
      "serverVersion": "8.0.25",
      "charset": "utf8mb4"
    }
  }
}
```

### 获取数据预览

**GET** `/api/data-sources/:id/preview`

**需要认证**

获取数据源的数据预览。

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| table | string | 否 | - | 表名 (数据库类型) |
| query | string | 否 | - | 自定义查询 |
| limit | number | 否 | 100 | 返回行数限制 |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "columns": [
      {"name": "id", "type": "number"},
      {"name": "name", "type": "string"},
      {"name": "created_at", "type": "datetime"}
    ],
    "rows": [
      [1, "示例数据", "2024-01-01T00:00:00Z"],
      [2, "测试数据", "2024-01-02T00:00:00Z"]
    ],
    "total": 1000
  }
}
```

## 📊 仪表盘管理

### 获取仪表盘列表

**GET** `/api/dashboards`

**需要认证**

获取用户可访问的仪表盘列表。

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |
| search | string | 否 | - | 搜索关键词 |
| isPublic | boolean | 否 | - | 是否公开 |
| createdBy | number | 否 | - | 创建者ID |

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "销售数据分析",
      "description": "销售团队日常数据分析仪表盘",
      "isPublic": true,
      "config": {
        "layout": "grid",
        "theme": "light",
        "refreshInterval": 300
      },
      "createdBy": {
        "id": 1,
        "username": "admin"
      },
      "chartCount": 5,
      "viewCount": 150,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-10T15:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 8,
    "totalPages": 1
  }
}
```

### 获取仪表盘详情

**GET** `/api/dashboards/:id`

**需要认证**

获取指定仪表盘的详细信息，包括所有图表。

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "销售数据分析",
    "description": "销售团队日常数据分析仪表盘",
    "isPublic": true,
    "config": {
      "layout": "grid",
      "theme": "light",
      "refreshInterval": 300,
      "gridLayout": [
        {"i": "chart-1", "x": 0, "y": 0, "w": 6, "h": 4},
        {"i": "chart-2", "x": 6, "y": 0, "w": 6, "h": 4}
      ]
    },
    "charts": [
      {
        "id": 1,
        "name": "月度销售趋势",
        "type": "line",
        "position": {"x": 0, "y": 0, "w": 6, "h": 4}
      }
    ],
    "permissions": [
      {
        "userId": 2,
        "username": "user1",
        "permission": "view"
      }
    ],
    "createdBy": {
      "id": 1,
      "username": "admin"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-10T15:30:00Z"
  }
}
```

### 创建仪表盘

**POST** `/api/dashboards`

**需要认证**

创建新的仪表盘。

#### 请求参数

```json
{
  "name": "string",         // 仪表盘名称
  "description": "string",  // 描述 (可选)
  "isPublic": "boolean",    // 是否公开 (默认false)
  "config": {               // 配置信息 (可选)
    "layout": "grid",
    "theme": "light",
    "refreshInterval": 300
  }
}
```

### 更新仪表盘

**PUT** `/api/dashboards/:id`

**需要认证**

更新仪表盘信息。只有创建者、有编辑权限的用户或管理员可以更新。

### 删除仪表盘

**DELETE** `/api/dashboards/:id`

**需要认证**

删除仪表盘。只有创建者或管理员可以删除。

### 复制仪表盘

**POST** `/api/dashboards/:id/copy`

**需要认证**

复制现有仪表盘创建新的仪表盘。

#### 请求参数

```json
{
  "name": "string",         // 新仪表盘名称
  "description": "string",  // 新描述 (可选)
  "copyCharts": "boolean"   // 是否复制图表 (默认true)
}
```

### 管理仪表盘权限

**PUT** `/api/dashboards/:id/permissions`

**需要认证**

管理仪表盘的用户权限。只有创建者或管理员可以管理权限。

#### 请求参数

```json
{
  "permissions": [
    {
      "userId": 2,
      "permission": "view"     // view/edit
    },
    {
      "userId": 3,
      "permission": "edit"
    }
  ]
}
```

## 📈 图表管理

### 获取图表列表

**GET** `/api/charts`

**需要认证**

获取图表列表。

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |
| search | string | 否 | - | 搜索关键词 |
| type | string | 否 | - | 图表类型 |
| dashboardId | number | 否 | - | 仪表盘ID |
| dataSourceId | number | 否 | - | 数据源ID |

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "月度销售趋势",
      "type": "line",
      "description": "显示最近12个月的销售趋势",
      "dashboard": {
        "id": 1,
        "name": "销售数据分析"
      },
      "dataSource": {
        "id": 1,
        "name": "主数据库",
        "type": "mysql"
      },
      "createdBy": {
        "id": 1,
        "username": "admin"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-10T15:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  }
}
```

### 获取图表详情

**GET** `/api/charts/:id`

**需要认证**

获取指定图表的详细信息。

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "月度销售趋势",
    "type": "line",
    "description": "显示最近12个月的销售趋势",
    "config": {
      "query": "SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(amount) as total FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH) GROUP BY month ORDER BY month",
      "xAxis": "month",
      "yAxis": "total",
      "chartOptions": {
        "title": "月度销售趋势",
        "smooth": true,
        "showSymbol": false
      }
    },
    "dashboard": {
      "id": 1,
      "name": "销售数据分析"
    },
    "dataSource": {
      "id": 1,
      "name": "主数据库",
      "type": "mysql"
    },
    "createdBy": {
      "id": 1,
      "username": "admin"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-10T15:30:00Z"
  }
}
```

### 创建图表

**POST** `/api/charts`

**需要认证**

创建新图表。

#### 请求参数

```json
{
  "name": "string",         // 图表名称
  "type": "string",         // 图表类型 (line/bar/pie/scatter/gauge/table)
  "description": "string",  // 描述 (可选)
  "dashboardId": "number",  // 所属仪表盘ID
  "dataSourceId": "number", // 数据源ID
  "config": {               // 图表配置
    "query": "string",      // 数据查询语句
    "xAxis": "string",      // X轴字段
    "yAxis": "string",      // Y轴字段
    "chartOptions": {}      // 图表选项
  }
}
```

#### 折线图配置示例

```json
{
  "name": "用户增长趋势",
  "type": "line",
  "description": "显示用户注册增长趋势",
  "dashboardId": 1,
  "dataSourceId": 1,
  "config": {
    "query": "SELECT DATE(created_at) as date, COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(created_at) ORDER BY date",
    "xAxis": "date",
    "yAxis": "count",
    "chartOptions": {
      "title": "30天用户增长趋势",
      "smooth": true,
      "areaStyle": {},
      "color": ["#1890ff"]
    }
  }
}
```

#### 饼图配置示例

```json
{
  "name": "用户角色分布",
  "type": "pie",
  "description": "显示不同角色用户的分布情况",
  "dashboardId": 1,
  "dataSourceId": 1,
  "config": {
    "query": "SELECT role, COUNT(*) as count FROM users GROUP BY role",
    "nameField": "role",
    "valueField": "count",
    "chartOptions": {
      "title": "用户角色分布",
      "radius": ["40%", "70%"],
      "label": {
        "show": true,
        "formatter": "{b}: {c} ({d}%)"
      }
    }
  }
}
```

### 更新图表

**PUT** `/api/charts/:id`

**需要认证**

更新图表信息。只有创建者、有编辑权限的用户或管理员可以更新。

### 删除图表

**DELETE** `/api/charts/:id`

**需要认证**

删除图表。只有创建者或管理员可以删除。

### 获取图表数据

**GET** `/api/charts/:id/data`

**需要认证**

获取图表的实时数据。

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| refresh | boolean | 否 | false | 是否强制刷新缓存 |
| startDate | string | 否 | - | 开始日期 (YYYY-MM-DD) |
| endDate | string | 否 | - | 结束日期 (YYYY-MM-DD) |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "columns": ["month", "total"],
    "rows": [
      ["2024-01", 150000],
      ["2024-02", 180000],
      ["2024-03", 220000]
    ],
    "chartData": {
      "xAxis": {
        "type": "category",
        "data": ["2024-01", "2024-02", "2024-03"]
      },
      "yAxis": {
        "type": "value"
      },
      "series": [{
        "name": "销售额",
        "type": "line",
        "data": [150000, 180000, 220000]
      }]
    },
    "lastUpdated": "2024-01-15T10:30:00Z",
    "fromCache": false
  }
}
```

### 复制图表

**POST** `/api/charts/:id/copy`

**需要认证**

复制现有图表。

#### 请求参数

```json
{
  "name": "string",         // 新图表名称
  "dashboardId": "number"   // 目标仪表盘ID (可选)
}
```

### 获取图表类型列表

**GET** `/api/charts/types`

**需要认证**

获取支持的图表类型列表。

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "type": "line",
      "name": "折线图",
      "description": "用于显示数据随时间的变化趋势",
      "icon": "line-chart",
      "category": "trend"
    },
    {
      "type": "bar",
      "name": "柱状图",
      "description": "用于比较不同类别的数据",
      "icon": "bar-chart",
      "category": "comparison"
    },
    {
      "type": "pie",
      "name": "饼图",
      "description": "用于显示数据的组成比例",
      "icon": "pie-chart",
      "category": "composition"
    }
  ]
}
```

## ⚙️ 系统管理

### 获取系统信息

**GET** `/api/system/info`

**需要认证** | **需要管理员权限**

获取系统运行信息。

#### 响应示例

```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "environment": "production",
    "uptime": 86400,
    "database": {
      "status": "connected",
      "version": "8.0.25",
      "connections": 5
    },
    "redis": {
      "status": "connected",
      "version": "6.2.6",
      "memory": "2.5MB"
    },
    "statistics": {
      "totalUsers": 25,
      "totalDashboards": 8,
      "totalCharts": 15,
      "totalDataSources": 5
    }
  }
}
```

### 获取系统配置

**GET** `/api/system/config`

**需要认证** | **需要管理员权限**

获取系统配置信息。

### 更新系统配置

**PUT** `/api/system/config`

**需要认证** | **需要管理员权限**

更新系统配置。

#### 请求参数

```json
{
  "siteName": "string",           // 站点名称
  "siteDescription": "string",   // 站点描述
  "allowRegistration": "boolean", // 是否允许注册
  "defaultRole": "string",        // 默认用户角色
  "sessionTimeout": "number",     // 会话超时时间(秒)
  "maxFileSize": "number",        // 最大文件大小(MB)
  "emailConfig": {                // 邮件配置
    "enabled": "boolean",
    "host": "string",
    "port": "number",
    "username": "string",
    "password": "string"
  }
}
```

### 获取操作日志

**GET** `/api/system/logs`

**需要认证** | **需要管理员权限**

获取系统操作日志。

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 20 | 每页数量 |
| action | string | 否 | - | 操作类型 |
| userId | number | 否 | - | 用户ID |
| startDate | string | 否 | - | 开始日期 |
| endDate | string | 否 | - | 结束日期 |

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "action": "CREATE_DASHBOARD",
      "description": "创建仪表盘: 销售数据分析",
      "user": {
        "id": 1,
        "username": "admin"
      },
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 清理缓存

**POST** `/api/system/cache/clear`

**需要认证** | **需要管理员权限**

清理系统缓存。

#### 请求参数

```json
{
  "type": "string"  // 缓存类型: all/data/charts/users
}
```

### 数据库备份

**POST** `/api/system/backup`

**需要认证** | **需要管理员权限**

创建数据库备份。

#### 响应示例

```json
{
  "success": true,
  "data": {
    "backupId": "backup_20240115_103000",
    "filename": "backup_20240115_103000.sql",
    "size": "2.5MB",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

## ❌ 错误码说明

### HTTP状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或认证失败 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 422 | 请求参数验证失败 |
| 429 | 请求频率限制 |
| 500 | 服务器内部错误 |
| 503 | 服务不可用 |

### 业务错误码

| 错误码 | 说明 |
|--------|------|
| AUTH_FAILED | 认证失败 |
| TOKEN_EXPIRED | 令牌已过期 |
| TOKEN_INVALID | 无效的令牌 |
| PERMISSION_DENIED | 权限不足 |
| USER_NOT_FOUND | 用户不存在 |
| USER_ALREADY_EXISTS | 用户已存在 |
| INVALID_PASSWORD | 密码错误 |
| VALIDATION_ERROR | 参数验证失败 |
| RESOURCE_NOT_FOUND | 资源不存在 |
| RESOURCE_CONFLICT | 资源冲突 |
| DATABASE_ERROR | 数据库错误 |
| DATASOURCE_CONNECTION_FAILED | 数据源连接失败 |
| QUERY_EXECUTION_FAILED | 查询执行失败 |
| FILE_TOO_LARGE | 文件过大 |
| UNSUPPORTED_FILE_TYPE | 不支持的文件类型 |
| RATE_LIMIT_EXCEEDED | 请求频率超限 |
| SYSTEM_MAINTENANCE | 系统维护中 |

### 错误响应示例

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "请求参数验证失败",
  "details": {
    "field": "email",
    "reason": "邮箱格式不正确",
    "value": "invalid-email"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 📝 使用示例

### JavaScript/TypeScript

```typescript
// API客户端封装
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '请求失败');
    }

    return data;
  }

  // 用户登录
  async login(username: string, password: string) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    this.setToken(data.data.token);
    return data;
  }

  // 获取仪表盘列表
  async getDashboards(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/dashboards?${query}`);
  }

  // 创建图表
  async createChart(chartData: any) {
    return this.request('/api/charts', {
      method: 'POST',
      body: JSON.stringify(chartData),
    });
  }
}

// 使用示例
const api = new ApiClient('http://localhost:3000');

// 登录
api.login('admin', 'password123')
  .then(response => {
    console.log('登录成功:', response.data.user);
    
    // 获取仪表盘列表
    return api.getDashboards({ page: 1, limit: 10 });
  })
  .then(response => {
    console.log('仪表盘列表:', response.data);
  })
  .catch(error => {
    console.error('请求失败:', error.message);
  });
```

### Python

```python
import requests
import json

class ApiClient:
    def __init__(self, base_url):
        self.base_url = base_url
        self.token = None
        self.session = requests.Session()
    
    def set_token(self, token):
        self.token = token
        self.session.headers.update({
            'Authorization': f'Bearer {token}'
        })
    
    def request(self, endpoint, method='GET', data=None):
        url = f"{self.base_url}{endpoint}"
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        response = self.session.request(
            method=method,
            url=url,
            headers=headers,
            json=data
        )
        
        result = response.json()
        
        if not response.ok:
            raise Exception(result.get('message', '请求失败'))
        
        return result
    
    def login(self, username, password):
        data = self.request('/api/auth/login', 'POST', {
            'username': username,
            'password': password
        })
        
        self.set_token(data['data']['token'])
        return data
    
    def get_dashboards(self, **params):
        query = '&'.join([f"{k}={v}" for k, v in params.items()])
        endpoint = f"/api/dashboards?{query}" if query else "/api/dashboards"
        return self.request(endpoint)

# 使用示例
api = ApiClient('http://localhost:3000')

try:
    # 登录
    login_response = api.login('admin', 'password123')
    print('登录成功:', login_response['data']['user'])
    
    # 获取仪表盘列表
    dashboards = api.get_dashboards(page=1, limit=10)
    print('仪表盘列表:', dashboards['data'])
    
except Exception as e:
    print('请求失败:', str(e))
```

---

## 📞 技术支持

如有API使用问题，请联系：

- **邮箱**: dev@51talk.com
- **文档**: https://docs.51talk-data.com
- **GitHub**: https://github.com/51talk/data-platform

---

**版本**: v1.0.0  
**更新时间**: 2024-01-15