// 自定义 React Hooks
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type {
  User,
  DataSource,
  Dashboard,
  Chart,
  PaginationQuery,
  PaginatedResponse,
} from '@/types';
import {
  authApi,
  userApi,
  dataSourceApi,
  dashboardApi,
  chartApi,
  systemApi,
} from '@/services/api';
import { useAuthStore, useAppStore, useDataStore } from '@/store';

// 通用异步状态 Hook
export function useAsyncState<T>(initialState: T) {
  const [data, setData] = useState<T>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFunction();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '操作失败';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(initialState);
    setError(null);
    setLoading(false);
  }, [initialState]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    setData,
    setError,
  };
}

// 分页数据 Hook
export function usePagination<T>({
  fetchFunction,
  initialParams = {},
  dependencies = [],
}: {
  fetchFunction: (params: PaginationQuery) => Promise<{ success: boolean; data?: PaginatedResponse<T> }>;
  initialParams?: Partial<PaginationQuery>;
  dependencies?: any[];
}) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    ...initialParams,
  });

  const fetchData = useCallback(async (params?: Partial<PaginationQuery>) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...params,
      };
      
      const response = await fetchFunction(queryParams);
      
      if (response.success && response.data) {
        setData(response.data.items);
        setPagination(prev => ({
          ...prev,
          total: response.data!.total,
          current: response.data!.page,
          pageSize: response.data!.limit,
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取数据失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, pagination.current, pagination.pageSize]);

  const changePage = useCallback((page: number, pageSize?: number) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize,
    }));
  }, []);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, ...dependencies]);

  return {
    data,
    loading,
    error,
    pagination,
    fetchData,
    changePage,
    refresh,
  };
}

// 防抖 Hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 节流 Hook
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

// 本地存储 Hook
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// 会话存储 Hook
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// 窗口大小 Hook
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

// 媒体查询 Hook
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// 响应式断点 Hook
export function useBreakpoint() {
  const isXs = useMediaQuery('(max-width: 575px)');
  const isSm = useMediaQuery('(min-width: 576px) and (max-width: 767px)');
  const isMd = useMediaQuery('(min-width: 768px) and (max-width: 991px)');
  const isLg = useMediaQuery('(min-width: 992px) and (max-width: 1199px)');
  const isXl = useMediaQuery('(min-width: 1200px) and (max-width: 1599px)');
  const isXxl = useMediaQuery('(min-width: 1600px)');

  const breakpoint = useMemo(() => {
    if (isXs) return 'xs';
    if (isSm) return 'sm';
    if (isMd) return 'md';
    if (isLg) return 'lg';
    if (isXl) return 'xl';
    if (isXxl) return 'xxl';
    return 'md';
  }, [isXs, isSm, isMd, isLg, isXl, isXxl]);

  return {
    breakpoint,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    isXxl,
    isMobile: isXs || isSm,
    isTablet: isMd,
    isDesktop: isLg || isXl || isXxl,
  };
}

// 认证 Hook
export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshAuth,
    updateUser,
    clearError,
  } = useAuthStore();

  const navigate = useNavigate();
  const location = useLocation();

  const loginAndRedirect = useCallback(async (email: string, password: string) => {
    await login(email, password);
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    navigate(from, { replace: true });
  }, [login, navigate, location]);

  const logoutAndRedirect = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: loginAndRedirect,
    logout: logoutAndRedirect,
    refreshAuth,
    updateUser,
    clearError,
  };
}

// 用户管理 Hook
export function useUsers() {
  const { data, loading, error, pagination, fetchData, changePage, refresh } = usePagination<User>({
    fetchFunction: userApi.getUsers,
  });

  const createUser = useCallback(async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await userApi.createUser(userData);
    if (response.success) {
      refresh();
    }
    return response;
  }, [refresh]);

  const updateUser = useCallback(async (id: number, userData: Partial<User>) => {
    const response = await userApi.updateUser(id, userData);
    if (response.success) {
      refresh();
    }
    return response;
  }, [refresh]);

  const deleteUser = useCallback(async (id: number) => {
    const response = await userApi.deleteUser(id);
    if (response.success) {
      refresh();
    }
    return response;
  }, [refresh]);

  return {
    users: data,
    loading,
    error,
    pagination,
    fetchUsers: fetchData,
    changePage,
    refresh,
    createUser,
    updateUser,
    deleteUser,
  };
}

// 数据源管理 Hook
export function useDataSources() {
  const { dataSources, setDataSources, addDataSource, updateDataSource, removeDataSource } = useDataStore();
  const { data, loading, error, pagination, fetchData, changePage, refresh } = usePagination<DataSource>({
    fetchFunction: dataSourceApi.getDataSources,
  });

  useEffect(() => {
    setDataSources(data);
  }, [data, setDataSources]);

  const createDataSource = useCallback(async (dataSourceData: any) => {
    const response = await dataSourceApi.createDataSource(dataSourceData);
    if (response.success && response.data) {
      addDataSource(response.data);
      refresh();
    }
    return response;
  }, [addDataSource, refresh]);

  const updateDataSourceById = useCallback(async (id: number, dataSourceData: Partial<DataSource>) => {
    const response = await dataSourceApi.updateDataSource(id, dataSourceData);
    if (response.success) {
      updateDataSource(id, dataSourceData);
      refresh();
    }
    return response;
  }, [updateDataSource, refresh]);

  const deleteDataSource = useCallback(async (id: number) => {
    const response = await dataSourceApi.deleteDataSource(id);
    if (response.success) {
      removeDataSource(id);
      refresh();
    }
    return response;
  }, [removeDataSource, refresh]);

  const testDataSource = useCallback(async (id: number, testData: any) => {
    return await dataSourceApi.testDataSource(id, testData);
  }, []);

  return {
    dataSources,
    loading,
    error,
    pagination,
    fetchDataSources: fetchData,
    changePage,
    refresh,
    createDataSource,
    updateDataSource: updateDataSourceById,
    deleteDataSource,
    testDataSource,
  };
}

// 仪表盘管理 Hook
export function useDashboards() {
  const {
    dashboards,
    currentDashboard,
    setDashboards,
    addDashboard,
    updateDashboard,
    removeDashboard,
    setCurrentDashboard,
  } = useDataStore();
  
  const { data, loading, error, pagination, fetchData, changePage, refresh } = usePagination<Dashboard>({
    fetchFunction: dashboardApi.getDashboards,
  });

  useEffect(() => {
    setDashboards(data);
  }, [data, setDashboards]);

  const createDashboard = useCallback(async (dashboardData: any) => {
    const response = await dashboardApi.createDashboard(dashboardData);
    if (response.success && response.data) {
      addDashboard(response.data);
      refresh();
    }
    return response;
  }, [addDashboard, refresh]);

  const updateDashboardById = useCallback(async (id: number, dashboardData: Partial<Dashboard>) => {
    const response = await dashboardApi.updateDashboard(id, dashboardData);
    if (response.success) {
      updateDashboard(id, dashboardData);
      refresh();
    }
    return response;
  }, [updateDashboard, refresh]);

  const deleteDashboard = useCallback(async (id: number) => {
    const response = await dashboardApi.deleteDashboard(id);
    if (response.success) {
      removeDashboard(id);
      if (currentDashboard?.id === id) {
        setCurrentDashboard(null);
      }
      refresh();
    }
    return response;
  }, [removeDashboard, currentDashboard, setCurrentDashboard, refresh]);

  const cloneDashboard = useCallback(async (id: number, name: string) => {
    const response = await dashboardApi.cloneDashboard(id, name);
    if (response.success && response.data) {
      addDashboard(response.data);
      refresh();
    }
    return response;
  }, [addDashboard, refresh]);

  return {
    dashboards,
    currentDashboard,
    loading,
    error,
    pagination,
    fetchDashboards: fetchData,
    changePage,
    refresh,
    createDashboard,
    updateDashboard: updateDashboardById,
    deleteDashboard,
    cloneDashboard,
    setCurrentDashboard,
  };
}

// 图表管理 Hook
export function useCharts() {
  const {
    charts,
    currentChart,
    setCharts,
    addChart,
    updateChart,
    removeChart,
    setCurrentChart,
  } = useDataStore();
  
  const { data, loading, error, pagination, fetchData, changePage, refresh } = usePagination<Chart>({
    fetchFunction: chartApi.getCharts,
  });

  useEffect(() => {
    setCharts(data);
  }, [data, setCharts]);

  const createChart = useCallback(async (chartData: any) => {
    const response = await chartApi.createChart(chartData);
    if (response.success && response.data) {
      addChart(response.data);
      refresh();
    }
    return response;
  }, [addChart, refresh]);

  const updateChartById = useCallback(async (id: number, chartData: Partial<Chart>) => {
    const response = await chartApi.updateChart(id, chartData);
    if (response.success) {
      updateChart(id, chartData);
      refresh();
    }
    return response;
  }, [updateChart, refresh]);

  const deleteChart = useCallback(async (id: number) => {
    const response = await chartApi.deleteChart(id);
    if (response.success) {
      removeChart(id);
      if (currentChart?.id === id) {
        setCurrentChart(null);
      }
      refresh();
    }
    return response;
  }, [removeChart, currentChart, setCurrentChart, refresh]);

  const getChartData = useCallback(async (id: number, params?: any) => {
    return await chartApi.getChartData(id, params);
  }, []);

  const refreshChartData = useCallback(async (id: number) => {
    return await chartApi.refreshChartData(id);
  }, []);

  const cloneChart = useCallback(async (id: number, name: string) => {
    const response = await chartApi.cloneChart(id, name);
    if (response.success && response.data) {
      addChart(response.data);
      refresh();
    }
    return response;
  }, [addChart, refresh]);

  return {
    charts,
    currentChart,
    loading,
    error,
    pagination,
    fetchCharts: fetchData,
    changePage,
    refresh,
    createChart,
    updateChart: updateChartById,
    deleteChart,
    getChartData,
    refreshChartData,
    cloneChart,
    setCurrentChart,
  };
}

// 系统信息 Hook
export function useSystemInfo() {
  const {
    data: systemInfo,
    loading,
    error,
    execute: fetchSystemInfo,
  } = useAsyncState<any>(null);

  const {
    data: healthStatus,
    loading: healthLoading,
    error: healthError,
    execute: fetchHealthStatus,
  } = useAsyncState<any>(null);

  const {
    data: systemStats,
    loading: statsLoading,
    error: statsError,
    execute: fetchSystemStats,
  } = useAsyncState<any>(null);

  const getSystemInfo = useCallback(async () => {
    const response = await systemApi.getSystemInfo();
    return response.data;
  }, []);

  const getHealthStatus = useCallback(async () => {
    const response = await systemApi.getHealthStatus();
    return response.data;
  }, []);

  const getSystemStats = useCallback(async () => {
    const response = await systemApi.getSystemStats();
    return response.data;
  }, []);

  useEffect(() => {
    fetchSystemInfo(getSystemInfo);
    fetchHealthStatus(getHealthStatus);
    fetchSystemStats(getSystemStats);
  }, []);

  return {
    systemInfo,
    healthStatus,
    systemStats,
    loading: loading || healthLoading || statsLoading,
    error: error || healthError || statsError,
    refresh: () => {
      fetchSystemInfo(getSystemInfo);
      fetchHealthStatus(getHealthStatus);
      fetchSystemStats(getSystemStats);
    },
  };
}

// 通知 Hook
export function useNotification() {
  const { addNotification, removeNotification, clearNotifications } = useAppStore();

  const notify = useCallback((
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    duration?: number
  ) => {
    addNotification({ type, title, message, duration });
  }, [addNotification]);

  const success = useCallback((title: string, message: string, duration?: number) => {
    notify('success', title, message, duration);
  }, [notify]);

  const error = useCallback((title: string, message: string, duration?: number) => {
    notify('error', title, message, duration);
  }, [notify]);

  const warning = useCallback((title: string, message: string, duration?: number) => {
    notify('warning', title, message, duration);
  }, [notify]);

  const info = useCallback((title: string, message: string, duration?: number) => {
    notify('info', title, message, duration);
  }, [notify]);

  return {
    notify,
    success,
    error,
    warning,
    info,
    remove: removeNotification,
    clear: clearNotifications,
  };
}

// 导出所有 hooks
export default {
  useAsyncState,
  usePagination,
  useDebounce,
  useThrottle,
  useLocalStorage,
  useSessionStorage,
  useWindowSize,
  useMediaQuery,
  useBreakpoint,
  useAuth,
  useUsers,
  useDataSources,
  useDashboards,
  useCharts,
  useSystemInfo,
  useNotification,
};