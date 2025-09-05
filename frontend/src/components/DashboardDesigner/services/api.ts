import type { ComponentTemplate } from '../types';
import type { DashboardLayout, DashboardComponent } from '../types';

// API基础配置
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

// 请求配置
const defaultHeaders = {
  'Content-Type': 'application/json',
};

// 获取认证头
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 通用请求函数
const request = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

// 仪表盘API
export const dashboardApi = {
  // 获取仪表盘列表
  getDashboards: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    userId?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.userId) searchParams.append('userId', params.userId.toString());
    
    const query = searchParams.toString();
    return request<{
      data: Array<{
        id: number;
        title: string;
        description?: string;
        layout: DashboardLayout;
        isPublic: boolean;
        createdAt: string;
        updatedAt: string;
        userId: number;
        user: { id: number; username: string; email: string };
      }>;
      total: number;
      page: number;
      limit: number;
    }>(`/dashboards${query ? `?${query}` : ''}`);
  },

  // 获取单个仪表盘
  getDashboard: async (id: number) => {
    return request<{
      id: number;
      title: string;
      description?: string;
      layout: DashboardLayout;
      isPublic: boolean;
      createdAt: string;
      updatedAt: string;
      userId: number;
      user: { id: number; username: string; email: string };
    }>(`/dashboards/${id}`);
  },

  // 创建仪表盘
  createDashboard: async (data: {
    title: string;
    description?: string;
    layout: DashboardLayout;
    isPublic?: boolean;
  }) => {
    return request<{
      id: number;
      title: string;
      description?: string;
      layout: DashboardLayout;
      isPublic: boolean;
      createdAt: string;
      updatedAt: string;
      userId: number;
    }>('/dashboards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 更新仪表盘
  updateDashboard: async (id: number, data: {
    title?: string;
    description?: string;
    layout?: DashboardLayout;
    isPublic?: boolean;
  }) => {
    return request<{
      id: number;
      title: string;
      description?: string;
      layout: DashboardLayout;
      isPublic: boolean;
      createdAt: string;
      updatedAt: string;
      userId: number;
    }>(`/dashboards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 删除仪表盘
  deleteDashboard: async (id: number) => {
    return request<{ message: string }>(`/dashboards/${id}`, {
      method: 'DELETE',
    });
  },

  // 复制仪表盘
  duplicateDashboard: async (id: number, title?: string) => {
    return request<{
      id: number;
      title: string;
      description?: string;
      layout: DashboardLayout;
      isPublic: boolean;
      createdAt: string;
      updatedAt: string;
      userId: number;
    }>(`/dashboards/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  // 保存布局
  saveLayout: async (dashboardId: number, layout: DashboardLayout) => {
    return request<{ message: string }>(`/dashboards/${dashboardId}/layout`, {
      method: 'PUT',
      body: JSON.stringify({ layout }),
    });
  },
};

// 组件模板API
export const templateApi = {
  // 获取组件模板列表
  getTemplates: async (params?: {
    category?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.search) searchParams.append('search', params.search);
    
    const query = searchParams.toString();
    return request<{
      data: ComponentTemplate[];
    }>(`/component-templates${query ? `?${query}` : ''}`);
  },

  // 获取单个组件模板
  getTemplate: async (id: string) => {
    return request<ComponentTemplate>(`/component-templates/${id}`);
  },

  // 创建组件模板
  createTemplate: async (data: Omit<ComponentTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    return request<ComponentTemplate>('/component-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 更新组件模板
  updateTemplate: async (id: string, data: Partial<ComponentTemplate>) => {
    return request<ComponentTemplate>(`/component-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 删除组件模板
  deleteTemplate: async (id: string) => {
    return request<{ message: string }>(`/component-templates/${id}`, {
      method: 'DELETE',
    });
  },
};

// 数据源API
export const dataSourceApi = {
  // 获取数据源列表
  getDataSources: async () => {
    return request<{
      data: Array<{
        id: number;
        name: string;
        type: string;
        config: Record<string, any>;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      }>;
    }>('/data-sources');
  },

  // 获取单个数据源
  getDataSource: async (id: number) => {
    return request<{
      id: number;
      name: string;
      type: string;
      config: Record<string, any>;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }>(`/data-sources/${id}`);
  },

  // 测试数据源连接
  testConnection: async (id: number) => {
    return request<{
      success: boolean;
      message: string;
      latency?: number;
    }>(`/data-sources/${id}/test`, {
      method: 'POST',
    });
  },

  // 执行查询
  executeQuery: async (dataSourceId: number, query: string, params?: Record<string, any>) => {
    return request<{
      data: any[];
      columns: Array<{ name: string; type: string }>;
      rowCount: number;
      executionTime: number;
    }>(`/data-sources/${dataSourceId}/query`, {
      method: 'POST',
      body: JSON.stringify({ query, params }),
    });
  },

  // 获取数据源架构
  getSchema: async (id: number) => {
    return request<{
      tables: Array<{
        name: string;
        columns: Array<{
          name: string;
          type: string;
          nullable: boolean;
          primaryKey: boolean;
        }>;
      }>;
    }>(`/data-sources/${id}/schema`);
  },
};

// 图表数据API
export const chartDataApi = {
  // 获取组件数据
  getComponentData: async (componentId: string, params?: Record<string, any>) => {
    return request<{
      data: any[];
      metadata?: Record<string, any>;
      lastUpdated: string;
    }>(`/components/${componentId}/data`, {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  },

  // 刷新组件数据
  refreshComponentData: async (componentId: string) => {
    return request<{
      data: any[];
      metadata?: Record<string, any>;
      lastUpdated: string;
    }>(`/components/${componentId}/data/refresh`, {
      method: 'POST',
    });
  },

  // 获取实时数据
  getRealtimeData: async (componentId: string) => {
    return request<{
      data: any[];
      timestamp: string;
    }>(`/components/${componentId}/realtime`);
  },
};

// 用户权限API
export const permissionApi = {
  // 获取仪表盘权限
  getDashboardPermissions: async (dashboardId: number) => {
    return request<{
      permissions: Array<{
        userId: number;
        username: string;
        email: string;
        permission: 'read' | 'write' | 'admin';
        grantedAt: string;
      }>;
    }>(`/dashboards/${dashboardId}/permissions`);
  },

  // 授予权限
  grantPermission: async (dashboardId: number, userId: number, permission: 'read' | 'write' | 'admin') => {
    return request<{ message: string }>(`/dashboards/${dashboardId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ userId, permission }),
    });
  },

  // 撤销权限
  revokePermission: async (dashboardId: number, userId: number) => {
    return request<{ message: string }>(`/dashboards/${dashboardId}/permissions/${userId}`, {
      method: 'DELETE',
    });
  },

  // 检查用户权限
  checkPermission: async (dashboardId: number) => {
    return request<{
      permission: 'read' | 'write' | 'admin' | null;
      canRead: boolean;
      canWrite: boolean;
      canAdmin: boolean;
    }>(`/dashboards/${dashboardId}/permissions/check`);
  },
};

// 导出导入API
export const exportImportApi = {
  // 导出仪表盘
  exportDashboard: async (dashboardId: number, format: 'json' | 'pdf' | 'png') => {
    const response = await fetch(`${API_BASE_URL}/dashboards/${dashboardId}/export?format=${format}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`导出失败: ${response.statusText}`);
    }

    return response.blob();
  },

  // 导入仪表盘
  importDashboard: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/dashboards/import`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `导入失败: ${response.statusText}`);
    }

    return response.json();
  },
};

// 系统API
export const systemApi = {
  // 获取系统信息
  getSystemInfo: async () => {
    return request<{
      version: string;
      buildTime: string;
      environment: string;
      features: string[];
    }>('/system/info');
  },

  // 获取系统状态
  getSystemStatus: async () => {
    return request<{
      status: 'healthy' | 'degraded' | 'down';
      services: Array<{
        name: string;
        status: 'up' | 'down';
        latency?: number;
        lastCheck: string;
      }>;
      uptime: number;
    }>('/system/status');
  },

  // 获取系统配置
  getSystemConfig: async () => {
    return request<{
      maxDashboards: number;
      maxComponentsPerDashboard: number;
      supportedDataSources: string[];
      supportedChartTypes: string[];
      features: Record<string, boolean>;
    }>('/system/config');
  },
};

// WebSocket连接管理
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(private url: string) {}

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const token = localStorage.getItem('auth_token');
    const wsUrl = `${this.url}${token ? `?token=${token}` : ''}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  unsubscribe(event: string, callback: (data: any) => void) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private handleMessage(message: any) {
    const { event, data } = message;
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connect();
      }, delay);
    }
  }
}

// 创建WebSocket实例
const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || 'ws://localhost:3001';
export const wsManager = new WebSocketManager(`${WS_BASE_URL}/ws`);

// 导出所有API
export default {
  dashboard: dashboardApi,
  template: templateApi,
  dataSource: dataSourceApi,
  chartData: chartDataApi,
  permission: permissionApi,
  exportImport: exportImportApi,
  system: systemApi,
  ws: wsManager,
};