
import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, AlertCircle, ChevronDown, Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Plus, Trash2, ArrowUpDown } from 'lucide-react';

// --- Colors ---
// Using Tailwind standard palette, keeping in mind the dark blue enterprise theme.
// Primary: blue-600
// Bg: slate-900 / slate-800
// Border: slate-700

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', icon, children, className, ...props }) => {
  const baseStyle = "inline-flex items-center justify-center rounded-[var(--comp-radius-sm)] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--sys-bg-page)] disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[var(--ref-color-brand-500)] hover:bg-[var(--sys-link-hover)] text-[var(--ref-color-text-inverse)] focus:ring-[var(--sys-border-focus)] shadow-sm",
    secondary: "bg-[var(--sys-bg-card)] hover:bg-[var(--sys-bg-card-hover)] text-[var(--sys-text-secondary)] focus:ring-[var(--sys-border-primary)] border border-[var(--sys-border-primary)]",
    danger: "bg-[var(--sys-state-danger)] hover:bg-[#ff6b6d] text-[var(--ref-color-text-inverse)] focus:ring-[var(--sys-state-danger)]",
    ghost: "bg-transparent hover:bg-[var(--sys-bg-card)] text-[var(--sys-text-tertiary)] hover:text-[var(--ref-color-text-inverse)]"
  };

  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-4 py-1.5 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className || ''}`} {...props}>
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export const Switch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => {
  return (
    <button 
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--sys-border-focus)] focus:ring-offset-2 focus:ring-offset-[var(--sys-bg-page)] ${checked ? 'bg-[var(--sys-state-success)]' : 'bg-[var(--sys-state-danger)]'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  );
};

// Enhanced Card to support flex-1 children for scrolling
export const Card: React.FC<{ children: ReactNode; title?: string; className?: string; action?: ReactNode; bodyClassName?: string }> = ({ children, title, className, action, bodyClassName }) => (
  <div className={`bg-[var(--sys-bg-card)]/40 border border-[#1f5b9b] rounded-[var(--comp-radius-md)] shadow-sm backdrop-blur-sm flex flex-col ${className || ''}`}>
    {title && (
      <div className="px-5 py-3 border-b border-[#1f5b9b] flex justify-between items-center bg-[var(--sys-bg-page)]/30 rounded-t-[var(--comp-radius-md)] shrink-0">
        <h3 className="font-semibold text-[var(--sys-text-primary)] flex items-center gap-2">
           <div className="w-1 h-4 bg-[var(--sys-state-info)] rounded-full"></div>
           {title}
        </h3>
        {action && <div>{action}</div>}
      </div>
    )}
    {/* Body: flex-1 min-h-0 allows nested scroll containers to work properly */}
    <div className={`p-5 flex-1 min-h-0 flex flex-col ${bodyClassName || ''}`}>{children}</div>
  </div>
);

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-4xl', // Widened for better grid layout
    xl: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--sys-bg-page)]/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div className={`bg-[var(--sys-bg-page)] border border-[var(--sys-border-primary)] w-full ${sizes[size]} rounded-[var(--comp-radius-md)] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--sys-border-primary)] bg-[var(--sys-bg-card)] rounded-t-[var(--comp-radius-md)] shrink-0">
          <h2 className="text-lg font-bold text-[var(--sys-text-primary)] tracking-wide">{title}</h2>
          <button onClick={onClose} className="text-[var(--sys-text-secondary)] hover:text-[var(--ref-color-text-inverse)] transition-colors p-1 hover:bg-[var(--sys-bg-card-hover)] rounded">
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 text-[var(--sys-text-secondary)] bg-[var(--sys-bg-page)]">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-[var(--sys-border-primary)] bg-[var(--sys-bg-card)] flex justify-end space-x-3 rounded-b-[var(--comp-radius-md)] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const SectionTitle: React.FC<{ title: string; className?: string }> = ({ title, className }) => (
  <div className={`flex items-center mb-5 mt-1 ${className || ''}`}>
    <div className="w-1 h-4 bg-[var(--sys-state-info)] mr-3"></div>
    <h4 className="text-base font-medium text-[var(--sys-text-primary)]">{title}</h4>
  </div>
);

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, title = '确认操作', message, onConfirm, onCancel }) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm" 
      footer={
        <>
           <Button variant="secondary" onClick={onCancel}>取消</Button>
           <Button variant="danger" onClick={onConfirm}>确定</Button>
        </>
      }
    >
      <div className="flex items-start space-x-4 py-2">
        <div className="p-2 bg-[var(--sys-state-warning)]/10 rounded-full shrink-0">
            <AlertCircle className="text-[var(--sys-state-warning)]" size={24} />
        </div>
        <div>
            <h5 className="text-[var(--sys-text-primary)] font-medium mb-1">请确认</h5>
            <p className="text-[var(--sys-text-secondary)] text-sm leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
};

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  prefix?: ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, prefix, className, ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="text-sm text-[var(--sys-text-secondary)] font-normal">{label}</label>}
    <div className="relative group">
      {prefix && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--sys-text-disabled)] pointer-events-none group-focus-within:text-[var(--sys-state-info)] transition-colors">
          {prefix}
        </div>
      )}
      <input 
        className={`w-full ${prefix ? 'pl-10' : 'px-3'} py-2 bg-[var(--sys-bg-card)] border border-[var(--sys-border-secondary)] rounded-[var(--comp-radius-sm)] focus:ring-1 focus:ring-[var(--sys-border-focus)] focus:border-[var(--sys-border-focus)] text-[var(--sys-text-primary)] placeholder-[var(--sys-text-disabled)] transition-all text-sm hover:border-[var(--sys-border-primary)] ${className || ''}`} 
        {...props} 
      />
    </div>
  </div>
);

type SelectOption = { label: string; value: string };
type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> & {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  onChange?: (event: { target: { value: string; name?: string } }) => void;
};

export const Select: React.FC<SelectProps> = ({ label, options, className, value, defaultValue, onChange, disabled, name, placeholder, ...props }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [innerValue, setInnerValue] = useState<string>(() => {
    if (typeof value === 'string') return value;
    if (typeof defaultValue === 'string') return defaultValue;
    return options[0]?.value ?? '';
  });

  useEffect(() => {
    if (typeof value === 'string') setInnerValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inBox = !!boxRef.current?.contains(target);
      const inMenu = !!menuRef.current?.contains(target);
      if (!inBox && !inMenu) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const updateMenuPosition = () => {
      const trigger = boxRef.current?.querySelector('button');
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const estimatedHeight = Math.min(224, Math.max(48, options.length * 34 + 8));
      const gap = 6;
      const canOpenDown = rect.bottom + gap + estimatedHeight <= window.innerHeight - 8;
      const top = canOpenDown ? rect.bottom + gap : Math.max(8, rect.top - gap - estimatedHeight);
      setMenuStyle({
        position: 'fixed',
        top,
        left: rect.left,
        width: rect.width,
      });
    };
    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open, options.length]);

  const currentValue = typeof value === 'string' ? value : innerValue;
  const currentOption = options.find((opt) => opt.value === currentValue);
  const displayLabel = currentOption?.label || placeholder || '请选择';

  const commitValue = (nextValue: string) => {
    if (typeof value !== 'string') setInnerValue(nextValue);
    onChange?.({ target: { value: nextValue, name } });
    setOpen(false);
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm text-[var(--sys-text-secondary)] font-normal">{label}</label>}
      <div ref={boxRef} className="relative">
        {name && <input type="hidden" name={name} value={currentValue} />}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          className={`w-full px-3 py-2 bg-[var(--sys-bg-card)] border border-[var(--sys-border-secondary)] rounded-[var(--comp-radius-sm)] text-left text-[var(--sys-text-primary)] transition-all text-sm hover:border-[var(--sys-border-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--sys-border-focus)] focus:border-[var(--sys-border-focus)] ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className || ''}`}
          {...props}
        >
          <span className={currentOption ? 'text-[var(--sys-text-primary)]' : 'text-[var(--sys-text-disabled)]'}>{displayLabel}</span>
          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[var(--sys-text-disabled)] transition-transform ${open ? 'rotate-180' : ''}`}>
            <ChevronDown size={14} />
          </span>
        </button>

        {open && createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="z-[4000] max-h-56 overflow-auto rounded-[6px] border border-[var(--sys-border-primary)] bg-[var(--sys-bg-header)] p-1 shadow-[0_10px_28px_rgba(3,17,48,0.55)]"
          >
            {options.map((opt) => {
              const selected = opt.value === currentValue;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => commitValue(opt.value)}
                  className={`flex w-full items-center rounded px-2.5 py-1.5 text-left text-sm transition-colors ${
                    selected
                      ? 'bg-[#0f4d8f] text-[#dff1ff]'
                      : 'text-[var(--sys-text-secondary)] hover:bg-[#113e73] hover:text-[#e9f5ff]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

// Fix: Added onClick support to the Badge component to handle interaction in lists
export const Badge: React.FC<{ children: ReactNode; color?: 'blue' | 'green' | 'red' | 'gray' | 'yellow'; className?: string; onClick?: () => void }> = ({ children, color = 'blue', className, onClick }) => {
  const colors = {
    blue: 'bg-[#0f3f79] text-[#39c8ff] border-[#2a7fbe]/55',
    green: 'bg-[#0f4e49] text-[#36d8a0] border-[#2aa17e]/55',
    red: 'bg-[#5a2230] text-[#ff8f9a] border-[#b64d67]/55',
    yellow: 'bg-[#5c4018] text-[#ffc76b] border-[#b88636]/55',
    gray: 'bg-[#143a6f] text-[#86c5ff] border-[#2d6fb0]/50',
  };
  return (
    <span 
      onClick={onClick}
      className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-semibold border ${colors[color]} ${className || ''}`}
    >
      {children}
    </span>
  );
};

interface TableProps {
  columns: { header: string; accessor: string | ((row: any) => ReactNode); width?: string }[];
  data: any[];
  keyField?: string;
}

export const Table: React.FC<TableProps> = ({ columns, data, keyField = 'id' }) => {
  return (
    // REMOVED 'overflow-hidden' from here. 
    // This allows sticky headers to work relative to the parent scroll container (div.flex-1.overflow-auto in pages).
    <div className="border border-[#1f5b9b] rounded-[var(--comp-radius-md)] shadow-sm">
      <table className="min-w-full divide-y divide-[#1a4f87] bg-[var(--sys-bg-card)] rounded-[var(--comp-radius-md)]">
        <thead className="bg-[var(--ref-color-bg-780)]">
          <tr>
            {columns.map((col, idx) => (
              // sticky top-0 works if no ancestor between this and the scroll container has overflow: hidden
              // Added text-center for centered headers
              <th key={idx} className="px-6 py-3.5 text-center text-xs font-semibold text-[var(--sys-text-secondary)] uppercase tracking-wider sticky top-0 z-20 bg-[var(--ref-color-bg-780)] shadow-sm" style={{ width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-[var(--sys-bg-card)]/40 divide-y divide-[#1a4f87]">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-[var(--sys-text-disabled)]">
                <div className="flex flex-col items-center">
                    <Search className="w-8 h-8 mb-2 opacity-20" />
                    <span>暂无数据</span>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row) => (
              // Added zebra striping even:bg-[#1e293b]/20
              <tr key={row[keyField]} className="hover:bg-[var(--sys-bg-card-hover)]/50 transition-colors even:bg-[var(--sys-bg-card)]/20">
                {columns.map((col, idx) => (
                  <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-[var(--sys-text-primary)]">
                    {typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export const Pagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void }> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center space-x-2">
            <Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} icon={<ChevronLeft size={14} />}>上一页</Button>
            <span className="text-xs text-[var(--sys-text-secondary)] px-2 min-w-[60px] text-center">{currentPage} / {totalPages}</span>
            <Button variant="secondary" size="sm" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} icon={<ChevronRight size={14} />}>下一页</Button>
        </div>
    );
};

interface ColumnConfigProps {
  isOpen: boolean;
  onClose: () => void;
  allColumns: { key: string; header: string }[];
  currentOrder: string[]; 
  onSave: (newOrder: string[]) => void;
}

export const ColumnConfigDialog: React.FC<ColumnConfigProps> = ({ isOpen, onClose, allColumns, currentOrder, onSave }) => {
  const [orderedKeys, setOrderedKeys] = useState(currentOrder);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
      if (isOpen) setOrderedKeys(currentOrder);
  }, [isOpen, currentOrder]);

  // Filter left list
  const filteredAllColumns = allColumns.filter(col => 
      col.header.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = (key: string) => {
      if (orderedKeys.includes(key)) {
          setOrderedKeys(orderedKeys.filter(k => k !== key));
      } else {
          setOrderedKeys([...orderedKeys, key]);
      }
  };

  const handleSelectAll = () => {
      const visibleKeys = filteredAllColumns.map(c => c.key);
      const allSelected = visibleKeys.every(k => orderedKeys.includes(k));
      
      if (allSelected) {
          // Deselect visible
          setOrderedKeys(orderedKeys.filter(k => !visibleKeys.includes(k)));
      } else {
          // Select visible (append missing)
          const newKeys = [...orderedKeys];
          visibleKeys.forEach(k => {
              if (!newKeys.includes(k)) newKeys.push(k);
          });
          setOrderedKeys(newKeys);
      }
  };

  const handleClear = () => {
      setOrderedKeys([]);
  };

  const move = (index: number, direction: -1 | 1) => {
      const newOrder = [...orderedKeys];
      if (index + direction < 0 || index + direction >= newOrder.length) return;
      const [item] = newOrder.splice(index, 1);
      newOrder.splice(index + direction, 0, item);
      setOrderedKeys(newOrder);
  };

  // Right side list objects
  const visibleColumns = orderedKeys.map(k => allColumns.find(c => c.key === k)).filter(Boolean) as typeof allColumns;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="表格列配置" size="lg" 
      footer={
        <div className="flex justify-center gap-4 w-full">
           <Button className="bg-blue-600 hover:bg-blue-500 text-white w-32 border-none" onClick={() => { onSave(orderedKeys); onClose(); }}>确认</Button>
           <Button className="bg-amber-500 hover:bg-amber-600 text-white border-none w-32" onClick={onClose}>取消</Button>
        </div>
      }
    >
      <div className="flex flex-col h-[500px]">
          {/* Search */}
          <div className="mb-4 relative">
              <input 
                  type="text" 
                  placeholder="请输入内容" 
                  className="w-full bg-[var(--sys-bg-header)] border border-[var(--sys-border-primary)] rounded-md py-2 pl-4 pr-10 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
              />
              <Search className="absolute right-3 top-2.5 text-slate-500" size={16} />
          </div>

          <div className="flex flex-1 gap-6 min-h-0">
              {/* Left Panel */}
              <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-3 text-sm px-1">
                      <span className="text-slate-400">可配置列: {allColumns.length}</span>
                      <button onClick={handleSelectAll} className="text-blue-400 hover:text-blue-300 font-medium">全选</button>
                  </div>
                  <div className="flex-1 border border-[var(--sys-border-primary)] rounded-lg overflow-y-auto custom-scrollbar p-2 bg-[var(--sys-bg-header)]/50">
                      {filteredAllColumns.map(col => {
                          const isChecked = orderedKeys.includes(col.key);
                          return (
                              <div 
                                  key={col.key} 
                                  className={`flex items-center p-2.5 rounded cursor-pointer hover:bg-slate-800 transition-colors mb-1 ${isChecked ? 'bg-blue-900/10' : ''}`}
                                  onClick={() => handleToggle(col.key)}
                              >
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 transition-colors shrink-0 ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-[var(--sys-border-secondary)] bg-slate-900'}`}>
                                      {isChecked && <Check size={10} className="text-white" />}
                                  </div>
                                  <span className={isChecked ? 'text-blue-100 font-medium' : 'text-slate-400'}>{col.header}</span>
                              </div>
                          );
                      })}
                  </div>
              </div>

              {/* Right Panel */}
              <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-3 text-sm px-1">
                      <span className="text-slate-400">已选列数: {orderedKeys.length}</span>
                      <button onClick={handleClear} className="text-blue-400 hover:text-blue-300 font-medium">清空</button>
                  </div>
                  <div className="flex-1 border border-[var(--sys-border-primary)] rounded-lg overflow-y-auto custom-scrollbar p-2 bg-[var(--sys-bg-header)]/50">
                      {visibleColumns.map((col, idx) => (
                          <div key={col.key} className="flex items-center justify-between p-2.5 mb-1.5 rounded bg-slate-800/80 border border-transparent hover:border-blue-500/50 group transition-all">
                              <div className="flex items-center gap-3">
                                  <ArrowUpDown size={14} className="text-blue-500 cursor-grab active:cursor-grabbing opacity-70" />
                                  <span className="text-slate-200 text-sm">{col.header}</span>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                      className="p-1 text-slate-500 hover:text-blue-400 disabled:opacity-30 transition-colors" 
                                      onClick={() => move(idx, -1)} 
                                      disabled={idx === 0}
                                      title="上移"
                                  >
                                      <ArrowUp size={14} />
                                  </button>
                                  <button 
                                      className="p-1 text-slate-500 hover:text-blue-400 disabled:opacity-30 transition-colors" 
                                      onClick={() => move(idx, 1)} 
                                      disabled={idx === visibleColumns.length - 1}
                                      title="下移"
                                  >
                                      <ArrowDown size={14} />
                                  </button>
                                  <button 
                                      className="p-1 text-slate-500 hover:text-red-400 ml-1 transition-colors" 
                                      onClick={() => handleToggle(col.key)}
                                      title="移除"
                                  >
                                      <Trash2 size={14} />
                                  </button>
                              </div>
                          </div>
                      ))}
                      {visibleColumns.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                              <span className="opacity-50">暂无已选列</span>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>
    </Modal>
  );
};
