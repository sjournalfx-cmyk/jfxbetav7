import { describe, expect, it } from 'vitest';
import { Trade } from '../types';
import { calculateStats } from './statsUtils';

const createTrade = (overrides: Partial<Trade>): Trade => ({
  id: overrides.id || 'trade-id',
  pair: overrides.pair || 'EURUSD',
  assetType: overrides.assetType || 'Forex',
  date: overrides.date || '2026-04-01',
  time: overrides.time || '09:00',
  session: overrides.session || 'London',
  direction: overrides.direction || 'Long',
  entryPrice: overrides.entryPrice ?? 1.1,
  exitPrice: overrides.exitPrice,
  stopLoss: overrides.stopLoss ?? 1.09,
  takeProfit: overrides.takeProfit ?? 1.12,
  lots: overrides.lots ?? 1,
  result: overrides.result || 'Win',
  pnl: overrides.pnl ?? 100,
  rr: overrides.rr ?? 2,
  rating: overrides.rating ?? 3,
  tags: overrides.tags || [],
  notes: overrides.notes,
  emotions: overrides.emotions,
  planAdherence: overrides.planAdherence,
  tradingMistake: overrides.tradingMistake,
  mindset: overrides.mindset,
  exitComment: overrides.exitComment,
  openTime: overrides.openTime,
  closeTime: overrides.closeTime,
  beforeScreenshot: overrides.beforeScreenshot,
  afterScreenshot: overrides.afterScreenshot,
  setupId: overrides.setupId,
  deletedAt: overrides.deletedAt,
});

describe('calculateStats', () => {
  it('ignores pending trades in completed-trade metrics', () => {
    const stats = calculateStats([
      createTrade({ id: '1', result: 'Win', pnl: 150 }),
      createTrade({ id: '2', result: 'Loss', pnl: -50 }),
      createTrade({ id: '3', result: 'Pending', pnl: 999 }),
    ]);

    expect(stats.totalTrades).toBe(2);
    expect(stats.openTrades).toBe(1);
    expect(stats.netProfit).toBe(100);
    expect(stats.winRate).toBe(50);
  });

  it('uses actual pnl sign for gross profit, gross loss, and net profit', () => {
    const stats = calculateStats([
      createTrade({ id: '1', result: 'Win', pnl: 200 }),
      createTrade({ id: '2', result: 'BE', pnl: -10 }),
      createTrade({ id: '3', result: 'Loss', pnl: -40 }),
    ]);

    expect(stats.grossProfit).toBe(200);
    expect(stats.grossLoss).toBe(50);
    expect(stats.netProfit).toBe(150);
    expect(stats.numBE).toBe(1);
  });

  it('returns infinity for profit factor when there are profits and no losses', () => {
    const stats = calculateStats([
      createTrade({ id: '1', result: 'Win', pnl: 100 }),
      createTrade({ id: '2', result: 'Win', pnl: 80 }),
    ]);

    expect(stats.profitFactor).toBe(Number.POSITIVE_INFINITY);
  });
});
