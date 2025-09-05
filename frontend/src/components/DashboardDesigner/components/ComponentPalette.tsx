import React, { useState, useMemo } from 'react';
import { useDrag } from 'react-dnd';
import { 
  ComponentTemplate, 
  ComponentCategory, 
  ComponentType,
  DragItem 
} from '../types';
import './ComponentPalette.css';

interface ComponentPaletteProps {
  templates: ComponentTemplate[];
  onTemplateSelect?: (template: ComponentTemplate) => void;
  searchable?: boolean;
  collapsible?: boolean;
  className?: string;
}

// 拖拽组件项
interface DraggableComponentProps {
  template: ComponentTemplate;
  onSelect?: (template: ComponentTemplate) => void;
}

const DraggableComponent: React.FC<DraggableComponentProps> = ({ 
  template, 
  onSelect 
}) => {
  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: 'component',
    item: {
      type: 'component',
      componentType: template.type,
      template
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const handleClick = () => {
    onSelect?.(template);
  };

  return (
    <div
      ref={drag}
      className={`component-item ${isDragging ? 'dragging' : ''}`}
      onClick={handleClick}
      title={template.description}
    >
      <div className="component-icon">
        {template.icon || getDefaultIcon(template.type)}
      </div>
      <div className="component-info">
        <div className="component-name">{template.name}</div>
        <div className="component-description">{template.description}</div>
      </div>
    </div>
  );
};

// 获取默认图标
const getDefaultIcon = (type: ComponentType): string => {
  const iconMap: Record<ComponentType, string> = {
    chart: '📊',
    table: '📋',
    text: '📝',
    image: '🖼️',
    button: '🔘',
    input: '📝',
    container: '📦',
    divider: '➖',
    spacer: '⬜',
    custom: '🔧'
  };
  return iconMap[type] || '📦';
};

// 获取分类显示名称
const getCategoryDisplayName = (category: ComponentCategory): string => {
  const nameMap: Record<ComponentCategory, string> = {
    chart: '图表组件',
    layout: '布局组件',
    form: '表单组件',
    display: '展示组件',
    interaction: '交互组件',
    custom: '自定义组件'
  };
  return nameMap[category] || category;
};

// 组件分类组
interface ComponentCategoryGroupProps {
  category: ComponentCategory;
  templates: ComponentTemplate[];
  onTemplateSelect?: (template: ComponentTemplate) => void;
  collapsed?: boolean;
  onToggleCollapse?: (category: ComponentCategory) => void;
}

const ComponentCategoryGroup: React.FC<ComponentCategoryGroupProps> = ({
  category,
  templates,
  onTemplateSelect,
  collapsed = false,
  onToggleCollapse
}) => {
  const handleToggle = () => {
    onToggleCollapse?.(category);
  };

  return (
    <div className={`component-category ${collapsed ? 'collapsed' : ''}`}>
      <div className="category-header" onClick={handleToggle}>
        <span className="category-icon">
          {collapsed ? '▶' : '▼'}
        </span>
        <span className="category-name">
          {getCategoryDisplayName(category)}
        </span>
        <span className="category-count">({templates.length})</span>
      </div>
      {!collapsed && (
        <div className="category-content">
          {templates.map((template) => (
            <DraggableComponent
              key={template.id}
              template={template}
              onSelect={onTemplateSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 搜索框组件
interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBox: React.FC<SearchBoxProps> = ({ 
  value, 
  onChange, 
  placeholder = '搜索组件...' 
}) => {
  return (
    <div className="search-box">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input"
      />
      <span className="search-icon">🔍</span>
    </div>
  );
};

// 主组件
export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  templates,
  onTemplateSelect,
  searchable = true,
  collapsible = true,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<ComponentCategory>>(new Set());

  // 过滤和分组模板
  const { filteredTemplates, groupedTemplates } = useMemo(() => {
    // 搜索过滤
    const filtered = searchTerm
      ? templates.filter(template => 
          template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : templates;

    // 按分类分组
    const grouped = filtered.reduce((acc, template) => {
      const category = template.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(template);
      return acc;
    }, {} as Record<ComponentCategory, ComponentTemplate[]>);

    return { filteredTemplates: filtered, groupedTemplates: grouped };
  }, [templates, searchTerm]);

  // 切换分类折叠状态
  const handleToggleCollapse = (category: ComponentCategory) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // 全部展开/折叠
  const handleToggleAll = () => {
    const allCategories = Object.keys(groupedTemplates) as ComponentCategory[];
    const allCollapsed = allCategories.every(cat => collapsedCategories.has(cat));
    
    if (allCollapsed) {
      setCollapsedCategories(new Set());
    } else {
      setCollapsedCategories(new Set(allCategories));
    }
  };

  return (
    <div className={`component-palette ${className}`}>
      <div className="palette-header">
        <h3 className="palette-title">组件库</h3>
        {collapsible && (
          <button 
            className="toggle-all-btn"
            onClick={handleToggleAll}
            title="展开/折叠全部"
          >
            {Object.keys(groupedTemplates).every(cat => 
              collapsedCategories.has(cat as ComponentCategory)
            ) ? '展开' : '折叠'}
          </button>
        )}
      </div>

      {searchable && (
        <SearchBox
          value={searchTerm}
          onChange={setSearchTerm}
        />
      )}

      <div className="palette-content">
        {searchTerm ? (
          // 搜索模式：显示扁平列表
          <div className="search-results">
            <div className="results-header">
              找到 {filteredTemplates.length} 个组件
            </div>
            <div className="results-list">
              {filteredTemplates.map((template) => (
                <DraggableComponent
                  key={template.id}
                  template={template}
                  onSelect={onTemplateSelect}
                />
              ))}
            </div>
          </div>
        ) : (
          // 正常模式：按分类显示
          <div className="category-list">
            {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
              <ComponentCategoryGroup
                key={category}
                category={category as ComponentCategory}
                templates={categoryTemplates}
                onTemplateSelect={onTemplateSelect}
                collapsed={collapsible && collapsedCategories.has(category as ComponentCategory)}
                onToggleCollapse={collapsible ? handleToggleCollapse : undefined}
              />
            ))}
          </div>
        )}

        {filteredTemplates.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-text">
              {searchTerm ? '未找到匹配的组件' : '暂无可用组件'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentPalette;