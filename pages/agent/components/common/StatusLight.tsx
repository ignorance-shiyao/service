import React from 'react';

export const StatusLight: React.FC<{ status: 'normal' | 'warning' | 'fault' }> = ({ status }) => {
  const cls =
    status === 'normal'
      ? 'bg-emerald-500'
      : status === 'warning'
      ? 'bg-amber-500'
      : 'bg-red-500 animate-pulse';
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${cls}`} />;
};
