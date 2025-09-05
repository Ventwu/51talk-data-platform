import type { ComponentTemplate } from '../types';
import type { DashboardComponent, DashboardLayout, GridLayoutConfig } from '../types';

/**
 * 生成唯一ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 生成组件ID
 */
export const generateComponentId = (type: string): string => {
  return `${type}-${generateId()}`;
};

/**
 * 深度克隆对象
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T;
    Object.keys(obj).forEach(key => {
      (cloned as any)[key] = deepClone((obj as any)[key]);
    });
    return cloned;
  }
  
  return obj;
};

/**
 * 检查两个对象是否相等
 */
export const isEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  
  if (a == null || b == null) return a === b;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!isEqual(a[key], b[key])) return false;
  }
  
  return true;
};

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * 节流函数
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), wait);
    }
  };
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 格式化日期
 */
export const formatDate = (date: Date | string | number, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  const d = new Date(date);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year.toString())
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * 验证组件配置
 */
export const validateComponent = (component: DashboardComponent): string[] => {
  const errors: string[] = [];
  
  if (!component.id) {
    errors.push('组件ID不能为空');
  }
  
  if (!component.type) {
    errors.push('组件类型不能为空');
  }
  
  if (!component.layout) {
    errors.push('组件布局不能为空');
  } else {
    if (component.layout.w <= 0) {
      errors.push('组件宽度必须大于0');
    }
    if (component.layout.h <= 0) {
      errors.push('组件高度必须大于0');
    }
    if (component.layout.x < 0) {
      errors.push('组件X坐标不能小于0');
    }
    if (component.layout.y < 0) {
      errors.push('组件Y坐标不能小于0');
    }
  }
  
  return errors;
};

/**
 * 验证布局配置
 */
export const validateLayout = (layout: DashboardLayout): string[] => {
  const errors: string[] = [];
  
  if (!layout.components || !Array.isArray(layout.components)) {
    errors.push('布局组件列表不能为空');
  } else {
    layout.components.forEach((component, index) => {
      const componentErrors = validateComponent(component);
      componentErrors.forEach(error => {
        errors.push(`组件${index + 1}: ${error}`);
      });
    });
    
    // 检查组件ID重复
    const ids = layout.components.map(c => c.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`存在重复的组件ID: ${duplicateIds.join(', ')}`);
    }
  }
  
  return errors;
};

/**
 * 检查组件是否重叠
 */
export const checkComponentOverlap = (
  component1: DashboardComponent,
  component2: DashboardComponent
): boolean => {
  const { x: x1, y: y1, w: w1, h: h1 } = component1.layout;
  const { x: x2, y: y2, w: w2, h: h2 } = component2.layout;
  
  return !(x1 + w1 <= x2 || x2 + w2 <= x1 || y1 + h1 <= y2 || y2 + h2 <= y1);
};

/**
 * 查找布局中的重叠组件
 */
export const findOverlappingComponents = (layout: DashboardLayout): string[][] => {
  const overlaps: string[][] = [];
  const components = layout.components;
  
  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      if (checkComponentOverlap(components[i], components[j])) {
        overlaps.push([components[i].id, components[j].id]);
      }
    }
  }
  
  return overlaps;
};

/**
 * 自动调整组件位置避免重叠
 */
export const autoAdjustLayout = (layout: DashboardLayout, cols = 12): DashboardLayout => {
  const adjustedLayout = deepClone(layout);
  const components = adjustedLayout.components;
  
  // 按Y坐标排序
  components.sort((a, b) => a.layout.y - b.layout.y || a.layout.x - b.layout.x);
  
  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    let placed = false;
    
    // 尝试在当前行放置
    for (let x = 0; x <= cols - component.layout.w; x++) {
      component.layout.x = x;
      
      // 检查是否与之前的组件重叠
      let hasOverlap = false;
      for (let j = 0; j < i; j++) {
        if (checkComponentOverlap(component, components[j])) {
          hasOverlap = true;
          break;
        }
      }
      
      if (!hasOverlap) {
        placed = true;
        break;
      }
    }
    
    // 如果当前行无法放置，移到下一行
    if (!placed) {
      component.layout.x = 0;
      
      // 找到最低的Y坐标
      let maxY = 0;
      for (let j = 0; j < i; j++) {
        const otherComponent = components[j];
        maxY = Math.max(maxY, otherComponent.layout.y + otherComponent.layout.h);
      }
      
      component.layout.y = maxY;
    }
  }
  
  return adjustedLayout;
};

/**
 * 计算布局的边界框
 */
export const getLayoutBounds = (layout: DashboardLayout) => {
  if (!layout.components || layout.components.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  layout.components.forEach(component => {
    const { x, y, w, h } = component.layout;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  });
  
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
};

/**
 * 压缩布局（移除空白区域）
 */
export const compactLayout = (layout: DashboardLayout): DashboardLayout => {
  const compactedLayout = deepClone(layout);
  const components = compactedLayout.components;
  
  if (components.length === 0) return compactedLayout;
  
  // 按Y坐标排序
  components.sort((a, b) => a.layout.y - b.layout.y || a.layout.x - b.layout.x);
  
  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    
    // 尝试向上移动组件
    let newY = 0;
    
    // 检查与之前组件的碰撞
    for (let j = 0; j < i; j++) {
      const otherComponent = components[j];
      
      // 如果X坐标有重叠
      if (!(component.layout.x + component.layout.w <= otherComponent.layout.x || 
            otherComponent.layout.x + otherComponent.layout.w <= component.layout.x)) {
        newY = Math.max(newY, otherComponent.layout.y + otherComponent.layout.h);
      }
    }
    
    component.layout.y = newY;
  }
  
  return compactedLayout;
};

/**
 * 从模板创建组件
 */
export const createComponentFromTemplate = (
  template: ComponentTemplate,
  position?: { x: number; y: number }
): DashboardComponent => {
  const id = generateComponentId(template.type);
  
  return {
    id,
    type: template.type,
    title: template.title,
    layout: {
      x: position?.x ?? 0,
      y: position?.y ?? 0,
      w: template.defaultSize.w,
      h: template.defaultSize.h,
      minW: template.minSize?.w ?? 1,
      minH: template.minSize?.h ?? 1,
      maxW: template.maxSize?.w,
      maxH: template.maxSize?.h
    },
    config: deepClone(template.defaultConfig || {}),
    style: deepClone(template.defaultStyle || {}),
    data: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

/**
 * 导出布局为JSON
 */
export const exportLayoutToJson = (layout: DashboardLayout): string => {
  return JSON.stringify(layout, null, 2);
};

/**
 * 从JSON导入布局
 */
export const importLayoutFromJson = (json: string): DashboardLayout => {
  try {
    const layout = JSON.parse(json) as DashboardLayout;
    
    // 验证布局
    const errors = validateLayout(layout);
    if (errors.length > 0) {
      throw new Error(`布局验证失败: ${errors.join(', ')}`);
    }
    
    return layout;
  } catch (error) {
    throw new Error(`导入布局失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

/**
 * 获取网格配置
 */
export const getGridConfig = (breakpoint: string): GridLayoutConfig => {
  const configs: Record<string, GridLayoutConfig> = {
    lg: { cols: 12, rowHeight: 60, margin: [10, 10] },
    md: { cols: 10, rowHeight: 60, margin: [10, 10] },
    sm: { cols: 6, rowHeight: 60, margin: [10, 10] },
    xs: { cols: 4, rowHeight: 60, margin: [10, 10] },
    xxs: { cols: 2, rowHeight: 60, margin: [10, 10] }
  };
  
  return configs[breakpoint] || configs.lg;
};

/**
 * 获取响应式断点
 */
export const getBreakpoint = (width: number): string => {
  if (width >= 1200) return 'lg';
  if (width >= 996) return 'md';
  if (width >= 768) return 'sm';
  if (width >= 480) return 'xs';
  return 'xxs';
};

/**
 * 转换布局到不同断点
 */
export const convertLayoutToBreakpoint = (
  layout: DashboardLayout,
  fromBreakpoint: string,
  toBreakpoint: string
): DashboardLayout => {
  const fromConfig = getGridConfig(fromBreakpoint);
  const toConfig = getGridConfig(toBreakpoint);
  
  const ratio = toConfig.cols / fromConfig.cols;
  
  const convertedLayout = deepClone(layout);
  
  convertedLayout.components.forEach(component => {
    component.layout.x = Math.round(component.layout.x * ratio);
    component.layout.w = Math.round(component.layout.w * ratio);
    
    // 确保组件不超出边界
    if (component.layout.x + component.layout.w > toConfig.cols) {
      component.layout.w = toConfig.cols - component.layout.x;
    }
    
    // 确保最小尺寸
    component.layout.w = Math.max(component.layout.w, component.layout.minW || 1);
  });
  
  return convertedLayout;
};

/**
 * 计算组件的实际像素尺寸
 */
export const calculateComponentPixelSize = (
  component: DashboardComponent,
  containerWidth: number,
  gridConfig: GridLayoutConfig
) => {
  const { cols, margin } = gridConfig;
  const colWidth = (containerWidth - margin[0] * (cols - 1)) / cols;
  
  const width = component.layout.w * colWidth + (component.layout.w - 1) * margin[0];
  const height = component.layout.h * gridConfig.rowHeight + (component.layout.h - 1) * margin[1];
  
  return { width, height };
};

/**
 * 检查浏览器支持
 */
export const checkBrowserSupport = () => {
  const support = {
    flexbox: CSS.supports('display', 'flex'),
    grid: CSS.supports('display', 'grid'),
    customProperties: CSS.supports('--test', 'test'),
    dragAndDrop: 'draggable' in document.createElement('div'),
    localStorage: (() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    })()
  };
  
  return support;
};

/**
 * 获取设备信息
 */
export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  
  return {
    isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
    isTablet: /iPad|Android(?!.*Mobile)/i.test(userAgent),
    isDesktop: !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    pixelRatio: window.devicePixelRatio || 1,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight
  };
};