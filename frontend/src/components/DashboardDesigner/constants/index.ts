import type { ComponentTemplate, KeyboardShortcuts, ComponentSize, GridLayoutConfig } from '../types';

// 组件类型常量
export const COMPONENT_TYPES = {
  TEXT: 'text',
  CHART: 'chart',
  TABLE: 'table',
  METRIC: 'metric',
  IMAGE: 'image',
  CONTAINER: 'container',
  BUTTON: 'button',
  DIVIDER: 'divider',
} as const;

// 组件分类常量
export const COMPONENT_CATEGORIES = {
  BASIC: 'basic',
  CHART: 'chart',
  DATA: 'data',
  LAYOUT: 'layout',
  INTERACTION: 'interaction',
  MEDIA: 'media',
} as const;

// 图表类型常量
export const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  AREA: 'area',
  SCATTER: 'scatter',
  GAUGE: 'gauge',
  FUNNEL: 'funnel',
  RADAR: 'radar',
  HEATMAP: 'heatmap',
  TREEMAP: 'treemap',
} as const;

// 默认组件大小
export const DEFAULT_COMPONENT_SIZES: Record<string, ComponentSize> = {
  [COMPONENT_TYPES.TEXT]: { w: 4, h: 2 },
  [COMPONENT_TYPES.CHART]: { w: 6, h: 4 },
  [COMPONENT_TYPES.TABLE]: { w: 8, h: 6 },
  [COMPONENT_TYPES.METRIC]: { w: 3, h: 2 },
  [COMPONENT_TYPES.IMAGE]: { w: 4, h: 3 },
  [COMPONENT_TYPES.CONTAINER]: { w: 12, h: 8 },
  [COMPONENT_TYPES.BUTTON]: { w: 2, h: 1 },
  [COMPONENT_TYPES.DIVIDER]: { w: 12, h: 1 },
};

// 最小组件大小
export const MIN_COMPONENT_SIZES: Record<string, ComponentSize> = {
  [COMPONENT_TYPES.TEXT]: { w: 2, h: 1 },
  [COMPONENT_TYPES.CHART]: { w: 3, h: 2 },
  [COMPONENT_TYPES.TABLE]: { w: 4, h: 3 },
  [COMPONENT_TYPES.METRIC]: { w: 2, h: 1 },
  [COMPONENT_TYPES.IMAGE]: { w: 2, h: 2 },
  [COMPONENT_TYPES.CONTAINER]: { w: 4, h: 4 },
  [COMPONENT_TYPES.BUTTON]: { w: 1, h: 1 },
  [COMPONENT_TYPES.DIVIDER]: { w: 2, h: 1 },
};

// 最大组件大小
export const MAX_COMPONENT_SIZES: Record<string, ComponentSize> = {
  [COMPONENT_TYPES.TEXT]: { w: 12, h: 8 },
  [COMPONENT_TYPES.CHART]: { w: 12, h: 12 },
  [COMPONENT_TYPES.TABLE]: { w: 12, h: 12 },
  [COMPONENT_TYPES.METRIC]: { w: 6, h: 4 },
  [COMPONENT_TYPES.IMAGE]: { w: 12, h: 8 },
  [COMPONENT_TYPES.CONTAINER]: { w: 12, h: 12 },
  [COMPONENT_TYPES.BUTTON]: { w: 4, h: 2 },
  [COMPONENT_TYPES.DIVIDER]: { w: 12, h: 1 },
};

// 网格布局配置
export const GRID_CONFIGS: Record<string, GridLayoutConfig> = {
  lg: { cols: 12, rowHeight: 60, margin: [10, 10] },
  md: { cols: 10, rowHeight: 60, margin: [10, 10] },
  sm: { cols: 6, rowHeight: 60, margin: [10, 10] },
  xs: { cols: 4, rowHeight: 60, margin: [10, 10] },
  xxs: { cols: 2, rowHeight: 60, margin: [10, 10] },
};

// 断点配置
export const BREAKPOINTS = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0,
};

// 键盘快捷键
export const KEYBOARD_SHORTCUTS: KeyboardShortcuts = {
  save: { key: 's', ctrlKey: true, description: '保存' },
  undo: { key: 'z', ctrlKey: true, description: '撤销' },
  redo: { key: 'y', ctrlKey: true, description: '重做' },
  delete: { key: 'Delete', description: '删除选中组件' },
  copy: { key: 'c', ctrlKey: true, description: '复制' },
  paste: { key: 'v', ctrlKey: true, description: '粘贴' },
  selectAll: { key: 'a', ctrlKey: true, description: '全选' },
  preview: { key: 'p', ctrlKey: true, description: '预览' },
};

// 默认组件模板
export const DEFAULT_COMPONENT_TEMPLATES: ComponentTemplate[] = [
  {
    id: 'text-basic',
    name: '文本',
    type: 'text',
    category: 'text',
    icon: '📝',
    description: '基础文本组件',
    config: {
      defaultSize: DEFAULT_COMPONENT_SIZES[COMPONENT_TYPES.TEXT],
      minSize: MIN_COMPONENT_SIZES[COMPONENT_TYPES.TEXT],
      maxSize: MAX_COMPONENT_SIZES[COMPONENT_TYPES.TEXT],
      content: '这是一个文本组件',
      fontSize: 14,
      fontWeight: 'normal',
      textAlign: 'left',
      color: '#333333',
      padding: '12px',
      backgroundColor: 'transparent',
    },
    isSystem: true,
    isPublic: true,
  },
  {
    id: 'chart-line',
    name: '折线图',
    type: 'line',
    category: 'chart',
    icon: '📈',
    description: '折线图表组件',
    config: {
      defaultSize: DEFAULT_COMPONENT_SIZES[COMPONENT_TYPES.CHART],
      minSize: MIN_COMPONENT_SIZES[COMPONENT_TYPES.CHART],
      maxSize: MAX_COMPONENT_SIZES[COMPONENT_TYPES.CHART],
      chartType: CHART_TYPES.LINE,
      title: '折线图',
      xAxis: { title: 'X轴', type: 'category' },
      yAxis: { title: 'Y轴', type: 'value' },
      series: [{
        name: '系列1',
        data: [10, 20, 30, 40, 50],
        color: '#007bff',
      }],
      backgroundColor: '#ffffff',
      border: '1px solid #e9ecef',
      borderRadius: '8px',
      padding: '16px',
    },
    isSystem: true,
    isPublic: true,
  },
  {
    id: 'chart-bar',
    name: '柱状图',
    type: 'bar',
    category: 'chart',
    icon: '📊',
    description: '柱状图表组件',
    config: {
      defaultSize: DEFAULT_COMPONENT_SIZES[COMPONENT_TYPES.CHART],
      minSize: MIN_COMPONENT_SIZES[COMPONENT_TYPES.CHART],
      maxSize: MAX_COMPONENT_SIZES[COMPONENT_TYPES.CHART],
      chartType: CHART_TYPES.BAR,
      title: '柱状图',
      xAxis: { title: 'X轴', type: 'category' },
      yAxis: { title: 'Y轴', type: 'value' },
      series: [{
        name: '系列1',
        data: [10, 20, 30, 40, 50],
        color: '#28a745',
      }],
      backgroundColor: '#ffffff',
      border: '1px solid #e9ecef',
      borderRadius: '8px',
      padding: '16px',
    },
    isSystem: true,
    isPublic: true,
  },
  {
    id: 'chart-pie',
    name: '饼图',
    type: 'pie',
    category: 'chart',
    icon: '🥧',
    description: '饼图表组件',
    config: {
      defaultSize: DEFAULT_COMPONENT_SIZES[COMPONENT_TYPES.CHART],
      minSize: MIN_COMPONENT_SIZES[COMPONENT_TYPES.CHART],
      maxSize: MAX_COMPONENT_SIZES[COMPONENT_TYPES.CHART],
      chartType: CHART_TYPES.PIE,
      title: '饼图',
      series: [{
        name: '数据',
        data: [
          { name: '类别A', value: 30 },
          { name: '类别B', value: 25 },
          { name: '类别C', value: 20 },
          { name: '类别D', value: 15 },
          { name: '类别E', value: 10 },
        ],
      }],
      backgroundColor: '#ffffff',
      border: '1px solid #e9ecef',
      borderRadius: '8px',
      padding: '16px',
    },
    isSystem: true,
    isPublic: true,
  },
  {
    id: 'table-basic',
    name: '数据表格',
    type: 'table',
    category: 'container',
    icon: '📋',
    description: '数据表格组件',
    config: {
      defaultSize: DEFAULT_COMPONENT_SIZES[COMPONENT_TYPES.TABLE],
      minSize: MIN_COMPONENT_SIZES[COMPONENT_TYPES.TABLE],
      maxSize: MAX_COMPONENT_SIZES[COMPONENT_TYPES.TABLE],
      columns: [
        { key: 'name', title: '姓名', width: 120 },
        { key: 'age', title: '年龄', width: 80 },
        { key: 'city', title: '城市', width: 120 },
      ],
      data: [
        { name: '张三', age: 25, city: '北京' },
        { name: '李四', age: 30, city: '上海' },
        { name: '王五', age: 28, city: '广州' },
      ],
      pagination: true,
      pageSize: 10,
      backgroundColor: '#ffffff',
      border: '1px solid #e9ecef',
      borderRadius: '8px',
    },
    isSystem: true,
    isPublic: true,
  },
  {
    id: 'metric-basic',
    name: '指标卡片',
    type: 'number',
    category: 'chart',
    icon: '📊',
    description: '指标展示组件',
    config: {
      defaultSize: DEFAULT_COMPONENT_SIZES[COMPONENT_TYPES.METRIC],
      minSize: MIN_COMPONENT_SIZES[COMPONENT_TYPES.METRIC],
      maxSize: MAX_COMPONENT_SIZES[COMPONENT_TYPES.METRIC],
      title: '总销售额',
      value: '¥1,234,567',
      unit: '元',
      trend: 'up',
      trendValue: '+12.5%',
      icon: '💰',
      backgroundColor: '#ffffff',
      border: '1px solid #e9ecef',
      borderRadius: '8px',
      padding: '16px',
      textAlign: 'center',
    },
    isSystem: true,
    isPublic: true,
  },
  {
    id: 'image-basic',
    name: '图片',
    type: 'image',
    category: 'media',
    icon: '🖼️',
    description: '图片展示组件',
    config: {
      defaultSize: DEFAULT_COMPONENT_SIZES[COMPONENT_TYPES.IMAGE],
      minSize: MIN_COMPONENT_SIZES[COMPONENT_TYPES.IMAGE],
      maxSize: MAX_COMPONENT_SIZES[COMPONENT_TYPES.IMAGE],
      src: 'https://via.placeholder.com/400x300',
      alt: '示例图片',
      fit: 'cover',
      borderRadius: '8px',
      overflow: 'hidden',
    },
    isSystem: true,
    isPublic: true,
  },
  {
    id: 'container-basic',
    name: '容器',
    type: 'container',
    category: 'container',
    icon: '📦',
    description: '布局容器组件',
    config: {
      defaultSize: DEFAULT_COMPONENT_SIZES[COMPONENT_TYPES.CONTAINER],
      minSize: MIN_COMPONENT_SIZES[COMPONENT_TYPES.CONTAINER],
      maxSize: MAX_COMPONENT_SIZES[COMPONENT_TYPES.CONTAINER],
      title: '容器标题',
      showTitle: true,
      collapsible: false,
      collapsed: false,
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '16px',
    },
    isSystem: true,
    isPublic: true,
  },
  {
    id: 'button-basic',
    name: '按钮',
    type: 'container',
    category: 'container',
    icon: '🔘',
    description: '交互按钮组件',
    config: {
      defaultSize: DEFAULT_COMPONENT_SIZES[COMPONENT_TYPES.BUTTON],
      minSize: MIN_COMPONENT_SIZES[COMPONENT_TYPES.BUTTON],
      maxSize: MAX_COMPONENT_SIZES[COMPONENT_TYPES.BUTTON],
      text: '点击按钮',
      type: 'primary',
      size: 'medium',
      disabled: false,
      action: 'none',
      backgroundColor: '#007bff',
      color: '#ffffff',
      border: 'none',
      borderRadius: '6px',
      padding: '8px 16px',
      cursor: 'pointer',
    },
    isSystem: true,
    isPublic: true,
  },
  {
    id: 'divider-basic',
    name: '分隔符',
    type: 'container',
    category: 'container',
    icon: '➖',
    description: '分隔线组件',
    config: {
      defaultSize: DEFAULT_COMPONENT_SIZES[COMPONENT_TYPES.DIVIDER],
      minSize: MIN_COMPONENT_SIZES[COMPONENT_TYPES.DIVIDER],
      maxSize: MAX_COMPONENT_SIZES[COMPONENT_TYPES.DIVIDER],
      orientation: 'horizontal',
      style: 'solid',
      thickness: 1,
      color: '#dee2e6',
      margin: '8px 0',
    },
    isSystem: true,
    isPublic: true,
  },
];

// 颜色主题
export const COLOR_THEMES = {
  default: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
  },
  blue: {
    primary: '#007bff',
    secondary: '#0056b3',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#e3f2fd',
    dark: '#1565c0',
  },
  green: {
    primary: '#28a745',
    secondary: '#1e7e34',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#e8f5e8',
    dark: '#155724',
  },
  purple: {
    primary: '#6f42c1',
    secondary: '#5a32a3',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f3e5f5',
    dark: '#4a148c',
  },
};

// 图表颜色调色板
export const CHART_COLOR_PALETTES = {
  default: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1', '#fd7e14', '#20c997'],
  blue: ['#007bff', '#0056b3', '#004085', '#002752', '#6cb2eb', '#4dabf7', '#339af0', '#228be6'],
  green: ['#28a745', '#20c997', '#1e7e34', '#155724', '#51cf66', '#40c057', '#37b24d', '#2f9e44'],
  warm: ['#fd7e14', '#ffc107', '#dc3545', '#e83e8c', '#ff6b6b', '#ffa726', '#ff7043', '#ab47bc'],
  cool: ['#17a2b8', '#6f42c1', '#007bff', '#6610f2', '#26c6da', '#42a5f5', '#5c6bc0', '#7e57c2'],
};

// 动画配置
export const ANIMATION_CONFIG = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    linear: 'linear',
  },
};

// 自动保存配置
export const AUTO_SAVE_CONFIG = {
  enabled: true,
  interval: 30000, // 30秒
  maxRetries: 3,
  retryDelay: 1000, // 1秒
};

// 历史记录配置
export const HISTORY_CONFIG = {
  maxSize: 50,
  debounceDelay: 500, // 500毫秒
};

// 拖拽配置
export const DRAG_CONFIG = {
  dragThreshold: 5, // 像素
  snapToGrid: true,
  snapThreshold: 10, // 像素
};

// 缩放配置
export const ZOOM_CONFIG = {
  min: 0.25,
  max: 2,
  step: 0.25,
  default: 1,
};

// 导出格式
export const EXPORT_FORMATS = {
  JSON: 'json',
  PDF: 'pdf',
  PNG: 'png',
  SVG: 'svg',
} as const;

// 数据刷新间隔选项
export const REFRESH_INTERVALS = [
  { label: '不刷新', value: 0 },
  { label: '5秒', value: 5000 },
  { label: '10秒', value: 10000 },
  { label: '30秒', value: 30000 },
  { label: '1分钟', value: 60000 },
  { label: '5分钟', value: 300000 },
  { label: '10分钟', value: 600000 },
  { label: '30分钟', value: 1800000 },
  { label: '1小时', value: 3600000 },
];

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接错误，请检查网络设置',
  UNAUTHORIZED: '未授权访问，请重新登录',
  FORBIDDEN: '权限不足，无法执行此操作',
  NOT_FOUND: '请求的资源不存在',
  SERVER_ERROR: '服务器内部错误，请稍后重试',
  VALIDATION_ERROR: '数据验证失败，请检查输入',
  SAVE_FAILED: '保存失败，请重试',
  LOAD_FAILED: '加载失败，请刷新页面',
  DELETE_FAILED: '删除失败，请重试',
  EXPORT_FAILED: '导出失败，请重试',
  IMPORT_FAILED: '导入失败，请检查文件格式',
};

// 成功消息
export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: '保存成功',
  DELETE_SUCCESS: '删除成功',
  EXPORT_SUCCESS: '导出成功',
  IMPORT_SUCCESS: '导入成功',
  COPY_SUCCESS: '复制成功',
  PASTE_SUCCESS: '粘贴成功',
};

// 确认消息
export const CONFIRM_MESSAGES = {
  DELETE_COMPONENT: '确定要删除这个组件吗？',
  DELETE_DASHBOARD: '确定要删除这个仪表盘吗？',
  CLEAR_CANVAS: '确定要清空画布吗？这将删除所有组件。',
  DISCARD_CHANGES: '有未保存的更改，确定要离开吗？',
  RESET_LAYOUT: '确定要重置布局吗？这将恢复到默认设置。',
};