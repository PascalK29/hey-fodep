import { useState, useEffect } from 'react';
import { 
  LayoutDashboard,
  ShieldCheck,
  Briefcase,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Check,
  ChevronDown,
  Palette,
  Globe,
  Type,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useRef } from 'react';
import { downloadExcelTemplate, parseExcelFile, parseOfficialFodepFile, downloadOfficialFodepTemplate } from './lib/excel';
import type { LucideIcon } from 'lucide-react';


import { analyseSolvabilite, type SolvabiliteAnalyse } from '@heyfodep/kernel';
import { FondsPropresView } from './views/FondsPropresView';
import { ExportView } from './views/ExportView';
import { RisqueCreditView } from './views/RisqueCreditView';
import { RisqueOperationnelView } from './views/RisqueOperationnelView';
import { RisqueMarcheView } from './views/RisqueMarcheView';
import { GrandsRisquesView } from './views/GrandsRisquesView';

// --- Types ---
type TabId = 'dashboard' | 'fonds-propres' | 'credit' | 'marche' | 'operationnel' | 'grands-risques' | 'import' | 'export';

interface ImportResult {
  success: boolean;
  title: string;
  fileName: string;
  indicatorsFound: number;
  message: string;
}

const SECTION_LABELS: Record<TabId, string> = {
  dashboard: 'Tableau de bord',
  'fonds-propres': 'Fonds propres & solvabilité',
  credit: 'Risque de crédit',
  marche: 'Risque de marché',
  operationnel: 'Risque opérationnel',
  'grands-risques': 'Grands risques',
  import: 'Importation de données',
  export: 'Exportation du FODEP',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'clair' | 'sombre'>('clair');
  const [langue, setLangue] = useState<'fr' | 'en'>('fr');
  const [font, setFont] = useState('Segoe UI');
  const [openSetting, setOpenSetting] = useState<'theme' | 'langue' | 'police' | null>('theme');
  const [importType, setImportType] = useState<'template' | 'fodep'>('template');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  
  // Real data state
  const [currentInputs, setCurrentInputs] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('fodep_data');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return {};
  });
  const [analysis, setAnalysis] = useState<SolvabiliteAnalyse>(() => analyseSolvabilite(currentInputs));

  useEffect(() => {
    localStorage.setItem('fodep_data', JSON.stringify(currentInputs));
  }, [currentInputs]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let data: Record<string, number>;
      if (importType === 'fodep') {
        data = await parseOfficialFodepFile(file);
      } else {
        data = await parseExcelFile(file);
      }
      
      const foundCount = Object.keys(data).length;
      
      if (foundCount === 0) {
        setImportResult({
          success: false,
          title: "Fichier vide",
          fileName: file.name,
          indicatorsFound: 0,
          message: "Le fichier est bien reconnu, mais aucune donnée n'a été saisie. Veuillez remplir les valeurs avant de l'importer."
        });
      } else {
        setImportResult({
          success: true,
          title: "Importation validée",
          fileName: file.name,
          indicatorsFound: foundCount,
          message: "L'importation a réussi. Les données ont été validées et mises à jour dans le moteur de calcul."
        });
        
        // Si c'est le fichier FODEP complet, on écrase les anciennes données pour ne pas garder de résidus.
        // Sinon (template), on fusionne avec l'existant.
        const newInputs = importType === 'fodep' ? data : { ...currentInputs, ...data };
        setCurrentInputs(newInputs);
        setAnalysis(analyseSolvabilite(newInputs));
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'import:', error);
      
      let message = "Une erreur inattendue s'est produite lors de la lecture du fichier.";
      if (error.message === "SHEET_ERROR") {
        message = "Ce fichier ne contient aucune des feuilles attendues (ex: fonds-propres, solvabilite). Assurez-vous d'utiliser le bon Modèle de Saisie.";
      } else if (error.message === "SHEET_ERROR_FODEP") {
        message = "Ce fichier ne contient pas les feuilles réglementaires BCEAO (ex: EP01, EP03). Il ne semble pas être un Fichier FODEP Officiel.";
      }

      setImportResult({
        success: false,
        title: "Fichier non reconnu",
        fileName: file.name,
        indicatorsFound: 0,
        message
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const solva = analysis;
  const isConforme = solva.normes.every(n => n.situation === 'conforme');

  const totalGrandsRisques = Number(solva.valeurs.get('EP40_TOTAL_EXPOSITIONS')) || 0;
  const fpEffectifs = Number(solva.fondsPropres.effectifs) || 0;
  const ratioGrandsRisques = fpEffectifs === 0 ? 0 : (totalGrandsRisques / fpEffectifs) * 100;
  const isGrandsRisquesWarning = ratioGrandsRisques > 800;
  const apr = Number(solva.apr);
  const exigenceTotale = (apr * 9) / 100;
  const surplusFP = fpEffectifs - exigenceTotale;

  return (
    <div className="flex flex-col h-screen bg-[#F4F7FA] font-sans text-slate-800 overflow-hidden" style={{ fontFamily: font }}>
      
      {/* Top Navbar */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          {/* Logo encadré */}
          <div className="w-9 h-9 rounded bg-[#1a2542] flex items-center justify-center shadow-xs">
            <img src="/logo3.png" alt="HEY-FODEP" className="h-6 w-6 object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-[#1a2542] font-extrabold text-lg leading-tight tracking-tight">FODEP</span>
            <span className="text-indigo-600 text-[10px] font-semibold leading-tight">Conformité prudentielle BCEAO</span>
          </div>
        </div>

        {/* Paramètres & Date */}
        <div className="relative h-full flex items-center gap-3">
          {/* Pastille Date d'Arrêté */}
          <div className="group relative flex items-center">
            <span className="inline-flex h-7 items-center justify-center rounded bg-indigo-50 px-2.5 text-[11px] font-semibold text-blue-900 cursor-default border border-indigo-100">
              30/06/2026
            </span>
            <span className="pointer-events-none absolute right-0 top-full z-40 mt-2 whitespace-nowrap rounded bg-[#1a2542] px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
              Date d'arrêté
            </span>
          </div>

          <button 
            onClick={() => setSettingsOpen(!settingsOpen)} 
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
              settingsOpen ? 'bg-[#1a2542] text-white shadow-xs' : 'bg-slate-100 text-[#1a2542] hover:bg-slate-200/70'
            }`}
            title="Paramètres"
          >
            <MoreHorizontal className="w-4.5 h-4.5" />
          </button>

          {settingsOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setSettingsOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-md shadow-[0_8px_24px_rgba(26,37,66,0.15)] border border-slate-200 p-1.5 z-40 fade-in">
                <SettingItem icon={Palette} title="Thème" open={openSetting === 'theme'} onToggle={() => setOpenSetting(openSetting === 'theme' ? null : 'theme')}>
                  <Choice label="Clair" active={theme === 'clair'} onClick={() => setTheme('clair')} />
                  <Choice label="Sombre" active={theme === 'sombre'} onClick={() => setTheme('sombre')} />
                </SettingItem>
                <SettingItem icon={Globe} title="Langue" open={openSetting === 'langue'} onToggle={() => setOpenSetting(openSetting === 'langue' ? null : 'langue')}>
                  <Choice label="Français" active={langue === 'fr'} onClick={() => setLangue('fr')} />
                  <Choice label="English" active={langue === 'en'} onClick={() => setLangue('en')} />
                </SettingItem>
                <SettingItem icon={Type} title="Police d'écriture" open={openSetting === 'police'} onToggle={() => setOpenSetting(openSetting === 'police' ? null : 'police')}>
                  <Choice label="Segoe UI" active={font === 'Segoe UI'} onClick={() => setFont('Segoe UI')} />
                  <Choice label="Open Sans" active={font === 'Open Sans'} onClick={() => setFont('Open Sans')} />
                  <Choice label="Poppins" active={font === 'Poppins'} onClick={() => setFont('Poppins')} />
                  <Choice label="Inter" active={font === 'Inter'} onClick={() => setFont('Inter')} />
                  <Choice label="Arial" active={font === 'Arial'} onClick={() => setFont('Arial')} />
                </SettingItem>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar */}
        <aside className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 shrink-0 z-10 ${isCollapsed ? 'w-14' : 'w-60'}`}>
          <div className="p-3 pr-2 flex items-center justify-between h-14 border-b border-slate-100">
            {!isCollapsed && <span className="text-[13px] font-bold text-[#1a2542] ml-1.5">Navigation</span>}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              className={`p-2 rounded-lg text-slate-400 hover:text-[#1a2542] hover:bg-slate-100 transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
              title={isCollapsed ? 'Déplier le menu' : 'Réduire le menu'}
            >
              {isCollapsed ? <ChevronRight className="w-[18px] h-[18px]" /> : <ChevronLeft className="w-[18px] h-[18px]" />}
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-hide">
            <NavSection title="Accueil" isCollapsed={isCollapsed}>
              <NavItem icon={LayoutDashboard} label="Tableau de bord" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} isCollapsed={isCollapsed} />
            </NavSection>

            <NavSection title="Données & Échanges" isCollapsed={isCollapsed}>
              <NavItem icon={Upload} label="Importation" active={activeTab === 'import'} onClick={() => setActiveTab('import')} isCollapsed={isCollapsed} />
              <NavItem icon={Download} label="Exportation" active={activeTab === 'export'} onClick={() => setActiveTab('export')} isCollapsed={isCollapsed} />
            </NavSection>

            <NavSection title="États FODEP" isCollapsed={isCollapsed}>
              <NavItem icon={ShieldCheck} label="Fonds propres & solvabilité" active={activeTab === 'fonds-propres'} onClick={() => setActiveTab('fonds-propres')} isCollapsed={isCollapsed} />
              <NavItem icon={Briefcase} label="Risque de crédit" active={activeTab === 'credit'} onClick={() => setActiveTab('credit')} isCollapsed={isCollapsed} />
              <NavItem icon={TrendingUp} label="Risque de marché" active={activeTab === 'marche'} onClick={() => setActiveTab('marche')} isCollapsed={isCollapsed} />
              <NavItem icon={AlertTriangle} label="Risque opérationnel" active={activeTab === 'operationnel'} onClick={() => setActiveTab('operationnel')} isCollapsed={isCollapsed} />
              <NavItem icon={FileSpreadsheet} label="Grands risques" active={activeTab === 'grands-risques'} onClick={() => setActiveTab('grands-risques')} isCollapsed={isCollapsed} />
            </NavSection>
          </div>

          {isCollapsed ? (
            <div className="p-2 border-t border-slate-200 mt-auto flex justify-center" title="Heymann's Inc">
              <img src="/logo-heymann.png" alt="Heymann's Inc" className="w-9 h-9 object-contain" />
            </div>
          ) : (
            <div className="px-2 pt-1.5 pb-1.5 border-t border-slate-200 mt-auto">
              <div className="text-[10px] font-bold text-slate-800 mb-0.5">Service</div>
              <div className="flex flex-col items-center justify-center opacity-80">
                <img src="/logo-heymann.png" alt="Heymann's Inc" className="h-20 w-20 object-contain mb-0.5" />
                <span className="text-[7px] text-[#1a2542] text-center uppercase tracking-[0.1em] leading-tight font-bold">Leader de l'ALM et du Risk Management<br/>en Afrique Subsaharienne</span>
                <div className="w-full h-[0.5px] bg-slate-200 mt-2"></div>
                <span className="text-[10px] text-slate-500 mt-1.5 font-medium">Version : 1.0.0</span>
              </div>
            </div>
          )}
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto">
            {/* Section header (fixé au défilement - 100% opaque) */}
            <div className="sticky top-0 z-30 bg-[#F4F7FA] border-b border-slate-200 px-8 h-12 flex items-center shadow-xs">
              <h1 className="text-lg font-bold text-blue-900 tracking-tight leading-none">
                {SECTION_LABELS[activeTab]}
              </h1>
            </div>

            <div key={activeTab} className="p-8 space-y-6 fade-in">

            {activeTab === 'dashboard' ? (
              <div className="space-y-6">
                {/* Ligne 1 : KPIs Exécutifs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-[3px] border border-slate-200/60 shadow-sm p-3.5 flex flex-col justify-between transition-shadow hover:shadow-md">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-blue-900">Ratio Global Solvabilité</h3>
                    <div className="text-lg font-bold text-[#1a2542] tabular-nums mt-1">{Number(solva.ratios.total).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}%</div>
                    <div className="text-[9px] font-medium text-slate-400 mt-1">Seuil min. BCEAO : {Number(solva.normes[2].requis).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}%</div>
                  </div>

                  <div className="bg-white rounded-[3px] border border-slate-200/60 shadow-sm p-3.5 flex flex-col justify-between transition-shadow hover:shadow-md">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-blue-900">Fonds Propres Effectifs</h3>
                    <div className="text-lg font-bold text-[#1a2542] tabular-nums mt-1">{Number(solva.fondsPropres.effectifs).toLocaleString('fr-FR')}</div>
                    <div className="text-[9px] font-medium text-slate-400 mt-1">En millions FCFA</div>
                  </div>

                  <div className="bg-white rounded-[3px] border border-slate-200/60 shadow-sm p-3.5 flex flex-col justify-between transition-shadow hover:shadow-md">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-blue-900">Total APR</h3>
                    <div className="text-lg font-bold text-[#1a2542] tabular-nums mt-1">{Number(solva.apr).toLocaleString('fr-FR')}</div>
                    <div className="text-[9px] font-medium text-slate-400 mt-1">En millions FCFA</div>
                  </div>

                  <div className={`rounded-[3px] border p-3.5 flex flex-col justify-center ${isConforme ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <h3 className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${isConforme ? 'text-emerald-600' : 'text-rose-600'}`}>Conformité Globale</h3>
                    <div className={`text-base font-bold ${isConforme ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {isConforme ? 'CONFORME' : 'INFRACTION'}
                    </div>
                  </div>
                </div>

                {/* Ligne 2 : Tableau de Conformité Prudentielle BCEAO */}
                <div className="flex flex-col lg:flex-row gap-6">

                  {/* Tableau de Conformité BCEAO */}
                  <div className="bg-white rounded-[3px] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col flex-1">
                    <div className="bg-[#1a2542] px-5 py-3 flex justify-between items-center">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-white">Ratios Prudentiels BCEAO (Pilier 1)</h2>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isConforme ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                        {isConforme ? 'CONFORME' : 'INFRACTION'}
                      </span>
                    </div>
                    {/* En-tête colonnes */}
                    <div className="grid grid-cols-4 px-5 py-2 bg-slate-50 border-b border-slate-100 text-[9.5px] font-extrabold text-blue-900 uppercase tracking-wider">
                      <div>Norme réglementaire</div>
                      <div className="text-center">Ratio Observé</div>
                      <div className="text-center">Seuil Min. BCEAO</div>
                      <div className="text-center">Statut</div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {solva.normes.map((norme) => {
                        const conforme = norme.situation === 'conforme';
                        const nonCalc = norme.situation === 'non_calculable';
                        return (
                          <div key={norme.code} className="grid grid-cols-4 px-5 py-3 hover:bg-slate-50/60 transition-colors items-center">
                            <div>
                              <div className="text-[11.5px] font-semibold text-[#1a2542] leading-tight">{norme.libelle}</div>
                            </div>
                            <div className="text-center">
                              <span className="text-sm font-black tabular-nums text-[#1a2542]">
                                {nonCalc ? 'N/A' : `${Number(norme.observe).toFixed(2)}%`}
                              </span>
                            </div>
                            <div className="text-center">
                              <span className="text-sm font-bold tabular-nums text-slate-500">{Number(norme.requis).toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-center">
                              <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                                nonCalc
                                  ? 'bg-slate-100 text-slate-500'
                                  : conforme
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}>
                                {nonCalc ? 'N/A' : conforme ? 'Conforme' : 'Infraction'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chiffres Clés FODEP */}
                  <div className="flex flex-col gap-4 w-full lg:w-[260px] shrink-0">

                    <div className="bg-white rounded-[3px] border border-slate-200/60 shadow-sm p-4 flex flex-col justify-between">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-blue-800">Fonds Propres Effectifs (FPI41)</span>
                      <div className="mt-2">
                        <span className="text-lg font-black text-[#1a2542] tabular-nums">{Number(solva.fondsPropres.effectifs).toLocaleString('fr-FR')}</span>
                        <span className="text-[9px] font-semibold text-slate-400 ml-1.5">M FCFA</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-[3px] border border-slate-200/60 shadow-sm p-4 flex flex-col justify-between">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-blue-800">Total APR (Tous risques)</span>
                      <div className="mt-2">
                        <span className="text-lg font-black text-[#1a2542] tabular-nums">{Number(solva.apr).toLocaleString('fr-FR')}</span>
                        <span className="text-[9px] font-semibold text-slate-400 ml-1.5">M FCFA</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-[3px] border border-slate-200/60 shadow-sm p-4 flex flex-col justify-between">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-blue-800">Exigence min. FP (9% x APR)</span>
                      <div className="mt-2">
                        <span className="text-lg font-black text-[#1a2542] tabular-nums">{exigenceTotale.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</span>
                        <span className="text-[9px] font-semibold text-slate-400 ml-1.5">M FCFA</span>
                      </div>
                    </div>

                    <div className={`rounded-[3px] border shadow-sm p-4 flex flex-col justify-between ${
                      surplusFP >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
                    }`}>
                      <span className={`text-[9.5px] font-bold uppercase tracking-wider ${
                        surplusFP >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>Surplus Prudentiel</span>
                      <div className="mt-2">
                        <span className={`text-lg font-black tabular-nums ${
                          surplusFP >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>{surplusFP >= 0 ? '+' : ''}{surplusFP.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</span>
                        <span className={`text-[9px] font-semibold ml-1.5 ${
                          surplusFP >= 0 ? 'text-emerald-500' : 'text-rose-400'
                        }`}>M FCFA</span>
                      </div>
                    </div>

                    {isGrandsRisquesWarning && (
                      <div className="bg-rose-50 border border-rose-100 rounded-[3px] p-3 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] font-bold text-rose-700">Alerte Grands Risques</div>
                          <div className="text-[9.5px] text-rose-600 mt-0.5">Limite globale dépassée ({ratioGrandsRisques.toFixed(0)}% / 800%)</div>
                          <button onClick={() => setActiveTab('grands-risques')} className="text-[9.5px] font-bold text-rose-700 underline mt-1">Analyser</button>
                        </div>
                      </div>
                    )}

                  </div>

                </div>


              </div>
            ) : activeTab === 'fonds-propres' ? (
              <FondsPropresView solva={solva} isSidebarCollapsed={isCollapsed} />
            ) : activeTab === 'credit' ? (
              <RisqueCreditView solva={solva} isSidebarCollapsed={isCollapsed} />
            ) : activeTab === 'operationnel' ? (
              <RisqueOperationnelView solva={solva} isSidebarCollapsed={isCollapsed} />
            ) : activeTab === 'marche' ? (
              <RisqueMarcheView solva={solva} isSidebarCollapsed={isCollapsed} />
            ) : activeTab === 'grands-risques' ? (
              <GrandsRisquesView solva={solva} />
            ) : activeTab === 'import' ? (
              <div className="max-w-2xl mt-8 mx-auto fade-in">
                <div className="bg-white rounded-[3px] shadow-[0_4px_14px_rgba(26,37,66,0.06)] p-10 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-[4px] bg-blue-50 flex items-center justify-center mb-5">
                    <Upload className="w-7 h-7 text-[#3b49df]" />
                  </div>
                  <h2 className="text-xl font-extrabold text-[#1a2542] mb-3">Importer des données</h2>
                  <p className="text-sm text-slate-500 mb-6 max-w-md leading-relaxed">
                    Importez les données pour alimenter le moteur de calcul. Cela mettra à jour les données actuelles de l'arrêté.
                  </p>
                  
                  {/* Choix du type d'import */}
                  <div className="flex bg-slate-100 p-1.5 rounded-[4px] mb-8 w-full max-w-sm shadow-inner">
                    <button
                      onClick={() => setImportType('template')}
                      className={`flex-1 py-2 px-3 rounded-[3px] text-[13px] font-bold transition-all duration-200 ${importType === 'template' ? 'bg-white text-[#3b49df] shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                      Modèle de Saisie
                    </button>
                    <button
                      onClick={() => setImportType('fodep')}
                      className={`flex-1 py-2 px-3 rounded-[3px] text-[13px] font-bold transition-all duration-200 ${importType === 'fodep' ? 'bg-white text-[#3b49df] shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                      Fichier FODEP Officiel
                    </button>
                  </div>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-[3px] p-12 flex flex-col items-center justify-center w-full hover:bg-slate-50 hover:border-[#3b49df] transition-all duration-300 cursor-pointer mb-6"
                  >
                    <FileSpreadsheet className="w-10 h-10 text-slate-400 mb-4" />
                    <span className="text-[15px] font-semibold text-[#1a2542]">Cliquez pour sélectionner un fichier</span>
                    <span className="text-[13px] text-slate-500 mt-2">ou glissez-déposez le fichier ici</span>
                  </div>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                  />

                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-[#1a2542] hover:bg-[#2a375a] text-white font-semibold py-3 px-4 rounded-[3px] text-sm shadow-[0_4px_12px_rgba(26,37,66,0.25)] hover:shadow-[0_6px_16px_rgba(26,37,66,0.35)] hover:-translate-y-px active:translate-y-0 transition-all duration-200 mb-4"
                  >
                    Démarrer l'importation
                  </button>
                  
                  <div className="flex items-center justify-center pt-2">
                    <div className="mt-6 text-center text-sm text-slate-500">
                      {importType === 'template' ? (
                        <>
                          Vous n'avez pas de fichier structuré ?{' '}
                          <button 
                            onClick={() => downloadExcelTemplate()} 
                            className="text-[#3b49df] font-bold hover:underline transition-all hover:text-blue-800 focus:outline-none"
                          >
                            Télécharger le modèle vierge
                          </button>
                        </>
                      ) : (
                        <>
                          Vous n'avez pas la matrice réglementaire ?{' '}
                          <button 
                            onClick={() => downloadOfficialFodepTemplate()} 
                            className="text-[#3b49df] font-bold hover:underline transition-all hover:text-blue-800 focus:outline-none"
                          >
                            Télécharger la matrice FODEP
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'export' ? (
              <ExportView solva={solva} />
            ) : (
              <div className="bg-white p-8 rounded-[3px] shadow-[0_4px_14px_rgba(26,37,66,0.06)] flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <LayoutDashboard className="w-8 h-8 text-[#3b49df]" />
                </div>
                <h3 className="text-lg font-bold text-[#1a2542] mb-1">Section en cours de développement</h3>
                <p className="text-sm text-slate-500">Le tableau spécifique pour cette section du FODEP sera intégré prochainement.</p>
              </div>
            )}
          </div>
          </div>
        </main>
      </div>

      {importResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1a2542]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-6 border-b ${importResult.success ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${importResult.success ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {importResult.success ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${importResult.success ? 'text-emerald-800' : 'text-rose-800'}`}>
                    {importResult.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 font-medium truncate max-w-[250px]">{importResult.fileName}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-slate-500">Indicateurs détectés :</span>
                  <span className={`text-xl font-black ${importResult.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {importResult.indicatorsFound}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100 font-medium">
                  {importResult.message}
                </p>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setImportResult(null)}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all ${
                    importResult.success 
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-[0_2px_10px_rgba(5,150,105,0.2)]' 
                      : 'bg-[#1a2542] hover:bg-[#111827] shadow-[0_2px_10px_rgba(26,37,66,0.2)]'
                  }`}
                >
                  {importResult.success ? 'Continuer' : 'Fermer et réessayer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Components ---

function NavSection({ title, isCollapsed, children }: { title: string, isCollapsed: boolean, children: React.ReactNode }) {
  return (
    <div>
      {!isCollapsed && (
        <div className="text-[9px] font-semibold text-indigo-600 uppercase tracking-[0.12em] mb-2 px-3">
          {title}
        </div>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick, isCollapsed }: { icon: LucideIcon, label: string, active: boolean, onClick: () => void, isCollapsed: boolean }) {
  if (isCollapsed) {
    return (
      <button 
        onClick={onClick}
        title={label}
        className={`w-9 h-9 mx-auto flex items-center justify-center rounded-[5px] transition-all duration-200 ${
          active 
            ? 'bg-[#1a2542] text-[#fefefe] shadow-[0_2px_8px_rgba(26,37,66,0.18)]' 
            : 'bg-slate-100 text-[#1a2542] shadow-[0_1px_2px_rgba(26,37,66,0.06)] hover:bg-slate-200/70 hover:shadow-[0_3px_8px_rgba(26,37,66,0.1)] hover:-translate-y-px'
        }`}
      >
        <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.2 : 2} />
      </button>
    );
  }

  return (
    <button 
      onClick={onClick}
      className={`group w-full flex items-center gap-2.5 pl-3 pr-2.5 h-9 rounded-[5px] text-left transition-all duration-200 select-none ${
        active 
          ? 'bg-[#1a2542] text-[#fefefe] shadow-[0_2px_8px_rgba(26,37,66,0.18)]' 
          : 'bg-slate-100 text-[#1a2542] shadow-[0_1px_2px_rgba(26,37,66,0.06)] hover:bg-slate-200/70 hover:shadow-[0_3px_8px_rgba(26,37,66,0.1)] hover:-translate-y-px'
      }`}
    >
      <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-[#fefefe]' : 'text-blue-900 group-hover:text-blue-900'}`} strokeWidth={active ? 2.2 : 2} />
      <span className={`text-[12px] whitespace-nowrap overflow-hidden text-ellipsis ${active ? 'text-[#fefefe] font-semibold' : 'text-blue-900 font-medium'}`}>{label}</span>
    </button>
  );
}

function SettingItem({ icon: Icon, title, open, onToggle, children }: { icon: LucideIcon, title: string, open: boolean, onToggle: () => void, children: React.ReactNode }) {
  return (
    <div className="py-0.5">
      <button 
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-3 h-9 rounded-[5px] transition-colors ${
          open ? 'bg-slate-100' : 'hover:bg-slate-50'
        }`}
      >
        <span className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-400" />
          <span className="text-[12.5px] font-semibold text-[#1a2542]">{title}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ease-out ${open ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="pt-1 px-1 space-y-0.5 pb-1">
          {children}
        </div>
      </div>
    </div>
  );
}

function Choice({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 h-8 rounded-[5px] text-[12px] transition-colors ${
        active 
          ? 'bg-[#1a2542] text-[#fefefe] font-semibold' 
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <span>{label}</span>
      {active && <Check className="w-4 h-4" />}
    </button>
  );
}
