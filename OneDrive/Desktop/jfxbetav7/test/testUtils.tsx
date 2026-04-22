import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

export const createMockUserProfile = (overrides = {}) => ({
  name: 'Test User',
  country: 'US',
  accountName: 'Test Account',
  initialBalance: 10000,
  currency: 'USD',
  currencySymbol: '$',
  syncMethod: 'Manual' as const,
  experienceLevel: 'Intermediate' as const,
  tradingStyle: 'Day Trader' as const,
  onboarded: true,
  plan: 'free',
  themePreference: 'obsidian' as const,
  ...overrides,
});

export const createMockTrade = (overrides = {}) => ({
  id: 'trade-1',
  pair: 'EURUSD',
  assetType: 'Forex' as const,
  date: '2026-02-19',
  time: '10:30:00',
  session: 'London',
  direction: 'Long' as const,
  entryPrice: 1.0850,
  exitPrice: 1.0870,
  stopLoss: 1.0820,
  takeProfit: 1.0900,
  lots: 0.1,
  result: 'Win' as const,
  pnl: 20,
  rr: 2,
  rating: 4,
  tags: ['breakout', 'london-session'],
  notes: 'Good trade',
  emotions: ['confident'],
  planAdherence: 'Followed Exactly' as const,
  ...overrides,
});

export const createMockNote = (overrides = {}) => ({
  id: 'note-1',
  title: 'Test Note',
  content: 'This is a test note',
  date: '2026-02-19',
  tags: ['strategy'],
  color: '#FF4F01',
  isPinned: false,
  isArchived: false,
  isTrashed: false,
  isList: false,
  ...overrides,
});

export const createMockGoal = (overrides = {}) => ({
  id: 'goal-1',
  title: 'Monthly Profit',
  description: 'Reach $500 profit',
  type: 'Financial' as const,
  metric: 'currency' as const,
  targetValue: 500,
  startValue: 0,
  startDate: '2026-02-01',
  endDate: '2026-02-28',
  milestones: [],
  status: 'active' as const,
  createdAt: '2026-02-01',
  ...overrides,
});

export * from '@testing-library/react';
export { render, screen, fireEvent, waitFor, within };
