
import React, { useState, useMemo } from 'react';
import { Card, Table, Button, Badge, Modal, Input, Select, Switch, ConfirmDialog, SectionTitle, ColumnConfigDialog } from '../components/UI';
import { Plus, Edit2, Trash2, Search, RotateCcw, Briefcase, Download, Settings } from 'lucide-react';
import { MOCK_POSTS } from '../constants';
import { Post } from '../types';

export const PostManager: React.FC = () => {
  const [data, setData] = useState<Post[]>(MOCK_POSTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState<Partial<Post>>({});
  
  // Search State
  const [searchName, setSearchName] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [searchStatus, setSearchStatus] = useState('');

  // Confirm Dialogs
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Column Config
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);

  const handleEdit = (post: Post) => {
      setCurrentPost({ ...post });
      setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
      setDeleteTargetId(id);
      setDeleteConfirmOpen(true);
  };

  const ALL_COLUMNS = useMemo(() => [
      { key: 'code', header: '岗位编码', accessor: 'code' },
      { key: 'name', header: '岗位名称', accessor: 'name' },
      { key: 'sort', header: '显示顺序', accessor: 'sort' },
      { 
          key: 'status', header: '状态', 
          accessor: (row: Post) => (
              <div className="flex justify-center">
                <Badge color={row.status === 'active' ? 'blue' : 'red'}>
                    {row.status === 'active' ? '正常' : '停用'}
                </Badge>
              </div>
          ) 
      },
      { key: 'createTime', header: '创建时间', accessor: 'createTime' },
      {
          key: 'action', header: '操作',
          accessor: (row: Post) => (
              <div className="flex space-x-2 justify-center">
                  <Button size="sm" variant="ghost" className="!text-blue-500 hover:!text-blue-400" icon={<Edit2 size={14}/>} onClick={() => handleEdit(row)}>编辑</Button>
                  <Button size="sm" variant="ghost" className="!text-red-500 hover:!text-red-400" icon={<Trash2 size={14}/>} onClick={() => handleDelete(row.id)}>删除</Button>
              </div>
          )
      }
  ], []);

  const [columnOrder, setColumnOrder] = useState(ALL_COLUMNS.map(c => c.key));

  const activeColumns = useMemo(() => {
      return columnOrder.map(key => ALL_COLUMNS.find(c => c.key === key)).filter(Boolean);
  }, [columnOrder, ALL_COLUMNS]);

  const filteredData = useMemo(() => {
      return data.filter(p => {
          const matchName = !searchName || p.name.toLowerCase().includes(searchName.toLowerCase());
          const matchCode = !searchCode || p.code.toLowerCase().includes(searchCode.toLowerCase());
          const matchStatus = !searchStatus || p.status === searchStatus;
          return matchName && matchCode && matchStatus;
      });
  }, [data, searchName, searchCode, searchStatus]);

  const handleAdd = () => {
      setCurrentPost({ status: 'active', sort: 0 });
      setIsModalOpen(true);
  };

  const handleSave = () => {
      if (!currentPost.name || !currentPost.code) {
          alert("请完善岗位信息");
          return;
      }
      if (currentPost.id) {
          setData(data.map(p => p.id === currentPost.id ? { ...p, ...currentPost } as Post : p));
      } else {
          const newPost = {
              ...currentPost,
              id: Date.now().toString(),
              createTime: new Date().toLocaleDateString()
          } as Post;
          setData([...data, newPost]);
      }
      setIsModalOpen(false);
  };

  const confirmDelete = () => {
      if (deleteTargetId) {
          setData(data.filter(p => p.id !== deleteTargetId));
      }
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
  };

  return (
      <div className="h-full flex flex-col space-y-4">
          <Card className="shrink-0" bodyClassName="p-4">
              <div className="flex flex-col gap-3">
                  {/* Row 1: Search Inputs */}
                  <div className="flex flex-wrap gap-4 items-end">
                      <Input 
                          label="岗位名称" 
                          placeholder="请输入岗位名称" 
                          value={searchName} 
                          onChange={e => setSearchName(e.target.value)}
                          className="w-40"
                      />
                      <Input 
                          label="岗位编码" 
                          placeholder="请输入岗位编码" 
                          value={searchCode} 
                          onChange={e => setSearchCode(e.target.value)}
                          className="w-40"
                      />
                      <Select 
                          label="状态"
                          options={[{label: '全部', value: ''}, {label: '正常', value: 'active'}, {label: '停用', value: 'inactive'}]}
                          value={searchStatus}
                          onChange={e => setSearchStatus(e.target.value)}
                          className="w-32"
                      />
                  </div>

                  {/* Row 2: Actions */}
                  <div className="flex justify-between items-center border-t border-[var(--sys-border-primary)] pt-3">
                      <div className="flex gap-3">
                          <Button variant="primary" icon={<Search size={16}/>}>查询</Button>
                          <Button variant="secondary" icon={<RotateCcw size={16}/>} onClick={() => { setSearchName(''); setSearchCode(''); setSearchStatus(''); }}>重置</Button>
                          <Button className="bg-emerald-600 hover:bg-emerald-500 text-white" icon={<Plus size={16}/>} onClick={handleAdd}>新增岗位</Button>
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

          <Card className="flex-1 overflow-hidden flex flex-col" title="岗位列表">
              <div className="flex-1 overflow-auto">
                  <Table columns={activeColumns} data={filteredData} keyField="id" />
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
              onClose={() => setIsModalOpen(false)}
              title={currentPost.id ? "编辑岗位" : "新增岗位"}
              size="md"
              footer={
                  <>
                      <Button variant="secondary" onClick={() => setIsModalOpen(false)}>取消</Button>
                      <Button onClick={handleSave}>确定</Button>
                  </>
              }
          >
              <div className="space-y-4">
                  <Input 
                      label="岗位名称" 
                      value={currentPost.name || ''} 
                      onChange={e => setCurrentPost({...currentPost, name: e.target.value})}
                      placeholder="请输入岗位名称"
                  />
                  <Input 
                      label="岗位编码" 
                      value={currentPost.code || ''} 
                      onChange={e => setCurrentPost({...currentPost, code: e.target.value})}
                      placeholder="请输入编码"
                  />
                  <Input 
                      label="显示顺序" 
                      type="number"
                      value={currentPost.sort || 0} 
                      onChange={e => setCurrentPost({...currentPost, sort: parseInt(e.target.value)})}
                  />
                  <div className="flex flex-col gap-2">
                      <label className="text-sm text-slate-400">岗位状态</label>
                      <div className="flex items-center gap-2">
                          <Switch 
                              checked={currentPost.status === 'active'}
                              onChange={c => setCurrentPost({...currentPost, status: c ? 'active' : 'inactive'})}
                          />
                          <span className="text-sm text-slate-300">{currentPost.status === 'active' ? '正常' : '停用'}</span>
                      </div>
                  </div>
                  <Input 
                      label="备注" 
                      value={currentPost.remark || ''} 
                      onChange={e => setCurrentPost({...currentPost, remark: e.target.value})}
                      placeholder="请输入备注"
                  />
              </div>
          </Modal>

          <ConfirmDialog 
              isOpen={deleteConfirmOpen} 
              title="删除岗位"
              message="确定要删除该岗位吗？"
              onConfirm={confirmDelete}
              onCancel={() => setDeleteConfirmOpen(false)}
          />
      </div>
  );
};