import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, ChevronDown, ChevronRight, Sliders, Maximize, Minimize } from 'lucide-react';
import { Button, Switch, Input } from './UI';
import { BizLinePreview } from './previews/BizLinePreview';
import { BizInetPreview } from './previews/BizInetPreview';
import { BizIntranetPreview } from './previews/BizIntranetPreview';
import { BizDialPreview } from './previews/BizDialPreview';
import { BizCollectPreview } from './previews/BizCollectPreview';
import { BizCompPreview } from './previews/BizCompPreview';
import { Biz5GPreview } from './previews/Biz5GPreview';
import { BizIdcPreview } from './previews/BizIdcPreview';
import { BizBasePreview } from './previews/BizBasePreview';
import { BizOtherPreview } from './previews/BizOtherPreview';
import { BizAICPreview } from './previews/BizAICPreview';
import { BizSDWANPreview } from './previews/BizSDWANPreview';
import { GenericPreview } from './previews/GenericPreview';
import { useAppData } from '../context/AppDataContext';

const PLUGIN_TYPES = [
  'Echarts',
  '单张图片',
  '通用标题',
  '时间器',
  '跑马灯',
  '自定义背景框',
  '静态 MP4 播放器',
  'M3U8 视频流播放器',
  'iframe',
  '多行文本',
  '普通表格',
  '指标块',
  '自定义组件 wp',
  '地图插件',
  '复杂表格测试',
  '网络运营能力开放平台'
];

interface ComponentEditorProps {
  component: any;
  onClose: () => void;
  onSave: (component: any) => void;
}

const ConfigRow: React.FC<{ label: string; children?: React.ReactNode; className?: string }> = ({ label, children, className }) => (
  <div className={`flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0 group ${className || ''}`}>
      <label className="text-sm text-slate-400 w-24 shrink-0">{label}</label>
      <div className="flex-1 px-2">
          {children}
      </div>
      <button className="text-slate-600 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
          <RotateCcw size={14} />
      </button>
  </div>
);

const CodeAreaRow: React.FC<{ label: string; value: string; onChange: (val: string) => void; placeholder?: string, height?: string }> = ({ label, value, onChange, placeholder, height = "h-24" }) => (
    <div className="py-2 border-b border-slate-700/50 last:border-0">
        <label className="text-sm text-slate-400 block mb-2">{label}:</label>
        <textarea 
            className={`w-full bg-[var(--sys-bg-page)] border border-blue-900/30 rounded p-2 text-xs font-mono text-blue-300 focus:border-blue-500 outline-none resize-none ${height}`}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            spellCheck={false}
        />
    </div>
);

export const ComponentEditor: React.FC<ComponentEditorProps> = ({ component, onClose, onSave }) => {
  const { businessTypes } = useAppData();
  const isAddMode = !component.id;
  const [isBasicConfigOpen, setIsBasicConfigOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Component Meta State
  const [compMeta, setCompMeta] = useState({
      name: component.name,
      category: component.category,
      pluginType: component.pluginType || '网络运营能力开放平台', // Default if undefined
      type: component.type || 'chart',
      status: component.status || 'published'
  });

  // Config Form State (Visual)
  const [config, setConfig] = useState({
    defaultDim: '日',
    recentDays: '7',
    recentMonths: '6',
    color: 'rgba(255, 208, 0, 0.7)',
    isSmooth: true,
    chartType: component.type === 'chart' ? '散点图' : '默认',
  });

  // Developer Config State (For Add Mode)
  const [devConfig, setDevConfig] = useState({
      initMethod: '',
      configParams: `[\n  {\n    key: "$1",\n    label: "$柱子颜色",\n    type: "string",\n    value: "red",\n    enum: [\n      { key: "001", label: "上海" }\n    ]\n  }\n]`,
      callbackMethod: '',
      editMapping: false,
      callbackMapping: '{\n  xdata: "x轴数据"\n}',
      paramDesc: 'option = {\n\n}',
      initData: '[\n  {\n\n  }\n]'
  });

  // Sync state if component prop changes significantly (though unlikely in this modal lifecycle)
  useEffect(() => {
      setCompMeta({
          name: component.name,
          category: component.category,
          pluginType: component.pluginType || '网络运营能力开放平台',
          type: component.type || 'chart',
          status: component.status || 'published'
      });
  }, [component]);

  const categoryName = businessTypes.find(b => b.code === compMeta.category)?.name || compMeta.category;

  const handleSave = () => {
      const updatedComponent = {
          ...component,
          ...compMeta,
          // Merge custom config if we were persisting it
          devConfig: isAddMode ? devConfig : undefined
      };
      onSave(updatedComponent);
  };

  const renderPreview = () => {
      const previewProps = { comp: { ...component, ...compMeta } }; 
      switch (compMeta.category) {
        case 'BIZ_AIC': return <BizAICPreview {...previewProps} />;
        case 'BIZ_SDWAN': return <BizSDWANPreview {...previewProps} />;
        case 'BIZ_LINE': return <BizLinePreview {...previewProps} />;
        case 'BIZ_INET': return <BizInetPreview {...previewProps} />;
        case 'BIZ_INTRANET': return <BizIntranetPreview {...previewProps} />;
        case 'BIZ_DIAL': return <BizDialPreview {...previewProps} />;
        case 'BIZ_COLLECT': return <BizCollectPreview {...previewProps} />;
        case 'BIZ_COMP': return <BizCompPreview {...previewProps} />;
        case 'BIZ_5G': return <Biz5GPreview {...previewProps} />;
        case 'BIZ_IDC': return <BizIdcPreview {...previewProps} />;
        case 'BIZ_BASE': return <BizBasePreview {...previewProps} />;
        case 'BIZ_OTHER': return <BizOtherPreview {...previewProps} />;
        default: return <GenericPreview {...previewProps} />;
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(7,24,44,0.74)] backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`flex flex-col bg-[var(--sys-bg-page)] border border-slate-700 shadow-2xl transition-all duration-300 overflow-hidden ${isFullscreen ? 'w-full h-full rounded-none' : 'w-[80vw] h-[85vh] rounded-lg'}`}>
      
      {/* Header */}
      <div className="h-14 bg-[var(--sys-bg-header)] border-b border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-md">
          <h2 className="text-lg font-bold text-blue-400 tracking-wide flex items-center gap-2">
              {component.id ? '编辑组件' : '新建组件'}
          </h2>
          <div className="flex items-center gap-4">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6" onClick={handleSave}>
                  保存
              </Button>
              <div className="w-px h-4 bg-slate-700 mx-1"></div>
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-800">
                  {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
              <button onClick={onClose} className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded hover:bg-slate-800">
                  <X size={20} />
              </button>
          </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Properties / Developer Config */}
          <div className="w-80 bg-[var(--sys-surface-muted)] border-r border-[var(--sys-border-primary)] flex flex-col">
              <div className="h-10 flex items-center px-4 bg-[var(--sys-surface-strong)] border-b border-[var(--sys-border-primary)]">
                  <span className="text-sm font-medium text-slate-200">{isAddMode ? '开发配置' : '属性设置'}</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                  
                  {isAddMode ? (
                      // --- Add Mode: Developer Config Fields ---
                      <div className="px-4 py-2 space-y-1">
                          <div className="py-2 border-b border-slate-700/50">
                              <ConfigRow label="发布状态">
                                  <div className="flex items-center gap-2">
                                      <Switch 
                                          checked={compMeta.status === 'published'} 
                                          onChange={c => setCompMeta({...compMeta, status: c ? 'published' : 'draft'})} 
                                      />
                                      <span className={`text-xs ${compMeta.status === 'published' ? 'text-green-400' : 'text-yellow-400'}`}>
                                          {compMeta.status === 'published' ? '已发布' : '草稿'}
                                      </span>
                                  </div>
                              </ConfigRow>
                          </div>
                          <CodeAreaRow 
                              label="初始化方法" 
                              value={devConfig.initMethod} 
                              onChange={v => setDevConfig({...devConfig, initMethod: v})} 
                              height="h-20"
                          />
                          <CodeAreaRow 
                              label="配置参数" 
                              value={devConfig.configParams} 
                              onChange={v => setDevConfig({...devConfig, configParams: v})} 
                              height="h-40"
                          />
                          <CodeAreaRow 
                              label="回调方法" 
                              value={devConfig.callbackMethod} 
                              onChange={v => setDevConfig({...devConfig, callbackMethod: v})} 
                              height="h-20"
                          />
                          
                          <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                              <label className="text-sm text-slate-400">编辑映射:</label>
                              <div className="flex items-center gap-3">
                                  <span className={`text-xs ${!devConfig.editMapping ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>否</span>
                                  <Switch checked={devConfig.editMapping} onChange={c => setDevConfig({...devConfig, editMapping: c})} />
                                  <span className={`text-xs ${devConfig.editMapping ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>是</span>
                              </div>
                          </div>

                          <CodeAreaRow 
                              label="回调参数映射" 
                              value={devConfig.callbackMapping} 
                              onChange={v => setDevConfig({...devConfig, callbackMapping: v})} 
                              height="h-24"
                          />
                          <CodeAreaRow 
                              label="参数说明" 
                              value={devConfig.paramDesc} 
                              onChange={v => setDevConfig({...devConfig, paramDesc: v})} 
                              height="h-24"
                          />
                          <CodeAreaRow 
                              label="初始化数据" 
                              value={devConfig.initData} 
                              onChange={v => setDevConfig({...devConfig, initData: v})} 
                              height="h-32"
                          />
                      </div>
                  ) : (
                      // --- Edit Mode: Basic Visual Properties ---
                      <>
                        <div 
                            className="flex items-center justify-between px-4 py-2 bg-slate-800/30 cursor-pointer hover:bg-slate-800/50 transition-colors"
                            onClick={() => setIsBasicConfigOpen(!isBasicConfigOpen)}
                        >
                            <span className="text-xs font-bold text-slate-400">基础配置</span>
                            {isBasicConfigOpen ? <ChevronDown size={14} className="text-slate-500"/> : <ChevronRight size={14} className="text-slate-500"/>}
                        </div>
                        
                        {isBasicConfigOpen && (
                            <div className="px-4 py-2">
                                <ConfigRow label="发布状态">
                                    <div className="flex items-center gap-2">
                                        <Switch 
                                            checked={compMeta.status === 'published'} 
                                            onChange={c => setCompMeta({...compMeta, status: c ? 'published' : 'draft'})} 
                                        />
                                        <span className={`text-xs ${compMeta.status === 'published' ? 'text-green-400' : 'text-yellow-400'}`}>
                                            {compMeta.status === 'published' ? '已发布' : '草稿'}
                                        </span>
                                    </div>
                                </ConfigRow>
                                <ConfigRow label="默认维度">
                                    <select 
                                        value={config.defaultDim}
                                        onChange={e => setConfig({...config, defaultDim: e.target.value})}
                                        className="w-full bg-[var(--sys-bg-header)] border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none appearance-none"
                                    >
                                        <option value="日">日</option>
                                        <option value="周">周</option>
                                        <option value="月">月</option>
                                    </select>
                                </ConfigRow>
                                <ConfigRow label="最近几天">
                                    <select 
                                        value={config.recentDays}
                                        onChange={e => setConfig({...config, recentDays: e.target.value})}
                                        className="w-full bg-[var(--sys-bg-header)] border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none appearance-none"
                                    >
                                        <option value="7">7</option>
                                        <option value="15">15</option>
                                        <option value="30">30</option>
                                    </select>
                                </ConfigRow>
                                <ConfigRow label="最近几月">
                                    <select 
                                        value={config.recentMonths}
                                        onChange={e => setConfig({...config, recentMonths: e.target.value})}
                                        className="w-full bg-[var(--sys-bg-header)] border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none appearance-none"
                                    >
                                        <option value="3">3</option>
                                        <option value="6">6</option>
                                        <option value="12">12</option>
                                    </select>
                                </ConfigRow>
                                <ConfigRow label="颜色">
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="text" 
                                            value={config.color} 
                                            onChange={e => setConfig({...config, color: e.target.value})}
                                            className="flex-1 bg-[var(--sys-bg-header)] border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:border-blue-500 outline-none"
                                        />
                                        <div className="w-5 h-5 rounded border border-white/20 shrink-0" style={{ backgroundColor: 'rgba(255, 208, 0, 0.7)' }}></div>
                                    </div>
                                </ConfigRow>
                                <ConfigRow label="是否平滑">
                                    <Switch checked={config.isSmooth} onChange={(c) => setConfig({...config, isSmooth: c})} />
                                </ConfigRow>
                                <ConfigRow label="图表类型">
                                    <select 
                                        value={config.chartType}
                                        onChange={e => setConfig({...config, chartType: e.target.value})}
                                        className="w-full bg-[var(--sys-bg-header)] border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none appearance-none"
                                    >
                                        <option value="散点图">散点图</option>
                                        <option value="折线图">折线图</option>
                                        <option value="柱状图">柱状图</option>
                                    </select>
                                </ConfigRow>
                            </div>
                        )}
                      </>
                  )}
              </div>
          </div>

          {/* Right Content: Preview & Info */}
          <div className="flex-1 bg-[var(--sys-bg-page)] flex flex-col p-6 overflow-hidden">
              {/* Editable Info Grid */}
              <div className="mb-6 bg-[var(--sys-bg-header)] border border-slate-800 rounded p-4">
                  <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                      <div className="flex items-center">
                          <span className="text-sm text-slate-400 w-24 shrink-0">组件名称:</span>
                          <input 
                              type="text" 
                              value={compMeta.name} 
                              onChange={e => setCompMeta({...compMeta, name: e.target.value})}
                              className="bg-[var(--sys-surface-strong)] border border-[var(--sys-border-primary)] rounded px-2 py-1.5 text-sm text-slate-200 w-full focus:ring-1 focus:ring-blue-500 outline-none transition-all hover:border-slate-600"
                          />
                      </div>
                      
                      <div className="flex items-center">
                          <span className="text-sm text-slate-400 w-24 shrink-0">所属插件:</span>
                          <div className="relative w-full">
                              <select 
                                  value={compMeta.pluginType}
                                  onChange={e => setCompMeta({...compMeta, pluginType: e.target.value})}
                                  className="w-full bg-[var(--sys-surface-strong)] border border-[var(--sys-border-primary)] rounded px-2 py-1.5 text-sm text-blue-400 appearance-none focus:ring-1 focus:ring-blue-500 outline-none hover:border-slate-600 font-medium"
                              >
                                  {PLUGIN_TYPES.map(type => (
                                      <option key={type} value={type}>{type}</option>
                                  ))}
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 pointer-events-none" />
                          </div>
                      </div>

                      <div className="flex items-center">
                          <span className="text-sm text-slate-400 w-24 shrink-0">组件类别:</span>
                          <div className="relative w-full">
                              <select 
                                  value={compMeta.category}
                                  onChange={e => setCompMeta({...compMeta, category: e.target.value})}
                                  className="w-full bg-[var(--sys-surface-strong)] border border-[var(--sys-border-primary)] rounded px-2 py-1.5 text-sm text-slate-200 appearance-none focus:ring-1 focus:ring-blue-500 outline-none hover:border-slate-600"
                              >
                                      {businessTypes.map(bt => (
                                      <option key={bt.code} value={bt.code}>{bt.name}</option>
                                  ))}
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 pointer-events-none" />
                          </div>
                      </div>

                      <div className="flex items-center">
                          <span className="text-sm text-slate-400 w-24 shrink-0">组件子类:</span>
                          <span className="text-sm text-slate-500 px-2">--</span>
                      </div>
                  </div>
              </div>

              {/* Preview Box */}
              <div className="flex-1 border border-slate-700 rounded-lg flex flex-col bg-[var(--sys-bg-page)] relative shadow-2xl overflow-hidden">
                  {/* Preview Header */}
                  <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4 bg-[var(--sys-bg-header)]/50">
                      <div className="flex items-center gap-2">
                          <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-bold text-slate-200">{compMeta.name}</span>
                          {compMeta.status === 'draft' && <span className="text-[10px] text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">草稿</span>}
                      </div>
                      <div className="flex bg-slate-800 rounded p-0.5">
                          <button className={`px-3 py-0.5 text-xs rounded transition-colors ${config.defaultDim === '日' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>日</button>
                          <button className={`px-3 py-0.5 text-xs rounded transition-colors ${config.defaultDim === '月' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>月</button>
                      </div>
                  </div>
                  
                  {/* Visualization */}
                  <div className="flex-1 relative p-4">
                      {renderPreview()}
                  </div>
                  
                  {/* Overlay for "Scatter Plot" simulation if selected (just visual sugar) */}
                  {config.chartType === '散点图' && compMeta.category === 'BIZ_LINE' && component.id === 'line_01' && (
                      <div className="absolute top-14 right-10 flex items-center gap-2 pointer-events-none">
                          <div className="w-3 h-3 rounded-full bg-[#eab308]"></div>
                          <span className="text-xs text-slate-400">错包率</span>
                      </div>
                  )}
              </div>
          </div>
      </div>
      </div>
    </div>
  );
};
