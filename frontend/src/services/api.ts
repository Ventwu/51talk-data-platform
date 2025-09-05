// API 服务层
import type {
  User,
  UserLoginRequest,
  UserLoginResponse,
  DataSource,
  DataSourceCreateRequest,
  DataSourceTestRequest,
  Dashboard,
  DashboardCreateRequest,
  Chart,
  ChartCreateRequest,
  ApiResponse,
  PaginatedResponse,
  PaginationQuery
} from '@/types';

// API 基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const API_TIMEOUT = 30000;

// 请求拦截器类型
interface RequestConfig extends RequestInit {
  timeout?: number;
}

// HTTP 客户端类
class HttpClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string, timeout: number = API_TIMEOUT) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  /**
   * 发送请求
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const { timeout = this.timeout, ...fetchConfig } = config;

    // 设置默认请求头
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    // 添加认证令牌
    const token = localStorage.getItem('access_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // 创建 AbortController 用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchConfig,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 处理 HTTP 错误
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(errorData.message || '请求失败');
      }

      // 解析响应数据
      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('请求超时');
        }
        throw error;
      }
      
      throw new Error('网络错误');
    }
  }

  /**
   * GET 请求
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, String(params[key]));
        }
      });
    }
    
    return this.request<T>(url.pathname + url.search, {
      method: 'GET',
    });
  }

  /**
   * POST 请求
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT 请求
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE 请求
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * PATCH 请求
   */
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * 上传文件
   */
  async upload<T>(endpoint: string, file: File, data?: Record<string, any>): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (data) {
      Object.keys(data).forEach(key => {
        formData.append(key, String(data[key]));
      });
    }

    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers,
    });
  }
}

// 创建 HTTP 客户端实例
const httpClient = new HttpClient(API_BASE_URL);

// 认证 API
export const authApi = {
  /**
   * 用户登录
   */
  login: (credentials: UserLoginRequest): Promise<ApiResponse<UserLoginResponse>> => {
    return httpClient.post<UserLoginResponse>('/auth/login', credentials);
  },

  /**
   * 用户注册
   */
  register: (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<User>> => {
    return httpClient.post<User>('/auth/register', userData);
  },

  /**
   * 刷新令牌
   */
  refreshToken: (refreshToken: string): Promise<ApiResponse<UserLoginResponse>> => {
    return httpClient.post<UserLoginResponse>('/auth/refresh', { refresh_token: refreshToken });
  },

  /**
   * 用户登出
   */
  logout: (): Promise<ApiResponse<void>> => {
    return httpClient.post<void>('/auth/logout');
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser: (): Promise<ApiResponse<User>> => {
    return httpClient.get<User>('/auth/me');
  },

  /**
   * 修改密码
   */
  changePassword: (data: {
    old_password: string;
    new_password: string;
  }): Promise<ApiResponse<void>> => {
    return httpClient.post<void>('/auth/change-password', data);
  },

  /**
   * 忘记密码
   */
  forgotPassword: (email: string): Promise<ApiResponse<void>> => {
    return httpClient.post<void>('/auth/forgot-password', { email });
  },

  /**
   * 重置密码
   */
  resetPassword: (data: {
    token: string;
    new_password: string;
  }): Promise<ApiResponse<void>> => {
    return httpClient.post<void>('/auth/reset-password', data);
  },
};

// 用户管理 API
export const userApi = {
  /**
   * 获取用户列表
   */
  getUsers: (params?: PaginationQuery & {
    search?: string;
    role?: string;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<User>>> => {
    return httpClient.get<PaginatedResponse<User>>('/users', params);
  },

  /**
   * 获取用户详情
   */
  getUser: (id: number): Promise<ApiResponse<User>> => {
    return httpClient.get<User>(`/users/${id}`);
  },

  /**
   * 创建用户
   */
  createUser: (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<User>> => {
    return httpClient.post<User>('/users', userData);
  },

  /**
   * 更新用户
   */
  updateUser: (id: number, userData: Partial<User>): Promise<ApiResponse<User>> => {
    return httpClient.put<User>(`/users/${id}`, userData);
  },

  /**
   * 删除用户
   */
  deleteUser: (id: number): Promise<ApiResponse<void>> => {
    return httpClient.delete<void>(`/users/${id}`);
  },

  /**
   * 批量删除用户
   */
  batchDeleteUsers: (ids: number[]): Promise<ApiResponse<void>> => {
    return httpClient.post<void>('/users/batch-delete', { ids });
  },

  /**
   * 更新用户状态
   */
  updateUserStatus: (id: number, status: 'active' | 'inactive'): Promise<ApiResponse<void>> => {
    return httpClient.patch<void>(`/users/${id}/status`, { status });
  },
};

// 数据源管理 API
export const dataSourceApi = {
  /**
   * 获取数据源列表
   */
  getDataSources: (params?: PaginationQuery & {
    search?: string;
    type?: string;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<DataSource>>> => {
    return httpClient.get<PaginatedResponse<DataSource>>('/data-sources', params);
  },

  /**
   * 获取数据源详情
   */
  getDataSource: (id: number): Promise<ApiResponse<DataSource>> => {
    return httpClient.get<DataSource>(`/data-sources/${id}`);
  },

  /**
   * 创建数据源
   */
  createDataSource: (dataSourceData: DataSourceCreateRequest): Promise<ApiResponse<DataSource>> => {
    return httpClient.post<DataSource>('/data-sources', dataSourceData);
  },

  /**
   * 更新数据源
   */
  updateDataSource: (id: number, dataSourceData: Partial<DataSource>): Promise<ApiResponse<DataSource>> => {
    return httpClient.put<DataSource>(`/data-sources/${id}`, dataSourceData);
  },

  /**
   * 删除数据源
   */
  deleteDataSource: (id: number): Promise<ApiResponse<void>> => {
    return httpClient.delete<void>(`/data-sources/${id}`);
  },

  /**
   * 测试数据源连接
   */
  testDataSource: (id: number, testData: DataSourceTestRequest): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return httpClient.post<{ success: boolean; message: string }>(`/data-sources/${id}/test`, testData);
  },

  /**
   * 获取数据源表列表
   */
  getDataSourceTables: (id: number): Promise<ApiResponse<string[]>> => {
    return httpClient.get<string[]>(`/data-sources/${id}/tables`);
  },

  /**
   * 获取数据源表字段
   */
  getDataSourceTableColumns: (id: number, table: string): Promise<ApiResponse<{
    name: string;
    type: string;
    nullable: boolean;
    default?: any;
  }[]>> => {
    return httpClient.get<{
      name: string;
      type: string;
      nullable: boolean;
      default?: any;
    }[]>(`/data-sources/${id}/tables/${table}/columns`);
  },

  /**
   * 执行 SQL 查询
   */
  executeQuery: (id: number, sql: string, limit?: number): Promise<ApiResponse<{
    columns: string[];
    rows: any[][];
    total: number;
  }>> => {
    return httpClient.post<{
      columns: string[];
      rows: any[][];
      total: number;
    }>(`/data-sources/${id}/query`, { sql, limit });
  },
};

// 仪表盘管理 API
export const dashboardApi = {
  /**
   * 获取仪表盘列表
   */
  getDashboards: (params?: PaginationQuery & {
    search?: string;
    category?: string;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<Dashboard>>> => {
    return httpClient.get<PaginatedResponse<Dashboard>>('/dashboards', params);
  },

  /**
   * 获取仪表盘详情
   */
  getDashboard: (id: number): Promise<ApiResponse<Dashboard>> => {
    return httpClient.get<Dashboard>(`/dashboards/${id}`);
  },

  /**
   * 创建仪表盘
   */
  createDashboard: (dashboardData: DashboardCreateRequest): Promise<ApiResponse<Dashboard>> => {
    return httpClient.post<Dashboard>('/dashboards', dashboardData);
  },

  /**
   * 更新仪表盘
   */
  updateDashboard: (id: number, dashboardData: Partial<Dashboard>): Promise<ApiResponse<Dashboard>> => {
    return httpClient.put<Dashboard>(`/dashboards/${id}`, dashboardData);
  },

  /**
   * 删除仪表盘
   */
  deleteDashboard: (id: number): Promise<ApiResponse<void>> => {
    return httpClient.delete<void>(`/dashboards/${id}`);
  },

  /**
   * 复制仪表盘
   */
  cloneDashboard: (id: number, name: string): Promise<ApiResponse<Dashboard>> => {
    return httpClient.post<Dashboard>(`/dashboards/${id}/clone`, { name });
  },

  /**
   * 分享仪表盘
   */
  shareDashboard: (id: number, options: {
    public: boolean;
    password?: string;
    expires_at?: string;
  }): Promise<ApiResponse<{ share_url: string; share_token: string }>> => {
    return httpClient.post<{ share_url: string; share_token: string }>(`/dashboards/${id}/share`, options);
  },

  /**
   * 导出仪表盘
   */
  exportDashboard: (id: number, format: 'json' | 'pdf' | 'png'): Promise<ApiResponse<{ download_url: string }>> => {
    return httpClient.post<{ download_url: string }>(`/dashboards/${id}/export`, { format });
  },
};

// 图表管理 API
export const chartApi = {
  /**
   * 获取图表列表
   */
  getCharts: (params?: PaginationQuery & {
    search?: string;
    type?: string;
    dashboard_id?: number;
  }): Promise<ApiResponse<PaginatedResponse<Chart>>> => {
    return httpClient.get<PaginatedResponse<Chart>>('/charts', params);
  },

  /**
   * 获取图表详情
   */
  getChart: (id: number): Promise<ApiResponse<Chart>> => {
    return httpClient.get<Chart>(`/charts/${id}`);
  },

  /**
   * 创建图表
   */
  createChart: (chartData: ChartCreateRequest): Promise<ApiResponse<Chart>> => {
    return httpClient.post<Chart>('/charts', chartData);
  },

  /**
   * 更新图表
   */
  updateChart: (id: number, chartData: Partial<Chart>): Promise<ApiResponse<Chart>> => {
    return httpClient.put<Chart>(`/charts/${id}`, chartData);
  },

  /**
   * 删除图表
   */
  deleteChart: (id: number): Promise<ApiResponse<void>> => {
    return httpClient.delete<void>(`/charts/${id}`);
  },

  /**
   * 获取图表数据
   */
  getChartData: (id: number, params?: {
    start_date?: string;
    end_date?: string;
    filters?: Record<string, any>;
  }): Promise<ApiResponse<any>> => {
    return httpClient.get<any>(`/charts/${id}/data`, params);
  },

  /**
   * 刷新图表数据
   */
  refreshChartData: (id: number): Promise<ApiResponse<any>> => {
    return httpClient.post<any>(`/charts/${id}/refresh`);
  },

  /**
   * 复制图表
   */
  cloneChart: (id: number, name: string): Promise<ApiResponse<Chart>> => {
    return httpClient.post<Chart>(`/charts/${id}/clone`, { name });
  },

  /**
   * 导出图表
   */
  exportChart: (id: number, format: 'json' | 'csv' | 'excel' | 'png'): Promise<ApiResponse<{ download_url: string }>> => {
    return httpClient.post<{ download_url: string }>(`/charts/${id}/export`, { format });
  },
};

// 系统管理 API
export const systemApi = {
  /**
   * 获取系统信息
   */
  getSystemInfo: (): Promise<ApiResponse<{
    version: string;
    build_time: string;
    environment: string;
    database: {
      type: string;
      version: string;
      status: 'connected' | 'disconnected';
    };
    redis: {
      version: string;
      status: 'connected' | 'disconnected';
    };
  }>> => {
    return httpClient.get<{
      version: string;
      build_time: string;
      environment: string;
      database: {
        type: string;
        version: string;
        status: 'connected' | 'disconnected';
      };
      redis: {
        version: string;
        status: 'connected' | 'disconnected';
      };
    }>('/system/info');
  },

  /**
   * 获取系统健康状态
   */
  getHealthStatus: (): Promise<ApiResponse<{
    status: 'healthy' | 'unhealthy';
    checks: {
      name: string;
      status: 'pass' | 'fail';
      message?: string;
    }[];
  }>> => {
    return httpClient.get<{
      status: 'healthy' | 'unhealthy';
      checks: {
        name: string;
        status: 'pass' | 'fail';
        message?: string;
      }[];
    }>('/system/health');
  },

  /**
   * 获取系统统计
   */
  getSystemStats: (): Promise<ApiResponse<{
    users: {
      total: number;
      active: number;
      new_today: number;
    };
    dashboards: {
      total: number;
      public: number;
      private: number;
    };
    charts: {
      total: number;
      by_type: Record<string, number>;
    };
    data_sources: {
      total: number;
      by_type: Record<string, number>;
      connected: number;
    };
  }>> => {
    return httpClient.get<{
      users: {
        total: number;
        active: number;
        new_today: number;
      };
      dashboards: {
        total: number;
        public: number;
        private: number;
      };
      charts: {
        total: number;
        by_type: Record<string, number>;
      };
      data_sources: {
        total: number;
        by_type: Record<string, number>;
        connected: number;
      };
    }>('/system/stats');
  },

  /**
   * 清理缓存
   */
  clearCache: (type?: 'all' | 'charts' | 'dashboards' | 'users'): Promise<ApiResponse<void>> => {
    return httpClient.post<void>('/system/cache/clear', { type });
  },

  /**
   * 获取操作日志
   */
  getAuditLogs: (params?: PaginationQuery & {
    user_id?: number;
    action?: string;
    resource?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<PaginatedResponse<{
    id: number;
    user_id: number;
    user_name: string;
    action: string;
    resource: string;
    resource_id?: number;
    details?: Record<string, any>;
    ip_address: string;
    user_agent: string;
    created_at: string;
  }>>> => {
    return httpClient.get<PaginatedResponse<{
      id: number;
      user_id: number;
      user_name: string;
      action: string;
      resource: string;
      resource_id?: number;
      details?: Record<string, any>;
      ip_address: string;
      user_agent: string;
      created_at: string;
    }>>('/system/audit-logs', params);
  },
};

// 文件上传 API
export const fileApi = {
  /**
   * 上传文件
   */
  uploadFile: (file: File, type: 'avatar' | 'dashboard' | 'chart' | 'data'): Promise<ApiResponse<{
    id: string;
    filename: string;
    original_name: string;
    size: number;
    mime_type: string;
    url: string;
  }>> => {
    return httpClient.upload<{
      id: string;
      filename: string;
      original_name: string;
      size: number;
      mime_type: string;
      url: string;
    }>('/files/upload', file, { type });
  },

  /**
   * 删除文件
   */
  deleteFile: (id: string): Promise<ApiResponse<void>> => {
    return httpClient.delete<void>(`/files/${id}`);
  },

  /**
   * 获取文件信息
   */
  getFileInfo: (id: string): Promise<ApiResponse<{
    id: string;
    filename: string;
    original_name: string;
    size: number;
    mime_type: string;
    url: string;
    created_at: string;
  }>> => {
    return httpClient.get<{
      id: string;
      filename: string;
      original_name: string;
      size: number;
      mime_type: string;
      url: string;
      created_at: string;
    }>(`/files/${id}`);
  },
};

// 导出 HTTP 客户端
export { httpClient };

// 导出默认 API 对象
export default {
  auth: authApi,
  user: userApi,
  dataSource: dataSourceApi,
  dashboard: dashboardApi,
  chart: chartApi,
  system: systemApi,
  file: fileApi,
};