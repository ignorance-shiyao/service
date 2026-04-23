import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Save, Eye, Layers, LayoutGrid, Maximize, Minimize, Image as ImageIcon, Plus, ChevronDown, ChevronRight, ZoomIn, ZoomOut, Trash2, Search, MousePointer2 } from 'lucide-react';
import { Button, Input, Switch } from './UI';
import { BUSINESS_TYPES, MOCK_COMPONENTS, MOCK_CUSTOMERS } from '../constants';
import { BizIdcPreview } from './previews/BizIdcPreview';
import { BizLinePreview } from './previews/BizLinePreview';
import { BizInetPreview } from './previews/BizInetPreview';
import { BizIntranetPreview } from './previews/BizIntranetPreview';
import { BizDialPreview } from './previews/BizDialPreview';
import { BizCollectPreview } from './previews/BizCollectPreview';
import { Biz5GPreview } from './previews/Biz5GPreview';
import { BizCompPreview } from './previews/BizCompPreview';
import { BizBasePreview } from './previews/BizBasePreview';
import { BizOtherPreview } from './previews/BizOtherPreview';
import { BizAICPreview } from './previews/BizAICPreview';
import { BizSDWANPreview } from './previews/BizSDWANPreview';
import { GenericPreview } from './previews/GenericPreview';

interface TemplateEditorProps {
  template: any;
  onClose: () => void;
  onSave: (template: any) => void;
  initialPreview?: boolean;
}

// Initial Mock Data
const INITIAL_LAYOUT = [
    { id: '1', compId: 'base_02', x: 20, y: 20, w: 400, h: 60, title: '通用标题' },
    { id: '2', compId: 'other_02', x: 440, y: 20, w: 400, h: 220, title: '单张图片' },
    { id: '3', compId: 'other_03', x: 860, y: 20, w: 400, h: 220, title: '带宽利用率画像' },
    { id: '4', compId: 'other_04', x: 20, y: 260, w: 400, h: 100, title: '时间器' },
    { id: '5', compId: 'other_07', x: 20, y: 380, w: 400, h: 220, title: '巡检结论' },
    { id: '6', compId: 'other_10', x: 20, y: 620, w: 400, h: 150, title: '自定义标题窗口' },
    { id: '7', compId: 'idc_01', x: 20, y: 790, w: 400, h: 180, title: '设备历史性能' },
    { id: '8', compId: 'idc_06', x: 440, y: 260, w: 820, h: 510, title: '视频监控' },
    { id: '9', compId: 'idc_07', x: 440, y: 790, w: 820, h: 180, title: '告警统计' },
    { id: '10', compId: 'idc_02', x: 1280, y: 20, w: 600, h: 300, title: '实时告警' },
    { id: '11', compId: 'idc_04', x: 1280, y: 340, w: 600, h: 300, title: '历史告警' },
    { id: '12', compId: 'idc_05', x: 1280, y: 660, w: 600, h: 310, title: '视频监控设备' },
];

const RULER_SIZE = 20;

const Ruler: React.FC<{ orientation: 'horizontal' | 'vertical'; scale: number; offset: number; length: number }> = ({ orientation, scale, offset, length }) => {
    const isHorizontal = orientation === 'horizontal';
    
    // Generate ticks
    const step = 50; // Logical step in pixels
    const visualStep = step * scale;
    
    const startLogical = -offset / scale;
    const endLogical = (length - offset) / scale;
    
    const firstTick = Math.floor(startLogical / step) * step;
    
    const ticks = [];
    for (let val = firstTick; val < endLogical; val += step) {
        const visualPos = offset + val * scale;
        if (visualPos < -50 || visualPos > length + 50) continue;
        
        ticks.push(
            <g key={val} transform={isHorizontal ? `translate(${visualPos}, 0)` : `translate(0, ${visualPos})`}>
                <line 
                    x1={0} y1={0} 
                    stroke="#64748b" 
                    strokeWidth={val % 100 === 0 ? 1 : 0.5}
                    y2={isHorizontal ? (val % 100 === 0 ? RULER_SIZE : RULER_SIZE / 2) : 0}
                    x2={isHorizontal ? 0 : (val % 100 === 0 ? RULER_SIZE : RULER_SIZE / 2)}
                />
                {val % 100 === 0 && (
                    <text 
                        x={isHorizontal ? 2 : 2} 
                        y={isHorizontal ? 10 : 10} 
                        fontSize="8" 
                        fill="#94a3b8"
                        transform={!isHorizontal ? "rotate(-90, 2, 10)" : ""}
                    >
                        {val}
                    </text>
                )}
            </g>
        );
    }

    return (
        <svg width={isHorizontal ? '100%' : RULER_SIZE} height={isHorizontal ? RULER_SIZE : '100%'} className="bg-[var(--sys-bg-header)] border-slate-700 select-none block absolute z-10" style={isHorizontal ? { left: RULER_SIZE, top: 0, borderBottomWidth: 1 } : { left: 0, top: RULER_SIZE, borderRightWidth: 1 }}>
            {ticks}
        </svg>
    );
};

export const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, onClose, onSave, initialPreview = false }) => {
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [activeLeftTab, setActiveLeftTab] = useState<'components' | 'layers'>('components');
  
  const allowedBusinessTypes = useMemo(() => {
      const baseTypes = ['BIZ_BASE', 'BIZ_OTHER'];
      if (!template?.customerId) return [...baseTypes, ...BUSINESS_TYPES.map(b => b.code)]; 
      
      const customer = MOCK_CUSTOMERS.find(c => c.id === template.customerId);
      if (!customer) return baseTypes;
      
      return [...baseTypes, ...customer.businessTypes];
  }, [template]);

  const [expandedCategories, setExpandedCategories] = useState<string[]>(['BIZ_OTHER', 'BIZ_IDC', 'BIZ_BASE', 'BIZ_AIC', 'BIZ_SDWAN']);
  const [isPreviewMode, setIsPreviewMode] = useState(initialPreview);
  
  // Page Settings State
  const [pageConfig, setPageConfig] = useState({
      name: template?.name || 'IDC管家',
      width: 1920,
      height: 990,
      bgColor: 'rgba(6, 11, 47, 1)',
      bgImage: '',
      status: template?.status || 'draft'
  });

  const [layoutItems, setLayoutItems] = useState(INITIAL_LAYOUT);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  const [transform, setTransform] = useState({ x: 100, y: 100, scale: 0.6 });
  const viewportRef = useRef<HTMLDivElement>(null);

  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingItem, setIsDraggingItem] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{x: number, y: number, itemX: number, itemY: number, itemW: number, itemH: number}>({ x: 0, y: 0, itemX:0, itemY:0, itemW:0, itemH:0 });

  useEffect(() => {
      if (viewportRef.current) {
          const vw = viewportRef.current.clientWidth;
          const vh = viewportRef.current.clientHeight;
          const initialX = (vw - pageConfig.width * 0.6) / 2 - RULER_SIZE; 
          const initialY = (vh - pageConfig.height * 0.6) / 2 - RULER_SIZE;
          setTransform({ x: initialX > 0 ? initialX : 50, y: initialY > 0 ? initialY : 50, scale: 0.6 });
      }
  }, []); 

  const selectedItem = layoutItems.find(item => item.id === selectedItemId);

  const toggleCategory = (code: string) => {
      setExpandedCategories(prev => 
          prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
      );
  };

  const handleExitPreview = () => {
      if (initialPreview) {
          onClose();
      } else {
          setIsPreviewMode(false);
      }
  };

  const handleSave = () => {
      const updatedTemplate = {
          ...template,
          name: pageConfig.name,
          status: pageConfig.status,
          lastUpdate: new Date().toISOString().split('T')[0]
      };
      onSave(updatedTemplate);
  };

  const handleWheel = (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
          e.preventDefault(); 
          const zoomSensitivity = 0.001;
          const delta = -e.deltaY * zoomSensitivity;
          const newScale = Math.min(Math.max(transform.scale + delta, 0.2), 3);
          setTransform(prev => ({ ...prev, scale: newScale }));
      } else {
          setTransform(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
      }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-area')) {
          setIsPanning(true);
          dragStartRef.current = { ...dragStartRef.current, x: e.clientX, y: e.clientY };
          setSelectedItemId(null);
      }
  };

  const handleItemMouseDown = (e: React.MouseEvent, item: any) => {
      if (isPreviewMode) return;
      e.stopPropagation();
      setSelectedItemId(item.id);
      setIsDraggingItem(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY, itemX: item.x, itemY: item.y, itemW: item.w, itemH: item.h };
  };

  const handleResizeStart = (e: React.MouseEvent, handle: string, item: any) => {
      if (isPreviewMode) return;
      e.stopPropagation();
      setIsResizing(true);
      setResizeHandle(handle);
      dragStartRef.current = { x: e.clientX, y: e.clientY, itemX: item.x, itemY: item.y, itemW: item.w, itemH: item.h };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      const dx = (e.clientX - dragStartRef.current.x) / transform.scale;
      const dy = (e.clientY - dragStartRef.current.y) / transform.scale;

      if (isPanning) {
          const rawDx = e.clientX - dragStartRef.current.x;
          const rawDy = e.clientY - dragStartRef.current.y;
          setTransform(prev => ({ ...prev, x: prev.x + rawDx, y: prev.y + rawDy }));
          dragStartRef.current = { ...dragStartRef.current, x: e.clientX, y: e.clientY };
      } else if (isDraggingItem && selectedItemId) {
          setLayoutItems(prev => prev.map(item => 
              item.id === selectedItemId 
                  ? { ...item, x: dragStartRef.current.itemX + dx, y: dragStartRef.current.itemY + dy } 
                  : item
          ));
      } else if (isResizing && selectedItemId && resizeHandle) {
          setLayoutItems(prev => prev.map(item => {
              if (item.id !== selectedItemId) return item;
              
              let newX = dragStartRef.current.itemX;
              let newY = dragStartRef.current.itemY;
              let newW = dragStartRef.current.itemW;
              let newH = dragStartRef.current.itemH;

              if (resizeHandle.includes('e')) newW = Math.max(20, dragStartRef.current.itemW + dx);
              if (resizeHandle.includes('s')) newH = Math.max(20, dragStartRef.current.itemH + dy);
              if (resizeHandle.includes('w')) {
                  const maxDx = dragStartRef.current.itemW - 20;
                  const validDx = Math.min(dx, maxDx);
                  newX = dragStartRef.current.itemX + validDx;
                  newW = dragStartRef.current.itemW - validDx;
              }
              if (resizeHandle.includes('n')) {
                  const maxDy = dragStartRef.current.itemH - 20;
                  const validDy = Math.min(dy, maxDy);
                  newY = dragStartRef.current.itemY + validDy;
                  newH = dragStartRef.current.itemH - validDy;
              }

              return { ...item, x: newX, y: newY, w: newW, h: newH };
          }));
      }
  };

  const handleMouseUp = () => {
      setIsPanning(false);
      setIsDraggingItem(false);
      setIsResizing(false);
      setResizeHandle(null);
  };

  const handleLibraryDragStart = (e: React.DragEvent, comp: any) => {
      e.dataTransfer.setData('application/json', JSON.stringify(comp));
      e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      try {
          const data = e.dataTransfer.getData('application/json');
          if (!data) return;
          const comp = JSON.parse(data);
          
          if (canvasRef.current) {
              const rect = canvasRef.current.getBoundingClientRect();
              const dropX = (e.clientX - rect.left) / transform.scale;
              const dropY = (e.clientY - rect.top) / transform.scale;

              const newItem = {
                  id: Date.now().toString(),
                  compId: comp.id,
                  x: dropX - 200, 
                  y: dropY - 150,
                  w: 400, 
                  h: 300, 
                  title: comp.name
              };
              setLayoutItems([...layoutItems, newItem]);
              setSelectedItemId(newItem.id);
          }
      } catch (err) {
          console.error("Drop failed", err);
      }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
  };

  const handleDeleteItem = () => {
      if(selectedItemId) {
          setLayoutItems(items => items.filter(i => i.id !== selectedItemId));
          setSelectedItemId(null);
      }
  };

  const renderThumbnail = (comp: any) => {
      const props = { comp };
      let PreviewComponent = GenericPreview;
      switch (comp.category) {
        case 'BIZ_AIC': PreviewComponent = BizAICPreview; break;
        case 'BIZ_SDWAN': PreviewComponent = BizSDWANPreview; break;
        case 'BIZ_LINE': PreviewComponent = BizLinePreview; break;
        case 'BIZ_INET': PreviewComponent = BizInetPreview; break;
        case 'BIZ_INTRANET': PreviewComponent = BizIntranetPreview; break;
        case 'BIZ_DIAL': PreviewComponent = BizDialPreview; break;
        case 'BIZ_COLLECT': PreviewComponent = BizCollectPreview; break;
        case 'BIZ_COMP': PreviewComponent = BizCompPreview; break;
        case 'BIZ_5G': PreviewComponent = Biz5GPreview; break;
        case 'BIZ_IDC': PreviewComponent = BizIdcPreview; break;
        case 'BIZ_BASE': PreviewComponent = BizBasePreview; break;
        case 'BIZ_OTHER': PreviewComponent = BizOtherPreview; break;
        default: PreviewComponent = GenericPreview; break;
      }
      return (
          <div className="bg-[var(--sys-bg-page)] relative overflow-hidden pointer-events-none scale-75 origin-top-left" style={{ width: '133.33%', height: '133.33%' }}>
              <PreviewComponent {...props} />
          </div>
      );
  };

  return (
    <div className={`fixed z-[100] bg-[#1e293b] flex flex-col shadow-2xl transition-all duration-300 ${isFullscreen ? 'inset-0' : 'inset-10 rounded-lg border border-slate-600'}`}>
        
        {isPreviewMode && (
            <div className="absolute top-4 right-4 z-50 animate-in fade-in zoom-in">
                <Button 
                    className="bg-slate-800/80 backdrop-blur border border-slate-600 hover:bg-slate-700 text-white shadow-xl" 
                    onClick={handleExitPreview}
                    icon={<X size={16}/>}
                >
                    {initialPreview ? '关闭预览' : '退出预览'}
                </Button>
            </div>
        )}

        {!isPreviewMode && (
            <div className="h-12 bg-[var(--sys-bg-header)] border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <span className="text-slate-400 text-xs">页面设计</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-white font-bold text-sm">{pageConfig.name}</span>
                    {template.customerId && (
                        <div className="flex items-center text-[10px] text-slate-500 border border-slate-700 rounded px-2 py-0.5 bg-slate-900/50">
                            所属客户: {MOCK_CUSTOMERS.find(c => c.id === template.customerId)?.name}
                        </div>
                    )}
                    <div className="flex items-center gap-2 ml-4 border-l border-slate-700 pl-4">
                        <Switch 
                            checked={pageConfig.status === 'published'} 
                            onChange={c => setPageConfig({...pageConfig, status: c ? 'published' : 'draft'})} 
                        />
                        <span className={`text-xs ${pageConfig.status === 'published' ? 'text-green-400' : 'text-yellow-400'}`}>
                            {pageConfig.status === 'published' ? '已发布' : '草稿'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white border-none" icon={<Save size={14}/>} onClick={handleSave}>保存</Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-none" icon={<Eye size={14}/>} onClick={() => setIsPreviewMode(true)}>预览</Button>
                    <div className="w-px h-4 bg-slate-700 mx-2"></div>
                    <button onClick={() => setIsFullscreen(!isFullscreen)} className="text-slate-400 hover:text-white">
                        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                    </button>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-400 ml-2">
                        <X size={20} />
                    </button>
                </div>
            </div>
        )}

        <div className="flex-1 flex overflow-hidden">
            {!isPreviewMode && (
                <div className="w-64 bg-[var(--sys-bg-header)] border-r border-slate-800 flex flex-col shrink-0">
                    <div className="flex h-10 border-b border-slate-800">
                        <button 
                            onClick={() => setActiveLeftTab('components')}
                            className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium transition-colors ${activeLeftTab === 'components' ? 'text-blue-400 bg-[#1e293b] border-t-2 border-blue-500' : 'text-slate-400 hover:bg-slate-800'}`}
                        >
                            <LayoutGrid size={14} /> 组件库
                        </button>
                        <button 
                            onClick={() => setActiveLeftTab('layers')}
                            className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium transition-colors ${activeLeftTab === 'layers' ? 'text-blue-400 bg-[#1e293b] border-t-2 border-blue-500' : 'text-slate-400 hover:bg-slate-800'}`}
                        >
                            <Layers size={14} /> 图层
                        </button>
                    </div>

                    {activeLeftTab === 'components' && (
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="p-2 border-b border-slate-800/50">
                                <div className="relative">
                                    <Search size={14} className="absolute left-2 top-2 text-slate-500"/>
                                    <input className="w-full bg-[#1e293b] border border-slate-700 rounded py-1.5 pl-8 text-xs text-white placeholder-slate-500" placeholder="搜索组件" />
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                {BUSINESS_TYPES.filter(bt => allowedBusinessTypes.includes(bt.code)).map(cat => {
                                    const comps = MOCK_COMPONENTS.filter(c => c.category === cat.code);
                                    if (comps.length === 0) return null;
                                    const isExpanded = expandedCategories.includes(cat.code);

                                    return (
                                        <div key={cat.code} className="border border-slate-800 rounded bg-[var(--sys-bg-page)]">
                                            <div 
                                                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-800/50"
                                                onClick={() => toggleCategory(cat.code)}
                                            >
                                                <span className="text-xs text-slate-300 font-medium">{cat.name}</span>
                                                {isExpanded ? <ChevronDown size={14} className="text-slate-500"/> : <ChevronRight size={14} className="text-slate-500"/>}
                                            </div>
                                            {isExpanded && (
                                                <div className="grid grid-cols-2 gap-2 p-2 border-t border-slate-800/50 bg-[var(--sys-bg-header)]">
                                                    {comps.map(c => (
                                                        <div 
                                                            key={c.id} 
                                                            className="group cursor-grab active:cursor-grabbing"
                                                            draggable
                                                            onDragStart={(e) => handleLibraryDragStart(e, c)}
                                                        >
                                                            <div className="aspect-video bg-[var(--sys-bg-page)] border border-slate-700 rounded overflow-hidden mb-1 relative group-hover:border-blue-500 transition-colors">
                                                                {renderThumbnail(c)}
                                                                <div className="absolute inset-0 bg-transparent hover:bg-blue-500/10 transition-colors"></div>
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 text-center truncate px-1">{c.name}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex-1 flex flex-col relative overflow-hidden bg-[#1e293b]">
                {!isPreviewMode && (
                    <>
                        <div className="absolute top-0 left-0 w-5 h-5 bg-[var(--sys-bg-header)] border-r border-b border-slate-700 z-30"></div>
                        <div className="absolute top-0 left-0 w-full h-5 z-20 overflow-hidden pointer-events-none">
                            <Ruler orientation="horizontal" scale={transform.scale} offset={transform.x} length={3000} />
                        </div>
                        <div className="absolute top-0 left-0 w-5 h-full z-20 overflow-hidden pointer-events-none">
                            <Ruler orientation="vertical" scale={transform.scale} offset={transform.y} length={3000} />
                        </div>
                    </>
                )}

                <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2 bg-slate-800/80 backdrop-blur rounded-full px-4 py-1.5 border border-slate-600 shadow-lg transition-opacity ${isPreviewMode ? 'opacity-0 hover:opacity-100' : ''}`}>
                    <button className="text-slate-400 hover:text-white" onClick={() => setTransform(t => ({...t, scale: t.scale - 0.1}))}><ZoomOut size={16}/></button>
                    <span className="text-xs text-slate-200 min-w-[40px] text-center">{Math.round(transform.scale * 100)}%</span>
                    <button className="text-slate-400 hover:text-white" onClick={() => setTransform(t => ({...t, scale: t.scale + 0.1}))}><ZoomIn size={16}/></button>
                    <div className="w-px h-4 bg-slate-600 mx-1"></div>
                    <button className="text-slate-400 hover:text-white" onClick={() => setTransform({ x: 100, y: 100, scale: 0.6 })}>重置</button>
                </div>

                <div 
                    ref={viewportRef}
                    className={`flex-1 overflow-hidden relative ${isPanning ? 'cursor-grabbing' : 'cursor-grab'} canvas-area`}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onWheel={handleWheel}
                    style={{ 
                        marginLeft: isPreviewMode ? 0 : RULER_SIZE, 
                        marginTop: isPreviewMode ? 0 : RULER_SIZE,
                        backgroundColor: '#1e293b'
                    }}
                >
                    <div 
                        ref={canvasRef}
                        className="absolute origin-top-left shadow-2xl transition-transform duration-75 ease-out"
                        style={{ 
                            left: 0,
                            top: 0,
                            width: `${pageConfig.width}px`, 
                            height: `${pageConfig.height}px`,
                            backgroundColor: pageConfig.bgColor,
                            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                            boxShadow: '0 0 50px rgba(0,0,0,0.5)'
                        }}
                    >
                        <div 
                            className="absolute inset-0 pointer-events-none opacity-20"
                            style={{ 
                                backgroundImage: `
                                    linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                                    linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
                                `,
                                backgroundSize: '50px 50px'
                            }} 
                        />

                        {layoutItems.map(item => {
                            const compDef = MOCK_COMPONENTS.find(c => c.id === item.compId);
                            let PreviewComp: any = GenericPreview;
                            if (compDef?.category === 'BIZ_AIC') PreviewComp = BizAICPreview;
                            if (compDef?.category === 'BIZ_SDWAN') PreviewComp = BizSDWANPreview;
                            if (compDef?.category === 'BIZ_IDC') PreviewComp = BizIdcPreview;
                            if (compDef?.category === 'BIZ_LINE') PreviewComp = BizLinePreview;
                            if (compDef?.category === 'BIZ_INET') PreviewComp = BizInetPreview;
                            if (compDef?.category === 'BIZ_OTHER') PreviewComp = BizOtherPreview;
                            if (compDef?.category === 'BIZ_BASE') PreviewComp = BizBasePreview;

                            const isSelected = selectedItemId === item.id;

                            return (
                                <div 
                                    key={item.id} 
                                    className={`absolute group select-none transition-shadow ${isSelected ? 'z-50 ring-2 ring-blue-500 shadow-2xl' : 'hover:border hover:border-blue-500/50'}`}
                                    style={{ 
                                        left: item.x, 
                                        top: item.y, 
                                        width: item.w, 
                                        height: item.h,
                                        cursor: isDraggingItem && isSelected ? 'grabbing' : 'grab'
                                    }}
                                    onMouseDown={(e) => handleItemMouseDown(e, item)}
                                >
                                    <div className="w-full h-full overflow-hidden relative bg-[var(--sys-bg-header)]/80 backdrop-blur-sm">
                                        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-blue-500/50"></div>
                                        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-blue-500/50"></div>
                                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-blue-500/50"></div>
                                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-blue-500/50"></div>
                                        
                                        {item.title && !['通用标题', '单张图片'].includes(item.title) && (
                                            <div className="absolute top-0 left-0 w-full h-6 bg-gradient-to-r from-blue-900/50 to-transparent flex items-center px-2 border-b border-blue-500/20 z-10 pointer-events-none">
                                                <div className="w-1 h-3 bg-blue-500 mr-2"></div>
                                                <span className="text-xs text-blue-100 font-medium tracking-wide">{item.title}</span>
                                            </div>
                                        )}

                                        <div className="w-full h-full pt-1 pointer-events-none">
                                            {compDef ? <PreviewComp comp={compDef} /> : <div className="text-slate-500 flex items-center justify-center h-full text-xs">Component Not Found</div>}
                                        </div>
                                    </div>
                                    
                                    {isSelected && !isPreviewMode && (
                                        <>
                                            <div onMouseDown={(e) => handleResizeStart(e, 'nw', item)} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500 border border-white cursor-nwse-resize z-50"></div>
                                            <div onMouseDown={(e) => handleResizeStart(e, 'ne', item)} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 border border-white cursor-nesw-resize z-50"></div>
                                            <div onMouseDown={(e) => handleResizeStart(e, 'sw', item)} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500 border border-white cursor-nesw-resize z-50"></div>
                                            <div onMouseDown={(e) => handleResizeStart(e, 'se', item)} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 border border-white cursor-nwse-resize z-50"></div>
                                            <div onMouseDown={(e) => handleResizeStart(e, 'n', item)} className="absolute top-[-4px] left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white cursor-ns-resize z-50"></div>
                                            <div onMouseDown={(e) => handleResizeStart(e, 's', item)} className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white cursor-ns-resize z-50"></div>
                                            <div onMouseDown={(e) => handleResizeStart(e, 'w', item)} className="absolute top-1/2 left-[-4px] -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white cursor-ew-resize z-50"></div>
                                            <div onMouseDown={(e) => handleResizeStart(e, 'e', item)} className="absolute top-1/2 right-[-4px] -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white cursor-ew-resize z-50"></div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {!isPreviewMode && (
                <div className="w-72 bg-[var(--sys-bg-header)] border-l border-slate-800 flex flex-col shrink-0">
                    <div className="h-10 flex items-center px-4 bg-slate-800/50 border-b border-slate-700">
                        <span className="text-sm font-medium text-slate-200">{selectedItem ? '组件属性' : '页面信息'}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
                        
                        {selectedItem ? (
                            <>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1.5">标题</label>
                                    <Input 
                                        value={selectedItem.title} 
                                        onChange={(e) => {
                                            setLayoutItems(items => items.map(i => i.id === selectedItem.id ? {...i, title: e.target.value} : i));
                                        }}
                                        className="bg-[#1e293b] border-slate-600 h-8 text-xs"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1.5">X 坐标</label>
                                        <Input 
                                            type="number"
                                            value={Math.round(selectedItem.x)} 
                                            onChange={(e) => {
                                                setLayoutItems(items => items.map(i => i.id === selectedItem.id ? {...i, x: parseInt(e.target.value)} : i));
                                            }}
                                            className="bg-[#1e293b] border-slate-600 h-8 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1.5">Y 坐标</label>
                                        <Input 
                                            type="number"
                                            value={Math.round(selectedItem.y)} 
                                            onChange={(e) => {
                                                setLayoutItems(items => items.map(i => i.id === selectedItem.id ? {...i, y: parseInt(e.target.value)} : i));
                                            }}
                                            className="bg-[#1e293b] border-slate-600 h-8 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1.5">宽度</label>
                                        <Input 
                                            type="number"
                                            value={Math.round(selectedItem.w)} 
                                            onChange={(e) => {
                                                setLayoutItems(items => items.map(i => i.id === selectedItem.id ? {...i, w: parseInt(e.target.value)} : i));
                                            }}
                                            className="bg-[#1e293b] border-slate-600 h-8 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1.5">高度</label>
                                        <Input 
                                            type="number"
                                            value={Math.round(selectedItem.h)} 
                                            onChange={(e) => {
                                                setLayoutItems(items => items.map(i => i.id === selectedItem.id ? {...i, h: parseInt(e.target.value)} : i));
                                            }}
                                            className="bg-[#1e293b] border-slate-600 h-8 text-xs"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-700">
                                    <Button 
                                        variant="danger" 
                                        size="sm" 
                                        className="w-full justify-center" 
                                        icon={<Trash2 size={14}/>}
                                        onClick={handleDeleteItem}
                                    >
                                        删除组件
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1.5">页面名称</label>
                                    <Input 
                                        value={pageConfig.name} 
                                        onChange={e => setPageConfig({...pageConfig, name: e.target.value})}
                                        className="bg-[#1e293b] border-slate-600 h-8 text-xs"
                                    />
                                </div>
                                
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1.5">屏幕大小 (px)</label>
                                    <div className="flex gap-2 items-center">
                                        <Input 
                                            type="number"
                                            value={pageConfig.width}
                                            onChange={e => setPageConfig({...pageConfig, width: parseInt(e.target.value)})} 
                                            className="bg-[#1e293b] border-slate-600 h-8 text-xs"
                                            placeholder="宽度"
                                        />
                                        <span className="text-slate-500 text-xs">x</span>
                                        <Input 
                                            type="number"
                                            value={pageConfig.height}
                                            onChange={e => setPageConfig({...pageConfig, height: parseInt(e.target.value)})}
                                            className="bg-[#1e293b] border-slate-600 h-8 text-xs"
                                            placeholder="高度"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400 block mb-1.5">背景颜色</label>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={pageConfig.bgColor}
                                            onChange={e => setPageConfig({...pageConfig, bgColor: e.target.value})}
                                            className="bg-[#1e293b] border-slate-600 h-8 text-xs font-mono"
                                        />
                                        <div className="w-8 h-8 rounded border border-slate-600 shrink-0" style={{ backgroundColor: pageConfig.bgColor }}></div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400 block mb-1.5">背景图</label>
                                    <div className="w-full h-32 border-2 border-dashed border-slate-600 rounded-lg bg-[#1e293b] flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:border-blue-500 hover:text-blue-400 transition-colors group">
                                        <ImageIcon size={24} className="mb-2 opacity-50 group-hover:opacity-100"/>
                                        <span className="text-xs">点击选择背景图</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-700">
                                    <label className="text-xs text-slate-400 block mb-1.5">缩略图</label>
                                    <div className="w-full aspect-video bg-[var(--sys-bg-page)] border border-slate-700 rounded overflow-hidden relative">
                                        <div className="absolute inset-2 border border-slate-800 bg-[#060b2f]">
                                            <div className="grid grid-cols-3 gap-1 p-1 h-full opacity-50">
                                                <div className="bg-blue-500/20 col-span-3 h-4"></div>
                                                <div className="bg-blue-500/20 col-span-1 row-span-2"></div>
                                                <div className="bg-blue-500/20 col-span-2 row-span-2"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <Button size="sm" variant="secondary" className="w-1/2 text-[10px]">自定义上传</Button>
                                        <Button size="sm" variant="secondary" className="w-1/2 text-[10px]">截取封面</Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};