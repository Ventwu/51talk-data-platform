// 全局状态管理
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  User,
  DataSource,
  Dashboard,
  Chart,
  Theme,
  Language,
  UserPreferences,
  NotificationSettings,
} from '@/types';
import { authApi } from '@/services/api';

// 认证状态接口
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}

// 认证操作接口
interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// 应用状态接口
interface AppState {
  theme: Theme;
  language: Language;
  sidebarCollapsed: boolean;
  loading: boolean;
  notifications: {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
    timestamp: number;
  }[];
  breadcrumbs: {
    title: string;
    path?: string;
  }[];
}

// 应用操作接口
interface AppActions {
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLoading: (loading: boolean) => void;
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setBreadcrumbs: (breadcrumbs: AppState['breadcrumbs']) => void;
}

// 数据状态接口
interface DataState {
  dataSources: DataSource[];
  dashboards: Dashboard[];
  charts: Chart[];
  currentDashboard: Dashboard | null;
  currentChart: Chart | null;
  dataSourcesLoading: boolean;
  dashboardsLoading: boolean;
  chartsLoading: boolean;
}

// 数据操作接口
interface DataActions {
  setDataSources: (dataSources: DataSource[]) => void;
  addDataSource: (dataSource: DataSource) => void;
  updateDataSource: (id: number, dataSource: Partial<DataSource>) => void;
  removeDataSource: (id: number) => void;
  setDashboards: (dashboards: Dashboard[]) => void;
  addDashboard: (dashboard: Dashboard) => void;
  updateDashboard: (id: number, dashboard: Partial<Dashboard>) => void;
  removeDashboard: (id: number) => void;
  setCurrentDashboard: (dashboard: Dashboard | null) => void;
  setCharts: (charts: Chart[]) => void;
  addChart: (chart: Chart) => void;
  updateChart: (id: number, chart: Partial<Chart>) => void;
  removeChart: (id: number) => void;
  setCurrentChart: (chart: Chart | null) => void;
  setDataSourcesLoading: (loading: boolean) => void;
  setDashboardsLoading: (loading: boolean) => void;
  setChartsLoading: (loading: boolean) => void;
}

// 用户偏好设置状态接口
interface PreferencesState {
  preferences: UserPreferences;
  notifications: NotificationSettings;
}

// 用户偏好设置操作接口
interface PreferencesActions {
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  resetPreferences: () => void;
}

// 默认用户偏好设置
const defaultPreferences: UserPreferences = {
  theme: 'light',
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  numberFormat: 'en-US',
  currency: 'CNY',
  autoRefresh: true,
  refreshInterval: 300000, // 5分钟
  defaultPageSize: 20,
  showWelcomeGuide: true,
  enableKeyboardShortcuts: true,
  enableAnimations: true,
  compactMode: false,
  showGridLines: true,
  enableTooltips: true,
  autoSave: true,
  autoSaveInterval: 30000, // 30秒
};

// 默认通知设置
const defaultNotificationSettings: NotificationSettings = {
  email: {
    enabled: true,
    frequency: 'immediate',
    types: ['system', 'security', 'updates'],
  },
  push: {
    enabled: true,
    frequency: 'immediate',
    types: ['alerts', 'mentions'],
  },
  inApp: {
    enabled: true,
    frequency: 'immediate',
    types: ['all'],
  },
  desktop: {
    enabled: false,
    frequency: 'immediate',
    types: ['alerts'],
  },
};

// 创建认证状态管理
export const useAuthStore = create<AuthState & AuthActions>()(immer(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      accessToken: null,
      refreshToken: null,

      // 登录
      login: async (email: string, password: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await authApi.login({ email, password });
          
          if (response.success && response.data) {
            const { user, access_token, refresh_token } = response.data;
            
            // 保存令牌到 localStorage
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            
            set((state) => {
              state.user = user;
              state.isAuthenticated = true;
              state.accessToken = access_token;
              state.refreshToken = refresh_token;
              state.isLoading = false;
              state.error = null;
            });
          } else {
            throw new Error(response.message || '登录失败');
          }
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = error instanceof Error ? error.message : '登录失败';
          });
          throw error;
        }
      },

      // 登出
      logout: () => {
        // 清除本地存储
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // 调用登出 API（可选）
        authApi.logout().catch(console.error);
        
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.accessToken = null;
          state.refreshToken = null;
          state.error = null;
        });
      },

      // 刷新认证
      refreshAuth: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          throw new Error('没有刷新令牌');
        }

        try {
          const response = await authApi.refreshToken(refreshToken);
          
          if (response.success && response.data) {
            const { user, access_token, refresh_token } = response.data;
            
            // 更新令牌
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            
            set((state) => {
              state.user = user;
              state.isAuthenticated = true;
              state.accessToken = access_token;
              state.refreshToken = refresh_token;
              state.error = null;
            });
          } else {
            throw new Error(response.message || '刷新令牌失败');
          }
        } catch (error) {
          // 刷新失败，清除认证状态
          get().logout();
          throw error;
        }
      },

      // 更新用户信息
      updateUser: (userData: Partial<User>) => {
        set((state) => {
          if (state.user) {
            Object.assign(state.user, userData);
          }
        });
      },

      // 清除错误
      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      // 设置加载状态
      setLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading;
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
));

// 创建应用状态管理
export const useAppStore = create<AppState & AppActions>()(immer(
  persist(
    (set) => ({
      // 初始状态
      theme: 'light',
      language: 'zh-CN',
      sidebarCollapsed: false,
      loading: false,
      notifications: [],
      breadcrumbs: [],

      // 设置主题
      setTheme: (theme: Theme) => {
        set((state) => {
          state.theme = theme;
        });
        
        // 更新 HTML 类名
        document.documentElement.className = theme;
      },

      // 设置语言
      setLanguage: (language: Language) => {
        set((state) => {
          state.language = language;
        });
        
        // 更新 HTML lang 属性
        document.documentElement.lang = language;
      },

      // 切换侧边栏
      toggleSidebar: () => {
        set((state) => {
          state.sidebarCollapsed = !state.sidebarCollapsed;
        });
      },

      // 设置侧边栏折叠状态
      setSidebarCollapsed: (collapsed: boolean) => {
        set((state) => {
          state.sidebarCollapsed = collapsed;
        });
      },

      // 设置加载状态
      setLoading: (loading: boolean) => {
        set((state) => {
          state.loading = loading;
        });
      },

      // 添加通知
      addNotification: (notification) => {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newNotification = {
          ...notification,
          id,
          timestamp: Date.now(),
        };
        
        set((state) => {
          state.notifications.push(newNotification);
        });
        
        // 自动移除通知
        if (notification.duration !== 0) {
          setTimeout(() => {
            set((state) => {
              state.notifications = state.notifications.filter(n => n.id !== id);
            });
          }, notification.duration || 5000);
        }
      },

      // 移除通知
      removeNotification: (id: string) => {
        set((state) => {
          state.notifications = state.notifications.filter(n => n.id !== id);
        });
      },

      // 清除所有通知
      clearNotifications: () => {
        set((state) => {
          state.notifications = [];
        });
      },

      // 设置面包屑
      setBreadcrumbs: (breadcrumbs) => {
        set((state) => {
          state.breadcrumbs = breadcrumbs;
        });
      },
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
));

// 创建数据状态管理
export const useDataStore = create<DataState & DataActions>()(immer((set) => ({
  // 初始状态
  dataSources: [],
  dashboards: [],
  charts: [],
  currentDashboard: null,
  currentChart: null,
  dataSourcesLoading: false,
  dashboardsLoading: false,
  chartsLoading: false,

  // 数据源管理
  setDataSources: (dataSources) => {
    set((state) => {
      state.dataSources = dataSources;
    });
  },

  addDataSource: (dataSource) => {
    set((state) => {
      state.dataSources.push(dataSource);
    });
  },

  updateDataSource: (id, dataSourceUpdate) => {
    set((state) => {
      const index = state.dataSources.findIndex(ds => ds.id === id);
      if (index !== -1) {
        Object.assign(state.dataSources[index], dataSourceUpdate);
      }
    });
  },

  removeDataSource: (id) => {
    set((state) => {
      state.dataSources = state.dataSources.filter(ds => ds.id !== id);
    });
  },

  // 仪表盘管理
  setDashboards: (dashboards) => {
    set((state) => {
      state.dashboards = dashboards;
    });
  },

  addDashboard: (dashboard) => {
    set((state) => {
      state.dashboards.push(dashboard);
    });
  },

  updateDashboard: (id, dashboardUpdate) => {
    set((state) => {
      const index = state.dashboards.findIndex(d => d.id === id);
      if (index !== -1) {
        Object.assign(state.dashboards[index], dashboardUpdate);
      }
    });
  },

  removeDashboard: (id) => {
    set((state) => {
      state.dashboards = state.dashboards.filter(d => d.id !== id);
    });
  },

  setCurrentDashboard: (dashboard) => {
    set((state) => {
      state.currentDashboard = dashboard;
    });
  },

  // 图表管理
  setCharts: (charts) => {
    set((state) => {
      state.charts = charts;
    });
  },

  addChart: (chart) => {
    set((state) => {
      state.charts.push(chart);
    });
  },

  updateChart: (id, chartUpdate) => {
    set((state) => {
      const index = state.charts.findIndex(c => c.id === id);
      if (index !== -1) {
        Object.assign(state.charts[index], chartUpdate);
      }
    });
  },

  removeChart: (id) => {
    set((state) => {
      state.charts = state.charts.filter(c => c.id !== id);
    });
  },

  setCurrentChart: (chart) => {
    set((state) => {
      state.currentChart = chart;
    });
  },

  // 加载状态管理
  setDataSourcesLoading: (loading) => {
    set((state) => {
      state.dataSourcesLoading = loading;
    });
  },

  setDashboardsLoading: (loading) => {
    set((state) => {
      state.dashboardsLoading = loading;
    });
  },

  setChartsLoading: (loading) => {
    set((state) => {
      state.chartsLoading = loading;
    });
  },
})));

// 创建用户偏好设置状态管理
export const usePreferencesStore = create<PreferencesState & PreferencesActions>()(immer(
  persist(
    (set) => ({
      // 初始状态
      preferences: defaultPreferences,
      notifications: defaultNotificationSettings,

      // 更新偏好设置
      updatePreferences: (preferencesUpdate) => {
        set((state) => {
          Object.assign(state.preferences, preferencesUpdate);
        });
      },

      // 更新通知设置
      updateNotificationSettings: (settingsUpdate) => {
        set((state) => {
          Object.assign(state.notifications, settingsUpdate);
        });
      },

      // 重置偏好设置
      resetPreferences: () => {
        set((state) => {
          state.preferences = { ...defaultPreferences };
          state.notifications = { ...defaultNotificationSettings };
        });
      },
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
));

// 导出所有 store
export default {
  useAuthStore,
  useAppStore,
  useDataStore,
  usePreferencesStore,
};

// 导出 store 类型
export type {
  AuthState,
  AuthActions,
  AppState,
  AppActions,
  DataState,
  DataActions,
  PreferencesState,
  PreferencesActions,
};