
import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, BookOpen, Video, FileText, AlertCircle, ThumbsUp, ThumbsDown, 
  Sparkles, ChevronRight, PlayCircle, Loader2, Maximize2, Minimize2, 
  X, Filter, Upload, Edit3, Save, History, ArrowLeft, Plus, Trash2, CheckCircle2, RotateCcw
} from 'lucide-react';
import { Button, Badge, Input, SectionTitle, Modal, ConfirmDialog } from '../components/UI';
import { showAppToast } from '../components/AppFeedback';
import { MOCK_KB_DATA } from './data';
import { KnowledgeItem, KBBusinessType, KnowledgeVersion } from './types';
import { GoogleGenAI } from "@google/genai";
import { formatRelativeTime } from '../utils/time';

interface KBProps {
  mode: 'full' | 'half';
  onToggleMode: () => void;
  onClose: () => void;
}

export const KnowledgeBaseView: React.FC<KBProps> = ({ mode, onToggleMode, onClose }) => {
  const [kbData, setKbData] = useState<KnowledgeItem[]>(MOCK_KB_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiError, setAiError] = useState(false);
  const [activeBiz, setActiveBiz] = useState<KBBusinessType | 'ALL'>('ALL');
  
  // View State
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Edit State
  const [editForm, setEditForm] = useState<Partial<KnowledgeItem>>({});
  const [changeLog, setChangeLog] = useState('');

  const selectedItem = useMemo(() => 
    kbData.find(i => i.id === selectedItemId) || null
  , [kbData, selectedItemId]);

  const BIZ_MAP = {
    'ALL': { label: '全部业务', color: 'gray' },
    'LINE': { label: '政企专线', color: 'blue' },
    '5G': { label: '5G业务', color: 'green' },
    'IDC': { label: '机房环境', color: 'yellow' },
    'SDWAN': { label: 'SD-WAN', color: 'purple' },
    'AIC': { label: '智算中心', color: 'red' }
  };

  const filteredData = useMemo(() => {
    return kbData.filter(item => {
      const matchBiz = activeBiz === 'ALL' || item.businessType === activeBiz;
      const matchSearch = item.title.includes(searchQuery) || item.tags.some(t => t.includes(searchQuery));
      return matchBiz && matchSearch;
    });
  }, [kbData, activeBiz, searchQuery]);

  const handleAISearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setAiResponse(null);
    setAiError(false);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
      if (!apiKey) {
        setAiResponse('当前未启用 AI 引擎。您可以先使用关键词筛选下方知识条目，或联系客户经理获取人工支持。');
        showAppToast('当前环境未启用 AI 引擎。', {
          title: 'AI 能力未启用',
          tone: 'warning',
          duration: 2800,
        });
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `你是一名资深的政企运维专家。用户提问: "${searchQuery}"。请基于你的专业知识，给出针对性的排障建议。`,
      });
      setAiResponse(response.text || "AI 暂时无法回答。");
    } catch (error) {
      setAiError(true);
      setAiResponse("AI 暂时无法响应，可能是请求超时或问题较复杂。建议换一个更短关键词重试，或直接查看下方相关知识。");
      showAppToast('AI 检索失败，请稍后重试。', {
        title: '请求失败',
        tone: 'danger',
      });
    } finally {
      setIsSearching(false);
    }
  };

  // --- Actions ---
  const startEdit = () => {
    if (!selectedItem) return;
    setEditForm({ ...selectedItem });
    setChangeLog('');
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (!selectedItem || !editForm.title) return;
    
    const newVersion: KnowledgeVersion = {
      versionId: `v-${Date.now()}`,
      versionNum: `V1.${(selectedItem.versions?.length || 0) + 1}`,
      updateTime: new Date().toLocaleString(),
      updater: '当前用户',
      changeLog: changeLog || '修正了部分内容',
      content: editForm.content || '',
      steps: editForm.steps
    };

    const updatedData = kbData.map(item => {
      if (item.id === selectedItemId) {
        return {
          ...item,
          ...editForm,
          updateTime: new Date().toISOString().split('T')[0],
          versions: [newVersion, ...(item.versions || [])]
        } as KnowledgeItem;
      }
      return item;
    });

    setKbData(updatedData);
    setIsEditing(false);
  };

  const restoreVersion = (v: KnowledgeVersion) => {
    if (!selectedItemId) return;
    const updatedData = kbData.map(item => {
        if (item.id === selectedItemId) {
            return {
                ...item,
                content: v.content,
                steps: v.steps,
                updateTime: new Date().toISOString().split('T')[0]
            };
        }
        return item;
    });
    setKbData(updatedData);
  };

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      const newItem: KnowledgeItem = {
        id: `kb-${Date.now()}`,
        title: '新上传的排障文档',
        businessType: 'LINE',
        contentType: 'GUIDE',
        content: '从解析的文档中提取的正文内容...',
        tags: ['新上传', '待归档'],
        views: 0, likes: 0,
        updateTime: new Date().toISOString().split('T')[0],
        steps: ['解析出的步骤1', '解析出的步骤2']
      };
      setKbData([newItem, ...kbData]);
      setIsUploading(false);
      setUploadModalOpen(false);
    }, 2000);
  };

  return (
    <div className="flex h-full bg-[var(--sys-bg-page)] text-slate-200 overflow-hidden flex-col font-sans">
      {/* Header */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-[var(--sys-bg-header)] shrink-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <BookOpen className="text-blue-500" size={20} />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">智慧知识库</h2>
          {!selectedItemId && (
             <Button 
                size="sm" 
                variant="primary" 
                className="ml-4 bg-emerald-600 hover:bg-emerald-500 border-none h-8"
                onClick={() => setUploadModalOpen(true)}
                icon={<Upload size={14}/>}
             >
                文档上传
             </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggleMode} className="p-2 hover:bg-slate-800 rounded-md text-slate-400 transition-colors">
            {mode === 'half' ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>
          <button onClick={onClose} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-md text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {!selectedItemId && (
           <div className={`w-16 md:w-48 border-r border-slate-800 bg-[var(--sys-bg-header)]/50 flex flex-col p-4 gap-2 shrink-0 ${mode === 'half' ? 'hidden md:flex' : 'flex'}`}>
              <SectionTitle title="业务领域" className="mb-2 hidden md:flex" />
              {(Object.keys(BIZ_MAP) as (keyof typeof BIZ_MAP)[]).map(key => (
                <button
                  key={key}
                  onClick={() => { setActiveBiz(key); }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${activeBiz === key ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  <div className={`w-2 h-2 rounded-full bg-${BIZ_MAP[key].color}-500 shadow-[0_0_8px_currentColor]`}></div>
                  <span className="hidden md:inline">{BIZ_MAP[key].label}</span>
                </button>
              ))}
           </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--sys-bg-page)] relative">
          
          {!selectedItem ? (
            /* List Mode */
            <>
              <div className="p-8 border-b border-slate-800 bg-gradient-to-b from-[var(--sys-bg-header)]/40 to-transparent">
                <div className="max-w-3xl mx-auto relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-500">
                    <Sparkles size={20} className={isSearching ? 'animate-spin' : ''} />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-12 pr-32 py-4 bg-[#1e293b] border border-slate-700 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-2xl transition-all"
                    placeholder="输入问题，AI 专家为您实时解答..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
                  />
                  <div className="absolute inset-y-2 right-2 flex items-center">
                    <Button onClick={handleAISearch} disabled={isSearching} className="rounded-xl h-full px-6 bg-blue-600 hover:bg-blue-500 border-none">
                      {isSearching ? <Loader2 className="animate-spin mr-2" size={16}/> : <Search className="mr-2" size={16}/>}
                      语义搜索
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                {aiResponse && (
                  <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500 bg-blue-950/20 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-sm">
                    <Badge color="blue" className="mb-4 flex w-fit items-center gap-2 px-3 py-1"><Sparkles size={14}/> AI 诊断建议</Badge>
                    <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{aiResponse}</div>
                    {aiError && (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-600 bg-slate-800/70 px-2 py-1 text-slate-300">换个简短关键词重试</span>
                        <span className="rounded-full border border-slate-600 bg-slate-800/70 px-2 py-1 text-slate-300">浏览下方相关知识</span>
                        <span className="rounded-full border border-slate-600 bg-slate-800/70 px-2 py-1 text-slate-300">转人工客户经理</span>
                      </div>
                    )}
                  </div>
                )}
                <div className={`grid gap-6 ${mode === 'full' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {filteredData.map(item => (
                    <div key={item.id} onClick={() => setSelectedItemId(item.id)} className="bg-[#1e293b]/40 border border-slate-800 rounded-2xl p-6 hover:bg-[#1e293b]/70 hover:border-blue-500/50 cursor-pointer transition-all group shadow-xl">
                      <div className="flex justify-between mb-4">
                        {item.contentType === 'VIDEO' ? <Video size={20} className="text-red-400" /> : <FileText size={20} className="text-blue-400" />}
                        <Badge color={BIZ_MAP[item.businessType].color as any}>{BIZ_MAP[item.businessType].label}</Badge>
                      </div>
                      <h3 className="text-white font-bold text-lg mb-2 group-hover:text-blue-400 transition-colors line-clamp-1">{item.title}</h3>
                      <p className="text-xs text-slate-500 mb-6 line-clamp-2">{item.content}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-4 border-t border-slate-800/50">
                        <div className="flex gap-2">{item.tags.map(t => <span key={t}>#{t}</span>)}</div>
                        <span>{formatRelativeTime(item.updateTime, { fallback: item.updateTime })}</span>
                      </div>
                    </div>
                  ))}
                  {filteredData.length === 0 && (
                    <div className="col-span-full rounded-2xl border border-slate-700 bg-slate-900/40 p-8 text-center">
                      <div className="mx-auto mb-3 w-fit rounded-full bg-slate-800 p-3 text-slate-300">
                        <AlertCircle size={18} />
                      </div>
                      <h3 className="text-base font-semibold text-slate-100">未找到匹配知识</h3>
                      <p className="mt-2 text-sm text-slate-400">请尝试更短关键词，或切换业务类型后再试。</p>
                      <div className="mt-3 text-xs text-slate-500">兜底建议：您也可以直接转人工客户经理。</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Detail / Edit Mode */
            <div className="flex-1 flex overflow-hidden bg-[var(--sys-bg-page)]">
              <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-800/50">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[var(--sys-bg-header)]/30 shrink-0">
                  <button onClick={() => { setSelectedItemId(null); setIsEditing(false); }} className="flex items-center gap-2 text-blue-500 text-sm font-medium hover:text-blue-400">
                    <ArrowLeft size={16} /> 返回列表
                  </button>
                  <div className="flex gap-3">
                    {!isEditing ? (
                      <Button size="sm" variant="secondary" onClick={startEdit} icon={<Edit3 size={14}/>}>编辑文档</Button>
                    ) : (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => setIsEditing(false)}>取消编辑</Button>
                        <Button size="sm" variant="primary" onClick={saveEdit} className="bg-blue-600" icon={<Save size={14}/>}>保存新版本</Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
                  {isEditing ? (
                    /* Edit Form */
                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
                       <Input label="文档标题" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="text-xl font-bold h-14" />
                       
                       <div className="space-y-2">
                          <label className="text-sm text-slate-400">正文内容</label>
                          <textarea 
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-xl p-4 text-slate-200 min-h-[200px] focus:ring-2 focus:ring-blue-500/50 outline-none"
                            value={editForm.content}
                            onChange={e => setEditForm({...editForm, content: e.target.value})}
                          />
                       </div>

                       <div className="space-y-4">
                          <SectionTitle title="操作步骤编辑" />
                          {editForm.steps?.map((step, idx) => (
                            <div key={idx} className="flex gap-3 items-center group">
                               <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-500 shrink-0">{idx+1}</div>
                               <Input 
                                  value={step} 
                                  onChange={e => {
                                     const newSteps = [...(editForm.steps || [])];
                                     newSteps[idx] = e.target.value;
                                     setEditForm({...editForm, steps: newSteps});
                                  }}
                                  className="flex-1"
                               />
                               <button onClick={() => setEditForm({...editForm, steps: editForm.steps?.filter((_, i) => i !== idx)})} className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 size={16}/>
                               </button>
                            </div>
                          ))}
                          <Button variant="ghost" size="sm" onClick={() => setEditForm({...editForm, steps: [...(editForm.steps || []), '']})} className="text-blue-400 border border-dashed border-blue-500/30 w-full py-3 mt-4 hover:bg-blue-500/10">
                             <Plus size={14} className="mr-2" /> 新增步骤
                          </Button>
                       </div>

                       <div className="pt-6 border-t border-slate-800">
                          <Input label="版本变更摘要 (必填)" placeholder="简述本次修改内容，如：更新了排障指引..." value={changeLog} onChange={e => setChangeLog(e.target.value)} />
                       </div>
                    </div>
                  ) : (
                    /* Display Detail */
                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
                       <div className="flex items-center gap-4">
                          <Badge color={BIZ_MAP[selectedItem.businessType].color as any}>{BIZ_MAP[selectedItem.businessType].label}</Badge>
                          <span className="text-xs text-slate-500 flex items-center gap-1"><History size={12}/> 当前版本：V1.{selectedItem.versions?.length || 1}</span>
                       </div>
                       <h1 className="text-4xl font-black text-white tracking-tight leading-tight">{selectedItem.title}</h1>
                       <div className="bg-[#1e293b]/40 rounded-3xl p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-8 opacity-5"><Sparkles size={120} className="text-blue-500"/></div>
                          <p className="text-slate-300 leading-relaxed text-lg mb-10 whitespace-pre-wrap">{selectedItem.content}</p>
                          
                          {selectedItem.steps && (
                            <div className="space-y-6">
                               <SectionTitle title="标准作业流程 (SOP)" />
                               <div className="grid gap-4">
                                  {selectedItem.steps.map((step, i) => (
                                    <div key={i} className="flex gap-5 items-start bg-slate-900/60 p-5 rounded-2xl border border-slate-800 hover:border-blue-500/30 transition-colors group">
                                       <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 font-bold text-sm border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                          {i + 1}
                                       </div>
                                       <span className="text-slate-200 text-[15px] pt-1 leading-relaxed">{step}</span>
                                    </div>
                                  ))}
                               </div>
                            </div>
                          )}
                       </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Versions Sidebar */}
              <div className="w-72 bg-[var(--sys-bg-header)]/30 p-6 flex flex-col shrink-0">
                 <SectionTitle title="版本演进" className="mb-6" />
                 <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 relative pl-4">
                    <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-800"></div>
                    {selectedItem.versions?.map((v, idx) => (
                       <div key={v.versionId} className="relative pl-8 group">
                          <div className={`absolute left-[-4px] top-1.5 w-3 h-3 rounded-full border-2 border-[var(--sys-bg-page)] ${idx === 0 ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-slate-700'} z-10 transition-all group-hover:scale-125`}></div>
                          <div className={`p-4 rounded-xl border border-slate-800 transition-all ${idx === 0 ? 'bg-blue-600/10 border-blue-500/30' : 'bg-slate-900/50 hover:border-slate-600'}`}>
                             <div className="flex justify-between items-center mb-1">
                                <span className={`text-xs font-bold ${idx === 0 ? 'text-blue-400' : 'text-slate-400'}`}>{v.versionNum}</span>
                                <span className="text-[10px] text-slate-600">{v.updateTime.split(' ')[0]}</span>
                             </div>
                             <div className="text-[11px] text-slate-300 font-medium line-clamp-2 mb-2 leading-snug">{v.changeLog}</div>
                             <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800/50">
                                <span className="text-[9px] text-slate-600">由 {v.updater} 更新</span>
                                {idx !== 0 && !isEditing && (
                                   <button 
                                      onClick={() => restoreVersion(v)}
                                      className="text-[10px] text-blue-500 hover:text-blue-400 flex items-center gap-1 font-bold"
                                   >
                                      <RotateCcw size={10}/> 还原此版
                                   </button>
                                )}
                             </div>
                          </div>
                       </div>
                    ))}
                    {!selectedItem.versions?.length && (
                       <div className="text-slate-600 text-center py-10 italic text-sm">暂无版本记录</div>
                    )}
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Modal 
        isOpen={uploadModalOpen} 
        onClose={() => setUploadModalOpen(false)} 
        title="上传排障文档" 
        size="sm"
        footer={<>
           <Button variant="secondary" onClick={() => setUploadModalOpen(false)}>取消</Button>
           <Button onClick={handleUpload} disabled={isUploading} className="bg-emerald-600">
              {isUploading ? <Loader2 className="animate-spin mr-2" size={14}/> : <Upload size={14} className="mr-2"/>}
              开始上传并解析
           </Button>
        </>}
      >
         <div className="p-4">
            <div className="w-full h-48 border-2 border-dashed border-slate-700 rounded-3xl flex flex-col items-center justify-center bg-slate-900/50 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group">
               {isUploading ? (
                  <div className="flex flex-col items-center">
                     <Loader2 className="animate-spin text-blue-500 mb-4" size={40}/>
                     <span className="text-sm text-slate-400">正在通过 AI 引擎解析文档内容...</span>
                  </div>
               ) : (
                  <>
                     <div className="p-4 bg-slate-800 rounded-2xl mb-4 group-hover:bg-blue-600 transition-colors">
                        <Upload size={32} className="text-slate-400 group-hover:text-white"/>
                     </div>
                     <span className="text-sm text-slate-300 font-bold">点击或拖拽文件至此处上传</span>
                     <span className="text-xs text-slate-500 mt-2">支持 PDF, Word, TXT 格式 (最大 20MB)</span>
                  </>
               )}
            </div>
            {isUploading && (
               <div className="mt-6 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 animate-[progress_2s_ease-in-out_infinite]"></div>
               </div>
            )}
         </div>
      </Modal>

      <style>{`
        @keyframes progress {
           0% { width: 0%; }
           100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};
