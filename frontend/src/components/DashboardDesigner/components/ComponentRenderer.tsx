import React from 'react';
import type { DashboardComponent } from '../types';
import { EnhancedChartComponent } from './EnhancedChartComponent';
import './ComponentRenderer.css';

interface ComponentRendererProps {
  component: DashboardComponent;
  onUpdate: (componentId: string, updates: Partial<DashboardComponent>) => void;
  readOnly?: boolean;
}

// 文本组件
const TextComponent: React.FC<{ component: DashboardComponent; readOnly: boolean }> = ({ component, readOnly }) => {
  const { config, style } = component;
  
  return (
    <div 
      className="text-component"
      style={{
        fontSize: config.fontSize || '14px',
        fontWeight: config.fontWeight || 'normal',
        color: config.color || '#333',
        textAlign: config.textAlign || 'left',
        lineHeight: config.lineHeight || '1.5',
        padding: '12px',
        ...style
      }}
    >
      {config.content || '文本内容'}
    </div>
  );
};

// 图表组件 - 使用增强版本
const ChartComponent: React.FC<{ component: DashboardComponent; readOnly: boolean }> = ({ component, readOnly }) => {
  return <EnhancedChartComponent component={component} />;
};

// 表格组件
const TableComponent: React.FC<{ component: DashboardComponent; readOnly: boolean }> = ({ component, readOnly }) => {
  const { config, style } = component;
  
  const sampleData = [
    { id: 1, name: '张三', age: 25, city: '北京' },
    { id: 2, name: '李四', age: 30, city: '上海' },
    { id: 3, name: '王五', age: 28, city: '广州' }
  ];
  
  return (
    <div 
      className="table-component"
      style={{
        padding: '16px',
        ...style
      }}
    >
      <div className="table-header">
        <h4 className="table-title">{component.title || '数据表格'}</h4>
      </div>
      <div className="table-content">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>姓名</th>
              <th>年龄</th>
              <th>城市</th>
            </tr>
          </thead>
          <tbody>
            {sampleData.map(row => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.name}</td>
                <td>{row.age}</td>
                <td>{row.city}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 指标卡片组件
const MetricComponent: React.FC<{ component: DashboardComponent; readOnly: boolean }> = ({ component, readOnly }) => {
  const { config, style } = component;
  
  return (
    <div 
      className="metric-component"
      style={{
        padding: '20px',
        background: config.backgroundColor || '#fff',
        borderRadius: '8px',
        textAlign: 'center',
        ...style
      }}
    >
      <div className="metric-icon" style={{ fontSize: '32px', marginBottom: '12px' }}>
        {config.icon || '📈'}
      </div>
      <div className="metric-value" style={{ 
        fontSize: '28px', 
        fontWeight: 'bold', 
        color: config.valueColor || '#007bff',
        marginBottom: '8px'
      }}>
        {config.value || '1,234'}
      </div>
      <div className="metric-label" style={{ 
        fontSize: '14px', 
        color: config.labelColor || '#6c757d'
      }}>
        {config.label || component.title || '指标名称'}
      </div>
      {config.trend && (
        <div className="metric-trend" style={{ 
          fontSize: '12px', 
          color: config.trend === 'up' ? '#28a745' : '#dc3545',
          marginTop: '8px'
        }}>
          {config.trend === 'up' ? '↗' : '↘'} {config.trendValue || '12%'}
        </div>
      )}
    </div>
  );
};

// 图片组件
const ImageComponent: React.FC<{ component: DashboardComponent; readOnly: boolean }> = ({ component, readOnly }) => {
  const { config, style } = component;
  
  return (
    <div 
      className="image-component"
      style={{
        padding: '8px',
        ...style
      }}
    >
      {config.src ? (
        <img 
          src={config.src}
          alt={config.alt || component.title || '图片'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: config.objectFit || 'cover',
            borderRadius: config.borderRadius || '4px'
          }}
        />
      ) : (
        <div className="image-placeholder">
          <div className="placeholder-icon">🖼️</div>
          <div className="placeholder-text">点击上传图片</div>
        </div>
      )}
    </div>
  );
};

// 容器组件
const ContainerComponent: React.FC<{ component: DashboardComponent; readOnly: boolean }> = ({ component, readOnly }) => {
  const { config, style } = component;
  
  return (
    <div 
      className="container-component"
      style={{
        padding: config.padding || '16px',
        background: config.backgroundColor || '#f8f9fa',
        border: config.border || '1px solid #e9ecef',
        borderRadius: config.borderRadius || '8px',
        ...style
      }}
    >
      <div className="container-header">
        {component.title && (
          <h4 className="container-title">{component.title}</h4>
        )}
        {component.description && (
          <p className="container-description">{component.description}</p>
        )}
      </div>
      <div className="container-content">
        <div className="container-placeholder">
          <div className="placeholder-icon">📦</div>
          <div className="placeholder-text">容器内容区域</div>
          <div className="placeholder-subtitle">可以放置其他组件</div>
        </div>
      </div>
    </div>
  );
};

// 按钮组件
const ButtonComponent: React.FC<{ component: DashboardComponent; readOnly: boolean }> = ({ component, readOnly }) => {
  const { config, style } = component;
  
  const handleClick = () => {
    if (!readOnly && config.onClick) {
      // 执行按钮点击事件
      console.log('Button clicked:', config.onClick);
    }
  };
  
  return (
    <div 
      className="button-component"
      style={{
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      <button
        className={`btn btn-${config.variant || 'primary'} btn-${config.size || 'md'}`}
        onClick={handleClick}
        disabled={readOnly || config.disabled}
        style={{
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          color: config.textColor,
          fontSize: config.fontSize,
          padding: config.padding,
          borderRadius: config.borderRadius,
          minWidth: config.minWidth || '100px'
        }}
      >
        {config.icon && <span className="btn-icon">{config.icon}</span>}
        <span className="btn-text">{config.text || component.title || '按钮'}</span>
      </button>
    </div>
  );
};

// 分隔符组件
const DividerComponent: React.FC<{ component: DashboardComponent; readOnly: boolean }> = ({ component, readOnly }) => {
  const { config, style } = component;
  
  return (
    <div 
      className="divider-component"
      style={{
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      <hr 
        style={{
          width: '100%',
          border: 'none',
          borderTop: `${config.thickness || 1}px ${config.style || 'solid'} ${config.color || '#e9ecef'}`,
          margin: 0
        }}
      />
    </div>
  );
};

// 主渲染器组件
export const ComponentRenderer: React.FC<ComponentRendererProps> = ({ 
  component, 
  onUpdate, 
  readOnly = false 
}) => {
  const renderComponent = () => {
    switch (component.type) {
      case 'text':
        return <TextComponent component={component} readOnly={readOnly} />;
      case 'chart':
        return <ChartComponent component={component} readOnly={readOnly} />;
      case 'table':
        return <TableComponent component={component} readOnly={readOnly} />;
      case 'metric':
        return <MetricComponent component={component} readOnly={readOnly} />;
      case 'image':
        return <ImageComponent component={component} readOnly={readOnly} />;
      case 'container':
        return <ContainerComponent component={component} readOnly={readOnly} />;
      case 'button':
        return <ButtonComponent component={component} readOnly={readOnly} />;
      case 'divider':
        return <DividerComponent component={component} readOnly={readOnly} />;
      default:
        return (
          <div className="unknown-component">
            <div className="placeholder-icon">❓</div>
            <div className="placeholder-text">未知组件类型</div>
            <div className="placeholder-subtitle">{component.type}</div>
          </div>
        );
    }
  };

  return (
    <div 
      className={`component-renderer ${component.type}-renderer`}
      style={{
        width: '100%',
        height: '100%',
        opacity: component.visible !== false ? 1 : 0.5,
        ...component.style
      }}
    >
      {renderComponent()}
    </div>
  );
};

export default ComponentRenderer;