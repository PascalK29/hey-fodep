import React, { useMemo } from 'react';
import { analyseGrandsRisques, type SolvabiliteAnalyse } from '@heyfodep/kernel';

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
    solva.valeurs.forEach((val: any, key: string) => (inputs[key] = val.toNumber()));
    return analyseGrandsRisques(inputs);
  }, [solva]);

  const getVal = (code: string) => solva.valeurs.get(code)?.toNumber() || 0;

  const ratioGlobal = resultats.ratioGlobal.toNumber();
  const limiteReglementaire = resultats.limiteReglementaire.toNumber();
  const limiteIndividuelle = 25; // 25% des fonds propres
  const isWarning = ratioGlobal > limiteReglementaire;

  return (
    <div className="space-y-6 fade-in pb-12">

      {/* ── Tableau de synthèse ── */}
      <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#1a2542] text-white">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 rounded-full bg-amber-400" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Grands Risques — EP40</h3>
              <p className="text-[10px] text-blue-200">Exposition consolidée & ratio réglementaire</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-bold text-blue-200 uppercase tracking-wider block mb-0.5">Ratio Global</span>
            <span className={`text-base font-black tabular-nums ${isWarning ? 'text-rose-300' : 'text-emerald-300'}`}>
              {ratioGlobal.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
              <span className="text-[10px] font-semibold text-blue-300 ml-1">/ {limiteReglementaire}%</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-[9.5px] font-bold uppercase tracking-wider text-blue-900">
                <th className="py-3 px-5 w-10 text-center">#</th>
                <th className="py-3 px-5">Indicateur</th>
                <th className="py-3 px-5 text-right">Montant (M FCFA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors">
                <td className="py-3 px-5 text-[9px] font-black text-indigo-700 text-center align-middle">01</td>
                <td className="py-3 px-5 align-middle">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11.5px] font-semibold text-[#1a2542] leading-snug">Fonds Propres Effectifs</span>
                    <span className="font-mono text-[9px] font-bold text-indigo-400 bg-indigo-50/60 rounded-sm px-1.5 py-[2px] leading-none self-start tracking-tight">FPI42</span>
                  </div>
                </td>
                <td className="py-3 px-5 text-right text-[11.5px] font-bold text-[#1a2542] tabular-nums align-middle">
                  {formatMoney(getVal('FPI42'))}
                </td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors">
                <td className="py-3 px-5 text-[9px] font-black text-indigo-700 text-center align-middle">02</td>
                <td className="py-3 px-5 align-middle">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11.5px] font-semibold text-[#1a2542] leading-snug">Total des Expositions (Grands Risques)</span>
                    <span className="font-mono text-[9px] font-bold text-indigo-400 bg-indigo-50/60 rounded-sm px-1.5 py-[2px] leading-none self-start tracking-tight">EP40_TOTAL_EXPOSITIONS</span>
                  </div>
                </td>
                <td className="py-3 px-5 text-right text-[11.5px] font-bold text-[#1a2542] tabular-nums align-middle">
                  {formatMoney(getVal('EP40_TOTAL_EXPOSITIONS'))}
                </td>
              </tr>

              {/* Top 5 Clients */}
              <tr>
                <td colSpan={3} className="py-4 px-5 bg-slate-50/80 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Top 5 - Limite individuelle (25% FP Nets)</span>
                </td>
              </tr>

              {[1, 2, 3, 4, 5].map((i) => {
                const expo = getVal(`EP40_C${i}_EXPO`);
                const ratio = getVal(`EP40_C${i}_RATIO`);
                const isIndivWarning = ratio > limiteIndividuelle;
                
                return (
                  <tr key={`EP40_C${i}`} className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3 px-5 text-[9px] font-black text-indigo-400 text-center align-middle">{String(i+2).padStart(2, '0')}</td>
                    <td className="py-3 px-5 align-middle flex justify-between items-center pr-12">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11.5px] font-semibold text-[#1a2542] leading-snug">Exposition Client {i}</span>
                        <span className="font-mono text-[9px] font-bold text-indigo-400 bg-indigo-50/60 rounded-sm px-1.5 py-[2px] leading-none self-start tracking-tight">EP40_C{i}_EXPO</span>
                      </div>
                      {/* Badge ratio individuel */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tabular-nums ${isIndivWarning ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-600'}`}>
                        {ratio.toFixed(1)}% / 25%
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right text-[11.5px] font-medium text-slate-700 tabular-nums align-middle">
                      {formatMoney(expo)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-indigo-50/80 border-t-2 border-indigo-200">
              <tr>
                <td colSpan={2} className="py-3 px-5 text-[10.5px] font-black text-blue-900 uppercase tracking-wide">
                  Ratio Global des Grands Risques
                </td>
                <td className="py-3 px-5 text-right">
                  <span className={`text-sm font-black tabular-nums ${isWarning ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {ratioGlobal.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                  </span>
                  <span className="text-[9px] text-slate-500 ml-2">
                    Limite : {limiteReglementaire}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
