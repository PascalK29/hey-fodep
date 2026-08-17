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

type TabId = 'synthese' | 'bilan' | 'hors-bilan' | 'attenuation';

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


  const tabOptions: TabOption[] = [
    { id: 'synthese', label: 'Synthèse du risque' },
    { id: 'bilan', label: 'Expositions Bilan' },
    { id: 'hors-bilan', label: 'Hors Bilan' },
    { id: 'attenuation', label: 'Atténuation & APR' },
  ];

  return (
    <div className="space-y-6 max-w-full mx-auto fade-in">
      
      {/* 1. Navigation Interne Collante au défilement (100% Opaque & Blindée) */}
      <div className="sticky top-12 z-20 bg-[#F4F7FA] py-3 -mt-3 pb-3 border-b border-slate-200/40 shadow-xs">
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

          {/* Indicateurs Réglementaires pour la Production du FODEP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Indicateur 1: Exigence Minimale de FP Crédit (9% des APR) - État EP02 */}
            {(() => {
              const exigenceFpCredit9Pct = totalAprCredit * 0.09;
              return (
                <div className="flex flex-col rounded shadow-sm p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md min-h-[115px] justify-between bg-white text-slate-900 border border-slate-200">
                  <div className="relative z-10 flex items-start justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-blue-800">
                      Exigence Minimale FP Crédit
                    </span>
                    <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                      Pilier 1
                    </span>
                  </div>
                  <div className="relative z-10 flex items-baseline gap-1 mb-2">
                    <span className="text-xl font-bold tabular-nums tracking-tight text-slate-800">
                      {formatMoney(exigenceFpCredit9Pct)}
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                      M FCFA
                    </span>
                  </div>
                  <div className="relative z-10 mt-auto border-t border-slate-100 pt-1.5 flex justify-between items-center">
                    <span className="text-[9px] font-medium text-slate-500">
                      Besoin en capital (9% APR)
                    </span>
                    <span className="text-[9px] font-bold text-indigo-600">
                      Pilier 1
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Indicateur 2: Équivalent-Crédit Hors Bilan (Après FCEC) */}
            {(() => {
              const totalHorsBilanApres = CATEGORIES_EXPOSITIONS.reduce((acc, cat) => acc + getVal(`EP10_${cat.id}_BRUT_APRES`), 0);
              const txConversion = totalHorsBilanBrut > 0 ? (totalHorsBilanApres / totalHorsBilanBrut) * 100 : 0;
              return (
                <div className="flex flex-col rounded shadow-sm p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md min-h-[115px] justify-between bg-white text-slate-900 border border-slate-200">
                  <div className="relative z-10 flex items-start justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-blue-800">
                      Équivalent-Crédit Hors Bilan
                    </span>
                    <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700">
                      Hors-Bilan
                    </span>
                  </div>
                  <div className="relative z-10 flex items-baseline gap-1 mb-2">
                    <span className="text-xl font-bold tabular-nums tracking-tight text-slate-800">
                      {formatMoney(totalHorsBilanApres)}
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                      M FCFA
                    </span>
                  </div>
                  <div className="relative z-10 mt-auto border-t border-slate-100 pt-1.5 flex justify-between items-center">
                    <span className="text-[9px] font-medium text-slate-500">
                      Brut avant FCEC : {formatMoney(totalHorsBilanBrut)} M
                    </span>
                    <span className="text-[9px] font-bold text-blue-600">
                      FCEC moyen : {txConversion.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Indicateur 3: Déductions d'Actif des Fonds Propres */}
            {(() => {
              const totalDeductions = CATEGORIES_EXPOSITIONS.reduce((acc, cat) => acc + getVal(`EP09_${cat.id}_DED`), 0);
              return (
                <div className="flex flex-col rounded shadow-sm p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md min-h-[115px] justify-between bg-white text-slate-900 border border-slate-200">
                  <div className="relative z-10 flex items-start justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-blue-800">
                      Déductions d'Actif des FP
                    </span>
                    <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700">
                      Déductions
                    </span>
                  </div>
                  <div className="relative z-10 flex items-baseline gap-1 mb-2">
                    <span className="text-xl font-bold tabular-nums tracking-tight text-rose-600">
                      -{formatMoney(totalDeductions)}
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-rose-400">
                      M FCFA
                    </span>
                  </div>
                  <div className="relative z-10 mt-auto border-t border-slate-100 pt-1.5 flex justify-between items-center">
                    <span className="text-[9px] font-medium text-slate-500">
                      Impact direct Fonds Propres
                    </span>
                    <span className="text-[9px] font-bold text-rose-600">
                      Minoration FP
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Indicateur 4: Taux de Dégradation (NPL) */}
            {(() => {
              const totalCS = CATEGORIES_EXPOSITIONS.reduce((acc, cat) => acc + getVal(`EP09_${cat.id}_CS`), 0);
              const tauxCS = totalBilanBrut > 0 ? (totalCS / totalBilanBrut) * 100 : 0;
              const tauxCouvertureCS = totalCS > 0 ? (totalProvisions / totalCS) * 100 : 0;
              return (
                <div className="flex flex-col rounded shadow-sm p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md min-h-[115px] justify-between bg-white text-slate-900 border border-slate-200">
                  <div className="relative z-10 flex items-start justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-blue-800">
                      Taux de Dégradation (NPL)
                    </span>
                    <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                      Qualité
                    </span>
                  </div>
                  <div className="relative z-10 flex items-baseline gap-1 mb-2">
                    <span className="text-xl font-bold tabular-nums tracking-tight text-slate-800">
                      {tauxCS.toFixed(2)}
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                      %
                    </span>
                  </div>
                  <div className="relative z-10 mt-auto border-t border-slate-100 pt-1.5 flex justify-between items-center">
                    <span className="text-[9px] font-medium text-slate-500">
                      En souffrance : {formatMoney(totalCS)} M FCFA
                    </span>
                    <span className={`text-[9px] font-bold ${tauxCouvertureCS >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      Couvert à {tauxCouvertureCS.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })()}

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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CATEGORIES_EXPOSITIONS.map((cat, idx) => {
                  const brut = getVal(`EP09_${cat.id}_BRUT`);
                  const souff = getVal(`EP09_${cat.id}_CS`) + getVal(`EP09_${cat.id}_CRE`);
                  const deduc = getVal(`EP09_${cat.id}_PROV`) + getVal(`EP09_${cat.id}_DED`);
                  const net = getVal(`EP09_${cat.id}_NET`);


                  return (
                    <tr key={`EP09_${cat.id}`} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="py-2.5 px-4 text-[9px] font-black text-indigo-700 text-center align-middle">{String(idx + 1).padStart(2, '0')}</td>
                      <td className="py-2.5 px-4 text-[11.5px] font-semibold text-[#1a2542] align-middle">
                        <div className="flex flex-col gap-0.5"><span className="text-[11.5px] font-semibold text-[#1a2542] leading-snug">{cat.label}</span><span className="font-mono text-[9px] font-bold text-indigo-400 bg-indigo-50/60 rounded-sm px-1.5 py-[2px] leading-none self-start tracking-tight">EP09_{cat.id}</span></div>
                      </td>
                      <td className="py-2.5 px-4 text-right text-[11.5px] font-medium text-slate-700 tabular-nums align-middle">{formatMoney(brut)}</td>
                      <td className="py-2.5 px-4 text-right text-[11.5px] font-bold text-amber-600 tabular-nums align-middle">{formatMoney(souff)}</td>
                      <td className="py-2.5 px-4 text-right text-[11.5px] font-bold text-rose-600 tabular-nums align-middle">
                        {deduc > 0 ? `-${formatMoney(deduc)}` : '0'}
                      </td>
                      <td className="py-2.5 px-4 text-right text-[12px] font-black text-[#1a2542] tabular-nums bg-indigo-50/10 group-hover:bg-indigo-50/30 transition-colors align-middle">
                        {formatMoney(net)}
                      </td>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CATEGORIES_EXPOSITIONS.map((cat, idx) => {
                  const avant = getVal(`EP10_${cat.id}_BRUT_AVANT`);
                  const apres = getVal(`EP10_${cat.id}_BRUT_APRES`);
                  const prov = getVal(`EP10_${cat.id}_PROV`);
                  const net = getVal(`EP10_${cat.id}_NET`);


                  return (
                    <tr key={`EP10_${cat.id}`} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="py-2.5 px-4 text-[9px] font-black text-indigo-700 text-center align-middle">{String(idx + 1).padStart(2, '0')}</td>
                      <td className="py-2.5 px-4 text-[11.5px] font-semibold text-[#1a2542] align-middle">
                        <div className="flex flex-col gap-0.5"><span className="text-[11.5px] font-semibold text-[#1a2542] leading-snug">{cat.label}</span><span className="font-mono text-[9px] font-bold text-indigo-400 bg-indigo-50/60 rounded-sm px-1.5 py-[2px] leading-none self-start tracking-tight">EP10_{cat.id}</span></div>
                      </td>
                      <td className="py-2.5 px-4 text-right text-[11.5px] font-medium text-slate-600 tabular-nums align-middle">{formatMoney(avant)}</td>
                      <td className="py-2.5 px-4 text-right text-[11.5px] font-bold text-blue-700 tabular-nums align-middle">{formatMoney(apres)}</td>
                      <td className="py-2.5 px-4 text-right text-[11.5px] font-bold text-rose-600 tabular-nums align-middle">
                        {prov > 0 ? `-${formatMoney(prov)}` : '0'}
                      </td>
                      <td className="py-2.5 px-4 text-right text-[12px] font-black text-[#1a2542] tabular-nums bg-indigo-50/10 group-hover:bg-indigo-50/30 transition-colors align-middle">
                        {formatMoney(net)}
                      </td>
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
                      <td className="py-2.5 px-4 text-[11.5px] font-semibold text-[#1a2542] align-middle">
                        <div className="flex flex-col gap-0.5"><span className="text-[11.5px] font-semibold text-[#1a2542] leading-snug">{cat.label}</span><span className="font-mono text-[9px] font-bold text-indigo-400 bg-indigo-50/60 rounded-sm px-1.5 py-[2px] leading-none self-start tracking-tight">EP12_20_{cat.id}</span></div>
                      </td>
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





