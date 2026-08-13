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
        title: '1. Constituants du capital',
        accent: 'emerald',
        codes: ['FPI01', 'FPI02', 'FPI03', 'FPI04', 'FPI05', 'FPI06', 'FPI07'],
      },
      {
        title: '2. Ajustements et déductions',
        accent: 'rose',
        codes: [
          'FPI09', 'FPI10', 'IM12', 'ID09', 'PA14', 'PA32',
          'FPI11', 'PA07', 'IM06', 'IM10', 'PR04', 'FPI12', 'FPI13', 'FPI20', 'FPI21',
        ],
      },
      {
        title: '3. Seuils de participations',
        accent: 'indigo',
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
        title: '1. Instruments AT1 émis',
        accent: 'emerald',
        codes: ['FPI23', 'FPI24', 'FPI25', 'FPI26'],
      },
      {
        title: '2. Déductions réglementaires',
        accent: 'rose',
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
        title: '1. Instruments T2 admissibles',
        accent: 'emerald',
        codes: ['FPI30', 'FPI31', 'FPI32', 'FPI33', 'FPI34', 'FPI35', 'FPI36', 'FPI37', 'FPI38'],
      },
      {
        title: '2. Déductions réglementaires',
        accent: 'rose',
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
        codes: ['FPI29', 'FPI40'],
      },
    ],
  },
};

const ACCENTS: Record<Bloc['accent'], { bar: string; chip: string }> = {
  emerald: { bar: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700' },
  indigo: { bar: 'bg-indigo-500', chip: 'bg-indigo-50 text-indigo-700' },
  rose: { bar: 'bg-rose-400', chip: 'bg-rose-50 text-rose-700' },
  navy: { bar: 'bg-[#1a2542]', chip: 'bg-[#1a2542] text-white' },
};

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
  const t1 = getVal('FPI29');
  const t2 = getVal('FPI40');
  const effectifs = getVal('FPI41');

  const total = cet1 + at1 + t2;
  const share = (val: number) => (total > 0 ? (val / total) * 100 : 0);

  const apr = solva.apr.toNumber();
  const minCet1Req = solva.normes.find(n => n.code === 'SOLVA_CET1')?.requis.toNumber() || 5.0;
  const minT1Req = solva.normes.find(n => n.code === 'SOLVA_T1')?.requis.toNumber() || 6.0;
  const minTotalReq = solva.normes.find(n => n.code === 'SOLVA_TOTAL')?.requis.toNumber() || 8.0;

  const cet1ExigenceMontant = (apr * minCet1Req) / 100;
  const t1ExigenceMontant = (apr * minT1Req) / 100;
  const totalExigenceMontant = (apr * minTotalReq) / 100;

  const cet1Surplus = cet1 - cet1ExigenceMontant;
  const t1Surplus = t1 - t1ExigenceMontant;
  const totalSurplus = effectifs - totalExigenceMontant;

  const solvencyCoverage = totalExigenceMontant > 0 ? (effectifs / totalExigenceMontant) * 100 : 0;


  const renderRow = (code: string, isGroupTotal: boolean) => {
    const def = fondsPropresCodes.find(c => c.code === code);
    if (!def) return null;
    const value = getVal(code);
    const isTotal = (palier && palier.totalCodes.includes(code)) || isGroupTotal;
    const isDeduction = def.sign === 'deduction';

    return (
      <div key={code} className={`flex items-center justify-between px-5 py-2.5 border-b border-slate-50 last:border-b-0 ${isTotal ? 'bg-indigo-50/60' : 'hover:bg-slate-50/40'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <span className={`text-[13px] truncate ${isTotal ? 'font-semibold text-blue-800' : isDeduction ? 'text-rose-600' : 'text-slate-700'}`}>
            {def.label}
          </span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {def.paragraphes && (
            <span className="text-[10px] text-slate-400 hidden md:inline">{def.paragraphes.join(', ')}</span>
          )}
          <span className={`text-sm font-semibold tabular-nums w-32 text-right ${isTotal ? 'text-indigo-700' : isDeduction ? 'text-rose-600' : value < 0 ? 'text-rose-600' : 'text-blue-800'}`}>
            {isDeduction && value > 0 ? '-' : ''}{formatMoney(value)}
          </span>
        </div>
      </div>
    );
  };

  const renderBloc = (bloc: Bloc, isLast: boolean) => {
    const accent = ACCENTS[bloc.accent];

    return (
      <div key={bloc.title} className="bg-white rounded-[4px] border border-slate-200 shadow-sm overflow-hidden fade-in">
        <div className={`flex items-center gap-2.5 px-5 py-3 border-l-4 ${accent.bar} bg-slate-50/60`}>
          <span className={`text-[11px] font-bold uppercase tracking-wide ${accent.chip} px-2 py-0.5 rounded`}>
            {bloc.title.split('.')[0]}
          </span>
          <h4 className="text-sm font-bold text-blue-800">{bloc.title.replace(/^\d+\.\s*/, '')}</h4>
        </div>
        <div>
          {bloc.codes.map((code) => renderRow(code, false))}
        </div>
        {isLast && palier && palier.totalCodes.map((code) => renderRow(code, true))}
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
            <div className="bg-white rounded-[4px] border border-slate-200/80 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-2 border-b border-slate-50 pb-1.5">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-blue-800">Fonds Propres Effectifs</span>
              </div>
              <div className="flex items-baseline space-x-1 mt-2">
                <span className="text-2xl font-black text-[#1a2542] tracking-tight tabular-nums">{formatMoney(effectifs)}</span>
                <span className="text-[10.5px] font-semibold text-slate-600">M FCFA</span>
              </div>
              <span className="text-[10.5px] text-slate-600 mt-2 block border-t border-slate-100 pt-1.5">Capital total disponible (T1 + T2)</span>
            </div>

            <div className="bg-white rounded-[4px] border border-slate-200/80 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-2 border-b border-slate-50 pb-1.5">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-blue-800">Actifs Pondérés (APR)</span>
              </div>
              <div className="flex items-baseline space-x-1 mt-2">
                <span className="text-2xl font-black text-[#1a2542] tracking-tight tabular-nums">{formatMoney(apr)}</span>
                <span className="text-[10.5px] font-semibold text-slate-600">M FCFA</span>
              </div>
              <span className="text-[10.5px] text-slate-600 mt-2 block border-t border-slate-100 pt-1.5">Actifs pondérés par les risques</span>
            </div>

            <div className={`rounded-[4px] border shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow duration-200 ${totalSurplus >= 0 ? 'bg-white border-slate-200/80' : 'bg-rose-50/50 border-rose-100'}`}>
              <div className="flex items-center justify-between mb-2 border-b border-slate-50 pb-1.5">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-blue-800">Surplus de Capital</span>
              </div>
              <div className="flex items-baseline space-x-1 mt-2">
                <span className={`text-2xl font-black tracking-tight tabular-nums ${totalSurplus >= 0 ? 'text-[#1a2542]' : 'text-rose-700'}`}>
                  {totalSurplus >= 0 ? '+' : ''}{formatMoney(totalSurplus)}
                </span>
                <span className="text-[10.5px] font-semibold text-slate-600">M FCFA</span>
              </div>
              <span className="text-[10.5px] text-slate-600 mt-2 block border-t border-slate-100 pt-1.5">Coussin de sécurité global réglementaire</span>
            </div>

            <div className="bg-white rounded-[4px] border border-slate-200/80 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-2 border-b border-slate-50 pb-1.5">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-blue-800">Couverture de Solvabilité</span>
              </div>
              <div className="flex items-baseline space-x-1 mt-2">
                <span className="text-2xl font-black text-[#1a2542] tracking-tight tabular-nums">{solvencyCoverage.toFixed(1)}%</span>
                <span className="text-[10.5px] font-semibold text-slate-600">du requis</span>
              </div>
              <span className="text-[10.5px] text-slate-600 mt-2 block border-t border-slate-100 pt-1.5">Ratio capital disponible / exigence minimale</span>
            </div>
          </div>

          {/* 2. Ratios Réglementaires & Solvabilité */}
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
                    {solva.ratios.cet1.toNumber() >= minCet1Req ? 'Conforme' : 'Infraction'}
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-slate-600 mb-4 h-6">Fonds propres de qualité supérieure (capital social, réserves).</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-black text-[#1a2542] tabular-nums">{solva.ratios.cet1.toNumber().toFixed(2)}%</span>
                  <span className="text-[10.5px] font-medium text-slate-600">Min. requis : {minCet1Req.toFixed(2)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full ${solva.ratios.cet1.toNumber() >= minCet1Req ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min((solva.ratios.cet1.toNumber() / minCet1Req) * 100, 100)}%` }} />
                </div>
                <span className={`text-[10px] font-bold mt-1 ${cet1Surplus >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  Coussin : {cet1Surplus >= 0 ? '+' : ''}{formatMoney(cet1Surplus)} M FCFA
                </span>
              </div>

              {/* Ratio Tier 1 */}
              <div className="flex flex-col border border-[#1a2542]/30 rounded-[4px] p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-800">Ratio fonds propres Tier 1</span>
                  <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-[3px] ${solva.ratios.t1.toNumber() >= minT1Req ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {solva.ratios.t1.toNumber() >= minT1Req ? 'Conforme' : 'Infraction'}
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-slate-600 mb-4 h-6">Fonds propres de base (CET1 + capital additionnel AT1).</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-black text-[#1a2542] tabular-nums">{solva.ratios.t1.toNumber().toFixed(2)}%</span>
                  <span className="text-[10.5px] font-medium text-slate-600">Min. requis : {minT1Req.toFixed(2)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full ${solva.ratios.t1.toNumber() >= minT1Req ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min((solva.ratios.t1.toNumber() / minT1Req) * 100, 100)}%` }} />
                </div>
                <span className={`text-[10px] font-bold mt-1 ${t1Surplus >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  Coussin : {t1Surplus >= 0 ? '+' : ''}{formatMoney(t1Surplus)} M FCFA
                </span>
              </div>

              {/* Ratio de Solvabilité Total */}
              <div className="flex flex-col border border-[#1a2542]/30 rounded-[4px] p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-800">Ratio solvabilité total</span>
                  <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-[3px] ${solva.ratios.total.toNumber() >= minTotalReq ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {solva.ratios.total.toNumber() >= minTotalReq ? 'Conforme' : 'Infraction'}
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-slate-600 mb-4 h-6">Ratio de couverture global (Tier 1 + Tier 2).</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-black text-[#1a2542] tabular-nums">{solva.ratios.total.toNumber().toFixed(2)}%</span>
                  <span className="text-[10.5px] font-medium text-slate-600">Min. requis : {minTotalReq.toFixed(2)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full ${solva.ratios.total.toNumber() >= minTotalReq ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min((solva.ratios.total.toNumber() / minTotalReq) * 100, 100)}%` }} />
                </div>
                <span className={`text-[10px] font-bold mt-1 ${totalSurplus >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  Coussin : {totalSurplus >= 0 ? '+' : ''}{formatMoney(totalSurplus)} M FCFA
                </span>
              </div>
            </div>
          </div>

          {/* 3. Répartition & Qualité des Fonds Propres */}
          <div className="bg-white rounded-[4px] border border-slate-200/80 shadow-sm p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
              <div>
                <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider">Qualité & Répartition du Capital</h3>
                <p className="text-[10.5px] text-slate-600 mt-0.5">Part relative de chaque catégorie de fonds propres dans l'enveloppe globale</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1a2542]"></span> CET1 · {share(cet1).toFixed(1)}%
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]"></span> AT1 · {share(at1).toFixed(1)}%
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#93c5fd]"></span> T2 · {share(t2).toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-[#1a2542]" style={{ width: `${share(cet1)}%` }} title={`CET1: ${share(cet1).toFixed(1)}%`} />
              <div className="h-full bg-[#6366f1]" style={{ width: `${share(at1)}%` }} title={`AT1: ${share(at1).toFixed(1)}%`} />
              <div className="h-full bg-[#93c5fd]" style={{ width: `${share(t2)}%` }} title={`T2: ${share(t2).toFixed(1)}%`} />
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 border-t border-slate-50 pt-4 text-center">
              <div className="border-r border-slate-100 last:border-0">
                <span className="text-[10.5px] font-medium text-slate-600 block mb-0.5">Fonds Propres CET1</span>
                <span className="text-sm font-bold text-blue-800">{formatMoney(cet1)} M FCFA</span>
              </div>
              <div className="border-r border-slate-100 last:border-0">
                <span className="text-[10.5px] font-medium text-slate-600 block mb-0.5">Fonds Propres AT1</span>
                <span className="text-sm font-bold text-blue-800">{formatMoney(at1)} M FCFA</span>
              </div>
              <div>
                <span className="text-[10.5px] font-medium text-slate-600 block mb-0.5">Fonds Propres T2</span>
                <span className="text-sm font-bold text-blue-800">{formatMoney(t2)} M FCFA</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // 3. Onglets de données individuelles (CET1, AT1, etc.) sans surcharge visuelle
        <div className="space-y-6 fade-in">
          {/* Sous-navigation des Blocs divisés pour éviter les scrolls infinis */}
          {palier && palier.blocs.length > 1 && (
            <Tabs
              tabs={palier.blocs.map((bloc, index) => ({
                id: index.toString(),
                label: bloc.title
              }))}
              activeTab={subTabActiveIndex.toString()}
              onChange={(id) => setSubTabActiveIndex(parseInt(id))}
              isSidebarCollapsed={isSidebarCollapsed}
            />
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