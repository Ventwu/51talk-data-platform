// 用户相关类型定义
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  role?: 'admin' | 'user';
}

export interface UserLoginRequest {
  username: string;
  password: string;
}

export interface UserLoginResponse {
  user: Omit<User, 'password'>;
  token: string;
  refreshToken: string;
}

// 数据源相关类型定义
export interface DataSource {
  id: number;
  name: string;
  type: 'mysql' | 'postgresql' | 'mongodb' | 'redis' | 'api';
  config: Record<string, any>;
  status: 'active' | 'inactive' | 'error';
  description?: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface DataSourceCreateRequest {
  name: string;
  type: 'mysql' | 'postgresql' | 'mongodb' | 'redis' | 'api';
  config: Record<string, any>;
  description?: string;
}

export interface DataSourceTestRequest {
  type: 'mysql' | 'postgresql' | 'mongodb' | 'redis' | 'api';
  config: Record<string, any>;
}

// 仪表盘相关类型定义
export interface Dashboard {
  id: number;
  name: string;
  description?: string;
  config: Record<string, any>;
  is_public: boolean;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface DashboardCreateRequest {
  name: string;
  description?: string;
  config: Record<string, any>;
  is_public?: boolean;
}

// 图表相关类型定义
export interface Chart {
  id: number;
  name: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'table';
  data_source_id: number;
  dashboard_id?: number;
  config: Record<string, any>;
  query: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface ChartCreateRequest {
  name: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'table';
  data_source_id: number;
  dashboard_id?: number;
  config: Record<string, any>;
  query: string;
}

// API响应类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 查询参数类型定义
export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface DashboardQuery extends PaginationQuery {
  is_public?: boolean;
  created_by?: number;
}

export interface ChartQuery extends PaginationQuery {
  type?: string;
  dashboard_id?: number;
  data_source_id?: number;
}

// JWT载荷类型定义
export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

// 错误类型定义
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// 数据库连接配置类型
export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit?: number;
  acquireTimeout?: number;
  timeout?: number;
}

// 环境变量类型定义
export interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  FRONTEND_URL: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  REDIS_HOST?: string;
  REDIS_PORT?: number;
  REDIS_PASSWORD?: string;
}

// Express Request扩展类型
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};