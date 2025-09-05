import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { message, Spin, Alert } from 'antd';

import { useDashboardDesigner } from './hooks/useDashboardDesigner';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ComponentPalette } from './components/ComponentPalette';
import { PropertyPanel } from './components/PropertyPanel';
import { DesignerCanvas } from './components/DesignerCanvas';
import { DesignerToolbar } from './components/DesignerToolbar';
import { ComponentRenderer } from './components/ComponentRenderer';
import DataConnectionManager from './components/DataConnectionManager';

import type {
  DashboardComponent,
  ComponentTemplate,
  GridLayoutConfig,
  DataSource,
  QueryResult,
} from './types';

import {
  DEFAULT_COMPONENT_TEMPLATES,
  GRID_CONFIGS,
  BREAKPOINTS,
  KEYBOARD_SHORTCUTS,
  AUTO_SAVE_CONFIG,
} from './constants/index';

// 定义组件特有的类型
export interface DashboardDesignerProps {
  dashboardId?: string;
  initialLayout?: any;
  initialComponents?: DashboardComponent[];
  templates?: ComponentTemplate[];
  config?: any;
  readonly?: boolean;
  onSave?: (layout: any, components: DashboardComponent[]) => void;
  onLoad?: (dashboardId: string) => void;
  onError?: (error: string) => void;
  onComponentSelect?: (component: DashboardComponent | null) => void;
  onLayoutChange?: (layout: any) => void;
  className?: string;
  style?: React.CSSProperties;
}
import { generateId, validateComponent, validateLayout } from './utils';

import './DashboardDesigner.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface DashboardDesignerState {
  loading: boolean;
  error: string | null;
  leftSidebarVisible: boolean;
  rightSidebarVisible: boolean;
  previewMode: boolean;
  fullscreen: boolean;
  zoom: number;
  dataConnectionVisible: boolean;
}

const DashboardDesigner: React.FC<DashboardDesignerProps> = ({
  dashboardId,
  initialLayout,
  initialComponents = [],
  templates = DEFAULT_COMPONENT_TEMPLATES,
  config = {},
  readonly = false,
  onSave,
  onLoad,
  onError,
  onComponentSelect,
  onLayoutChange,
  className,
  style,
}) => {
  // 设计器状态
  const [designerState, setDesignerState] = useState<DashboardDesignerState>({
    loading: false,
    error: null,
    leftSidebarVisible: true,
    rightSidebarVisible: true,
    previewMode: false,
    fullscreen: false,
    zoom: 1,
    dataConnectionVisible: false,
  });

  // 数据源状态管理
  const [availableDataSources, setAvailableDataSources] = useState<DataSource[]>([]);

  // 使用设计器Hook
  const {
    state,
    actions,
    loading: designerLoading,
    error: designerError,
  } = useDashboardDesigner({
    dashboardId,
    initialLayout,
    initialComponents,
    autoSave: config.autoSave ?? AUTO_SAVE_CONFIG,
    onSave,
    onLoad,
    onError,
  });

  // 键盘快捷键
  useKeyboardShortcuts({
    shortcuts: KEYBOARD_SHORTCUTS,
    onSave: actions.saveDashboard,
    onUndo: actions.undo,
    onRedo: actions.redo,
    onDelete: () => {
      if (state.selectedComponentId) {
        actions.removeComponent(state.selectedComponentId);
      }
    },
    onCopy: () => {
      if (state.selectedComponentId) {
        const component = state.components.find(c => c.id === state.selectedComponentId);
        if (component) {
          actions.copyComponent(component);
        }
      }
    },
    onPaste: actions.pasteComponent,
    onSelectAll: () => {
      // 全选逻辑
      console.log('Select all components');
    },
    onPreview: () => {
      setDesignerState(prev => ({ ...prev, previewMode: !prev.previewMode }));
    },
    enabled: !readonly,
  });

  // 合并加载状态
  const loading = designerLoading || designerState.loading;
  const error = designerError || designerState.error;

  // 网格配置
  const gridConfig = useMemo(() => ({
    ...GRID_CONFIGS,
    ...config.grid,
  }), [config.grid]);

  // 断点配置
  const breakpoints = useMemo(() => ({
    ...BREAKPOINTS,
    ...config.breakpoints,
  }), [config.breakpoints]);

  // 处理组件选择
  const handleComponentSelect = useCallback((componentId: string | null) => {
    actions.selectComponent(componentId);
    onComponentSelect?.(componentId);
  }, [actions, onComponentSelect]);

  // 处理布局变化
  const handleLayoutChange = useCallback((layout: any[], layouts: any) => {
    if (!readonly) {
      actions.updateLayout(layout, layouts);
      onLayoutChange?.(layout, layouts);
    }
  }, [actions, onLayoutChange, readonly]);

  // 处理组件添加
  const handleComponentAdd = useCallback((template: ComponentTemplate, position?: { x: number; y: number }) => {
    if (readonly) return;

    const newComponent: DashboardComponent = {
      id: generateId(),
      type: template.type,
      title: template.title,
      config: { ...template.defaultConfig },
      style: { ...template.defaultStyle },
      layout: {
        i: generateId(),
        x: position?.x ?? 0,
        y: position?.y ?? 0,
        w: template.defaultSize.w,
        h: template.defaultSize.h,
        minW: template.minSize?.w,
        minH: template.minSize?.h,
        maxW: template.maxSize?.w,
        maxH: template.maxSize?.h,
      },
      dataSource: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (validateComponent(newComponent)) {
      actions.addComponent(newComponent);
      actions.selectComponent(newComponent.id);
    } else {
      message.error('组件配置无效');
    }
  }, [actions, readonly]);

  // 处理组件更新
  const handleComponentUpdate = useCallback((componentId: string, updates: Partial<DashboardComponent>) => {
    if (readonly) return;

    const component = state.components.find(c => c.id === componentId);
    if (component) {
      const updatedComponent = { ...component, ...updates, updatedAt: new Date().toISOString() };
      if (validateComponent(updatedComponent)) {
        actions.updateComponent(componentId, updates);
      } else {
        message.error('组件配置无效');
      }
    }
  }, [actions, state.components, readonly]);

  // 处理组件删除
  const handleComponentDelete = useCallback((componentId: string) => {
    if (readonly) return;
    actions.removeComponent(componentId);
  }, [actions, readonly]);

  // 处理组件复制
  const handleComponentCopy = useCallback((component: DashboardComponent) => {
    if (readonly) return;
    actions.copyComponent(component);
  }, [actions, readonly]);

  // 处理侧边栏切换
  const handleSidebarToggle = useCallback((side: 'left' | 'right') => {
    setDesignerState(prev => ({
      ...prev,
      [`${side}SidebarVisible`]: !prev[`${side}SidebarVisible` as keyof DashboardDesignerState],
    }));
  }, []);

  // 处理预览模式切换
  const handlePreviewToggle = useCallback(() => {
    setDesignerState(prev => ({ ...prev, previewMode: !prev.previewMode }));
  }, []);

  // 处理全屏切换
  const handleFullscreenToggle = useCallback(() => {
    setDesignerState(prev => ({ ...prev, fullscreen: !prev.fullscreen }));
  }, []);

  // 处理缩放
  const handleZoomChange = useCallback((zoom: number) => {
    setDesignerState(prev => ({ ...prev, zoom }));
  }, []);

  // 处理清空画布
  const handleClearCanvas = useCallback(() => {
    if (readonly) return;
    actions.clearComponents();
  }, [actions, readonly]);

  // 处理导出
  const handleExport = useCallback(async (format: string) => {
    try {
      setDesignerState(prev => ({ ...prev, loading: true }));
      await actions.exportDashboard(format);
      message.success('导出成功');
    } catch (err) {
      message.error('导出失败');
      console.error('Export error:', err);
    } finally {
      setDesignerState(prev => ({ ...prev, loading: false }));
    }
  }, [actions]);

  // 处理导入
  const handleImport = useCallback(async (file: File) => {
    try {
      setDesignerState(prev => ({ ...prev, loading: true }));
      await actions.importDashboard(file);
      message.success('导入成功');
    } catch (err) {
      message.error('导入失败');
      console.error('Import error:', err);
    } finally {
      setDesignerState(prev => ({ ...prev, loading: false }));
    }
  }, [actions]);

  // 处理数据连接管理器切换
  const handleDataConnectionToggle = useCallback(() => {
    setDesignerState(prev => ({ ...prev, dataConnectionVisible: !prev.dataConnectionVisible }));
  }, []);

  // 处理数据连接选择
  const handleDataConnectionSelect = useCallback((dataSource: any, queryResult: any) => {
    // 这里可以将选择的数据源和查询结果传递给当前选中的组件
    if (state.selectedComponentId) {
      const selectedComponent = state.components.find(c => c.id === state.selectedComponentId);
      if (selectedComponent) {
        const updatedComponent = {
          ...selectedComponent,
          config: {
            ...selectedComponent.config,
            dataSource,
            data: queryResult?.data || [],
          },
        };
        actions.updateComponent(updatedComponent);
        message.success('数据源已绑定到组件');
      }
    } else {
      message.warning('请先选择一个组件来绑定数据源');
    }
  }, [state.selectedComponentId, state.components, actions]);

  // 错误处理
  useEffect(() => {
    if (error) {
      message.error(error);
      onError?.(new Error(error));
    }
  }, [error, onError]);

  // 渲染加载状态
  if (loading && state.components.length === 0) {
    return (
      <div className="dashboard-designer dashboard-designer--loading">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  // 渲染错误状态
  if (error && state.components.length === 0) {
    return (
      <div className="dashboard-designer dashboard-designer--error">
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          action={
            <button
              className="dashboard-designer__retry-button"
              onClick={() => actions.loadDashboard(dashboardId)}
            >
              重试
            </button>
          }
        />
      </div>
    );
  }

  const designerClasses = [
    'dashboard-designer',
    designerState.previewMode && 'dashboard-designer--preview',
    designerState.fullscreen && 'dashboard-designer--fullscreen',
    readonly && 'dashboard-designer--readonly',
    !designerState.leftSidebarVisible && 'dashboard-designer--no-left-sidebar',
    !designerState.rightSidebarVisible && 'dashboard-designer--no-right-sidebar',
    className,
  ].filter(Boolean).join(' ');

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={designerClasses} style={style}>
        {/* 工具栏 */}
        <div className="dashboard-designer__header">
          <DesignerToolbar
            canUndo={state.canUndo}
            canRedo={state.canRedo}
            isDirty={state.isDirty}
            previewMode={designerState.previewMode}
            readonly={readonly}
            onSave={() => actions.saveDashboard()}
            onUndo={actions.undo}
            onRedo={actions.redo}
            onPreview={handlePreviewToggle}
            onClear={handleClearCanvas}
            onExport={handleExport}
            onImport={handleImport}
            onFullscreen={handleFullscreenToggle}
            onZoomChange={handleZoomChange}
            zoom={designerState.zoom}
            leftSidebarVisible={designerState.leftSidebarVisible}
            rightSidebarVisible={designerState.rightSidebarVisible}
            onSidebarToggle={handleSidebarToggle}
            onDataConnectionToggle={handleDataConnectionToggle}
          />
        </div>

        {/* 主体内容 */}
        <div className="dashboard-designer__body">
          {/* 左侧边栏 - 组件面板 */}
          {designerState.leftSidebarVisible && !designerState.previewMode && (
            <div className="dashboard-designer__left-sidebar">
              <ComponentPalette
                templates={templates}
                onComponentAdd={handleComponentAdd}
                readonly={readonly}
              />
            </div>
          )}

          {/* 中央画布区域 */}
          <div className="dashboard-designer__canvas-area">
            <div 
              className="dashboard-designer__canvas-container"
              style={{ transform: `scale(${designerState.zoom})` }}
            >
              <div className="dashboard-designer__canvas">
                <DesignerCanvas
                  components={state.components}
                  layout={state.layout}
                  layouts={state.layouts}
                  selectedComponentId={state.selectedComponentId}
                  gridConfig={gridConfig}
                  breakpoints={breakpoints}
                  previewMode={designerState.previewMode}
                  readonly={readonly}
                  onComponentSelect={handleComponentSelect}
                  onComponentUpdate={handleComponentUpdate}
                  onComponentDelete={handleComponentDelete}
                  onComponentAdd={handleComponentAdd}
                  onLayoutChange={handleLayoutChange}
                />
              </div>
            </div>
          </div>

          {/* 右侧边栏 - 属性面板 */}
          {designerState.rightSidebarVisible && !designerState.previewMode && (
            <div className="dashboard-designer__right-sidebar">
              <PropertyPanel
                selectedComponent={
                  state.selectedComponentId
                    ? state.components.find(c => c.id === state.selectedComponentId)
                    : null
                }
                onComponentUpdate={handleComponentUpdate}
                onComponentDelete={handleComponentDelete}
                onComponentDuplicate={handleComponentCopy}
                onDataConnectionToggle={handleDataConnectionToggle}
                availableDataSources={availableDataSources}
                className=""
              />
            </div>
          )}
        </div>

        {/* 数据连接管理器 */}
        {designerState.dataConnectionVisible && (
          <div className="dashboard-designer__data-connection-overlay">
            <div className="dashboard-designer__data-connection-modal">
              <DataConnectionManager
                onDataSelect={handleDataConnectionSelect}
                onClose={handleDataConnectionToggle}
                selectedComponent={
                  state.selectedComponentId
                    ? state.components.find(c => c.id === state.selectedComponentId)
                    : null
                }
              />
            </div>
          </div>
        )}

        {/* 加载遮罩 */}
        {loading && (
          <div className="dashboard-designer__loading-overlay">
            <Spin size="large" tip="处理中..." />
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default DashboardDesigner;
export { DashboardDesigner };
export type { DashboardDesignerProps, DashboardDesignerState };