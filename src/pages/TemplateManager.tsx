
import React, { useState, useMemo, useEffect } from 'react';
import { Card, Button, Badge, Input, SectionTitle, Select } from '../components/UI';
import { Search, Plus, MoreVertical, Edit2, Play, Monitor, Building2, LayoutGrid, List, Grid, Folder, ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight, Globe, Database } from 'lucide-react';
import { useGlobalContext } from '../GlobalContext';
import { TemplateEditor } from '../components/TemplateEditor';
import { Domain } from '../types';
import { GenericPreview } from '../components/previews/GenericPreview';
import { BizLinePreview } from '../components/previews/BizLinePreview';
import { BizInetPreview } from '../components/previews/BizInetPreview';
import { BizIdcPreview } from '../components/previews/BizIdcPreview';
import { Biz5GPreview } from '../components/previews/Biz5GPreview';
import { useAppData } from '../context/AppDataContext';

// --- Thumbnail Component ---
const TemplateThumbnail: React.FC<{ template: any }> = ({ template }) => {
    const { components } = useAppData();
    // Pick relevant components based on business types to simulate a dashboard
    const relevantComps = useMemo(() => {
        let list = components.filter(c =>
            template.businessTypes.includes(c.category) || c.category === 'BIZ_BASE'
        );
        // Shuffle deterministically based on template ID to keep it consistent
        const seed = template.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        return list.sort((a, b) => {
            const idA = a.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
            const idB = b.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
            return (seed % idA) - (seed % idB);
        }).slice(0, 3);
    }, [template, components]);

    return (
        <div className="w-full h-full bg-[var(--sys-bg-header)] p-1 grid grid-cols-2 grid-rows-2 gap-1 pointer-events-none select-none overflow-hidden relative">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-transparent z-0"></div>
             {relevantComps.map((comp, i) => {
                 let PreviewComp: any = GenericPreview;
                 if (comp.category === 'BIZ_LINE') PreviewComp = BizLinePreview;
                 if (comp.category === 'BIZ_INET') PreviewComp = BizInetPreview;
                 if (comp.category === 'BIZ_IDC') PreviewComp = BizIdcPreview;
                 if (comp.category === 'BIZ_5G') PreviewComp = Biz5GPreview;

                 return (
                     <div key={comp.id} className={`relative overflow-hidden bg-[#1e293b] border border-[var(--sys-border-primary)] rounded-[2px] ${i === 0 ? 'col-span-2' : ''}`}>
                        {/* Scale down content */}
                        <div className="transform scale-[0.4] origin-top-left w-[250%] h-[250%]">
                            <PreviewComp comp={comp} />
                        </div>
                     </div>
                 );
             })}
             {relevantComps.length === 0 && (
                 <div className="col-span-2 row-span-2 flex items-center justify-center opacity-20">
                     <Monitor size={32} />
                 </div>
             )}
        </div>
    );
};

// --- Tree Node Type ---
type TreeNode = {
    id: string;
    name: string;
    type: 'domain';
    data: Domain;
    children?: TreeNode[];
};

export const TemplateManager: React.FC = () => {
  const { mode, currentDomain } = useGlobalContext();
  const { templates: sourceTemplates, businessTypes, customers, domains, updateTemplates } = useAppData();
  
  // -- Data State --
  const [templates, setTemplates] = useState(sourceTemplates);

  // -- Sidebar State --
  const [selectedDomainId, setSelectedDomainId] = useState<string>('all');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [isTreeOpen, setIsTreeOpen] = useState(true);

  // -- Filter State --
  const [activeCategory, setActiveCategory] = useState('all'); // Business Type
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  
  // -- View Mode State --
  const [viewMode, setViewMode] = useState<'list' | 'grid-sm' | 'grid-lg'>('grid-lg');

  // -- Editor State --
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [startInPreview, setStartInPreview] = useState(false);

  const commitTemplates = (next: any[]) => {
    setTemplates(next);
    updateTemplates(next);
  };

  useEffect(() => {
    setTemplates(sourceTemplates);
  }, [sourceTemplates]);

  // --- Initialization ---
  useEffect(() => {
      if (mode === 'switching' && currentDomain) {
          setSelectedDomainId(currentDomain.id);
          setExpandedKeys(new Set([currentDomain.id]));
      } else {
          // Fusion mode: default to 'all' or root
          setSelectedDomainId('all');
          const root = domains.find(d => !d.parentId);
          if (root) setExpandedKeys(new Set([root.id]));
      }
  }, [mode, currentDomain]);

  // --- Tree Logic ---
  const domainTree = useMemo(() => {
      const domainNodes = new Map<string, TreeNode>();
      let visibleDomains = domains;
      if (mode === 'switching' && currentDomain) {
          visibleDomains = [currentDomain];
      }

      visibleDomains.forEach(d => {
          domainNodes.set(d.id, { id: d.id, name: d.name, type: 'domain', data: d, children: [] });
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
  }, [mode, currentDomain, domains]);

  const toggleExpand = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const newSet = new Set(expandedKeys);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
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

  // --- Filtering Logic ---
  const filteredTemplates = useMemo(() => {
    let list = templates;

    // 1. Domain Filter
    if (selectedDomainId !== 'all') {
        const domain = domains.find(d => d.id === selectedDomainId);
        if (domain && domain.customerIds) {
            list = list.filter(t => t.customerId && domain.customerIds!.includes(t.customerId));
        } else if (selectedDomainId === '1') {
            list = templates;
        } else {
            list = [];
        }
    }

    // 2. Business Type Filter
    if (activeCategory !== 'all') {
        list = list.filter(t => t.businessTypes.includes(activeCategory));
    }

    // 3. Status Filter
    if (statusFilter !== 'all') {
        list = list.filter(t => t.status === statusFilter);
    }

    // 4. Search Filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      list = list.filter(t => {
          const customerName = customers.find(c => c.id === t.customerId)?.name || '';
          return t.name.toLowerCase().includes(lowerSearch) || customerName.toLowerCase().includes(lowerSearch);
      });
    }
    return list;
  }, [templates, selectedDomainId, activeCategory, search, statusFilter]);

  // Helper: CSS for Grid/List container
  const getContainerClass = () => {
      switch (viewMode) {
          case 'list': return 'flex flex-col gap-3';
          case 'grid-sm': return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4';
          default: return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
      }
  };

  const handleEdit = (temp: any) => {
    setEditingTemplate(temp);
    setStartInPreview(false);
    setIsEditorOpen(true);
  };

  const handlePreview = (temp: any) => {
    setEditingTemplate(temp);
    setStartInPreview(true);
    setIsEditorOpen(true);
  };

  const handleSaveTemplate = (savedTemplate: any) => {
      if (savedTemplate.id) {
          commitTemplates(templates.map(t => t.id === savedTemplate.id ? savedTemplate : t));
      } else {
          commitTemplates([...templates, { ...savedTemplate, id: `t${Date.now()}` }]);
      }
      setIsEditorOpen(false);
  };

  return (
    <div className="h-full flex gap-4 overflow-hidden">
      {/* Left Sidebar: Domain Tree */}
      <div className={`flex flex-col transition-all duration-300 ${isTreeOpen ? 'w-64' : 'w-10'} shrink-0`}>
          {isTreeOpen ? (
              <Card className="h-full flex flex-col" title="所属域" action={
                  <button onClick={() => setIsTreeOpen(false)} title="收起" className="text-slate-400 hover:text-white transition-colors">
                      <ChevronsLeft size={16}/>
                  </button>
              }>
                  <div className="mb-3">
                      <Input placeholder="搜索域..." className="text-xs h-8" prefix={<Search size={14}/>} />
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
                      {mode === 'fusion' && (
                          <div 
                              className={`flex items-center py-2 px-2 cursor-pointer transition-all rounded-md mb-1 border border-transparent ${selectedDomainId === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:border-[var(--sys-border-primary)]'}`}
                              onClick={() => setSelectedDomainId('all')}
                          >
                              <div className="w-4 mr-1"></div>
                              <Globe size={14} className={`mr-2 ${selectedDomainId === 'all' ? 'text-white' : 'text-blue-500'}`} />
                              <span className="text-sm font-medium">全部域</span>
                          </div>
                      )}
                      {renderSidebarNodes(domainTree)}
                  </div>
              </Card>
          ) : (
              <div 
                  className="h-full bg-[#1e293b] border border-[var(--sys-border-primary)] rounded-lg flex flex-col items-center py-4 cursor-pointer hover:bg-slate-800 hover:border-blue-500/50 transition-colors"
                  onClick={() => setIsTreeOpen(true)}
                  title="展开"
              >
                  <ChevronsRight size={16} className="text-blue-500 mb-4" />
                  <span className="text-xs text-slate-400 [writing-mode:vertical-rl] tracking-[0.3em] font-medium select-none">所属域</span>
              </div>
          )}
      </div>

      {/* Right Content */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Header */}
          <Card className="shrink-0" bodyClassName="p-4">
             <div className="flex flex-col gap-3">
                {/* Top Row: Search and View Mode */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Input 
                            placeholder="搜索页面或客户名称..." 
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
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <Button variant="primary" className="bg-emerald-600 hover:bg-emerald-500" icon={<Plus size={16} />} onClick={() => handleEdit({ businessTypes: [] })}>新建页面</Button>
                        <div className="w-px h-6 bg-slate-700"></div>
                        <div className="flex bg-slate-800 rounded p-1 border border-[var(--sys-border-primary)]">
                            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}><List size={16}/></button>
                            <button onClick={() => setViewMode('grid-sm')} className={`p-1.5 rounded transition-colors ${viewMode === 'grid-sm' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}><Grid size={16}/></button>
                            <button onClick={() => setViewMode('grid-lg')} className={`p-1.5 rounded transition-colors ${viewMode === 'grid-lg' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}><LayoutGrid size={16}/></button>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Business Types Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 border-t border-[var(--sys-border-primary)] pt-3">
                    <span className="text-xs text-slate-500 font-medium shrink-0 mr-2">业务类型:</span>
                    <button 
                        onClick={() => setActiveCategory('all')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 border ${activeCategory === 'all' ? 'bg-blue-600 text-white border-blue-500 shadow-sm' : 'bg-slate-800 text-slate-400 border-[var(--sys-border-primary)] hover:text-slate-200 hover:bg-slate-700'}`}
                    >
                        全部
                    </button>
                    {businessTypes.map(bt => (
                        <button 
                            key={bt.code}
                            onClick={() => setActiveCategory(bt.code)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 border ${activeCategory === bt.code ? 'bg-blue-600 text-white border-blue-500 shadow-sm' : 'bg-slate-800 text-slate-400 border-[var(--sys-border-primary)] hover:text-slate-200 hover:bg-slate-700'}`}
                        >
                            {bt.name}
                        </button>
                    ))}
                </div>
             </div>
          </Card>

          {/* Template List/Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
             {/* Context Info */}
             <div className="mb-3 flex items-center text-xs text-slate-500 px-1">
                 <span>当前过滤:</span>
                 <span className="mx-1 text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded border border-blue-500/20">
                     {selectedDomainId === 'all' ? '全部域' : domains.find(d => d.id === selectedDomainId)?.name}
                 </span>
                 <span className="mx-1">+</span>
                 <span className="mx-1 text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded border border-blue-500/20">
                     {activeCategory === 'all' ? '全部业务' : businessTypes.find(b => b.code === activeCategory)?.name}
                 </span>
                 <span className="ml-auto">共 {filteredTemplates.length} 个模板</span>
             </div>

             <div className={`${getContainerClass()} pb-6`}>
                {filteredTemplates.map(temp => {
                    const customer = customers.find(c => c.id === temp.customerId);
                    
                    return (
                      <div 
                        key={temp.id} 
                        className={`
                            bg-[var(--sys-bg-page)] border border-[var(--sys-border-primary)] rounded-lg overflow-hidden group hover:border-blue-500/50 hover:shadow-lg transition-all relative flex
                            ${viewMode === 'list' ? 'flex-row h-28' : 'flex-col'}
                        `}
                      >
                         {/* Thumbnail Area */}
                         <div className={`
                             bg-slate-900 relative overflow-hidden flex items-center justify-center border-[var(--sys-border-primary)] shrink-0
                             ${viewMode === 'list' ? 'w-48 h-full border-r' : 'w-full border-b'}
                             ${viewMode === 'grid-sm' ? 'h-32' : ''}
                             ${viewMode === 'grid-lg' ? 'h-48' : ''}
                         `}>
                            {/* Dynamic Thumbnail */}
                            <TemplateThumbnail template={temp} />
                            
                            {/* Hover Actions - ONLY SHOW IN GRID MODE */}
                            {viewMode !== 'list' && (
                                <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity z-20">
                                    <Button size="sm" variant="primary" icon={<Play size={12}/>} className="shadow-xl h-7 px-2 text-xs" onClick={() => handlePreview(temp)}>预览</Button>
                                    <Button size="sm" variant="secondary" icon={<Edit2 size={12}/>} className="shadow-xl h-7 px-2 text-xs" onClick={() => handleEdit(temp)}>编辑</Button>
                                </div>
                            )}

                            {/* Status Badge (Overlay for Grid) */}
                            {viewMode !== 'list' && (
                                <div className="absolute top-2 right-2 z-10">
                                    <Badge color={temp.status === 'published' ? 'green' : 'yellow'} className="bg-black/60 backdrop-blur border-0 scale-90">
                                        {temp.status === 'published' ? '已发布' : '草稿'}
                                    </Badge>
                                </div>
                            )}
                         </div>

                         {/* Content Area */}
                         <div className={`flex-1 flex flex-col justify-between overflow-hidden ${viewMode === 'list' ? 'p-0' : 'p-3'}`}>
                            {viewMode === 'list' ? (
                                <div className="flex items-center h-full gap-6 px-6 py-3">
                                    {/* Title & Customer */}
                                    <div className="flex flex-col gap-1.5 min-w-[250px]">
                                         <div className="flex items-center gap-3">
                                            <h4 className="text-white font-bold text-base truncate group-hover:text-blue-400 transition-colors" title={temp.name}>{temp.name}</h4>
                                            <Badge color={temp.status === 'published' ? 'green' : 'yellow'}>
                                                {temp.status === 'published' ? '已发布' : '草稿'}
                                            </Badge>
                                         </div>
                                         {customer && (
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <Building2 size={12} />
                                                <span className="text-xs truncate max-w-[200px]" title={customer.name}>{customer.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tags (Centered in List) */}
                                    <div className="flex-1 flex flex-wrap gap-2 justify-center">
                                        {temp.businessTypes.map((bt: string) => (
                                            <span key={bt} className="text-xs px-2 py-1 bg-slate-800/50 text-slate-300 rounded border border-[var(--sys-border-primary)] whitespace-nowrap flex items-center gap-1">
                                                <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                                                {businessTypes.find(b => b.code === bt)?.name}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Meta & Actions */}
                                    <div className="flex flex-col items-end gap-2 min-w-[150px]">
                                         <span className="text-xs text-slate-500">更新于 {temp.lastUpdate}</span>
                                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="sm" variant="secondary" icon={<Edit2 size={12}/>} onClick={() => handleEdit(temp)}>编辑</Button>
                                            <Button size="sm" variant="primary" icon={<Play size={12}/>} onClick={() => handlePreview(temp)}>预览</Button>
                                         </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                           <div className="flex flex-col overflow-hidden">
                                               <h4 className="text-white font-bold text-sm truncate group-hover:text-blue-400 transition-colors" title={temp.name}>{temp.name}</h4>
                                               {customer && (
                                                    <div className="flex items-center gap-1 mt-1 text-slate-400">
                                                        <Building2 size={10} />
                                                        <span className="text-[10px] truncate max-w-[150px]" title={customer.name}>{customer.name}</span>
                                                    </div>
                                                )}
                                           </div>
                                        </div>
                                        
                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-1 mt-2 mb-2">
                                            {temp.businessTypes.slice(0, viewMode === 'grid-sm' ? 2 : 3).map((bt: string) => (
                                                <span key={bt} className="text-[10px] px-1.5 py-0.5 bg-slate-800/80 text-slate-400 rounded border border-[var(--sys-border-primary)] whitespace-nowrap">
                                                    {businessTypes.find(b => b.code === bt)?.name}
                                                </span>
                                            ))}
                                            {temp.businessTypes.length > (viewMode === 'grid-sm' ? 2 : 3) && <span className="text-[10px] text-slate-500">...</span>}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-[var(--sys-border-primary)] mt-auto">
                                       <span>更新于 {temp.lastUpdate}</span>
                                       <button className="text-slate-500 hover:text-white transition-colors"><MoreVertical size={14}/></button>
                                    </div>
                                </>
                            )}
                         </div>
                      </div>
                    );
                })}
                
                {/* Empty State */}
                {filteredTemplates.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center text-slate-600">
                        <LayoutGrid size={48} className="opacity-10 mb-4" />
                        <p>该分类下暂无模板或您没有相关业务权限</p>
                    </div>
                )}
             </div>
          </div>
      </div>

      {/* Full Screen Editor Overlay */}
      {isEditorOpen && (
          <TemplateEditor 
              template={editingTemplate} 
              onClose={() => setIsEditorOpen(false)} 
              onSave={handleSaveTemplate}
              initialPreview={startInPreview}
          />
      )}
    </div>
  );
};
