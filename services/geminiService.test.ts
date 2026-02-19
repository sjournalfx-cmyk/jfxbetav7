import { describe, it, expect } from 'vitest';
import { geminiService } from './geminiService';
import { calculateStats } from '../lib/statsUtils';
import { Trade, UserProfile } from '../types';

describe('geminiService Data Integrity', () => {
  const mockTrades: Trade[] = [
    { 
      id: '1', 
      pair: 'EURUSD', 
      pnl: 100, 
      result: 'Win', 
      date: '2024-01-01', 
      time: '10:00', 
      assetType: 'Forex', 
      direction: 'Long', 
      session: 'London', 
      rr: 2, 
      notes: '', 
      tags: [],
      entryPrice: 1.1000,
      stopLoss: 1.0950,
      takeProfit: 1.1100,
      lots: 1,
      rating: 5
    },
    { 
      id: '2', 
      pair: 'EURUSD', 
      pnl: -50, 
      result: 'Loss', 
      date: '2024-01-02', 
      time: '10:00', 
      assetType: 'Forex', 
      direction: 'Short', 
      session: 'London', 
      rr: 1, 
      notes: '', 
      tags: [],
      entryPrice: 1.1050,
      stopLoss: 1.1100,
      takeProfit: 1.0950,
      lots: 1,
      rating: 3
    },
    { 
      id: '3', 
      pair: 'GBPUSD', 
      pnl: 0, 
      result: 'Win', 
      date: '2024-01-03', 
      time: '10:00', 
      assetType: 'Forex', 
      direction: 'Long', 
      session: 'London', 
      rr: 0, 
      notes: '', 
      tags: [],
      entryPrice: 1.2500,
      stopLoss: 1.2450,
      takeProfit: 1.2550,
      lots: 1,
      rating: 4
    }, // Breakeven WIN
  ];

  it('calculates win rate based on result status, not just pnl > 0', () => {
    const stats = calculateStats(mockTrades);
    // 2 wins out of 3 = 66.67%
    expect(stats.winRate).toBeCloseTo(66.67, 1);
  });

  it('identifies best and worst pairs based on total pnl', () => {
    const stats = calculateStats(mockTrades);
    expect(stats.bestPair?.symbol).toBe('EURUSD'); // 100 - 50 = 50
    expect(stats.worstPair?.symbol).toBe('GBPUSD'); // 0
  });
});
