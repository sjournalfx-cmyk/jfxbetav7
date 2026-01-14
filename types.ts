
export interface UserProfile {
  name: string;
  country: string;
  accountName: string;
  initialBalance: number;
  currency: string;
  currencySymbol: string;
  syncMethod: 'Manual' | 'EA_CONNECT' | 'BROKER_SYNC';
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro';
  tradingStyle: 'Scalper' | 'Day Trader' | 'Swing Trader' | 'Investor';
  onboarded: boolean;
  plan: string;
  syncKey?: string;
  eaConnected?: boolean;
  autoJournal?: boolean;
  avatarUrl?: string;
  themePreference?: 'default' | 'midnight';
  chartConfig?: any;
  keepChartsAlive?: boolean;
  isBetaTester?: boolean;
  feedbackSent?: boolean;
}

export type AssetType = 'Forex' | 'Indices' | 'Commodities' | 'Crypto' | 'Stocks';

export interface Trade {
  id: string;
  ticketId?: string;
  pair: string;
  assetType: AssetType;
  date: string;
  time: string;
  session: string;
  direction: 'Long' | 'Short';
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit: number;
  lots: number;
  result: 'Win' | 'Loss' | 'BE' | 'Pending';
  pnl: number;
  rr: number;
  rating: number;
  tags: string[];
  notes?: string;
  emotions?: string[];
  planAdherence?: 'Followed Exactly' | 'Minor Deviation' | 'Major Deviation' | 'No Plan';
  tradingMistake?: string;
  mindset?: string;
  exitComment?: string;
  beforeScreenshot?: string;
  afterScreenshot?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  tags: string[];
  color: 'yellow' | 'blue' | 'green' | 'purple' | 'rose' | 'gray';
  isPinned?: boolean;
}

export interface DailyBias {
  date: string; // YYYY-MM-DD
  bias: 'Bullish' | 'Bearish' | 'Neutral';
  notes?: string;
  actualOutcome?: 'Aligned' | 'Against' | 'Mixed';
}

export type GoalType = 'Financial' | 'Process' | 'Skill' | 'Risk' | 'Milestone';
export type MetricType = 'currency' | 'percentage' | 'count' | 'boolean';

export interface GoalMilestone {
  id: string;
  title: string;
  targetValue: number;
  isAchieved: boolean;
  dateAchieved?: string;
}

export interface ManualEntry {
  id: string;
  value: number;
  date: string;
  note?: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  type: GoalType;
  metric: MetricType;
  targetValue: number;
  startValue: number;
  startDate: string;
  endDate: string;
  autoTrackRule?: {
    type: 'pnl' | 'win_rate' | 'trade_count' | 'drawdown';
    filterTag?: string;
  };
  manualProgress?: number;
  manualEntries?: ManualEntry[];
  milestones: GoalMilestone[];
  status: 'active' | 'completed' | 'failed' | 'paused';
  createdAt: string;
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export interface Rule {
  id: string;
  text: string;
  isActive: boolean;
}

export interface RuleSection {
  id: string;
  title: string;
  description?: string;
  iconName: string;
  rules: Rule[];
}

export type LogicPhase = 'Setup' | 'Trigger' | 'Management';
export type RuleType = 'Hard' | 'Soft';

export interface LogicRule {
  id: string;
  description: string;
  phase: LogicPhase;
  type: RuleType;
  points?: number;
}

export interface PlaybookEntry {
  id: string;
  title: string;
  setupType: 'Reversal' | 'Continuation' | 'Breakout' | 'Range' | 'Scalp';
  market: 'Forex' | 'Indices' | 'Crypto' | 'Commodities' | 'Stocks';
  description: string;
  imageUrl: string;
  imageUrls?: string[];
  tags: string[];
  date: string;
  rating: number;
  timeframe: string;
  minRR: number;
  maxRisk: number;
  baselineWinRate?: number;
  baselineRR?: number;
  avgWinRate?: number;
  bestSession: string;
  logicRules: LogicRule[];
  invalidationRules?: string;
  phaseImages?: Record<string, string>;
  status: 'Incubating' | 'Active' | 'Archived';
  lastUpdated: string;
}

export interface StrategyDiagram {
  id: string;
  name: string;
  code: string;
  category?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
