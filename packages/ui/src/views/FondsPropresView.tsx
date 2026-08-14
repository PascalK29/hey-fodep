import React, { useState } from 'react';
import type { SolvabiliteAnalyse } from '@heyfodep/kernel';
import { fondsPropresCodes } from '@heyfodep/kernel';
import { Tabs } from '../components/Tabs';

interface FondsPropresViewProps {
  solva: SolvabiliteAnalyse;
  isSidebarCollapsed?: boolean;
}

const formatMoney = (val?: number) => {
  if (val === undefined || isNaN(val)) return '0';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

type TabId = 'synthese' | 'cet1' | 'at1' | 't1' | 't2' | 'effectifs';

interface Bloc {
  title: string;
  accent: 'indigo' | 'emerald' | 'rose' | 'navy';
  codes: string[];
  presentation: 'treemap' | 'vbars' | 'datatable' | 'table' | 'cards';
}

interface Palier {
  title: string;
  subtitle: string;
  totalCodes: string[];
  blocs: Bloc[];
}



const PALLIERS: Record<Exclude<TabId, 'synthese'>, Palier> = {
  cet1: {
    title: 'Fonds Propres de Base Durs (CET1)',
    subtitle: 'Common Equity Tier 1 · qualité supérieure des fonds propres',
    totalCodes: ['FPI22'],
    blocs: [
      {
        title: 'Constituants du capital',
        accent: 'emerald',
        presentation: 'treemap',
        codes: ['FPI01', 'FPI02', 'FPI03', 'FPI04', 'FPI05', 'FPI06', 'FPI07'],
      },
      {
        title: 'Ajustements et déductions',
        accent: 'rose',
        presentation: 'table',
        codes: [
          'FPI09', 'FPI10', 'IM12', 'ID09', 'PA14', 'PA32',
          'FPI11', 'PA07', 'IM06', 'IM10', 'PR04', 'FPI12', 'FPI13', 'FPI20', 'FPI21',
        ],
      },
      {
        title: 'Seuils de participations',
        accent: 'indigo',
        presentation: 'table',
        codes: ['PA22', 'PA31', 'ID11', 'FPI14', 'FPI15', 'FPI16'],
      },
    ],
  },
  at1: {
    title: 'Fonds Propres Additionnels (AT1)',
    subtitle: 'Additional Tier 1 · instruments subordonnés perpétuels',
    totalCodes: ['FPI28'],
    blocs: [
      {
        title: 'Instruments AT1 émis',
        accent: 'emerald',
        presentation: 'treemap',
        codes: ['FPI23', 'FPI24', 'FPI25'],
      },
      {
        title: 'Déductions réglementaires',
        accent: 'rose',
        presentation: 'table',
        codes: ['PA15', 'PA23', 'PA33', 'FPI27'],
      },
    ],
  },
  t1: {
    title: 'Fonds Propres de Base (T1)',
    subtitle: 'Tier 1 · CET1 + AT1',
    totalCodes: ['FPI29'],
    blocs: [
      {
        title: 'Composition du Tier 1',
        accent: 'indigo',
        presentation: 'cards',
        codes: ['FPI22', 'FPI28'],
      },
    ],
  },
  t2: {
    title: 'Fonds Propres Complémentaires (T2)',
    subtitle: 'Tier 2 · fonds propres complémentaires',
    totalCodes: ['FPI40'],
    blocs: [
      {
        title: 'Instruments T2 admissibles',
        accent: 'emerald',
        presentation: 'datatable',
        codes: ['FPI30', 'FPI31', 'FPI32', 'FPI33', 'FPI34', 'FPI35', 'FPI36', 'FPI37', 'FPI38'],
      },
      {
        title: 'Déductions réglementaires',
        accent: 'rose',
        presentation: 'table',
        codes: ['PA16', 'PA24', 'PA34', 'FPI39'],
      },
    ],
  },
  effectifs: {
    title: 'Fonds Propres Effectifs',
    subtitle: 'Total des fonds propres disponibles (T1 + T2)',
    totalCodes: ['FPI41'],
    blocs: [
      {
        title: 'Composition des fonds propres effectifs',
        accent: 'indigo',
        presentation: 'cards',
        codes: ['FPI29', 'FPI40'],
      },
    ],
  },
};



const BAR_COLORS = ['#1a2542', '#303a63', '#3b49df', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

export const FondsPropresView: React.FC<FondsPropresViewProps> = ({ solva, isSidebarCollapsed }) => {
  const [activeTab, setActiveTab] = useState<TabId>('synthese');
  const [subTabActiveIndex, setSubTabActiveIndex] = useState<number>(0);
  
  React.useEffect(() => {
    setSubTabActiveIndex(0);
  }, [activeTab]);
  
  const { valeurs } = solva;

  const palier = activeTab !== 'synthese' ? PALLIERS[activeTab] : null;

  const getVal = (code: string) => valeurs.get(code)?.toNumber() || 0;

  const cet1 = getVal('FPI22');
  const at1 = getVal('FPI28');
  // t1 = cet1 + at1, computed via solva.ratios.t1 directly
  const t2 = getVal('FPI40');
  const effectifs = getVal('FPI41');

  const total = cet1 + at1 + t2;
  const share = (val: number) => (total > 0 ? (val / total) * 100 : 0);

  const apr = solva.apr.toNumber();
  const minCet1Req = solva.normes.find(n => n.code === 'SOLVA_CET1')?.requis.toNumber() || 5.0;
  const minT1Req = solva.normes.find(n => n.code === 'SOLVA_T1')?.requis.toNumber() || 6.0;
  const minTotalReq = solva.normes.find(n => n.code === 'SOLVA_TOTAL')?.requis.toNumber() || 8.0;

  const totalExigenceMontant = (apr * minTotalReq) / 100;

  const totalSurplus = effectifs - totalExigenceMontant;

  const solvencyCoverage = totalExigenceMontant > 0 ? (effectifs / totalExigenceMontant) * 100 : 0;


  const renderBloc = (bloc: Bloc, isLast: boolean) => {
    const items = bloc.codes
      .map(code => fondsPropresCodes.find(c => c.code === code))
      .filter((d): d is NonNullable<typeof d> => !!d);
    const blocSubtotal = items.reduce((sum, d) => sum + Math.abs(getVal(d.code)), 0);
    const totals = palier && isLast
      ? palier.totalCodes.map(code => fondsPropresCodes.find(c => c.code === code)).filter((d): d is NonNullable<typeof d> => !!d)
      : [];

    const rows = items.map((def, i) => {
      const value = getVal(def.code);
      const abs = Math.abs(value);
      const pct = blocSubtotal > 0 ? (abs / blocSubtotal) * 100 : 0;
      return { def, value, pct, color: BAR_COLORS[i % BAR_COLORS.length] };
    });

    const header = (
      <div className="flex items-center justify-between gap-4 px-5 py-3.5 bg-[#1a2542]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-1 h-8 rounded-full" style={{ backgroundColor: bloc.accent === 'emerald' ? '#10b981' : bloc.accent === 'rose' ? '#f43f5e' : bloc.accent === 'indigo' ? '#6366f1' : '#1a2542' }} />
          <h4 className="text-[13px] font-bold text-white leading-tight tracking-wide">{bloc.title.replace(/^\d+\.\s*/, '')}</h4>
        </div>
        <span className="shrink-0 text-[10px] font-bold text-indigo-200 tabular-nums">{items.length} postes</span>
      </div>
    );

      const renderTreemap = () => {
      const sorted = [...rows].sort((a, b) => b.value - a.value);
      const maxV = sorted.length > 0 && sorted[0].value > 0 ? sorted[0].value : 1;

      return (
        <div className="px-6 py-6 fade-in bg-white rounded-b-lg">
          {/* Top Analytics KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50/70 rounded-[4px] p-3 border border-slate-100 shadow-sm flex flex-col justify-between">
              <span className="text-[9px] font-bold text-blue-800 uppercase tracking-wider mb-1 block">Total Enveloppe</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-[#1a2542] tracking-tight tabular-nums">{formatMoney(blocSubtotal)}</span>
                <span className="text-[10px] font-semibold text-slate-400">M FCFA</span>
              </div>
            </div>
            
            <div className="bg-slate-50/70 rounded-[4px] p-3 border border-slate-100 shadow-sm flex flex-col justify-between">
              <span className="text-[9px] font-bold text-blue-800 uppercase tracking-wider mb-1 block">Principal Constituant</span>
              <div>
                <div className="truncate text-[11px] font-semibold text-blue-800 mb-0.5" title={sorted.length > 0 ? sorted[0].def.label : '-'}>
                  {sorted.length > 0 ? sorted[0].def.label : '-'}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-[#1a2542] tabular-nums">{sorted.length > 0 ? sorted[0].pct.toFixed(1) : 0}%</span>
                  <span className="text-[9px] font-semibold text-slate-400">du total</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/70 rounded-[4px] p-3 border border-slate-100 shadow-sm flex flex-col justify-between">
              <span className="text-[9px] font-bold text-blue-800 uppercase tracking-wider mb-1 block">Exigence Prudentielle (Total)</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-[#1a2542] tracking-tight tabular-nums">
                  {formatMoney(totalExigenceMontant)}
                </span>
                <span className="text-[9px] font-semibold text-slate-400">M FCFA (Min. {minTotalReq}%)</span>
              </div>
            </div>
          </div>

          {/* Horizontal Bar Chart (Distribution) */}
          <div className="mb-4">
            <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-6 border-b border-slate-100 pb-2">Analyse de la distribution</h4>
            <div className="flex flex-col relative">
              {/* Background grid lines for Pro look */}
              <div className="absolute left-[35%] right-[20%] top-0 bottom-0 flex justify-between pointer-events-none z-0 px-3">
                 <div className="w-px h-full bg-slate-100 border-r border-slate-200 border-dashed"></div>
                 <div className="w-px h-full bg-slate-100 border-r border-slate-200 border-dashed"></div>
                 <div className="w-px h-full bg-slate-100 border-r border-slate-200 border-dashed"></div>
                 <div className="w-px h-full bg-slate-100 border-r border-slate-200 border-dashed"></div>
              </div>

              {sorted.map((r, idx) => (
                <div
                  key={r.def.code}
                  className="flex items-center gap-4 group relative z-10 hover:bg-indigo-50/40 transition-colors duration-200 cursor-pointer rounded-sm"
                  style={{
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid #f1f5f9',
                    borderTop: idx === 0 ? '1px solid #f1f5f9' : undefined,
                  }}
                >
                  {/* Label (Left aligned, fixed width) */}
                  <div className="w-[35%] shrink-0 flex items-center gap-3 pr-4 border-r border-slate-200/80">
                    {/* Rank Number */}
                    <div className="w-5 h-5 rounded flex items-center justify-center bg-slate-50 text-[10px] font-bold text-slate-400 border border-slate-100 group-hover:bg-indigo-100 group-hover:border-indigo-200 group-hover:text-indigo-700 transition-colors shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 pr-2">
                      <div className="text-[11.5px] font-semibold text-[#1a2542] leading-tight line-clamp-2 group-hover:text-indigo-700 transition-colors" title={r.def.label}>
                        {r.def.label}
                      </div>
                    </div>
                  </div>

                  {/* Bar (Middle) */}
                  <div className="flex-1 h-7 flex items-center py-1 relative">
                    <div 
                      className="h-full rounded-r-[3px] shadow-sm transition-all duration-700 ease-out flex items-center group-hover:brightness-110"
                      style={{ 
                        width: `${(r.value / maxV) * 100}%`, 
                        backgroundColor: r.color,
                        minWidth: '4px'
                      }}
                    />
                    <span 
                      className="absolute text-[10.5px] font-black text-slate-500 tabular-nums ml-2 whitespace-nowrap bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded shadow-sm group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-100 transition-colors"
                      style={{ left: `${(r.value / maxV) * 100}%` }}
                    >
                      {r.pct.toFixed(1)}%
                    </span>
                  </div>

                  {/* Values (Right aligned) */}
                  <div className="w-[20%] shrink-0 flex items-center justify-end pl-2">
                    <div className="text-right">
                      <div className="text-[13px] font-black text-[#1a2542] tabular-nums tracking-tight group-hover:text-indigo-700 transition-colors">
                        {formatMoney(r.value)} <span className="text-[9px] font-bold text-slate-500 uppercase ml-0.5 group-hover:text-indigo-500">M FCFA</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    };

    const renderVBars = () => {
      const sorted = [...rows].sort((a, b) => b.value - a.value);
      const max = Math.max(...sorted.map(r => r.value), 1);
      return (
        <div className="px-6 py-5 fade-in">
          <div className="flex items-end justify-around gap-6 h-44 px-4">
            {sorted.map(r => (
              <div key={r.def.code} className="flex flex-col items-center justify-end h-full flex-1 min-w-0">
                <span className="text-[10px] font-black text-[#1a2542] tabular-nums mb-1.5">{formatMoney(r.value)}</span>
                <div className="w-full max-w-[68px] rounded-t-[4px] transition-all duration-700 shadow-sm" style={{ height: `${Math.max((r.value / max) * 100, 2)}%`, backgroundColor: r.color }} />
              </div>
            ))}
          </div>
          <div className="flex justify-around gap-6 px-4 mt-0 border-t-2 border-slate-100 pt-2">
            {sorted.map(r => (
              <span key={r.def.code} className="flex-1 min-w-0 text-center text-[8.5px] font-bold text-blue-900 leading-tight">{r.def.label}</span>
            ))}
          </div>
          <div className="flex items-baseline justify-between pt-3 mt-3 border-t border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wide text-blue-900">Sous-total</span>
            <span className="text-sm font-black text-indigo-700 tabular-nums">{formatMoney(blocSubtotal)} <span className="text-[9px] font-bold text-blue-800">M FCFA</span></span>
          </div>
        </div>
      );
    };

    const renderDataTable = () => (
      <div className="px-5 py-4 fade-in">
        <table className="w-full">
          <thead>
            <tr className="text-[9.5px] font-bold uppercase tracking-wider text-blue-900 border-b border-slate-200">
              <th className="text-left py-2 pr-2 w-9">#</th>
              <th className="text-left py-2 pr-3">Libellé du poste</th>
              <th className="text-right py-2 pl-3">Montant (M FCFA)</th>
              <th className="text-left py-2 pl-3 w-44">Répartition</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.def.code} className="border-b border-slate-100 last:border-b-0 hover:bg-indigo-50/30 transition-colors">
                <td className="py-2.5 pr-2 text-[9px] font-black text-indigo-700 align-middle">{String(i + 1).padStart(2, '0')}</td>
                <td className="py-2.5 pr-3 align-middle">
                  <span className="text-[11px] font-semibold text-blue-900 leading-snug">{r.def.label}</span>
                </td>
                <td className="py-2.5 pl-3 text-right text-[11.5px] font-bold text-[#1a2542] tabular-nums align-middle">{formatMoney(r.value)}</td>
                <td className="py-2.5 pl-3 align-middle">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${r.pct}%`, backgroundColor: r.color }} />
                    </div>
                    <span className="text-[9px] font-bold text-blue-900 tabular-nums w-9 text-right">{r.pct.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-indigo-50/70 border-t border-indigo-100">
              <td colSpan={2} className="py-2.5 pr-2 text-[10.5px] font-black text-blue-900 uppercase tracking-wide">Sous-total</td>
              <td className="py-2.5 pl-3 text-right text-sm font-black text-indigo-700 tabular-nums">{formatMoney(blocSubtotal)} <span className="text-[9px] font-bold text-blue-800">M FCFA</span></td>
              <td className="py-2.5 pl-3 text-[10px] font-black text-blue-800 tabular-nums">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );

    const renderTable = () => (
      <div className="px-5 py-4 fade-in">
        <table className="w-full">
          <thead>
            <tr className="text-[9.5px] font-bold uppercase tracking-wider text-blue-900 border-b border-slate-200">
              <th className="text-left py-2 pr-2 w-9">#</th>
              <th className="text-left py-2 pr-3">Libellé du poste</th>
              <th className="text-right py-2 pl-3">Montant (M FCFA)</th>
              <th className="text-right py-2 pl-3 hidden sm:table-cell w-16">Part</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isDeduction = r.def.sign === 'deduction';
              return (
                <tr key={r.def.code} className="border-b border-slate-100 last:border-b-0 hover:bg-indigo-50/30 transition-colors">
                  <td className="py-2.5 pr-2 text-[9px] font-black text-indigo-700 align-top">{String(i + 1).padStart(2, '0')}</td>
                  <td className="py-2.5 pr-3 align-top">
                    <span className="text-[11px] font-semibold text-blue-900 leading-snug">{r.def.label}</span>
                    {isDeduction && (
                      <span className="ml-2 text-[8px] font-black uppercase text-rose-700 bg-rose-50 px-1 py-0.5 rounded-[3px] align-middle">Déduction</span>
                    )}
                  </td>
                  <td className={`py-2.5 pl-3 text-right text-[11.5px] font-bold tabular-nums align-top ${isDeduction || r.value < 0 ? 'text-rose-600' : 'text-[#1a2542]'}`}>
                    {isDeduction && r.value > 0 ? '-' : ''}{formatMoney(r.value)}
                  </td>
                  <td className="py-2.5 pl-3 text-right text-[10px] font-bold text-slate-600 tabular-nums align-top hidden sm:table-cell">{r.pct.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-indigo-50/70 border-t border-indigo-100">
              <td colSpan={2} className="py-2.5 pr-2 text-[10.5px] font-black text-blue-900 uppercase tracking-wide">Sous-total</td>
              <td className="py-2.5 pl-3 text-right text-sm font-black text-indigo-700 tabular-nums">{formatMoney(blocSubtotal)} <span className="text-[9px] font-bold text-blue-800">M FCFA</span></td>
              <td className="py-2.5 pl-3 text-right text-[10px] font-black text-blue-800 tabular-nums hidden sm:table-cell">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );

    const renderCards = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-8 py-8 fade-in">
        {rows.map((r, idx) => {
          const isPrimary = idx === 0;
          return (
            <div 
              key={r.def.code} 
              className={`flex flex-col rounded shadow-md p-7 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg min-h-[180px] justify-between ${
                isPrimary 
                  ? 'bg-[#0f172a] text-white border border-slate-800' 
                  : 'bg-white text-slate-900 border border-slate-200'
              }`}
            >
              {/* Decorative Background Elements */}
              {isPrimary ? (
                <svg className="absolute -right-8 -top-8 w-40 h-40 text-white/5" viewBox="0 0 100 100" fill="currentColor">
                  <circle cx="50" cy="50" r="50" />
                </svg>
              ) : (
                <svg className="absolute -right-8 -bottom-8 w-40 h-40 text-slate-100" viewBox="0 0 100 100" fill="currentColor">
                  <rect width="100" height="100" rx="20" transform="rotate(45 50 50)" />
                </svg>
              )}

              {/* Header: Label and Badge */}
              <div className="relative z-10 flex items-start justify-between gap-4 mb-4">
                <span className={`text-xs font-bold tracking-widest uppercase ${isPrimary ? 'text-slate-300' : 'text-slate-500'}`}>
                  {r.def.label}
                </span>
                <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider ${
                  isPrimary ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    {isPrimary ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    )}
                  </svg>
                  {isPrimary ? 'Noyau Dur' : 'Additionnel'}
                </span>
              </div>

              {/* Amount */}
              <div className="relative z-10 flex items-baseline gap-2 mb-8">
                <span className={`text-4xl font-black tabular-nums tracking-tighter ${isPrimary ? 'text-white' : 'text-slate-800'}`}>
                  {formatMoney(r.value)}
                </span>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isPrimary ? 'text-slate-400' : 'text-slate-400'}`}>
                  M FCFA
                </span>
              </div>
              
              {/* Progress & Weight */}
              <div className="relative z-10 mt-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${isPrimary ? 'text-slate-400' : 'text-slate-500'}`}>
                    Poids dans le Tier 1
                  </span>
                  <span className={`text-sm font-black tabular-nums ${isPrimary ? 'text-white' : 'text-slate-800'}`}>
                    {r.pct.toFixed(1)}%
                  </span>
                </div>
                <div className={`w-full h-2 rounded overflow-hidden ${isPrimary ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <div 
                    className={`h-full rounded ${isPrimary ? 'bg-blue-500' : 'bg-slate-800'}`} 
                    style={{ width: `${r.pct}%` }} 
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );

    const body =
      bloc.presentation === 'table' ? renderTable() :
      bloc.presentation === 'cards' ? renderCards() :
      bloc.presentation === 'treemap' ? renderTreemap() :
      bloc.presentation === 'vbars' ? renderVBars() : renderDataTable();

    if (bloc.presentation === 'cards') {
      return (
        <div key={bloc.title} className="fade-in">
          {body}
        </div>
      );
    }

    return (
      <div key={bloc.title} className="bg-white rounded-[4px] border border-slate-200 shadow-sm overflow-hidden fade-in">
        {header}
        {body}

        {totals.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#1a2542] text-white">
            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wide">Total {palier?.title}</span>
            {totals.map(d => (
              <div key={d.code} className="flex items-baseline gap-2">
                <span className="text-lg font-black tabular-nums">{formatMoney(getVal(d.code))}</span>
                <span className="text-[10px] font-bold text-indigo-200 uppercase">M FCFA</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };



  const activeBloc = palier ? palier.blocs[subTabActiveIndex] : null;
  const isLastBloc = palier ? subTabActiveIndex === palier.blocs.length - 1 : false;

  const mainTabOptions = [
    { id: 'synthese', label: 'Synthèse' },
    { id: 'cet1', label: 'Fonds propres durs' },
    { id: 'at1', label: 'Fonds propres additionnels' },
    { id: 't1', label: 'Fonds propres de base' },
    { id: 't2', label: 'Fonds propres complémentaires' },
    { id: 'effectifs', label: 'Fonds propres effectifs' },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* 1. Navigation des Fonds Propres (Fixe au défilement) */}
      <div className="sticky top-[45px] z-10 bg-[#F4F7FA]/95 backdrop-blur-sm py-2">
        <Tabs 
          tabs={mainTabOptions} 
          activeTab={activeTab} 
          onChange={(id) => {
            setActiveTab(id as TabId);
            setSubTabActiveIndex(0);
          }} 
          isSidebarCollapsed={isSidebarCollapsed}
        />
      </div>
      {/* 2. Onglet Synthèse (Affiche uniquement les KPIs et le graphique) */}
      {activeTab === 'synthese' ? (
        <div className="space-y-6 fade-in">
          {/* 1. KPIs Executive Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Fonds Propres Effectifs */}
            <div className="flex flex-col rounded shadow-sm p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md min-h-[115px] justify-between bg-white text-slate-900 border border-slate-200">
              <svg className="absolute -right-8 -top-8 w-28 h-28 text-slate-50" viewBox="0 0 100 100" fill="currentColor">
                <circle cx="50" cy="50" r="50" />
              </svg>
              <div className="relative z-10 flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-blue-800">
                  Fonds Propres Effectifs
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  T1 + T2
                </span>
              </div>
              <div className="relative z-10 flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold tabular-nums tracking-tight text-slate-800">
                  {formatMoney(effectifs)}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  M FCFA
                </span>
              </div>
              <div className="relative z-10 mt-auto border-t border-slate-100 pt-1.5">
                <span className="text-[9px] font-medium text-slate-500">
                  Capital total disponible réglementaire
                </span>
              </div>
            </div>

            {/* KPI 2: APR */}
            <div className="flex flex-col rounded shadow-sm p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md min-h-[115px] justify-between bg-white text-slate-900 border border-slate-200">
              <svg className="absolute -right-6 -bottom-6 w-28 h-28 text-slate-50" viewBox="0 0 100 100" fill="currentColor">
                <rect width="100" height="100" rx="20" transform="rotate(45 50 50)" />
              </svg>
              <div className="relative z-10 flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-blue-800">
                  Actifs Pondérés (APR)
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                  Risques
                </span>
              </div>
              <div className="relative z-10 flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold tabular-nums tracking-tight text-slate-800">
                  {formatMoney(apr)}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  M FCFA
                </span>
              </div>
              <div className="relative z-10 mt-auto border-t border-slate-100 pt-1.5">
                <span className="text-[9px] font-medium text-slate-500">
                  Actifs Pondérés par le Risque
                </span>
              </div>
            </div>

            {/* KPI 3: Surplus */}
            <div className={`flex flex-col rounded shadow-sm p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md min-h-[115px] justify-between border ${totalSurplus >= 0 ? 'bg-white text-slate-900 border-slate-200' : 'bg-rose-50/50 border-rose-200'}`}>
              <svg className={`absolute -right-6 -bottom-6 w-28 h-28 ${totalSurplus >= 0 ? 'text-slate-50' : 'text-rose-100/50'}`} viewBox="0 0 100 100" fill="currentColor">
                <polygon points="50 15, 100 100, 0 100" opacity="0.5" />
              </svg>
              <div className="relative z-10 flex items-start justify-between gap-2 mb-1">
                <span className={`text-[10px] font-bold tracking-wider uppercase ${totalSurplus >= 0 ? 'text-blue-800' : 'text-rose-700'}`}>
                  Surplus de Capital
                </span>
                <span className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${totalSurplus >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-100 text-rose-700'}`}>
                  {totalSurplus >= 0 ? 'Excédent' : 'Déficit'}
                </span>
              </div>
              <div className="relative z-10 flex items-baseline gap-1 mb-2">
                <span className={`text-xl font-bold tabular-nums tracking-tight ${totalSurplus >= 0 ? 'text-slate-800' : 'text-rose-700'}`}>
                  {totalSurplus >= 0 ? '+' : ''}{formatMoney(totalSurplus)}
                </span>
                <span className={`text-[9px] font-semibold uppercase tracking-wider ${totalSurplus >= 0 ? 'text-slate-400' : 'text-rose-600/70'}`}>
                  M FCFA
                </span>
              </div>
              <div className={`relative z-10 mt-auto border-t pt-1.5 ${totalSurplus >= 0 ? 'border-slate-100' : 'border-rose-100'}`}>
                <span className={`text-[9px] font-medium ${totalSurplus >= 0 ? 'text-slate-500' : 'text-rose-600'}`}>
                  Coussin de sécurité global réglementaire
                </span>
              </div>
            </div>

            {/* KPI 4: Couverture */}
            <div className="flex flex-col rounded shadow-sm p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md min-h-[115px] justify-between bg-white text-slate-900 border border-slate-200">
              <svg className="absolute -right-6 -bottom-6 w-28 h-28 text-slate-50" viewBox="0 0 100 100" fill="currentColor">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="20" />
              </svg>
              <div className="relative z-10 flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-blue-800">
                  Couverture Solvabilité
                </span>
                <span className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${solvencyCoverage >= 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-100 text-rose-700'}`}>
                  {solvencyCoverage >= 100 ? 'Conforme' : 'Alerte'}
                </span>
              </div>
              <div className="relative z-10 flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold tabular-nums tracking-tight text-slate-800">
                  {solvencyCoverage.toFixed(1)}%
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  du requis
                </span>
              </div>
              <div className="relative z-10 mt-auto border-t border-slate-100 pt-1.5">
                <span className="text-[9px] font-medium text-slate-500">
                  Ratio capital disponible / exigence minimale
                </span>
              </div>
            </div>

          </div>

          {/* 2. Répartition & Qualité des Fonds Propres (Redesigned) */}
          <div className="flex flex-col md:flex-row items-center gap-8 bg-white rounded-[4px] border border-slate-200/80 shadow-sm p-6">
            {/* Left: Vertical Bar Chart with Axes & Animations */}
            <div className="relative flex w-52 h-44 shrink-0 pr-4 pb-6 pl-8 pt-6">
              {/* Y-axis */}
              <div className="absolute left-0 top-6 bottom-6 w-7 flex flex-col justify-between items-end pr-2 text-[9px] font-bold text-slate-400">
                <span>100%</span>
                <span>50%</span>
                <span>0%</span>
              </div>
              
              {/* Chart area */}
              <div className="relative flex items-end justify-between px-3 w-full h-full border-l-2 border-b-2 border-slate-200">
                {/* Horizontal grid lines */}
                <div className="absolute left-0 right-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none z-0">
                  <div className="w-full border-t border-slate-200 border-dashed h-0" />
                  <div className="w-full border-t border-slate-200 border-dashed h-0" />
                  <div className="w-full border-t border-transparent h-0" />
                </div>

                {/* Bars */}
                <div className="relative flex flex-col items-center justify-end w-8 h-full group z-10 cursor-pointer">
                  <span className="text-[10px] font-bold text-slate-700 mb-1.5 whitespace-nowrap transition-transform duration-300 group-hover:-translate-y-1">{share(cet1).toFixed(1)}%</span>
                  <div className="w-full bg-[#1a2542] rounded-t-[4px] shadow-sm transition-all duration-300 ease-out group-hover:brightness-125 group-hover:-translate-y-1" style={{ height: `${Math.max(share(cet1), 1)}%` }} />
                  <span className="text-[9px] font-bold text-slate-500 absolute -bottom-5 uppercase group-hover:text-[#1a2542] transition-colors duration-300">CET1</span>
                </div>
                
                <div className="relative flex flex-col items-center justify-end w-8 h-full group z-10 cursor-pointer">
                  <span className="text-[10px] font-bold text-slate-700 mb-1.5 whitespace-nowrap transition-transform duration-300 group-hover:-translate-y-1">{share(at1).toFixed(1)}%</span>
                  <div className="w-full bg-[#6366f1] rounded-t-[4px] shadow-sm transition-all duration-300 ease-out group-hover:brightness-110 group-hover:-translate-y-1" style={{ height: `${Math.max(share(at1), 1)}%` }} />
                  <span className="text-[9px] font-bold text-slate-500 absolute -bottom-5 uppercase group-hover:text-[#6366f1] transition-colors duration-300">AT1</span>
                </div>

                <div className="relative flex flex-col items-center justify-end w-8 h-full group z-10 cursor-pointer">
                  <span className="text-[10px] font-bold text-slate-700 mb-1.5 whitespace-nowrap transition-transform duration-300 group-hover:-translate-y-1">{share(t2).toFixed(1)}%</span>
                  <div className="w-full bg-[#93c5fd] rounded-t-[4px] shadow-sm transition-all duration-300 ease-out group-hover:brightness-95 group-hover:-translate-y-1" style={{ height: `${Math.max(share(t2), 1)}%` }} />
                  <span className="text-[9px] font-bold text-slate-500 absolute -bottom-5 uppercase group-hover:text-[#93c5fd] transition-colors duration-300">T2</span>
                </div>
              </div>
            </div>

            {/* Right: Legend & Details */}
            <div className="flex-1 w-full">
              <div className="mb-5">
                <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider">Structure et Qualité du Capital</h3>
                <p className="text-[10px] text-[#1a2542] mt-0.5 font-semibold">Part relative de chaque catégorie de fonds propres dans l'enveloppe globale</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col p-3.5 rounded-[4px] bg-slate-50 border border-slate-100/80">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1a2542]"></span>
                    <span className="text-[10.5px] font-bold text-[#1a2542]">Fonds propres CET1</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-[#1a2542]">{formatMoney(cet1)}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">M FCFA</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 mt-1">{share(cet1).toFixed(1)}% de la base</span>
                </div>

                <div className="flex flex-col p-3.5 rounded-[4px] bg-slate-50 border border-slate-100/80">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]"></span>
                    <span className="text-[10.5px] font-bold text-[#1a2542]">Fonds propres AT1</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-[#1a2542]">{formatMoney(at1)}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">M FCFA</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 mt-1">{share(at1).toFixed(1)}% de la base</span>
                </div>

                <div className="flex flex-col p-3.5 rounded-[4px] bg-slate-50 border border-slate-100/80">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#93c5fd]"></span>
                    <span className="text-[10.5px] font-bold text-[#1a2542]">Fonds propres T2</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-[#1a2542]">{formatMoney(t2)}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">M FCFA</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 mt-1">{share(t2).toFixed(1)}% de la base</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Ratios Réglementaires & Solvabilité */}
          <div className="bg-white rounded-[4px] border border-slate-200/80 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider">Ratios de Solvabilité Réglementaires</h3>
              </div>
              <span className="px-2 py-0.5 rounded-[4px] text-[9px] font-bold bg-indigo-50 text-indigo-700 uppercase tracking-wide">Minima Réglementaires</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Ratio CET1 */}
              <div className="flex flex-col border border-[#1a2542]/30 rounded-[4px] p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-800">Ratio fonds propres CET1</span>
                  <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-[3px] ${solva.ratios.cet1.toNumber() >= minCet1Req ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {solva.ratios.cet1.toNumber() >= minCet1Req ? 'Conforme' : 'Déficit'}
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-[#1a2542] mb-4 h-6">Fonds propres de qualité supérieure (capital social, réserves).</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-black text-[#1a2542] tabular-nums">{solva.ratios.cet1.toNumber().toFixed(2)}%</span>
                  <span className="text-[10.5px] font-medium text-slate-600">Min. requis : {minCet1Req.toFixed(2)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full ${solva.ratios.cet1.toNumber() >= minCet1Req ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min((solva.ratios.cet1.toNumber() / minCet1Req) * 100, 100)}%` }} />
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-bold mt-1">
                  <span className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[8px] ${solva.ratios.cet1.toNumber() >= (minCet1Req + 2.5) ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {solva.ratios.cet1.toNumber() >= (minCet1Req + 2.5) ? '✓' : '✗'}
                  </span>
                  <span className="text-slate-600">Coussin de conservation : 2.50%</span>
                </span>
              </div>

              {/* Ratio Tier 1 */}
              <div className="flex flex-col border border-[#1a2542]/30 rounded-[4px] p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-800">Ratio fonds propres Tier 1</span>
                  <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-[3px] ${solva.ratios.t1.toNumber() >= minT1Req ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {solva.ratios.t1.toNumber() >= minT1Req ? 'Conforme' : 'Déficit'}
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-[#1a2542] mb-4 h-6">Fonds propres de base (CET1 + capital additionnel AT1).</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-black text-[#1a2542] tabular-nums">{solva.ratios.t1.toNumber().toFixed(2)}%</span>
                  <span className="text-[10.5px] font-medium text-slate-600">Min. requis : {minT1Req.toFixed(2)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full ${solva.ratios.t1.toNumber() >= minT1Req ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min((solva.ratios.t1.toNumber() / minT1Req) * 100, 100)}%` }} />
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-bold mt-1">
                  <span className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[8px] ${solva.ratios.t1.toNumber() >= (minT1Req + 2.5) ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {solva.ratios.t1.toNumber() >= (minT1Req + 2.5) ? '✓' : '✗'}
                  </span>
                  <span className="text-slate-600">Coussin de conservation : 2.50%</span>
                </span>
              </div>

              {/* Ratio de Solvabilité Total */}
              <div className="flex flex-col border border-[#1a2542]/30 rounded-[4px] p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-800">Ratio solvabilité total</span>
                  <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-[3px] ${solva.ratios.total.toNumber() >= minTotalReq ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {solva.ratios.total.toNumber() >= minTotalReq ? 'Conforme' : 'Déficit'}
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-[#1a2542] mb-4 h-6">Ratio de couverture global (Tier 1 + Tier 2).</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-black text-[#1a2542] tabular-nums">{solva.ratios.total.toNumber().toFixed(2)}%</span>
                  <span className="text-[10.5px] font-medium text-slate-600">Min. requis : {minTotalReq.toFixed(2)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full ${solva.ratios.total.toNumber() >= minTotalReq ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min((solva.ratios.total.toNumber() / minTotalReq) * 100, 100)}%` }} />
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-bold mt-1">
                  <span className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[8px] ${solva.ratios.total.toNumber() >= (minTotalReq + 2.5) ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {solva.ratios.total.toNumber() >= (minTotalReq + 2.5) ? '✓' : '✗'}
                  </span>
                  <span className="text-slate-600">Coussin de conservation : 2.50%</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // 3. Onglets de données individuelles (CET1, AT1, etc.) sans surcharge visuelle
        <div className="space-y-6 fade-in">
          {/* Sous-navigation des Blocs divisés pour éviter les scrolls infinis */}
          {palier && palier.blocs.length > 1 && (
            <div className="sticky top-[105px] z-10 bg-[#F4F7FA]/95 backdrop-blur-sm py-2 -mx-2 px-2">
              <Tabs
                tabs={palier.blocs.map((bloc, index) => ({
                  id: index.toString(),
                  label: bloc.title
                }))}
                activeTab={subTabActiveIndex.toString()}
                onChange={(id) => setSubTabActiveIndex(parseInt(id))}
                isSidebarCollapsed={isSidebarCollapsed}
                variant="deepblue"
              />
            </div>
          )}

          {/* Affichage du bloc de données sélectionné */}
          <div className="space-y-5">
            {activeBloc && renderBloc(activeBloc, isLastBloc)}
          </div>
        </div>
      )}
    </div>
  );
};