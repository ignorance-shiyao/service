
import React, { useState, useMemo } from 'react';
import { Card, Table, Button, Badge, Select } from '../components/UI';
import { Users, Repeat, Crown, Building2, Database, LayoutDashboard, Globe, ArrowRightLeft } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';

export const DemoMode: React.FC = () => {
  const { domains, demoOrders } = useAppData();
  const [activeTab, setActiveTab] = useState<'fusion' | 'switching'>('fusion');
  
  // Switching Mode State: Default to Hefei Branch (ID 5)
  const [currentContextId, setCurrentContextId] = useState('5');

  // --- Fusion Logic ---
  const fusionData = demoOrders; // See all
  const fusionStats = {
      total: fusionData.length,
      amount: fusionData.reduce((acc, cur) => acc + parseInt(cur.amount.replace(/[^0-9]/g, '')), 0),
      domains: [...new Set(fusionData.map(d => d.domainName))].length
  };

  // --- Switching Logic ---
  const switchingData = demoOrders.filter(o => o.domainId === currentContextId);
  const currentDomainInfo = domains.find(d => d.id === currentContextId);

  // Generate options dynamically for Branches
  const domainOptions = useMemo(() => {
      return domains
        .filter(d => d.code.startsWith('BRANCH')) // Only show Branches for this demo scenario
        .map(d => ({ label: `🏢 ${d.name}`, value: d.id }));
  }, [domains]);

  // Columns definition
  const columns = [
    { header: '订单编号', accessor: 'id' },
    { header: '客户名称', accessor: 'customer' },
    { header: '订购产品', accessor: 'product' },
    { 
        header: '归属域', 
        accessor: (row: any) => (
            <Badge color={row.domainId === '5' ? 'blue' : 'green'}>{row.domainName}</Badge>
        ) 
    },
    { header: '金额', accessor: 'amount' },
    { 
        header: '状态', 
        accessor: (row: any) => row.status === 'normal' 
            ? <span className="text-green-400 text-xs">● 正常</span> 
            : <span className="text-yellow-400 text-xs">● 异常</span> 
    }
  ];

  return (
    <div className="h-full flex flex-col space-y-6">
        {/* Intro / Toggle */}
        <div className="flex justify-center shrink-0">
            <div className="bg-slate-800 p-1 rounded-lg flex space-x-2 border border-slate-700">
                <button 
                    onClick={() => setActiveTab('fusion')}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'fusion' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Users size={16} />
                    跨客户融合 (Fusion)
                </button>
                <button 
                    onClick={() => setActiveTab('switching')}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'switching' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Repeat size={16} />
                    按客户切换 (Switching)
                </button>
            </div>
        </div>

        {/* --- FUSION MODE VIEW --- */}
        {activeTab === 'fusion' && (
            <div className="flex-1 flex flex-col space-y-4 animate-in fade-in duration-300">
                <div className="bg-gradient-to-r from-blue-900/40 to-slate-900 border border-blue-500/30 rounded-lg p-4 flex items-start gap-4">
                     <div className="p-3 bg-blue-500/20 rounded-full text-blue-400 shrink-0">
                         <Crown size={24} />
                     </div>
                     <div>
                         <h3 className="text-lg font-bold text-white">全局统管视图</h3>
                         <p className="text-slate-400 text-sm mt-1">
                             当前登录用户为 <b>超级管理员</b> 或 <b>省公司管理员</b>。
                             系统开启了“跨客户融合”，您无需切换账号即可查看所有下级域（合肥、马鞍山等）的业务数据。
                             数据已自动聚合。
                         </p>
                     </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-3 gap-4 shrink-0">
                    <Card className="flex items-center p-4">
                        <div className="p-3 bg-slate-700/50 rounded-full mr-4"><Database className="text-blue-400" /></div>
                        <div>
                            <div className="text-slate-400 text-xs">全域订单总数</div>
                            <div className="text-2xl font-bold text-white">{fusionStats.total}</div>
                        </div>
                    </Card>
                    <Card className="flex items-center p-4">
                        <div className="p-3 bg-slate-700/50 rounded-full mr-4"><Globe className="text-green-400" /></div>
                        <div>
                            <div className="text-slate-400 text-xs">覆盖区域 (域)</div>
                            <div className="text-2xl font-bold text-white">{fusionStats.domains} 个</div>
                        </div>
                    </Card>
                    <Card className="flex items-center p-4">
                        <div className="p-3 bg-slate-700/50 rounded-full mr-4"><LayoutDashboard className="text-purple-400" /></div>
                        <div>
                            <div className="text-slate-400 text-xs">总营收规模</div>
                            <div className="text-2xl font-bold text-white">¥{(fusionStats.amount).toLocaleString()}</div>
                        </div>
                    </Card>
                </div>

                <Card className="flex-1 overflow-hidden flex flex-col" title="全省业务总览 (All Regions)">
                    <div className="flex-1 overflow-auto">
                        <Table columns={columns} data={fusionData} />
                    </div>
                </Card>
            </div>
        )}

        {/* --- SWITCHING MODE VIEW --- */}
        {activeTab === 'switching' && (
            <div className="flex-1 flex flex-col space-y-4 animate-in fade-in duration-300">
                <div className="bg-gradient-to-r from-green-900/40 to-slate-900 border border-green-500/30 rounded-lg p-4 flex items-start gap-4">
                     <div className="p-3 bg-green-500/20 rounded-full text-green-400 shrink-0">
                         <ArrowRightLeft size={24} />
                     </div>
                     <div>
                         <h3 className="text-lg font-bold text-white">多域切换视图</h3>
                         <p className="text-slate-400 text-sm mt-1">
                             当前登录用户为 <b>分公司运维人员</b>。
                             由于权限隔离或管理规范，您需要切换“当前工作域”来访问不同分公司的数据。
                             切换后，系统上下文将完全变更。
                         </p>
                     </div>
                </div>

                {/* Context Switcher Bar */}
                <Card className="shrink-0 bg-slate-800 border-green-900/50">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                             <span className="text-sm text-slate-400">当前工作上下文:</span>
                             <div className="w-64">
                                <Select 
                                    options={domainOptions}
                                    value={currentContextId}
                                    onChange={(e) => setCurrentContextId(e.target.value)}
                                    className="!bg-slate-900 !border-green-500/50 text-white font-medium"
                                />
                             </div>
                             {currentContextId === '5' && <Badge color="blue">省会城市</Badge>}
                             {currentContextId === '6' && <Badge color="green">工业重镇</Badge>}
                         </div>
                         <div className="text-xs text-slate-500">
                             数据已过滤，仅显示 {currentDomainInfo?.name} 相关内容
                         </div>
                    </div>
                </Card>

                {/* Context Specific Content */}
                <Card className="flex-1 overflow-hidden flex flex-col" title={`${currentDomainInfo?.name} - 业务列表`}>
                    <div className="flex-1 overflow-auto">
                        <Table columns={columns} data={switchingData} />
                    </div>
                    {switchingData.length === 0 && (
                        <div className="p-8 text-center text-slate-500">该域下暂无数据</div>
                    )}
                </Card>
            </div>
        )}
    </div>
  );
};
