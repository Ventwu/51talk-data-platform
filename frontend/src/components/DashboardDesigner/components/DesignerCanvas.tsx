import React, { useCallback, useMemo, useRef } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { useDrop } from 'react-dnd';
import type { DashboardComponent, GridLayoutConfig, DragItem } from '../types';

interface DropResult {
  dropEffect: string;
}
import { ComponentRenderer } from './ComponentRenderer';
import './DesignerCanvas.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DesignerCanvasProps {
  components: DashboardComponent[];
  selectedComponentId?: string;
  gridConfig: GridLayoutConfig;
  onLayoutChange: (layout: Layout[], layouts: { [key: string]: Layout[] }) => void;
  onComponentSelect: (componentId: string | null) => void;
  onComponentAdd: (component: DashboardComponent) => void;
  onComponentUpdate: (componentId: string, updates: Partial<DashboardComponent>) => void;
  onComponentDelete: (componentId: string) => void;
  readOnly?: boolean;
  showGrid?: boolean;
  snapToGrid?: boolean;
  className?: string;
}

// 网格辅助线组件
interface GridOverlayProps {
  cols: number;
  rowHeight: number;
  margin: [number, number];
  containerPadding: [number, number];
  width: number;
  visible: boolean;
}

const GridOverlay: React.FC<GridOverlayProps> = ({
  cols,
  rowHeight,
  margin,
  containerPadding,
  width,
  visible
}) => {
  if (!visible) return null;

  const colWidth = (width - containerPadding[0] * 2 - margin[0] * (cols - 1)) / cols;
  const gridLines = [];

  // 垂直线
  for (let i = 0; i <= cols; i++) {
    const x = containerPadding[0] + i * (colWidth + margin[0]);
    gridLines.push(
      <line
        key={`v-${i}`}
        x1={x}
        y1={0}
        x2={x}
        y2="100%"
        stroke="#e1e5e9"
        strokeWidth={1}
        strokeDasharray="2,2"
      />
    );
  }

  // 水平线（每隔一定高度）
  const maxRows = 20; // 显示的最大行数
  for (let i = 0; i <= maxRows; i++) {
    const y = containerPadding[1] + i * (rowHeight + margin[1]);
    gridLines.push(
      <line
        key={`h-${i}`}
        x1={0}
        y1={y}
        x2="100%"
        y2={y}
        stroke="#e1e5e9"
        strokeWidth={1}
        strokeDasharray="2,2"
      />
    );
  }

  return (
    <svg className="grid-overlay" width="100%" height="100%">
      {gridLines}
    </svg>
  );
};

// 拖拽预览组件
interface DropPreviewProps {
  dragItem: DragItem | null;
  position: { x: number; y: number } | null;
  gridConfig: GridLayoutConfig;
}

const DropPreview: React.FC<DropPreviewProps> = ({ dragItem, position, gridConfig }) => {
  if (!dragItem || !position || dragItem.type !== 'component') return null;

  const { template } = dragItem;
  if (!template) return null;

  const style = {
    position: 'absolute' as const,
    left: position.x,
    top: position.y,
    width: template.defaultSize.w * 100, // 假设每个网格单位100px
    height: template.defaultSize.h * 50,  // 假设每个网格单位50px
    background: 'rgba(0, 123, 255, 0.1)',
    border: '2px dashed #007bff',
    borderRadius: '4px',
    pointerEvents: 'none' as const,
    zIndex: 1000
  };

  return (
    <div style={style} className="drop-preview">
      <div className="preview-content">
        <span className="preview-icon">{template.icon}</span>
        <span className="preview-name">{template.name}</span>
      </div>
    </div>
  );
};

// 组件包装器
interface ComponentWrapperProps {
  component: DashboardComponent;
  isSelected: boolean;
  onSelect: (componentId: string) => void;
  onUpdate: (componentId: string, updates: Partial<DashboardComponent>) => void;
  readOnly: boolean;
}

const ComponentWrapper: React.FC<ComponentWrapperProps> = ({
  component,
  isSelected,
  onSelect,
  onUpdate,
  readOnly
}) => {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(component.id);
  }, [component.id, onSelect]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // 双击进入编辑模式
    if (!readOnly) {
      // TODO: 实现组件编辑逻辑
    }
  }, [readOnly]);

  return (
    <div
      className={`component-wrapper ${isSelected ? 'selected' : ''} ${readOnly ? 'readonly' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        ...component.style
      }}
    >
      <ComponentRenderer
        component={component}
        onUpdate={onUpdate}
        readOnly={readOnly}
      />
      {isSelected && !readOnly && (
        <div className="selection-overlay">
          <div className="selection-border"></div>
          <div className="selection-handles">
            <div className="handle handle-nw"></div>
            <div className="handle handle-ne"></div>
            <div className="handle handle-sw"></div>
            <div className="handle handle-se"></div>
          </div>
        </div>
      )}
    </div>
  );
};

// 主组件
export const DesignerCanvas: React.FC<DesignerCanvasProps> = ({
  components,
  selectedComponentId,
  gridConfig,
  onLayoutChange,
  onComponentSelect,
  onComponentAdd,
  onComponentUpdate,
  onComponentDelete,
  readOnly = false,
  showGrid = true,
  snapToGrid = true,
  className = ''
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragItem, setDragItem] = React.useState<DragItem | null>(null);
  const [dragPosition, setDragPosition] = React.useState<{ x: number; y: number } | null>(null);

  // 转换组件为布局格式
  const layouts = useMemo(() => {
    const layoutMap: { [key: string]: Layout[] } = {};
    
    Object.keys(gridConfig.breakpoints).forEach(breakpoint => {
      layoutMap[breakpoint] = components.map(component => ({
        i: component.id,
        x: component.layout.x,
        y: component.layout.y,
        w: component.layout.w,
        h: component.layout.h,
        minW: component.layout.minW,
        maxW: component.layout.maxW,
        minH: component.layout.minH,
        maxH: component.layout.maxH,
        static: component.layout.static || readOnly
      }));
    });
    
    return layoutMap;
  }, [components, gridConfig.breakpoints, readOnly]);

  // 处理拖拽放置
  const [{ isOver, canDrop }, drop] = useDrop<DragItem, DropResult, { isOver: boolean; canDrop: boolean }>({
    accept: 'component',
    drop: (item, monitor) => {
      if (!monitor.didDrop() && item.type === 'component' && item.template) {
        const offset = monitor.getClientOffset();
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        
        if (offset && canvasRect) {
          // 计算网格位置
          const x = Math.round((offset.x - canvasRect.left) / 100); // 假设每个网格单位100px
          const y = Math.round((offset.y - canvasRect.top) / 50);   // 假设每个网格单位50px
          
          // 创建新组件
          const newComponent: DashboardComponent = {
            id: `component_${Date.now()}`,
            type: item.template.type,
            title: item.template.name,
            description: item.template.description,
            layout: {
              x: Math.max(0, x),
              y: Math.max(0, y),
              w: item.template.defaultSize.w,
              h: item.template.defaultSize.h,
              minW: item.template.minSize?.w,
              maxW: item.template.maxSize?.w,
              minH: item.template.minSize?.h,
              maxH: item.template.maxSize?.h
            },
            config: item.template.defaultConfig || {},
            style: item.template.defaultStyle || {},
            visible: true,
            templateId: item.template.id
          };
          
          onComponentAdd(newComponent);
          onComponentSelect(newComponent.id);
        }
      }
      
      setDragItem(null);
      setDragPosition(null);
      
      return { success: true };
    },
    hover: (item, monitor) => {
      const offset = monitor.getClientOffset();
      if (offset) {
        setDragItem(item);
        setDragPosition({ x: offset.x, y: offset.y });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  // 处理布局变化
  const handleLayoutChange = useCallback((layout: Layout[], layouts: { [key: string]: Layout[] }) => {
    // 更新组件布局
    layout.forEach(layoutItem => {
      const component = components.find(c => c.id === layoutItem.i);
      if (component) {
        onComponentUpdate(component.id, {
          layout: {
            ...component.layout,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          }
        });
      }
    });
    
    onLayoutChange(layout, layouts);
  }, [components, onComponentUpdate, onLayoutChange]);

  // 处理画布点击
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onComponentSelect(null);
    }
  }, [onComponentSelect]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (selectedComponentId && !readOnly) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onComponentDelete(selectedComponentId);
        onComponentSelect(null);
      }
    }
  }, [selectedComponentId, readOnly, onComponentDelete, onComponentSelect]);

  return (
    <div
      ref={(node) => {
        canvasRef.current = node;
        drop(node);
      }}
      className={`designer-canvas ${className} ${isOver ? 'drag-over' : ''} ${canDrop ? 'can-drop' : ''}`}
      onClick={handleCanvasClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {showGrid && (
        <GridOverlay
          cols={gridConfig.cols.lg}
          rowHeight={gridConfig.rowHeight}
          margin={gridConfig.margin}
          containerPadding={gridConfig.containerPadding}
          width={800} // 假设画布宽度
          visible={showGrid}
        />
      )}
      
      <ResponsiveGridLayout
        className="grid-layout"
        layouts={layouts}
        breakpoints={gridConfig.breakpoints}
        cols={gridConfig.cols}
        rowHeight={gridConfig.rowHeight}
        margin={gridConfig.margin}
        containerPadding={gridConfig.containerPadding}
        onLayoutChange={handleLayoutChange}
        isDraggable={!readOnly}
        isResizable={!readOnly}
        useCSSTransforms={true}
        preventCollision={false}
        compactType="vertical"
        autoSize={true}
      >
        {components.map(component => (
          <div key={component.id} data-grid={component.layout}>
            <ComponentWrapper
              component={component}
              isSelected={selectedComponentId === component.id}
              onSelect={onComponentSelect}
              onUpdate={onComponentUpdate}
              readOnly={readOnly}
            />
          </div>
        ))}
      </ResponsiveGridLayout>
      
      <DropPreview
        dragItem={dragItem}
        position={dragPosition}
        gridConfig={gridConfig}
      />
      
      {components.length === 0 && (
        <div className="empty-canvas">
          <div className="empty-content">
            <div className="empty-icon">🎨</div>
            <div className="empty-title">开始设计你的仪表盘</div>
            <div className="empty-description">
              从左侧组件库拖拽组件到这里开始设计
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignerCanvas;