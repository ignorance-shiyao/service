
import React, { ReactNode, useState, useRef, useEffect } from 'react';
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
  const baseStyle = "inline-flex items-center justify-center rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-500 shadow-sm",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 focus:ring-slate-500 border border-slate-600",
    danger: "bg-red-600 hover:bg-red-500 text-white focus:ring-red-500",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white"
  };

  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-4 py-1.5 text-sm", // Adjusted height slightly
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
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${checked ? 'bg-emerald-500' : 'bg-red-500'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
  <div className={`bg-slate-800/40 border border-slate-700/50 rounded-lg shadow-sm backdrop-blur-sm flex flex-col ${className || ''}`}>
    {title && (
      <div className="px-5 py-3 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/30 rounded-t-lg shrink-0">
        <h3 className="font-semibold text-slate-100 flex items-center gap-2">
           <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div className={`bg-[#0b1121] border border-slate-700 w-full ${sizes[size]} rounded-lg shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-[#0f172a] rounded-t-lg shrink-0">
          <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded">
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 text-slate-200 bg-[#0b1121]">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-800 bg-[#0f172a] flex justify-end space-x-3 rounded-b-lg shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const SectionTitle: React.FC<{ title: string; className?: string }> = ({ title, className }) => (
  <div className={`flex items-center mb-5 mt-1 ${className || ''}`}>
    <div className="w-1 h-4 bg-blue-500 mr-3"></div>
    <h4 className="text-base font-medium text-white">{title}</h4>
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
        <div className="p-2 bg-yellow-500/10 rounded-full shrink-0">
            <AlertCircle className="text-yellow-500" size={24} />
        </div>
        <div>
            <h5 className="text-white font-medium mb-1">请确认</h5>
            <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
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
    {label && <label className="text-sm text-slate-400 font-normal">{label}</label>}
    <div className="relative group">
      {prefix && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 pointer-events-none group-focus-within:text-blue-400 transition-colors">
          {prefix}
        </div>
      )}
      <input 
        className={`w-full ${prefix ? 'pl-10' : 'px-3'} py-2 bg-[#1e293b] border border-slate-700 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-slate-600 transition-all text-sm hover:border-slate-600 ${className || ''}`} 
        {...props} 
      />
    </div>
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string, options: { label: string, value: string }[] }> = ({ label, options, className, ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="text-sm text-slate-400 font-normal">{label}</label>}
    <div className="relative">
        <select 
        className={`w-full px-3 py-2 bg-[#1e293b] border border-slate-700 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white transition-all text-sm appearance-none hover:border-slate-600 ${className || ''}`} 
        {...props}
        >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-500">
            <ChevronDown size={14} />
        </div>
    </div>
  </div>
);

// Fix: Added onClick support to the Badge component to handle interaction in lists
export const Badge: React.FC<{ children: ReactNode; color?: 'blue' | 'green' | 'red' | 'gray' | 'yellow'; className?: string; onClick?: () => void }> = ({ children, color = 'blue', className, onClick }) => {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    yellow: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    gray: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
  return (
    <span 
      onClick={onClick}
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[color]} ${className || ''}`}
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
    <div className="border border-slate-700/50 rounded-lg shadow-sm">
      <table className="min-w-full divide-y divide-slate-800 bg-[#0f172a] rounded-lg">
        <thead className="bg-slate-900">
          <tr>
            {columns.map((col, idx) => (
              // sticky top-0 works if no ancestor between this and the scroll container has overflow: hidden
              // Added text-center for centered headers
              <th key={idx} className="px-6 py-3.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider sticky top-0 z-20 bg-slate-900 shadow-sm" style={{ width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-[#1e293b]/30 divide-y divide-slate-800">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                <div className="flex flex-col items-center">
                    <Search className="w-8 h-8 mb-2 opacity-20" />
                    <span>暂无数据</span>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row) => (
              // Added zebra striping even:bg-[#1e293b]/20
              <tr key={row[keyField]} className="hover:bg-slate-800/50 transition-colors even:bg-[#1e293b]/20">
                {columns.map((col, idx) => (
                  <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
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
            <span className="text-xs text-slate-400 px-2 min-w-[60px] text-center">{currentPage} / {totalPages}</span>
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
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-md py-2 pl-4 pr-10 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
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
                  <div className="flex-1 border border-slate-700/50 rounded-lg overflow-y-auto custom-scrollbar p-2 bg-[#0f172a]/50">
                      {filteredAllColumns.map(col => {
                          const isChecked = orderedKeys.includes(col.key);
                          return (
                              <div 
                                  key={col.key} 
                                  className={`flex items-center p-2.5 rounded cursor-pointer hover:bg-slate-800 transition-colors mb-1 ${isChecked ? 'bg-blue-900/10' : ''}`}
                                  onClick={() => handleToggle(col.key)}
                              >
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 transition-colors shrink-0 ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-slate-600 bg-slate-900'}`}>
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
                  <div className="flex-1 border border-slate-700/50 rounded-lg overflow-y-auto custom-scrollbar p-2 bg-[#0f172a]/50">
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
