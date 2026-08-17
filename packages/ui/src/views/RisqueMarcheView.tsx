import React, { useState, useMemo } from 'react';
import { analyseRisqueMarche, type SolvabiliteAnalyse } from '@heyfodep/kernel';
import { Tabs, type TabOption } from '../components/Tabs';


interface RisqueMarcheViewProps {
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

type TabId = 'synthese' | 'taux' | 'actions' | 'change' | 'matprem';

export const RisqueMarcheView: React.FC<RisqueMarcheViewProps> = ({ solva, isSidebarCollapsed }) => {
  const [activeTab, setActiveTab] = useState<TabId>('synthese');

  const resultats = useMemo(() => {
    const inputs: Record<string, string | number> = {};
    solva.valeurs.forEach((val: any, key: string) => (inputs[key] = val.toNumber()));
    return analyseRisqueMarche(inputs);
  }, [solva]);

  const getVal = (code: string) => solva.valeurs.get(code)?.toNumber() || 0;

  const aprTotal = resultats.aprTotal.toNumber();
  const exigenceTaux = resultats.exigenceTaux.toNumber();
  const exigenceActions = resultats.exigenceActions.toNumber();
  const exigenceChange = resultats.exigenceChange.toNumber();
  const exigenceMatPrem = resultats.exigenceMatPrem.toNumber();
  const exigenceTotale = resultats.exigenceTotale.toNumber();

  // Positions brutes & sous-jacentes
  const tauxSpecifique = getVal("EP25_TAUX_SPECIFIQUE");
  const tauxGeneral = getVal("EP25_TAUX_GENERAL");
  const actionsSpecifique = getVal("EP27_ACTIONS_SPECIFIQUE");
  const actionsGeneral = getVal("EP27_ACTIONS_GENERAL");
  const changePositionNette = getVal("EP35_CHANGE_POSITION_NETTE");
  const matPremPosition = getVal("EP37_MATPREM_POSITION");

  const totalPositionsTitres = tauxSpecifique + tauxGeneral + actionsSpecifique + actionsGeneral;

  // Calcul des pourcentages de répartition
  const pctTaux = exigenceTotale > 0 ? (exigenceTaux / exigenceTotale) * 100 : 0;
  const pctActions = exigenceTotale > 0 ? (exigenceActions / exigenceTotale) * 100 : 0;
  const pctChange = exigenceTotale > 0 ? (exigenceChange / exigenceTotale) * 100 : 0;
  const pctMatPrem = exigenceTotale > 0 ? (exigenceMatPrem / exigenceTotale) * 100 : 0;

  const totalAprGlobal = solva.apr?.toNumber() || getVal("APR_TOTAL") || 0;
  const contributionGlobalPct = totalAprGlobal > 0 ? (aprTotal / totalAprGlobal) * 100 : 0;

  const tabOptions: TabOption[] = [
    { id: 'synthese', label: 'Synthèse du risque' },
    { id: 'taux', label: 'Risque de Taux' },
    { id: 'actions', label: 'Titres de Propriété' },
    { id: 'change', label: 'Risque de Change' },
    { id: 'matprem', label: 'Matières Premières' },
  ];

  return (
    <div className="space-y-6 max-w-full mx-auto fade-in">
      
      {/* 1. Navigation Interne Collante au défilement (100% Opaque & Blindée) */}
      <div className="sticky top-12 z-20 bg-[#F4F7FA] py-3 -mt-3 pb-3 border-b border-slate-200/40 shadow-xs">
        <Tabs 
          tabs={tabOptions} 
          activeTab={activeTab} 
          onChange={(id) => setActiveTab(id as TabId)} 
          isSidebarCollapsed={isSidebarCollapsed} 
        />
      </div>

      {/* 2. Contenu selon l'onglet actif */}

      {/* --- ONGLET 1 : SYNTHÈSE DU RISQUE DE MARCHÉ --- */}
      {activeTab === 'synthese' && (
        <div className="space-y-6 fade-in">
          
          {/* Rangée 1 : 4 KPIs Exécutifs Risque de Marché */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Exigence Risque de Taux */}
            <div className="flex flex-col rounded shadow-sm p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md min-h-[115px] justify-between bg-white text-slate-900 border border-slate-200">
              <svg className="absolute -right-8 -top-8 w-28 h-28 text-slate-50" viewBox="0 0 100 100" fill="currentColor">
                <circle cx="50" cy="50" r="50" />
              </svg>
              <div className="relative z-10 flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-blue-800">
                  Exigence Risque de Taux
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                  Taux
                </span>
              </div>
              <div className="relative z-10 flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold tabular-nums tracking-tight text-slate-800">
                  {formatMoney(exigenceTaux)}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  M FCFA
                </span>
              </div>
              <div className="relative z-10 mt-auto border-t border-slate-100 pt-1.5 flex justify-between items-center">
                <span className="text-[9px] font-medium text-slate-500">
                  Titres de créance
                </span>
                <span className="text-[9px] font-bold text-indigo-600">
                  {exigenceTotale > 0 ? ((exigenceTaux / exigenceTotale) * 100).toFixed(0) : 0}% du total
                </span>
              </div>
            </div>

            {/* KPI 2: Exigence Risque Actions */}
            <div className="flex flex-col rounded shadow-sm p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md min-h-[115px] justify-between bg-white text-slate-900 border border-slate-200">
              <svg className="absolute -right-6 -bottom-6 w-28 h-28 text-slate-50" viewBox="0 0 100 100" fill="currentColor">
                <rect width="100" height="100" rx="20" transform="rotate(45 50 50)" />
              </svg>
              <div className="relative z-10 flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-blue-800">
                  Exigence Risque Actions
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700">
                  Actions
                </span>
              </div>
              <div className="relative z-10 flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold tabular-nums tracking-tight text-slate-800">
                  {formatMoney(exigenceActions)}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  M FCFA
                </span>
              </div>
              <div className="relative z-10 mt-auto border-t border-slate-100 pt-1.5 flex justify-between items-center">
                <span className="text-[9px] font-medium text-slate-500">
                  Titres de propriété
                </span>
                <span className="text-[9px] font-bold text-blue-600">
                  {exigenceTotale > 0 ? ((exigenceActions / exigenceTotale) * 100).toFixed(0) : 0}% du total
                </span>
              </div>
            </div>

            {/* KPI 3: Exigence Change & Mat. Premières */}
            <div className="flex flex-col rounded shadow-sm p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md min-h-[115px] justify-between bg-white text-slate-900 border border-slate-200">
              <svg className="absolute -right-6 -bottom-6 w-28 h-28 text-slate-50" viewBox="0 0 100 100" fill="currentColor">
                <polygon points="50 15, 100 100, 0 100" opacity="0.5" />
              </svg>
              <div className="relative z-10 flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-blue-800">
                  Exigence Change & Mat. Prem.
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-cyan-50 text-cyan-700">
                  Change & Mat.
                </span>
              </div>
              <div className="relative z-10 flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold tabular-nums tracking-tight text-slate-800">
                  {formatMoney(exigenceChange + exigenceMatPrem)}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  M FCFA
                </span>
              </div>
              <div className="relative z-10 mt-auto border-t border-slate-100 pt-1.5 flex justify-between items-center">
                <span className="text-[9px] font-medium text-slate-500">
                  Devises ({formatMoney(exigenceChange)} M) · Mat. Prem ({formatMoney(exigenceMatPrem)} M)
                </span>
                <span className="text-[9px] font-bold text-cyan-600">
                  {exigenceTotale > 0 ? (((exigenceChange + exigenceMatPrem) / exigenceTotale) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>

            {/* KPI 4: Total APR Risque de Marché */}
            <div className="flex flex-col rounded shadow-sm p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md min-h-[115px] justify-between bg-[#1a2542] text-white border border-indigo-900">
              <svg className="absolute -right-6 -bottom-6 w-28 h-28 text-white/5" viewBox="0 0 100 100" fill="currentColor">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="20" />
              </svg>
              <div className="relative z-10 flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-200">
                  Total APR Marché
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300">
                  Actifs Pondérés par le Risque
                </span>
              </div>
              <div className="relative z-10 flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold tabular-nums tracking-tight text-white">
                  {formatMoney(aprTotal)}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-indigo-300">
                  M FCFA
                </span>
              </div>
              <div className="relative z-10 mt-auto border-t border-indigo-900/80 pt-1.5 flex justify-between items-center">
                <span className="text-[9px] font-medium text-indigo-200">
                  Exigence totale : {formatMoney(exigenceTotale)} M FCFA
                </span>
                <span className="text-[9px] font-bold text-emerald-400">
                  Seuil 9%
                </span>
              </div>
            </div>

          </div>


          {/* Rangée 3 : Indicateurs de Production Prudentielle FODEP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Indicateur 1 : Exigence Totale Marché */}
            <div className="flex flex-col rounded shadow-sm p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md min-h-[115px] justify-between bg-white text-slate-900 border border-slate-200">
              <div className="relative z-10 flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-blue-800">
                  Exigence Totale Marché
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                  Pilier 1
                </span>
              </div>
              <div className="relative z-10 flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold tabular-nums tracking-tight text-slate-800">
                  {formatMoney(exigenceTotale)}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  M FCFA
                </span>
              </div>
              <div className="relative z-10 mt-auto border-t border-slate-100 pt-1.5 flex justify-between items-center">
                <span className="text-[9px] font-medium text-slate-500">
                  Besoin en capital (Pilier 1)
                </span>
                <span className="text-[9px] font-bold text-indigo-600">
                  Réglementaire
                </span>
              </div>
            </div>

            {/* Indicateur 2 : Position Nette Globale de Change */}
            <div className="flex flex-col rounded shadow-sm p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md min-h-[115px] justify-between bg-white text-slate-900 border border-slate-200">
              <div className="relative z-10 flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-blue-800">
                  Position Nette de Change
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700">
                  Devises
                </span>
              </div>
              <div className="relative z-10 flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold tabular-nums tracking-tight text-slate-800">
                  {formatMoney(changePositionNette)}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  M FCFA
                </span>
              </div>
              <div className="relative z-10 mt-auto border-t border-slate-100 pt-1.5 flex justify-between items-center">
                <span className="text-[9px] font-medium text-slate-500">
                  Assiette calcul de change
                </span>
                <span className="text-[9px] font-bold text-blue-600">
                  Taux 15%
                </span>
              </div>
            </div>

            {/* Indicateur 3 : Total Positions Titres */}
            <div className="flex flex-col rounded shadow-sm p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md min-h-[115px] justify-between bg-white text-slate-900 border border-slate-200">
              <div className="relative z-10 flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-blue-800">
                  Total Positions Titres
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700">
                  Trading Book
                </span>
              </div>
              <div className="relative z-10 flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold tabular-nums tracking-tight text-slate-800">
                  {formatMoney(totalPositionsTitres)}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  M FCFA
                </span>
              </div>
              <div className="relative z-10 mt-auto border-t border-slate-100 pt-1.5 flex justify-between items-center">
                <span className="text-[9px] font-medium text-slate-500">
                  Créances & Actions
                </span>
                <span className="text-[9px] font-bold text-emerald-600">
                  Portefeuille
                </span>
              </div>
            </div>

            {/* Indicateur 4 : Contribution au Profil de Risque Global */}
            <div className="flex flex-col rounded shadow-sm p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md min-h-[115px] justify-between bg-white text-slate-900 border border-slate-200">
              <div className="relative z-10 flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-blue-800">
                  Contribution APR Global
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700">
                  Profil Risque
                </span>
              </div>
              <div className="relative z-10 flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold tabular-nums tracking-tight text-slate-800">
                  {contributionGlobalPct.toFixed(2)}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  %
                </span>
              </div>
              <div className="relative z-10 mt-auto border-t border-slate-100 pt-1.5 flex justify-between items-center">
                <span className="text-[9px] font-medium text-slate-500">
                  Part dans l'APR total banque
                </span>
                <span className={`text-[9px] font-bold ${contributionGlobalPct > 20 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {contributionGlobalPct > 20 ? 'Impact élevé' : 'Impact modéré'}
                </span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* --- ONGLET 2 : RISQUE DE TAUX D'INTÉRÊT --- */}
      {activeTab === 'taux' && (
        <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm overflow-hidden fade-in">
          
          {/* Bandeau d'en-tête bleu marine moderne */}
          <div className="bg-[#1a2542] px-6 py-4 flex justify-between items-center border-b border-indigo-950">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-indigo-500 rounded-full" />
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Risque de Taux d'Intérêt (Portefeuille de Négociation)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Évaluation du risque spécifique et du risque général sur les titres de créance
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-indigo-300 bg-white/10 px-2.5 py-1 rounded border border-white/10">
                Exigence Totale : {formatMoney(exigenceTaux)} M FCFA
              </span>
            </div>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[9.5px] font-extrabold uppercase tracking-wider text-blue-900 bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-6 w-24">Réf.</th>
                  <th className="py-3 px-6">Composante du Risque de Taux</th>
                  <th className="py-3 px-6 text-center w-36">Catégorie</th>
                  <th className="py-3 px-6 text-right w-44">Montant Exigé (M FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-slate-500 font-mono text-[11px]">
                    <div className="flex flex-col gap-0.5"><span className="text-[11.5px] font-semibold text-[#1a2542] leading-snug">SPECIFIQUE</span><span className="font-mono text-[9px] font-bold text-indigo-400 bg-indigo-50/60 rounded-sm px-1.5 py-[2px] leading-none self-start tracking-tight">EP25_TS</span></div>
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-slate-800">
                    Risque Spécifique (Titres de créance)
                    <div className="text-[10px] text-slate-400 font-normal">Risque d'émetteur et solvabilité de la contrepartie</div>
                  </td>
                  <td className="py-3.5 px-6 text-center">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-indigo-50 text-indigo-700 rounded">Titres créance</span>
                  </td>
                  <td className="py-3.5 px-6 text-right font-black text-[#1a2542] tabular-nums">
                    {formatMoney(tauxSpecifique)}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-slate-500 font-mono text-[11px]">
                    <div className="flex flex-col gap-0.5"><span className="text-[11.5px] font-semibold text-[#1a2542] leading-snug">GENERAL</span><span className="font-mono text-[9px] font-bold text-indigo-400 bg-indigo-50/60 rounded-sm px-1.5 py-[2px] leading-none self-start tracking-tight">EP25_TG</span></div>
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-slate-800">
                    Risque Général (Titres de créance)
                    <div className="text-[10px] text-slate-400 font-normal">Sensibilité globale aux fluctuations des taux du marché</div>
                  </td>
                  <td className="py-3.5 px-6 text-center">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-50 text-blue-700 rounded">Marché taux</span>
                  </td>
                  <td className="py-3.5 px-6 text-right font-black text-[#1a2542] tabular-nums">
                    {formatMoney(tauxGeneral)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="sticky bottom-0 z-10 bg-indigo-50/95 backdrop-blur-sm shadow-sm border-t-2 border-indigo-200">
                <tr className="text-xs">
                  <td colSpan={3} className="py-3 px-6 text-[10.5px] font-black text-blue-900 uppercase tracking-wide">
                    Total Exigence Risque de Taux
                  </td>
                  <td className="py-3 px-6 text-right font-black text-indigo-700 text-sm tabular-nums">
                    {formatMoney(exigenceTaux)} M FCFA
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>
      )}

      {/* --- ONGLET 3 : TITRES DE PROPRIÉTÉ / ACTIONS --- */}
      {activeTab === 'actions' && (
        <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm overflow-hidden fade-in">
          
          {/* Bandeau d'en-tête bleu marine */}
          <div className="bg-[#1a2542] px-6 py-4 flex justify-between items-center border-b border-indigo-950">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-indigo-500 rounded-full" />
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Risque sur Titres de Propriété (Actions)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Exigence en fonds propres pour le risque spécifique et général sur les actions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-indigo-300 bg-white/10 px-2.5 py-1 rounded border border-white/10">
                Exigence Totale : {formatMoney(exigenceActions)} M FCFA
              </span>
            </div>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[9.5px] font-extrabold uppercase tracking-wider text-blue-900 bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-6 w-24">Réf.</th>
                  <th className="py-3 px-6">Composante du Risque Actions</th>
                  <th className="py-3 px-6 text-center w-36">Nature</th>
                  <th className="py-3 px-6 text-right w-44">Montant Exigé (M FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-slate-500 font-mono text-[11px]">
                    <div className="flex flex-col gap-0.5"><span className="text-[11.5px] font-semibold text-[#1a2542] leading-snug">SPECIFIQUE</span><span className="font-mono text-[9px] font-bold text-indigo-400 bg-indigo-50/60 rounded-sm px-1.5 py-[2px] leading-none self-start tracking-tight">EP27_AS</span></div>
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-slate-800">
                    Risque Spécifique (Actions & Titres de Propriété)
                    <div className="text-[10px] text-slate-400 font-normal">Risque propre à chaque émetteur d'actions</div>
                  </td>
                  <td className="py-3.5 px-6 text-center">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-indigo-50 text-indigo-700 rounded">Actions</span>
                  </td>
                  <td className="py-3.5 px-6 text-right font-black text-[#1a2542] tabular-nums">
                    {formatMoney(actionsSpecifique)}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-slate-500 font-mono text-[11px]">
                    <div className="flex flex-col gap-0.5"><span className="text-[11.5px] font-semibold text-[#1a2542] leading-snug">GENERAL</span><span className="font-mono text-[9px] font-bold text-indigo-400 bg-indigo-50/60 rounded-sm px-1.5 py-[2px] leading-none self-start tracking-tight">EP27_AG</span></div>
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-slate-800">
                    Risque Général (Actions)
                    <div className="text-[10px] text-slate-400 font-normal">Fluctuations générales des cours boursiers</div>
                  </td>
                  <td className="py-3.5 px-6 text-center">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-50 text-blue-700 rounded">Bourse</span>
                  </td>
                  <td className="py-3.5 px-6 text-right font-black text-[#1a2542] tabular-nums">
                    {formatMoney(actionsGeneral)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="sticky bottom-0 z-10 bg-indigo-50/95 backdrop-blur-sm shadow-sm border-t-2 border-indigo-200">
                <tr className="text-xs">
                  <td colSpan={3} className="py-3 px-6 text-[10.5px] font-black text-blue-900 uppercase tracking-wide">
                    Total Exigence Risque sur Actions
                  </td>
                  <td className="py-3 px-6 text-right font-black text-indigo-700 text-sm tabular-nums">
                    {formatMoney(exigenceActions)} M FCFA
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>
      )}

      {/* --- ONGLET 4 : RISQUE DE CHANGE --- */}
      {activeTab === 'change' && (
        <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm overflow-hidden fade-in">
          
          {/* Bandeau d'en-tête bleu marine */}
          <div className="bg-[#1a2542] px-6 py-4 flex justify-between items-center border-b border-indigo-950">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-indigo-500 rounded-full" />
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Risque de Change
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Calcul de l'exigence globale de change sur la Position Nette Globale de Change (PNGC)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-indigo-300 bg-white/10 px-2.5 py-1 rounded border border-white/10">
                Exigence Totale : {formatMoney(exigenceChange)} M FCFA
              </span>
            </div>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[9.5px] font-extrabold uppercase tracking-wider text-blue-900 bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-6 w-24">Réf.</th>
                  <th className="py-3 px-6">Libellé Réglementaire</th>
                  <th className="py-3 px-6 text-center w-36">Coefficient</th>
                  <th className="py-3 px-6 text-right w-44">Montant (M FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-slate-500 font-mono text-[11px]">
                    <div className="flex flex-col gap-0.5"><span className="text-[11.5px] font-semibold text-[#1a2542] leading-snug">POSITION</span><span className="font-mono text-[9px] font-bold text-indigo-400 bg-indigo-50/60 rounded-sm px-1.5 py-[2px] leading-none self-start tracking-tight">EP35</span></div>
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-slate-800">
                    Position Nette Globale de Change (PNGC)
                    <div className="text-[10px] text-slate-400 font-normal">Somme des positions nettes courtes et longues en devises hors zone d'émission</div>
                  </td>
                  <td className="py-3.5 px-6 text-center">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-cyan-50 text-cyan-700 rounded">Devises</span>
                  </td>
                  <td className="py-3.5 px-6 text-right font-black text-[#1a2542] tabular-nums">
                    {formatMoney(changePositionNette)}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-slate-500 font-mono text-[11px]">EXIGENCE</td>
                  <td className="py-3.5 px-6 font-semibold text-slate-800">
                    Exigence en fonds propres au titre du risque de change
                    <div className="text-[10px] text-slate-400 font-normal">Application du taux réglementaire standard de 15%</div>
                  </td>
                  <td className="py-3.5 px-6 text-center">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-indigo-50 text-indigo-700 rounded">15.0%</span>
                  </td>
                  <td className="py-3.5 px-6 text-right font-black text-indigo-600 tabular-nums">
                    {formatMoney(exigenceChange)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="sticky bottom-0 z-10 bg-indigo-50/95 backdrop-blur-sm shadow-sm border-t-2 border-indigo-200">
                <tr className="text-xs">
                  <td colSpan={3} className="py-3 px-6 text-[10.5px] font-black text-blue-900 uppercase tracking-wide">
                    Total Exigence Risque de Change
                  </td>
                  <td className="py-3 px-6 text-right font-black text-indigo-700 text-sm tabular-nums">
                    {formatMoney(exigenceChange)} M FCFA
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>
      )}

      {/* --- ONGLET 5 : RISQUE MATIÈRES PREMIÈRES --- */}
      {activeTab === 'matprem' && (
        <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm overflow-hidden fade-in">
          
          {/* Bandeau d'en-tête bleu marine */}
          <div className="bg-[#1a2542] px-6 py-4 flex justify-between items-center border-b border-indigo-950">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-indigo-500 rounded-full" />
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Risque sur Matières Premières
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Exigence au titre des positions nettes sur matières premières et produits de base
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-indigo-300 bg-white/10 px-2.5 py-1 rounded border border-white/10">
                Exigence Totale : {formatMoney(exigenceMatPrem)} M FCFA
              </span>
            </div>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[9.5px] font-extrabold uppercase tracking-wider text-blue-900 bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-6 w-24">Réf.</th>
                  <th className="py-3 px-6">Libellé Réglementaire</th>
                  <th className="py-3 px-6 text-center w-36">Taux</th>
                  <th className="py-3 px-6 text-right w-44">Montant (M FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-slate-500 font-mono text-[11px]">
                    <div className="flex flex-col gap-0.5"><span className="text-[11.5px] font-semibold text-[#1a2542] leading-snug">POSITION</span><span className="font-mono text-[9px] font-bold text-indigo-400 bg-indigo-50/60 rounded-sm px-1.5 py-[2px] leading-none self-start tracking-tight">EP37</span></div>
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-slate-800">
                    Position Nette sur Matières Premières
                    <div className="text-[10px] text-slate-400 font-normal">Positions ouvertes sur marchandises et matières premières</div>
                  </td>
                  <td className="py-3.5 px-6 text-center">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-50 text-amber-700 rounded">Commodities</span>
                  </td>
                  <td className="py-3.5 px-6 text-right font-black text-[#1a2542] tabular-nums">
                    {formatMoney(matPremPosition)}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-slate-500 font-mono text-[11px]">EXIGENCE</td>
                  <td className="py-3.5 px-6 font-semibold text-slate-800">
                    Exigence en fonds propres Matières Premières
                    <div className="text-[10px] text-slate-400 font-normal">Pondération réglementaire standard de 15%</div>
                  </td>
                  <td className="py-3.5 px-6 text-center">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-indigo-50 text-indigo-700 rounded">15.0%</span>
                  </td>
                  <td className="py-3.5 px-6 text-right font-black text-indigo-600 tabular-nums">
                    {formatMoney(exigenceMatPrem)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="sticky bottom-0 z-10 bg-indigo-50/95 backdrop-blur-sm shadow-sm border-t-2 border-indigo-200">
                <tr className="text-xs">
                  <td colSpan={3} className="py-3 px-6 text-[10.5px] font-black text-blue-900 uppercase tracking-wide">
                    Total Exigence Matières Premières
                  </td>
                  <td className="py-3 px-6 text-right font-black text-indigo-700 text-sm tabular-nums">
                    {formatMoney(exigenceMatPrem)} M FCFA
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>
      )}

    </div>
  );
};



