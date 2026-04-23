import React from 'react';
import { Activity, BadgeHelp, BriefcaseBusiness, FileText, LifeBuoy, MessagesSquare, Ticket } from 'lucide-react';
import { QuickChip } from '../store/useAiDock';

interface QuickChipsBarProps {
  chips: QuickChip[];
  onClick: (chip: QuickChip) => void;
  className?: string;
}

export const QuickChipsBar: React.FC<QuickChipsBarProps> = ({ chips, onClick, className = '' }) => {
  const iconMap: Record<string, React.ReactNode> = {
    chip_health: <Activity size={12} />,
    chip_business: <BriefcaseBusiness size={12} />,
    chip_report: <FileText size={12} />,
    chip_knowledge: <BadgeHelp size={12} />,
    chip_ticket: <Ticket size={12} />,
    chip_fault: <LifeBuoy size={12} />,
    chip_manager: <MessagesSquare size={12} />,
  };
  const styleMap: Record<string, { chip: string; icon: string }> = {
    chip_health: {
      chip: 'border-[#3f8fb6] bg-[#175f7a] hover:border-[#71d2ff] hover:shadow-[0_8px_18px_rgba(9,66,96,0.38)]',
      icon: 'text-[#9fe6ff]',
    },
    chip_business: {
      chip: 'border-[#5689b9] bg-[#2a5b8f] hover:border-[#8fc1f5] hover:shadow-[0_8px_18px_rgba(24,66,112,0.36)]',
      icon: 'text-[#bfe0ff]',
    },
    chip_report: {
      chip: 'border-[#4a7fbc] bg-[#285a98] hover:border-[#86beff] hover:shadow-[0_8px_18px_rgba(21,58,108,0.38)]',
      icon: 'text-[#b4d6ff]',
    },
    chip_knowledge: {
      chip: 'border-[#5a75c0] bg-[#374f9b] hover:border-[#9fb1ff] hover:shadow-[0_8px_18px_rgba(41,58,126,0.4)]',
      icon: 'text-[#c6d0ff]',
    },
    chip_ticket: {
      chip: 'border-[#5b7bc5] bg-[#3154a4] hover:border-[#9bc0ff] hover:shadow-[0_8px_18px_rgba(35,62,130,0.38)]',
      icon: 'text-[#b9d2ff]',
    },
    chip_fault: {
      chip: 'border-[#a26f46] bg-[#875426] hover:border-[#ffbe70] hover:shadow-[0_8px_18px_rgba(118,71,23,0.4)]',
      icon: 'text-[#ffd59d]',
    },
    chip_manager: {
      chip: 'border-[#4b8a6f] bg-[#2a7c5a] hover:border-[#88efc4] hover:shadow-[0_8px_18px_rgba(23,103,72,0.4)]',
      icon: 'text-[#a9ffd8]',
    },
  };

  return (
    <div className={className}>
      <div className="flex gap-2 overflow-x-auto whitespace-nowrap custom-scrollbar">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => onClick(chip)}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-[#e7f4ff] transition hover:-translate-y-[1px] ${styleMap[chip.id]?.chip || 'border-[#3b7ebb] bg-[#1b5a99] hover:border-[#69beff]'}`}
          >
            <span className={styleMap[chip.id]?.icon || 'text-[#9fd7ff]'}>{iconMap[chip.id]}</span>
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
};
