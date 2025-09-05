import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button, Card, Drawer, message, Modal, Space, Tooltip } from 'antd';
import {
  PlusOutlined,
  SaveOutlined,
  EyeOutlined,
  SettingOutlined,
  DeleteOutlined,
  CopyOutlined,
  UndoOutlined,
  RedoOutlined
} from '@ant-design/icons';
import { ComponentPalette } from './components/ComponentPalette';
import { DashboardCanvas } from './DashboardCanvas';
import { PropertyPanel } from './PropertyPanel';
import { DashboardToolbar } from './DashboardToolbar';
import { useDashboardDesigner } from './hooks/useDashboardDesigner';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import type { ComponentTemplate } from './types';
import type { DashboardComponent, DashboardLayout } from './types';
import './DashboardDesigner.less';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardDesignerProps {
  dashboardId?: string;
  initialLayout?: DashboardLayout;
  onSave?: (layout: DashboardLayout) => Promise<void>;
  onPreview?: (layout: DashboardLayout) => void;
  readonly?: boolean;
}

export const DashboardDesigner: React.FC<DashboardDesignerProps> = ({
  dashboardId,
  initialLayout,
  onSave,
  onPreview,
  readonly = false
}) => {
  const {
    layout,
    components,
    selectedComponent,
    breakpoint,
    isDirty,
    canUndo,
    canRedo,
    addComponent,
    updateComponent,
    removeComponent,
    selectComponent,
    updateLayout,
    saveLayout,
    undo,
    redo,
    setBreakpoint
  } = useDashboardDesigner({
    dashboardId,
    initialLayout,
    onSave
  });

  const [paletteVisible, setPaletteVisible] = useState(false);
  const [propertyVisible, setPropertyVisible] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // 键盘快捷键
  useKeyboardShortcuts({
    onSave: handleSave,
    onUndo: undo,
    onRedo: redo,
    onDelete: handleDeleteSelected,
    onCopy: handleCopySelected,
    onPreview: handlePreview
  });

  // 保存布局
  const handleSave = useCallback(async () => {
    if (!isDirty || readonly) return;
    
    setSaving(true);
    try {
      await saveLayout();
      message.success('仪表盘保存成功');
    } catch (error) {
      message.error('保存失败：' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  }, [isDirty, readonly, saveLayout]);

  // 预览模式
  const handlePreview = useCallback(() => {
    if (previewMode) {
      setPreviewMode(false);
    } else {
      setPreviewMode(true);
      onPreview?.({
        layout,
        components,
        breakpoint
      });
    }
  }, [previewMode, layout, components, breakpoint, onPreview]);

  // 删除选中组件
  const handleDeleteSelected = useCallback(() => {
    if (!selectedComponent || readonly) return;
    
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除选中的组件吗？',
      onOk: () => {
        removeComponent(selectedComponent.id);
        message.success('组件已删除');
      }
    });
  }, [selectedComponent, readonly, removeComponent]);

  // 复制选中组件
  const handleCopySelected = useCallback(() => {
    if (!selectedComponent || readonly) return;
    
    const newComponent: DashboardComponent = {
      ...selectedComponent,
      id: `${selectedComponent.id}_copy_${Date.now()}`,
      layout: {
        ...selectedComponent.layout,
        x: selectedComponent.layout.x + 1,
        y: selectedComponent.layout.y + 1
      }
    };
    
    addComponent(newComponent);
    selectComponent(newComponent.id);
    message.success('组件已复制');
  }, [selectedComponent, readonly, addComponent, selectComponent]);

  // 从组件面板添加组件
  const handleAddComponent = useCallback((template: ComponentTemplate) => {
    if (readonly) return;
    
    const newComponent: DashboardComponent = {
      id: `component_${Date.now()}`,
      type: template.type,
      config: {
        ...template.config,
        title: template.name
      },
      layout: {
        i: `component_${Date.now()}`,
        x: 0,
        y: 0,
        w: template.config.defaultSize?.w || 6,
        h: template.config.defaultSize?.h || 4,
        minW: template.config.minSize?.w || 2,
        minH: template.config.minSize?.h || 2,
        maxW: template.config.maxSize?.w || 12,
        maxH: template.config.maxSize?.h || 8
      }
    };
    
    addComponent(newComponent);
    selectComponent(newComponent.id);
    setPropertyVisible(true);
    setPaletteVisible(false);
  }, [readonly, addComponent, selectComponent]);

  // 布局变化处理
  const handleLayoutChange = useCallback((newLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    if (readonly) return;
    updateLayout(newLayout, breakpoint);
  }, [readonly, updateLayout, breakpoint]);

  // 断点变化处理
  const handleBreakpointChange = useCallback((newBreakpoint: string) => {
    setBreakpoint(newBreakpoint);
  }, [setBreakpoint]);

  // 组件选择处理
  const handleComponentSelect = useCallback((componentId: string) => {
    selectComponent(componentId);
    setPropertyVisible(true);
  }, [selectComponent]);

  // 组件配置更新
  const handleComponentUpdate = useCallback((componentId: string, config: any) => {
    updateComponent(componentId, { config });
  }, [updateComponent]);

  // 工具栏操作
  const toolbarActions = {
    onAddComponent: () => setPaletteVisible(true),
    onSave: handleSave,
    onPreview: handlePreview,
    onUndo: undo,
    onRedo: redo,
    onSettings: () => setPropertyVisible(true),
    onDelete: handleDeleteSelected,
    onCopy: handleCopySelected
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="dashboard-designer" ref={canvasRef}>
        {/* 工具栏 */}
        <DashboardToolbar
          {...toolbarActions}
          canUndo={canUndo}
          canRedo={canRedo}
          isDirty={isDirty}
          saving={saving}
          readonly={readonly}
          previewMode={previewMode}
          selectedComponent={selectedComponent}
        />

        {/* 主要内容区域 */}
        <div className="dashboard-designer-content">
          {/* 画布区域 */}
          <div className="dashboard-canvas-container">
            <DashboardCanvas
              layout={layout}
              components={components}
              breakpoint={breakpoint}
              selectedComponent={selectedComponent}
              previewMode={previewMode}
              readonly={readonly}
              onLayoutChange={handleLayoutChange}
              onBreakpointChange={handleBreakpointChange}
              onComponentSelect={handleComponentSelect}
              onComponentUpdate={handleComponentUpdate}
            />
          </div>
        </div>

        {/* 组件面板抽屉 */}
        <Drawer
          title="组件库"
          placement="left"
          width={320}
          open={paletteVisible}
          onClose={() => setPaletteVisible(false)}
          mask={false}
          getContainer={false}
          style={{ position: 'absolute' }}
        >
          <ComponentPalette
            onAddComponent={handleAddComponent}
            searchable
            categorized
          />
        </Drawer>

        {/* 属性面板抽屉 */}
        <Drawer
          title={selectedComponent ? `${selectedComponent.config.title || '组件'} 属性` : '属性面板'}
          placement="right"
          width={360}
          open={propertyVisible}
          onClose={() => setPropertyVisible(false)}
          mask={false}
          getContainer={false}
          style={{ position: 'absolute' }}
        >
          {selectedComponent && (
            <PropertyPanel
              component={selectedComponent}
              onChange={(config) => handleComponentUpdate(selectedComponent.id, config)}
              readonly={readonly}
            />
          )}
        </Drawer>

        {/* 快捷键提示 */}
        {!readonly && (
          <div className="keyboard-shortcuts-hint">
            <Tooltip title="快捷键：Ctrl+S 保存，Ctrl+Z 撤销，Ctrl+Y 重做，Delete 删除，Ctrl+C 复制，Ctrl+P 预览">
              <Button type="text" size="small" icon={<SettingOutlined />} />
            </Tooltip>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default DashboardDesigner;