import React, { useState } from 'react';
import type { SolvabiliteAnalyse } from '@heyfodep/kernel';
import { CATEGORIES_PERTES, LIGNES_METIER_AS } from '@heyfodep/kernel';
import { Tabs, type TabOption } from '../components/Tabs';
import { KpiCard } from '../components/KpiCard';

interface RisqueOperationnelViewProps {
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

export const RisqueOperationnelView: React.FC<RisqueOperationnelViewProps> = ({ solva, isSidebarCollapsed }) => {
  const [activeTab, setActiveTab] = useState('aib');
  const { valeurs } = solva;

  const getVal = (code: string) => {
    return valeurs.get(code)?.toNumber() || 0;
  };

  const exigenceAIB = getVal("EP21_EXIGENCE");
  const aprAIB = getVal("EP21_APR");
  const exigenceAS = getVal("EP23_TOTAL_EXIGENCE");
  const aprAS = getVal("EP23_TOTAL_APR");
  
  const totalPertesMontant = CATEGORIES_PERTES.reduce((acc, cat) => acc + getVal(`EP22_${cat.id}_MONTANT`), 0);
  const totalExigences = exigenceAIB + exigenceAS;
  const totalAprOp = aprAIB + aprAS;

  const tabOptions: TabOption[] = [
    { id: 'aib', label: 'Indicateur de Base' },
    { id: 'pertes', label: 'Pertes' },
    { id: 'as', label: 'Approche Standard' },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* KPIs Globaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Exigence Globale" 
          value={formatMoney(totalExigences)} 
          unit="M FCFA" 
          colorScheme="slate" 
        />
        <KpiCard 
          title="Total Pertes" 
          value={formatMoney(totalPertesMontant)} 
          unit="M FCFA" 
          colorScheme="rose" 
        />
        <KpiCard 
          title="APR Base (AIB)" 
          value={formatMoney(aprAIB)} 
          unit="M FCFA" 
          colorScheme="blue" 
        />
        <div className="bg-[#1a2542] rounded-[3px] border border-indigo-900 shadow-sm p-3 flex flex-col justify-between text-white hover:shadow-md transition-all duration-300">
          <div className="mb-1.5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 leading-tight">Total APR Opérationnel</h3>
          </div>
          <div className="flex items-baseline space-x-1 mt-auto">
            <span className="text-base font-bold tracking-tight text-white">{formatMoney(totalAprOp)}</span>
            <span className="text-[10px] font-semibold text-indigo-300">M FCFA</span>
          </div>
        </div>
      </div>

      {/* Navigation Interne (Tabs) - Collante au défilement */}
      <div className="sticky top-[45px] z-10 bg-[#F4F7FA]/95 backdrop-blur-sm py-2">
        <Tabs tabs={tabOptions} activeTab={activeTab} onChange={setActiveTab} isSidebarCollapsed={isSidebarCollapsed} />
      </div>

      {/* Content wrapper */}
      <div className="bg-white rounded-[3px] border border-slate-200 shadow-sm overflow-hidden">
        
        {/* --- Indicateur de Base --- */}
        {activeTab === 'aib' && (
          <div className="fade-in">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-[#1a2542]">EP21 - Approche Indicateur de Base (AIB)</h3>
                <p className="text-xs text-slate-500">Calcul basé sur les produits bruts des trois dernières années.</p>
              </div>
              <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded border border-indigo-100">
                Exigence: {formatMoney(exigenceAIB)} M FCFA
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b-2 border-slate-100">
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Élément</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Valeur (M FCFA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-[13px] text-slate-700 font-medium">Produit brut - Année n-1</td>
                    <td className="p-4 text-[13px] text-right text-slate-600 font-medium">{formatMoney(getVal("EP21_PB_N1"))}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-[13px] text-slate-700 font-medium">Produit brut - Année n-2</td>
                    <td className="p-4 text-[13px] text-right text-slate-600 font-medium">{formatMoney(getVal("EP21_PB_N2"))}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-[13px] text-slate-700 font-medium">Produit brut - Année n-3</td>
                    <td className="p-4 text-[13px] text-right text-slate-600 font-medium">{formatMoney(getVal("EP21_PB_N3"))}</td>
                  </tr>
                  <tr className="bg-indigo-50/10 font-bold">
                    <td className="p-4 text-[13px] text-slate-900 font-bold">Moyenne des produits bruts positifs</td>
                    <td className="p-4 text-[13px] text-right text-[#1a2542] font-black">{formatMoney(getVal("EP21_MOYENNE_PB"))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- Pertes Constatées --- */}
        {activeTab === 'pertes' && (
          <div className="fade-in">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-[#1a2542]">EP22 / EP24 - Pertes par Catégories d'événements</h3>
                <p className="text-xs text-slate-500">Collecte et suivi des incidents et pertes opérationnelles.</p>
              </div>
              <span className="bg-rose-50 text-rose-700 text-xs font-bold px-2.5 py-1 rounded border border-rose-100">
                Pertes Totales: {formatMoney(totalPertesMontant)} M FCFA
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b-2 border-slate-100">
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest min-w-[200px]">Catégories d'événements</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Nombre</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Montant total</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Perte max</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Somme Top 5</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {CATEGORIES_PERTES.map((cat, idx) => (
                    <tr key={`EP22_${cat.id}`} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-[13px] text-slate-700 font-medium flex items-center gap-3">
                        <span className="w-6 h-6 rounded bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                        {cat.label}
                      </td>
                      <td className="p-4 text-[13px] text-right text-slate-600 font-medium">{formatMoney(getVal(`EP22_${cat.id}_NB`))}</td>
                      <td className="p-4 text-[13px] text-right text-slate-900 font-bold">{formatMoney(getVal(`EP22_${cat.id}_MONTANT`))}</td>
                      <td className="p-4 text-[13px] text-right text-slate-600 font-medium">{formatMoney(getVal(`EP22_${cat.id}_MAX`))}</td>
                      <td className="p-4 text-[13px] text-right text-slate-600 font-medium">{formatMoney(getVal(`EP22_${cat.id}_TOP5`))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- Approche Standard --- */}
        {activeTab === 'as' && (
          <div className="fade-in">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-[#1a2542]">EP23 - Approche Standard (AS)</h3>
                <p className="text-xs text-slate-500">Exigences calculées par ligne de métier avec coefficients Beta.</p>
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded border border-emerald-100">
                Exigence AS: {formatMoney(exigenceAS)} M FCFA
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b-2 border-slate-100">
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest min-w-[200px]">Lignes de métier</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">PB n-1</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">PB n-2</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">PB n-3</th>
                    <th className="p-4 text-[11px] font-bold text-slate-700 uppercase tracking-widest text-right bg-slate-50">PB Moyen</th>
                    <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center w-20">Bêta</th>
                    <th className="p-4 text-[11px] font-bold text-indigo-600 uppercase tracking-widest text-right bg-indigo-50/30">Exigence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {LIGNES_METIER_AS.map((lm, idx) => (
                    <tr key={`EP23_${lm.id}`} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 text-[13px] text-slate-700 font-medium flex items-center gap-3">
                        <span className="w-6 h-6 rounded bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                        {lm.label}
                      </td>
                      <td className="p-4 text-[13px] text-right text-slate-500 font-medium">{formatMoney(getVal(`EP23_${lm.id}_PB_N1`))}</td>
                      <td className="p-4 text-[13px] text-right text-slate-500 font-medium">{formatMoney(getVal(`EP23_${lm.id}_PB_N2`))}</td>
                      <td className="p-4 text-[13px] text-right text-slate-500 font-medium">{formatMoney(getVal(`EP23_${lm.id}_PB_N3`))}</td>
                      <td className="p-4 text-[13px] text-right text-slate-800 font-black bg-slate-50/50">{formatMoney(getVal(`EP23_${lm.id}_PB_MOY`))}</td>
                      <td className="p-4 text-[12px] text-center text-slate-500 font-bold">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">{lm.beta * 100}%</span>
                      </td>
                      <td className="p-4 text-[14px] text-right text-[#1a2542] font-black bg-indigo-50/10 group-hover:bg-indigo-50/30 transition-colors">{formatMoney(getVal(`EP23_${lm.id}_EXIGENCE`))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
