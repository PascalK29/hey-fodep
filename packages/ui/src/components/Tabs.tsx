import React from 'react';

export interface TabOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabOption[];
  activeTab: string;
  onChange: (id: string) => void;
  isSidebarCollapsed?: boolean;
  variant?: 'indigo' | 'deepblue';
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, isSidebarCollapsed, variant = 'indigo' }) => {
  return (
    <div className={`inline-flex p-1 bg-slate-100 rounded border border-slate-200/30 transition-all duration-200 ${isSidebarCollapsed === false ? 'gap-1' : 'gap-1.5'}`}>
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        return (
          <React.Fragment key={tab.id}>
            {index > 0 && (
              <div className="w-[1px] h-3 bg-slate-300/70 self-center shrink-0" />
            )}
            <button
              onClick={() => onChange(tab.id)}
              className={`
                flex items-center space-x-2 rounded font-semibold transition-all duration-200 whitespace-nowrap
                ${isSidebarCollapsed === false 
                  ? 'text-[10.5px] px-2.5 py-1.5' 
                  : 'text-xs px-4 py-1.5'}
                ${isActive 
                  ? (variant === 'deepblue' ? 'bg-[#1a2542] text-white shadow-sm' : 'bg-indigo-600 text-white shadow-sm')
                  : 'text-blue-900 hover:text-blue-950 hover:bg-white/80'}
              `}
            >
              {tab.icon && (
                <span className={`transition-colors duration-200 ${isActive ? 'text-white' : 'text-blue-900'}`}>
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};
