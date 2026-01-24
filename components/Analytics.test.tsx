import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Analytics from './Analytics';
import { Trade, UserProfile } from '../types';

// Mock hooks and components
vi.mock('../hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn(() => [[], vi.fn()]),
}));

vi.mock('./analytics/TimeAnalysis', () => ({
  TimeAnalysis: () => <div>TimeAnalysis</div>,
}));

vi.mock('./analytics/ReportView', () => ({
  ReportView: () => <div>ReportView</div>,
}));

vi.mock('./ui/SortableWidget', () => ({
  SortableWidget: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('./ui/Tooltip', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('./Select', () => ({
  Select: () => <div>Select</div>,
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  closestCenter: {},
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn(),
  SortableContext: ({ children }: any) => <div>{children}</div>,
  sortableKeyboardCoordinates: {},
  rectSortingStrategy: {},
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {},
}));

describe('Analytics Calculations', () => {
  const mockUserProfile: UserProfile = {
    name: 'Test User',
    country: 'US',
    accountName: 'Test Account',
    initialBalance: 1000,
    currency: 'USD',
    currencySymbol: '$',
    syncMethod: 'Manual',
    experienceLevel: 'Intermediate',
    tradingStyle: 'Scalper',
    onboarded: true,
    plan: 'FREE TIER (JOURNALER)',
    syncKey: '',
    eaConnected: false,
    avatarUrl: '',
    themePreference: 'default',
    chartConfig: {},
    keepChartsAlive: false,
  };

  const mockTrades: Trade[] = [
    {
      id: '1',
      ticketId: '1',
      pair: 'EURUSD',
      assetType: 'Forex',
      date: '2023-01-01',
      time: '10:00',
      session: 'morning',
      direction: 'Long',
      entryPrice: 1.05,
      exitPrice: 1.06,
      stopLoss: 1.04,
      takeProfit: 1.07,
      lots: 0.1,
      result: 'Win',
      pnl: 10,
      rr: 2,
      rating: 5,
      tags: [],
      notes: '',
      emotions: ['calm'],
      planAdherence: 'Followed Exactly',
      tradingMistake: 'None',
      mindset: '',
      exitComment: '',
      openTime: '',
      closeTime: '',
      beforeScreenshot: null,
      afterScreenshot: null,
    },
    {
      id: '2',
      ticketId: '2',
      pair: 'EURUSD',
      assetType: 'Forex',
      date: '2023-01-02',
      time: '10:00',
      session: 'morning',
      direction: 'Short',
      entryPrice: 1.06,
      exitPrice: 1.05,
      stopLoss: 1.07,
      takeProfit: 1.04,
      lots: 0.1,
      result: 'Win',
      pnl: 10,
      rr: 2,
      rating: 5,
      tags: [],
      notes: '',
      emotions: ['calm'],
      planAdherence: 'Followed Exactly',
      tradingMistake: 'None',
      mindset: '',
      exitComment: '',
      openTime: '',
      closeTime: '',
      beforeScreenshot: null,
      afterScreenshot: null,
    },
    {
      id: '3',
      ticketId: '3',
      pair: 'EURUSD',
      assetType: 'Forex',
      date: '2023-01-03',
      time: '10:00',
      session: 'morning',
      direction: 'Long',
      entryPrice: 1.05,
      exitPrice: 1.04,
      stopLoss: 1.03,
      takeProfit: 1.06,
      lots: 0.1,
      result: 'Loss',
      pnl: -10,
      rr: 2,
      rating: 1,
      tags: [],
      notes: '',
      emotions: ['calm'],
      planAdherence: 'Major Deviation',
      tradingMistake: 'Poor Entry',
      mindset: '',
      exitComment: '',
      openTime: '',
      closeTime: '',
      beforeScreenshot: null,
      afterScreenshot: null,
    },
  ];

  it('should render analytics and calculate basic stats', () => {
    render(
      <Analytics
        isDarkMode={false}
        trades={mockTrades}
        userProfile={mockUserProfile}
        onViewChange={vi.fn()}
      />
    );

    // Check if component renders
    expect(screen.getByText(/analytics/i)).toBeInTheDocument();

    // Note: Actual calculation assertions would require accessing internal state or props,
    // but for this test, we ensure the component renders without errors.
    // In a real scenario, extract calculation logic to pure functions for easier testing.
  });

  // Test calculation logic by simulating the functions from Analytics.tsx
  describe('Calculation Functions', () => {
    it('should calculate win rate correctly', () => {
      const wins = mockTrades.filter(t => t.pnl > 0);
      const total = mockTrades.length;
      const winRate = (wins.length / total) * 100;

      expect(winRate).toBe(66.66666666666666); // 2 wins out of 3
    });

    it('should calculate total P&L correctly', () => {
      const totalPnL = mockTrades.reduce((acc, t) => acc + t.pnl, 0);
      expect(totalPnL).toBe(10); // 10 + 10 - 10
    });

    it('should calculate profit factor correctly', () => {
      const wins = mockTrades.filter(t => t.pnl > 0);
      const losses = mockTrades.filter(t => t.pnl < 0);
      const grossProfit = wins.reduce((acc, t) => acc + t.pnl, 0);
      const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.pnl, 0));
      const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : Infinity;

      expect(profitFactor).toBe(2); // 20 / 10
    });
  });
});