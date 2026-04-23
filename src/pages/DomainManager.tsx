import React, { useState, useMemo, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Input, Select, Switch, ConfirmDialog, SectionTitle, ColumnConfigDialog } from '../components/UI';
import { Plus, Edit2, Trash2, Search, RotateCcw, Building2, ChevronLeft, ChevronRight, ChevronsRight, ChevronsLeft, Users, Repeat, Crown, Globe, Download, Settings, FileText } from 'lucide-react';
import { MOCK_DOMAINS, MOCK_CUSTOMERS } from '../constants';
import { Domain } from '../types';
import { useGlobalContext } from '../GlobalContext';
import { useNavigate, useMatch } from 'react-router-dom';

export const DomainManager: React.FC = () => {
  const { mode, currentDomain } = useGlobalContext();
  const navigate = useNavigate();
  const [data, setData] = useState<Domain[]>(MOCK_DOMAINS);

  // Routing Matches
  const matchAdd = useMatch('/system/domain/add');
  const matchEdit = useMatch('/system/domain/edit/:id');
  const isModalOpen = !!matchAdd || !!matchEdit;

  const [currentEditDomain, setCurrentEditDomain] = useState<Partial<Domain> | null>(null);
  
  // Search State
  const [searchName, setSearchName] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [searchStatus, setSearchStatus] = useState('');

  // Status Confirm State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetStatusChange, setTargetStatusChange] = useState<{ id: string, newStatus: 'active' | 'inactive' } | null>(null);

  // Delete Confirm State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Domain | null>(null);

  // Transfer State
  const [transferSearch, setTransferSearch] = useState('');
  const [transferPage, setTransferPage] = useState(1);
  const [selectedSource, setSelectedSource] = useState<string[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string[]>([]);

  // Column Config
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);

  // Sync Modal State with Route
  useEffect(() => {
      if (matchAdd) {
          setCurrentEditDomain({ 
            status: 'active', 
            businessTypes: [], 
            parentId: null,
            customerIds: [],
            managementMode: 'switching',
            isSuper: false,
            description: ''
          });
          // Reset transfer state
          setTransferSearch('');
          setTransferPage(1);
          setSelectedSource([]);
          setSelectedTarget([]);
      } else if (matchEdit) {
          const id = matchEdit.params.id;
          const domain = data.find(d => d.id === id);
          if (domain) {
              setCurrentEditDomain({ 
                ...domain, 
                customerIds: domain.customerIds || [],
                managementMode: domain.managementMode || 'switching'
              });
              setTransferSearch('');
              setTransferPage(1);
              setSelectedSource([]);
              setSelectedTarget([]);
          } else {
              // Handle not found
              navigate('/system/domain');
          }
      } else {
          setCurrentEditDomain(null);
      }
  }, [matchAdd, matchEdit, data, navigate]);
  
  const initiateStatusChange = (domain: Domain, checked: boolean) => {
     if (domain.isSuper) return; // Cannot disable super domain
     setTargetStatusChange({
         id: domain.id,
         newStatus: checked ? 'active' : 'inactive'
     });
     setConfirmOpen(true);
  };

  const handleEdit = (domain: Domain) => {
    navigate(`/system/domain/edit/${domain.id}`);
  };

  const handleDelete = (row: Domain) => {
    if (row.isSuper) return;
    setDeleteTarget(row);
    setDeleteConfirmOpen(true);
  };

  // --- Column Definitions ---
  const ALL_COLUMNS = useMemo(() => [
    { 
      key: 'serial', header: '序号', accessor: 'serialNumber', width: '60px' 
    },
    { 
      key: 'name', header: '域名称', 
      accessor: (row: Domain) => (
        <div className="flex flex-col text-left">
           <div className="flex items-center">
               {row.isSuper ? (
                 <Crown size={16} className="text-yellow-500 mr-2" />
               ) : (
                 <Building2 size={16} className="text-blue-400 mr-2"/>
               )}
               <span className={`font-medium ${row.isSuper ? 'text-yellow-100' : 'text-blue-100'}`}>{row.name}</span>
               {row.isSuper && <Badge color="yellow" className="ml-2 scale-90">总控</Badge>}
           </div>
           <span className="text-[10px] text-slate-500 font-mono ml-6 mt-0.5">{row.code}</span>
        </div>
      ),
      width: '200px'
    },
    { 
      key: 'desc', header: '描述', 
      accessor: (row: Domain) => <span className="text-slate-400 text-xs truncate max-w-[150px] block text-left" title={row.description}>{row.description || '-'}</span> 
    },
    {
      key: 'mode', header: '管理模式',
      accessor: (row: Domain) => (
         row.managementMode === 'fusion' ? (
           <Badge color="blue" className="flex items-center gap-1 w-fit mx-auto">
              <Users size={10} /> 跨客户融合
           </Badge>
         ) : (
           <Badge color="gray" className="flex items-center gap-1 w-fit mx-auto">
              <Repeat size={10} /> 按客户切换
           </Badge>
         )
      )
    },
    { 
      key: 'customers', header: '关联客户', 
      accessor: (row: Domain) => {
        if (row.isSuper) {
             return <span className="text-slate-400 text-xs italic">所有客户权限</span>;
        }
        const ids = row.customerIds || [];
        if (ids.length === 0) return <span className="text-slate-500">-</span>;
        
        const names = ids.map(id => MOCK_CUSTOMERS.find(c => c.id === id)?.name).filter(Boolean) as string[];
        const displayCount = 2;
        const visibleNames = names.slice(0, displayCount);
        const diff = names.length - displayCount;
        
        return (
          <div className="flex items-center justify-center gap-1" title={names.join('、')}>
            <span className="text-slate-300 text-sm truncate max-w-[150px]">{visibleNames.join('、')}</span>
            {diff > 0 && <Badge color="gray" className="scale-90">+{diff}</Badge>}
          </div>
        )
      } 
    },
    { 
      key: 'status', header: '状态', 
      accessor: (row: Domain) => (
        <div className="flex justify-center">
            <Switch 
                checked={row.status === 'active'} 
                onChange={(checked) => initiateStatusChange(row, checked)} 
                disabled={row.isSuper}
            />
        </div>
      ),
      width: '80px'
    },
    { key: 'createTime', header: '创建时间', accessor: (row: Domain) => <span className="text-xs text-slate-400 block w-[80px] mx-auto">{row.createTime?.split(' ')[0]}<br/>{row.createTime?.split(' ')[1]}</span> },
    { key: 'creator', header: '创建人', accessor: 'creator' },
    { key: 'updateTime', header: '更新时间', accessor: (row: Domain) => <span className="text-xs text-slate-400 block w-[80px] mx-auto">{row.updateTime?.split(' ')[0]}<br/>{row.updateTime?.split(' ')[1]}</span> },
    { key: 'updater', header: '更新人', accessor: 'updater' },
    {
      key: 'action', header: '操作',
      accessor: (row: Domain) => (
        <div className="flex space-x-2 justify-center">
          <Button size="sm" variant="ghost" className="!text-blue-500 hover:!text-blue-400" icon={<Edit2 size={14} />} onClick={() => handleEdit(row)}>编辑</Button>
          {!row.isSuper && (
            <Button size="sm" variant="ghost" className="!text-red-500 hover:!text-red-400" icon={<Trash2 size={14} />} onClick={() => handleDelete(row)}>删除</Button>
          )}
        </div>
      ),
      width: '140px'
    }
  ], [navigate]);

  const [columnOrder, setColumnOrder] = useState(ALL_COLUMNS.map(c => c.key));

  const activeColumns = useMemo(() => {
      return columnOrder.map(key => ALL_COLUMNS.find(c => c.key === key)).filter(Boolean);
  }, [columnOrder, ALL_COLUMNS]);

  // Reset search on context change
  useEffect(() => {
    setSearchName('');
    setSearchCode('');
    setSearchStatus('');
  }, [mode, currentDomain]);

  // Filtering Data
  const filteredData = useMemo(() => {
      let baseData = data;
      // Filter by Context
      if (mode === 'switching' && currentDomain) {
          baseData = data.filter(d => d.id === currentDomain.id);
      }

      return baseData.filter(d => {
          const matchName = d.name.toLowerCase().includes(searchName.toLowerCase());
          const matchCode = d.code.toLowerCase().includes(searchCode.toLowerCase());
          const matchStatus = searchStatus ? d.status === searchStatus : true;
          return matchName && matchCode && matchStatus;
      });
  }, [data, searchName, searchCode, searchStatus, mode, currentDomain]);

  // Prepared data for table with serial numbers
  const tableData = useMemo(() => {
      return filteredData.map((d, index) => ({
          ...d,
          serialNumber: index + 1
      }));
  }, [filteredData]);

  const handleAdd = () => {
    navigate('/system/domain/add');
  };

  const confirmDelete = () => {
    if (deleteTarget) {
        setData(data.filter(n => n.id !== deleteTarget.id));
    }
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  const confirmStatusChange = () => {
      if (targetStatusChange) {
          setData(data.map(item => item.id === targetStatusChange.id ? { ...item, status: targetStatusChange.newStatus } : item));
      }
      setConfirmOpen(false);
      setTargetStatusChange(null);
  };

  const handleSave = () => {
      const timestamp = new Date().toLocaleString();
      if (currentEditDomain?.id) {
          // Update
          setData(data.map(n => n.id === currentEditDomain.id ? { 
              ...n, 
              ...currentEditDomain,
              updateTime: timestamp,
              updater: 'admin' // Mock user
          } as Domain : n));
      } else {
          // Create
          const newDomain = {
              ...currentEditDomain,
              id: Date.now().toString(),
              createTime: timestamp,
              creator: 'admin',
              updateTime: timestamp,
              updater: 'admin',
              parentId: null
          } as Domain;
          setData([...data, newDomain]);
      }
      navigate('/system/domain');
  };

  const closeModal = () => {
      navigate('/system/domain');
  };

  // --- Transfer Logic ---
  const currentCustomerIds = currentEditDomain?.customerIds || [];
  const ITEMS_PER_TRANSFER_PAGE = 8; // Keep pagination for transfer list inside modal only

  const availableCustomers = useMemo(() => {
    return MOCK_CUSTOMERS.filter(c => !currentCustomerIds.includes(c.id));
  }, [currentCustomerIds]);

  const filteredSource = useMemo(() => {
    return availableCustomers.filter(c => c.name.toLowerCase().includes(transferSearch.toLowerCase()));
  }, [availableCustomers, transferSearch]);

  const totalTransferPages = Math.ceil(filteredSource.length / ITEMS_PER_TRANSFER_PAGE);
  const currentSourcePage = filteredSource.slice((transferPage - 1) * ITEMS_PER_TRANSFER_PAGE, transferPage * ITEMS_PER_TRANSFER_PAGE);

  const handleSelectAllSource = (checked: boolean) => {
    if (checked) {
        const allFilteredIds = filteredSource.map(c => c.id);
        setSelectedSource([...new Set([...selectedSource, ...allFilteredIds])]);
    } else {
        const filteredIds = filteredSource.map(c => c.id);
        setSelectedSource(selectedSource.filter(id => !filteredIds.includes(id)));
    }
  };

  const moveToTarget = () => {
    const newIds = [...currentCustomerIds, ...selectedSource];
    setCurrentEditDomain(prev => ({ ...prev!, customerIds: newIds }));
    setSelectedSource([]);
  };

  const moveToSource = () => {
    const newIds = currentCustomerIds.filter(id => !selectedTarget.includes(id));
    setCurrentEditDomain(prev => ({ ...prev!, customerIds: newIds }));
    setSelectedTarget([]);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <Card className="shrink-0" bodyClassName="p-4">
        <div className="flex flex-col gap-3">
           {/* Row 1: Search Conditions */}
           <div className="flex flex-wrap gap-4 items-center">
               <Input 
                 label="域名称" 
                 placeholder="输入名称" 
                 className="w-48" 
                 value={searchName} 
                 onChange={e => setSearchName(e.target.value)} 
               />
               <Input 
                 label="域编码" 
                 placeholder="输入编码" 
                 className="w-48" 
                 value={searchCode} 
                 onChange={e => setSearchCode(e.target.value)} 
               />
               <Select 
                 label="状态" 
                 options={[{label: '全部', value: ''}, {label: '启用', value: 'active'}, {label: '禁用', value: 'inactive'}]} 
                 className="w-32" 
                 value={searchStatus}
                 onChange={e => setSearchStatus(e.target.value)}
               />
           </div>

           {/* Row 2: Actions */}
           <div className="flex justify-between items-center border-t border-[var(--sys-border-primary)] pt-3">
                <div className="flex gap-3">
                    <Button variant="primary" icon={<Search size={16} />}>查询</Button>
                    <Button 
                        variant="secondary" 
                        icon={<RotateCcw size={16} />} 
                        onClick={() => { setSearchName(''); setSearchCode(''); setSearchStatus(''); }}
                    >
                        重置
                    </Button>
                    {/* Add button is strictly Green and in Search Area as requested */}
                    {mode === 'fusion' && (
                        <Button className="bg-emerald-600 hover:bg-emerald-500 text-white" icon={<Plus size={16} />} onClick={handleAdd}>新增子域</Button>
                    )}
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
            <Table columns={activeColumns} data={tableData} />
         </div>
         <div className="py-2 border-t border-[var(--sys-border-primary)] flex justify-between items-center">
            <div className="text-sm text-slate-400">共 {filteredData.length} 条</div>
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
        onClose={closeModal}
        title={currentEditDomain?.isSuper ? "智慧运维总控信息" : (currentEditDomain?.id ? "编辑子域信息" : "新增子域")}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>取消</Button>
            <Button onClick={handleSave}>确定</Button>
          </>
        }
      >
         <div className="space-y-6">
           {/* Basic Info */}
           <div>
               <SectionTitle title="域基础信息" />
               <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="col-span-1">
                        <Input 
                            label="域名称" 
                            value={currentEditDomain?.name || ''}
                            onChange={(e) => setCurrentEditDomain(prev => ({...prev!, name: e.target.value}))}
                            placeholder="请输入域名称" 
                            disabled={currentEditDomain?.isSuper}
                        />
                    </div>
                    
                    <div className="col-span-1">
                        <Input 
                            label="域编码" 
                            value={currentEditDomain?.code || ''} 
                            onChange={(e) => setCurrentEditDomain(prev => ({ ...prev!, code: e.target.value }))}
                            placeholder="唯一标识 (Code)" 
                            disabled={!!currentEditDomain?.id} 
                        />
                    </div>
                
                    <div className="col-span-1">
                        <Input label="管理员账号" defaultValue={currentEditDomain?.manager} placeholder="关联初始管理员" />
                    </div>

                    <div className="col-span-2">
                        <label className="text-sm text-slate-400 block mb-1.5">描述信息</label>
                        <textarea 
                            className="w-full bg-[#1e293b] border border-[var(--sys-border-primary)] rounded p-2 text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-600"
                            rows={3}
                            placeholder="请输入域描述..."
                            value={currentEditDomain?.description || ''}
                            onChange={(e) => setCurrentEditDomain(prev => ({ ...prev!, description: e.target.value }))}
                        />
                    </div>

                    <div className="col-span-2 bg-[#1e293b]/50 p-5 rounded-lg border border-[var(--sys-border-primary)]">
                            <label className="text-sm font-medium text-slate-300 block mb-4">管理模式 (Management Mode)</label>
                            <div className="grid grid-cols-2 gap-6">
                                <div 
                                    className={`border rounded p-4 cursor-pointer transition-all flex items-start gap-4 ${currentEditDomain?.managementMode === 'fusion' ? 'bg-blue-600/10 border-blue-500' : 'bg-[var(--sys-bg-header)] border-[var(--sys-border-primary)] hover:border-[var(--sys-border-secondary)]'}`}
                                    onClick={() => !currentEditDomain?.isSuper && setCurrentEditDomain(prev => ({ ...prev!, managementMode: 'fusion' }))}
                                >
                                    <div className={`mt-0.5 rounded-full p-1.5 ${currentEditDomain?.managementMode === 'fusion' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-700 text-slate-400'}`}>
                                        <Users size={16} />
                                    </div>
                                    <div>
                                        <div className={`text-sm font-bold ${currentEditDomain?.managementMode === 'fusion' ? 'text-blue-200' : 'text-slate-300'}`}>跨客户融合</div>
                                        <div className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                                            支持跨域查询，管理员可直接访问所有关联客户的数据。
                                        </div>
                                    </div>
                                </div>

                                <div 
                                    className={`border rounded p-4 cursor-pointer transition-all flex items-start gap-4 ${currentEditDomain?.managementMode === 'switching' ? 'bg-blue-600/10 border-blue-500' : 'bg-[var(--sys-bg-header)] border-[var(--sys-border-primary)] hover:border-[var(--sys-border-secondary)]'}`}
                                    onClick={() => !currentEditDomain?.isSuper && setCurrentEditDomain(prev => ({ ...prev!, managementMode: 'switching' }))}
                                >
                                    <div className={`mt-0.5 rounded-full p-1.5 ${currentEditDomain?.managementMode === 'switching' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-700 text-slate-400'}`}>
                                        <Repeat size={16} />
                                    </div>
                                    <div>
                                        <div className={`text-sm font-bold ${currentEditDomain?.managementMode === 'switching' ? 'text-blue-200' : 'text-slate-300'}`}>按客户切换</div>
                                        <div className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                                            需切换不同上下文来访问特定数据，数据隔离性强。
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {currentEditDomain?.isSuper && <div className="mt-3 text-xs text-amber-500/80 flex items-center gap-1"><Crown size={12}/> 总控中心默认启用跨域融合模式，拥有全局视野。</div>}
                    </div>
                </div>
            </div>
          
           {/* Customer Transfer Frame */}
           <div>
               <SectionTitle title="关联客户配置" />
               
               {currentEditDomain?.isSuper ? (
                   <div className="bg-slate-800/30 rounded-lg p-8 text-center border border-[var(--sys-border-primary)] border-dashed">
                       <Crown size={32} className="mx-auto text-yellow-500 mb-3 opacity-50"/>
                       <p className="text-slate-300 font-medium">总控中心默认拥有所有客户权限</p>
                       <p className="text-slate-500 text-sm mt-1">无需手动配置关联客户</p>
                   </div>
               ) : (
                <div className="flex h-[320px] gap-4">
                  {/* Left: Source */}
                  <div className="flex-1 border border-[var(--sys-border-primary)] rounded-lg flex flex-col bg-[var(--sys-bg-header)]">
                      <div className="p-2 border-b border-[var(--sys-border-primary)] bg-slate-800/50 rounded-t-lg space-y-2">
                         <div className="flex gap-2">
                             <Input 
                                placeholder="搜索客户..." 
                                className="h-8 text-sm py-1" 
                                value={transferSearch}
                                onChange={(e) => { setTransferSearch(e.target.value); setTransferPage(1); }}
                             />
                         </div>
                         <div className="flex justify-between items-center px-1">
                             <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-300 select-none">
                                <input 
                                    type="checkbox" 
                                    className="rounded bg-slate-900 border-[var(--sys-border-secondary)] text-blue-500" 
                                    onChange={(e) => handleSelectAllSource(e.target.checked)}
                                    checked={filteredSource.length > 0 && filteredSource.every(c => selectedSource.includes(c.id))}
                                />
                                <span>全选 ({filteredSource.length})</span>
                             </label>
                             <span className="text-xs text-slate-500">{selectedSource.length} 已选</span>
                         </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                         {currentSourcePage.map(item => (
                            <div 
                                key={item.id} 
                                className={`flex items-center p-2 rounded hover:bg-slate-800 cursor-pointer ${selectedSource.includes(item.id) ? 'bg-blue-600/20' : ''}`}
                                onClick={() => {
                                    selectedSource.includes(item.id)
                                      ? setSelectedSource(selectedSource.filter(id => id !== item.id))
                                      : setSelectedSource([...selectedSource, item.id])
                                }}
                            >
                                <input type="checkbox" checked={selectedSource.includes(item.id)} readOnly className="mr-2 rounded bg-slate-900 border-[var(--sys-border-secondary)] pointer-events-none" />
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm truncate text-slate-300">{item.name}</span>
                                    <span className="text-[10px] text-slate-500">{item.code}</span>
                                </div>
                            </div>
                         ))}
                         {filteredSource.length === 0 && <div className="text-center py-4 text-xs text-slate-500">无匹配数据</div>}
                      </div>
                      
                      {/* Pagination Controls for Transfer */}
                      {totalTransferPages > 1 && (
                          <div className="p-2 border-t border-[var(--sys-border-primary)] flex justify-between items-center bg-slate-800/30">
                              <button disabled={transferPage === 1} onClick={() => setTransferPage(p => p - 1)} className="p-1 hover:text-white text-slate-400 disabled:opacity-30"><ChevronLeft size={16}/></button>
                              <span className="text-xs text-slate-400">{transferPage} / {totalTransferPages}</span>
                              <button disabled={transferPage === totalTransferPages} onClick={() => setTransferPage(p => p + 1)} className="p-1 hover:text-white text-slate-400 disabled:opacity-30"><ChevronRight size={16}/></button>
                          </div>
                      )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col justify-center gap-3">
                        <Button size="sm" variant="secondary" onClick={moveToTarget} disabled={selectedSource.length === 0} title="添加" className="w-10">
                            <ChevronsRight size={18} />
                        </Button>
                        <Button size="sm" variant="secondary" onClick={moveToSource} disabled={selectedTarget.length === 0} title="移除" className="w-10">
                            <ChevronsLeft size={18} />
                        </Button>
                  </div>

                  {/* Right: Target */}
                  <div className="flex-1 border border-[var(--sys-border-primary)] rounded-lg flex flex-col bg-[var(--sys-bg-header)]">
                      <div className="p-2 border-b border-[var(--sys-border-primary)] bg-slate-800/50 rounded-t-lg flex justify-between items-center h-[76px]">
                          <span className="text-xs font-semibold text-slate-300 pl-1">已关联客户 ({currentCustomerIds.length})</span>
                          <Button size="sm" variant="ghost" className="text-red-400 text-xs px-2 h-6" onClick={() => setCurrentEditDomain(prev => ({...prev!, customerIds: []}))}>清空</Button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                         {MOCK_CUSTOMERS.filter(c => currentCustomerIds.includes(c.id)).map(item => (
                            <div 
                                key={item.id} 
                                className={`flex items-center p-2 rounded hover:bg-slate-800 cursor-pointer ${selectedTarget.includes(item.id) ? 'bg-blue-600/20' : ''}`}
                                onClick={() => {
                                    selectedTarget.includes(item.id)
                                      ? setSelectedTarget(selectedTarget.filter(id => id !== item.id))
                                      : setSelectedTarget([...selectedTarget, item.id])
                                }}
                            >
                                <input type="checkbox" checked={selectedTarget.includes(item.id)} readOnly className="mr-2 rounded bg-slate-900 border-[var(--sys-border-secondary)] pointer-events-none" />
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm truncate text-slate-300">{item.name}</span>
                                    <span className="text-[10px] text-slate-500">{item.code}</span>
                                </div>
                            </div>
                         ))}
                      </div>
                  </div>
               </div>
               )}
           </div>

           <Input label="备注信息" placeholder="可选填..." />
        </div>
      </Modal>

      <ConfirmDialog 
         isOpen={confirmOpen} 
         message={`确定要${targetStatusChange?.newStatus === 'active' ? '启用' : '禁用'}该域吗？`}
         onConfirm={confirmStatusChange}
         onCancel={() => { setConfirmOpen(false); setTargetStatusChange(null); }}
      />
      
      <ConfirmDialog 
         isOpen={deleteConfirmOpen} 
         title="删除域"
         message={`确定要删除“${deleteTarget?.name}”吗？此操作不可恢复。`}
         onConfirm={confirmDelete}
         onCancel={() => { setDeleteConfirmOpen(false); setDeleteTarget(null); }}
      />
    </div>
  );
};