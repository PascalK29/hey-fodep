import React, { useState } from 'react';
import type { SolvabiliteAnalyse } from '@heyfodep/kernel';
import { CATEGORIES_EXPOSITIONS } from '@heyfodep/kernel';
import { Tabs, type TabOption } from '../components/Tabs';

interface RisqueCreditViewProps {
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

const BAR_COLORS = ['#1a2542', '#2a375a', '#3b49df', '#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

type TabId = 'synthese' | 'repartition' | 'bilan' | 'hors-bilan' | 'attenuation';

export const RisqueCreditView: React.FC<RisqueCreditViewProps> = ({ solva, isSidebarCollapsed }) => {
  const [activeTab, setActiveTab] = useState<TabId>('synthese');
  const { valeurs } = solva;

  const getVal = (code: string) => {
    return valeurs.get(code)?.toNumber() || 0;
  };

  const totalAprCredit = getVal("RC_TOTAL_APR");
  
  // Calculs globaux du portefeuille
  const totalBilanBrut = CATEGORIES_EXPOSITIONS.reduce((acc, cat) => acc + getVal(`EP09_${cat.id}_BRUT`), 0);
  const totalHorsBilanBrut = CATEGORIES_EXPOSITIONS.reduce((acc, cat) => acc + getVal(`EP10_${cat.id}_BRUT_AVANT`), 0);
  const totalProvisionsBilan = CATEGORIES_EXPOSITIONS.reduce((acc, cat) => acc + getVal(`EP09_${cat.id}_PROV`) + getVal(`EP09_${cat.id}_DED`), 0);
  const totalProvisionsHorsBilan = CATEGORIES_EXPOSITIONS.reduce((acc, cat) => acc + getVal(`EP10_${cat.id}_PROV`), 0);
  const totalProvisions = totalProvisionsBilan + totalProvisionsHorsBilan;
  
  const totalExpositionNetteBilan = CATEGORIES_EXPOSITIONS.reduce((acc, cat) => acc + getVal(`EP09_${cat.id}_NET`), 0);
  const totalExpositionNetteHorsBilan = CATEGORIES_EXPOSITIONS.reduce((acc, cat) => acc + getVal(`EP10_${cat.id}_NET`), 0);
  const totalExpositionNetteGlobale = totalExpositionNetteBilan + totalExpositionNetteHorsBilan;

  const densityRate = totalExpositionNetteGlobale > 0 ? (totalAprCredit / totalExpositionNetteGlobale) * 100 : 0;
  const totalBrutGlobal = totalBilanBrut + totalHorsBilanBrut;

  // Calculs par catégorie pour le graphique de distribution
  const categoryRows = CATEGORIES_EXPOSITIONS.map((cat, idx) => {
    const netBilan = getVal(`EP09_${cat.id}_NET`);
    const netHorsBilan = getVal(`EP10_${cat.id}_NET`);
    const netTotal = netBilan + netHorsBilan;
    const apr = getVal(`EP12_20_${cat.id}_APR`);
    const brut = getVal(`EP09_${cat.id}_BRUT`) + getVal(`EP10_${cat.id}_BRUT_AVANT`);
    const pctNet = totalExpositionNetteGlobale > 0 ? (netTotal / totalExpositionNetteGlobale) * 100 : 0;
    return {
      cat,
      idx,
      brut,
      netTotal,
      pctNet,
      apr,
      color: BAR_COLORS[idx % BAR_COLORS.length]
    };
  });

  const sortedCategories = [...categoryRows].sort((a, b) => b.netTotal - a.netTotal);
  const maxNetValue = Math.max(...sortedCategories.map(c => c.netTotal), 1);
  const tabOptions: TabOption[] = [
    { id: 'synthese', label: 'Synthèse du risque' },
    { id: 'repartition', label: 'Répartition par catégorie' },
    { id: 'bilan', label: 'Expositions Bilan' },
    { id: 'hors-bilan', label: 'Hors Bilan' },
    { id: 'attenuation', label: 'Atténuation & APR' },
  ];

  return (
    <div className="space-y-6 max-w-full mx-auto fade-in">
      
      {/* 1. Navigation Interne Collante au défilement */}
      <div className="sticky top-[45px] z-10 bg-[#F4F7FA]/95 backdrop-blur-sm py-2">
        <Tabs tabs={tabOptions} activeTab={activeTab} onChange={(id) => setActiveTab(id as TabId)} isSidebarCollapsed={isSidebarCollapsed} />
      </div>

      {/* 2. Contenu de la vue selon l'onglet actif */}
      
      {/* --- ONGLET SYNTHÈSE DU RISQUE DE CRÉDIT --- */}
      {activeTab === 'synthese' && (
        <div className="space-y-6 fade-in">
          
          {/* 4 KPIs Exécutifs Risque de Crédit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Total Exposition Bilan */}
            <div className="flex flex-col rounded shadow-sm p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md min-h-[115px] justify-between bg-white text-slate-900 border border-slate-200">
              <svg className="absolute -right-8 -top-8 w-28 h-28 text-slate-50" viewBox="0 0 100 100" fill="currentColor">
                <circle cx="50" cy="50" r="50" />
              </svg>
              <div className="relative z-10 flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-blue-800">
                  Total Exposition Bilan
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                  Bilan
                </span>
              </div>
              <div className="relative z-10 flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold tabular-nums tracking-tight text-slate-800">
                  {formatMoney(totalBilanBrut)}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  M FCFA
                </span>
              </div>
              <div className="relative z-10 mt-auto border-t border-slate-100 pt-1.5 flex justify-between items-center">
                <span className="text-[9px] font-medium text-slate-500">
                  Expo nette : {formatMoney(totalExpositionNetteBilan)} M
                </span>
                <span className="text-[9px] font-bold text-indigo-600">
                  {totalBrutGlobal > 0 ? ((totalBilanBrut / totalBrutGlobal) * 100).toFixed(0) : 0}% du total
                </span>
              </div>
            </div>

            {/* KPI 2: Total Hors Bilan */}
            <div className="flex flex-col rounded shadow-sm p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md min-h-[115px] justify-between bg-white text-slate-900 border border-slate-200">
              <svg className="absolute -right-6 -bottom-6 w-28 h-28 text-slate-50" viewBox="0 0 100 100" fill="currentColor">
                <rect width="100" height="100" rx="20" transform="rotate(45 50 50)" />
              </svg>
              <div className="relative z-10 flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-blue-800">
                  Total Hors Bilan
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700">
                  Hors-Bilan
                </span>
              </div>
              <div className="relative z-10 flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold tabular-nums tracking-tight text-slate-800">
                  {formatMoney(totalHorsBilanBrut)}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  M FCFA
                </span>
              </div>
              <div className="relative z-10 mt-auto border-t border-slate-100 pt-1.5 flex justify-between items-center">
                <span className="text-[9px] font-medium text-slate-500">
                  Expo nette : {formatMoney(totalExpositionNetteHorsBilan)} M
                </span>
                <span className="text-[9px] font-bold text-blue-600">
                  {totalBrutGlobal > 0 ? ((totalHorsBilanBrut / totalBrutGlobal) * 100).toFixed(0) : 0}% du total
                </span>
              </div>
            </div>

            {/* KPI 3: Provisions & Déductions */}
            <div className="flex flex-col rounded shadow-sm p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md min-h-[115px] justify-between bg-white text-slate-900 border border-slate-200">
              <svg className="absolute -right-6 -bottom-6 w-28 h-28 text-slate-50" viewBox="0 0 100 100" fill="currentColor">
                <polygon points="50 15, 100 100, 0 100" opacity="0.5" />
              </svg>
              <div className="relative z-10 flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-blue-800">
                  Total Provisions & Déductions
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700">
                  Couverture
                </span>
              </div>
              <div className="relative z-10 flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold tabular-nums tracking-tight text-rose-600">
                  {formatMoney(totalProvisions)}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-rose-400">
                  M FCFA
                </span>
              </div>
              <div className="relative z-10 mt-auto border-t border-slate-100 pt-1.5 flex justify-between items-center">
                <span className="text-[9px] font-medium text-slate-500">
                  Taux de dépréciation global
                </span>
                <span className="text-[9px] font-bold text-rose-600">
                  {totalBrutGlobal > 0 ? ((totalProvisions / totalBrutGlobal) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>

            {/* KPI 4: Total APR Crédit */}
            <div className="flex flex-col rounded shadow-sm p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md min-h-[115px] justify-between bg-[#1a2542] text-white border border-indigo-900">
              <svg className="absolute -right-6 -bottom-6 w-28 h-28 text-white/5" viewBox="0 0 100 100" fill="currentColor">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="20" />
              </svg>
              <div className="relative z-10 flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-200">
                  Total APR Crédit
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300">
                  Actifs Pondérés par le Risque
                </span>
              </div>
              <div className="relative z-10 flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold tabular-nums tracking-tight text-white">
                  {formatMoney(totalAprCredit)}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-indigo-300">
                  M FCFA
                </span>
              </div>
              <div className="relative z-10 mt-auto border-t border-indigo-900/80 pt-1.5 flex justify-between items-center">
                <span className="text-[9px] font-medium text-indigo-200">
                  Densité d'APR du portefeuille
                </span>
                <span className="text-[9px] font-bold text-emerald-400">
                  {densityRate.toFixed(1)}%
                </span>
              </div>
            </div>

          </div>

          {/* Structure Bilan vs Hors Bilan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Portefeuille Bilan</span>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {totalBrutGlobal > 0 ? ((totalBilanBrut / totalBrutGlobal) * 100).toFixed(1) : 0}% du brut global
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-slate-600 font-medium">Exposition Brute</span>
                  <span className="text-sm font-black text-[#1a2542] tabular-nums">{formatMoney(totalBilanBrut)} M</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-slate-600 font-medium">Provisions et Déductions</span>
                  <span className="text-sm font-bold text-rose-600 tabular-nums">-{formatMoney(totalProvisionsBilan)} M</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-[#1a2542]">Exposition Nette au Bilan</span>
                  <span className="text-base font-black text-indigo-600 tabular-nums">{formatMoney(totalExpositionNetteBilan)} M FCFA</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Engagements Hors Bilan</span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {totalBrutGlobal > 0 ? ((totalHorsBilanBrut / totalBrutGlobal) * 100).toFixed(1) : 0}% du brut global
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-slate-600 font-medium">Engagements Bruts (Avant FCEC)</span>
                  <span className="text-sm font-black text-[#1a2542] tabular-nums">{formatMoney(totalHorsBilanBrut)} M</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-slate-600 font-medium">Provisions Hors Bilan</span>
                  <span className="text-sm font-bold text-rose-600 tabular-nums">-{formatMoney(totalProvisionsHorsBilan)} M</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-[#1a2542]">Exposition Nette Hors Bilan</span>
                  <span className="text-base font-black text-indigo-600 tabular-nums">{formatMoney(totalExpositionNetteHorsBilan)} M FCFA</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* --- ONGLET RÉPARTITION PAR CATÉGORIE --- */}
      {activeTab === 'repartition' && (
        <div className="fade-in">
          <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[520px]">
            {/* Header Banner moderne */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#1a2542] text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-1 h-7 rounded-full bg-indigo-400" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">Répartition des Expositions Nettes par Catégorie</h3>
                  <p className="text-[10px] text-indigo-200">Classement des portefeuilles selon la réglementation BCEAO</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-indigo-200 bg-indigo-500/20 px-3 py-1 rounded border border-indigo-400/30 uppercase tracking-wider">
                {CATEGORIES_EXPOSITIONS.length} Catégories
              </span>
            </div>

            {/* En-tête de colonnes du tableau */}
            <div className="flex items-center gap-4 px-6 py-2.5 bg-slate-50 border-b border-slate-200 text-[9.5px] font-extrabold text-blue-900 uppercase tracking-wider shrink-0 sticky top-0 z-10 shadow-2xs">
              <div className="w-[35%] shrink-0">Catégorie d'exposition</div>
              <div className="flex-1 pl-2">Distribution & Proportion Nette</div>
              <div className="w-[20%] text-right shrink-0">Exposition Nette</div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-1 relative custom-scrollbar">
              {/* Background grid lines */}
              <div className="absolute left-[35%] right-[20%] top-0 bottom-0 flex justify-between pointer-events-none z-0 px-3">
                 <div className="w-px h-full bg-slate-100 border-r border-slate-200 border-dashed" />
                 <div className="w-px h-full bg-slate-100 border-r border-slate-200 border-dashed" />
                 <div className="w-px h-full bg-slate-100 border-r border-slate-200 border-dashed" />
                 <div className="w-px h-full bg-slate-100 border-r border-slate-200 border-dashed" />
              </div>

              {sortedCategories.map((r, idx) => (
                <div
                  key={r.cat.id}
                  className="flex items-center gap-4 group relative z-10 hover:bg-indigo-50/40 transition-colors duration-200 cursor-pointer rounded-sm"
                  style={{
                    paddingTop: '9px',
                    paddingBottom: '9px',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  {/* Label (Left aligned, fixed width) */}
                  <div className="w-[35%] shrink-0 flex items-center gap-3 pr-4 border-r border-slate-200/80">
                    <div className="w-5 h-5 rounded flex items-center justify-center bg-slate-50 text-[10px] font-bold text-slate-400 border border-slate-100 group-hover:bg-indigo-100 group-hover:border-indigo-200 group-hover:text-indigo-700 transition-colors shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 pr-2">
                      <div className="text-[11.5px] font-semibold text-[#1a2542] leading-tight line-clamp-2 group-hover:text-indigo-700 transition-colors" title={r.cat.label}>
                        {r.cat.label}
                      </div>
                    </div>
                  </div>

                  {/* Bar (Middle) */}
                  <div className="flex-1 h-6 flex items-center py-0.5 relative">
                    <div 
                      className="h-full rounded-r-[3px] shadow-sm transition-all duration-700 ease-out flex items-center group-hover:brightness-110"
                      style={{ 
                        width: `${(r.netTotal / maxNetValue) * 100}%`, 
                        backgroundColor: r.color,
                        minWidth: '4px'
                      }}
                    />
                    <span 
                      className="absolute text-[10px] font-black text-slate-500 tabular-nums ml-2 whitespace-nowrap bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded shadow-sm group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-100 transition-colors"
                      style={{ left: `${(r.netTotal / maxNetValue) * 100}%` }}
                    >
                      {r.pctNet.toFixed(1)}%
                    </span>
                  </div>

                  {/* Values (Right aligned) */}
                  <div className="w-[20%] shrink-0 flex items-center justify-end pl-2">
                    <div className="text-right">
                      <div className="text-[12.5px] font-black text-[#1a2542] tabular-nums tracking-tight group-hover:text-indigo-700 transition-colors">
                        {formatMoney(r.netTotal)} <span className="text-[9px] font-bold text-slate-500 uppercase ml-0.5 group-hover:text-indigo-500">M FCFA</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}



      {/* --- ONGLET BILAN --- */}
      {activeTab === 'bilan' && (
        <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm overflow-hidden fade-in flex flex-col max-h-[480px]">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#1a2542] text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-1 h-7 rounded-full bg-indigo-400" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Expositions totales au bilan</h3>
                <p className="text-[10px] text-indigo-200">Détail des expositions brutes, créances souffrantes et expositions nettes</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold text-indigo-200 uppercase tracking-wider block mb-0.5">Sous-total Nette Bilan</span>
              <span className="text-base font-black text-white tabular-nums">{formatMoney(totalExpositionNetteBilan)} <span className="text-[10px] font-semibold text-indigo-200">M FCFA</span></span>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                <tr className="text-[9.5px] font-bold uppercase tracking-wider text-blue-900 border-b border-slate-200">
                  <th className="py-3 px-4 w-10 text-center">#</th>
                  <th className="py-3 px-4 min-w-[260px]">Catégorie d'exposition</th>
                  <th className="py-3 px-4 text-right">Expo brute</th>
                  <th className="py-3 px-4 text-right text-amber-700">Créances souff. / risq.</th>
                  <th className="py-3 px-4 text-right text-rose-600">(-) Déductions & Prov.</th>
                  <th className="py-3 px-4 text-right bg-indigo-50/50 text-indigo-900">Expo nette</th>
                  <th className="py-3 px-4 text-right w-20">Part</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CATEGORIES_EXPOSITIONS.map((cat, idx) => {
                  const brut = getVal(`EP09_${cat.id}_BRUT`);
                  const souff = getVal(`EP09_${cat.id}_CS`) + getVal(`EP09_${cat.id}_CRE`);
                  const deduc = getVal(`EP09_${cat.id}_PROV`) + getVal(`EP09_${cat.id}_DED`);
                  const net = getVal(`EP09_${cat.id}_NET`);
                  const pct = totalExpositionNetteBilan > 0 ? (net / totalExpositionNetteBilan) * 100 : 0;

                  return (
                    <tr key={`EP09_${cat.id}`} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="py-2.5 px-4 text-[9px] font-black text-indigo-700 text-center align-middle">{String(idx + 1).padStart(2, '0')}</td>
                      <td className="py-2.5 px-4 text-[11.5px] font-semibold text-[#1a2542] align-middle">{cat.label}</td>
                      <td className="py-2.5 px-4 text-right text-[11.5px] font-medium text-slate-700 tabular-nums align-middle">{formatMoney(brut)}</td>
                      <td className="py-2.5 px-4 text-right text-[11.5px] font-bold text-amber-600 tabular-nums align-middle">{formatMoney(souff)}</td>
                      <td className="py-2.5 px-4 text-right text-[11.5px] font-bold text-rose-600 tabular-nums align-middle">
                        {deduc > 0 ? `-${formatMoney(deduc)}` : '0'}
                      </td>
                      <td className="py-2.5 px-4 text-right text-[12px] font-black text-[#1a2542] tabular-nums bg-indigo-50/10 group-hover:bg-indigo-50/30 transition-colors align-middle">
                        {formatMoney(net)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-[10px] font-bold text-slate-500 tabular-nums align-middle">{pct.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="sticky bottom-0 z-10 bg-indigo-50/95 backdrop-blur-sm shadow-sm">
                <tr className="border-t border-indigo-100">
                  <td colSpan={2} className="py-3 px-4 text-[10.5px] font-black text-blue-900 uppercase tracking-wide">Sous-total Bilan</td>
                  <td className="py-3 px-4 text-right text-[12px] font-black text-[#1a2542] tabular-nums">{formatMoney(totalBilanBrut)}</td>
                  <td className="py-3 px-4 text-right text-[12px] font-black text-amber-700 tabular-nums">
                    {formatMoney(CATEGORIES_EXPOSITIONS.reduce((acc, cat) => acc + getVal(`EP09_${cat.id}_CS`) + getVal(`EP09_${cat.id}_CRE`), 0))}
                  </td>
                  <td className="py-3 px-4 text-right text-[12px] font-black text-rose-600 tabular-nums">-{formatMoney(totalProvisionsBilan)}</td>
                  <td className="py-3 px-4 text-right text-sm font-black text-indigo-700 tabular-nums">{formatMoney(totalExpositionNetteBilan)} <span className="text-[9px] font-bold text-blue-800">M FCFA</span></td>
                  <td className="py-3 px-4 text-right text-[10px] font-black text-blue-800 tabular-nums">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* --- ONGLET HORS BILAN --- */}
      {activeTab === 'hors-bilan' && (
        <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm overflow-hidden fade-in flex flex-col max-h-[480px]">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#1a2542] text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-1 h-7 rounded-full bg-blue-400" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Engagements totaux hors bilan</h3>
                <p className="text-[10px] text-blue-200">Expositions brutes avant/après FCEC et expositions nettes</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold text-blue-200 uppercase tracking-wider block mb-0.5">Sous-total Nette Hors-Bilan</span>
              <span className="text-base font-black text-white tabular-nums">{formatMoney(totalExpositionNetteHorsBilan)} <span className="text-[10px] font-semibold text-blue-200">M FCFA</span></span>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                <tr className="text-[9.5px] font-bold uppercase tracking-wider text-blue-900 border-b border-slate-200">
                  <th className="py-3 px-4 w-10 text-center">#</th>
                  <th className="py-3 px-4 min-w-[260px]">Catégorie d'exposition</th>
                  <th className="py-3 px-4 text-right">Avant FCEC</th>
                  <th className="py-3 px-4 text-right text-blue-700">Après FCEC</th>
                  <th className="py-3 px-4 text-right text-rose-600">(-) Provisions</th>
                  <th className="py-3 px-4 text-right bg-indigo-50/50 text-indigo-900">Expo nette</th>
                  <th className="py-3 px-4 text-right w-20">Part</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CATEGORIES_EXPOSITIONS.map((cat, idx) => {
                  const avant = getVal(`EP10_${cat.id}_BRUT_AVANT`);
                  const apres = getVal(`EP10_${cat.id}_BRUT_APRES`);
                  const prov = getVal(`EP10_${cat.id}_PROV`);
                  const net = getVal(`EP10_${cat.id}_NET`);
                  const pct = totalExpositionNetteHorsBilan > 0 ? (net / totalExpositionNetteHorsBilan) * 100 : 0;

                  return (
                    <tr key={`EP10_${cat.id}`} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="py-2.5 px-4 text-[9px] font-black text-indigo-700 text-center align-middle">{String(idx + 1).padStart(2, '0')}</td>
                      <td className="py-2.5 px-4 text-[11.5px] font-semibold text-[#1a2542] align-middle">{cat.label}</td>
                      <td className="py-2.5 px-4 text-right text-[11.5px] font-medium text-slate-600 tabular-nums align-middle">{formatMoney(avant)}</td>
                      <td className="py-2.5 px-4 text-right text-[11.5px] font-bold text-blue-700 tabular-nums align-middle">{formatMoney(apres)}</td>
                      <td className="py-2.5 px-4 text-right text-[11.5px] font-bold text-rose-600 tabular-nums align-middle">
                        {prov > 0 ? `-${formatMoney(prov)}` : '0'}
                      </td>
                      <td className="py-2.5 px-4 text-right text-[12px] font-black text-[#1a2542] tabular-nums bg-indigo-50/10 group-hover:bg-indigo-50/30 transition-colors align-middle">
                        {formatMoney(net)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-[10px] font-bold text-slate-500 tabular-nums align-middle">{pct.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="sticky bottom-0 z-10 bg-indigo-50/95 backdrop-blur-sm shadow-sm">
                <tr className="border-t border-indigo-100">
                  <td colSpan={2} className="py-3 px-4 text-[10.5px] font-black text-blue-900 uppercase tracking-wide">Sous-total Hors Bilan</td>
                  <td className="py-3 px-4 text-right text-[12px] font-black text-[#1a2542] tabular-nums">{formatMoney(totalHorsBilanBrut)}</td>
                  <td className="py-3 px-4 text-right text-[12px] font-black text-blue-700 tabular-nums">
                    {formatMoney(CATEGORIES_EXPOSITIONS.reduce((acc, cat) => acc + getVal(`EP10_${cat.id}_BRUT_APRES`), 0))}
                  </td>
                  <td className="py-3 px-4 text-right text-[12px] font-black text-rose-600 tabular-nums">-{formatMoney(totalProvisionsHorsBilan)}</td>
                  <td className="py-3 px-4 text-right text-sm font-black text-indigo-700 tabular-nums">{formatMoney(totalExpositionNetteHorsBilan)} <span className="text-[9px] font-bold text-blue-800">M FCFA</span></td>
                  <td className="py-3 px-4 text-right text-[10px] font-black text-blue-800 tabular-nums">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* --- ONGLET ATTÉNUATION & APR --- */}
      {activeTab === 'attenuation' && (
        <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm overflow-hidden fade-in flex flex-col max-h-[480px]">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#1a2542] text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-1 h-7 rounded-full bg-emerald-400" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Atténuation & Actifs Pondérés</h3>
                <p className="text-[10px] text-emerald-200">Ajustements ARC (Atténuation du Risque de Crédit), pondérations prudentielles et calcul des APR</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold text-emerald-200 uppercase tracking-wider block mb-0.5">Total APR Crédit</span>
              <span className="text-base font-black text-white tabular-nums">{formatMoney(totalAprCredit)} <span className="text-[10px] font-semibold text-emerald-200">M FCFA</span></span>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                <tr className="text-[9.5px] font-bold uppercase tracking-wider text-blue-900 border-b border-slate-200">
                  <th className="py-3 px-4 w-10 text-center">#</th>
                  <th className="py-3 px-4 min-w-[220px]">Catégorie d'exposition</th>
                  <th className="py-3 px-4 text-right">Nette (Avant ARC)</th>
                  <th className="py-3 px-4 text-right text-amber-700">Ajustement ARC</th>
                  <th className="py-3 px-4 text-right">Après ARC</th>
                  <th className="py-3 px-4 text-center w-24">Pondération</th>
                  <th className="py-3 px-4 text-right bg-indigo-50/50 text-indigo-900">Actifs pondérés (APR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CATEGORIES_EXPOSITIONS.map((cat, idx) => {
                  const avantArc = getVal(`EP12_20_${cat.id}_AVANT_ARC`);
                  const ajustArc = getVal(`EP12_20_${cat.id}_AJUST_ARC`);
                  const apresArc = getVal(`EP12_20_${cat.id}_APRES_ARC`);
                  const pond = getVal(`EP12_20_${cat.id}_POND`);
                  const apr = getVal(`EP12_20_${cat.id}_APR`);

                  return (
                    <tr key={`EP12_20_${cat.id}`} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="py-2.5 px-4 text-[9px] font-black text-indigo-700 text-center align-middle">{String(idx + 1).padStart(2, '0')}</td>
                      <td className="py-2.5 px-4 text-[11.5px] font-semibold text-[#1a2542] align-middle">{cat.label}</td>
                      <td className="py-2.5 px-4 text-right text-[11.5px] font-medium text-slate-600 tabular-nums align-middle">{formatMoney(avantArc)}</td>
                      <td className="py-2.5 px-4 text-right text-[11.5px] font-bold text-amber-600 tabular-nums align-middle">{formatMoney(ajustArc)}</td>
                      <td className="py-2.5 px-4 text-right text-[11.5px] font-bold text-[#1a2542] tabular-nums align-middle">{formatMoney(apresArc)}</td>
                      <td className="py-2.5 px-4 text-center align-middle">
                        {pond > 0 ? (
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200/80 rounded text-[10px] font-bold text-slate-700">{pond}%</span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right text-[12px] font-black text-[#1a2542] tabular-nums bg-indigo-50/10 group-hover:bg-indigo-50/30 transition-colors align-middle">
                        {formatMoney(apr)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="sticky bottom-0 z-10 bg-indigo-50/95 backdrop-blur-sm shadow-sm">
                <tr className="border-t border-indigo-100">
                  <td colSpan={2} className="py-3 px-4 text-[10.5px] font-black text-blue-900 uppercase tracking-wide">Sous-total Risque de Crédit</td>
                  <td className="py-3 px-4 text-right text-[12px] font-black text-[#1a2542] tabular-nums">{formatMoney(CATEGORIES_EXPOSITIONS.reduce((acc, cat) => acc + getVal(`EP12_20_${cat.id}_AVANT_ARC`), 0))}</td>
                  <td className="py-3 px-4 text-right text-[12px] font-black text-amber-700 tabular-nums">{formatMoney(CATEGORIES_EXPOSITIONS.reduce((acc, cat) => acc + getVal(`EP12_20_${cat.id}_AJUST_ARC`), 0))}</td>
                  <td className="py-3 px-4 text-right text-[12px] font-black text-[#1a2542] tabular-nums">{formatMoney(CATEGORIES_EXPOSITIONS.reduce((acc, cat) => acc + getVal(`EP12_20_${cat.id}_APRES_ARC`), 0))}</td>
                  <td className="py-3 px-4 text-center text-[10px] font-black text-blue-800 tabular-nums">{densityRate.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right text-sm font-black text-indigo-700 tabular-nums">{formatMoney(totalAprCredit)} <span className="text-[9px] font-bold text-blue-800">M FCFA</span></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};


