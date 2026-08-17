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

  const minCet1Req = solva.normes.find(n => n.code === 'SOLVA_CET1')?.requis.toNumber() || 5.0;
  const minT1Req = solva.normes.find(n => n.code === 'SOLVA_T1')?.requis.toNumber() || 6.0;
  const minTotalReq = solva.normes.find(n => n.code === 'SOLVA_TOTAL')?.requis.toNumber() || 8.0;


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

    const body = (
      <div className="px-5 py-4 fade-in">
        <table className="w-full">
          <thead>
            <tr className="text-[9.5px] font-bold uppercase tracking-wider text-blue-900 border-b border-slate-200">
              <th className="text-left py-2 pr-2 w-9">#</th>
              <th className="text-left py-2 pr-3">Libellé du poste</th>
              <th className="text-right py-2 pl-3">Montant (M FCFA)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.def.code} className="border-b border-slate-100 last:border-b-0 hover:bg-indigo-50/30 transition-colors">
                <td className="py-2.5 pr-2 text-[9px] font-black text-indigo-700 align-middle">
                  {String(idx + 1).padStart(2, '0')}
                </td>
                <td className="py-2.5 pr-3 align-middle">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11.5px] font-semibold text-blue-900 leading-snug">{row.def.label}</span>
                    <span className="font-mono text-[9px] font-bold text-indigo-400 bg-indigo-50/60 rounded-sm px-1.5 py-[2px] leading-none shrink-0 tracking-tight self-start">{row.def.code}</span>
                  </div>
                </td>
                <td className="py-2.5 pl-3 text-right text-[11.5px] font-bold text-[#1a2542] tabular-nums align-middle">
                  {formatMoney(row.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

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
      {/* 1. Navigation des Fonds Propres (Fixe au défilement - 100% Opaque) */}
      <div className="sticky top-12 z-20 bg-[#F4F7FA] py-3 -mt-3 pb-3 border-b border-slate-200/40 shadow-xs">
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
      {/* 2. Onglet Synthèse */}
      {activeTab === 'synthese' ? (
        <div className="space-y-6 fade-in">
          {/* Tableau de Synthèse (Type EP01) */}
          <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm overflow-hidden fade-in">
            <div className="flex items-center justify-between gap-4 px-5 py-3.5 bg-[#1a2542]">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 rounded-full bg-indigo-500" />
                <h4 className="text-[13px] font-bold text-white tracking-wide">État EP01 - Synthèse des Fonds Propres</h4>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-2.5 pl-6 pr-4 text-[10px] font-extrabold text-blue-900 uppercase tracking-wider w-[15%]">Code</th>
                    <th className="py-2.5 px-4 text-[10px] font-extrabold text-blue-900 uppercase tracking-wider w-[55%]">Rubrique</th>
                    <th className="py-2.5 px-6 text-[10px] font-extrabold text-blue-900 uppercase tracking-wider text-right w-[30%]">Montant (M FCFA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pl-6 pr-4 text-[11px] font-bold text-slate-500">FPI22</td>
                    <td className="py-3 px-4 text-[11.5px] font-semibold text-[#1a2542]">Fonds propres de base durs (CET1)</td>
                    <td className="py-3 px-6 text-right text-[12px] font-bold text-[#1a2542] tabular-nums">{formatMoney(cet1)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pl-6 pr-4 text-[11px] font-bold text-slate-500">FPI28</td>
                    <td className="py-3 px-4 text-[11.5px] font-semibold text-[#1a2542]">Fonds propres additionnels (AT1)</td>
                    <td className="py-3 px-6 text-right text-[12px] font-bold text-[#1a2542] tabular-nums">{formatMoney(at1)}</td>
                  </tr>
                  <tr className="bg-indigo-50/30 border-t border-indigo-100 hover:bg-indigo-50/50 transition-colors">
                    <td className="py-3 pl-6 pr-4 text-[11px] font-bold text-indigo-400">FPI29</td>
                    <td className="py-3 px-4 text-[11.5px] font-bold text-indigo-900">Fonds propres de base (Tier 1)</td>
                    <td className="py-3 px-6 text-right text-[12.5px] font-black text-indigo-700 tabular-nums">{formatMoney(cet1 + at1)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pl-6 pr-4 text-[11px] font-bold text-slate-500">FPI40</td>
                    <td className="py-3 px-4 text-[11.5px] font-semibold text-[#1a2542]">Fonds propres complémentaires (Tier 2)</td>
                    <td className="py-3 px-6 text-right text-[12px] font-bold text-[#1a2542] tabular-nums">{formatMoney(t2)}</td>
                  </tr>
                  <tr className="bg-emerald-50/30 border-t-2 border-emerald-100 hover:bg-emerald-50/50 transition-colors">
                    <td className="py-3.5 pl-6 pr-4 text-[11px] font-bold text-emerald-500">FPI41</td>
                    <td className="py-3.5 px-4 text-[12px] font-bold text-emerald-900">Fonds propres effectifs</td>
                    <td className="py-3.5 px-6 text-right text-[14px] font-black text-emerald-700 tabular-nums">{formatMoney(effectifs)}</td>
                  </tr>
                </tbody>
              </table>
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
            <div className="sticky top-[108px] z-10 bg-[#F4F7FA] py-2 -mx-2 px-2 border-b border-slate-200/40 shadow-xs">
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

