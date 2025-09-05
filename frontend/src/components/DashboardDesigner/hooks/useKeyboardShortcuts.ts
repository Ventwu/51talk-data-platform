import { useEffect, useCallback } from 'react';

interface UseKeyboardShortcutsOptions {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onSelectAll?: () => void;
  onPreview?: () => void;
  disabled?: boolean;
  preventDefault?: boolean;
}

// 快捷键映射
const SHORTCUTS = {
  SAVE: 'ctrl+s',
  UNDO: 'ctrl+z',
  REDO: 'ctrl+y',
  DELETE: 'delete',
  COPY: 'ctrl+c',
  PASTE: 'ctrl+v',
  SELECT_ALL: 'ctrl+a',
  PREVIEW: 'ctrl+p',
  ESCAPE: 'escape'
} as const;

// 检查是否按下了修饰键
const checkModifiers = (event: KeyboardEvent, modifiers: string[]): boolean => {
  const pressed = {
    ctrl: event.ctrlKey || event.metaKey, // Mac 上使用 cmd 键
    shift: event.shiftKey,
    alt: event.altKey
  };
  
  return modifiers.every(modifier => {
    if (modifier === 'ctrl') return pressed.ctrl;
    if (modifier === 'shift') return pressed.shift;
    if (modifier === 'alt') return pressed.alt;
    return false;
  });
};

// 解析快捷键字符串
const parseShortcut = (shortcut: string): { key: string; modifiers: string[] } => {
  const parts = shortcut.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);
  return { key, modifiers };
};

// 检查快捷键是否匹配
const matchesShortcut = (event: KeyboardEvent, shortcut: string): boolean => {
  const { key, modifiers } = parseShortcut(shortcut);
  
  // 检查按键
  const eventKey = event.key.toLowerCase();
  const keyMatches = eventKey === key || 
    (key === 'delete' && (eventKey === 'delete' || eventKey === 'backspace'));
  
  if (!keyMatches) return false;
  
  // 检查修饰键
  return checkModifiers(event, modifiers);
};

// 检查是否在可编辑元素中
const isInEditableElement = (target: EventTarget | null): boolean => {
  if (!target || !(target instanceof HTMLElement)) return false;
  
  const tagName = target.tagName.toLowerCase();
  const isEditable = target.isContentEditable;
  const isInput = ['input', 'textarea', 'select'].includes(tagName);
  
  return isEditable || isInput;
};

export const useKeyboardShortcuts = ({
  onSave,
  onUndo,
  onRedo,
  onDelete,
  onCopy,
  onPaste,
  onSelectAll,
  onPreview,
  disabled = false,
  preventDefault = true
}: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 如果禁用或在可编辑元素中，不处理快捷键
    if (disabled || isInEditableElement(event.target)) {
      return;
    }
    
    let handled = false;
    
    // 保存
    if (matchesShortcut(event, SHORTCUTS.SAVE) && onSave) {
      onSave();
      handled = true;
    }
    // 撤销
    else if (matchesShortcut(event, SHORTCUTS.UNDO) && onUndo) {
      onUndo();
      handled = true;
    }
    // 重做
    else if (matchesShortcut(event, SHORTCUTS.REDO) && onRedo) {
      onRedo();
      handled = true;
    }
    // 删除
    else if (matchesShortcut(event, SHORTCUTS.DELETE) && onDelete) {
      onDelete();
      handled = true;
    }
    // 复制
    else if (matchesShortcut(event, SHORTCUTS.COPY) && onCopy) {
      onCopy();
      handled = true;
    }
    // 粘贴
    else if (matchesShortcut(event, SHORTCUTS.PASTE) && onPaste) {
      onPaste();
      handled = true;
    }
    // 全选
    else if (matchesShortcut(event, SHORTCUTS.SELECT_ALL) && onSelectAll) {
      onSelectAll();
      handled = true;
    }
    // 预览
    else if (matchesShortcut(event, SHORTCUTS.PREVIEW) && onPreview) {
      onPreview();
      handled = true;
    }
    
    // 阻止默认行为
    if (handled && preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, [
    disabled,
    onSave,
    onUndo,
    onRedo,
    onDelete,
    onCopy,
    onPaste,
    onSelectAll,
    onPreview,
    preventDefault
  ]);
  
  useEffect(() => {
    if (disabled) return;
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, disabled]);
  
  // 返回快捷键信息，用于显示提示
  return {
    shortcuts: {
      save: 'Ctrl+S',
      undo: 'Ctrl+Z',
      redo: 'Ctrl+Y',
      delete: 'Delete',
      copy: 'Ctrl+C',
      paste: 'Ctrl+V',
      selectAll: 'Ctrl+A',
      preview: 'Ctrl+P'
    }
  };
};

export default useKeyboardShortcuts;