import React, { useMemo, useState } from 'react';

type BusinessQueryItem = {
  id: string;
  name: string;
  site: string;
  region: string;
  status: 'normal' | 'warning' | 'danger';
  bandwidth: string;
  updatedAt: string;
  owner: string;
};

type BusinessQueryCategory = {
  code: string;
  label: string;
  items: BusinessQueryItem[];
};

interface BusinessQueryCardProps {
  categories: BusinessQueryCategory[];
}

export const BusinessQueryCard: React.FC<BusinessQueryCardProps> = ({ categories }) => {
  const [activeCode, setActiveCode] = useState(categories[0]?.code || '');
  const [visibleCount, setVisibleCount] = useState(12);
  const [activeItemId, setActiveItemId] = useState('');

  const activeCategory = useMemo(
    () => categories.find((c) => c.code === activeCode) || categories[0],
    [activeCode, categories]
  );

  const visibleItems = (activeCategory?.items || []).slice(0, visibleCount);
  const activeItem = (activeCategory?.items || []).find((i) => i.id === activeItemId) || visibleItems[0];

  return (
    <div className="rounded-xl border border-[#4e7eb5] bg-[#143d6a] p-3 shadow-[0_10px_22px_rgba(7,29,63,0.3)]">
      <div className="mb-2 text-xs font-semibold text-[#c8e6ff]">业务查询</div>
      <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-2">
        <div className="rounded-lg border border-[#3f73a8] bg-[#10345b] p-2">
          <div className="mb-1 text-[11px] text-[#8eb9dd]">业务类型</div>
          <div className="space-y-1">
            {categories.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  setActiveCode(c.code);
                  setVisibleCount(12);
                  setActiveItemId('');
                }}
                className={`w-full rounded px-2 py-1 text-left text-xs ${
                  activeCode === c.code
                    ? 'border border-[#70beff] bg-[#2a679f] text-[#eaf7ff]'
                    : 'border border-transparent bg-[#174777] text-[#bbdbf6] hover:border-[#4f96ce]'
                }`}
              >
                {c.label}（{c.items.length}）
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_220px] gap-2">
          <div className="rounded-lg border border-[#3f73a8] bg-[#10345b] p-2">
            <div className="mb-1 text-[11px] text-[#8eb9dd]">业务清单（滚动自动加载）</div>
            <div
              className="custom-scrollbar max-h-[210px] space-y-1 overflow-auto pr-1"
              onScroll={(e) => {
                const target = e.currentTarget;
                const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 20;
                if (nearBottom) {
                  setVisibleCount((prev) => Math.min(prev + 10, activeCategory?.items.length || prev));
                }
              }}
            >
              {visibleItems.map((item) => {
                const status = item.status === 'danger' ? '异常' : item.status === 'warning' ? '关注' : '正常';
                const dot = item.status === 'danger' ? 'bg-[#ff6f7c]' : item.status === 'warning' ? 'bg-[#ffbe62]' : 'bg-[#43d6a0]';
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveItemId(item.id)}
                    className={`w-full rounded border px-2 py-1 text-left text-xs ${
                      activeItem?.id === item.id
                        ? 'border-[#74c2ff] bg-[#2a679f] text-[#eaf7ff]'
                        : 'border-[#315f8e] bg-[#184877] text-[#c4e0f8]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate pr-2">{item.name}</span>
                      <span className="inline-flex items-center gap-1 text-[10px]"><i className={`h-1.5 w-1.5 rounded-full ${dot}`} />{status}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-[#3f73a8] bg-[#10345b] p-2">
            <div className="mb-1 text-[11px] text-[#8eb9dd]">详情</div>
            {activeItem ? (
              <div className="space-y-1 text-xs text-[#cfe4f8]">
                <div>业务ID：{activeItem.id}</div>
                <div>业务名称：{activeItem.name}</div>
                <div>站点：{activeItem.site}</div>
                <div>区域：{activeItem.region}</div>
                <div>带宽：{activeItem.bandwidth}</div>
                <div>责任人：{activeItem.owner}</div>
                <div>更新时间：{activeItem.updatedAt}</div>
              </div>
            ) : (
              <div className="text-xs text-[#9abfdd]">请选择一条业务查看详情</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
