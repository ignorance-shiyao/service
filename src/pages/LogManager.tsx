
import React, { useState, useMemo } from 'react';
import { Card, Table, Button, Badge, Modal, Input, Select, SectionTitle, ColumnConfigDialog } from '../components/UI';
import { Search, RotateCcw, FileText, Clock, AlertCircle, Eye, Download, Settings } from 'lucide-react';
import { MOCK_LOGS } from '../constants';
import { OperLog } from '../types';

export const LogManager: React.FC = () => {
  const [logs, setLogs] = useState<OperLog[]>(MOCK_LOGS);
  const [searchModule, setSearchModule] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [detailLog, setDetailLog] = useState<OperLog | null>(null);

  // Column Config
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);

  const ALL_COLUMNS = useMemo(() => [
      { key: 'title', header: '系统模块', accessor: 'title' },
      { 
          key: 'type', header: '操作类型', 
          accessor: (row: OperLog) => {
              const types = ['其它', '新增', '修改', '删除'];
              return <div className="flex justify-center"><Badge color="gray">{types[row.businessType] || '其它'}</Badge></div>
          }
      },
      { key: 'operName', header: '操作人员', accessor: 'operName' },
      { key: 'ip', header: '主机', accessor: 'operIp' },
      { 
          key: 'status', header: '状态', 
          accessor: (row: OperLog) => (
              <span className={row.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                  {row.status === 'success' ? '成功' : '失败'}
              </span>
          ) 
      },
      { key: 'time', header: '操作时间', accessor: 'operTime' },
      { key: 'cost', header: '消耗时间', accessor: (row: OperLog) => `${row.costTime}ms` },
      {
          key: 'action', header: '操作',
          accessor: (row: OperLog) => (
              <div className="flex justify-center">
                <Button size="sm" variant="ghost" className="!text-blue-500 hover:!text-blue-400" icon={<Eye size={14}/>} onClick={() => setDetailLog(row)}>详情</Button>
              </div>
          )
      }
  ], []);

  const [columnOrder, setColumnOrder] = useState(ALL_COLUMNS.map(c => c.key));

  const activeColumns = useMemo(() => {
      return columnOrder.map(key => ALL_COLUMNS.find(c => c.key === key)).filter(Boolean);
  }, [columnOrder, ALL_COLUMNS]);

  const filteredLogs = useMemo(() => {
      return logs.filter(l => {
          const matchModule = !searchModule || l.title.includes(searchModule);
          const matchUser = !searchUser || l.operName.includes(searchUser);
          const matchStatus = !searchStatus || l.status === searchStatus;
          return matchModule && matchUser && matchStatus;
      });
  }, [logs, searchModule, searchUser, searchStatus]);

  return (
      <div className="h-full flex flex-col space-y-4">
          <Card className="shrink-0" bodyClassName="p-4">
              <div className="flex flex-col gap-3">
                  {/* Row 1: Inputs */}
                  <div className="flex flex-wrap gap-4 items-end">
                      <Input label="系统模块" placeholder="请输入模块名称" value={searchModule} onChange={e => setSearchModule(e.target.value)} className="w-40"/>
                      <Input label="操作人员" placeholder="请输入操作人员" value={searchUser} onChange={e => setSearchUser(e.target.value)} className="w-40"/>
                      <Select label="状态" options={[{label:'全部',value:''},{label:'成功',value:'success'},{label:'失败',value:'fail'}]} value={searchStatus} onChange={e => setSearchStatus(e.target.value)} className="w-32"/>
                  </div>

                  {/* Row 2: Actions */}
                  <div className="flex justify-between items-center border-t border-slate-700/50 pt-3">
                      <div className="flex gap-3">
                          <Button icon={<Search size={16}/>}>查询</Button>
                          <Button variant="secondary" icon={<RotateCcw size={16}/>} onClick={() => { setSearchModule(''); setSearchUser(''); setSearchStatus(''); }}>重置</Button>
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

          <Card className="flex-1 overflow-hidden flex flex-col" title="操作日志列表">
              <div className="flex-1 overflow-auto">
                  <Table columns={activeColumns} data={filteredLogs} keyField="id" />
              </div>
              <div className="py-2 border-t border-slate-700 flex justify-between items-center">
                  <div className="text-sm text-slate-400">共 {filteredLogs.length} 条</div>
              </div>
          </Card>

          <ColumnConfigDialog 
              isOpen={isColumnConfigOpen} 
              onClose={() => setIsColumnConfigOpen(false)} 
              allColumns={ALL_COLUMNS} 
              currentOrder={columnOrder} 
              onSave={setColumnOrder} 
          />

          <Modal isOpen={!!detailLog} onClose={() => setDetailLog(null)} title="操作日志详情" size="md" footer={<Button onClick={() => setDetailLog(null)}>关闭</Button>}>
              {detailLog && (
                  <div className="space-y-4 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                          <div><span className="text-slate-500 block mb-1">操作模块</span><span className="text-slate-200">{detailLog.title}</span></div>
                          <div><span className="text-slate-500 block mb-1">请求地址</span><span className="text-slate-200 break-all">{detailLog.operUrl}</span></div>
                          <div className="col-span-2"><span className="text-slate-500 block mb-1">操作方法</span><span className="text-slate-200 font-mono text-xs bg-slate-900 p-1 rounded block">{detailLog.method}</span></div>
                          <div><span className="text-slate-500 block mb-1">操作人员</span><span className="text-slate-200">{detailLog.operName}</span></div>
                          <div><span className="text-slate-500 block mb-1">主机地址</span><span className="text-slate-200">{detailLog.operIp}</span></div>
                          <div><span className="text-slate-500 block mb-1">操作状态</span><span className={detailLog.status==='success'?'text-green-400':'text-red-400'}>{detailLog.status==='success'?'成功':'失败'}</span></div>
                          <div><span className="text-slate-500 block mb-1">消耗时间</span><span className="text-slate-200">{detailLog.costTime}ms</span></div>
                          <div><span className="text-slate-500 block mb-1">操作时间</span><span className="text-slate-200">{detailLog.operTime}</span></div>
                      </div>
                      {detailLog.errorMsg && (
                          <div className="bg-red-900/20 border border-red-900/50 p-3 rounded text-red-200 mt-4">
                              <div className="flex items-center gap-2 mb-1 font-bold"><AlertCircle size={14}/> 异常信息</div>
                              <div className="text-xs font-mono">{detailLog.errorMsg}</div>
                          </div>
                      )}
                  </div>
              )}
          </Modal>
      </div>
  );
};