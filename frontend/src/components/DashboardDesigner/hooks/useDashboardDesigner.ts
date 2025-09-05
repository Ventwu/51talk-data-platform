import { useState, useCallback, useEffect, useRef } from 'react';
import { Layout } from 'react-grid-layout';
import { message } from 'antd';
import type {
  DashboardComponent,
  DashboardLayout,
  DEFAULT_GRID_CONFIG
} from '../types';
import { dashboardApi } from '../../../services/api';
import { generateId } from '../utils';

interface UseDashboardDesignerOptions {
  dashboardId?: string;
  initialLayout?: DashboardLayout;
  onSave?: (layout: DashboardLayout) => Promise<void>;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

interface DesignerActions {
  addComponent: (component: Omit<DashboardComponent, 'id'>) => void;
  updateComponent: (id: string, updates: Partial<DashboardComponent>) => void;
  removeComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  updateLayout: (newLayout: { [breakpoint: string]: Layout[] }) => void;
  setBreakpoint: (breakpoint: string) => void;
  saveLayout: () => Promise<void>;
  loadLayout: (layout: DashboardLayout) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

interface UseDashboardDesignerReturn extends DesignerActions {
  layout: { [breakpoint: string]: Layout[] };
  components: DashboardComponent[];
  selectedComponent: DashboardComponent | null;
  breakpoint: string;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  loading: boolean;
  error: string | null;
}

// 历史记录管理
interface HistoryState {
  past: DashboardLayout[];
  present: DashboardLayout;
  future: DashboardLayout[];
}

const createInitialLayout = (): DashboardLayout => ({
  layout: {
    lg: [],
    md: [],
    sm: [],
    xs: [],
    xxs: []
  },
  components: [],
  breakpoint: 'lg',
  config: {
    title: '新建仪表盘',
    theme: 'default',
    backgroundColor: '#f5f5f5',
    padding: 16,
    responsive: {
      enabled: true,
      breakpoints: DEFAULT_GRID_CONFIG.breakpoints,
      cols: DEFAULT_GRID_CONFIG.cols
    }
  }
});

const createInitialHistory = (layout: DashboardLayout): HistoryState => ({
  past: [],
  present: layout,
  future: []
});

export const useDashboardDesigner = ({
  dashboardId,
  initialLayout,
  onSave,
  autoSave = false,
  autoSaveInterval = 30000
}: UseDashboardDesignerOptions = {}): UseDashboardDesignerReturn => {
  const [history, setHistory] = useState<HistoryState>(() => 
    createInitialHistory(initialLayout || createInitialLayout())
  );
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<DashboardLayout | null>(null);

  const { layout, components, breakpoint, config } = history.present;
  const selectedComponent = selectedComponentId 
    ? components.find(c => c.id === selectedComponentId) || null 
    : null;

  // 添加到历史记录
  const addToHistory = useCallback((newLayout: DashboardLayout) => {
    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: newLayout,
      future: []
    }));
    setIsDirty(true);
  }, []);

  // 撤销
  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);
      
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future]
      };
    });
    setIsDirty(true);
  }, []);

  // 重做
  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture
      };
    });
    setIsDirty(true);
  }, []);

  // 添加组件
  const addComponent = useCallback((component: DashboardComponent) => {
    const newLayout = { ...history.present };
    
    // 确保组件ID唯一
    const componentId = component.id || generateId();
    const layoutItem = {
      ...component.layout,
      i: componentId
    };
    
    // 添加到所有断点的布局中
    Object.keys(newLayout.layout).forEach(bp => {
      newLayout.layout[bp] = [...newLayout.layout[bp], layoutItem];
    });
    
    // 添加组件
    newLayout.components = [
      ...newLayout.components,
      {
        ...component,
        id: componentId,
        layout: layoutItem
      }
    ];
    
    addToHistory(newLayout);
    setSelectedComponentId(componentId);
  }, [history.present, addToHistory]);

  // 更新组件
  const updateComponent = useCallback((id: string, updates: Partial<DashboardComponent>) => {
    const newLayout = { ...history.present };
    
    const componentIndex = newLayout.components.findIndex(c => c.id === id);
    if (componentIndex === -1) return;
    
    newLayout.components = [...newLayout.components];
    newLayout.components[componentIndex] = {
      ...newLayout.components[componentIndex],
      ...updates
    };
    
    // 如果更新了布局信息，同步到所有断点
    if (updates.layout) {
      Object.keys(newLayout.layout).forEach(bp => {
        const layoutIndex = newLayout.layout[bp].findIndex(item => item.i === id);
        if (layoutIndex !== -1) {
          newLayout.layout[bp] = [...newLayout.layout[bp]];
          newLayout.layout[bp][layoutIndex] = {
            ...newLayout.layout[bp][layoutIndex],
            ...updates.layout
          };
        }
      });
    }
    
    addToHistory(newLayout);
  }, [history.present, addToHistory]);

  // 删除组件
  const removeComponent = useCallback((id: string) => {
    const newLayout = { ...history.present };
    
    // 从组件列表中删除
    newLayout.components = newLayout.components.filter(c => c.id !== id);
    
    // 从所有断点的布局中删除
    Object.keys(newLayout.layout).forEach(bp => {
      newLayout.layout[bp] = newLayout.layout[bp].filter(item => item.i !== id);
    });
    
    addToHistory(newLayout);
    
    // 如果删除的是选中组件，清除选择
    if (selectedComponentId === id) {
      setSelectedComponentId(null);
    }
  }, [history.present, addToHistory, selectedComponentId]);

  // 选择组件
  const selectComponent = useCallback((id: string | null) => {
    setSelectedComponentId(id);
  }, []);

  // 更新布局
  const updateLayout = useCallback((newLayoutItems: Layout[], currentBreakpoint: string) => {
    const newLayout = { ...history.present };
    newLayout.layout = {
      ...newLayout.layout,
      [currentBreakpoint]: newLayoutItems
    };
    
    // 同步组件的布局信息
    newLayout.components = newLayout.components.map(component => {
      const layoutItem = newLayoutItems.find(item => item.i === component.id);
      if (layoutItem) {
        return {
          ...component,
          layout: layoutItem
        };
      }
      return component;
    });
    
    addToHistory(newLayout);
  }, [history.present, addToHistory]);

  // 设置断点
  const setBreakpoint = useCallback((newBreakpoint: string) => {
    const newLayout = { ...history.present };
    newLayout.breakpoint = newBreakpoint;
    addToHistory(newLayout);
  }, [history.present, addToHistory]);

  // 保存布局
  const saveLayout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (onSave) {
        await onSave(history.present);
      } else if (dashboardId) {
        await dashboardApi.saveDashboard(dashboardId, history.present);
      } else {
        const result = await dashboardApi.createDashboard(history.present);
        if (result.success && result.data?.id) {
          // 如果是新建仪表盘，可以在这里处理ID
          console.log('Dashboard created with ID:', result.data.id);
        }
      }
      
      setIsDirty(false);
      lastSavedRef.current = { ...history.present };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存失败';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [history.present, onSave, dashboardId]);

  // 加载布局
  const loadLayout = useCallback((newLayout: DashboardLayout) => {
    setHistory(createInitialHistory(newLayout));
    setSelectedComponentId(null);
    setIsDirty(false);
    lastSavedRef.current = { ...newLayout };
  }, []);

  // 重置
  const reset = useCallback(() => {
    const initialLayout = createInitialLayout();
    setHistory(createInitialHistory(initialLayout));
    setSelectedComponentId(null);
    setIsDirty(false);
    setError(null);
  }, []);

  // 自动保存
  useEffect(() => {
    if (!autoSave || !isDirty) return;
    
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await saveLayout();
        message.success('自动保存成功');
      } catch (error) {
        console.error('Auto save failed:', error);
      }
    }, autoSaveInterval);
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autoSave, isDirty, autoSaveInterval, saveLayout]);

  // 初始化加载
  useEffect(() => {
    if (dashboardId && !initialLayout) {
      const loadDashboard = async () => {
        try {
          setLoading(true);
          setError(null);
          const result = await dashboardApi.getDashboard(dashboardId);
          if (result.success && result.data) {
            loadLayout(result.data);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : '加载失败';
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      };
      
      loadDashboard();
    }
  }, [dashboardId, initialLayout, loadLayout]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  return {
    layout,
    components,
    selectedComponent,
    breakpoint,
    isDirty,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    loading,
    error,
    addComponent,
    updateComponent,
    removeComponent,
    selectComponent,
    updateLayout,
    setBreakpoint,
    saveLayout,
    loadLayout,
    undo,
    redo,
    reset
  };
};

export default useDashboardDesigner;