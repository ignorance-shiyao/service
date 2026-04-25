import React, { useState, useMemo, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Input, Select, Switch, ConfirmDialog, SectionTitle, ColumnConfigDialog } from '../components/UI';
import { Plus, Edit2, Trash2, Search, RotateCcw, UserPlus, Folder, ChevronDown, ChevronRight, User as UserIcon, Mail, Phone, Shield, Lock, Eye, CheckSquare, Check, AlertTriangle, RefreshCcw, Settings, Grid, MoreHorizontal, Building2, GitBranch, Download, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { User, Domain, Role, Menu, Department } from '../types';
import { useGlobalContext } from '../GlobalContext';
import { useNavigate, useMatch } from 'react-router-dom';
import { showAppToast } from '../components/AppFeedback';
import { useAppData } from '../context/AppDataContext';

// Unified Node Type for the Sidebar
type MixedNode = {
    id: string;
    name: string;
    type: 'domain' | 'dept';
    data: Domain | Department;
    children?: MixedNode[];
};

export const UserManager: React.FC = () => {
  const { mode, currentDomain } = useGlobalContext();
  const { users, roles, domains, menus, regions, businessTypes, depts } = useAppData();
  const navigate = useNavigate();
  
  const [selectedNode, setSelectedNode] = useState<{ id: string, type: 'domain' | 'dept' } | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [isTreeOpen, setIsTreeOpen] = useState(true);

  const [userData, setUserData] = useState<User[]>([]);
  
  const [searchUsername, setSearchUsername] = useState('');
  const [searchRoleId, setSearchRoleId] = useState(''); 
  const [searchDomainId, setSearchDomainId] = useState(''); 
  const [searchStatus, setSearchStatus] = useState('');

  // Routing Matches
  const matchAdd = useMatch('/system/user/add');
  const matchEdit = useMatch('/system/user/edit/:id');
  const isModalOpen = !!matchAdd || !!matchEdit;

  const [currentUser, setCurrentUser] = useState<Partial<User>>({});
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());

  const [auditUser, setAuditUser] = useState<User | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetStatusChange, setTargetStatusChange] = useState<{ id: string, newStatus: 'active' | 'locked' } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Column Config
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);

  useEffect(() => {
    setUserData(users);
  }, [users]);

  // Sync Modal State with Route
  useEffect(() => {
      if (matchAdd) {
          // Initialize for Add
          // Inherit context from selected node if valid
          let baseDomainId = '';
          let deptId = '';
          
          if (selectedNode) {
              if (selectedNode.type === 'domain') {
                  baseDomainId = selectedNode.id;
              } else if (selectedNode.type === 'dept') {
                  const dept = depts.find(d => d.id === selectedNode.id);
                  if (dept) {
                      baseDomainId = dept.domainId;
                      deptId = dept.id;
                  }
              }
          }

          if (!baseDomainId) {
              // If no selection, force back or handle empty
              // For simplicity, if no selection, user will see empty/locked domain dropdown or we prompt.
              // Here we initialize blank.
          }

          setCurrentUser({ 
              status: 'active', 
              baseDomainId: baseDomainId,
              deptId: deptId
          });
          setSelectedRoleIds(new Set());
      } else if (matchEdit) {
          const id = matchEdit.params.id;
          const user = userData.find(u => u.id === id);
          if (user) {
              setCurrentUser({ ...user });
              const roleIds = user.roles
                .filter(r => r.targetDomainId === user.baseDomainId) 
                .map(r => r.roleId);
              setSelectedRoleIds(new Set(roleIds));
          } else {
              navigate('/system/user');
          }
      } else {
          // Modal closed
          setCurrentUser({});
      }
  }, [matchAdd, matchEdit, userData, selectedNode, navigate]);

  const handleEdit = (user: User) => {
      navigate(`/system/user/edit/${user.id}`);
  };

  const handleDelete = (id: string) => {
      setDeleteTargetId(id);
      setDeleteConfirmOpen(true);
  };

  const initiateStatusChange = (user: User, checked: boolean) => {
    setTargetStatusChange({
        id: user.id,
        newStatus: checked ? 'active' : 'locked'
    });
    setConfirmOpen(true);
  };

  // --- Column Defs ---
  const ALL_COLUMNS = useMemo(() => [
    { 
        key: 'serial', header: '序号', accessor: 'serialNumber', width: '60px' 
    },
    { 
        key: 'user', header: '用户', 
        accessor: (row: User) => (
            <div className="flex items-center gap-3 text-left">
                 <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-[var(--sys-border-secondary)] text-slate-300 shrink-0">
                      <UserIcon size={14} />
                 </div>
                 <div className="text-sm font-medium text-slate-200">{row.username}</div>
            </div>
        )
    },
    { key: 'realName', header: '真实姓名', accessor: 'realName' },
    { 
        key: 'dept', header: '所属部门', 
        accessor: (row: User) => {
            const deptName = row.deptId ? (depts.find(d => d.id === row.deptId)?.name || row.deptId) : null;
            return (
                <div className="flex items-center justify-center text-slate-300 text-sm">
                    {deptName ? (
                        <>
                            <GitBranch size={12} className="mr-1.5 text-slate-500" />
                            {deptName}
                        </>
                    ) : (
                        <span className="text-slate-500">-</span>
                    )}
                </div>
            );
        }
    },
    { 
        key: 'role', header: '所属角色', 
        accessor: (row: User) => {
            const roleNames = row.roles.map(r => roles.find(mr => mr.id === r.roleId)?.name).filter(Boolean);
            if (roleNames.length === 0) return <span className="text-slate-500 text-xs">-</span>;
            return (
                <div className="flex flex-wrap gap-1 justify-center">
                    {roleNames.map((r, i) => <Badge key={i} color="blue">{r}</Badge>)}
                </div>
            )
        }
    },
    { 
        key: 'domain', header: '所属域', 
        accessor: (row: User) => (
            <div className="flex items-center text-slate-300 text-sm justify-center">
                <Folder size={12} className="mr-1.5 text-blue-500"/>
                {domains.find(d => d.id === row.baseDomainId)?.name}
            </div>
        )
    },
    { key: 'createTime', header: '创建时间', accessor: (row: User) => <span className="text-xs text-slate-400 block w-[80px] mx-auto">{row.createTime?.split(' ')[0]}<br/>{row.createTime?.split(' ')[1]}</span> },
    { key: 'creator', header: '创建人', accessor: 'creator' },
    { key: 'updateTime', header: '更新时间', accessor: (row: User) => <span className="text-xs text-slate-400 block w-[80px] mx-auto">{row.updateTime?.split(' ')[0]}<br/>{row.updateTime?.split(' ')[1]}</span> },
    { key: 'updater', header: '更新人', accessor: 'updater' },
    { 
        key: 'status', header: '状态', 
        accessor: (row: User) => (
            <div className="flex justify-center">
                <Switch 
                    checked={row.status === 'active'} 
                    onChange={(checked) => initiateStatusChange(row, checked)} 
                />
            </div>
        ),
        width: '80px'
    },
    {
      key: 'action', header: '操作',
      accessor: (row: User) => (
        <div className="flex space-x-2 justify-center">
          <Button size="sm" variant="ghost" className="!text-blue-500 hover:!text-blue-400" icon={<Edit2 size={14} />} onClick={() => handleEdit(row)}>编辑</Button>
          <Button size="sm" variant="ghost" className="!text-yellow-500 hover:!text-yellow-400" icon={<Eye size={14} />} onClick={() => setAuditUser(row)}>权限</Button>
          <Button size="sm" variant="ghost" className="!text-red-500 hover:!text-red-400" icon={<Trash2 size={14} />} onClick={() => handleDelete(row.id)}>删除</Button>
        </div>
      ),
      width: '200px'
    }
  ], [navigate]);

  const [columnOrder, setColumnOrder] = useState(ALL_COLUMNS.map(c => c.key));

  const activeColumns = useMemo(() => {
      return columnOrder.map(key => ALL_COLUMNS.find(c => c.key === key)).filter(Boolean);
  }, [columnOrder, ALL_COLUMNS]);

  // Initialize
  useEffect(() => {
      // Set default selected node
      if (mode === 'switching' && currentDomain) {
          setSelectedNode({ id: currentDomain.id, type: 'domain' });
          setExpandedKeys(new Set([currentDomain.id]));
          // Also set the search domain to current domain implicitly for UI consistency (though logic handles it)
          setSearchDomainId(currentDomain.id);
      } else {
          // Find root domain
          const root = domains.find(d => !d.parentId);
          if (root) {
              setSelectedNode({ id: root.id, type: 'domain' });
              setExpandedKeys(new Set([root.id]));
          }
          setSearchDomainId('');
      }
  }, [mode, currentDomain]);

  // --- Left Tree Logic (Mixed) ---
  const mixedTree = useMemo(() => {
      // 1. Convert Domains to MixedNodes
      const domainNodes = new Map<string, MixedNode>();
      
      // Filter domains based on mode
      let visibleDomains = domains;
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

      // 3. Attach Departments
      const convertDept = (d: Department): MixedNode => ({
          id: d.id,
          name: d.name,
          type: 'dept',
          data: d,
          children: d.children ? d.children.map(convertDept) : []
      });

      domainNodes.forEach((node) => {
          const domainRootDepts = depts.filter(d => d.domainId === node.id && d.parentId === null);
          const deptNodes = domainRootDepts.map(d => {
              const buildDeptTree = (root: Department): MixedNode => {
                  const children = depts.filter(child => child.parentId === root.id);
                  return {
                      id: root.id,
                      name: root.name,
                      type: 'dept',
                      data: root,
                      children: children.map(buildDeptTree)
                  };
              };
              return buildDeptTree(d);
          });
          
          node.children = [...(node.children || []), ...deptNodes];
      });

      return rootNodes;
  }, [mode, currentDomain, domains, depts]);

  const toggleExpand = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const newSet = new Set(expandedKeys);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setExpandedKeys(newSet);
  };

  const renderTreeNodes = (nodes: MixedNode[], depth = 0) => {
      return nodes.map(node => {
          const isExpanded = expandedKeys.has(node.id);
          const isSelected = selectedNode?.id === node.id;
          const hasChildren = node.children && node.children.length > 0;

          return (
              <div key={node.id}>
                  <div 
                      className={`flex items-center py-2 px-2 cursor-pointer transition-all rounded-md mb-1 border border-transparent ${isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:border-[var(--sys-border-primary)]'}`}
                      style={{ paddingLeft: `${depth * 16 + 8}px` }}
                      onClick={() => setSelectedNode({ id: node.id, type: node.type })}
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
                          <GitBranch size={14} className={`mr-2 ${isSelected ? 'text-white' : 'text-yellow-500'}`} />
                      )}
                      
                      <span className="text-sm truncate select-none font-medium">{node.name}</span>
                  </div>
                  {isExpanded && node.children && renderTreeNodes(node.children, depth + 1)}
              </div>
          );
      });
  };

  // --- Right Table Data Logic ---
  const filteredUsers = useMemo(() => {
      return userData.filter(u => {
          if (selectedNode) {
              if (selectedNode.type === 'domain') {
                  if (u.baseDomainId !== selectedNode.id) return false;
              } else {
                  if (u.deptId !== selectedNode.id) return false;
              }
          }

          const matchUser = !searchUsername || u.username.toLowerCase().includes(searchUsername.toLowerCase()) || u.realName.includes(searchUsername);
          const matchRole = !searchRoleId || u.roles.some(r => r.roleId === searchRoleId);
          const matchDomain = !searchDomainId || u.baseDomainId === searchDomainId;
          
          const matchStatus = !searchStatus || u.status === searchStatus;
          
          return matchUser && matchRole && matchDomain && matchStatus;
      });
  }, [userData, selectedNode, searchUsername, searchRoleId, searchDomainId, searchStatus]);

  // Prepared data with serial numbers
  const tableData = useMemo(() => {
      return filteredUsers.map((u, index) => ({
          ...u,
          serialNumber: index + 1
      }));
  }, [filteredUsers]);

  const handleAdd = () => {
      if (!selectedNode || selectedNode.type !== 'domain') {
          if (selectedNode?.type === 'dept') {
             // Valid for adding under a dept
             navigate('/system/user/add');
             return;
          }
          showAppToast('请先选择左侧组织机构(域)。', { tone: 'warning' });
          return;
      }
      navigate('/system/user/add');
  };

  const handleSave = () => {
      if (!currentUser.username || !currentUser.realName || !currentUser.baseDomainId) {
          showAppToast('请完善基本信息。', { tone: 'warning' });
          return;
      }

      const newRoles = Array.from(selectedRoleIds).map(rId => {
          const roleDef = roles.find(r => r.id === rId);
          return {
              roleId: rId,
              targetDomainId: currentUser.baseDomainId!,
              roleName: roleDef?.name
          };
      });

      const timestamp = new Date().toLocaleString();

      if (currentUser.id) {
          setUserData(userData.map(u => u.id === currentUser.id ? { 
              ...u, 
              ...currentUser, 
              roles: newRoles,
              updateTime: timestamp,
              updater: 'admin'
          } as User : u));
      } else {
          const newUser = {
              ...currentUser,
              id: Date.now().toString(),
              createTime: timestamp,
              creator: 'admin',
              updateTime: timestamp,
              updater: 'admin',
              roles: newRoles
          } as User;
          setUserData([...userData, newUser]);
      }
      navigate('/system/user');
  };

  const closeModal = () => {
      navigate('/system/user');
  };

  const confirmDelete = () => {
      if (deleteTargetId) {
          setUserData(userData.filter(u => u.id !== deleteTargetId));
      }
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
  };

  const confirmStatusChange = () => {
    if (targetStatusChange) {
        setUserData(userData.map(u => u.id === targetStatusChange.id ? { ...u, status: targetStatusChange.newStatus } : u));
    }
    setConfirmOpen(false);
    setTargetStatusChange(null);
  };

  // --- Helpers for Modal ---
  const getDeptOptions = (domainId: string) => {
      const domainDepts = depts.filter(d => d.domainId === domainId);
      const buildHierarchy = (parentId: string | null = null, depth = 0): {id: string, name: string, depth: number}[] => {
          const children = domainDepts.filter(d => d.parentId === parentId);
          let res: {id: string, name: string, depth: number}[] = [];
          children.forEach(c => {
              res.push({ id: c.id, name: c.name, depth });
              res = res.concat(buildHierarchy(c.id, depth + 1));
          });
          return res;
      };
      return buildHierarchy(null, 0);
  };

  const deptOptions = useMemo(() => {
      if (!currentUser.baseDomainId) return [];
      return getDeptOptions(currentUser.baseDomainId);
  }, [currentUser.baseDomainId]);

  const availableRoles = useMemo(() => {
      if (!currentUser.baseDomainId) return [];
      return roles.filter(r => r.domainId === currentUser.baseDomainId);
  }, [currentUser.baseDomainId, roles]);

  const toggleRoleSelection = (roleId: string) => {
      const newSet = new Set(selectedRoleIds);
      if (newSet.has(roleId)) newSet.delete(roleId);
      else newSet.add(roleId);
      setSelectedRoleIds(newSet);
  };

  // --- Permission Audit Helper ---
  const calculateEffectivePermissions = (user: User) => {
      const userRoles = user.roles.map(ur => roles.find(r => r.id === ur.roleId)).filter(Boolean) as Role[];
      const allMenuIds = new Set<string>();
      const allRegions = new Set<string>();
      const allBizTypes = new Set<string>();

      userRoles.forEach(role => {
          role.menuIds?.forEach(id => allMenuIds.add(id));
          role.regionScope?.forEach(r => allRegions.add(r));
          role.bizCategoryScope?.forEach(b => allBizTypes.add(b));
      });
      
      return { menus: allMenuIds, regions: allRegions, bizTypes: allBizTypes, roles: userRoles };
  };

  const renderAuditMenuTree = (menus: Menu[], accessibleIds: Set<string>, depth = 0) => {
      return menus.map(menu => {
          const hasAccess = accessibleIds.has(menu.id);
          return (
              <div key={menu.id}>
                  <div className={`flex items-center space-x-2 py-1.5 rounded px-2`} style={{ paddingLeft: `${depth * 20 + 8}px` }}>
                      {hasAccess ? <Check size={16} className="text-green-500 shrink-0" /> : <div className="w-4 h-4" /> }
                      <span className={`${hasAccess ? 'text-white font-medium' : 'text-slate-600'} text-sm select-none`}>{menu.name}</span>
                  </div>
                  {menu.children && renderAuditMenuTree(menu.children, accessibleIds, depth + 1)}
              </div>
          );
      });
  };

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
                        <Input placeholder="搜索组织..." className="text-xs h-8" prefix={<Search size={14}/>} />
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
                        {renderTreeNodes(mixedTree)}
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
            {/* 1. Search Area */}
            <Card className="shrink-0" bodyClassName="p-4">
                <div className="flex flex-col gap-3">
                    {/* Row 1: Search Conditions */}
                    <div className="flex flex-wrap gap-4 items-end">
                        <Input 
                            label="用户名/姓名"
                            placeholder="请输入" 
                            className="w-40" 
                            value={searchUsername} 
                            onChange={e => setSearchUsername(e.target.value)}
                        />
                        {/* New: Role Search */}
                        <div className="w-40">
                            <Select 
                                label="所属角色"
                                options={[{label: '全部', value: ''}, ...roles.map(r => ({label: r.name, value: r.id}))]}
                                value={searchRoleId}
                                onChange={e => setSearchRoleId(e.target.value)}
                            />
                        </div>
                        {/* New: Domain Search */}
                        <div className="w-40">
                            <Select 
                                label="所属域"
                                options={[{label: '全部', value: ''}, ...domains.map(d => ({label: d.name, value: d.id}))]}
                                value={searchDomainId}
                                onChange={e => setSearchDomainId(e.target.value)}
                                disabled={mode === 'switching'} // Lock if in switching mode
                                className={mode === 'switching' ? 'opacity-50 cursor-not-allowed' : ''}
                            />
                        </div>
                        <Select
                            label="状态"
                            options={[{label: '全部', value: ''}, {label: '启用', value: 'active'}, {label: '锁定', value: 'locked'}]}
                            value={searchStatus}
                            onChange={e => setSearchStatus(e.target.value)}
                            className="w-32"
                        />
                    </div>

                    {/* Row 2: Actions */}
                    <div className="flex justify-between items-center border-t border-[var(--sys-border-primary)] pt-3">
                        <div className="flex gap-3">
                            <Button variant="primary" icon={<Search size={16} />}>查询</Button>
                            <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={() => { setSearchUsername(''); setSearchRoleId(''); setSearchDomainId(''); setSearchStatus(''); }}>重置</Button>
                            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white" icon={<Plus size={16} />} onClick={handleAdd}>新增用户</Button>
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

            {/* 2. Table Area */}
            <Card className="flex-1 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center px-4 py-2 border-b border-[var(--sys-border-primary)] bg-slate-900/20">
                     <span className="text-xs text-slate-500">
                         当前过滤: <span className="text-blue-400 font-medium">{selectedNode ? (selectedNode.type === 'domain' ? '域' : '部门') + ' - ' + (mixedTree.find(n => n.id === selectedNode.id)?.name || depts.find(d => d.id === selectedNode.id)?.name) : '全部'}</span>
                     </span>
                </div>

                <div className="flex-1 overflow-auto">
                    <Table columns={activeColumns} data={tableData} keyField="id" />
                </div>
                <div className="py-2 border-t border-[var(--sys-border-primary)] flex justify-between items-center">
                    <div className="text-sm text-slate-400">共 {filteredUsers.length} 条记录</div>
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
            onClose={closeModal}
            title={currentUser.id ? "编辑用户" : "新增用户"}
            size="lg"
            footer={
                <>
                  <Button variant="secondary" onClick={closeModal}>取消</Button>
                  <Button onClick={handleSave}>确定</Button>
                </>
              }
        >
            <div className="space-y-8">
                {/* 1. Basic Info */}
                <div>
                    <SectionTitle title="基本信息" />
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <Input 
                            label="用户名" 
                            placeholder="登录账号" 
                            value={currentUser.username || ''}
                            onChange={e => setCurrentUser({...currentUser, username: e.target.value})}
                        />
                        <Input 
                            label="真实姓名" 
                            placeholder="员工姓名" 
                            value={currentUser.realName || ''}
                            onChange={e => setCurrentUser({...currentUser, realName: e.target.value})}
                        />
                        <Input 
                            label="手机号" 
                            placeholder="11位手机号" 
                            value={currentUser.phone || ''}
                            onChange={e => setCurrentUser({...currentUser, phone: e.target.value})}
                        />
                        <Input 
                            label="邮箱" 
                            placeholder="Email" 
                            value={currentUser.email || ''}
                            onChange={e => setCurrentUser({...currentUser, email: e.target.value})}
                        />
                        
                        {/* Domain Field (ReadOnly) */}
                        <div className="relative">
                             <Select 
                                label="归属组织 (Domain)" 
                                options={domains.map(d => ({ label: d.name, value: d.id }))}
                                value={currentUser.baseDomainId}
                                disabled={true}
                                className="opacity-60 cursor-not-allowed bg-slate-800"
                             />
                             <div className="absolute right-8 top-9 text-slate-500 pointer-events-none flex items-center gap-1">
                                <Lock size={12} />
                                <span className="text-xs">已锁定</span>
                             </div>
                        </div>

                        {/* Department Select (Dynamic) */}
                        <div className="relative">
                            <Select
                                label="所属部门"
                                value={currentUser.deptId || ''}
                                onChange={e => setCurrentUser({...currentUser, deptId: e.target.value})}
                                options={[
                                    { label: '-- 请选择部门 --', value: '' },
                                    ...deptOptions.map(d => ({
                                        label: `${'\u00A0\u00A0'.repeat(d.depth)}${d.depth > 0 ? '└ ' : ''}${d.name}`,
                                        value: d.id,
                                    })),
                                ]}
                            />
                        </div>

                         <div className="col-span-2">
                            <label className="text-sm text-slate-400 font-normal mb-1 block">账户状态</label>
                            <div className="flex items-center gap-3 mt-1">
                                <Switch 
                                    checked={currentUser.status === 'active'}
                                    onChange={c => setCurrentUser({...currentUser, status: c ? 'active' : 'locked'})}
                                />
                                <span className={`text-sm ${currentUser.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                                    {currentUser.status === 'active' ? '正常启用' : '已锁定'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Role Config */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <SectionTitle title="角色分配" className="mb-0" />
                        <span className="text-xs font-normal text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
                            组织: {domains.find(d => d.id === currentUser.baseDomainId)?.name}
                        </span>
                    </div>
                    
                    <div className="bg-[#1e293b]/50 rounded border border-[var(--sys-border-primary)] p-5 min-h-[100px]">
                        {availableRoles.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                                {availableRoles.map(role => (
                                    <label key={role.id} className={`flex items-start p-3 rounded cursor-pointer border transition-all ${selectedRoleIds.has(role.id) ? 'bg-blue-600/10 border-blue-500/50' : 'bg-slate-800/50 border-transparent hover:border-[var(--sys-border-secondary)]'}`}>
                                        <input 
                                            type="checkbox" 
                                            className="mt-1 rounded bg-slate-900 border-[var(--sys-border-secondary)] text-blue-500 focus:ring-offset-slate-900 mr-3 h-4 w-4"
                                            checked={selectedRoleIds.has(role.id)}
                                            onChange={() => toggleRoleSelection(role.id)}
                                        />
                                        <div>
                                            <div className={`text-sm font-medium ${selectedRoleIds.has(role.id) ? 'text-blue-100' : 'text-slate-300'}`}>{role.name}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{role.code}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-6">
                                <Shield size={32} className="mb-3 opacity-20"/>
                                <span className="text-sm">该组织下暂无可用角色，请先在角色管理中配置。</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>

        {/* --- Permission Audit Modal --- */}
        {auditUser && (
            <Modal
                isOpen={!!auditUser}
                onClose={() => setAuditUser(null)}
                title={`权限审计 - ${auditUser.realName}`}
                size="lg"
                footer={<Button onClick={() => setAuditUser(null)}>关闭</Button>}
            >
                <div className="space-y-8">
                    {/* Role Summary */}
                    <div>
                        <SectionTitle title="生效角色" />
                        <div className="bg-slate-800/40 border border-[var(--sys-border-primary)] rounded-lg p-5">
                            <div className="flex flex-wrap gap-3">
                                {calculateEffectivePermissions(auditUser).roles.map((r, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-blue-900/30 border border-blue-500/30 text-blue-200 px-3 py-1.5 rounded text-sm">
                                        <Shield size={14} className="text-blue-400"/>
                                        <span className="font-medium">{r.name}</span>
                                        <span className="opacity-50 text-xs border-l border-blue-500/30 pl-2 ml-1">{r.code}</span>
                                    </div>
                                ))}
                                {calculateEffectivePermissions(auditUser).roles.length === 0 && (
                                    <span className="text-slate-500 text-sm italic flex items-center">
                                        <AlertTriangle size={16} className="mr-2"/> 未分配任何有效角色
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 h-[450px]">
                        {/* Functional Permissions */}
                        <div className="flex flex-col">
                            <SectionTitle title="功能权限" />
                            <div className="flex-1 border border-[var(--sys-border-primary)] rounded-lg bg-[#1e293b]/30 overflow-hidden flex flex-col">
                                <div className="px-4 py-3 border-b border-[var(--sys-border-primary)] bg-slate-800/50 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">菜单资源</span>
                                    <span className="text-xs text-green-500 flex items-center gap-1"><CheckSquare size={12}/> 已授权</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    {renderAuditMenuTree(menus, calculateEffectivePermissions(auditUser).menus)}
                                </div>
                            </div>
                        </div>

                        {/* Data Permissions */}
                        <div className="flex flex-col">
                             <SectionTitle title="数据范围" />
                             <div className="flex-1 border border-[var(--sys-border-primary)] rounded-lg bg-[#1e293b]/30 overflow-hidden flex flex-col">
                                <div className="px-4 py-3 border-b border-[var(--sys-border-primary)] bg-slate-800/50">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">数据维度</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
                                     <div>
                                         <div className="text-xs text-slate-500 mb-2 font-medium">区域范围</div>
                                         <div className="flex flex-wrap gap-2">
                                             {calculateEffectivePermissions(auditUser).regions.size > 0 ? (
                                                 Array.from(calculateEffectivePermissions(auditUser).regions).map(rCode => (
                                                     <Badge key={rCode} color="gray">{regions.find(r => r.code === rCode)?.name || rCode}</Badge>
                                                 ))
                                             ) : <span className="text-xs text-slate-600 italic">无特定区域限制</span>}
                                         </div>
                                     </div>
                                     <div>
                                         <div className="text-xs text-slate-500 mb-2 font-medium">业务类型</div>
                                         <div className="flex flex-wrap gap-2">
                                             {calculateEffectivePermissions(auditUser).bizTypes.size > 0 ? (
                                                 Array.from(calculateEffectivePermissions(auditUser).bizTypes).map(bCode => (
                                                     <Badge key={bCode} color="blue">{businessTypes.find(b => b.code === bCode)?.name || bCode}</Badge>
                                                 ))
                                             ) : <span className="text-xs text-slate-600 italic">无特定业务限制</span>}
                                         </div>
                                     </div>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </Modal>
        )}
    </div>
  );
};
