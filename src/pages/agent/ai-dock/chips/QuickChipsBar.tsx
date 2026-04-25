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
      chip: 'border-[#49b7df] bg-[#0c7ea3] hover:border-[#9dedff] hover:shadow-[0_10px_20px_rgba(7,106,140,0.45)]',
      icon: 'text-[#cbf4ff]',
    },
    chip_business: {
      chip: 'border-[#59a9ea] bg-[#1b6dad] hover:border-[#b9e1ff] hover:shadow-[0_10px_20px_rgba(20,89,145,0.45)]',
      icon: 'text-[#dbf0ff]',
    },
    chip_report: {
      chip: 'border-[#6a88ea] bg-[#2a5fc7] hover:border-[#c5d4ff] hover:shadow-[0_10px_20px_rgba(33,74,160,0.46)]',
      icon: 'text-[#e0e8ff]',
    },
    chip_knowledge: {
      chip: 'border-[#9585ed] bg-[#5c56cb] hover:border-[#d3c7ff] hover:shadow-[0_10px_20px_rgba(77,72,166,0.48)]',
      icon: 'text-[#ece8ff]',
    },
    chip_ticket: {
      chip: 'border-[#7d84e4] bg-[#4553bf] hover:border-[#c3c8ff] hover:shadow-[0_10px_20px_rgba(54,71,156,0.48)]',
      icon: 'text-[#dde3ff]',
    },
    chip_fault: {
      chip: 'border-[#d18a41] bg-[#b86a1e] hover:border-[#ffd299] hover:shadow-[0_10px_20px_rgba(154,91,28,0.48)]',
      icon: 'text-[#ffe4c2]',
    },
    chip_manager: {
      chip: 'border-[#43ae82] bg-[#1f9064] hover:border-[#9bf8cf] hover:shadow-[0_10px_20px_rgba(20,118,81,0.48)]',
      icon: 'text-[#d4ffe9]',
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
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#f4fbff] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition hover:-translate-y-[1px] ${styleMap[chip.id]?.chip || 'border-[#3b7ebb] bg-[#1b5a99] hover:border-[#69beff]'}`}
          >
            <span className={styleMap[chip.id]?.icon || 'text-[#9fd7ff]'}>{iconMap[chip.id]}</span>
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
};
