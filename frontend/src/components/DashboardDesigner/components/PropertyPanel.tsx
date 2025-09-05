import React, { useState, useCallback, useMemo } from 'react';
import type { DashboardComponent, DataSource } from '../types';
import './PropertyPanel.css';

interface PropertyPanelProps {
  selectedComponent: DashboardComponent | null;
  onComponentUpdate: (componentId: string, updates: Partial<DashboardComponent>) => void;
  onComponentDelete?: (componentId: string) => void;
  onComponentDuplicate?: (componentId: string) => void;
  onDataConnectionToggle?: () => void;
  availableDataSources?: DataSource[];
  className?: string;
}

// 属性分组
interface PropertyGroup {
  key: string;
  title: string;
  icon?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

const PROPERTY_GROUPS: PropertyGroup[] = [
  { key: 'basic', title: '基础属性', icon: '⚙️', collapsible: true },
  { key: 'layout', title: '布局设置', icon: '📐', collapsible: true },
  { key: 'style', title: '样式设置', icon: '🎨', collapsible: true },
  { key: 'data', title: '数据配置', icon: '📊', collapsible: true },
  { key: 'interaction', title: '交互设置', icon: '🖱️', collapsible: true, defaultCollapsed: true },
  { key: 'advanced', title: '高级设置', icon: '🔧', collapsible: true, defaultCollapsed: true }
];

// 表单控件类型
type FormControlType = 'input' | 'textarea' | 'select' | 'number' | 'color' | 'switch' | 'slider' | 'checkbox';

interface FormControlProps {
  type: FormControlType;
  label: string;
  value: any;
  onChange: (value: any) => void;
  options?: Array<{ label: string; value: any }>;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  description?: string;
}

// 通用表单控件
const FormControl: React.FC<FormControlProps> = ({
  type,
  label,
  value,
  onChange,
  options = [],
  min,
  max,
  step = 1,
  placeholder,
  disabled = false,
  description
}) => {
  const renderControl = () => {
    switch (type) {
      case 'input':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="form-input"
          />
        );
      
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="form-textarea"
            rows={3}
          />
        );
      
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="form-select"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value || 0}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="form-number"
          />
        );
      
      case 'color':
        return (
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="form-color"
          />
        );
      
      case 'switch':
        return (
          <label className="form-switch">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
            />
            <span className="switch-slider"></span>
          </label>
        );
      
      case 'slider':
        return (
          <div className="form-slider-container">
            <input
              type="range"
              value={value || 0}
              onChange={(e) => onChange(Number(e.target.value))}
              min={min || 0}
              max={max || 100}
              step={step}
              disabled={disabled}
              className="form-slider"
            />
            <span className="slider-value">{value}</span>
          </div>
        );
      
      case 'checkbox':
        return (
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
            />
            <span className="checkbox-mark"></span>
          </label>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="form-control">
      <div className="control-header">
        <label className="control-label">{label}</label>
        {description && (
          <span className="control-description" title={description}>
            ℹ️
          </span>
        )}
      </div>
      <div className="control-input">
        {renderControl()}
      </div>
    </div>
  );
};

// 属性分组组件
interface PropertyGroupComponentProps {
  group: PropertyGroup;
  children: React.ReactNode;
  collapsed?: boolean;
  onToggleCollapse?: (groupKey: string) => void;
}

const PropertyGroupComponent: React.FC<PropertyGroupComponentProps> = ({
  group,
  children,
  collapsed = false,
  onToggleCollapse
}) => {
  const handleToggle = () => {
    if (group.collapsible) {
      onToggleCollapse?.(group.key);
    }
  };

  return (
    <div className={`property-group ${collapsed ? 'collapsed' : ''}`}>
      <div 
        className={`group-header ${group.collapsible ? 'collapsible' : ''}`}
        onClick={handleToggle}
      >
        {group.icon && <span className="group-icon">{group.icon}</span>}
        <span className="group-title">{group.title}</span>
        {group.collapsible && (
          <span className="collapse-icon">
            {collapsed ? '▶' : '▼'}
          </span>
        )}
      </div>
      {!collapsed && (
        <div className="group-content">
          {children}
        </div>
      )}
    </div>
  );
};

// 主组件
export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedComponent,
  onComponentUpdate,
  onComponentDelete,
  onComponentDuplicate,
  onDataConnectionToggle,
  availableDataSources,
  className = ''
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(PROPERTY_GROUPS.filter(g => g.defaultCollapsed).map(g => g.key))
  );

  // 切换分组折叠状态
  const handleToggleCollapse = useCallback((groupKey: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);

  // 更新组件属性
  const handlePropertyChange = useCallback((property: string, value: any) => {
    if (!selectedComponent) return;
    
    const updates: Partial<DashboardComponent> = {};
    
    // 处理嵌套属性
    if (property.includes('.')) {
      const [parent, child] = property.split('.');
      updates[parent as keyof DashboardComponent] = {
        ...selectedComponent[parent as keyof DashboardComponent],
        [child]: value
      } as any;
    } else {
      updates[property as keyof DashboardComponent] = value;
    }
    
    onComponentUpdate(selectedComponent.id, updates);
  }, [selectedComponent, onComponentUpdate]);

  // 组件操作
  const handleDelete = () => {
    if (selectedComponent && onComponentDelete) {
      onComponentDelete(selectedComponent.id);
    }
  };

  const handleDuplicate = () => {
    if (selectedComponent && onComponentDuplicate) {
      onComponentDuplicate(selectedComponent.id);
    }
  };

  // 渲染基础属性
  const renderBasicProperties = () => {
    if (!selectedComponent) return null;

    return (
      <>
        <FormControl
          type="input"
          label="组件名称"
          value={selectedComponent.title}
          onChange={(value) => handlePropertyChange('title', value)}
          placeholder="请输入组件名称"
        />
        <FormControl
          type="textarea"
          label="组件描述"
          value={selectedComponent.description}
          onChange={(value) => handlePropertyChange('description', value)}
          placeholder="请输入组件描述"
        />
        <FormControl
          type="switch"
          label="显示组件"
          value={selectedComponent.visible !== false}
          onChange={(value) => handlePropertyChange('visible', value)}
        />
      </>
    );
  };

  // 渲染布局属性
  const renderLayoutProperties = () => {
    if (!selectedComponent) return null;

    return (
      <>
        <FormControl
          type="number"
          label="宽度"
          value={selectedComponent.layout.w}
          onChange={(value) => handlePropertyChange('layout.w', value)}
          min={1}
          max={12}
        />
        <FormControl
          type="number"
          label="高度"
          value={selectedComponent.layout.h}
          onChange={(value) => handlePropertyChange('layout.h', value)}
          min={1}
        />
        <FormControl
          type="number"
          label="X坐标"
          value={selectedComponent.layout.x}
          onChange={(value) => handlePropertyChange('layout.x', value)}
          min={0}
        />
        <FormControl
          type="number"
          label="Y坐标"
          value={selectedComponent.layout.y}
          onChange={(value) => handlePropertyChange('layout.y', value)}
          min={0}
        />
      </>
    );
  };

  // 渲染样式属性
  const renderStyleProperties = () => {
    if (!selectedComponent) return null;

    const style = selectedComponent.style || {};

    return (
      <>
        <FormControl
          type="color"
          label="背景颜色"
          value={style.backgroundColor}
          onChange={(value) => handlePropertyChange('style.backgroundColor', value)}
        />
        <FormControl
          type="color"
          label="边框颜色"
          value={style.borderColor}
          onChange={(value) => handlePropertyChange('style.borderColor', value)}
        />
        <FormControl
          type="number"
          label="边框宽度"
          value={style.borderWidth || 0}
          onChange={(value) => handlePropertyChange('style.borderWidth', value)}
          min={0}
          max={10}
        />
        <FormControl
          type="slider"
          label="圆角半径"
          value={style.borderRadius || 0}
          onChange={(value) => handlePropertyChange('style.borderRadius', value)}
          min={0}
          max={20}
        />
        <FormControl
          type="slider"
          label="透明度"
          value={style.opacity || 1}
          onChange={(value) => handlePropertyChange('style.opacity', value)}
          min={0}
          max={1}
          step={0.1}
        />
      </>
    );
  };

  // 渲染数据配置属性
  const renderDataProperties = () => {
    if (!selectedComponent) return null;

    const config = selectedComponent.config || {};
    const dataSource = config.dataSource || {};

    return (
      <>
        <FormControl
          type="select"
          label="数据源"
          value={dataSource.id || ''}
          onChange={(value) => handlePropertyChange('config.dataSource.id', value)}
          options={[
            { label: '请选择数据源', value: '' },
            ...(availableDataSources || []).map(ds => ({
              label: ds.name,
              value: ds.id
            }))
          ]}
        />
        
        {dataSource.id && (
          <>
            <FormControl
              type="textarea"
              label="查询语句"
              value={dataSource.query || ''}
              onChange={(value) => handlePropertyChange('config.dataSource.query', value)}
              placeholder="SELECT * FROM table_name"
            />
            <FormControl
              type="number"
              label="刷新间隔(秒)"
              value={dataSource.refreshInterval || 0}
              onChange={(value) => handlePropertyChange('config.dataSource.refreshInterval', value)}
              min={0}
              placeholder="0表示不自动刷新"
            />
          </>
        )}
        
        {!dataSource.id && onDataConnectionToggle && (
          <div className="data-connection-hint">
            <p>还没有配置数据源？</p>
            <button 
              type="button" 
              className="btn-link"
              onClick={onDataConnectionToggle}
            >
              点击配置数据连接
            </button>
          </div>
        )}
      </>
    );
  };

  // 渲染图表配置属性
  const renderChartProperties = () => {
    if (!selectedComponent || selectedComponent.type !== 'chart') return null;

    const config = selectedComponent.config || {};

    return (
      <>
        <FormControl
          type="select"
          label="图表类型"
          value={config.chartType || 'line'}
          onChange={(value) => handlePropertyChange('config.chartType', value)}
          options={[
            { label: '折线图', value: 'line' },
            { label: '柱状图', value: 'bar' },
            { label: '饼图', value: 'pie' },
            { label: '散点图', value: 'scatter' },
            { label: '面积图', value: 'area' },
            { label: '仪表盘', value: 'gauge' },
            { label: '漏斗图', value: 'funnel' },
            { label: '雷达图', value: 'radar' },
            { label: '热力图', value: 'heatmap' }
          ]}
        />
        
        <FormControl
          type="switch"
          label="显示图例"
          value={config.showLegend !== false}
          onChange={(value) => handlePropertyChange('config.showLegend', value)}
        />
        
        <FormControl
          type="switch"
          label="显示工具提示"
          value={config.showTooltip !== false}
          onChange={(value) => handlePropertyChange('config.showTooltip', value)}
        />
        
        <FormControl
          type="switch"
          label="启用动画"
          value={config.enableAnimation !== false}
          onChange={(value) => handlePropertyChange('config.enableAnimation', value)}
        />
        
        {(config.chartType === 'line' || config.chartType === 'area') && (
          <FormControl
            type="switch"
            label="平滑曲线"
            value={config.smooth || false}
            onChange={(value) => handlePropertyChange('config.smooth', value)}
          />
        )}
        
        {config.chartType === 'pie' && (
          <>
            <FormControl
              type="slider"
              label="饼图半径"
              value={config.pieRadius || 50}
              onChange={(value) => handlePropertyChange('config.pieRadius', value)}
              min={20}
              max={80}
            />
            <FormControl
              type="switch"
              label="显示百分比"
              value={config.showPercentage !== false}
              onChange={(value) => handlePropertyChange('config.showPercentage', value)}
            />
          </>
        )}
      </>
    );
  };

  if (!selectedComponent) {
    return (
      <div className={`property-panel ${className}`}>
        <div className="panel-header">
          <h3 className="panel-title">属性面板</h3>
        </div>
        <div className="panel-content">
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-text">请选择一个组件来编辑属性</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`property-panel ${className}`}>
      <div className="panel-header">
        <h3 className="panel-title">属性面板</h3>
        <div className="panel-actions">
          {onComponentDuplicate && (
            <button 
              className="action-btn duplicate-btn"
              onClick={handleDuplicate}
              title="复制组件"
            >
              📋
            </button>
          )}
          {onComponentDelete && (
            <button 
              className="action-btn delete-btn"
              onClick={handleDelete}
              title="删除组件"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      <div className="panel-content">
        <div className="component-info">
          <div className="component-type">{selectedComponent.type}</div>
          <div className="component-id">ID: {selectedComponent.id}</div>
        </div>

        <div className="property-groups">
          <PropertyGroupComponent
            group={PROPERTY_GROUPS[0]}
            collapsed={collapsedGroups.has('basic')}
            onToggleCollapse={handleToggleCollapse}
          >
            {renderBasicProperties()}
          </PropertyGroupComponent>

          <PropertyGroupComponent
            group={PROPERTY_GROUPS[1]}
            collapsed={collapsedGroups.has('layout')}
            onToggleCollapse={handleToggleCollapse}
          >
            {renderLayoutProperties()}
          </PropertyGroupComponent>

          <PropertyGroupComponent
            group={PROPERTY_GROUPS[2]}
            collapsed={collapsedGroups.has('style')}
            onToggleCollapse={handleToggleCollapse}
          >
            {renderStyleProperties()}
          </PropertyGroupComponent>

          <PropertyGroupComponent
             group={PROPERTY_GROUPS[3]}
             collapsed={collapsedGroups.has('data')}
             onToggleCollapse={handleToggleCollapse}
           >
             {renderDataProperties()}
           </PropertyGroupComponent>

           {selectedComponent.type === 'chart' && (
             <PropertyGroupComponent
               group={{ key: 'chart', title: '图表配置', icon: '📈', collapsible: true }}
               collapsed={collapsedGroups.has('chart')}
               onToggleCollapse={handleToggleCollapse}
             >
               {renderChartProperties()}
             </PropertyGroupComponent>
           )}
        </div>
      </div>
    </div>
  );
};

export default PropertyPanel;