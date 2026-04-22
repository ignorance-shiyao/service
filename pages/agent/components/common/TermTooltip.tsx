import React from 'react';
import { Info } from 'lucide-react';

export const TermTooltip: React.FC<{ term: string; hint: string }> = ({ term, hint }) => (
  <span className="inline-flex items-center gap-1 text-xs text-slate-300" title={hint}>
    {term}
    <Info size={12} className="text-slate-500" />
  </span>
);
