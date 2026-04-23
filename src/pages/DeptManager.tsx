
import React, { useState, useMemo, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Input, Select, Switch, ConfirmDialog, Pagination, SectionTitle, ColumnConfigDialog } from '../components/UI';
import { Plus, Edit2, Trash2, Search, RotateCcw, Folder, ChevronDown, ChevronRight, Phone, Mail, User, Grid, RefreshCcw, Settings, Lock, Building2, Download, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { MOCK_DEPTS, MOCK_DOMAINS } from '../constants';
import { Department, Domain } from '../types';
import { useGlobalContext } from '../GlobalContext';

// Unified Node Type for the Sidebar
type MixedNode = {
    id: string;
    name: string;
    type: 'domain' | 'dept';
    data: Domain | Department;
    children?: MixedNode[];
};

export const DeptManager: React.FC = () => {
  const { mode, currentDomain } = useGlobalContext();
  
  // -- Selection State --
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [isTreeOpen, setIsTreeOpen] = useState(true);

  // -- Data State (Departments) --
  const [deptData, setDeptData] = useState<Department[]>(MOCK_DEPTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedTableKeys, setExpandedTableKeys] = useState<Set<string>>(new Set(['1', '11', '12'])); 

  // Search State
  const [searchName, setSearchName] = useState('');
  const [searchStatus, setSearchStatus] = useState('');

  // Edit/Add State
  const [currentDept, setCurrentDept] = useState<Partial<Department>>({});

  // Confirm Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetStatusChange, setTargetStatusChange] = useState<{ id: string, newStatus: 'active' | 'inactive' } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Column Config
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);

  const toggleTableExpand = (id: string) => {
      const newSet = new Set(expandedTableKeys);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setExpandedTableKeys(newSet);
  };

  const handleEdit = (dept: Department) => {
      setCurrentDept({ ...dept });
      setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
      setDeleteTargetId(id);
      setDeleteConfirmOpen(true);
  };

  const initiateStatusChange = (dept: Department, checked: boolean) => {
      setTargetStatusChange({ id: dept.id, newStatus: checked ? 'active' : 'inactive' });
      setConfirmOpen(true);
  };

  // --- Column Defs ---
  const ALL_COLUMNS = useMemo(() => [
      {
          key: 'name', header: '部门名称',
          accessor: (row: any) => (
              <div style={{ paddingLeft: `${row.depth * 24}px` }} className="flex items-center text-left">
                  {row.children && row.children.length > 0 ? (
                      <button onClick={() => toggleTableExpand(row.id)} className="mr-2 text-slate-400 hover:text-white">
                          {expandedTableKeys.has(row.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                  ) : <span className="w-[22px]"></span>}
                  <Folder size={16} className="mr-2 text-blue-500" />
                  <span className="text-slate-200 font-medium">{row.name}</span>
              </div>
          ),
          width: '30%'
      },
      { key: 'leader', header: '负责人', accessor: 'leader', width: '10%' },
      { key: 'phone', header: '联系电话', accessor: 'phone', width: '10%' },
      { key: 'sort', header: '排序', accessor: 'sort', width: '8%' },
      {
          key: 'status', header: '状态',
          accessor: (row: Department) => (
              <div className="flex justify-center">
                  <Switch 
                      checked={row.status === 'active'} 
                      onChange={(c) => initiateStatusChange(row, c)} 
                  />
              </div>
          ),
          width: '8%'
      },
      { key: 'createTime', header: '创建时间', accessor: (row: Department) => <span className="text-xs text-slate-400 block w-[80px] mx-auto">{row.createTime?.split(' ')[0]}<br/>{row.createTime?.split(' ')[1]}</span> },
      { key: 'creator', header: '创建人', accessor: 'creator' },
      { key: 'updateTime', header: '更新时间', accessor: (row: Department) => <span className="text-xs text-slate-400 block w-[80px] mx-auto">{row.updateTime?.split(' ')[0]}<br/>{row.updateTime?.split(' ')[1]}</span> },
      { key: 'updater', header: '更新人', accessor: 'updater' },
      {
          key: 'action', header: '操作',
          accessor: (row: Department) => (
              <div className="flex space-x-2 justify-center">
                  <Button size="sm" variant="ghost" className="!text-blue-500 hover:!text-blue-400" icon={<Edit2 size={14} />} onClick={() => handleEdit(row)}>编辑</Button>
                  <Button size="sm" variant="ghost" className="!text-green-500 hover:!text-green-400" icon={<Plus size={14} />} onClick={() => handleAdd(row.id)}>新增下级</Button>
                  <Button size="sm" variant="ghost" className="!text-red-500 hover:!text-red-400" icon={<Trash2 size={14} />} onClick={() => handleDelete(row.id)}>删除</Button>
              </div>
          ),
          width: '220px'
      }
  ], [expandedTableKeys]);

  const [columnOrder, setColumnOrder] = useState(ALL_COLUMNS.map(c => c.key));

  const activeColumns = useMemo(() => {
      return columnOrder.map(key => ALL_COLUMNS.find(c => c.key === key)).filter(Boolean);
  }, [columnOrder, ALL_COLUMNS]);

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

  // --- Left Tree Logic (Mixed Domain + Depts) ---
  const mixedTree = useMemo(() => {
      // 1. Convert Domains to MixedNodes
      const domainNodes = new Map<string, MixedNode>();
      
      // Filter domains based on mode
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

      const rootNodes: MixedNode[] = [];

      // 2. Build Domain Hierarchy
      visibleDomains.forEach(d => {
          const node = domainNodes.get(d.id)!;
          if (d.parentId && domainNodes.has(d.parentId)) {
              domainNodes.get(d.parentId)!.children!.push(node);
          } else {
              rootNodes.push(node);
          }
      });

      // 3. Attach Departments to Domains
      const convertDept = (d: Department): MixedNode => ({
          id: d.id,
          name: d.name,
          type: 'dept',
          data: d,
          children: d.children ? d.children.map(convertDept) : []
      });

      domainNodes.forEach((node) => {
          const roots = deptData.filter(d => d.domainId === node.id);
          const deptNodes = roots.map(convertDept);
          node.children = [...(node.children || []), ...deptNodes];
      });

      return rootNodes;
  }, [mode, currentDomain, deptData]);

  const toggleExpand = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const newSet = new Set(expandedKeys);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setExpandedKeys(newSet);
  };

  const handleSidebarClick = (node: MixedNode) => {
      if (node.type === 'domain') {
          setSelectedDomainId(node.id);
      } else {
          const domainId = (node.data as Department).domainId;
          setSelectedDomainId(domainId);
      }
  };

  const renderSidebarNodes = (nodes: MixedNode[], depth = 0) => {
      return nodes.map(node => {
          const isExpanded = expandedKeys.has(node.id);
          const isSelected = selectedDomainId === (node.type === 'domain' ? node.id : (node.data as Department).domainId) && node.type === 'domain'; 
          
          const hasChildren = node.children && node.children.length > 0;

          return (
              <div key={node.id}>
                  <div 
                      className={`flex items-center py-2 px-2 cursor-pointer transition-all rounded-md mb-1 border border-transparent ${isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:border-[var(--sys-border-primary)]'}`}
                      style={{ paddingLeft: `${depth * 16 + 8}px` }}
                      onClick={() => handleSidebarClick(node)}
                  >
                      <div 
                        className={`mr-1 p-0.5 rounded hover:bg-white/20 transition-colors ${hasChildren ? 'visible' : 'invisible'}`}
                        onClick={(e) => toggleExpand(e, node.id)}
                      >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                      
                      {node.type === 'domain' ? (
                          <Building2 size={14} className={`mr-2 ${isSelected ? 'text-white' : 'text-blue-500'}`} />
                      ) : (
                          <Folder size={14} className="mr-2 text-yellow-500" />
                      )}
                      
                      <span className="text-sm truncate select-none font-medium">{node.name}</span>
                  </div>
                  {isExpanded && node.children && renderSidebarNodes(node.children, depth + 1)}
              </div>
          );
      });
  };

  // --- Right Content Logic (Department Tree Table) ---
  const domainDepartments = useMemo(() => {
      return deptData.filter(d => d.domainId === selectedDomainId);
  }, [deptData, selectedDomainId]);

  const flattenDepts = (depts: Department[], depth = 0): (Department & { depth: number })[] => {
    let result: (Department & { depth: number })[] = [];
    depts.forEach(d => {
      result.push({ ...d, depth });
      if (d.children && expandedTableKeys.has(d.id)) {
        result = result.concat(flattenDepts(d.children, depth + 1));
      }
    });
    return result;
  };

  const flatData = useMemo(() => {
      const visibleNodes = flattenDepts(domainDepartments);
      return visibleNodes.filter(d => {
          const matchName = !searchName || d.name.toLowerCase().includes(searchName.toLowerCase());
          const matchStatus = !searchStatus || d.status === searchStatus;
          return matchName && matchStatus;
      });
  }, [domainDepartments, expandedTableKeys, searchName, searchStatus]);

  const getAllNodes = (depts: Department[]): Department[] => {
      let res: Department[] = [];
      depts.forEach(d => {
          res.push(d);
          if (d.children) res = res.concat(getAllNodes(d.children));
      });
      return res;
  };

  const handleAdd = (parentId: string | null = null) => {
      if (!selectedDomainId) {
          alert("请先选择左侧组织机构(域)");
          return;
      }
      setCurrentDept({
          parentId,
          domainId: selectedDomainId,
          status: 'active',
          sort: 1
      });
      setIsModalOpen(true);
  };

  const handleSave = () => {
      if (!currentDept.name || !currentDept.leader) {
          alert("请完善基本信息");
          return;
      }

      const timestamp = new Date().toLocaleString();
      const deptToSave = { 
          ...currentDept,
          updater: 'admin',
          updateTime: timestamp
      } as Department;

      const updateInTree = (nodes: Department[]): Department[] => {
          return nodes.map(n => {
              if (n.id === currentDept.id) {
                  return { ...n, ...deptToSave, children: n.children }; 
              }
              if (n.children) {
                  return { ...n, children: updateInTree(n.children) };
              }
              return n;
          });
      };

      const addInTree = (nodes: Department[], newItem: Department): Department[] => {
          return nodes.map(n => {
              if (n.id === newItem.parentId) {
                  return { ...n, children: [...(n.children || []), newItem] };
              }
              if (n.children) {
                  return { ...n, children: addInTree(n.children, newItem) };
              }
              return n;
          });
      };

      if (currentDept.id) {
          setDeptData(updateInTree(deptData));
      } else {
          const newDept = {
              ...deptToSave,
              id: Date.now().toString(),
              createTime: timestamp,
              creator: 'admin',
              children: []
          } as Department;
          
          if (newDept.parentId) {
              setDeptData(addInTree(deptData, newDept));
              setExpandedTableKeys(new Set([...expandedTableKeys, newDept.parentId]));
          } else {
              setDeptData([...deptData, newDept]);
          }
      }
      setIsModalOpen(false);
  };

  const confirmDelete = () => {
      if (deleteTargetId) {
          const removeNode = (nodes: Department[]): Department[] => {
              return nodes.filter(n => n.id !== deleteTargetId).map(n => ({
                  ...n,
                  children: n.children ? removeNode(n.children) : undefined
              }));
          };
          setDeptData(removeNode(deptData));
      }
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
  };

  const confirmStatusChange = () => {
      if (targetStatusChange) {
          const updateStatus = (nodes: Department[]): Department[] => {
              return nodes.map(n => {
                  if (n.id === targetStatusChange.id) {
                      return { ...n, status: targetStatusChange.newStatus };
                  }
                  if (n.children) {
                      return { ...n, children: updateStatus(n.children) };
                  }
                  return n;
              });
          };
          setDeptData(updateStatus(deptData));
      }
      setConfirmOpen(false);
      setTargetStatusChange(null);
  };

  const selectedDomainName = MOCK_DOMAINS.find(d => d.id === selectedDomainId)?.name || '未选择';

  return (
      <div className="h-full flex gap-4 overflow-hidden">
          {/* Left Sidebar: Mixed Tree */}
          <div className={`flex flex-col transition-all duration-300 ${isTreeOpen ? 'w-72' : 'w-10'} shrink-0`}>
              {isTreeOpen ? (
                  <Card className="h-full flex flex-col" title="组织机构" action={
                      <button onClick={() => setIsTreeOpen(false)} title="收起" className="text-slate-400 hover:text-white transition-colors">
                          <ChevronsLeft size={16}/>
                      </button>
                  }>
                      <div className="mb-3">
                          <Input placeholder="搜索组织/部门..." className="text-xs h-8" prefix={<Search size={14}/>} />
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
                          {renderSidebarNodes(mixedTree)}
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

          {/* Right Content */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              <Card className="shrink-0" bodyClassName="p-4">
                  <div className="flex flex-col gap-3">
                      {/* Row 1: Search Conditions */}
                      <div className="flex flex-wrap gap-4 items-end">
                          <Input 
                              label="部门名称"
                              placeholder="请输入部门名称"
                              className="w-48"
                              value={searchName}
                              onChange={e => setSearchName(e.target.value)}
                          />
                          <Select 
                              label="状态"
                              options={[{label: '全部', value: ''}, {label: '正常', value: 'active'}, {label: '停用', value: 'inactive'}]}
                              value={searchStatus}
                              onChange={e => setSearchStatus(e.target.value)}
                              className="w-32"
                          />
                      </div>

                      {/* Row 2: Actions */}
                      <div className="flex justify-between items-center border-t border-[var(--sys-border-primary)] pt-3">
                          <div className="flex gap-3">
                              <Button variant="primary" icon={<Search size={16}/>}>查询</Button>
                              <Button variant="secondary" icon={<RotateCcw size={16}/>} onClick={() => { setSearchName(''); setSearchStatus(''); }}>重置</Button>
                              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white" icon={<Plus size={16} />} onClick={() => handleAdd()}>新增部门</Button>
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
                  {/* Info Bar */}
                  <div className="flex justify-between items-center px-4 py-2 border-b border-[var(--sys-border-primary)] bg-slate-900/20">
                       <span className="text-xs text-slate-500">当前归属域: <span className="text-blue-400 font-medium">{selectedDomainName}</span></span>
                  </div>

                  <div className="flex-1 overflow-auto">
                      <Table columns={activeColumns} data={flatData} keyField="id" />
                  </div>
              </Card>
          </div>

          <ColumnConfigDialog 
              isOpen={isColumnConfigOpen} 
              onClose={() => setIsColumnConfigOpen(false)} 
              allColumns={ALL_COLUMNS} 
              currentOrder={columnOrder} 
              onSave={setColumnOrder} 
          />

          {/* Add/Edit Modal */}
          <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title={currentDept.id ? "编辑部门" : "新增部门"}
              size="md"
              footer={
                  <>
                      <Button variant="secondary" onClick={() => setIsModalOpen(false)}>取消</Button>
                      <Button onClick={handleSave}>确定</Button>
                  </>
              }
          >
              <div className="space-y-6">
                  <SectionTitle title="部门信息" />
                  <div className="space-y-4">
                      {/* Domain Read-only Field */}
                      <div className="relative">
                           <label className="text-sm text-slate-400 block mb-1.5">归属组织 (Domain)</label>
                           <Select 
                              options={MOCK_DOMAINS.map(d => ({ label: d.name, value: d.id }))}
                              value={currentDept.domainId}
                              disabled={true}
                              className="opacity-60 cursor-not-allowed bg-slate-800"
                           />
                           <div className="absolute right-8 top-9 text-slate-500 pointer-events-none flex items-center gap-1">
                              <Lock size={12} />
                              <span className="text-xs">锁定</span>
                           </div>
                      </div>

                      <div className="relative">
                          <Select
                              label="上级部门"
                              value={currentDept.parentId || ''}
                              onChange={e => setCurrentDept({...currentDept, parentId: e.target.value || null})}
                              options={[
                                  { label: '顶级部门', value: '' },
                                  ...getAllNodes(domainDepartments)
                                    .filter(d => d.id !== currentDept.id)
                                    .map(d => ({ label: d.name, value: d.id })),
                              ]}
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <Input 
                              label="部门名称"
                              placeholder="请输入"
                              value={currentDept.name || ''}
                              onChange={e => setCurrentDept({...currentDept, name: e.target.value})}
                          />
                          <Input 
                              label="显示排序"
                              type="number"
                              value={currentDept.sort || 0}
                              onChange={e => setCurrentDept({...currentDept, sort: parseInt(e.target.value)})}
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <Input 
                              label="负责人"
                              placeholder="负责人姓名"
                              value={currentDept.leader || ''}
                              onChange={e => setCurrentDept({...currentDept, leader: e.target.value})}
                              prefix={<User size={14}/>}
                          />
                          <Input 
                              label="联系电话"
                              placeholder="手机号码"
                              value={currentDept.phone || ''}
                              onChange={e => setCurrentDept({...currentDept, phone: e.target.value})}
                              prefix={<Phone size={14}/>}
                          />
                      </div>
                      
                      <Input 
                          label="邮箱"
                          placeholder="部门邮箱"
                          value={currentDept.email || ''}
                          onChange={e => setCurrentDept({...currentDept, email: e.target.value})}
                          prefix={<Mail size={14}/>}
                      />

                      <div className="flex flex-col gap-2">
                          <label className="text-sm text-slate-400">部门状态</label>
                          <div className="flex items-center gap-2">
                              <Switch 
                                  checked={currentDept.status === 'active'}
                                  onChange={c => setCurrentDept({...currentDept, status: c ? 'active' : 'inactive'})}
                              />
                              <span className="text-sm text-slate-300">{currentDept.status === 'active' ? '正常' : '停用'}</span>
                          </div>
                      </div>
                  </div>
              </div>
          </Modal>

          <ConfirmDialog 
              isOpen={confirmOpen} 
              message={`确定要${targetStatusChange?.newStatus === 'active' ? '启用' : '停用'}该部门吗？`}
              onConfirm={confirmStatusChange}
              onCancel={() => { setConfirmOpen(false); setTargetStatusChange(null); }}
          />
          
          <ConfirmDialog 
              isOpen={deleteConfirmOpen} 
              title="删除部门"
              message="确定要删除该部门吗？如果有下级部门将一并删除。"
              onConfirm={confirmDelete}
              onCancel={() => { setDeleteConfirmOpen(false); setDeleteTargetId(null); }}
          />
      </div>
  );
};
