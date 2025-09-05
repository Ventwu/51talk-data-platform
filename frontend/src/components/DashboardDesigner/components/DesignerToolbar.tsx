import React from 'react';
import './DesignerToolbar.css';

interface DesignerToolbarProps {
  onSave: () => void;
  onPreview: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
  onImport: () => void;
  onDataConnectionToggle?: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isPreviewMode: boolean;
  isSaving: boolean;
  readOnly?: boolean;
  className?: string;
}

// 工具栏按钮组件
interface ToolbarButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  label,
  onClick,
  disabled = false,
  loading = false,
  variant = 'secondary',
  size = 'md',
  tooltip
}) => {
  return (
    <button
      className={`toolbar-btn toolbar-btn-${variant} toolbar-btn-${size}`}
      onClick={onClick}
      disabled={disabled || loading}
      title={tooltip || label}
      aria-label={label}
    >
      <span className="btn-icon">
        {loading ? '⏳' : icon}
      </span>
      <span className="btn-label">{label}</span>
    </button>
  );
};

// 工具栏分隔符
const ToolbarDivider: React.FC = () => {
  return <div className="toolbar-divider"></div>;
};

// 工具栏按钮组
interface ToolbarButtonGroupProps {
  children: React.ReactNode;
  label?: string;
}

const ToolbarButtonGroup: React.FC<ToolbarButtonGroupProps> = ({ children, label }) => {
  return (
    <div className="toolbar-group" aria-label={label}>
      {children}
    </div>
  );
};

// 响应式工具栏菜单
interface ResponsiveMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const ResponsiveMenu: React.FC<ResponsiveMenuProps> = ({ isOpen, onToggle, children }) => {
  return (
    <div className="responsive-menu">
      <button 
        className="menu-toggle"
        onClick={onToggle}
        aria-label="更多操作"
        aria-expanded={isOpen}
      >
        <span className="menu-icon">⋯</span>
      </button>
      {isOpen && (
        <div className="menu-dropdown">
          <div className="menu-content">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

// 主工具栏组件
export const DesignerToolbar: React.FC<DesignerToolbarProps> = ({
  onSave,
  onPreview,
  onUndo,
  onRedo,
  onClear,
  onExport,
  onImport,
  onDataConnectionToggle,
  canUndo,
  canRedo,
  isPreviewMode,
  isSaving,
  readOnly = false,
  className = ''
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [showConfirmClear, setShowConfirmClear] = React.useState(false);

  // 处理清空确认
  const handleClearClick = () => {
    if (showConfirmClear) {
      onClear();
      setShowConfirmClear(false);
    } else {
      setShowConfirmClear(true);
      // 3秒后自动取消确认状态
      setTimeout(() => setShowConfirmClear(false), 3000);
    }
  };

  // 处理文件导入
  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            onImport();
            // TODO: 处理导入的数据
            console.log('Imported data:', data);
          } catch (error) {
            console.error('Failed to parse imported file:', error);
            alert('导入失败：文件格式不正确');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // 键盘快捷键提示
  const shortcuts = {
    save: 'Ctrl+S',
    preview: 'Ctrl+P',
    undo: 'Ctrl+Z',
    redo: 'Ctrl+Y',
    clear: 'Ctrl+Shift+C'
  };

  return (
    <div className={`designer-toolbar ${className}`}>
      {/* 左侧按钮组 */}
      <div className="toolbar-left">
        <ToolbarButtonGroup label="文件操作">
          {!readOnly && (
            <ToolbarButton
              icon="💾"
              label="保存"
              onClick={onSave}
              loading={isSaving}
              variant="primary"
              tooltip={`保存 (${shortcuts.save})`}
            />
          )}
          <ToolbarButton
            icon={isPreviewMode ? "✏️" : "👁️"}
            label={isPreviewMode ? "编辑" : "预览"}
            onClick={onPreview}
            variant={isPreviewMode ? "secondary" : "success"}
            tooltip={`${isPreviewMode ? '编辑' : '预览'} (${shortcuts.preview})`}
          />
        </ToolbarButtonGroup>

        <ToolbarDivider />

        {/* 编辑操作 */}
        {!readOnly && (
          <ToolbarButtonGroup label="编辑操作">
            <ToolbarButton
              icon="↶"
              label="撤销"
              onClick={onUndo}
              disabled={!canUndo}
              tooltip={`撤销 (${shortcuts.undo})`}
            />
            <ToolbarButton
              icon="↷"
              label="重做"
              onClick={onRedo}
              disabled={!canRedo}
              tooltip={`重做 (${shortcuts.redo})`}
            />
          </ToolbarButtonGroup>
        )}

        <ToolbarDivider />

        {/* 数据连接 */}
        {!readOnly && onDataConnectionToggle && (
          <ToolbarButtonGroup label="数据管理">
            <ToolbarButton
              icon="🔗"
              label="数据连接"
              onClick={onDataConnectionToggle}
              tooltip="管理数据源连接"
              variant="secondary"
            />
          </ToolbarButtonGroup>
        )}

        <ToolbarDivider />

        {/* 导入导出 */}
        <ToolbarButtonGroup label="导入导出">
          <ToolbarButton
            icon="📤"
            label="导出"
            onClick={onExport}
            tooltip="导出为JSON文件"
          />
          {!readOnly && (
            <ToolbarButton
              icon="📥"
              label="导入"
              onClick={handleImportClick}
              tooltip="从JSON文件导入"
            />
          )}
        </ToolbarButtonGroup>
      </div>

      {/* 右侧按钮组 */}
      <div className="toolbar-right">
        {!readOnly && (
          <ToolbarButtonGroup label="危险操作">
            <ToolbarButton
              icon={showConfirmClear ? "⚠️" : "🗑️"}
              label={showConfirmClear ? "确认清空" : "清空"}
              onClick={handleClearClick}
              variant={showConfirmClear ? "danger" : "warning"}
              tooltip={showConfirmClear ? "点击确认清空所有组件" : `清空画布 (${shortcuts.clear})`}
            />
          </ToolbarButtonGroup>
        )}

        {/* 响应式菜单（小屏幕显示） */}
        <ResponsiveMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)}>
          {!readOnly && (
            <>
              <ToolbarButton
                icon="💾"
                label="保存"
                onClick={() => { onSave(); setIsMenuOpen(false); }}
                loading={isSaving}
                variant="primary"
                size="sm"
              />
              <ToolbarButton
                icon="↶"
                label="撤销"
                onClick={() => { onUndo(); setIsMenuOpen(false); }}
                disabled={!canUndo}
                size="sm"
              />
              <ToolbarButton
                icon="↷"
                label="重做"
                onClick={() => { onRedo(); setIsMenuOpen(false); }}
                disabled={!canRedo}
                size="sm"
              />
            </>
          )}
          <ToolbarButton
            icon={isPreviewMode ? "✏️" : "👁️"}
            label={isPreviewMode ? "编辑" : "预览"}
            onClick={() => { onPreview(); setIsMenuOpen(false); }}
            variant={isPreviewMode ? "secondary" : "success"}
            size="sm"
          />
          <ToolbarButton
            icon="📤"
            label="导出"
            onClick={() => { onExport(); setIsMenuOpen(false); }}
            size="sm"
          />
          {!readOnly && (
            <>
              <ToolbarButton
                icon="📥"
                label="导入"
                onClick={() => { handleImportClick(); setIsMenuOpen(false); }}
                size="sm"
              />
              {onDataConnectionToggle && (
                <ToolbarButton
                  icon="🔗"
                  label="数据连接"
                  onClick={() => { onDataConnectionToggle(); setIsMenuOpen(false); }}
                  size="sm"
                />
              )}
              <ToolbarButton
                icon="🗑️"
                label="清空"
                onClick={() => { handleClearClick(); setIsMenuOpen(false); }}
                variant="danger"
                size="sm"
              />
            </>
          )}
        </ResponsiveMenu>
      </div>

      {/* 状态指示器 */}
      <div className="toolbar-status">
        {isSaving && (
          <div className="status-indicator saving">
            <span className="status-icon">💾</span>
            <span className="status-text">保存中...</span>
          </div>
        )}
        {isPreviewMode && (
          <div className="status-indicator preview">
            <span className="status-icon">👁️</span>
            <span className="status-text">预览模式</span>
          </div>
        )}
        {readOnly && (
          <div className="status-indicator readonly">
            <span className="status-icon">🔒</span>
            <span className="status-text">只读模式</span>
          </div>
        )}
      </div>

      {/* 快捷键提示（悬浮显示） */}
      <div className="keyboard-shortcuts-hint">
        <div className="shortcuts-content">
          <div className="shortcuts-title">快捷键</div>
          <div className="shortcuts-list">
            <div className="shortcut-item">
              <span className="shortcut-key">{shortcuts.save}</span>
              <span className="shortcut-desc">保存</span>
            </div>
            <div className="shortcut-item">
              <span className="shortcut-key">{shortcuts.preview}</span>
              <span className="shortcut-desc">预览</span>
            </div>
            <div className="shortcut-item">
              <span className="shortcut-key">{shortcuts.undo}</span>
              <span className="shortcut-desc">撤销</span>
            </div>
            <div className="shortcut-item">
              <span className="shortcut-key">{shortcuts.redo}</span>
              <span className="shortcut-desc">重做</span>
            </div>
            <div className="shortcut-item">
              <span className="shortcut-key">{shortcuts.clear}</span>
              <span className="shortcut-desc">清空</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignerToolbar;