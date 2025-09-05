import { Layout } from 'react-grid-layout';

// 组件类型
export type ComponentType = 
  | 'line' 
  | 'bar' 
  | 'pie' 
  | 'scatter' 
  | 'area' 
  | 'number' 
  | 'table' 
  | 'text' 
  | 'image' 
  | 'iframe' 
  | 'container';

// 组件分类
export type ComponentCategory = 
  | 'chart' 
  | 'text' 
  | 'media' 
  | 'container' 
  | 'custom';

// 组件尺寸
export interface ComponentSize {
  w: number;
  h: number;
}

// 组件模板
export type ComponentTemplate = {
  id: string;
  name: string;
  category: ComponentCategory;
  type: ComponentType;
  icon?: string;
  preview?: string;
  description?: string;
  config: {
    defaultSize?: ComponentSize;
    minSize?: ComponentSize;
    maxSize?: ComponentSize;
    [key: string]: any;
  };
  isSystem?: boolean;
  isPublic?: boolean;
};

// 数据源接口
export interface DataSource {
  id: string;
  name: string;
  type: 'mysql' | 'postgresql' | 'mongodb' | 'api' | 'file';
  config: {
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    url?: string;
    [key: string]: any;
  };
  status: 'connected' | 'disconnected' | 'error';
  createdAt: string;
  updatedAt: string;
}

// 查询结果接口
export interface QueryResult {
  columns: string[];
  data: any[];
  total: number;
  error?: string;
}

// 仪表板组件
export interface DashboardComponent {
  id: string;
  type: ComponentType;
  title: string;
  config: {
    // 图表配置
    chartType?: string;
    xAxis?: string;
    yAxis?: string[];
    dataSource?: string;
    query?: string;
    
    // 文本配置
    content?: string;
    fontSize?: number;
    color?: string;
    
    // 数字配置
    value?: number;
    unit?: string;
    precision?: number;
    
    // 表格配置
    columns?: Array<{
      key: string;
      title: string;
      width?: number;
      align?: 'left' | 'center' | 'right';
    }>;
    
    // 其他配置
    [key: string]: any;
  };
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
  data?: any[];
  loading?: boolean;
  error?: string;
}

// 拖拽项目
export interface DragItem {
  id: string;
  type: string;
  template?: ComponentTemplate;
  component?: DashboardComponent;
}

// 仪表板布局
export interface DashboardLayout {
  layout: { [breakpoint: string]: Layout[] };
  components: DashboardComponent[];
  breakpoint: string;
  config: {
    title: string;
    theme: string;
    backgroundColor: string;
    padding: number;
    responsive: {
      enabled: boolean;
      breakpoints: BreakpointConfig;
      cols: ColsConfig;
    };
  };
}

// 断点配置
export interface BreakpointConfig {
  lg: number;
  md: number;
  sm: number;
  xs: number;
  xxs: number;
}

// 列配置
export interface ColsConfig {
  lg: number;
  md: number;
  sm: number;
  xs: number;
  xxs: number;
}

// 网格配置
export interface GridConfig {
  breakpoints: BreakpointConfig;
  cols: ColsConfig;
  rowHeight: number;
  margin: [number, number];
  containerPadding: [number, number];
  isDraggable: boolean;
  isResizable: boolean;
  isBounded: boolean;
  useCSSTransforms: boolean;
  preventCollision: boolean;
  autoSize: boolean;
  verticalCompact: boolean;
  compactType: 'vertical' | 'horizontal' | null;
}

// 默认网格配置
export const DEFAULT_GRID_CONFIG: GridConfig = {
  breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
  rowHeight: 60,
  margin: [10, 10],
  containerPadding: [10, 10],
  isDraggable: true,
  isResizable: true,
  isBounded: false,
  useCSSTransforms: true,
  preventCollision: false,
  autoSize: true,
  verticalCompact: true,
  compactType: 'vertical'
};

// 默认组件尺寸
export const DEFAULT_COMPONENT_SIZE: ComponentSize = {
  w: 4,
  h: 4
};

// 最小组件尺寸
export const MIN_COMPONENT_SIZE: ComponentSize = {
  w: 2,
  h: 2
};

// 最大组件尺寸
export const MAX_COMPONENT_SIZE: ComponentSize = {
  w: 12,
  h: 12
};

// 键盘快捷键
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
}

export interface KeyboardShortcuts {
  save: KeyboardShortcut;
  undo: KeyboardShortcut;
  redo: KeyboardShortcut;
  delete: KeyboardShortcut;
  copy: KeyboardShortcut;
  paste: KeyboardShortcut;
  selectAll: KeyboardShortcut;
  preview: KeyboardShortcut;
}

// 网格布局配置
export interface GridLayoutConfig {
  cols: number;
  rowHeight: number;
  margin: [number, number];
}