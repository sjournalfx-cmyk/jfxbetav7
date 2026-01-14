
export const APP_CONSTANTS = {
  STORAGE_KEYS: {
    THEME: 'jfx_theme_mode', // Changed to mode to support future light/dark/system
    THEME_DARK: 'jfx_theme_dark',
  },
  VIEWS: {
    DASHBOARD: 'dashboard',
    LOG_TRADE: 'log-trade',
    JOURNAL: 'history',
    ANALYTICS: 'analytics',
    GOALS: 'goals',
    NOTES: 'notes',
    CHARTS: 'charts',
    DIAGRAMS: 'diagrams',
    CALCULATORS: 'calculators',
    SETTINGS: 'settings',
  },
  TABLES: {
    PROFILES: 'profiles',
    TRADES: 'trades',
    NOTES: 'notes',
    DAILY_BIAS: 'daily_bias',
    GOALS: 'goals',
  },
  PLANS: {
    FREE: 'FREE TIER (JOURNALER)',
    HOBBY: 'PRO TIER (ANALYSTS)',
    STANDARD: 'PREMIUM (MASTERS)',
  },
  CURRENCIES: [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  ]
};

export const PLAN_FEATURES = {
  [APP_CONSTANTS.PLANS.FREE]: {
    maxTradesPerMonth: 50,
    maxNotes: 1,
    maxImages: 0,
    allowImageUploads: false,
    advancedAnalytics: false, // Growth, Discipline tabs
    comparisonAnalytics: false,
    multiChartLayouts: false,
    directBrokerSync: false,
    aiInsights: false,
    voiceNotes: false,
  },
  [APP_CONSTANTS.PLANS.HOBBY]: { // PRO
    maxTradesPerMonth: 500,
    maxNotes: Infinity,
    maxImages: 1000,
    allowImageUploads: true,
    advancedAnalytics: true,
    comparisonAnalytics: false,
    multiChartLayouts: false,
    directBrokerSync: false,
    aiInsights: false,
    voiceNotes: false,
  },
  [APP_CONSTANTS.PLANS.STANDARD]: { // PREMIUM
    maxTradesPerMonth: Infinity,
    maxNotes: Infinity,
    maxImages: Infinity,
    allowImageUploads: true,
    advancedAnalytics: true,
    comparisonAnalytics: true,
    multiChartLayouts: true,
    directBrokerSync: false, // Excluded for now
    aiInsights: false, // Excluded for now
    voiceNotes: false, // Excluded for now
  }
};
