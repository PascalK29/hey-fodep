import { useState, useEffect } from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  ShieldCheck, 
  AlertTriangle,
  Briefcase,
  TrendingUp,
  FileSpreadsheet,
  Settings,
  LogOut
} from 'lucide-react';
import { calculateSolvability, analyseSolvabilite, getDispruRegistry } from '@heyfodep/kernel';

// A mock of what would come from the DB API
const MOCK_INPUTS: Record<string, string> = {
  FPI10: "15000",
  FPI15: "5000",
  FPI22: "1000",
  FPI29: "8000",
  FPI39: "500",
  FPI41: "400",
  // APR
  RM12: "12000",
  RM21: "3000",
  RM29: "2500",
  RM39: "1000",
  RO13: "8000",
  RC48: "45000",
  RC63: "15000"
};

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'fonds-propres', label: 'Fonds Propres & Solvabilité', icon: ShieldCheck },
  { id: 'credit', label: 'Risque de Crédit', icon: Briefcase },
  { id: 'marche', label: 'Risque de Marché', icon: TrendingUp },
  { id: 'operationnel', label: 'Risque Opérationnel', icon: AlertTriangle },
  { id: 'grands-risques', label: 'Grands Risques', icon: FileSpreadsheet },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('fonds-propres');
  const [inputs, setInputs] = useState<Record<string, string>>(MOCK_INPUTS);
  
  // Calculate results
  const registry = getDispruRegistry('individuelle');
  const nodes = registry.evaluate(inputs);
  const solva = calculateSolvability(nodes);
  const analysis = analyseSolvabilite(solva);
  
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-marine-900 text-slate-300 flex flex-col shadow-xl z-10">
        <div className="h-16 flex items-center px-6 border-b border-marine-800">
          <div className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
            <Building2 className="w-6 h-6 text-marine-300" />
            <span>HEYFODEP</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2 text-xs font-semibold text-marine-400 uppercase tracking-wider">
            Sections FODEP
          </div>
          <nav className="space-y-1 px-2">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === item.id 
                    ? 'bg-marine-800 text-white' 
                    : 'hover:bg-marine-800/50 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-marine-300' : 'text-marine-500'}`} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-marine-800">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium hover:bg-marine-800/50 hover:text-white transition-colors">
            <Settings className="w-5 h-5 text-marine-500" />
            Paramètres
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium hover:bg-marine-800/50 hover:text-white transition-colors mt-1">
            <LogOut className="w-5 h-5 text-marine-500" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-0 shadow-sm">
          <h1 className="text-xl font-semibold text-marine-900">
            {NAV_ITEMS.find(i => i.id === activeTab)?.label}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-slate-500">Arrêté : 30/06/2026</div>
            <div className="h-8 w-8 rounded-full bg-marine-100 flex items-center justify-center text-marine-700 font-bold text-sm border border-marine-200">
              FA
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Ratios & Synthesis (EP01 & EP02) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <RatioCard 
                title="Ratio CET1" 
                value={solva.ratioCet1} 
                min={solva.seuils.minCet1} 
                verdict={analysis.cet1} 
              />
              <RatioCard 
                title="Ratio T1" 
                value={solva.ratioT1} 
                min={solva.seuils.minT1} 
                verdict={analysis.t1} 
              />
              <RatioCard 
                title="Ratio Global" 
                value={solva.ratioGlobal} 
                min={solva.seuils.minGlobal} 
                verdict={analysis.global} 
              />
              <div className="hey-card flex flex-col justify-center items-center bg-gradient-to-br from-marine-900 to-marine-800 text-white border-none">
                <div className="text-sm text-marine-200 font-medium mb-2">Conformité Globale</div>
                <div className="flex items-center gap-2">
                  {analysis.conforme ? (
                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-rose-400" />
                  )}
                  <span className="text-2xl font-bold">
                    {analysis.conforme ? 'CONFORME' : 'INFRACTION'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fonds Propres Details */}
              <div className="hey-card">
                <h2 className="text-lg font-semibold text-marine-900 mb-4 border-b border-slate-100 pb-2">
                  Fonds Propres Effectifs (EP07)
                </h2>
                <div className="space-y-3">
                  <DataItem code="FPI10" label="Capital social" value={nodes.get('FPI10')?.valeur || '0'} />
                  <DataItem code="FPI15" label="Réserves" value={nodes.get('FPI15')?.valeur || '0'} />
                  <DataItem code="FPI22" label="Report à nouveau (créditeur)" value={nodes.get('FPI22')?.valeur || '0'} />
                  <div className="pt-2 border-t border-slate-100">
                    <DataItem code="FPI29" label="Total CET1 Brut" value={nodes.get('FPI29')?.valeur || '0'} bold />
                  </div>
                  <DataItem code="FPI39" label="Total AT1" value={nodes.get('FPI39')?.valeur || '0'} bold />
                  <DataItem code="FPI41" label="Total T2" value={nodes.get('FPI41')?.valeur || '0'} bold />
                  
                  <div className="mt-6 pt-4 border-t-2 border-marine-100 bg-slate-50 -mx-6 px-6 pb-2">
                    <div className="flex justify-between items-center py-2">
                      <span className="font-bold text-marine-900">Total Fonds Propres</span>
                      <span className="font-bold text-marine-900">{solva.fondsPropresEffectifs}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* APR Details */}
              <div className="hey-card">
                <h2 className="text-lg font-semibold text-marine-900 mb-4 border-b border-slate-100 pb-2">
                  Actifs Pondérés par le Risque (EP08)
                </h2>
                <div className="space-y-3">
                  <DataItem code="RC63" label="APR Crédit" value={nodes.get('RC63')?.valeur || '0'} />
                  <DataItem code="RM39" label="APR Marché" value={nodes.get('RM39')?.valeur || '0'} />
                  <DataItem code="RO13" label="APR Opérationnel" value={nodes.get('RO13')?.valeur || '0'} />
                  
                  <div className="mt-6 pt-4 border-t-2 border-marine-100 bg-slate-50 -mx-6 px-6 pb-2 h-[88px] flex flex-col justify-center">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-marine-900">Total APR</span>
                      <span className="font-bold text-marine-900">{solva.totalApr}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function RatioCard({ title, value, min, verdict }: { title: string, value: string, min: string, verdict: any }) {
  const isConforme = verdict.conforme;
  
  return (
    <div className={`hey-card relative overflow-hidden border-t-4 ${isConforme ? 'border-t-emerald-500' : 'border-t-rose-500'}`}>
      <div className="text-sm font-medium text-slate-500 mb-1">{title}</div>
      <div className="flex items-baseline gap-2">
        <div className={`text-3xl font-bold tracking-tight ${isConforme ? 'text-emerald-600' : 'text-rose-600'}`}>
          {value}%
        </div>
      </div>
      <div className="mt-2 text-xs text-slate-400">
        Seuil min: <span className="font-medium text-slate-600">{min}%</span>
      </div>
    </div>
  );
}

function DataItem({ code, label, value, bold = false }: { code: string, label: string, value: string, bold?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1">
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
          {code}
        </span>
        <span className={`text-sm ${bold ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
          {label}
        </span>
      </div>
      <span className={`text-sm ${bold ? 'font-bold text-slate-900' : 'text-slate-700 font-medium'}`}>
        {value}
      </span>
    </div>
  );
}
