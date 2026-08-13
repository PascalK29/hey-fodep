import React, { useMemo } from 'react';
import { analyseRisqueMarche } from '@heyfodep/kernel';
import { type SolvabiliteAnalyse } from '@heyfodep/kernel';
import { KpiCard } from '../components/KpiCard';

interface RisqueMarcheViewProps {
  solva: SolvabiliteAnalyse;
}

const formatMoney = (val?: number) => {
  if (val === undefined || isNaN(val)) return '0';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

export const RisqueMarcheView: React.FC<RisqueMarcheViewProps> = ({ solva }) => {
  const resultats = useMemo(() => {
    const inputs: Record<string, string | number> = {};
    solva.valeurs.forEach((val: any, key: string) => inputs[key] = val.toNumber());
    return analyseRisqueMarche(inputs);
  }, [solva]);

  const getVal = (code: string) => solva.valeurs.get(code)?.toNumber() || 0;

  const aprTotal = resultats.aprTotal.toNumber();
  const exigenceTaux = resultats.exigenceTaux.toNumber();
  const exigenceActions = resultats.exigenceActions.toNumber();
  const exigenceChange = resultats.exigenceChange.toNumber();
  const exigenceMatPrem = resultats.exigenceMatPrem.toNumber();

  return (
    <div className="space-y-6 fade-in pb-12">
      {/* KPIs Globaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Exigence Taux (EP26)" 
          value={formatMoney(exigenceTaux)} 
          unit="M FCFA" 
          colorScheme="slate" 
        />
        <KpiCard 
          title="Exigence Actions (EP28)" 
          value={formatMoney(exigenceActions)} 
          unit="M FCFA" 
          colorScheme="slate" 
        />
        <KpiCard 
          title="Exigence Change (EP36)" 
          value={formatMoney(exigenceChange)} 
          unit="M FCFA" 
          colorScheme="slate" 
        />
        <div className="bg-[#1a2542] rounded-[3px] border border-indigo-900 shadow-sm p-4 flex flex-col justify-between text-white hover:shadow-md transition-all duration-300">
          <div className="mb-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-indigo-200 leading-tight">Total APR Marché</h3>
          </div>
          <div className="flex items-baseline space-x-1 mt-auto">
            <span className="text-xl font-bold tracking-tight text-white">{formatMoney(aprTotal)}</span>
            <span className="text-xs font-semibold text-indigo-300">M FCFA</span>
          </div>
        </div>
      </div>

      {/* Grid des formulaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* EP25: Risque de Taux */}
        <div className="bg-white border border-slate-200 rounded-[3px] shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-50/50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-[#1a2542] text-sm uppercase tracking-wider">
              EP25 - Risque de Taux d'Intérêt
            </h3>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded border border-indigo-100">
              Exigence EP26: {formatMoney(exigenceTaux)} M
            </span>
          </div>
          <div className="p-5 flex-1 flex flex-col space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Risque Spécifique (Titres de créance)
              </label>
              <input
                type="text"
                disabled
                value={formatMoney(getVal("EP25_TAUX_SPECIFIQUE"))}
                className="w-full text-right bg-slate-50 border border-slate-200 rounded-[3px] px-3 py-2 text-sm text-slate-700 font-bold tabular-nums cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Risque Général (Titres de créance)
              </label>
              <input
                type="text"
                disabled
                value={formatMoney(getVal("EP25_TAUX_GENERAL"))}
                className="w-full text-right bg-slate-50 border border-slate-200 rounded-[3px] px-3 py-2 text-sm text-slate-700 font-bold tabular-nums cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* EP27: Actions */}
        <div className="bg-white border border-slate-200 rounded-[3px] shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-50/50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-[#1a2542] text-sm uppercase tracking-wider">
              EP27 - Risque sur Titres de Propriété
            </h3>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded border border-indigo-100">
              Exigence EP28: {formatMoney(exigenceActions)} M
            </span>
          </div>
          <div className="p-5 flex-1 flex flex-col space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Risque Spécifique (Actions)
              </label>
              <input
                type="text"
                disabled
                value={formatMoney(getVal("EP27_ACTIONS_SPECIFIQUE"))}
                className="w-full text-right bg-slate-50 border border-slate-200 rounded-[3px] px-3 py-2 text-sm text-slate-700 font-bold tabular-nums cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Risque Général (Actions)
              </label>
              <input
                type="text"
                disabled
                value={formatMoney(getVal("EP27_ACTIONS_GENERAL"))}
                className="w-full text-right bg-slate-50 border border-slate-200 rounded-[3px] px-3 py-2 text-sm text-slate-700 font-bold tabular-nums cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* EP35: Change */}
        <div className="bg-white border border-slate-200 rounded-[3px] shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-50/50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-[#1a2542] text-sm uppercase tracking-wider">
              EP35 - Risque de Change
            </h3>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded border border-indigo-100">
              Exigence EP36: {formatMoney(exigenceChange)} M
            </span>
          </div>
          <div className="p-5 flex-1 flex flex-col space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Position Nette Globale de Change
              </label>
              <input
                type="text"
                disabled
                value={formatMoney(getVal("EP35_CHANGE_POSITION_NETTE"))}
                className="w-full text-right bg-slate-50 border border-slate-200 rounded-[3px] px-3 py-2 text-sm text-slate-700 font-bold tabular-nums cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* EP37: Matières Premières */}
        <div className="bg-white border border-slate-200 rounded-[3px] shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-50/50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-[#1a2542] text-sm uppercase tracking-wider">
              EP37 - Risque Matières Premières
            </h3>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded border border-indigo-100">
              Exigence EP38: {formatMoney(exigenceMatPrem)} M
            </span>
          </div>
          <div className="p-5 flex-1 flex flex-col space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Position nette Matières Premières
              </label>
              <input
                type="text"
                disabled
                value={formatMoney(getVal("EP37_MATPREM_POSITION"))}
                className="w-full text-right bg-slate-50 border border-slate-200 rounded-[3px] px-3 py-2 text-sm text-slate-700 font-bold tabular-nums cursor-not-allowed"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
