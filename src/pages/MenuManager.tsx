
import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Badge, Modal, Input, Select, Switch, ConfirmDialog, ColumnConfigDialog } from '../components/UI';
import { Plus, Edit2, Trash2, Folder, FileText, MousePointer, Search, RotateCcw, Download, Settings } from 'lucide-react';
import { Menu } from '../types';
import { showAppToast } from '../components/AppFeedback';
import { useAppData } from '../context/AppDataContext';

export const MenuManager: React.FC = () => {
  const { menus, updateMenus } = useAppData();
  const [data, setData] = useState<Menu[]>([]);

  useEffect(() => {
    setData(menus);
  }, [menus]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Search State
  const [searchName, setSearchName] = useState('');
  const [searchDescription, setSearchDescription] = useState('');
  const [searchVisible, setSearchVisible] = useState('');
  
  // Column Config State
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);

  const [currentMenu, setCurrentMenu] = useState<Partial<Menu> & { isExternal?: boolean; isCache?: boolean }>({});
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetStatusChange, setTargetStatusChange] = useState<{ id: string, newVisible: boolean } | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const commitMenus = (next: Menu[]) => {
    setData(next);
    updateMenus(next);
  };

  const initiateStatusChange = (menu: Menu, checked: boolean) => {
    setTargetStatusChange({ id: menu.id, newVisible: checked });
    setConfirmOpen(true);
  };

  const handleEdit = (menu: Menu) => {
    setCurrentMenu({ 
        ...menu, 
        parentId: menu.parentId || '0',
        isExternal: false, 
        isCache: true 
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
      const target = fullFlatData.find(m => m.id === id);
      if (target && target.children && target.children.length > 0) {
          showAppToast('该菜单包含子菜单，请先删除子菜单。', { tone: 'warning' });
          return;
      }
      setDeleteTargetId(id);
      setDeleteConfirmOpen(true);
  };

  // --- Column Defs ---
  const ALL_COLUMNS = useMemo(() => [
    { 
      key: 'name', header: '菜单名称', 
      accessor: (row: any) => (
        <div style={{ paddingLeft: `${row.depth * 24}px` }} className="flex items-center text-left">
           {row.type === 'dir' && <Folder size={16} className="text-yellow-500 mr-2" />}
           {row.type === 'menu' && <FileText size={16} className="text-blue-400 mr-2" />}
           {row.type === 'button' && <MousePointer size={16} className="text-slate-400 mr-2" />}
           <span className="text-slate-200">{row.name}</span>
        </div>
      ),
      width: '200px'
    },
    { 
      key: 'type', header: '类别', 
      accessor: (row: Menu) => {
          if (row.type === 'dir') return <Badge color="yellow">目录</Badge>;
          if (row.type === 'menu') return <Badge color="blue">菜单</Badge>;
          return <Badge color="gray">按钮</Badge>;
      },
      width: '80px'
    },
    { key: 'desc', header: '描述', accessor: (row: Menu) => <span className="text-slate-400 text-xs truncate max-w-[150px] block text-left" title={row.description}>{row.description || '-'}</span> },
    { key: 'sort', header: '排序', accessor: 'sort', width: '60px' },
    { 
      key: 'status', header: '状态', 
      accessor: (row: Menu) => (
        <div className="flex justify-center">
            <Switch 
            checked={row.visible} 
            onChange={(checked) => initiateStatusChange(row, checked)} 
            />
        </div>
      ),
      width: '80px'
    },
    { key: 'creator', header: '创建人', accessor: 'creator' },
    { key: 'createTime', header: '创建时间', accessor: (row: Menu) => <span className="text-xs text-slate-400 block w-[80px] mx-auto">{row.createTime?.split(' ')[0]}<br/>{row.createTime?.split(' ')[1]}</span> },
    { key: 'updater', header: '更新人', accessor: 'updater' },
    { key: 'updateTime', header: '更新时间', accessor: (row: Menu) => <span className="text-xs text-slate-400 block w-[80px] mx-auto">{row.updateTime?.split(' ')[0]}<br/>{row.updateTime?.split(' ')[1]}</span> },
    {
      key: 'action', header: '操作',
      accessor: (row: Menu) => (
        <div className="flex space-x-2 justify-center">
          <Button size="sm" variant="ghost" className="!text-blue-500 hover:!text-blue-400" icon={<Edit2 size={14} />} onClick={() => handleEdit(row)}>编辑</Button>
          <Button size="sm" variant="ghost" className="!text-red-500 hover:!text-red-400" icon={<Trash2 size={14} />} onClick={() => handleDelete(row.id)}>删除</Button>
        </div>
      ),
      width: '140px'
    }
  ], []);

  const [columnOrder, setColumnOrder] = useState(ALL_COLUMNS.map(c => c.key));

  const activeColumns = useMemo(() => {
      return columnOrder.map(key => ALL_COLUMNS.find(c => c.key === key)).filter(Boolean);
  }, [columnOrder, ALL_COLUMNS]);

  const flattenMenus = (menus: Menu[], depth = 0): (Menu & { depth: number })[] => {
    let result: (Menu & { depth: number })[] = [];
    menus.forEach(m => {
      result.push({ ...m, depth });
      if (m.children) {
        result = result.concat(flattenMenus(m.children, depth + 1));
      }
    });
    return result;
  };

  const flatData = useMemo(() => {
    const all = flattenMenus(data);
    return all.filter(m => {
        const matchName = !searchName || m.name.toLowerCase().includes(searchName.toLowerCase());
        const matchDesc = !searchDescription || (m.description && m.description.toLowerCase().includes(searchDescription.toLowerCase()));
        const matchVisible = searchVisible === '' || String(m.visible) === searchVisible;
        return matchName && matchDesc && matchVisible;
    });
  }, [data, searchName, searchDescription, searchVisible]);

  const fullFlatData = useMemo(() => flattenMenus(data), [data]);
  
  const handleAdd = () => {
    setCurrentMenu({ 
        type: 'menu', 
        parentId: '0', 
        sort: 1, 
        visible: true,
        isExternal: false,
        isCache: true
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
      if (!currentMenu.name || !currentMenu.type) {
          showAppToast('请完善必要信息。', { tone: 'warning' });
          return;
      }

      const timestamp = new Date().toLocaleString();
      const menuToSave = {
          ...currentMenu,
          parentId: currentMenu.parentId === '0' ? null : currentMenu.parentId,
      } as Menu;

      if (currentMenu.id) {
          const updateNode = (nodes: Menu[]): Menu[] => {
              return nodes.map(n => {
                  if (n.id === currentMenu.id) {
                      return { 
                          ...n, 
                          ...menuToSave,
                          updateTime: timestamp,
                          updater: 'admin' 
                      };
                  }
                  if (n.children) {
                      return { ...n, children: updateNode(n.children) };
                  }
                  return n;
              });
          };
          commitMenus(updateNode(data));
      } else {
          const newId = Date.now().toString();
          const newMenu = { 
              ...menuToSave, 
              id: newId, 
              children: [],
              createTime: timestamp,
              creator: 'admin',
              updateTime: timestamp,
              updater: 'admin'
          };

          if (newMenu.parentId) {
              const addNode = (nodes: Menu[]): Menu[] => {
                  return nodes.map(n => {
                      if (n.id === newMenu.parentId) {
                          return { ...n, children: [...(n.children || []), newMenu] };
                      }
                      if (n.children) {
                          return { ...n, children: addNode(n.children) };
                      }
                      return n;
                  });
              };
              commitMenus(addNode(data));
          } else {
              commitMenus([...data, newMenu]);
          }
      }
      setIsModalOpen(false);
  };

  const confirmDelete = () => {
      if (deleteTargetId) {
          const removeNode = (nodes: Menu[]): Menu[] => {
              return nodes.filter(n => n.id !== deleteTargetId).map(n => ({
                  ...n,
                  children: n.children ? removeNode(n.children) : []
              }));
          };
          commitMenus(removeNode(data));
      }
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
  };

  const confirmStatusChange = () => {
     if (targetStatusChange) {
         const updateVisible = (items: Menu[]): Menu[] => {
             return items.map(item => {
                 if (item.id === targetStatusChange.id) {
                     return { ...item, visible: targetStatusChange.newVisible };
                 }
                 if (item.children) {
                     return { ...item, children: updateVisible(item.children) };
                 }
                 return item;
             });
         };
         commitMenus(updateVisible(data));
     }
     setConfirmOpen(false);
     setTargetStatusChange(null);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <Card className="shrink-0" bodyClassName="p-4">
         <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-4 items-center">
                <Input 
                    label="菜单名称"
                    placeholder="菜单名称" 
                    className="w-48" 
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                />
                <Input 
                    label="菜单描述"
                    placeholder="描述信息" 
                    className="w-48" 
                    value={searchDescription}
                    onChange={(e) => setSearchDescription(e.target.value)}
                />
                <Select 
                    label="状态"
                    options={[{label: '全部', value: ''}, {label: '显示', value: 'true'}, {label: '隐藏', value: 'false'}]}
                    value={searchVisible}
                    onChange={e => setSearchVisible(e.target.value)}
                    className="w-32"
                />
            </div>

            <div className="flex justify-between items-center border-t border-[var(--sys-border-primary)] pt-3">
                <div className="flex gap-3">
                    <Button variant="primary" icon={<Search size={16} />}>查询</Button>
                    <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={() => { setSearchName(''); setSearchDescription(''); setSearchVisible(''); }}>重置</Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-500 text-white" icon={<Plus size={16} />} onClick={handleAdd}>新增菜单</Button>
                    <Button className="bg-emerald-600/10 text-emerald-500 border border-emerald-600/50 hover:bg-emerald-600/20" icon={<Download size={16} />}>导出</Button>
                </div>
                <div className="flex gap-3">
                    <Button 
                        size="sm" 
                        variant="secondary" 
                        className="bg-amber-500/10 text-amber-500 border-amber-500/50 hover:bg-amber-500/20 px-2 py-1 text-xs" 
                        icon={<Settings size={14} />}
                        onClick={() => setIsColumnConfigOpen(true)}
                    >
                        列配置
                    </Button>
                </div>
            </div>
         </div>
      </Card>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <Table columns={activeColumns} data={flatData} />
        </div>
        <div className="py-2 border-t border-[var(--sys-border-primary)] flex justify-between items-center">
            <div className="text-sm text-slate-400">共 {flatData.length} 条</div>
        </div>
      </Card>

      <ColumnConfigDialog 
          isOpen={isColumnConfigOpen} 
          onClose={() => setIsColumnConfigOpen(false)} 
          allColumns={ALL_COLUMNS} 
          currentOrder={columnOrder} 
          onSave={setColumnOrder} 
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentMenu.id ? "编辑菜单" : "新增菜单"}
        footer={
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button onClick={handleSave}>确定</Button>
            </>
          }
      >
         <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="text-sm font-medium text-slate-300 mb-2 block">类型</label>
                    <div className="flex space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="type" 
                                value="dir"
                                checked={currentMenu.type === 'dir'}
                                onChange={() => setCurrentMenu({...currentMenu, type: 'dir'})}
                                className="text-blue-500 bg-slate-900 border-[var(--sys-border-secondary)]" 
                            />
                            <span className={currentMenu.type === 'dir' ? 'text-blue-400' : 'text-slate-400'}>目录</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="type" 
                                value="menu"
                                checked={currentMenu.type === 'menu'}
                                onChange={() => setCurrentMenu({...currentMenu, type: 'menu'})}
                                className="text-blue-500 bg-slate-900 border-[var(--sys-border-secondary)]" 
                            />
                            <span className={currentMenu.type === 'menu' ? 'text-blue-400' : 'text-slate-400'}>菜单</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="type" 
                                value="button"
                                checked={currentMenu.type === 'button'}
                                onChange={() => setCurrentMenu({...currentMenu, type: 'button'})}
                                className="text-blue-500 bg-slate-900 border-[var(--sys-border-secondary)]" 
                            />
                            <span className={currentMenu.type === 'button' ? 'text-blue-400' : 'text-slate-400'}>按钮</span>
                        </label>
                    </div>
                </div>

                <div className="col-span-2">
                    <Input 
                        label="上级菜单" 
                        value={fullFlatData.find(m => m.id === currentMenu.parentId)?.name || '主目录'}
                        disabled 
                        className="bg-slate-800 cursor-not-allowed"
                    />
                </div>

                <Input 
                    label="菜单名称" 
                    value={currentMenu.name || ''} 
                    onChange={e => setCurrentMenu({...currentMenu, name: e.target.value})} 
                />
                
                <Input 
                    label="显示排序" 
                    type="number"
                    value={currentMenu.sort || 0} 
                    onChange={e => setCurrentMenu({...currentMenu, sort: parseInt(e.target.value)})} 
                />

                {currentMenu.type !== 'button' && (
                    <div className="col-span-2 flex space-x-4">
                        <div className="flex-1">
                            <Input 
                                label="路由地址" 
                                value={currentMenu.path || ''} 
                                onChange={e => setCurrentMenu({...currentMenu, path: e.target.value})} 
                                placeholder="/system/menu"
                            />
                        </div>
                        <div className="flex-1">
                            <Input 
                                label="组件路径" 
                                value={currentMenu.component || ''} 
                                onChange={e => setCurrentMenu({...currentMenu, component: e.target.value})} 
                                placeholder="views/system/menu/index"
                            />
                        </div>
                    </div>
                )}

                <div className="col-span-2">
                    <Input 
                        label="权限标识" 
                        value={currentMenu.permission || ''} 
                        onChange={e => setCurrentMenu({...currentMenu, permission: e.target.value})} 
                        placeholder="system:menu:list"
                    />
                </div>

                <div className="col-span-2">
                    <label className="text-sm text-slate-400 block mb-1.5">菜单描述</label>
                    <textarea 
                        className="w-full bg-[#1e293b] border border-[var(--sys-border-primary)] rounded p-2 text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-600"
                        rows={2}
                        placeholder="请输入菜单描述..."
                        value={currentMenu.description || ''}
                        onChange={e => setCurrentMenu({...currentMenu, description: e.target.value})}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm text-slate-400">显示状态</label>
                    <div className="flex items-center gap-2">
                        <Switch 
                            checked={currentMenu.visible !== false} 
                            onChange={c => setCurrentMenu({...currentMenu, visible: c})} 
                        />
                        <span className="text-sm text-slate-300">{currentMenu.visible !== false ? '显示' : '隐藏'}</span>
                    </div>
                </div>
            </div>
         </div>
      </Modal>

      <ConfirmDialog 
         isOpen={confirmOpen} 
         message={`确定要${targetStatusChange?.newVisible ? '显示' : '隐藏'}该菜单吗？`}
         onConfirm={confirmStatusChange}
         onCancel={() => { setConfirmOpen(false); setTargetStatusChange(null); }}
      />
      
      <ConfirmDialog 
         isOpen={deleteConfirmOpen} 
         title="删除菜单"
         message="确定要删除该菜单吗？此操作不可恢复。"
         onConfirm={confirmDelete}
         onCancel={() => { setDeleteConfirmOpen(false); setDeleteTargetId(null); }}
      />
    </div>
  );
};
