import React, { useMemo, useState } from 'react';
import { FAQ_CATEGORIES } from '../../mock/faq';

export const KnowledgeTab: React.FC<{ onAsk: (q: string) => void }> = ({ onAsk }) => {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState(FAQ_CATEGORIES[0].id);

  const items = useMemo(() => {
    const current = FAQ_CATEGORIES.find((x) => x.id === cat) || FAQ_CATEGORIES[0];
    return current.items.filter((x) => x.includes(search));
  }, [cat, search]);

  return (
    <div className="flex h-full min-h-0 gap-3">
      <div className="w-28 shrink-0 space-y-1 rounded-lg border border-[#2a4f75] bg-[#0d223d] p-2">
        {FAQ_CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={`w-full rounded px-2 py-1 text-left text-xs ${cat === c.id ? 'bg-[#2f7fce] text-white' : 'text-[#b8d1e8] hover:bg-[#1a3758]'}`}
            onClick={() => setCat(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <input className="w-full rounded border border-[#33597e] bg-[#0a1a30] px-3 py-2 text-sm text-white placeholder:text-[#6e8ca9]" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索高频问题" />
        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {items.map((q) => (
            <button key={q} className="w-full rounded border border-[#32587f] bg-[#0e2440] p-2 text-left text-xs text-[#d4e7f9] hover:border-[#5aa8ff]" onClick={() => onAsk(q)}>{q}</button>
          ))}
        </div>
      </div>
    </div>
  );
};
