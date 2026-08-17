import React, { useState } from 'react';
import type { SolvabiliteAnalyse } from '@heyfodep/kernel';
import { CATEGORIES_PERTES, LIGNES_METIER_AS } from '@heyfodep/kernel';
import { Tabs, type TabOption } from '../components/Tabs';

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
    <div className="space-y-6 fade-in pb-12">
      {/* Navigation Interne (Tabs) - Collante au défilement (100% Opaque) */}
      <div className="sticky top-12 z-20 bg-[#F4F7FA] py-3 -mt-3 pb-3 border-b border-slate-200/40 shadow-xs">
        <Tabs tabs={tabOptions} activeTab={activeTab} onChange={setActiveTab} isSidebarCollapsed={isSidebarCollapsed} />
      </div>

      {/* Content wrapper */}
      <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm overflow-hidden fade-in">
        
        {/* --- Indicateur de Base --- */}
        {activeTab === 'aib' && (
          <div>
            <div className="flex items-center justify-between gap-4 px-5 py-3.5 bg-[#1a2542]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1 h-8 rounded-full" style={{ backgroundColor: '#6366f1' }} />
                <h4 className="text-[13px] font-bold text-white leading-tight tracking-wide">EP21 - Approche Indicateur de Base (AIB)</h4>
              </div>
              <span className="shrink-0 text-[10px] font-bold text-indigo-200 tabular-nums">Exigence: {formatMoney(exigenceAIB)} M FCFA</span>
            </div>
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
                  <tr className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors">
                    <td className="py-2.5 pr-2 text-[9px] font-black text-indigo-700 align-middle">01</td>
                    <td className="py-2.5 pr-3 align-middle">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11.5px] font-semibold text-[#1a2542] leading-snug">Produit brut - Année n-1</span>
                        <span className="font-mono text-[9px] font-bold text-indigo-400 bg-indigo-50/60 rounded-sm px-1.5 py-[2px] leading-none self-start tracking-tight">EP21_PB_N1</span>
                      </div>
                    </td>
                    <td className="py-2.5 pl-3 text-right text-[11.5px] font-bold text-[#1a2542] tabular-nums align-middle">{formatMoney(getVal("EP21_PB_N1"))}</td>
                  </tr>
                  <tr className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors">
                    <td className="py-2.5 pr-2 text-[9px] font-black text-indigo-700 align-middle">02</td>
                    <td className="py-2.5 pr-3 align-middle">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11.5px] font-semibold text-[#1a2542] leading-snug">Produit brut - Année n-2</span>
                        <span className="font-mono text-[9px] font-bold text-indigo-400 bg-indigo-50/60 rounded-sm px-1.5 py-[2px] leading-none self-start tracking-tight">EP21_PB_N2</span>
                      </div>
                    </td>
                    <td className="py-2.5 pl-3 text-right text-[11.5px] font-bold text-[#1a2542] tabular-nums align-middle">{formatMoney(getVal("EP21_PB_N2"))}</td>
                  </tr>
                  <tr className="border-b border-slate-100 last:border-b-0 hover:bg-indigo-50/30 transition-colors">
                    <td className="py-2.5 pr-2 text-[9px] font-black text-indigo-700 align-middle">03</td>
                    <td className="py-2.5 pr-3 align-middle">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11.5px] font-semibold text-[#1a2542] leading-snug">Produit brut - Année n-3</span>
                        <span className="font-mono text-[9px] font-bold text-indigo-400 bg-indigo-50/60 rounded-sm px-1.5 py-[2px] leading-none self-start tracking-tight">EP21_PB_N3</span>
                      </div>
                    </td>
                    <td className="py-2.5 pl-3 text-right text-[11.5px] font-bold text-[#1a2542] tabular-nums align-middle">{formatMoney(getVal("EP21_PB_N3"))}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-indigo-50/70 border-t border-indigo-100">
                    <td colSpan={2} className="py-2.5 pr-2 text-[10.5px] font-black text-blue-900 uppercase tracking-wide">Moyenne des produits bruts positifs</td>
                    <td className="py-2.5 pl-3 text-right text-sm font-black text-indigo-700 tabular-nums">{formatMoney(getVal("EP21_MOYENNE_PB"))} <span className="text-[9px] font-bold text-blue-800">M FCFA</span></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* --- Pertes Constatées --- */}
        {activeTab === 'pertes' && (
          <div>
            <div className="flex items-center justify-between gap-4 px-5 py-3.5 bg-[#1a2542]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1 h-8 rounded-full" style={{ backgroundColor: '#f43f5e' }} />
                <h4 className="text-[13px] font-bold text-white leading-tight tracking-wide">EP22 / EP24 - Pertes par Catégories d'événements</h4>
              </div>
              <span className="shrink-0 text-[10px] font-bold text-rose-200 tabular-nums">Pertes Totales: {formatMoney(totalPertesMontant)} M FCFA</span>
            </div>
            <div className="px-5 py-4 fade-in">
              <table className="w-full">
                <thead>
                  <tr className="text-[9.5px] font-bold uppercase tracking-wider text-blue-900 border-b border-slate-200">
                    <th className="text-left py-2 pr-2 w-9">#</th>
                    <th className="text-left py-2 pr-3">Catégories d'événements</th>
                    <th className="text-right py-2 px-3">Nombre</th>
                    <th className="text-right py-2 px-3">Perte max</th>
                    <th className="text-right py-2 px-3">Somme Top 5</th>
                    <th className="text-right py-2 pl-3">Montant total (M FCFA)</th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES_PERTES.map((cat, idx) => (
                    <tr key={`EP22_${cat.id}`} className="border-b border-slate-100 last:border-b-0 hover:bg-indigo-50/30 transition-colors">
                      <td className="py-2.5 pr-2 text-[9px] font-black text-indigo-700 align-middle">{String(idx + 1).padStart(2, '0')}</td>
                      <td className="py-2.5 pr-3 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] font-bold text-indigo-400 bg-indigo-50/60 rounded-sm px-1.5 py-[2px] leading-none shrink-0 tracking-tight">EP22_{cat.id}</span>
                          <span className="text-[11px] font-semibold text-blue-900 leading-snug">{cat.label}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-[11.5px] font-medium text-slate-700 tabular-nums align-middle">{formatMoney(getVal(`EP22_${cat.id}_NB`))}</td>
                      <td className="py-2.5 px-3 text-right text-[11.5px] font-medium text-slate-700 tabular-nums align-middle">{formatMoney(getVal(`EP22_${cat.id}_MAX`))}</td>
                      <td className="py-2.5 px-3 text-right text-[11.5px] font-medium text-slate-700 tabular-nums align-middle">{formatMoney(getVal(`EP22_${cat.id}_TOP5`))}</td>
                      <td className="py-2.5 pl-3 text-right text-[11.5px] font-bold text-[#1a2542] tabular-nums align-middle">{formatMoney(getVal(`EP22_${cat.id}_MONTANT`))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- Approche Standard --- */}
        {activeTab === 'as' && (
          <div>
            <div className="flex items-center justify-between gap-4 px-5 py-3.5 bg-[#1a2542]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1 h-8 rounded-full" style={{ backgroundColor: '#10b981' }} />
                <h4 className="text-[13px] font-bold text-white leading-tight tracking-wide">EP23 - Approche Standard (AS)</h4>
              </div>
              <span className="shrink-0 text-[10px] font-bold text-emerald-200 tabular-nums">Exigence AS: {formatMoney(exigenceAS)} M FCFA</span>
            </div>
            <div className="px-5 py-4 fade-in overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[9.5px] font-bold uppercase tracking-wider text-blue-900 border-b border-slate-200">
                    <th className="text-left py-2 pr-2 w-9">#</th>
                    <th className="text-left py-2 pr-3 min-w-[200px]">Lignes de métier</th>
                    <th className="text-right py-2 px-3">PB n-1</th>
                    <th className="text-right py-2 px-3">PB n-2</th>
                    <th className="text-right py-2 px-3">PB n-3</th>
                    <th className="text-right py-2 px-3 bg-slate-50/50">PB Moyen</th>
                    <th className="text-center py-2 px-3">Bêta</th>
                    <th className="text-right py-2 pl-3">Exigence (M FCFA)</th>
                  </tr>
                </thead>
                <tbody>
                  {LIGNES_METIER_AS.map((lm, idx) => (
                    <tr key={`EP23_${lm.id}`} className="border-b border-slate-100 last:border-b-0 hover:bg-indigo-50/30 transition-colors group">
                      <td className="py-2.5 pr-2 text-[9px] font-black text-indigo-700 align-middle">{String(idx + 1).padStart(2, '0')}</td>
                      <td className="py-2.5 pr-3 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] font-bold text-indigo-400 bg-indigo-50/60 rounded-sm px-1.5 py-[2px] leading-none shrink-0 tracking-tight">EP23_{lm.id}</span>
                          <span className="text-[11px] font-semibold text-blue-900 leading-snug">{lm.label}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-[11.5px] font-medium text-slate-600 tabular-nums align-middle">{formatMoney(getVal(`EP23_${lm.id}_PB_N1`))}</td>
                      <td className="py-2.5 px-3 text-right text-[11.5px] font-medium text-slate-600 tabular-nums align-middle">{formatMoney(getVal(`EP23_${lm.id}_PB_N2`))}</td>
                      <td className="py-2.5 px-3 text-right text-[11.5px] font-medium text-slate-600 tabular-nums align-middle">{formatMoney(getVal(`EP23_${lm.id}_PB_N3`))}</td>
                      <td className="py-2.5 px-3 text-right text-[11.5px] font-bold text-slate-800 bg-slate-50/50 tabular-nums align-middle">{formatMoney(getVal(`EP23_${lm.id}_PB_MOY`))}</td>
                      <td className="py-2.5 px-3 text-center text-[10px] font-bold text-indigo-600 align-middle">{lm.beta * 100}%</td>
                      <td className="py-2.5 pl-3 text-right text-[11.5px] font-black text-[#1a2542] group-hover:text-indigo-700 transition-colors tabular-nums align-middle">{formatMoney(getVal(`EP23_${lm.id}_EXIGENCE`))}</td>
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



