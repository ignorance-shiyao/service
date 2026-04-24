import React from 'react';

interface CardAction {
  key: string;
  label: string;
  tone?: 'primary' | 'normal';
  onClick: () => void;
}

interface CardActionBarProps {
  actions: CardAction[];
}

export const CardActionBar: React.FC<CardActionBarProps> = ({ actions }) => {
  if (!actions.length) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          className={
            action.tone === 'primary'
              ? 'ai-dock-card-action ai-dock-card-action-primary'
              : 'ai-dock-card-action'
          }
          onClick={action.onClick}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};

