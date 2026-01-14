
import React, { useState, useEffect, useRef, useMemo } from 'react';
import mermaid from 'mermaid';
import { GoogleGenAI } from '@google/genai';
import { 
  Play, Sparkles, Download, Copy, RefreshCw, ZoomIn, ZoomOut, 
  Code, LayoutTemplate, Maximize2, Minimize2, Heart, Search,
  Grid, List, X, Star, Wand2, Palette, ArrowRight, Box, Diamond, Circle, AlertCircle, Save, FolderOpen, Plus, Trash2
} from 'lucide-react';
import { Select } from './Select';
import { StrategyDiagram } from '../types';
import { dataService } from '../services/dataService';
import { useToast } from './ui/Toast';

interface DiagramEditorProps {
  isDarkMode: boolean;
}

interface Template {
  id: string;
  name: string;
  category: 'Flow' | 'Mindmap' | 'Sequence' | 'Routine' | 'Structure';
  description: string;
  code: string;
}

const TEMPLATES: Template[] = [
  // --- FLOWCHARTS (Logic & Edge) ---
  {
    id: 't1',
    name: 'Trend Follow Flow',
    category: 'Flow',
    description: 'Standard logic for entering trades in the direction of the higher timeframe trend.',
    code: `graph TD
    A[Market Open] --> B{"HTF Trend?"}
    B -- Bullish --> C[Look for Longs]
    B -- Bearish --> D[Look for Shorts]
    B -- Ranging --> E["Stay Flat / Range Bound"]
    C --> F{"Retracement to Discount?"}
    F -- Yes --> G[LTF Confirmation]
    G -- MSS + FVG --> H[Enter Long]
    D --> I{"Retracement to Premium?"}
    I -- Yes --> J[LTF Confirmation]
    J -- MSS + FVG --> K[Enter Short]`
  },
  {
    id: 't2',
    name: 'ICT Silver Bullet',
    category: 'Flow',
    description: 'Time-based setup targeting liquidity draws during specific hours.',
    code: `graph TD
    A["Session Start (10am/3pm)"] --> B{"Identify Liquidity"}
    B --> C["Wait for Sweep of High/Low"]
    C --> D{"Displacement?"}
    D -- Yes --> E["Market Structure Shift (MSS)"]
    E --> F["Identify Fair Value Gap (FVG)"]
    F --> G{"Price Return to FVG?"}
    G -- Yes --> H["Enter Trade"]
    H --> I["Target Opposite Liquidity"]`
  },
  {
    id: 't3',
    name: 'Break & Retest Model',
    category: 'Flow',
    description: 'Classic price action model for breakouts.',
    code: `graph TD
    A["Consolidation / Key Level"] --> B[Wait for Strong Breakout]
    B --> C{"Volume Confirmation?"}
    C -- Yes --> D[Wait for Pullback]
    D --> E{"Rejection Candle at Level?"}
    E -- Yes --> F[Enter on Closure]
    F --> G[Stop Loss below Swing Low]`
  },
  {
    id: 't4',
    name: 'Top-Down Analysis',
    category: 'Flow',
    description: 'Routine for analyzing multiple timeframes.',
    code: `graph LR
    A["Monthly/Weekly"] -->|Bias & Levels| B[Daily]
    B -->|Cycle & Range| C["4 Hour"]
    C -->|Structure & POI| D["15 Min"]
    D -->|Entry Trigger| E[Execution]`
  },
  {
    id: 't5',
    name: 'Wyckoff Accumulation',
    category: 'Structure',
    description: 'Simplified schematic of Wyckoff accumulation phases.',
    code: `graph LR
    A["Phase A: Stop the Trend"] --> B["Phase B: Build Cause"]
    B --> C["Phase C: Test / Spring"]
    C --> D["Phase D: Break Structure"]
    D --> E["Phase E: Markup"]`
  },
  {
    id: 't6',
    name: 'News Event Handling',
    category: 'Flow',
    description: 'Protocol for trading around high-impact news.',
    code: `graph TD
    A[Check Economic Calendar] --> B{"High Impact News?"}
    B -- Yes --> C["Close/Hedge Open Positions"]
    B -- No --> D[Normal Trading]
    C --> E[Wait 15m Post-Release]
    E --> F{"Spreads Normalized?"}
    F -- Yes --> G[Analyze New Structure]
    G --> H[Resume Trading]`
  },
  {
    id: 't7',
    name: 'Impulse vs Correction',
    category: 'Structure',
    description: 'Identifying the nature of price movement.',
    code: `graph TD
    A[Analyze Leg] --> B{"Speed & Angle?"}
    B -- Steep/Fast --> C[Impulsive Move]
    B -- Shallow/Slow --> D[Corrective Move]
    C --> E[Trade WITH Direction]
    D --> F[Wait for Breakout]`
  },
  {
    id: 't8',
    name: 'Entry Trigger Checklist',
    category: 'Flow',
    description: 'Final confirmation steps before clicking buy/sell.',
    code: `graph TD
    A[POI Reached] --> B{"Reaction?"}
    B -- Yes --> C{"MSS on M5/M1?"}
    C -- Yes --> D{"R:R > 1:2?"}
    D -- Yes --> E{"Spread Acceptable?"}
    E -- Yes --> F[EXECUTE]`
  },

  // --- MINDMAPS (Psychology & Planning) ---
  {
    id: 't9',
    name: 'Risk Management Plan',
    category: 'Mindmap',
    description: 'Core rules for protecting capital.',
    code: `mindmap
  root((Risk Plan))
    Capital Preservation
      Max Daily Loss 3%
      Max Drawdown 10%
    Position Sizing
      1% Risk per Trade
      Fixed Fractional
    Stop Loss
      Technical Invalid.
      Never Move to Loss
    Profit Taking
      Scale out at 2R
      Trail SL to BE`
  },
  {
    id: 't10',
    name: 'Trading Psychology',
    category: 'Mindmap',
    description: 'Mental checklist and state management.',
    code: `mindmap
  root((Psychology))
    Pre-Session
      Meditate
      Review Goals
      Accept Risk
    During Trade
      No FOMO
      Stick to Plan
      Think Probabilities
    Post-Trade
      Journal Result
      No Revenge Trading`
  },
  {
    id: 't11',
    name: 'Trading Edge Components',
    category: 'Mindmap',
    description: 'What makes up your competitive advantage.',
    code: `mindmap
  root((My Edge))
    Technical
      Liquidity Concepts
      Market Structure
    Execution
      Fast Entries
      Strict Rules
    Data
      Backtesting
      Journal Stats`
  },
  {
    id: 't12',
    name: 'Confluence Factors',
    category: 'Mindmap',
    description: 'Stacking probabilities for a trade.',
    code: `mindmap
  root((Confluence))
    Time
      Killzone
      Day of Week
    Price
      Premium/Discount
      Key Level
    Pattern
      MSS
      FVG`
  },

  // --- SEQUENCE (Execution & Process) ---
  {
    id: 't13',
    name: 'Order Execution Sequence',
    category: 'Sequence',
    description: 'The technical lifecycle of a trade order.',
    code: `sequenceDiagram
    participant T as Trader
    participant C as Chart
    participant B as Broker
    T->>C: Analyze Setup
    C-->>T: Valid Signal
    T->>B: Calculate Risk (Lots)
    T->>B: Send Limit Order
    B-->>T: Order Pending
    B->>B: Price Hits Entry
    B-->>T: Position Open
    B->>B: Price Hits TP
    B-->>T: Trade Closed (Profit)`
  },
  {
    id: 't14',
    name: 'Journaling Process',
    category: 'Sequence',
    description: 'Steps to take after a trade is closed.',
    code: `sequenceDiagram
    participant T as Trader
    participant J as Journal
    participant D as Database
    T->>J: Open Entry Log
    T->>J: Input Price/Time
    T->>J: Upload Screenshot
    T->>J: Rate Psychology
    J->>D: Save Record
    D-->>T: Update Statistics`
  },

  // --- ROUTINE (Gantt) ---
  {
    id: 't15',
    name: 'Daily Trading Routine',
    category: 'Routine',
    description: 'Schedule for a professional trading day.',
    code: `gantt
    title Daily Trading Routine
    dateFormat HH:mm
    axisFormat %H:%mm
    
    section Prep
    Wake Up & Hydrate : 06:00, 30m
    Meditation/Workout : 06:30, 60m
    Chart Analysis : 07:30, 60m
    
    section NY Session
    Session Open : 08:30, 0m
    Trading Window : 08:30, 180m
    No New Trades : 11:30, 0m
    
    section Review
    Journaling : 12:00, 30m
    End of Day : 12:30, 0m`
  },
  {
    id: 't16',
    name: 'Weekly Workflow',
    category: 'Routine',
    description: 'High-level schedule for the week.',
    code: `gantt
    title Weekly Workflow
    dateFormat  YYYY-MM-DD
    section Tasks
    Wkly Forecast    :active, 2023-10-01, 1d
    Trading Days     :2023-10-02, 5d
    Mid-Week Review  :2023-10-04, 1d
    Wkly Review      :2023-10-07, 1d`
  },

  // --- STRUCTURE (Class/State) ---
  {
    id: 't17',
    name: 'Trade Lifecycle State',
    category: 'Structure',
    description: 'States a trade goes through.',
    code: `stateDiagram-v2
    [*] --> Scanning
    Scanning --> Pending : Setup Found
    Pending --> Open : Triggered
    Pending --> Scanning : Cancelled
    Open --> Managing : In Profit
    Open --> Closed : Stop Loss
    Managing --> Closed : Take Profit
    Closed --> Review
    Review --> [*]`
  },
  {
    id: 't18',
    name: 'Trading System Architecture',
    category: 'Structure',
    description: 'Components of a mechanical system.',
    code: `classDiagram
    class System {
      +String Name
      +List Rules
      +float WinRate
    }
    class Entry {
      +checkCriteria()
      +trigger()
    }
    class Exit {
      +fixedTarget()
      +trailingStop()
    }
    System *-- Entry
    System *-- Exit`
  },
  {
    id: 't19',
    name: 'Compounding Plan',
    category: 'Flow',
    description: 'Logic for increasing position size over time.',
    code: `graph TD
    A[Start Month] --> B{"Profitable Month?"}
    B -- Yes --> C[Increase Risk +0.25%]
    B -- No --> D{"Drawdown > 5%?"}
    D -- Yes --> E[Decrease Risk -0.5%]
    D -- No --> F[Keep Risk Same]
    C --> G[Next Month]
    E --> G
    F --> G`
  },
  {
    id: 't20',
    name: 'Probabilistic Thinking',
    category: 'Mindmap',
    description: 'Thinking in large sample sizes.',
    code: `mindmap
  root((Probabilities))
    Sample Size
      20 Trade Block
      Law of Large Numbers
    Outcome
      Random Distribution
      Win/Loss is Independent
    Goal
      Execute Edge
      Let Math Work`
  }
];

const DiagramEditor: React.FC<DiagramEditorProps> = ({ isDarkMode }) => {
  const { addToast } = useToast();
  const [code, setCode] = useState<string>(TEMPLATES[0].code);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Customization
  const [diagramTheme, setDiagramTheme] = useState<'default' | 'forest' | 'neutral' | 'dark' | 'base'>('default');

  // Persistence State
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);
  const [diagramName, setDiagramName] = useState('New Strategy Map');
  const [savedDiagrams, setSavedDiagrams] = useState<StrategyDiagram[]>([]);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Template Browser State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [favorites, setFavorites] = useState<string[]>(['t1', 't2', 't9']); // Default favorites

  const outputRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Load saved diagrams on mount
  useEffect(() => {
    fetchSavedDiagrams();
  }, []);

  const fetchSavedDiagrams = async () => {
    try {
      const data = await dataService.getDiagrams();
      setSavedDiagrams(data);
    } catch (err) {
      console.error("Failed to fetch diagrams:", err);
    }
  };

  const handleSave = async () => {
    if (!diagramName.trim()) {
      addToast({ type: 'warning', title: 'Name Required', message: 'Please give your strategy map a name.' });
      return;
    }

    try {
      setIsSaving(true);
      const saved = await dataService.saveDiagram({
        id: currentDiagramId || undefined,
        name: diagramName,
        code: code,
        category: 'Custom'
      });
      
      if (!currentDiagramId) setCurrentDiagramId(saved.id);
      
      fetchSavedDiagrams();
      addToast({ type: 'success', title: 'Strategy Saved', message: `"${diagramName}" has been saved to your profile.` });
    } catch (err) {
      console.error("Save failed:", err);
      addToast({ type: 'error', title: 'Save Failed', message: 'Could not save the diagram.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadDiagram = (diagram: StrategyDiagram) => {
    setCode(diagram.code);
    setDiagramName(diagram.name);
    setCurrentDiagramId(diagram.id);
    setIsLoadModalOpen(false);
    addToast({ type: 'info', title: 'Diagram Loaded', message: `"${diagram.name}" is now active.` });
  };

  const handleDeleteDiagram = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this saved strategy map?")) return;

    try {
      await dataService.deleteDiagram(id);
      if (currentDiagramId === id) {
        setCurrentDiagramId(null);
        setDiagramName('New Strategy Map');
      }
      fetchSavedDiagrams();
      addToast({ type: 'success', title: 'Deleted', message: 'Strategy map removed.' });
    } catch (err) {
      console.error("Delete failed:", err);
      addToast({ type: 'error', title: 'Delete Failed', message: 'Could not delete the diagram.' });
    }
  };

  const handleNewDiagram = () => {
    if (code !== TEMPLATES[0].code && !confirm("Discard current changes and start a new diagram?")) return;
    setCode(TEMPLATES[0].code);
    setDiagramName('New Strategy Map');
    setCurrentDiagramId(null);
  };

  // Initialize Mermaid with dynamic theme
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: diagramTheme === 'default' ? (isDarkMode ? 'dark' : 'default') : diagramTheme,
      securityLevel: 'loose',
      fontFamily: 'Inter',
    });
    // Force re-render when theme changes
    renderDiagram();
  }, [isDarkMode, diagramTheme]);

  // Render Diagram
  const renderDiagram = async () => {
      // Check if ref exists before starting
      if (!outputRef.current) return;

      try {
        const { svg } = await mermaid.render(`mermaid-${Date.now()}`, code);
        
        // Critical: Check if ref STILL exists after async operation to prevent "Cannot set properties of null"
        if (outputRef.current) {
            outputRef.current.innerHTML = svg;
            setError(null);
        }
      } catch (e: any) {
        console.error("Mermaid Render Error", e);
        // Only set error if it's a parse error to avoid flashing during typing
        if (e.message && e.message.includes('Parse error')) {
           setError("Syntax Error: " + e.message.split('\n')[0]);
        }
      }
  };

  useEffect(() => {
    const timeoutId = setTimeout(renderDiagram, 500);
    return () => clearTimeout(timeoutId);
  }, [code]);

  const handleGenerate = async (mode: 'new' | 'refine' = 'new') => {
    if (!prompt.trim() && mode === 'new') return;
    setIsGenerating(true);
    
    try {
      const apiKey = process.env.API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });
      
      let systemPrompt = '';
      let userContent = '';

      if (mode === 'new') {
          systemPrompt = `You are an expert in Mermaid.js diagramming for trading strategies. 
          Convert the user's description into valid Mermaid code. 
          Return ONLY the raw Mermaid code. Do not include markdown blocks.`;
          userContent = prompt;
      } else {
          systemPrompt = `You are an expert in Mermaid.js. 
          The user wants to REFINE or FIX the existing diagram code.
          Take the provided code and the user's instruction.
          Return ONLY the updated raw Mermaid code. No markdown blocks.`;
          userContent = `CURRENT CODE:\n${code}\n\nINSTRUCTION:\n${prompt || "Optimize layout and fix any syntax errors."}`;
      }

      // Fixed: Using the correct model for text tasks as per guidelines
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userContent,
        config: {
            systemInstruction: systemPrompt,
            temperature: 0.2
        }
      });
      
      const generatedCode = response.text.replace(/```mermaid/g, '').replace(/```/g, '').trim();
      setCode(generatedCode);
      if (mode === 'new') setPrompt(''); // Clear prompt if new generation
    } catch (err) {
      console.error(err);
      setError("AI Generation Failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const insertSnippet = (snippet: string) => {
    if (editorRef.current) {
        const start = editorRef.current.selectionStart;
        const end = editorRef.current.selectionEnd;
        const text = editorRef.current.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        const newText = before + snippet + after;
        setCode(newText);
        
        // Restore focus
        setTimeout(() => {
            if (editorRef.current) {
                editorRef.current.focus();
                editorRef.current.selectionStart = start + snippet.length;
                editorRef.current.selectionEnd = start + snippet.length;
            }
        }, 0);
    }
  };

  const handleDownload = () => {
      const svg = outputRef.current?.querySelector('svg');
      if (svg) {
          const svgData = new XMLSerializer().serializeToString(svg);
          const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `strategy-map-${Date.now()}.svg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const loadTemplate = (template: Template) => {
      setCode(template.code);
      setIsTemplateModalOpen(false);
  };

  const filteredTemplates = useMemo(() => {
      return TEMPLATES.filter(t => {
          const matchesSearch = t.name.toLowerCase().includes(templateSearch.toLowerCase()) || 
                                t.description.toLowerCase().includes(templateSearch.toLowerCase());
          const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory || (selectedCategory === 'Favorites' && favorites.includes(t.id));
          return matchesSearch && matchesCategory;
      });
  }, [templateSearch, selectedCategory, favorites]);

  return (
    <div className={`w-full h-full flex flex-col p-6 overflow-hidden relative ${isDarkMode ? 'bg-zinc-950 text-zinc-200' : 'bg-slate-50 text-slate-900'}`}>
      
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div className="flex-1">
           <div className="flex items-center gap-3 mb-1">
              <input 
                value={diagramName}
                onChange={(e) => setDiagramName(e.target.value)}
                className={`text-2xl font-bold tracking-tight bg-transparent border-b-2 border-transparent focus:border-indigo-500 outline-none transition-all ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                placeholder="Strategy Name"
              />
              <button onClick={handleNewDiagram} className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-zinc-500" title="New Diagram">
                <Plus size={16} />
              </button>
           </div>
           <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Visualize trading algorithms, risk plans, and logic flows.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
             <div className="flex items-center gap-2 mr-2">
                 <span className="text-xs font-bold uppercase opacity-50">Theme:</span>
                 <Select 
                    value={diagramTheme}
                    onChange={(val) => setDiagramTheme(val as any)}
                    options={[
                        { value: 'default', label: 'Auto' },
                        { value: 'base', label: 'Simple' },
                        { value: 'forest', label: 'Forest' },
                        { value: 'neutral', label: 'Neutral' },
                        { value: 'dark', label: 'Dark' },
                    ]}
                    isDarkMode={isDarkMode}
                    className="w-32"
                 />
             </div>

            <button 
                onClick={() => setIsLoadModalOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${isDarkMode ? 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-indigo-400' : 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100 text-indigo-600'}`}
            >
                <FolderOpen size={16} /> Load Saved
            </button>

            <button 
                onClick={handleSave}
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50`}
            >
                {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} 
                {currentDiagramId ? 'Update' : 'Save Mapper'}
            </button>

            <div className={`w-px h-8 mx-1 ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}`} />

            <button 
                onClick={() => setIsTemplateModalOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${isDarkMode ? 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
            >
                <LayoutTemplate size={16} /> Templates
            </button>
            <button 
                onClick={handleDownload}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${isDarkMode ? 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
            >
                <Download size={16} /> Export
            </button>
        </div>
      </header>

      <div className="flex-1 flex gap-6 min-h-0">
        
        {/* Left Pane: Editor */}
        <div className="w-1/3 flex flex-col gap-4 min-w-[350px]">
            {/* AI Prompter */}
            <div className={`p-4 rounded-xl border flex flex-col gap-3 ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-indigo-500">
                        <Sparkles size={16} /> AI Architect
                    </div>
                    {code.length > 0 && (
                        <button 
                            onClick={() => handleGenerate('refine')}
                            disabled={isGenerating}
                            className={`text-[10px] px-2 py-1 rounded border flex items-center gap-1 ${isDarkMode ? 'border-zinc-700 hover:bg-zinc-800' : 'border-slate-200 hover:bg-slate-50'}`}
                        >
                            <Wand2 size={10} /> Refine Code
                        </button>
                    )}
                </div>
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe strategy (e.g. 'Flowchart for ICT Silver Bullet') OR instructions to refine (e.g. 'Add color red to bearish nodes')"
                    className={`w-full h-16 bg-transparent outline-none resize-none text-xs placeholder:opacity-50 ${isDarkMode ? 'text-white placeholder-zinc-600' : 'text-slate-900 placeholder-slate-400'}`}
                />
                <button 
                    onClick={() => handleGenerate('new')}
                    disabled={isGenerating || !prompt}
                    className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
                >
                    {isGenerating ? <RefreshCw className="animate-spin" size={14}/> : <Play size={14}/>}
                    Generate New Diagram
                </button>
            </div>

            {/* Quick Syntax Toolbar */}
            <div className={`px-2 py-1.5 rounded-t-xl border-x border-t flex items-center gap-1 overflow-x-auto no-scrollbar ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-200'}`}>
                {[
                    { label: 'Node', code: 'A[Label]', icon: Box },
                    { label: 'Decision', code: 'B{Check?}', icon: Diamond },
                    { label: 'Circle', code: 'C((End))', icon: Circle },
                    { label: 'Arrow', code: ' --> ', icon: ArrowRight },
                    { label: 'Dotted', code: ' -.-> ', icon: ArrowRight, className: 'border-dashed border-b' },
                    { label: 'Group', code: '\nsubgraph Name\n  A --> B\nend\n', icon: Grid },
                ].map((item, i) => (
                    <button
                        key={i}
                        onClick={() => insertSnippet(item.code)}
                        title={`Insert ${item.label}`}
                        className={`p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-zinc-500 ${item.className || ''}`}
                    >
                        <item.icon size={14} />
                    </button>
                ))}
                <div className="w-px h-4 bg-current opacity-20 mx-1" />
                <button onClick={() => insertSnippet('graph TD\n')} className="text-[10px] font-mono px-2 hover:bg-black/10 rounded">TD</button>
                <button onClick={() => insertSnippet('graph LR\n')} className="text-[10px] font-mono px-2 hover:bg-black/10 rounded">LR</button>
            </div>

            {/* Code Editor */}
            <div className={`flex-1 rounded-b-xl border-x border-b overflow-hidden flex flex-col relative ${isDarkMode ? 'bg-[#0c0c0e] border-zinc-800' : 'bg-white border-slate-200'}`}>
                <textarea 
                    ref={editorRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className={`flex-1 p-4 bg-transparent outline-none font-mono text-sm resize-none leading-relaxed custom-scrollbar ${isDarkMode ? 'text-zinc-300' : 'text-slate-700'}`}
                    spellCheck={false}
                    placeholder="Mermaid syntax goes here..."
                />
                <button 
                    onClick={() => navigator.clipboard.writeText(code)} 
                    className="absolute top-2 right-2 p-1.5 rounded bg-black/10 hover:bg-black/20 text-zinc-500"
                >
                    <Copy size={12} />
                </button>
            </div>
        </div>

        {/* Right Pane: Preview */}
        <div 
            className={`
                transition-all duration-300
                ${isFullScreen 
                    ? 'fixed inset-0 z-50 p-6 flex flex-col' 
                    : 'flex-1 rounded-xl border relative flex flex-col'
                }
                ${isDarkMode ? 'bg-[#0c0c0e] border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}
            `}
        >
            <div className={`absolute top-4 right-4 z-10 flex gap-2 ${isFullScreen ? 'bg-black/20 p-2 rounded-xl backdrop-blur-md' : ''}`}>
                <button onClick={() => setScale(s => Math.min(s + 0.1, 2))} className={`p-2 rounded-lg backdrop-blur-sm border ${isDarkMode ? 'bg-black/20 border-white/10 hover:bg-white/10' : 'bg-white/50 border-slate-200 hover:bg-white'}`}>
                    <ZoomIn size={16} />
                </button>
                <button onClick={() => setScale(s => Math.max(s - 0.1, 0.5))} className={`p-2 rounded-lg backdrop-blur-sm border ${isDarkMode ? 'bg-black/20 border-white/10 hover:bg-white/10' : 'bg-white/50 border-slate-200 hover:bg-white'}`}>
                    <ZoomOut size={16} />
                </button>
                <div className={`w-px h-8 mx-1 ${isDarkMode ? 'bg-white/10' : 'bg-slate-300'}`} />
                <button 
                    onClick={() => setIsFullScreen(!isFullScreen)} 
                    className={`p-2 rounded-lg backdrop-blur-sm border ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/30' : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'}`}
                >
                    {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
            </div>

            {error && (
                <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={12} /> 
                    <span>{error}</span>
                    <button onClick={() => handleGenerate('refine')} className="underline ml-2">Fix with AI</button>
                </div>
            )}

            <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[radial-gradient(#88888822_1px,transparent_1px)] [background-size:20px_20px] custom-scrollbar">
                <div 
                    ref={outputRef}
                    className="transition-transform duration-200 origin-center"
                    style={{ transform: `scale(${scale})` }}
                />
            </div>
            
            {isFullScreen && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs opacity-50 font-medium pointer-events-none">
                    Press Esc to exit full screen
                </div>
            )}
        </div>
      </div>

      {/* --- Templates Modal --- */}
      {isTemplateModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div 
                  className={`w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden ${isDarkMode ? 'bg-[#09090b] border border-[#27272a]' : 'bg-white'}`}
                  onClick={(e) => e.stopPropagation()}
              >
                  {/* Modal Header */}
                  <div className={`px-6 py-4 border-b shrink-0 flex items-center justify-between ${isDarkMode ? 'border-[#27272a]' : 'border-slate-100'}`}>
                      <div>
                          <h2 className="text-lg font-bold">Template Library</h2>
                          <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Select a starting point for your strategy map.</p>
                      </div>
                      <button onClick={() => setIsTemplateModalOpen(false)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                          <X size={20} />
                      </button>
                  </div>

                  {/* Modal Toolbar */}
                  <div className={`px-6 py-3 border-b shrink-0 flex gap-4 overflow-x-auto ${isDarkMode ? 'border-[#27272a] bg-[#121215]' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="relative flex-1 max-w-xs">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input 
                              value={templateSearch}
                              onChange={(e) => setTemplateSearch(e.target.value)}
                              placeholder="Search templates..."
                              className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none border ${isDarkMode ? 'bg-zinc-900 border-zinc-700 focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-500'}`}
                          />
                      </div>
                      <div className="flex gap-1">
                          {['All', 'Favorites', 'Flow', 'Mindmap', 'Sequence', 'Routine'].map(cat => (
                              <button
                                  key={cat}
                                  onClick={() => setSelectedCategory(cat)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                      selectedCategory === cat 
                                      ? 'bg-indigo-600 text-white border-indigo-600' 
                                      : isDarkMode ? 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-300' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                                  }`}
                              >
                                  {cat}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Template Grid */}
                  <div className="flex-1 overflow-y-auto p-6 bg-[radial-gradient(#88888811_1px,transparent_1px)] [background-size:20px_20px]">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredTemplates.map(template => (
                              <div 
                                  key={template.id}
                                  onClick={() => loadTemplate(template)}
                                  className={`group relative p-5 rounded-xl border cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col gap-3 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-indigo-500/50' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                              >
                                  <div className="flex justify-between items-start">
                                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
                                          {template.category}
                                      </span>
                                      <button 
                                          onClick={(e) => toggleFavorite(template.id, e)}
                                          className={`p-1.5 rounded-full transition-colors hover:bg-rose-500/10 ${favorites.includes(template.id) ? 'text-rose-500' : 'text-zinc-600'}`}
                                      >
                                          <Heart size={16} fill={favorites.includes(template.id) ? "currentColor" : "none"} />
                                      </button>
                                  </div>
                                  
                                  <div>
                                      <h3 className="font-bold text-base mb-1 group-hover:text-indigo-500 transition-colors">{template.name}</h3>
                                      <p className={`text-xs line-clamp-2 ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
                                          {template.description}
                                      </p>
                                  </div>

                                  <div className={`mt-auto pt-3 border-t text-xs font-mono opacity-50 flex items-center gap-1 ${isDarkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
                                      <Code size={12} /> {template.code.length} chars
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

              </div>
          </div>
      )}

      {/* --- Load Saved Modal --- */}
      {isLoadModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div 
                  className={`w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden ${isDarkMode ? 'bg-[#09090b] border border-[#27272a]' : 'bg-white'}`}
                  onClick={(e) => e.stopPropagation()}
              >
                  <div className={`px-6 py-4 border-b shrink-0 flex items-center justify-between ${isDarkMode ? 'border-[#27272a]' : 'border-slate-100'}`}>
                      <h2 className="text-lg font-bold">Saved Strategy Maps</h2>
                      <button onClick={() => setIsLoadModalOpen(false)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                          <X size={20} />
                      </button>
                  </div>

                  <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                      {savedDiagrams.length === 0 ? (
                          <div className="py-12 text-center opacity-40">
                              <FolderOpen size={48} className="mx-auto mb-4" />
                              <p className="font-bold">No saved strategy maps yet.</p>
                              <p className="text-sm">Save your first one to see it here!</p>
                          </div>
                      ) : (
                          <div className="space-y-2">
                              {savedDiagrams.map(diagram => (
                                  <div 
                                      key={diagram.id}
                                      onClick={() => handleLoadDiagram(diagram)}
                                      className={`p-4 rounded-xl border flex items-center justify-between group cursor-pointer transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-indigo-500' : 'bg-slate-50 border-slate-200 hover:border-indigo-300'}`}
                                  >
                                      <div>
                                          <h4 className="font-bold group-hover:text-indigo-500 transition-colors">{diagram.name}</h4>
                                          <p className="text-[10px] opacity-40 font-mono uppercase">
                                              Last updated: {new Date(diagram.updatedAt).toLocaleDateString()}
                                          </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <button 
                                              onClick={(e) => handleDeleteDiagram(diagram.id, e)}
                                              className="p-2 rounded-lg text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 transition-all"
                                              title="Delete"
                                          >
                                              <Trash2 size={16} />
                                          </button>
                                          <ArrowRight size={16} className="text-zinc-500" />
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default DiagramEditor;
