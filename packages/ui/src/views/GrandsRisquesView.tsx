import React, { useMemo } from 'react';
import { analyseGrandsRisques } from '@heyfodep/kernel';
import { type SolvabiliteAnalyse } from '@heyfodep/kernel';
import { KpiCard } from '../components/KpiCard';

interface GrandsRisquesViewProps {
  solva: SolvabiliteAnalyse;
}

const formatMoney = (val?: number) => {
  if (val === undefined || isNaN(val)) return '0';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

export const GrandsRisquesView: React.FC<GrandsRisquesViewProps> = ({ solva }) => {
  const resultats = useMemo(() => {
    const inputs: Record<string, string | number> = {};
    solva.valeurs.forEach((val: any, key: string) => inputs[key] = val.toNumber());
    return analyseGrandsRisques(inputs);
  }, [solva]);

  const getVal = (code: string) => solva.valeurs.get(code)?.toNumber() || 0;

  const isGlobalRatioWarning = resultats.ratioGlobal.toNumber() > resultats.limiteReglementaire.toNumber();

  return (
    <div className="space-y-6 fade-in pb-12">
      {/* KPIs Globaux */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard 
          title="Fonds Propres Effectifs (FPI42)" 
          value={formatMoney(getVal("FPI42"))} 
          unit="M FCFA" 
          colorScheme="slate" 
        />
        <KpiCard 
          title="Total des Expositions" 
          value={formatMoney(getVal("EP40_TOTAL_EXPOSITIONS"))} 
          unit="M FCFA" 
          colorScheme="slate" 
        />
        <KpiCard 
          title="Ratio Global" 
          value={`${resultats.ratioGlobal.toNumber().toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`} 
          unit={`Limite ${resultats.limiteReglementaire.toNumber()}%`} 
          colorScheme={isGlobalRatioWarning ? 'rose' : 'emerald'} 
        />
      </div>

      {/* Formulaire EP40 */}
      <div className="bg-white border border-slate-200 rounded-[3px] shadow-sm overflow-hidden flex flex-col">
        <div className="bg-slate-50/50 px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-[#1a2542] text-sm uppercase tracking-wider">
            EP40 - Déclaration des Grands Risques
          </h3>
        </div>
        <div className="p-5 flex-1 flex flex-col space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Fonds Propres Effectifs (FPI42)
            </label>
            <input
              type="text"
              disabled
              value={formatMoney(getVal("FPI42"))}
              className="w-full text-right bg-slate-50 border border-slate-200 rounded-[3px] px-3 py-2 text-sm text-slate-700 font-bold tabular-nums cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">Valeur réglementaire consolidée depuis la section des Fonds Propres.</p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Total des Expositions (Grands Risques)
            </label>
            <input
              type="text"
              disabled
              value={formatMoney(getVal("EP40_TOTAL_EXPOSITIONS"))}
              className="w-full text-right bg-slate-50 border border-slate-200 rounded-[3px] px-3 py-2 text-sm text-slate-700 font-bold tabular-nums cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
