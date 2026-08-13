import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  colorScheme?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'blue' | 'slate';
  className?: string;
}

const colorStyles = {
  indigo: {
    bg: 'bg-white',
    icon: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
    border: 'border-slate-200',
    value: 'text-indigo-900',
  },
  emerald: {
    bg: 'bg-white',
    icon: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    border: 'border-slate-200',
    value: 'text-emerald-900',
  },
  rose: {
    bg: 'bg-white',
    icon: 'text-rose-600',
    iconBg: 'bg-rose-50',
    border: 'border-slate-200',
    value: 'text-rose-900',
  },
  amber: {
    bg: 'bg-white',
    icon: 'text-amber-600',
    iconBg: 'bg-amber-50',
    border: 'border-slate-200',
    value: 'text-amber-900',
  },
  blue: {
    bg: 'bg-white',
    icon: 'text-blue-600',
    iconBg: 'bg-blue-50',
    border: 'border-slate-200',
    value: 'text-blue-900',
  },
  slate: {
    bg: 'bg-white',
    icon: 'text-slate-600',
    iconBg: 'bg-slate-100',
    border: 'border-slate-200',
    value: 'text-slate-900',
  }
};

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  colorScheme = 'slate',
  className = '',
}) => {
  const styles = colorStyles[colorScheme];

  return (
    <div className={`rounded-[4px] border shadow-sm p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-md ${styles.bg} ${styles.border} ${className}`}>
      <div className="mb-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-blue-900 leading-tight">{title}</h3>
      </div>
      <div className="flex items-baseline space-x-1 mt-auto">
        <span className={`text-xl font-bold tracking-tight ${styles.value}`}>
          {value}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-slate-400">{unit}</span>
        )}
      </div>
    </div>
  );
};
