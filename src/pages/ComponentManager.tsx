import React, { useState, useMemo, useEffect } from 'react';
import { Card, Button, Badge, Input, SectionTitle, Modal, ConfirmDialog, Select } from '../components/UI';
import { Search, Plus, LayoutGrid, Eye, Code, Edit2, List, Grid, Monitor, Trash2, FolderPlus, MoreVertical, Folder, AlertCircle, ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight, FileCode } from 'lucide-react';
import { BUSINESS_TYPES, MOCK_COMPONENTS } from '../constants';
import { useGlobalContext } from '../GlobalContext';
import { BizLinePreview } from '../components/previews/BizLinePreview';
import { BizInetPreview } from '../components/previews/BizInetPreview';
import { BizIntranetPreview } from '../components/previews/BizIntranetPreview';
import { BizDialPreview } from '../components/previews/BizDialPreview';
import { BizCollectPreview } from '../components/previews/BizCollectPreview';
import { BizCompPreview } from '../components/previews/BizCompPreview';
import { Biz5GPreview } from '../components/previews/Biz5GPreview';
import { BizIdcPreview } from '../components/previews/BizIdcPreview';
import { BizBasePreview } from '../components/previews/BizBasePreview';
import { BizOtherPreview } from '../components/previews/BizOtherPreview';
import { BizAICPreview } from '../components/previews/BizAICPreview';
import { BizSDWANPreview } from '../components/previews/BizSDWANPreview';
import { GenericPreview } from '../components/previews/GenericPreview';
import { ComponentEditor } from '../components/ComponentEditor';
import { useNavigate, useMatch } from 'react-router-dom';

export const ComponentManager: React.FC = () => {
  const { mode, currentDomain } = useGlobalContext();
  const navigate = useNavigate();
  
  // Data States
  // Initialize with remark and status fields
  const [components, setComponents] = useState(() => 
      MOCK_COMPONENTS.map(c => ({
          ...c,
          status: (c as any).status || 'published' 
      }))
  );
  
  const [categories, setCategories] = useState(BUSINESS_TYPES.map(b => ({ ...b, remark: '' })));
  
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Filter States
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid-sm' | 'grid-lg'>('grid-lg');
  
  // Editor State
  const [editingComponent, setEditingComponent] = useState<any>(null);

  // Group Management State (Refactored to Routing)
  const matchGroupAdd = useMatch('/config/component/group/add');
  const matchGroupEdit = useMatch('/config/component/group/edit/:id');
  const isGroupModalOpen = !!matchGroupAdd || !!matchGroupEdit;

  const [currentGroup, setCurrentGroup] = useState<{ name: string, code: string, remark: string, id?: string }>({ name: '', code: '', remark: '' });
  const [groupDeleteId, setGroupDeleteId] = useState<string | null>(null);
  const [groupDeleteWarning, setGroupDeleteWarning] = useState<string | null>(null);

  // Initialize Group Form
  useEffect(() => {
      if (matchGroupAdd) {
          setCurrentGroup({ name: '', code: '', remark: '' });
      } else if (matchGroupEdit) {
          const id = matchGroupEdit.params.id;
          const group = categories.find(c => c.code === id);
          if (group) {
              setCurrentGroup({ ...group, id: group.code, remark: group.remark || '' });
          } else {
              navigate('/config/component');
          }
      }
  }, [matchGroupAdd, matchGroupEdit, categories, navigate]);

  // Permission Logic: Filter allowed business types
  const allowedCategories = useMemo(() => {
    // If Super Domain (fusion), show everything from local state
    if (mode === 'fusion' || !currentDomain) {
      return categories;
    }
    // Filter categories based on domain's businessTypes
    return categories.filter(bt => 
      currentDomain.businessTypes.includes(bt.code) || bt.code === 'BIZ_BASE' || bt.code === 'BIZ_OTHER'
    );
  }, [mode, currentDomain, categories]);

  // 1. Get all components available to the current context (Permission filtered only)
  const allAccessibleComponents = useMemo(() => {
    let list = components;
    if (mode !== 'fusion' && currentDomain) {
        list = list.filter(c => 
            currentDomain.businessTypes.includes(c.category) || 
            c.category === 'BIZ_BASE' || 
            c.category === 'BIZ_OTHER'
        );
    }
    return list;
  }, [mode, currentDomain, components]);

  // 2. Filter components for display based on category, search, and status
  const filteredComponents = useMemo(() => {
    let list = allAccessibleComponents;

    // Category Filter
    if (activeCategory !== 'all') {
      list = list.filter(c => c.category === activeCategory);
    }

    // Status Filter
    if (statusFilter !== 'all') {
        list = list.filter(c => c.status === statusFilter);
    }

    // Search Filter
    if (search) {
      list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    }

    return list;
  }, [allAccessibleComponents, activeCategory, search, statusFilter]);

  // Helper to get count for a specific category within accessible components
  const getCategoryCount = (categoryCode: string) => {
      return allAccessibleComponents.filter(c => c.category === categoryCode).length;
  };

  // --- Render Preview Wrapper ---
  const renderPreview = (comp: any) => {
      switch (comp.category) {
        case 'BIZ_AIC': return <BizAICPreview comp={comp} />;
        case 'BIZ_SDWAN': return <BizSDWANPreview comp={comp} />;
        case 'BIZ_LINE': return <BizLinePreview comp={comp} />;
        case 'BIZ_INET': return <BizInetPreview comp={comp} />;
        case 'BIZ_INTRANET': return <BizIntranetPreview comp={comp} />;
        case 'BIZ_DIAL': return <BizDialPreview comp={comp} />;
        case 'BIZ_COLLECT': return <BizCollectPreview comp={comp} />;
        case 'BIZ_COMP': return <BizCompPreview comp={comp} />;
        case 'BIZ_5G': return <Biz5GPreview comp={comp} />;
        case 'BIZ_IDC': return <BizIdcPreview comp={comp} />;
        case 'BIZ_BASE': return <BizBasePreview comp={comp} />;
        case 'BIZ_OTHER': return <BizOtherPreview comp={comp} />;
        default: return <GenericPreview comp={comp} />;
      }
  };

  const getContainerClass = () => {
      switch (viewMode) {
          case 'list': return 'flex flex-col gap-3';
          case 'grid-sm': return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4';
          default: return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';
      }
  };

  // --- Component Actions ---
  const handleAddComponent = () => {
      setEditingComponent({
          name: '新建组件',
          category: activeCategory !== 'all' ? activeCategory : 'BIZ_BASE',
          type: 'chart',
          pluginType: 'Echarts',
          status: 'draft'
      });
  };

  const handleSaveComponent = (savedComp: any) => {
      if (savedComp.id) {
          // Update
          setComponents(prev => prev.map(c => c.id === savedComp.id ? savedComp : c));
      } else {
          // Add
          const newComp = { ...savedComp, id: `comp_${Date.now()}` };
          setComponents(prev => [newComp, ...prev]);
      }
      setEditingComponent(null);
  };

  // --- Group Actions (Routing) ---
  const handleAddGroup = () => {
      navigate('/config/component/group/add');
  };

  const handleEditGroup = (e: React.MouseEvent, group: any) => {
      e.stopPropagation();
      navigate(`/config/component/group/edit/${group.code}`);
  };

  const handleDeleteGroupClick = (e: React.MouseEvent, code: string) => {
      e.stopPropagation();
      // Check if group has components
      const hasComponents = components.some(c => c.category === code);
      if (hasComponents) {
          setGroupDeleteWarning("该分组下存在组件，请先删除组件或移动组件后删除。");
          return;
      }
      setGroupDeleteId(code);
  };

  const confirmDeleteGroup = () => {
      if (groupDeleteId) {
          setCategories(prev => prev.filter(c => c.code !== groupDeleteId));
          if (activeCategory === groupDeleteId) setActiveCategory('all');
      }
      setGroupDeleteId(null);
  };

  const handleSaveGroup = () => {
      if (!currentGroup.name) return; // Validation

      const isEdit = !!currentGroup.id;
      
      if (isEdit) {
          setCategories(prev => prev.map(c => c.code === currentGroup.id ? { ...c, name: currentGroup.name, remark: currentGroup.remark } : c));
      } else {
          const newCode = `BIZ_${Date.now()}`;
          setCategories(prev => [...prev, { name: currentGroup.name, code: newCode, remark: currentGroup.remark }]);
      }
      navigate('/config/component');
  };

  const closeGroupModal = () => {
      navigate('/config/component');
  };

  const toggleCategoryExpand = (e: React.MouseEvent, code: string) => {
      e.stopPropagation();
      const newSet = new Set(expandedCategories);
      if (newSet.has(code)) newSet.delete(code);
      else newSet.add(code);
      setExpandedCategories(newSet);
  };

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar Categories */}
      <div className={`flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-10'} shrink-0`}>
        {isSidebarOpen ? (
            <div className="h-full flex flex-col bg-slate-900/50 p-4 rounded-lg border border-[var(--sys-border-primary)]">
                <div className="flex justify-between items-center mb-2 shrink-0">
                    <SectionTitle title="组件列表" className="mb-0" />
                    <div className="flex items-center gap-1">
                        {mode === 'fusion' && (
                            <button 
                                onClick={handleAddGroup}
                                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" 
                                title="新建分组"
                            >
                                <FolderPlus size={16} />
                            </button>
                        )}
                        <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
                            <ChevronsLeft size={16} />
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-2 pl-1 -ml-1">
                    <button 
                        onClick={() => setActiveCategory('all')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-all mb-1 ${activeCategory === 'all' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800'}`}
                    >
                        <div className="flex items-center gap-2">
                            <LayoutGrid size={14} />
                            <span>全部组件</span>
                        </div>
                        <Badge color={activeCategory === 'all' ? 'blue' : 'gray'} className="text-[10px] px-1 py-0 scale-90">
                            {allAccessibleComponents.length}
                        </Badge>
                    </button>
                    
                    <div className="h-px bg-slate-800 my-2 mx-1" />
                    
                    <div className="space-y-1">
                        {allowedCategories.map(cat => {
                            const count = getCategoryCount(cat.code);
                            const isActive = activeCategory === cat.code;
                            const isExpanded = expandedCategories.has(cat.code);
                            const catComponents = allAccessibleComponents.filter(c => c.category === cat.code);

                            return (
                                <div key={cat.code} className="group/item">
                                    <div 
                                        onClick={() => setActiveCategory(cat.code)}
                                        className={`group relative w-full flex items-center justify-between px-2 py-2 rounded text-sm transition-all border cursor-pointer ${isActive ? 'bg-blue-600/10 text-blue-400 border-blue-500/50' : 'border-transparent text-slate-400 hover:bg-slate-800'}`}
                                    >
                                        <div className="flex items-center gap-1.5 truncate flex-1">
                                            <button 
                                                className={`p-0.5 rounded hover:bg-white/10 transition-colors text-slate-500 ${catComponents.length === 0 ? 'invisible' : ''}`}
                                                onClick={(e) => toggleCategoryExpand(e, cat.code)}
                                            >
                                                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                            </button>
                                            
                                            {isActive ? 
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_4px_#3b82f6] shrink-0"></div> : 
                                                <Folder size={14} className="text-slate-600 shrink-0" />
                                            }
                                            <span className="truncate">{cat.name}</span>
                                        </div>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border min-w-[24px] text-center ${isActive ? 'text-blue-300 bg-blue-900/30 border-blue-800' : 'text-slate-600 bg-slate-800/50 border-[var(--sys-border-primary)]'}`}>
                                            {count}
                                        </span>

                                        {/* Hover Actions (Only in Fusion mode) */}
                                        {mode === 'fusion' && (
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover/item:flex gap-1 bg-slate-900/90 rounded p-1 shadow-lg border border-[var(--sys-border-primary)] z-10">
                                                <button 
                                                    className="p-1 hover:text-blue-400 text-slate-400" 
                                                    onClick={(e) => handleEditGroup(e, cat)}
                                                    title="编辑分组"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                                <button 
                                                    className="p-1 hover:text-red-400 text-slate-400" 
                                                    onClick={(e) => handleDeleteGroupClick(e, cat.code)}
                                                    title="删除分组"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Sub-components Tree */}
                                    {isExpanded && catComponents.length > 0 && (
                                        <div className="ml-4 pl-3 border-l border-[var(--sys-border-primary)] mt-1 space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                                            {catComponents.map(c => (
                                                <div 
                                                    key={c.id} 
                                                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-400 py-1.5 px-2 cursor-pointer hover:bg-slate-800/50 rounded transition-colors group/sub"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingComponent(c);
                                                    }}
                                                >
                                                    <FileCode size={10} className="shrink-0 opacity-70"/>
                                                    <span className="truncate">{c.name}</span>
                                                    <div className="ml-auto opacity-0 group-hover/sub:opacity-100">
                                                        <Edit2 size={10} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        ) : (
             <div 
                  className="h-full bg-[#1e293b] border border-[var(--sys-border-primary)] rounded-lg flex flex-col items-center py-4 cursor-pointer hover:bg-slate-800 hover:border-blue-500/50 transition-colors"
                  onClick={() => setIsSidebarOpen(true)}
                  title="展开组件列表"
              >
                  <ChevronsRight size={16} className="text-blue-500 mb-4" />
                  <span className="text-xs text-slate-400 [writing-mode:vertical-rl] tracking-[0.3em] font-medium select-none">组件列表</span>
              </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <Card className="shrink-0" bodyClassName="p-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="flex gap-2">
                    <Input 
                        placeholder="搜索组件名称..." 
                        className="w-48" 
                        value={search} 
                        onChange={e => setSearch(e.target.value)}
                        prefix={<Search size={16} />}
                    />
                    <Select 
                        options={[
                            {label: '全部状态', value: 'all'},
                            {label: '已发布', value: 'published'},
                            {label: '草稿', value: 'draft'}
                        ]}
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as any)}
                        className="w-32"
                    />
                    <Button variant="secondary" icon={<Search size={16} />}>搜索</Button>
                </div>
             </div>
             
             <div className="flex items-center gap-4">
                 {mode === 'fusion' && (
                     <Button 
                        variant="primary" 
                        className="bg-emerald-600 hover:bg-emerald-500 text-white" 
                        icon={<Plus size={16}/>}
                        onClick={handleAddComponent}
                     >
                         添加组件
                     </Button>
                 )}
                 <div className="w-px h-6 bg-slate-700"></div>
                 <div className="flex bg-slate-800 rounded p-1 border border-[var(--sys-border-primary)]">
                    <button 
                        onClick={() => setViewMode('list')} 
                        className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="列表视图"
                    >
                        <List size={16}/>
                    </button>
                    <button 
                        onClick={() => setViewMode('grid-sm')} 
                        className={`p-1.5 rounded transition-colors ${viewMode === 'grid-sm' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="小图模式"
                    >
                        <Grid size={16}/>
                    </button>
                    <button 
                        onClick={() => setViewMode('grid-lg')} 
                        className={`p-1.5 rounded transition-colors ${viewMode === 'grid-lg' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="大图模式"
                    >
                        <LayoutGrid size={16}/>
                    </button>
                 </div>
             </div>
          </div>
        </Card>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className={`${getContainerClass()} pb-4`}>
             {filteredComponents.map(comp => (
               <div 
                  key={comp.id} 
                  className={`
                      bg-[var(--sys-bg-page)] border border-[var(--sys-border-primary)] rounded-lg overflow-hidden hover:border-blue-500/50 hover:shadow-lg transition-all cursor-pointer group flex
                      ${viewMode === 'list' ? 'flex-row h-24 items-center' : 'flex-col'}
                      ${viewMode === 'grid-sm' ? 'h-[160px]' : ''}
                      ${viewMode === 'grid-lg' ? 'h-[220px]' : ''}
                  `}
                  onClick={() => setEditingComponent(comp)}
               >
                  {/* Visualization Area */}
                  <div className={`
                      bg-[var(--sys-bg-page)] relative border-[var(--sys-border-primary)] group-hover:bg-[var(--sys-bg-header)] transition-colors overflow-hidden shrink-0
                      ${viewMode === 'list' ? 'w-32 h-full border-r' : 'w-full border-b'}
                      ${viewMode === 'grid-sm' ? 'h-[100px]' : ''}
                      ${viewMode === 'grid-lg' ? 'h-[150px]' : ''}
                  `}>
                      {renderPreview(comp)}
                      
                      {/* Status Badge */}
                      <div className={`absolute z-10 ${viewMode === 'list' ? 'top-1 left-1' : 'top-2 left-2'}`}>
                        <Badge color={comp.status === 'published' ? 'green' : 'yellow'} className="bg-black/50 backdrop-blur-sm border-0 text-[10px] scale-90">
                            {comp.status === 'published' ? '已发布' : '草稿'}
                        </Badge>
                      </div>

                      {/* Hover Overlay - ONLY SHOW IN GRID MODE */}
                      {viewMode !== 'list' && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                               <Button size="sm" variant="primary" className="h-7 text-xs" icon={<Edit2 size={12}/>} onClick={(e) => { e.stopPropagation(); setEditingComponent(comp); }}>编辑</Button>
                          </div>
                      )}

                      {/* Type Badge */}
                      <div className={`absolute z-10 ${viewMode === 'list' ? 'hidden' : 'top-2 right-2'}`}>
                        <Badge color="gray" className="bg-black/50 backdrop-blur-sm border-0 text-[10px] scale-90 opacity-60 group-hover:opacity-100">{comp.type}</Badge>
                      </div>
                  </div>

                  {/* Info Area - Optimized for Layout */}
                  <div className={`flex-1 p-3 flex ${viewMode === 'list' ? 'items-center px-6' : 'flex-col justify-between'}`}>
                      {viewMode === 'list' ? (
                          <>
                            {/* Left: Title & ID */}
                            <div className="flex flex-col gap-1 min-w-[200px]">
                                <h4 className="text-slate-200 font-bold text-base truncate group-hover:text-blue-400 transition-colors" title={comp.name}>{comp.name}</h4>
                                <div className="flex items-center gap-2">
                                     <span className="text-[10px] text-slate-500 bg-slate-900 border border-[var(--sys-border-primary)] px-2 py-0.5 rounded font-mono select-all">{comp.id}</span>
                                </div>
                            </div>

                            {/* Center: Category */}
                            <div className="flex-1 flex justify-center">
                                 <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/50 rounded-full border border-[var(--sys-border-primary)]">
                                     <div className={`w-1.5 h-1.5 rounded-full ${['BIZ_5G', 'BIZ_COMP', 'BIZ_AIC'].includes(comp.category) ? 'bg-purple-500' : (['BIZ_IDC', 'BIZ_SDWAN'].includes(comp.category) ? 'bg-emerald-500' : 'bg-blue-500')}`}></div>
                                     <span className="text-xs text-slate-400">{categories.find(b => b.code === comp.category)?.name || comp.category}</span>
                                 </div>
                            </div>

                            {/* Right: Meta & Actions */}
                            <div className="flex items-center justify-end gap-6 min-w-[150px]">
                                <span className="text-xs text-slate-500">类型: <span className="text-slate-300">{comp.type}</span></span>
                                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 hover:text-blue-300 hover:bg-blue-900/20" icon={<Edit2 size={14}/>}>配置</Button>
                            </div>
                          </>
                      ) : (
                          // Grid Layout (Keep simple)
                          <div className="flex-1 flex flex-col justify-between">
                            <div className="mb-1">
                                <h4 className="text-slate-200 font-bold text-sm truncate group-hover:text-blue-400 transition-colors" title={comp.name}>{comp.name}</h4>
                            </div>
                            <div className="flex items-center justify-between mt-auto">
                                 <div className="flex items-center gap-1.5">
                                     <div className={`w-1.5 h-1.5 rounded-full ${['BIZ_5G', 'BIZ_COMP', 'BIZ_AIC'].includes(comp.category) ? 'bg-purple-500' : (['BIZ_IDC', 'BIZ_SDWAN'].includes(comp.category) ? 'bg-emerald-500' : 'bg-blue-500')}`}></div>
                                     <span className="text-[10px] text-slate-500 uppercase">{categories.find(b => b.code === comp.category)?.name || comp.category}</span>
                                 </div>
                            </div>
                          </div>
                      )}
                  </div>
               </div>
             ))}
             {filteredComponents.length === 0 && (
               <div className="col-span-full py-20 flex flex-col items-center text-slate-600">
                  <LayoutGrid size={48} className="opacity-10 mb-4" />
                  <p>该分类下暂无可用组件或您没有相关业务权限</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Editor Overlay */}
      {editingComponent && (
          <ComponentEditor 
              component={editingComponent} 
              onClose={() => setEditingComponent(null)} 
              onSave={handleSaveComponent}
          />
      )}

      {/* Group Management Modal */}
      <Modal
          isOpen={isGroupModalOpen}
          onClose={closeGroupModal}
          title={currentGroup.id ? "编辑分组" : "新增分组"}
          size="sm"
          footer={
              <>
                  <Button variant="secondary" onClick={closeGroupModal}>取消</Button>
                  <Button onClick={handleSaveGroup}>确定</Button>
              </>
          }
      >
          <div className="space-y-4">
              <Input 
                  label="分组名称" 
                  value={currentGroup.name} 
                  onChange={e => setCurrentGroup({...currentGroup, name: e.target.value})}
                  placeholder="请输入分组名称"
              />
              <Input 
                  label="分组备注" 
                  value={currentGroup.remark} 
                  onChange={e => setCurrentGroup({...currentGroup, remark: e.target.value})}
                  placeholder="请输入备注信息"
              />
          </div>
      </Modal>

      <ConfirmDialog 
          isOpen={!!groupDeleteId} 
          title="删除分组"
          message="确定要删除该分组吗？删除后该分组下的组件可能无法正确显示。"
          onConfirm={confirmDeleteGroup}
          onCancel={() => setGroupDeleteId(null)}
      />

      {/* Warning Dialog */}
      <Modal
          isOpen={!!groupDeleteWarning}
          onClose={() => setGroupDeleteWarning(null)}
          title="无法删除"
          size="sm"
          footer={<Button onClick={() => setGroupDeleteWarning(null)}>确定</Button>}
      >
          <div className="flex items-center gap-3 py-4 text-slate-300">
              <div className="p-2 bg-amber-500/10 rounded-full text-amber-500 shrink-0">
                  <AlertCircle size={24} />
              </div>
              <p>{groupDeleteWarning}</p>
          </div>
      </Modal>
    </div>
  );
};