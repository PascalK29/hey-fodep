import React, { useState } from 'react';
import type { SolvabiliteAnalyse } from '@heyfodep/kernel';
import { CATEGORIES_EXPOSITIONS } from '@heyfodep/kernel';
import { Tabs, type TabOption } from '../components/Tabs';
import { KpiCard } from '../components/KpiCard';

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

export const RisqueCreditView: React.FC<RisqueCreditViewProps> = ({ solva, isSidebarCollapsed }) => {
  const [activeTab, setActiveTab] = useState('bilan');
  const { valeurs } = solva;

  const getVal = (code: string) => {
    return valeurs.get(code)?.toNumber() || 0;
  };

  const totalAprCredit = getVal("RC_TOTAL_APR");
  
  // Calculs pour les KPIs globaux
  const totalBilanBrut = CATEGORIES_EXPOSITIONS.reduce((acc, cat) => acc + getVal(`EP09_${cat.id}_BRUT`), 0);
  const totalHorsBilanBrut = CATEGORIES_EXPOSITIONS.reduce((acc, cat) => acc + getVal(`EP10_${cat.id}_BRUT_AVANT`), 0);
  const totalProvisions = CATEGORIES_EXPOSITIONS.reduce((acc, cat) => acc + getVal(`EP09_${cat.id}_PROV`) + getVal(`EP10_${cat.id}_PROV`), 0);
  
  const totalExpositionNetteBilan = CATEGORIES_EXPOSITIONS.reduce((acc, cat) => acc + getVal(`EP09_${cat.id}_NET`), 0);
  const totalExpositionNetteHorsBilan = CATEGORIES_EXPOSITIONS.reduce((acc, cat) => acc + getVal(`EP10_${cat.id}_NET`), 0);

  const tabOptions: TabOption[] = [
    { id: 'bilan', label: 'Bilan' },
    { id: 'hors-bilan', label: 'Hors Bilan' },
    { id: 'attenuation', label: 'Atténuation & APR' },
  ];

  return (
    <div className="space-y-8 max-w-full mx-auto fade-in">
      {/* KPIs Globaux - Haut niveau */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Total Exposition Bilan" 
          value={formatMoney(totalBilanBrut)} 
          unit="M FCFA" 
          colorScheme="blue" 
        />
        <KpiCard 
          title="Total Hors Bilan" 
          value={formatMoney(totalHorsBilanBrut)} 
          unit="M FCFA" 
          colorScheme="slate" 
        />
        <KpiCard 
          title="Total Provisions" 
          value={formatMoney(totalProvisions)} 
          unit="M FCFA" 
          colorScheme="rose" 
        />
        <div className="bg-[#1a2542] rounded-[3px] border border-indigo-900 shadow-sm p-4 flex flex-col justify-between text-white hover:shadow-md transition-all duration-300">
          <div className="mb-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-indigo-200 leading-tight">Total APR Crédit</h3>
          </div>
          <div className="flex items-baseline space-x-1 mt-auto">
            <span className="text-xl font-bold tracking-tight text-white">{formatMoney(totalAprCredit)}</span>
            <span className="text-xs font-semibold text-indigo-300">M FCFA</span>
          </div>
        </div>
      </div>

      {/* Navigation Interne (Tabs) - Collante au défilement */}
      <div className="sticky top-[45px] z-10 bg-[#F4F7FA]/95 backdrop-blur-sm py-2">
        <Tabs tabs={tabOptions} activeTab={activeTab} onChange={setActiveTab} isSidebarCollapsed={isSidebarCollapsed} />
      </div>

      {/* Contenu dynamique par Onglet */}
      <div className="bg-white rounded-[3px] border border-slate-200 shadow-sm overflow-hidden">
        
        {/* --- ONGLET BILAN (EP09) --- */}
        {activeTab === 'bilan' && (
          <div className="fade-in">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-[#1a2542]">EP09 - Exposition totale au bilan</h3>
                <p className="text-sm text-slate-500">Détail des expositions nettes après provisions et déductions.</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Exposition Nette</span>
                <span className="text-lg font-black text-indigo-600">{formatMoney(totalExpositionNetteBilan)} <span className="text-sm text-slate-500 font-medium">M FCFA</span></span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b-2 border-slate-100">
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest min-w-[250px]">Catégories d'expositions</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Expo brute</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Créances souff. / risq.</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right text-rose-500">(-) Déductions</th>
                    <th className="p-4 text-[11px] font-bold text-indigo-600 uppercase tracking-widest text-right bg-indigo-50/30">Expo nette</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {CATEGORIES_EXPOSITIONS.map((cat, idx) => {
                    const brut = getVal(`EP09_${cat.id}_BRUT`);
                    const souff = getVal(`EP09_${cat.id}_CS`) + getVal(`EP09_${cat.id}_CRE`);
                    const deduc = getVal(`EP09_${cat.id}_PROV`) + getVal(`EP09_${cat.id}_DED`);
                    const net = getVal(`EP09_${cat.id}_NET`);
                    return (
                      <tr key={`EP09_${cat.id}`} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4 text-[13px] text-slate-700 font-medium flex items-center gap-3">
                          <span className="w-6 h-6 rounded bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                          {cat.label}
                        </td>
                        <td className="p-4 text-[13px] text-right text-slate-600 font-medium">{formatMoney(brut)}</td>
                        <td className="p-4 text-[13px] text-right text-amber-600 font-medium">{formatMoney(souff)}</td>
                        <td className="p-4 text-[13px] text-right text-rose-500 font-medium">-{formatMoney(deduc)}</td>
                        <td className="p-4 text-[14px] text-right text-[#1a2542] font-black bg-indigo-50/10 group-hover:bg-indigo-50/30 transition-colors">{formatMoney(net)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- ONGLET HORS BILAN (EP10) --- */}
        {activeTab === 'hors-bilan' && (
          <div className="fade-in">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-[#1a2542]">EP10 - Engagements totaux hors bilan</h3>
                <p className="text-sm text-slate-500">Expositions après Facteur de Conversion en Equivalent Crédit (FCEC).</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Exposition Nette</span>
                <span className="text-lg font-black text-indigo-600">{formatMoney(totalExpositionNetteHorsBilan)} <span className="text-sm text-slate-500 font-medium">M FCFA</span></span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b-2 border-slate-100">
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest min-w-[250px]">Catégories d'expositions</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Avant FCEC</th>
                    <th className="p-4 text-[11px] font-bold text-blue-600 uppercase tracking-widest text-right">Après FCEC</th>
                    <th className="p-4 text-[11px] font-bold text-rose-500 uppercase tracking-widest text-right">(-) Provisions</th>
                    <th className="p-4 text-[11px] font-bold text-indigo-600 uppercase tracking-widest text-right bg-indigo-50/30">Expo nette</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {CATEGORIES_EXPOSITIONS.map((cat, idx) => (
                    <tr key={`EP10_${cat.id}`} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 text-[13px] text-slate-700 font-medium flex items-center gap-3">
                        <span className="w-6 h-6 rounded bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                        {cat.label}
                      </td>
                      <td className="p-4 text-[13px] text-right text-slate-500 font-medium">{formatMoney(getVal(`EP10_${cat.id}_BRUT_AVANT`))}</td>
                      <td className="p-4 text-[13px] text-right text-blue-600 font-medium">{formatMoney(getVal(`EP10_${cat.id}_BRUT_APRES`))}</td>
                      <td className="p-4 text-[13px] text-right text-rose-500 font-medium">-{formatMoney(getVal(`EP10_${cat.id}_PROV`))}</td>
                      <td className="p-4 text-[14px] text-right text-[#1a2542] font-black bg-indigo-50/10 group-hover:bg-indigo-50/30 transition-colors">{formatMoney(getVal(`EP10_${cat.id}_NET`))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- ONGLET ATTENUATION & APR (EP12-20) --- */}
        {activeTab === 'attenuation' && (
          <div className="fade-in">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-[#1a2542]">EP12 à EP20 - Atténuation et Actifs Pondérés</h3>
                <p className="text-sm text-slate-500">Calcul des Actifs Pondérés des Risques (APR) après ajustement ARC.</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total APR</span>
                <span className="text-lg font-black text-indigo-600">{formatMoney(totalAprCredit)} <span className="text-sm text-slate-500 font-medium">M FCFA</span></span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b-2 border-slate-100">
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest min-w-[200px]">Catégories d'expositions</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Nette (Avant ARC)</th>
                    <th className="p-4 text-[11px] font-bold text-amber-600 uppercase tracking-widest text-right">Ajust. ARC</th>
                    <th className="p-4 text-[11px] font-bold text-slate-700 uppercase tracking-widest text-right bg-slate-50">Après ARC</th>
                    <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right text-center w-24">Pond.</th>
                    <th className="p-4 text-[11px] font-bold text-indigo-600 uppercase tracking-widest text-right bg-indigo-50/30">Actifs pondérés</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {CATEGORIES_EXPOSITIONS.map((cat, idx) => {
                    const pond = getVal(`EP12_20_${cat.id}_POND`);
                    return (
                      <tr key={`EP12_20_${cat.id}`} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4 text-[13px] text-slate-700 font-medium flex items-center gap-3">
                          <span className="w-6 h-6 rounded bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                          <span className="truncate max-w-[200px] block" title={cat.label}>{cat.label}</span>
                        </td>
                        <td className="p-4 text-[13px] text-right text-slate-500 font-medium">{formatMoney(getVal(`EP12_20_${cat.id}_AVANT_ARC`))}</td>
                        <td className="p-4 text-[13px] text-right text-amber-600 font-bold">{formatMoney(getVal(`EP12_20_${cat.id}_AJUST_ARC`))}</td>
                        <td className="p-4 text-[13px] text-right text-slate-800 font-black bg-slate-50/50">{formatMoney(getVal(`EP12_20_${cat.id}_APRES_ARC`))}</td>
                        <td className="p-4 text-[12px] text-center text-slate-500 font-bold">
                          {pond > 0 ? (
                            <span className="px-2 py-1 bg-slate-100 rounded text-slate-600">{pond}%</span>
                          ) : '-'}
                        </td>
                        <td className="p-4 text-[14px] text-right text-[#1a2542] font-black bg-indigo-50/10 group-hover:bg-indigo-50/30 transition-colors">{formatMoney(getVal(`EP12_20_${cat.id}_APR`))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
};
