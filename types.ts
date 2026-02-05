
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface Point {
    time: number;
    price: number;
    logical?: number;
}

export type ToolType = 'cursor' | 'trendline' | 'ray' | 'arrow' | 'rect' | 'vertical' | 'horizontal' | 'long' | 'short';

export interface Drawing {
    id: string;
    type: ToolType;
    p1: Point;
    p2?: Point;
    color?: string;
    strokeWidth?: number;
    strokeStyle?: 'solid' | 'dashed' | 'dotted';
    isLocked?: boolean;
    syncAllTimeframes?: boolean;
    // Position Tool specific
    entry?: number;
    target?: number;
    stop?: number;
}

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
  themePreference: 'default' | 'midnight' | 'cosmic';
  chartConfig?: any;
  keepChartsAlive?: boolean;
  defaultRR?: number;
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
  openTime?: string; // ISO or Full SAST string
  closeTime?: string; // ISO or Full SAST string
  tags: string[];
  notes?: string;
  emotions?: string[];
  planAdherence?: 'Followed Exactly' | 'Minor Deviation' | 'Major Deviation' | 'No Plan';
  tradingMistake?: string;
  mindset?: string;
  exitComment?: string;
  beforeScreenshot?: string;
  afterScreenshot?: string;
  setupId?: string;
  deletedAt?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  tags: string[];
  color: string;
  isPinned?: boolean;
  isArchived?: boolean;
  isTrashed?: boolean;
  isList?: boolean;
  listItems?: {
    id: string;
    text: string;
    checked: boolean;
    indentLevel?: number;
  }[];
  image?: string;
  tableData?: {
    rows: string[][];
  };
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

export interface EAAccountData {
  balance: number;
  equity: number;
  profit: number;
  margin: number;
  margin_level: number;
  company: string;
  login: number;
  server: string;
  is_demo: boolean;
  currency: string;
  leverage: number;
}

export interface EAPosition {
  ticket: number;
  symbol: string;
  volume: number;
  type: 'BUY' | 'SELL';
  open_price: number;
  current_price: number;
  profit: number;
  magic?: number;
  comment?: string;
  time?: number;
}

export interface EADeal {
  ticket: number;
  order: number;
  time: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  entry: number;
  price: number;
  volume: number;
  profit: number;
  swap?: number;
  commission?: number;
  entry_time?: number;
  entry_price?: number;
}

export interface EASessionData {
  account: EAAccountData;
  openPositions: EAPosition[];
  trades: EADeal[];
  isHeartbeat?: boolean;
}

export interface EASession {
  id: string;
  sync_key: string;
  data: EASessionData;
  last_updated: string;
}

export interface DBTrade {
  id: string;
  user_id: string;
  ticket_id?: string;
  pair: string;
  asset_type: AssetType;
  date: string;
  time: string;
  session: string;
  direction: 'Long' | 'Short';
  entry_price: number;
  exit_price?: number;
  stop_loss: number;
  take_profit: number;
  lots: number;
  result: 'Win' | 'Loss' | 'BE' | 'Pending';
  pnl: number;
  rr: number;
  rating: number;
  tags: string[];
  notes?: string;
  emotions?: string[];
  plan_adherence?: Trade['planAdherence'];
  trading_mistake?: string;
  mindset?: string;
  exit_comment?: string;
  open_time?: string;
  close_time?: string;
  before_screenshot?: string;
  after_screenshot?: string;
  setup_id?: string;
  deleted_at?: string;
}

export interface DBGoal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  type: GoalType;
  metric: MetricType;
  target_value: number;
  start_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'failed' | 'paused';
  milestones: GoalMilestone[];
  auto_track_rule?: Goal['autoTrackRule'];
  manual_entries?: ManualEntry[];
  created_at: string;
}

export interface BacktestTrade {
  type: 'BUY' | 'SELL';
  entry: number;
  exit: number;
  lots: number;
  pnl: number;
  time: number;
}

export interface BacktestSession {
  id: string;
  user_id: string;
  symbol: string;
  timeframe: string;
  data: any[];
  drawings: any[];
  trades: BacktestTrade[];
  updated_at: string;
}
