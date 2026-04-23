
import React, { useState, useEffect, useMemo } from 'react';
import { Card, Table, Button, Badge, Modal, Input, Select, ConfirmDialog, SectionTitle, ColumnConfigDialog, Switch } from '../components/UI';
import { Plus, Edit2, Trash2, Search, RotateCcw, CheckSquare, Square, MinusSquare, Shield, ChevronDown, Folder, UserPlus, Lock, ChevronRight, Download, Settings, Building2, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { MOCK_ROLES, REGIONS, MOCK_DOMAINS, MOCK_MENUS, BUSINESS_TYPES } from '../constants';
import { Role, Domain, Menu } from '../types';
import { useGlobalContext } from '../GlobalContext';

// Tree Node Type
type TreeNode = {
    id: string;
    name: string;
    type: 'domain';
    data: Domain;
    children?: TreeNode[];
};

export const RoleManager: React.FC = () => {
  const { mode, currentDomain } = useGlobalContext();
  
  // --- Sidebar State ---
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [isTreeOpen, setIsTreeOpen] = useState(true);

  // --- Data State ---
  const [roleData, setRoleData] = useState<Role[]>(MOCK_ROLES);
  
  // --- Modal & Editing State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Partial<Role>>({});
  const [selectedMenuIds, setSelectedMenuIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'info' | 'menu' | 'data'>('info');
  
  // --- Search State ---
  const [searchName, setSearchName] = useState('');
  const [searchCode, setSearchCode] = useState('');

  // --- Mock Transfer Data State ---
  const [sourceData] = useState(() => {
      const list = [];
      for(let i=1; i<=8; i++) list.push({ id: `line-${i}`, name: `互联网专线-电路${i}`, category: 'BIZ_LINE' });
      for(let i=1; i<=8; i++) list.push({ id: `5g-${i}`, name: `5G切片-车间${i}`, category: 'BIZ_5G' });
      for(let i=1; i<=8; i++) list.push({ id: `idc-${i}`, name: `IDC机柜-机房${i}`, category: 'BIZ_IDC' });
      for(let i=1; i<=5; i++) list.push({ id: `comp-${i}`, name: `东数西算-节点${i}`, category: 'BIZ_COMP' });
      return list;
  });
  const [targetKeys, setTargetKeys] = useState<string[]>([]); 
  const [sourceSelected, setSourceSelected] = useState<string[]>([]);
  const [targetSelected, setTargetSelected] = useState<string[]>([]);
  const [bizCategoryFilter, setBizCategoryFilter] = useState<string>('all');

  // --- Dialogs ---
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);

  // --- Initialization ---
  useEffect(() => {
      // Set default selected domain
      if (mode === 'switching' && currentDomain) {
          setSelectedDomainId(currentDomain.id);
          setExpandedKeys(new Set([currentDomain.id]));
      } else {
          // Find root
          const root = MOCK_DOMAINS.find(d => !d.parentId);
          if (root) {
              setSelectedDomainId(root.id);
              setExpandedKeys(new Set([root.id]));
          }
      }
  }, [mode, currentDomain]);

  // --- Tree Logic ---
  const domainTree = useMemo(() => {
      const domainNodes = new Map<string, TreeNode>();
      
      let visibleDomains = MOCK_DOMAINS;
      if (mode === 'switching' && currentDomain) {
          visibleDomains = [currentDomain];
      }

      visibleDomains.forEach(d => {
          domainNodes.set(d.id, {
              id: d.id,
              name: d.name,
              type: 'domain',
              data: d,
              children: []
          });
      });

      const rootNodes: TreeNode[] = [];
      visibleDomains.forEach(d => {
          const node = domainNodes.get(d.id)!;
          if (d.parentId && domainNodes.has(d.parentId)) {
              domainNodes.get(d.parentId)!.children!.push(node);
          } else {
              rootNodes.push(node);
          }
      });

      return rootNodes;
  }, [mode, currentDomain]);

  const toggleExpand = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const newSet = new Set(expandedKeys);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setExpandedKeys(newSet);
  };

  const renderSidebarNodes = (nodes: TreeNode[], depth = 0) => {
      return nodes.map(node => {
          const isExpanded = expandedKeys.has(node.id);
          const isSelected = selectedDomainId === node.id;
          const hasChildren = node.children && node.children.length > 0;

          return (
              <div key={node.id}>
                  <div 
                      className={`flex items-center py-2 px-2 cursor-pointer transition-all rounded-md mb-1 border border-transparent ${isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:border-[var(--sys-border-primary)]'}`}
                      style={{ paddingLeft: `${depth * 16 + 8}px` }}
                      onClick={() => setSelectedDomainId(node.id)}
                  >
                      <div 
                        className={`mr-1 p-0.5 rounded hover:bg-white/20 transition-colors ${hasChildren ? 'visible' : 'invisible'}`}
                        onClick={(e) => toggleExpand(e, node.id)}
                      >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                      
                      <Building2 size={14} className={`mr-2 ${isSelected ? 'text-white' : 'text-blue-500'}`} />
                      <span className="text-sm truncate select-none font-medium">{node.name}</span>
                  </div>
                  {isExpanded && node.children && renderSidebarNodes(node.children, depth + 1)}
              </div>
          );
      });
  };

  // --- Table Data Logic ---
  const filteredRoles = useMemo(() => {
      return roleData.filter(r => {
          const matchDomain = selectedDomainId ? r.domainId === selectedDomainId : true;
          const matchName = !searchName || r.name.toLowerCase().includes(searchName.toLowerCase());
          const matchCode = !searchCode || r.code.toLowerCase().includes(searchCode.toLowerCase());
          return matchDomain && matchName && matchCode;
      });
  }, [roleData, selectedDomainId, searchName, searchCode]);

  // --- Actions ---
  const handleAdd = () => {
      if (!selectedDomainId) {
          alert("请先选择左侧归属域");
          return;
      }
      setCurrentRole({ 
          domainId: selectedDomainId, 
          regionScope: [], 
          bizCategoryScope: [] 
      });
      setSelectedMenuIds(new Set(['1', '11']));
      setActiveTab('info');
      setIsModalOpen(true);
  };

  const handleEdit = (role: Role) => {
      setCurrentRole({ ...role });
      setSelectedMenuIds(new Set(role.menuIds || []));
      setActiveTab('info');
      setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
      setDeleteId(id);
      setConfirmOpen(true);
  };

  const confirmDelete = () => {
      if (deleteId) {
          setRoleData(roleData.filter(r => r.id !== deleteId));
      }
      setConfirmOpen(false);
      setDeleteId(null);
  };

  const handleSave = () => {
      if (!currentRole.name || !currentRole.code) {
          alert("请完善角色基本信息");
          return;
      }

      const roleToSave = {
          ...currentRole,
          menuIds: Array.from(selectedMenuIds)
      } as Role;

      if (roleToSave.id) {
          setRoleData(roleData.map(r => r.id === roleToSave.id ? roleToSave : r));
      } else {
          const newRole = { 
              ...roleToSave, 
              id: Date.now().toString(),
          } as Role;
          setRoleData([...roleData, newRole]);
      }
      setIsModalOpen(false);
  };

  // --- Column Defs ---
  const ALL_COLUMNS = useMemo(() => [
    { key: 'name', header: '角色名称', accessor: 'name', width: '20%' },
    { key: 'code', header: '角色编码', accessor: (row: Role) => <Badge color="gray">{row.code}</Badge>, width: '15%' },
    { 
        key: 'desc', header: '描述', 
        accessor: (row: Role) => <span className="text-slate-400 text-xs truncate max-w-[200px] block">{row.description}</span>,
        width: '25%' 
    },
    { 
        key: 'domain', header: '所属域', 
        accessor: (row: Role) => MOCK_DOMAINS.find(d => d.id === row.domainId)?.name || row.domainId,
        width: '15%'
    },
    {
      key: 'action', header: '操作',
      accessor: (row: Role) => (
        <div className="flex space-x-2 justify-center">
          <Button size="sm" variant="ghost" className="!text-blue-500 hover:!text-blue-400" icon={<Edit2 size={14} />} onClick={() => handleEdit(row)}>配置</Button>
          <Button size="sm" variant="ghost" className="!text-red-500 hover:!text-red-400" icon={<Trash2 size={14} />} onClick={() => handleDelete(row.id)}>删除</Button>
        </div>
      ),
      width: '180px'
    }
  ], []);

  const [columnOrder, setColumnOrder] = useState(ALL_COLUMNS.map(c => c.key));
  const activeColumns = useMemo(() => columnOrder.map(key => ALL_COLUMNS.find(c => c.key === key)).filter(Boolean), [columnOrder, ALL_COLUMNS]);

  // --- Helper: Menu Tree Logic ---
  const renderMenuTree = (menus: Menu[], depth = 0) => {
      const toggleMenu = (menu: Menu, checked: boolean) => {
          const newSelected = new Set(selectedMenuIds);
          // Helper to recursively select/deselect children
          const toggleChildren = (m: Menu, isSelect: boolean) => {
              if (isSelect) newSelected.add(m.id);
              else newSelected.delete(m.id);
              if (m.children) m.children.forEach(c => toggleChildren(c, isSelect));
          };
          toggleChildren(menu, checked);
          
          // If selecting, also select parents
          if (checked) {
              const findParents = (targetId: string, nodes: Menu[], path: string[] = []): string[] => {
                  for (const n of nodes) {
                      if (n.id === targetId) return path;
                      if (n.children) {
                          const res = findParents(targetId, n.children, [...path, n.id]);
                          if (res.length) return res;
                      }
                  }
                  return [];
              };
              findParents(menu.id, MOCK_MENUS).forEach(pid => newSelected.add(pid));
          }
          setSelectedMenuIds(newSelected);
      };

      return menus.map(menu => {
          const isChecked = selectedMenuIds.has(menu.id);
          // Simplified indeterminate check for UI speed
          const isIndeterminate = !isChecked && menu.children && menu.children.some(c => selectedMenuIds.has(c.id));

          return (
              <div key={menu.id}>
                  <div 
                      className={`flex items-center space-x-2 py-1.5 cursor-pointer hover:bg-slate-800 rounded px-2 transition-colors`}
                      style={{ paddingLeft: `${depth * 20 + 8}px` }}
                      onClick={() => toggleMenu(menu, !isChecked)}
                  >
                      {isChecked ? <CheckSquare size={16} className="text-blue-500 shrink-0" /> : 
                       (isIndeterminate ? <MinusSquare size={16} className="text-blue-500 shrink-0" /> : <Square size={16} className="text-slate-500 shrink-0" />)}
                      <span className={`${isChecked || isIndeterminate ? 'text-white' : 'text-slate-400'} text-sm select-none`}>{menu.name}</span>
                  </div>
                  {menu.children && renderMenuTree(menu.children, depth + 1)}
              </div>
          );
      });
  };

  // --- Helper: Data Scope Logic ---
  const isAllRegionsSelected = (currentRole.regionScope?.length || 0) === REGIONS.length;
  const toggleAllRegions = () => {
      setCurrentRole({ ...currentRole, regionScope: isAllRegionsSelected ? [] : REGIONS.map(r => r.code) });
  };
  const toggleRegion = (code: string) => {
      const current = currentRole.regionScope || [];
      const newScope = current.includes(code) ? current.filter(c => c !== code) : [...current, code];
      setCurrentRole({ ...currentRole, regionScope: newScope });
  };

  const filteredSourceData = useMemo(() => {
      let res = sourceData.filter(d => !targetKeys.includes(d.id));
      if (bizCategoryFilter !== 'all') res = res.filter(d => d.category === bizCategoryFilter);
      return res;
  }, [sourceData, targetKeys, bizCategoryFilter]);

  const moveToRight = () => {
      setTargetKeys([...targetKeys, ...sourceSelected]);
      setSourceSelected([]);
  };
  const moveToLeft = () => {
      setTargetKeys(targetKeys.filter(k => !targetSelected.includes(k)));
      setTargetSelected([]);
  };

  const selectedDomainName = MOCK_DOMAINS.find(d => d.id === selectedDomainId)?.name || '未选择';

  return (
    <div className="h-full flex gap-4 overflow-hidden">
        {/* Left Sidebar: Domain Tree */}
        <div className={`flex flex-col transition-all duration-300 ${isTreeOpen ? 'w-72' : 'w-10'} shrink-0`}>
            {isTreeOpen ? (
                <Card className="h-full flex flex-col" title="组织机构" action={
                    <button onClick={() => setIsTreeOpen(false)} title="收起" className="text-slate-400 hover:text-white transition-colors">
                        <ChevronsLeft size={16}/>
                    </button>
                }>
                    <div className="mb-3">
                        <Input placeholder="搜索域..." className="text-xs h-8" prefix={<Search size={14}/>} />
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
                        {renderSidebarNodes(domainTree)}
                    </div>
                </Card>
            ) : (
                <div 
                    className="h-full bg-[#1e293b] border border-[var(--sys-border-primary)] rounded-lg flex flex-col items-center py-4 cursor-pointer hover:bg-slate-800 hover:border-blue-500/50 transition-colors"
                    onClick={() => setIsTreeOpen(true)}
                    title="展开组织机构"
                >
                    <ChevronsRight size={16} className="text-blue-500 mb-4" />
                    <span className="text-xs text-slate-400 [writing-mode:vertical-rl] tracking-[0.3em] font-medium select-none">组织机构</span>
                </div>
            )}
        </div>

        {/* Right Content: Role List */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <Card className="shrink-0" bodyClassName="p-4">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-4 items-center">
                        <Input label="角色名称" placeholder="搜索角色名称" className="w-48" value={searchName} onChange={e => setSearchName(e.target.value)} />
                        <Input label="角色编码" placeholder="搜索角色编码" className="w-48" value={searchCode} onChange={e => setSearchCode(e.target.value)} />
                    </div>
                    <div className="flex justify-between items-center border-t border-[var(--sys-border-primary)] pt-3">
                        <div className="flex gap-3">
                            <Button variant="primary" icon={<Search size={16} />}>查询</Button>
                            <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={() => { setSearchName(''); setSearchCode(''); }}>重置</Button>
                            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white" icon={<UserPlus size={16} />} onClick={handleAdd}>新增角色</Button>
                            <Button className="bg-emerald-600/10 text-emerald-500 border border-emerald-600/50 hover:bg-emerald-600/20" icon={<Download size={16} />}>导出</Button>
                        </div>
                        <div className="flex gap-3">
                            <Button size="sm" variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/50 hover:bg-amber-500/20 px-2 py-1 text-xs" icon={<Settings size={14} />} onClick={() => setIsColumnConfigOpen(true)}>
                                列配置
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="flex-1 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center px-4 py-2 border-b border-[var(--sys-border-primary)] bg-slate-900/20">
                     <span className="text-xs text-slate-500">当前归属域: <span className="text-blue-400 font-medium">{selectedDomainName}</span></span>
                </div>
                <div className="flex-1 overflow-auto">
                    <Table columns={activeColumns} data={filteredRoles} keyField="id" />
                </div>
            </Card>
        </div>

        <ColumnConfigDialog 
            isOpen={isColumnConfigOpen} onClose={() => setIsColumnConfigOpen(false)} 
            allColumns={ALL_COLUMNS} currentOrder={columnOrder} onSave={setColumnOrder} 
        />

        {/* Add/Edit Modal */}
        <Modal
            isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
            title={currentRole.id ? "配置角色权限" : "新增角色"}
            size="lg"
            footer={
                <>
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>取消</Button>
                  <Button onClick={handleSave}>保存配置</Button>
                </>
            }
        >
            <div className="h-[550px] flex flex-col">
                {/* Tabs */}
                <div className="flex border-b border-[var(--sys-border-primary)] mb-4 shrink-0 bg-[var(--sys-bg-header)] -mx-8 px-8 sticky top-0 z-10">
                    {(['info', 'menu', 'data'] as const).map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                        >
                            {tab === 'info' && '基本信息'}
                            {tab === 'menu' && '菜单权限'}
                            {tab === 'data' && '数据权限'}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                    {/* 1. Basic Info */}
                    {activeTab === 'info' && (
                        <div className="space-y-6 max-w-2xl mx-auto mt-4">
                             <SectionTitle title="角色基础信息" />
                             <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <Input label="角色名称" value={currentRole.name || ''} onChange={e => setCurrentRole({...currentRole, name: e.target.value})} placeholder="请输入角色名称" />
                                <Input label="角色编码" value={currentRole.code || ''} onChange={e => setCurrentRole({...currentRole, code: e.target.value})} placeholder="ROLE_..." disabled={!!currentRole.id}/>
                                <div className="relative">
                                    <Select 
                                        label="所属域" 
                                        options={MOCK_DOMAINS.map(d => ({ label: d.name, value: d.id }))}
                                        value={currentRole.domainId}
                                        disabled={true} 
                                        className="opacity-60 cursor-not-allowed bg-slate-800"
                                    />
                                    <div className="absolute right-8 top-9 text-slate-500 pointer-events-none flex items-center gap-1">
                                        <Lock size={12} /> <span className="text-xs">锁定</span>
                                    </div>
                                </div>
                                <Input label="描述" value={currentRole.description || ''} onChange={e => setCurrentRole({...currentRole, description: e.target.value})} />
                            </div>
                        </div>
                    )}
                    {/* 2. Menu Permissions */}
                    {activeTab === 'menu' && (
                        <div className="space-y-4">
                            <div className="bg-blue-900/10 border border-blue-900/30 rounded p-3 text-xs text-blue-300 mb-2 flex items-center gap-2">
                                 <CheckSquare size={14} /> 提示：勾选该角色可访问的菜单资源。系统支持父子菜单联动选择。
                            </div>
                            <div className="border border-[var(--sys-border-primary)] rounded-lg p-5 bg-[#1e293b]/30 min-h-[350px]">
                                {renderMenuTree(MOCK_MENUS)}
                            </div>
                        </div>
                    )}
                    {/* 3. Data Permissions */}
                    {activeTab === 'data' && (
                        <div className="space-y-6">
                            {/* Region Scope */}
                            <div className="bg-slate-800/30 p-5 rounded-lg border border-[var(--sys-border-primary)]">
                                <div className="flex justify-between items-center mb-4">
                                    <SectionTitle title="区域范围 (Region Scope)" className="mb-0" />
                                    <label className="flex items-center space-x-2 cursor-pointer text-xs text-blue-400 hover:text-blue-300 select-none bg-blue-900/20 px-2 py-1 rounded">
                                        <input type="checkbox" className="rounded bg-slate-900 border-[var(--sys-border-secondary)] text-blue-500" checked={isAllRegionsSelected} onChange={toggleAllRegions} />
                                        <span>全选所有区域</span>
                                    </label>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    {REGIONS.slice(0, 16).map(reg => (
                                        <label key={reg.code} className="flex items-center space-x-2 cursor-pointer hover:text-blue-400 group">
                                            <input type="checkbox" className="rounded bg-slate-900 border-[var(--sys-border-secondary)] text-blue-500" checked={currentRole.regionScope?.includes(reg.code) || false} onChange={() => toggleRegion(reg.code)} />
                                            <span className="text-sm text-slate-400 group-hover:text-slate-200">{reg.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                             {/* Business Scope (Transfer) */}
                             <div className="bg-slate-800/30 p-5 rounded-lg border border-[var(--sys-border-primary)]">
                                <SectionTitle title="业务范围 (Business Scope)" />
                                <div className="flex h-[320px] gap-4">
                                    {/* Source Panel */}
                                    <div className="flex-1 border border-[var(--sys-border-primary)] rounded-lg flex flex-col bg-[var(--sys-bg-header)]">
                                        <div className="p-2 border-b border-[var(--sys-border-primary)] bg-slate-800/50 rounded-t-lg flex flex-col gap-2">
                                            <div className="flex justify-between items-center px-1 pt-1">
                                                <span className="text-xs font-semibold text-slate-300">待选业务</span>
                                                <span className="text-xs text-slate-500">{sourceSelected.length} 选中</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1 pb-1">
                                                <button onClick={() => setBizCategoryFilter('all')} className={`px-2 py-1 text-[10px] rounded whitespace-nowrap transition-colors border ${bizCategoryFilter === 'all' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-800 border-[var(--sys-border-secondary)] text-slate-400 hover:border-[var(--sys-border-secondary)]'}`}>全部</button>
                                                {BUSINESS_TYPES.map(bt => (
                                                    <button key={bt.code} onClick={() => setBizCategoryFilter(bt.code)} className={`px-2 py-1 text-[10px] rounded whitespace-nowrap transition-colors border ${bizCategoryFilter === bt.code ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-800 border-[var(--sys-border-secondary)] text-slate-400 hover:border-[var(--sys-border-secondary)]'}`}>{bt.name}</button>
                                                ))}
                                            </div>
                                            <Input placeholder="搜索业务实例..." className="text-xs py-1.5 h-8" />
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                            {filteredSourceData.map(item => (
                                                <div key={item.id} className={`flex items-center p-2 rounded hover:bg-slate-800 cursor-pointer ${sourceSelected.includes(item.id) ? 'bg-blue-600/20' : ''}`} onClick={() => { sourceSelected.includes(item.id) ? setSourceSelected(sourceSelected.filter(id => id !== item.id)) : setSourceSelected([...sourceSelected, item.id]) }}>
                                                    <input type="checkbox" checked={sourceSelected.includes(item.id)} readOnly className="mr-2 rounded bg-slate-900 border-[var(--sys-border-secondary)] pointer-events-none" />
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-sm truncate text-slate-300">{item.name}</span>
                                                        <span className="text-[10px] text-slate-500">{BUSINESS_TYPES.find(b => b.code === item.category)?.name}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex flex-col justify-center gap-3 px-2">
                                        <Button size="sm" variant="secondary" onClick={moveToRight} disabled={sourceSelected.length === 0}><ChevronRight size={16} /></Button>
                                        <Button size="sm" variant="secondary" onClick={moveToLeft} disabled={targetSelected.length === 0} className="rotate-180"><ChevronRight size={16} /></Button>
                                    </div>
                                    {/* Target Panel */}
                                    <div className="flex-1 border border-[var(--sys-border-primary)] rounded-lg flex flex-col bg-[var(--sys-bg-header)]">
                                        <div className="p-2 border-b border-[var(--sys-border-primary)] bg-slate-800/50 rounded-t-lg flex justify-between items-center h-[90px]">
                                            <span className="text-xs font-semibold text-slate-300 pl-1">已授权业务 ({targetKeys.length})</span>
                                            <Button size="sm" variant="ghost" className="text-red-400 text-xs px-2 h-6" onClick={() => setTargetKeys([])}>清空</Button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                            {sourceData.filter(d => targetKeys.includes(d.id)).map(item => (
                                                <div key={item.id} className={`flex items-center p-2 rounded hover:bg-slate-800 cursor-pointer ${targetSelected.includes(item.id) ? 'bg-blue-600/20' : ''}`} onClick={() => { targetSelected.includes(item.id) ? setTargetSelected(targetSelected.filter(id => id !== item.id)) : setTargetSelected([...targetSelected, item.id]) }}>
                                                    <input type="checkbox" checked={targetSelected.includes(item.id)} readOnly className="mr-2 rounded bg-slate-900 border-[var(--sys-border-secondary)] pointer-events-none" />
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-sm truncate text-slate-300">{item.name}</span>
                                                        <span className="text-[10px] text-slate-500">{BUSINESS_TYPES.find(b => b.code === item.category)?.name}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>

        <ConfirmDialog 
            isOpen={confirmOpen} title="删除角色" message="确定要删除该角色吗？此操作不可恢复。"
            onConfirm={confirmDelete} onCancel={() => { setConfirmOpen(false); setDeleteId(null); }}
        />
    </div>
  );
};
