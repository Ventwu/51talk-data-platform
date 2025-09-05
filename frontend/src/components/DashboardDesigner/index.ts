// 主组件
export { default as DashboardDesigner } from './DashboardDesigner';
export type { DashboardDesignerProps, DashboardDesignerState } from './DashboardDesigner';

// 子组件
export { ComponentPalette } from './components/ComponentPalette';
export { PropertyPanel } from './components/PropertyPanel';
export { DesignerCanvas } from './components/DesignerCanvas';
export { DesignerToolbar } from './components/DesignerToolbar';
export { ComponentRenderer } from './components/ComponentRenderer';

// Hooks
export { useDashboardDesigner } from './hooks/useDashboardDesigner';
export { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// 类型定义
export type {
  // 核心类型
  ComponentType,
  ComponentCategory,
  ComponentSize,
  ComponentTemplate,
  DashboardComponent,
  DashboardLayout,
  DataSource,
  QueryResult,
  
  // 配置类型
  BreakpointConfig,
  ColsConfig,
  GridConfig,
  GridLayoutConfig,
  KeyboardShortcut,
  KeyboardShortcuts,
} from './types';

// 常量
export {
  // 组件类型常量
  COMPONENT_TYPES,
  COMPONENT_CATEGORIES,
  CHART_TYPES,
  
  // 默认配置
  DEFAULT_COMPONENT_SIZES,
  MIN_COMPONENT_SIZES,
  MAX_COMPONENT_SIZES,
  GRID_CONFIGS,
  BREAKPOINTS,
  KEYBOARD_SHORTCUTS,
  DEFAULT_COMPONENT_TEMPLATES,
  
  // 主题和颜色
  COLOR_THEMES,
  CHART_COLOR_PALETTES,
  
  // 其他配置
  ANIMATION_CONFIG,
  AUTO_SAVE_CONFIG,
  HISTORY_CONFIG,
  DRAG_CONFIG,
  ZOOM_CONFIG,
  EXPORT_FORMATS,
  REFRESH_INTERVALS,
  
  // 消息常量
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  CONFIRM_MESSAGES,
} from './constants/index';

// 工具函数
export {
  // 基础工具
  generateId,
  deepClone,
  isEqual,
  debounce,
  throttle,
  formatFileSize,
  formatDate,
  
  // 验证工具
  validateComponent,
  validateLayout,
  
  // 布局工具
  checkComponentOverlap,
  autoAdjustLayout,
  calculateLayoutBounds,
  compactLayout,
  
  // 组件工具
  createComponentFromTemplate,
  
  // 导入导出工具
  exportLayout,
  importLayout,
  
  // 响应式工具
  getGridConfig,
  getResponsiveBreakpoint,
  transformLayoutForBreakpoint,
  calculateComponentPixelSize,
  
  // 浏览器工具
  checkBrowserSupport,
  getDeviceInfo,
} from './utils';

// API服务
export {
  // 通用请求
  request,
  
  // 仪表盘API
  dashboardApi,
  
  // 组件模板API
  templateApi,
  
  // 数据源API
  dataSourceApi,
  
  // 图表数据API
  chartDataApi,
  
  // 用户权限API
  userPermissionApi,
  
  // 导出导入API
  exportImportApi,
  
  // 系统API
  systemApi,
  
  // WebSocket连接
  createWebSocketConnection,
} from './services/api';

// 默认导出主组件
export { default } from './DashboardDesigner';