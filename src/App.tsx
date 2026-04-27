
import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Cpu, Shield, Settings, Users, Network, Menu as MenuIcon, LogOut, ChevronDown, User as UserIcon, LayoutGrid, ArrowRightLeft, Check, Layout, FolderTree, Briefcase, Book, FileText, Loader2, Zap, Home, BarChart3, Boxes, Workflow, Monitor, Bell, Siren, Clapperboard, Headset, ChevronLeft, ChevronRight, Search, X, List, Maximize2, Minimize2 } from 'lucide-react';
import { GlobalContext, ViewMode } from './GlobalContext';
import { Domain } from './types';
import { KnowledgeBaseView } from './KnowledgeBase/KnowledgeBaseView';
import { FaultReportingView } from './FaultReporting/FaultReportingView';
import { AutoReportingView } from './AutoReporting/AutoReportingView';
import { HomeOverview } from './pages/HomeOverview';
import { Private5GOverview } from './pages/Private5GOverview';
import { IDCOverview } from './pages/IDCOverview';
import { CloudNetworkOverview } from './pages/CloudNetworkOverview';
import { QuantumSDWANOverview } from './pages/QuantumSDWANOverview';
import { NotificationMatrix } from './Assistant/NotificationMatrix';
import { AiDock } from './pages/agent/ai-dock';
import { AppFeedbackHost } from './components/AppFeedback';
import { useAppData } from './context/AppDataContext';

// --- Lazy Load Pages ---
const DomainManager = lazy(() => import('./pages/DomainManager').then(module => ({ default: module.DomainManager })));
const MenuManager = lazy(() => import('./pages/MenuManager').then(module => ({ default: module.MenuManager })));
const RoleManager = lazy(() => import('./pages/RoleManager').then(module => ({ default: module.RoleManager })));
const UserManager = lazy(() => import('./pages/UserManager').then(module => ({ default: module.UserManager })));
const DeptManager = lazy(() => import('./pages/DeptManager').then(module => ({ default: module.DeptManager })));
const PostManager = lazy(() => import('./pages/PostManager').then(module => ({ default: module.PostManager })));
const DictManager = lazy(() => import('./pages/DictManager').then(module => ({ default: module.DictManager })));
const LogManager = lazy(() => import('./pages/LogManager').then(module => ({ default: module.LogManager })));
const ComponentManager = lazy(() => import('./pages/ComponentManager').then(module => ({ default: module.ComponentManager })));
const TemplateManager = lazy(() => import('./pages/TemplateManager').then(module => ({ default: module.TemplateManager })));

const PlaceholderPage: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="h-full rounded-lg border border-[var(--sys-border-primary)] bg-[var(--sys-bg-card)] p-8">
    <div className="mb-4 text-2xl font-black text-[var(--sys-text-primary)]">{title}</div>
    <div className="mb-6 max-w-2xl text-sm text-[var(--sys-text-secondary)]">{subtitle}</div>
    <div className="rounded border border-[var(--ref-color-brand-500)]/40 bg-[var(--sys-bg-card-hover)] p-4 text-sm text-[var(--sys-link-hover)]">
      该模块入口与导航已补齐。后续你指定具体功能后，我会按同风格继续补完整交互与数据流。
    </div>
  </div>
);

// --- Loading Component ---
const PageLoader = () => (
  <div className="flex h-full flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
    <div className="relative">
      <div className="h-12 w-12 rounded-full border-4 border-slate-800"></div>
      <div className="absolute top-0 left-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
    </div>
    <div className="flex flex-col items-center">
      <span className="text-sm font-medium text-slate-300 tracking-wide">系统资源加载中</span>
      <span className="text-[10px] text-slate-500 mt-1">政企业务智慧运维管家</span>
    </div>
  </div>
);

// --- Navigation Config ---
const NAV_ITEMS = [
  {
    id: 'biz-overview',
    title: '业务总览',
    icon: Home,
    path: '/screen/sdwan',
  },
  {
    id: 'performance-view',
    title: '性能可视',
    icon: BarChart3,
    path: '/visual/performance',
  },
  {
    id: 'resource-view',
    title: '资源可视',
    icon: Boxes,
    path: '/visual/resource',
  },
  {
    id: 'process-view',
    title: '流程可视',
    icon: Workflow,
    path: '/visual/process',
  },
  {
    id: 'customer-network',
    title: '客户内网',
    icon: Network,
    path: '/customer/network',
  },
  {
    id: 'alarm-view',
    title: '告警可视',
    icon: Siren,
    path: '/alarm/visual',
  },
  {
    id: 'video-monitor',
    title: '视频监控',
    icon: Clapperboard,
    path: '/video/monitor',
  },
  {
    id: 'service-desk',
    title: '服务台',
    icon: Headset,
    path: '/service/desk/knowledge',
    children: [
      { id: 'service-knowledge', title: '知识库', icon: Book, path: '/service/desk/knowledge' },
      { id: 'service-fault', title: '自助报障', icon: Siren, path: '/service/desk/fault' },
      { id: 'service-report', title: '运行报告', icon: FileText, path: '/service/desk/report' },
    ],
  },
  {
    id: 'message-notify',
    title: '消息通知',
    icon: Bell,
    path: '/message/notify',
  },
  { 
    id: 'system', 
    title: '系统管理', 
    icon: Settings,
    children: [
        { id: 'domain', title: '域管理', icon: Network, path: '/system/domain' },
        { id: 'menu', title: '菜单管理', icon: MenuIcon, path: '/system/menu' },
        { id: 'dept', title: '部门管理', icon: FolderTree, path: '/system/dept' },
        { id: 'post', title: '岗位管理', icon: Briefcase, path: '/system/post' },
        { id: 'role', title: '角色管理', icon: Shield, path: '/system/role' },
        { id: 'user', title: '用户管理', icon: Users, path: '/system/user' },
        { id: 'dict', title: '字典管理', icon: Book, path: '/system/dict' },
    ]
  },
  {
    id: 'config',
    title: '配置管理',
    icon: Layout,
    children: [
      { id: 'component', title: '组件管理', icon: LayoutGrid, path: '/config/component' },
      { id: 'template', title: '模板管理', icon: Layout, path: '/config/template' },
    ]
  },
  {
    id: 'log-manage',
    title: '日志管理',
    icon: FileText,
    path: '/system/log',
  }
];

type BigScreenView = 'preview' | 'list';
type BigScreenItem = {
  id: string;
  name: string;
  subtitle: string;
  path: string;
};

const BIG_SCREENS: BigScreenItem[] = [
  { id: 'screen-sdwan', name: '量子+SD-WAN管家', subtitle: '量子加密与SD-WAN协同运维大屏', path: '/screen/sdwan' },
  { id: 'screen-dedicated', name: '专线管家', subtitle: '政企专线运维总览大屏', path: '/overview/home' },
  { id: 'screen-5g-private', name: '5G专网管家', subtitle: '5G专网性能、预警与业务质量总览', path: '/screen/5g' },
  { id: 'screen-idc', name: 'IDC管家', subtitle: 'IDC资源与运行态势看板', path: '/screen/idc' },
  { id: 'screen-cloud-network', name: '算网管家', subtitle: '算力网络协同运营看板', path: '/screen/cloud-network' },
];

const modalPanelClass =
  'rounded-xl border border-[#1f4b80] bg-[linear-gradient(180deg,#0b2f61_0%,#082a59_100%)]';
const modalPrimaryButtonClass =
  'inline-flex h-8 min-w-[92px] items-center justify-center gap-1.5 rounded-md border border-[#63b9ff] bg-[linear-gradient(180deg,#3b90f3_0%,#2f7fe0_100%)] px-3 text-sm font-semibold text-white shadow-[0_0_10px_rgba(68,166,255,0.28)]';
const modalSecondaryButtonClass =
  'inline-flex h-8 min-w-[92px] items-center justify-center gap-1.5 rounded-md border border-[#5f8fc8] bg-[linear-gradient(180deg,#2f6fb9_0%,#255a99_100%)] px-3 text-sm font-semibold text-white';

const HomeScreenThumbnail: React.FC = () => (
  <div className="relative h-full overflow-hidden rounded border border-[#2a6298] bg-[linear-gradient(180deg,#0f3b74_0%,#0b2e5b_58%,#082548_100%)]">
    <div className="absolute inset-x-2 top-2 h-4 rounded bg-[#1c4f88]/75" />
    <div className="absolute left-2.5 top-8 h-[30%] w-[34%] rounded border border-[#2d6fb0] bg-[#0e3a72]/80" />
    <div className="absolute right-2.5 top-8 h-[30%] w-[62%] rounded border border-[#2d6fb0] bg-[#0f3d79]/80" />
    <div className="absolute left-2.5 bottom-2.5 h-[45%] w-[34%] rounded border border-[#2d6fb0] bg-[#0c3368]/88" />
    <div className="absolute right-2.5 bottom-2.5 h-[45%] w-[62%] rounded border border-[#2d6fb0] bg-[#0a2f60]/90" />
    <div className="absolute left-[25%] top-[54%] h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#8ec6ff] bg-[#2b62bf]/78 shadow-[0_0_12px_rgba(79,176,255,0.35)]" />
    <div className="absolute right-[18%] top-[38%] h-8 w-16 rounded-full bg-[#2f8be4]/30 blur-[1px]" />
    <div className="absolute right-[20%] bottom-[22%] h-8 w-24 rounded bg-[linear-gradient(180deg,rgba(49,153,255,0.28),rgba(27,101,187,0.2))]" />
    <div className="absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(180deg,transparent,rgba(6,27,57,0.95))]" />
  </div>
);

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const menuViewportRef = useRef<HTMLDivElement>(null);
  const { domains } = useAppData();

  // --- Global Context State ---
  const [mode, setMode] = useState<ViewMode>('fusion');
  const [currentDomain, setCurrentDomain] = useState<Domain | null>(null);

  // --- Mode Switcher State ---
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const [switcherTab, setSwitcherTab] = useState<'fusion' | 'switching'>('fusion');

  // --- Service Desk Views State ---
  const [kbMode, setKbMode] = useState<'full' | 'half'>('half');
  const [faultMode, setFaultMode] = useState<'full' | 'half'>('half');
  const [reportMode, setReportMode] = useState<'full' | 'half'>('half');
  const [menuPageSize, setMenuPageSize] = useState<number>(NAV_ITEMS.length);
  const [menuPage, setMenuPage] = useState(0);
  const [isBigScreenOpen, setIsBigScreenOpen] = useState(false);
  const [bigScreenView, setBigScreenView] = useState<BigScreenView>('preview');
  const [bigScreenKeyword, setBigScreenKeyword] = useState('');
  const [selectedBigScreenId, setSelectedBigScreenId] = useState(BIG_SCREENS[0].id);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Close switcher when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setIsSwitcherOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const updateMenuCapacity = () => {
      const width = menuViewportRef.current?.clientWidth ?? 0;
      if (!width) return;
      const estimatedItemWidth = 86;
      const nextSize = Math.max(1, Math.floor(width / estimatedItemWidth));
      setMenuPageSize(nextSize);
    };

    updateMenuCapacity();
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateMenuCapacity);
      if (menuViewportRef.current) observer.observe(menuViewportRef.current);
    }
    window.addEventListener('resize', updateMenuCapacity);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updateMenuCapacity);
    };
  }, []);

  const menuPages: typeof NAV_ITEMS[] = [];
  for (let i = 0; i < NAV_ITEMS.length; i += menuPageSize) {
    menuPages.push(NAV_ITEMS.slice(i, i + menuPageSize));
  }
  const visibleNavItems = menuPages[menuPage] || NAV_ITEMS;
  const totalMenuPages = Math.max(menuPages.length, 1);

  useEffect(() => {
    setMenuPage(prev => Math.min(prev, totalMenuPages - 1));
  }, [totalMenuPages]);

  const findBigScreenByPath = (path: string) =>
    BIG_SCREENS.find(screen => path.startsWith(screen.path)) ?? BIG_SCREENS[0];

  useEffect(() => {
    const matched = findBigScreenByPath(location.pathname);
    setSelectedBigScreenId(matched.id);
  }, [location.pathname]);

  const getCurrentPageTitle = () => {
    const currentPath = location.pathname;
    for (const item of NAV_ITEMS) {
      if (item.path && currentPath.startsWith(item.path)) {
        return { parent: item.title, child: '' };
      }
      if (item.children) {
        const child = item.children.find(c => currentPath.startsWith(c.path));
        if (child) return { parent: item.title, child: child.title };
      }
    }
    if (currentPath === '/' || currentPath.startsWith('/overview/home')) return { parent: '业务总览', child: '首页概览' };
    return { parent: '', child: '' };
  };

  const breadcrumbs = getCurrentPageTitle();

  const handleSwitchToFusion = () => {
      setMode('fusion');
      setCurrentDomain(null);
      setIsSwitcherOpen(false);
  };

  const handleSwitchToDomain = (domain: Domain) => {
      setMode('switching');
      setCurrentDomain(domain);
      setIsSwitcherOpen(false);
  };

  const filteredBigScreens = BIG_SCREENS.filter(screen => {
    if (!bigScreenKeyword.trim()) return true;
    return screen.name.includes(bigScreenKeyword.trim()) || screen.subtitle.includes(bigScreenKeyword.trim());
  });

  const selectedBigScreen =
    BIG_SCREENS.find(screen => screen.id === selectedBigScreenId) ?? BIG_SCREENS[0];
  const currentBigScreen = BIG_SCREENS.find(screen => location.pathname.startsWith(screen.path));
  const isBigScreenPage = Boolean(currentBigScreen) || location.pathname === '/';
  const appTitle = currentBigScreen
    ? `政企业务智慧运维管家-${currentBigScreen.name}`
    : '政企业务智慧运维管家';

  const handleConfirmBigScreenSwitch = () => {
    navigate(selectedBigScreen.path);
    setIsBigScreenOpen(false);
  };

  const toggleFocusMode = async () => {
    // 聚焦模式以页面布局切换为主，浏览器全屏仅做增强，避免因权限/策略导致“点了没反应”。
    if (!isFocusMode) {
      setIsFocusMode(true);
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // ignore: keep focus mode enabled even if fullscreen request is blocked
      }
      return;
    }

    setIsFocusMode(false);
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFocusMode(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  return (
    <GlobalContext.Provider value={{ mode, currentDomain, setMode, setCurrentDomain }}>
    <div className="flex flex-col h-screen bg-[var(--sys-bg-page)] text-[var(--sys-text-secondary)] font-sans overflow-hidden">
      
      {/* Top Header Navigation */}
      {!isFocusMode && (
      <header className="bg-[var(--sys-bg-header)] border-b border-[var(--sys-border-primary)] shrink-0 z-50 shadow-md">
        <div className="h-12 flex items-center justify-between px-3.5 bg-[url('/screens/top-nav-banner.svg')] bg-cover bg-center bg-no-repeat">
         <div className="flex items-center">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
                <Cpu className="text-blue-400 mr-2" size={18} />
                <span className="font-bold text-[20px] leading-none tracking-wide text-[#cfe9ff]">{appTitle}</span>
            </div>
         </div>

	         <div className="flex items-center space-x-2">
            <div className="relative" ref={switcherRef}>
                <button 
                    onClick={() => { setIsSwitcherOpen(!isSwitcherOpen); setSwitcherTab(mode); }}
	                    className={`flex h-7 items-center space-x-1 px-2.5 rounded-full border transition-all ${mode === 'fusion' ? 'bg-blue-900/30 border-blue-500/50 text-blue-200 hover:bg-blue-900/50' : 'bg-green-900/30 border-green-500/50 text-green-200 hover:bg-green-900/50'}`}
                >
	                    {mode === 'fusion' ? <LayoutGrid size={11} /> : <ArrowRightLeft size={11} />}
	                    <span className="text-[10px] font-medium">
                        {mode === 'fusion' ? '跨客户融合' : `域: ${currentDomain?.name || '未知'}`}
                    </span>
	                    <ChevronDown size={9} className={`transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSwitcherOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-[#1e293b] border border-slate-700 rounded-lg shadow-2xl z-[100] overflow-hidden">
                        <div className="flex border-b border-slate-700">
                            <button 
                                onClick={() => setSwitcherTab('fusion')}
                                className={`flex-1 py-3 text-xs font-bold text-center transition-colors ${switcherTab === 'fusion' ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                            >
                                跨客户融合 (Fusion)
                            </button>
                            <button 
                                onClick={() => setSwitcherTab('switching')}
                                className={`flex-1 py-3 text-xs font-bold text-center transition-colors ${switcherTab === 'switching' ? 'bg-green-600/10 text-green-400 border-b-2 border-green-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                            >
                                按客户切换 (Switching)
                            </button>
                        </div>

                        <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar bg-[var(--sys-bg-header)]">
                            {switcherTab === 'fusion' ? (
                                <div className="space-y-4">
                                    <div className="p-3 bg-blue-900/20 border border-blue-800 rounded text-blue-200 text-xs leading-relaxed">
                                        全局数据聚合：当前可查看所有域的组件与模板资源。
                                    </div>
                                    <button 
                                        onClick={handleSwitchToFusion}
                                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        {mode === 'fusion' && <Check size={16} />}
                                        启用融合模式
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {domains.filter(d => !d.isSuper).map(domain => (
                                        <button
                                            key={domain.id}
                                            onClick={() => handleSwitchToDomain(domain)}
                                            className={`w-full flex items-center justify-between p-3 rounded border text-left transition-all ${
                                                mode === 'switching' && currentDomain?.id === domain.id
                                                ? 'bg-green-900/20 border-green-500/50 text-green-300'
                                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${mode === 'switching' && currentDomain?.id === domain.id ? 'bg-green-900/40 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                                                    <Users size={14} />
                                                </div>
                                                <div className="truncate text-sm font-bold">{domain.name}</div>
                                            </div>
                                            {mode === 'switching' && currentDomain?.id === domain.id && <Check size={16} className="text-green-500" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

	            <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-700">
                <div className="flex flex-col items-end">
	                    <span className="text-[11px] font-medium text-white">{mode === 'fusion' ? '超级管理员' : (currentDomain?.manager)}</span>
	                    <span className="text-[9px] text-slate-500">{mode === 'fusion' ? '省中心' : '项目域'}</span>
                </div>
	                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
	                    <UserIcon size={14} className="text-slate-300" />
	                </div>
	                <button className="text-slate-400 hover:text-red-400 transition-colors">
	                    <LogOut size={14} />
	                </button>
	            </div>
	         </div>
	        </div>

	        <div className="h-10 border-t border-[#1b4f89] px-3 flex items-center gap-1.5 bg-[#0b2f61]">
          {totalMenuPages > 1 && (
            <button
              type="button"
              onClick={() => setMenuPage(p => Math.max(0, p - 1))}
              disabled={menuPage === 0}
	              className="h-6 w-6 rounded border border-[#2b6aa8] bg-[#0c3a72] text-[#b7d7ff] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#134b8f]"
              title="上一组菜单"
            >
	              <ChevronLeft size={12} className="mx-auto" />
            </button>
          )}

          <div ref={menuViewportRef} className="flex-1 overflow-visible">
            <nav className="flex items-center space-x-1 h-full overflow-visible">
                {visibleNavItems.map(item => (
                    <div key={item.id} className="relative group shrink-0">
                        <button
                            onClick={() => {
                              if (item.path) navigate(item.path);
                            }}
	                            className={`h-7 flex items-center px-2.5 rounded-md border text-xs font-medium transition-colors ${
                              ((item.path && location.pathname.startsWith(item.path)) || breadcrumbs.parent === item.title)
                                ? 'border-[#58b7ff] bg-[#0f3f7a] text-[#4fc1ff]'
                                : 'border-transparent text-[#c3ddff] hover:border-[#2f74b9] hover:bg-[#12467f] hover:text-[#eaf6ff]'
                            }`}
                        >
	                            <item.icon size={13} className="mr-1.5" />
                            {item.title}
	                            {item.children && <ChevronDown size={11} className="ml-0.5 opacity-70" />}
                        </button>

                        {item.children && (
	                          <div className="absolute left-0 top-7 mt-1 w-44 bg-[#0b2f61] border border-[#2b6aa8] rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            {item.children.map(child => (
                                <button
                                    key={child.id}
                                    onClick={() => navigate(child.path)}
	                                    className={`w-full flex items-center px-3 py-1.5 text-xs text-left hover:bg-[#14457d] ${location.pathname.startsWith(child.path) ? 'text-[#4fc1ff] bg-[#103e74]' : 'text-[#c3ddff]'}`}
                                >
	                                    <child.icon size={12} className="mr-1.5" />
                                    {child.title}
                                </button>
                            ))}
                          </div>
                        )}
                    </div>
                ))}
            </nav>
          </div>

          {totalMenuPages > 1 && (
            <button
              type="button"
              onClick={() => setMenuPage(p => Math.min(totalMenuPages - 1, p + 1))}
              disabled={menuPage >= totalMenuPages - 1}
	              className="h-6 w-6 rounded border border-[#2b6aa8] bg-[#0c3a72] text-[#b7d7ff] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#134b8f]"
              title="下一组菜单"
            >
	              <ChevronRight size={12} className="mx-auto" />
            </button>
          )}
        </div>
      </header>
      )}

	      <main className={`flex-1 overflow-hidden bg-[var(--sys-bg-page)] flex flex-col relative ${isFocusMode ? 'p-0' : 'p-2'}`}>
	        {!isFocusMode && (
          <div className="mb-1 flex items-center justify-between">
	             <div className="flex items-center text-[11px] text-slate-400">
                <span>{breadcrumbs.parent}</span>
                {breadcrumbs.child && (
                    <>
                        <span className="mx-2 text-slate-600">/</span>
                        <span className="text-blue-400 font-medium">{breadcrumbs.child}</span>
                    </>
                )}
             </div>
             <div className="flex items-center gap-2">
               {mode === 'switching' && currentDomain && (
                 <div className="flex items-center px-3 py-1 bg-blue-900/20 border border-blue-500/30 rounded text-[10px] text-blue-400">
                    <Network size={12} className="mr-1"/>
                    业务类型限制生效中
                 </div>
               )}
               {isBigScreenPage && (
                 <button
                   type="button"
                   onClick={() => {
                     setBigScreenKeyword('');
                     setBigScreenView('preview');
                     setSelectedBigScreenId(findBigScreenByPath(location.pathname).id);
                     setIsBigScreenOpen(true);
                   }}
		                   className="inline-flex h-7 items-center gap-1.5 rounded border border-[#2d6ab1] bg-[#0b2f61] px-2.5 text-[11px] font-semibold text-[#bde3ff] transition hover:border-[#4ea4ff] hover:bg-[#12407e] hover:text-white"
                 >
		                   <LayoutGrid size={12} />
                   大屏切换
                 </button>
               )}
               <button
                 type="button"
                 onClick={toggleFocusMode}
                 className="inline-flex h-7 items-center gap-1.5 rounded border border-[#2d6ab1] bg-[#0b2f61] px-2.5 text-[11px] font-semibold text-[#bde3ff] transition hover:border-[#4ea4ff] hover:bg-[#12407e] hover:text-white"
               >
                 <Maximize2 size={12} />
                 全屏聚焦
               </button>
             </div>
        </div>
        )}
        <div className="flex-1 overflow-hidden">
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/" element={<Navigate to="/screen/sdwan" replace />} />

                    <Route path="/overview/home" element={<HomeOverview />} />
                    <Route path="/screen/5g" element={<Private5GOverview />} />
                    <Route path="/screen/idc" element={<IDCOverview />} />
                    <Route path="/screen/cloud-network" element={<CloudNetworkOverview />} />
                    <Route path="/screen/sdwan" element={<QuantumSDWANOverview />} />

                    <Route
                      path="/visual/performance"
                      element={<PlaceholderPage title="性能可视" subtitle="性能监测图谱、时延/丢包趋势、区域质量排名等功能入口。" />}
                    />
                    <Route
                      path="/visual/resource"
                      element={<PlaceholderPage title="资源可视" subtitle="站点、设备、端口、容量资源的全局可视化入口。" />}
                    />
                    <Route
                      path="/visual/process"
                      element={<PlaceholderPage title="流程可视" subtitle="开通、变更、故障、巡检等运维流程可视化入口。" />}
                    />
                    <Route
                      path="/customer/network"
                      element={<PlaceholderPage title="客户内网" subtitle="客户内网拓扑、连通性和关键节点运行态势入口。" />}
                    />
                    <Route
                      path="/alarm/visual"
                      element={<PlaceholderPage title="告警可视" subtitle="告警聚合、分级、热点区域和根因分析入口。" />}
                    />
                    <Route
                      path="/video/monitor"
                      element={<PlaceholderPage title="视频监控" subtitle="机房、园区、边缘节点视频监控总览入口。" />}
                    />
                    <Route
                      path="/service/desk"
                      element={<PlaceholderPage title="服务台" subtitle="服务目录、工单、SLA 与客户服务协同入口。" />}
                    />
                    <Route
                      path="/service/desk/knowledge"
                      element={
                        <KnowledgeBaseView
                          mode={kbMode}
                          onToggleMode={() => setKbMode(m => m === 'full' ? 'half' : 'full')}
                          onClose={() => navigate('/service/desk')}
                        />
                      }
                    />
                    <Route
                      path="/service/desk/fault"
                      element={
                        <FaultReportingView
                          mode={faultMode}
                          onToggleMode={() => setFaultMode(m => m === 'full' ? 'half' : 'full')}
                          onClose={() => navigate('/service/desk')}
                        />
                      }
                    />
                    <Route
                      path="/service/desk/report"
                      element={
                        <AutoReportingView
                          mode={reportMode}
                          onToggleMode={() => setReportMode(m => m === 'full' ? 'half' : 'full')}
                          onClose={() => navigate('/service/desk')}
                        />
                      }
                    />
                    <Route path="/message/notify" element={<NotificationMatrix />} />

                    <Route path="/system/domain/*" element={<DomainManager />} />
                    <Route path="/system/menu/*" element={<MenuManager />} />
                    <Route path="/system/dept/*" element={<DeptManager />} />
                    <Route path="/system/post/*" element={<PostManager />} />
                    <Route path="/system/role/*" element={<RoleManager />} />
                    <Route path="/system/user/*" element={<UserManager />} />
                    <Route path="/system/dict" element={<DictManager />} />
                    <Route path="/system/log" element={<LogManager />} />
                    <Route path="/config/component/*" element={<ComponentManager />} />
                    <Route path="/config/template" element={<TemplateManager />} />
                    <Route path="*" element={<Navigate to="/screen/sdwan" replace />} />
                </Routes>
            </Suspense>
        </div>

        {isBigScreenOpen && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[var(--sys-bg-page)]/72 px-4 py-6 backdrop-blur-[1px]">
            <div className={`flex h-[82vh] w-full max-w-[1560px] flex-col overflow-hidden shadow-[0_0_40px_rgba(2,18,44,0.75)] ${modalPanelClass}`}>
              <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#24578f] bg-[#12457f] px-4">
                <span className="text-[20px] font-bold tracking-wide text-[#e6f3ff]">选择视图</span>
                <button
                  type="button"
                  onClick={() => setIsBigScreenOpen(false)}
                  className="rounded p-1 text-[#cce7ff] transition hover:bg-[#1a4f8e]/70"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center gap-2.5 border-b border-[#184777] bg-[#0c3368]/55 px-4 py-2">
                <div className="relative w-full max-w-[460px]">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#86b8e9]" />
                  <input
                    value={bigScreenKeyword}
                    onChange={(e) => setBigScreenKeyword(e.target.value)}
                    placeholder="按大屏名称搜索"
                    className="h-8 w-full rounded border border-[#2a64a4] bg-[#ffffff1f] pl-9 pr-3 text-[11px] text-[#d7ecff] placeholder:text-[#9abbe0] outline-none transition focus:border-[#55adff]"
                  />
                </div>
                <div className="ml-auto inline-flex overflow-hidden rounded border border-[#2a66a8]">
                  <button
                    type="button"
                    onClick={() => setBigScreenView('preview')}
                    className={`px-3 py-1 text-[11px] font-medium transition ${bigScreenView === 'preview' ? 'bg-[#2f81d9] text-white' : 'bg-[#0c2f61] text-[#a9d4ff] hover:bg-[#144279]'}`}
                  >
                    预览图
                  </button>
                  <button
                    type="button"
                    onClick={() => setBigScreenView('list')}
                    className={`inline-flex items-center gap-1 px-3 py-1 text-[11px] font-medium transition ${bigScreenView === 'list' ? 'bg-[#2f81d9] text-white' : 'bg-[#0c2f61] text-[#a9d4ff] hover:bg-[#144279]'}`}
                  >
                    <List size={12} />
                    列表
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto px-4 py-2.5">
                {filteredBigScreens.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-[#9cc4ef]">未找到匹配的大屏</div>
                ) : bigScreenView === 'preview' ? (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {filteredBigScreens.map(screen => {
                      const isSelected = selectedBigScreenId === screen.id;
                      return (
                        <button
                          key={screen.id}
                          type="button"
                          onClick={() => setSelectedBigScreenId(screen.id)}
                          className={`group rounded-lg border p-2 text-left transition ${isSelected ? 'border-[#37b8ff] bg-[#15427a] shadow-[0_0_10px_rgba(47,168,255,0.2)]' : 'border-[#24598c] bg-[#103766] hover:border-[#3f91db] hover:bg-[#144174]'}`}
                        >
                          <div className="h-32">
                            <HomeScreenThumbnail />
                          </div>
                          <div className="mt-1.5 px-1 pb-0.5">
                            <div className="text-[18px] font-bold leading-tight text-[#e1f2ff]">{screen.name}</div>
                            <div className="text-[10px] text-[#9bc4eb]">{screen.subtitle}</div>
                          </div>
                          {isSelected && (
                            <div className="mt-1.5 flex items-center justify-end text-[11px] font-semibold text-[#79d0ff]">
                              <Check size={12} className="mr-1" />
                              已选择
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredBigScreens.map(screen => {
                      const isSelected = selectedBigScreenId === screen.id;
                      return (
                        <button
                          key={screen.id}
                          type="button"
                          onClick={() => setSelectedBigScreenId(screen.id)}
                          className={`flex w-full items-center justify-between rounded border px-3 py-1.5 text-left transition ${isSelected ? 'border-[#37b8ff] bg-[#0f3d76] text-[#e7f5ff]' : 'border-[#24598c] bg-[#0a2f5e] text-[#b6dafc] hover:border-[#3f91db]'}`}
                        >
                          <div>
                            <div className="text-[13px] font-semibold">{screen.name}</div>
                            <div className="text-[11px] opacity-80">{screen.subtitle}</div>
                          </div>
                          {isSelected && <Check size={14} className="text-[#6ad0ff]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center justify-center gap-2.5 border-t border-[#24578f] bg-[#0b3368]/55 px-4 py-2.5">
                <button
                  type="button"
                  onClick={handleConfirmBigScreenSwitch}
                  className={modalPrimaryButtonClass}
                >
                  <Check size={15} />
                  确定
                </button>
                <button
                  type="button"
                  onClick={() => setIsBigScreenOpen(false)}
                  className={modalSecondaryButtonClass}
                >
                  <X size={15} />
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {!isFocusMode && <AiDock />}

        {isFocusMode && (
          <button
            type="button"
            onClick={toggleFocusMode}
            className="fixed right-3 top-3 z-[170] inline-flex h-8 items-center gap-1.5 rounded border border-[#2d6ab1] bg-[#0b2f61]/92 px-2.5 text-[11px] font-semibold text-[#bde3ff] backdrop-blur-sm transition hover:border-[#4ea4ff] hover:bg-[#12407e]"
          >
            <Minimize2 size={12} />
            退出全屏
          </button>
        )}
      </main>
      
      {/* Styles for custom animations */}
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s infinite ease-in-out;
        }
      `}</style>
      <AppFeedbackHost />
    </div>
    </GlobalContext.Provider>
  );
};

export default App;
