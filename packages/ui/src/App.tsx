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
  Download
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ResponsiveContainer, Cell, PieChart, Pie, Tooltip } from 'recharts';

import { analyseSolvabilite, type SolvabiliteAnalyse } from '@heyfodep/kernel';
import { FondsPropresView } from './views/FondsPropresView';
import { RisqueCreditView } from './views/RisqueCreditView';
import { RisqueOperationnelView } from './views/RisqueOperationnelView';
import { RisqueMarcheView } from './views/RisqueMarcheView';
import { GrandsRisquesView } from './views/GrandsRisquesView';

// --- Types ---
type TabId = 'dashboard' | 'fonds-propres' | 'credit' | 'marche' | 'operationnel' | 'grands-risques' | 'import' | 'export';

const SECTION_LABELS: Record<TabId, string> = {
  dashboard: 'Tableau de bord',
  'fonds-propres': 'Fonds Propres & Solvabilité',
  credit: 'Risque de Crédit',
  marche: 'Risque de Marché',
  operationnel: 'Risque Opérationnel',
  'grands-risques': 'Grands Risques',
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
  
  // Real data state
  const [analysis, setAnalysis] = useState<SolvabiliteAnalyse | null>(null);
  const [activeDonutIndex, setActiveDonutIndex] = useState<number | null>(null);

  // Jeu de données de démonstration (arrêté 30/06/2026, montants en millions FCFA)
  const SAMPLE_INPUTS: Record<string, number> = {
    FPI01: 50000, FPI02: 2000, FPI03: 8000, FPI04: 3000, FPI05: 5000, FPI06: 10000, FPI07: 0,
    FPI09: 0, FPI10: 0, IM12: 0, ID09: 0, PA14: 0, PA32: 0, FPI11: 0, PA07: 0, IM06: 0, IM10: 0, PR04: 0, FPI12: 0, FPI13: 0,
    FPI23: 10000, FPI24: 500, FPI25: 0,
    PA15: 0, PA23: 0, PA33: 0, FPI27: 0,
    FPI40: 20000,
    RC63: 120000, RM39: 15000, RO13: 8000,
  };

  useEffect(() => {
    fetch('/api/solvabilite/arrete-2026')
      .then(r => r.json())
      .then(data => {
        const inputs = data?.inputs && Object.keys(data.inputs).length ? data.inputs : SAMPLE_INPUTS;
        setAnalysis(analyseSolvabilite(inputs));
      })
      .catch(() => setAnalysis(analyseSolvabilite(SAMPLE_INPUTS)));
  }, []);

  if (!analysis) {
    return <div className="flex h-screen items-center justify-center bg-[#F4F7FA] text-[#1a2542] font-semibold">Chargement des données BCEAO...</div>;
  }

  const solva = analysis;
  const isConforme = solva.normes.every(n => n.situation === 'conforme');

  const APR_DONUT = [
    { name: 'Risque de Crédit', value: Number(solva.valeurs.get('RC63')) || 120000, color: '#3b49df' }, // Using RC63 from mock or kernel
    { name: 'Risque de Marché', value: Number(solva.valeurs.get('EP39_TOTAL_APR')) || Number(solva.valeurs.get('RM39')) || 15000, color: '#0ea5e9' },
    { name: 'Risque Opérationnel', value: Number(solva.valeurs.get('RO14')) || Number(solva.valeurs.get('RO13')) || 8000, color: '#f43f5e' },
  ];

  const totalAprValue = APR_DONUT.reduce((sum, item) => sum + item.value, 0);
  const dominantIndex = APR_DONUT.reduce(
    (maxIdx, item, idx, arr) => (item.value > arr[maxIdx].value ? idx : maxIdx),
    0
  );

  const selectedIndex = activeDonutIndex !== null ? activeDonutIndex : dominantIndex;
  const selectedItem = APR_DONUT[selectedIndex];
  const selectedPercentage = totalAprValue > 0 
    ? ((selectedItem.value / totalAprValue) * 100).toFixed(1) 
    : '0.0';

  const getShortLabel = (name: string) => {
    if (name.includes('Crédit')) return 'Crédit';
    if (name.includes('Marché')) return 'Marché';
    if (name.includes('Opérationnel')) return 'Opérationnel';
    return name;
  };

  const FP_DATA = [
    { rank: 1, name: 'CET1 Brut (Capital + Réserves)', pct: Math.round((Number(solva.fondsPropres.cet1) / Number(solva.fondsPropres.effectifs)) * 100) || 75 },
    { rank: 2, name: 'Total AT1', pct: Math.round((Number(solva.fondsPropres.at1) / Number(solva.fondsPropres.effectifs)) * 100) || 5 },
    { rank: 3, name: 'Total T2', pct: Math.round((Number(solva.fondsPropres.t2) / Number(solva.fondsPropres.effectifs)) * 100) || 20 },
  ];

  const totalGrandsRisques = Number(solva.valeurs.get('EP40_TOTAL_EXPOSITIONS')) || 0;
  const fpEffectifs = Number(solva.fondsPropres.effectifs) || 1;
  const ratioGrandsRisques = (totalGrandsRisques / fpEffectifs) * 100;
  const isGrandsRisquesWarning = ratioGrandsRisques > 800;

  return (
    <div className="flex flex-col h-screen bg-[#F4F7FA] font-sans text-slate-800 overflow-hidden" style={{ fontFamily: font }}>
      
      {/* Top Navbar */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3 pl-3">
          {/* Logo encadré */}
          <div className="w-11 h-11 rounded-[5px] bg-[#111827] flex items-center justify-center shadow-[0_4px_12px_rgba(26,37,66,0.25)]">
            <img src="/logo3.png" alt="HEY-FODEP" className="h-7 w-7 object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-[#1a2542] font-extrabold text-lg leading-tight tracking-tight">FODEP</span>
            <span className="text-indigo-600 text-[10px] font-semibold leading-tight">Conformité prudentielle BCEAO</span>
          </div>
        </div>

        {/* Paramètres */}
        <div className="relative h-full flex items-center pr-5">
          {/* Pastille date d'arrêté (date visible, libellé au survol) */}
          <div className="group relative mr-3 flex items-center">
            <span className="inline-flex h-7 items-center justify-center rounded-[5px] bg-indigo-50 px-2.5 text-[11px] font-semibold text-blue-900">
              30/06/2026
            </span>
            <span className="pointer-events-none absolute right-0 top-full z-40 mt-2 whitespace-nowrap rounded bg-[#1a2542] px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
              Date d'arrêté
            </span>
          </div>

          <button 
            onClick={() => setSettingsOpen(!settingsOpen)} 
            className={`w-9 h-7 flex items-center justify-center rounded-[5px] transition-colors ${
              settingsOpen ? 'bg-[#1a2542] text-white shadow-[0_2px_8px_rgba(26,37,66,0.18)]' : 'bg-slate-100 text-[#1a2542] hover:bg-slate-200/70'
            }`}
            title="Paramètres"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {settingsOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setSettingsOpen(false)} />
              <div className="absolute right-5 top-full mt-2 w-64 bg-white rounded-[5px] shadow-[0_12px_32px_rgba(26,37,66,0.18)] p-1.5 z-40 fade-in">
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

            <NavSection title="États FODEP" isCollapsed={isCollapsed}>
              <NavItem icon={ShieldCheck} label="Fonds Propres & Solvabilité" active={activeTab === 'fonds-propres'} onClick={() => setActiveTab('fonds-propres')} isCollapsed={isCollapsed} />
              <NavItem icon={Briefcase} label="Risque de Crédit" active={activeTab === 'credit'} onClick={() => setActiveTab('credit')} isCollapsed={isCollapsed} />
              <NavItem icon={TrendingUp} label="Risque de Marché" active={activeTab === 'marche'} onClick={() => setActiveTab('marche')} isCollapsed={isCollapsed} />
              <NavItem icon={AlertTriangle} label="Risque Opérationnel" active={activeTab === 'operationnel'} onClick={() => setActiveTab('operationnel')} isCollapsed={isCollapsed} />
              <NavItem icon={FileSpreadsheet} label="Grands Risques" active={activeTab === 'grands-risques'} onClick={() => setActiveTab('grands-risques')} isCollapsed={isCollapsed} />
            </NavSection>

            <NavSection title="Données & Échanges" isCollapsed={isCollapsed}>
              <NavItem icon={Upload} label="Importation" active={activeTab === 'import'} onClick={() => setActiveTab('import')} isCollapsed={isCollapsed} />
              <NavItem icon={Download} label="Exportation" active={activeTab === 'export'} onClick={() => setActiveTab('export')} isCollapsed={isCollapsed} />
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
            {/* Section header (fixé au défilement) */}
            <div className="sticky top-0 z-10 bg-[#F4F7FA]/95 backdrop-blur-sm border-b border-slate-200 px-8 py-2.5">
              <h1 className="text-[22px] font-bold text-blue-900 tracking-tight leading-none">
                {SECTION_LABELS[activeTab]}
              </h1>
            </div>

            <div key={activeTab} className="p-8 space-y-6 fade-in">

            {activeTab === 'dashboard' ? (
              <div className="space-y-6">
                {/* Ligne 1 : KPIs Exécutifs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-[3px] border border-slate-200/60 shadow-sm p-5 flex flex-col justify-between transition-shadow hover:shadow-md">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-blue-900">Ratio Global Solvabilité</h3>
                    <div className="text-2xl font-black text-[#1a2542] tabular-nums mt-2">{Number(solva.ratios.total).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}%</div>
                    <div className="text-[10px] font-medium text-slate-400 mt-1">Seuil min. BCEAO : {Number(solva.normes[2].requis).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}%</div>
                  </div>

                  <div className="bg-white rounded-[3px] border border-slate-200/60 shadow-sm p-5 flex flex-col justify-between transition-shadow hover:shadow-md">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-blue-900">Fonds Propres Effectifs</h3>
                    <div className="text-2xl font-black text-[#1a2542] tabular-nums mt-2">{Number(solva.fondsPropres.effectifs).toLocaleString('fr-FR')}</div>
                    <div className="text-[10px] font-medium text-slate-400 mt-1">En millions FCFA</div>
                  </div>

                  <div className="bg-white rounded-[3px] border border-slate-200/60 shadow-sm p-5 flex flex-col justify-between transition-shadow hover:shadow-md">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-blue-900">Total APR</h3>
                    <div className="text-2xl font-black text-[#1a2542] tabular-nums mt-2">{Number(solva.apr).toLocaleString('fr-FR')}</div>
                    <div className="text-[10px] font-medium text-slate-400 mt-1">Actifs Pondérés des Risques</div>
                  </div>

                  <div className={`rounded-[3px] border p-5 flex flex-col justify-center ${isConforme ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <h3 className={`text-[10px] font-bold uppercase tracking-wide mb-2 ${isConforme ? 'text-emerald-600' : 'text-rose-600'}`}>Conformité Globale</h3>
                    <div className={`text-xl font-black ${isConforme ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {isConforme ? 'CONFORME' : 'INFRACTION'}
                    </div>
                  </div>
                </div>

                {/* Ligne 2 : Analyse Détaillée */}
                <div className="flex flex-col lg:flex-row gap-6">
                  
                  {/* Carte 1 : Répartition des Risques (Donut) */}
                  <div className="bg-white rounded-[3px] border border-slate-200/60 shadow-sm flex flex-col w-full lg:w-[40%]">
                    <div className="bg-slate-50/50 px-5 py-3 border-b border-slate-100 rounded-t-[3px]">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900">Profil de Risque (APR)</h2>
                    </div>
                    <div className="p-5 flex-1 flex flex-col items-center justify-center">
                      <div className="flex flex-row items-center justify-between h-[200px] w-full gap-4">
                        {/* 1. Graphique Donut */}
                        <div className="w-[55%] h-full flex items-center justify-center relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                              <Pie
                                data={APR_DONUT}
                                cx="50%"
                                cy="50%"
                                innerRadius="55%"
                                outerRadius="75%"
                                paddingAngle={4}
                                dataKey="value"
                                onMouseEnter={(_, index) => setActiveDonutIndex(index)}
                                onMouseLeave={() => setActiveDonutIndex(null)}
                              >
                                {APR_DONUT.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.color} 
                                    style={{
                                      outline: 'none',
                                      cursor: 'pointer',
                                      opacity: activeDonutIndex === null || activeDonutIndex === index ? 1 : 0.55,
                                      transition: 'opacity 0.2s ease-in-out'
                                    }}
                                  />
                                ))}
                              </Pie>
                              <Tooltip 
                                cursor={false}
                                position={{ x: 17, y: -75 }}
                                allowEscapeViewBox={{ x: true, y: true }}
                                wrapperStyle={{ pointerEvents: 'none' }}
                                content={({ active, payload }: any) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    const total = APR_DONUT.reduce((sum, item) => sum + item.value, 0);
                                    const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0.0';
                                    return (
                                      <div className="bg-white text-blue-900 p-3 rounded-[8px] shadow-xl border border-blue-900 flex flex-col space-y-1.5 w-44">
                                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-1.5">
                                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
                                          <span className="text-[10px] font-extrabold uppercase tracking-wide text-blue-900 truncate">APR {data.name}</span>
                                        </div>
                                        <div className="flex flex-col pt-0.5">
                                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Valeur</span>
                                          <span className="text-xs font-black text-blue-900 mt-1">{Number(data.value).toLocaleString('fr-FR')} M FCFA</span>
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Proportion</span>
                                          <span className="text-xs font-black text-blue-900 mt-1">{percentage}%</span>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          
                          {/* Affichage interactif au centre */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 leading-none">
                              APR
                            </span>
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mt-1 leading-none">
                              {getShortLabel(selectedItem.name)}
                            </span>
                            <span className="text-lg font-black text-blue-900 mt-1.5 leading-none">
                              {selectedPercentage}%
                            </span>
                          </div>
                        </div>
                        
                        {/* 2. Légende disposée professionnellement */}
                        <div className="w-[45%] flex flex-col justify-center space-y-3.5 pl-4 border-l border-slate-100 h-[85%]">
                          {APR_DONUT.map((entry) => {
                            const total = APR_DONUT.reduce((sum, item) => sum + item.value, 0);
                            const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0.0';
                            
                            return (
                              <div key={entry.name} className="flex flex-col space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                                  <span className="text-[10px] font-semibold text-slate-700 truncate leading-none">{entry.name}</span>
                                </div>
                                <div className="pl-3.5 flex items-baseline space-x-1">
                                  <span className="text-[11px] font-black text-blue-900 leading-none">{Number(entry.value).toLocaleString('fr-FR')} M</span>
                                  <span className="text-[8.5px] text-slate-400 font-bold leading-none">({percentage}%)</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Carte 2 : Fonds Propres (Barres Horizontales) */}
                  <div className="bg-white rounded-[3px] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col w-full lg:w-[30%]">
                    <div className="bg-slate-50/50 px-5 py-3 border-b border-slate-100">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900">Qualité des Fonds Propres</h2>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-center space-y-5">
                      {FP_DATA.map((item) => (
                        <div key={item.rank} className="flex flex-col">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[13px] font-semibold text-gray-700 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px]">{item.rank}</span>
                              <span className="text-[12px]">{item.name}</span>
                            </span>
                            <span className="text-[12px] font-bold text-[#1a2542]">{item.pct} %</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-1000"
                              style={{ 
                                width: `${item.pct}%`,
                                backgroundColor: item.rank === 1 ? '#3b49df' : (item.rank === 2 ? '#6366f1' : '#818cf8'),
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Carte 3 : Grands Risques & Alertes */}
                  <div className="bg-white rounded-[3px] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col justify-between w-full lg:w-[30%]">
                    <div>
                      <div className="bg-slate-50/50 px-5 py-3 border-b border-slate-100 flex flex-col">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900">Concentration (Grands Risques)</h2>
                        <span className="text-[10px] text-slate-400 mt-0.5">Limite globale de 8 fois les fonds propres.</span>
                      </div>
                      
                      <div className="p-5">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-2xl font-black text-[#1a2542] tabular-nums">{ratioGrandsRisques.toLocaleString('fr-FR', {maximumFractionDigits:1})}%</span>
                          <span className="text-[11px] font-semibold text-slate-400">Limite 800%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                          <div 
                            className={`h-full transition-all duration-1000 ${isGrandsRisquesWarning ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(ratioGrandsRisques / 8, 100)}%` }}
                          />
                        </div>
                        {isGrandsRisquesWarning && (
                          <div className="mt-3 flex items-center gap-2 text-rose-600 text-xs font-semibold bg-rose-50 p-2 rounded-[3px]">
                            <AlertTriangle className="w-4 h-4" />
                            Dépassement de la limite globale !
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-5 pt-0 mt-auto border-t border-slate-100">
                      <button onClick={() => setActiveTab('grands-risques')} className="w-full text-center text-[12px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                        Analyser les grands risques &rarr;
                      </button>
                    </div>
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
              <RisqueMarcheView solva={solva} />
            ) : activeTab === 'grands-risques' ? (
              <GrandsRisquesView solva={solva} />
            ) : activeTab === 'import' ? (
              <div className="max-w-3xl mt-4 fade-in">
                <div className="bg-white rounded-[3px] shadow-[0_4px_14px_rgba(26,37,66,0.06)] p-8 flex flex-col h-full">
                  <div className="w-12 h-12 rounded-[3px] bg-blue-50 flex items-center justify-center mb-6">
                    <Upload className="w-6 h-6 text-[#3b49df]" />
                  </div>
                  <h2 className="text-lg font-bold text-[#1a2542] mb-2">Importer des données depuis un fichier</h2>
                  <p className="text-sm text-slate-500 mb-6 flex-1">
                    Importez les saisies à partir d'un fichier FODEP au format Excel (.xlsx) ou CSV. Cela écrasera les données actuelles de l'arrêté pour les indicateurs présents dans le fichier. Assurez-vous que le fichier respecte le format attendu.
                  </p>
                  
                  <div className="border-2 border-dashed border-slate-200 rounded-[3px] p-12 flex flex-col items-center justify-center text-center hover:bg-slate-50 hover:border-[#3b49df] transition-all duration-300 cursor-pointer mb-6">
                    <FileSpreadsheet className="w-10 h-10 text-slate-400 mb-4" />
                    <span className="text-base font-semibold text-[#1a2542]">Cliquez pour sélectionner un fichier</span>
                    <span className="text-sm text-slate-500 mt-2">ou glissez-déposez le fichier ici</span>
                  </div>
                  
                  <button className="w-full bg-[#1a2542] hover:bg-[#2a375a] text-white font-semibold py-3 px-4 rounded-[3px] text-sm shadow-[0_4px_12px_rgba(26,37,66,0.25)] hover:shadow-[0_6px_16px_rgba(26,37,66,0.35)] hover:-translate-y-px active:translate-y-0 transition-all duration-200">
                    Démarrer l'importation
                  </button>
                </div>
              </div>
            ) : activeTab === 'export' ? (
              <div className="max-w-3xl mt-4 fade-in">
                <div className="bg-white rounded-[3px] shadow-[0_4px_14px_rgba(26,37,66,0.06)] p-8 flex flex-col h-full">
                  <div className="w-12 h-12 rounded-[3px] bg-emerald-50 flex items-center justify-center mb-6">
                    <Download className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h2 className="text-lg font-bold text-[#1a2542] mb-2">Exporter le rapport FODEP</h2>
                  <p className="text-sm text-slate-500 mb-6 flex-1">
                    Générez et téléchargez le document FODEP complet incluant toutes les sections, indicateurs réglementaires, et formules de calcul au format spécifié ci-dessous.
                  </p>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between p-4 bg-white rounded-[3px] shadow-[0_1px_3px_rgba(26,37,66,0.08)] cursor-pointer hover:shadow-[0_6px_16px_rgba(26,37,66,0.14)] hover:-translate-y-0.5 transition-all duration-200">
                      <div className="flex items-center">
                        <FileSpreadsheet className="w-5 h-5 text-[#3b49df] mr-3" />
                        <span className="text-sm font-semibold text-[#1a2542]">Format réglementaire (Excel .xlsx)</span>
                      </div>
                      <input type="radio" name="export-format" defaultChecked className="w-4 h-4 text-[#3b49df]" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-[3px] shadow-[0_1px_3px_rgba(26,37,66,0.06)] cursor-pointer opacity-80 hover:opacity-100 hover:shadow-[0_6px_16px_rgba(26,37,66,0.14)] hover:-translate-y-0.5 transition-all duration-200">
                      <div className="flex items-center">
                        <FileSpreadsheet className="w-5 h-5 text-slate-500 mr-3" />
                        <span className="text-sm font-semibold text-[#1a2542]">Données brutes (JSON)</span>
                      </div>
                      <input type="radio" name="export-format" className="w-4 h-4 text-[#3b49df]" />
                    </div>
                  </div>
                  
                  <button className="w-full mt-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-[3px] text-sm shadow-[0_4px_12px_rgba(5,150,105,0.3)] hover:shadow-[0_6px_16px_rgba(5,150,105,0.4)] hover:-translate-y-px active:translate-y-0 transition-all duration-200">
                    Télécharger l'export
                  </button>
                </div>
              </div>
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
