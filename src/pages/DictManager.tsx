
import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Badge, Modal, Input, Select, Switch, ConfirmDialog, Pagination, SectionTitle } from '../components/UI';
import { Plus, Edit2, Trash2, Search, RotateCcw, Book, List, RefreshCcw } from 'lucide-react';
import { DictType, DictData } from '../types';
import { useAppData } from '../context/AppDataContext';

export const DictManager: React.FC = () => {
  const { dictTypes, dictData, updateDictTypes, updateDictData } = useAppData();
  // Left: Type List State
  const [types, setTypes] = useState<DictType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [searchType, setSearchType] = useState('');

  // Right: Data List State
  const [datas, setDatas] = useState<DictData[]>([]);
  const [searchLabel, setSearchLabel] = useState('');

  // Modal State
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [dataModalOpen, setDataModalOpen] = useState(false);
  const [currentType, setCurrentType] = useState<Partial<DictType>>({});
  const [currentData, setCurrentData] = useState<Partial<DictData>>({});

  const commitDictTypes = (next: DictType[]) => {
    setTypes(next);
    updateDictTypes(next);
  };

  const commitDictData = (next: DictData[]) => {
    setDatas(next);
    updateDictData(next);
  };

  useEffect(() => {
    setTypes(dictTypes);
    setDatas(dictData);
    setSelectedTypeId((prev) => prev || dictTypes[0]?.id || '');
  }, [dictTypes, dictData]);

  // --- Type Logic ---
  const filteredTypes = useMemo(() => {
      return types.filter(t => !searchType || t.name.includes(searchType) || t.type.includes(searchType));
  }, [types, searchType]);

  const handleAddType = () => {
      setCurrentType({ status: 'active' });
      setTypeModalOpen(true);
  };

  const handleEditType = (t: DictType) => {
      setCurrentType({ ...t });
      setTypeModalOpen(true);
  };

  const handleSaveType = () => {
      if (!currentType.name || !currentType.type) return;
      if (currentType.id) {
          commitDictTypes(types.map(t => t.id === currentType.id ? { ...t, ...currentType } as DictType : t));
      } else {
          commitDictTypes([...types, { ...currentType, id: Date.now().toString(), createTime: new Date().toLocaleDateString() } as DictType]);
      }
      setTypeModalOpen(false);
  };

  // --- Data Logic ---
  const selectedTypeObj = types.find(t => t.id === selectedTypeId);
  
  const filteredDatas = useMemo(() => {
      if (!selectedTypeObj) return [];
      return datas.filter(d => 
          d.dictType === selectedTypeObj.type && 
          (!searchLabel || d.label.includes(searchLabel))
      );
  }, [datas, selectedTypeObj, searchLabel]);

  const handleAddData = () => {
      if (!selectedTypeObj) return;
      setCurrentData({ dictType: selectedTypeObj.type, status: 'active', sort: 0, isDefault: false, classType: 'default' });
      setDataModalOpen(true);
  };

  const handleEditData = (d: DictData) => {
      setCurrentData({ ...d });
      setDataModalOpen(true);
  };

  const handleSaveData = () => {
      if (!currentData.label || !currentData.value) return;
      if (currentData.id) {
          commitDictData(datas.map(d => d.id === currentData.id ? { ...d, ...currentData } as DictData : d));
      } else {
          commitDictData([...datas, { ...currentData, id: Date.now().toString() } as DictData]);
      }
      setDataModalOpen(false);
  };

  // --- Render ---
  const typeColumns = [
      { header: '字典名称', accessor: 'name' },
      { header: '字典类型', accessor: 'type' },
      { header: '操作', accessor: (row: DictType) => (
          <div className="flex gap-2">
              <button className="text-blue-400 hover:text-blue-300" onClick={(e) => { e.stopPropagation(); handleEditType(row); }}><Edit2 size={12}/></button>
          </div>
      )}
  ];

  const dataColumns = [
      { header: '标签', accessor: 'label' },
      { header: '键值', accessor: 'value' },
      { header: '排序', accessor: 'sort' },
      { 
          header: '样式', 
          accessor: (row: DictData) => (
              <Badge color={row.classType === 'danger' ? 'red' : row.classType === 'success' ? 'green' : row.classType === 'warning' ? 'yellow' : 'blue'}>
                  {row.classType || 'default'}
              </Badge>
          ) 
      },
      { 
          header: '状态', 
          accessor: (row: DictData) => <span className={row.status==='active'?'text-green-400':'text-red-400'}>{row.status==='active'?'正常':'停用'}</span> 
      },
      {
          header: '操作',
          accessor: (row: DictData) => (
              <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="!text-blue-500 hover:!text-blue-400" icon={<Edit2 size={12}/>} onClick={() => handleEditData(row)}>编辑</Button>
                  <Button size="sm" variant="ghost" className="!text-red-500 hover:!text-red-400" icon={<Trash2 size={12}/>} onClick={() => commitDictData(datas.filter(d => d.id !== row.id))}>删除</Button>
              </div>
          )
      }
  ];

  return (
      <div className="dict-manager-page h-full flex gap-4">
          {/* Left: Types */}
          <Card className="w-1/3 flex flex-col" title="字典类型" bodyClassName="p-3">
              <div className="flex gap-2 mb-3">
                  <Input placeholder="字典名称/类型" value={searchType} onChange={e => setSearchType(e.target.value)} className="flex-1 text-xs h-8" />
                  <Button size="sm" icon={<Plus size={14}/>} onClick={handleAddType}></Button>
              </div>
              <div className="flex-1 overflow-auto rounded border border-[#2f6ca9]/80 bg-[linear-gradient(180deg,rgba(13,51,98,0.5)_0%,rgba(10,42,82,0.42)_100%)]">
                  <table className="w-full text-sm text-left text-[var(--sys-text-secondary)]">
                      <thead className="border-b border-[#2f6ca9] bg-[linear-gradient(180deg,rgba(34,81,133,0.96)_0%,rgba(27,68,116,0.92)_100%)] text-xs text-[#b7d8fb]">
                          <tr>
                              <th className="px-3 py-2">名称</th>
                              <th className="px-3 py-2">类型</th>
                              <th className="px-3 py-2 w-10"></th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-[#255f98]">
                          {filteredTypes.map(t => (
                              <tr 
                                key={t.id} 
                                className={`cursor-pointer transition-colors ${selectedTypeId === t.id ? 'bg-[#2f7fd8]/22' : 'hover:bg-[#225d9f]/22'}`}
                                onClick={() => setSelectedTypeId(t.id)}
                              >
                                  <td className="px-3 py-2 text-[#d9ecff]">{t.name}</td>
                                  <td className="px-3 py-2 text-[#8fb5db] text-xs" title={t.type}>{t.type}</td>
                                  <td className="px-3 py-2">
                                      <Edit2 size={12} className="text-[#84add6] hover:text-blue-300" onClick={(e) => {e.stopPropagation(); handleEditType(t)}}/>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </Card>

          {/* Right: Data */}
          <div className="flex-1 flex flex-col gap-4">
              <Card className="shrink-0" bodyClassName="p-3">
                  <div className="flex justify-between items-center">
                      <div className="flex gap-4 items-center">
                          <span className="text-sm font-bold text-[#d9ecff] flex items-center gap-2">
                              <Book size={16} className="text-blue-500"/>
                              {selectedTypeObj ? selectedTypeObj.name : '请选择字典'}
                          </span>
                          <span className="rounded border border-[#3c77b1]/85 bg-[linear-gradient(180deg,rgba(45,86,134,0.92)_0%,rgba(30,67,111,0.92)_100%)] px-2 py-0.5 text-xs font-semibold text-[#9dc4ec]">{selectedTypeObj?.type}</span>
                      </div>
                      <div className="flex gap-2">
                          <Input placeholder="数据标签" value={searchLabel} onChange={e => setSearchLabel(e.target.value)} className="w-40 h-8 text-xs" />
                          <Button size="sm" icon={<Search size={14}/>}>搜索</Button>
                          <Button size="sm" variant="primary" className="bg-green-600 hover:bg-green-500" icon={<Plus size={14}/>} onClick={handleAddData} disabled={!selectedTypeId}>新增数据</Button>
                      </div>
                  </div>
              </Card>

              <Card className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-auto">
                      <Table columns={dataColumns} data={filteredDatas} keyField="id" />
                  </div>
              </Card>
          </div>

          {/* Modals */}
          <Modal isOpen={typeModalOpen} onClose={() => setTypeModalOpen(false)} title={currentType.id ? "编辑字典类型" : "新增字典类型"} size="sm" 
            footer={<><Button variant="secondary" onClick={() => setTypeModalOpen(false)}>取消</Button><Button onClick={handleSaveType}>确定</Button></>}>
              <div className="space-y-4">
                  <Input label="字典名称" value={currentType.name || ''} onChange={e => setCurrentType({...currentType, name: e.target.value})} />
                  <Input label="字典类型" value={currentType.type || ''} onChange={e => setCurrentType({...currentType, type: e.target.value})} />
                  <Input label="备注" value={currentType.remark || ''} onChange={e => setCurrentType({...currentType, remark: e.target.value})} />
              </div>
          </Modal>

          <Modal isOpen={dataModalOpen} onClose={() => setDataModalOpen(false)} title={currentData.id ? "编辑字典数据" : "新增字典数据"} size="sm"
            footer={<><Button variant="secondary" onClick={() => setDataModalOpen(false)}>取消</Button><Button onClick={handleSaveData}>确定</Button></>}>
              <div className="space-y-4">
                  <Input label="数据标签" value={currentData.label || ''} onChange={e => setCurrentData({...currentData, label: e.target.value})} />
                  <Input label="数据键值" value={currentData.value || ''} onChange={e => setCurrentData({...currentData, value: e.target.value})} />
                  <Input label="显示排序" type="number" value={currentData.sort || 0} onChange={e => setCurrentData({...currentData, sort: parseInt(e.target.value)})} />
                  <Select label="回显样式" options={[{label:'Default',value:'default'},{label:'Primary',value:'primary'},{label:'Success',value:'success'},{label:'Danger',value:'danger'}]} 
                      value={currentData.classType} onChange={e => setCurrentData({...currentData, classType: e.target.value as any})} />
                  <div className="flex flex-col gap-2">
                      <label className="text-sm text-slate-400">状态</label>
                      <Switch checked={currentData.status === 'active'} onChange={c => setCurrentData({...currentData, status: c?'active':'inactive'})} />
                  </div>
              </div>
          </Modal>
      </div>
  );
};
