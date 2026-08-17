import React, { useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { saveAs } from 'file-saver';
import type { SolvabiliteAnalyse } from '@heyfodep/kernel';
import { exportOfficialFodepFile } from '../lib/excel';

export const ExportView: React.FC<{ solva: SolvabiliteAnalyse }> = ({ solva }) => {
  const [format, setFormat] = useState<'excel' | 'json'>('excel');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (format === 'excel') {
        await exportOfficialFodepFile(solva);
      } else {
        // Export JSON basique
        const data: Record<string, number> = {};
        for (const [key, val] of solva.valeurs.entries()) {
           data[key] = val.toNumber();
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        saveAs(blob, 'FODEP_Donnees_Brutes.json');
      }
    } catch (err) {
      console.error(err);
      alert("Une erreur s'est produite lors de la génération de l'export.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-2xl mt-8 mx-auto fade-in">
      <div className="bg-white rounded-[3px] shadow-[0_4px_14px_rgba(26,37,66,0.06)] p-10 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-[4px] bg-emerald-50 flex items-center justify-center mb-5">
          <Download className="w-7 h-7 text-emerald-600" />
        </div>
        <h2 className="text-xl font-extrabold text-[#1a2542] mb-3">Exporter le rapport FODEP</h2>
        <p className="text-sm text-slate-500 mb-8 max-w-md leading-relaxed">
          Générez et téléchargez le document FODEP complet incluant toutes les sections, indicateurs réglementaires, et formules de calcul.
        </p>
        
        <div className="space-y-4 mb-8 w-full text-left">
          <div 
            onClick={() => setFormat('excel')}
            className={`flex items-center justify-between p-4 bg-white rounded-[3px] shadow-[0_1px_3px_rgba(26,37,66,0.08)] cursor-pointer hover:shadow-[0_6px_16px_rgba(26,37,66,0.14)] hover:-translate-y-0.5 transition-all duration-200 ${format === 'excel' ? 'border-2 border-[#3b49df]' : 'border-2 border-transparent'}`}
          >
            <div className="flex items-center">
              <FileSpreadsheet className={`w-5 h-5 mr-3 ${format === 'excel' ? 'text-[#3b49df]' : 'text-slate-400'}`} />
              <span className={`text-sm font-semibold ${format === 'excel' ? 'text-[#1a2542]' : 'text-slate-600'}`}>Format réglementaire (Excel .xlsx)</span>
            </div>
            <input type="radio" checked={format === 'excel'} onChange={() => setFormat('excel')} className="w-4 h-4 text-[#3b49df]" />
          </div>
          <div 
            onClick={() => setFormat('json')}
            className={`flex items-center justify-between p-4 bg-white rounded-[3px] shadow-[0_1px_3px_rgba(26,37,66,0.06)] cursor-pointer hover:shadow-[0_6px_16px_rgba(26,37,66,0.14)] hover:-translate-y-0.5 transition-all duration-200 ${format === 'json' ? 'border-2 border-[#3b49df]' : 'border-2 border-transparent opacity-80'}`}
          >
            <div className="flex items-center">
              <FileSpreadsheet className={`w-5 h-5 mr-3 ${format === 'json' ? 'text-[#3b49df]' : 'text-slate-400'}`} />
              <span className={`text-sm font-semibold ${format === 'json' ? 'text-[#1a2542]' : 'text-slate-600'}`}>Données brutes (JSON)</span>
            </div>
            <input type="radio" checked={format === 'json'} onChange={() => setFormat('json')} className="w-4 h-4 text-[#3b49df]" />
          </div>
        </div>
        
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className="w-full mt-auto flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 px-4 rounded-[3px] text-sm shadow-[0_4px_12px_rgba(5,150,105,0.3)] hover:shadow-[0_6px_16px_rgba(5,150,105,0.4)] hover:-translate-y-px active:translate-y-0 transition-all duration-200"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isExporting ? 'Génération en cours...' : "Générer et télécharger l'export"}
        </button>
      </div>
    </div>
  );
};
