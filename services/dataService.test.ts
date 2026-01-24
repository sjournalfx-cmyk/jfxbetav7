import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dataService } from './dataService';
import { supabase } from '../lib/supabase';
import { Trade } from '../types';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' } }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'http://test.com' } })),
        remove: vi.fn().mockResolvedValue({}),
      })),
    },
  },
}));

describe('dataService - Trade CRUD', () => {
  const mockUser = { id: 'user-123' };
  const mockTrade: Trade = {
    id: 'trade-1',
    ticketId: '12345',
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
    tags: ['scalping'],
    notes: 'Good trade',
    emotions: ['calm'],
    planAdherence: 'Followed Exactly',
    tradingMistake: 'None',
    mindset: 'disciplined',
    exitComment: 'Hit TP',
    openTime: '10:00',
    closeTime: '11:00',
    beforeScreenshot: null,
    afterScreenshot: null,
  };

  const mockDbTrades = [{
    id: 'trade-1',
    ticket_id: '12345',
    pair: 'EURUSD',
    asset_type: 'Forex',
    date: '2023-01-01',
    time: '10:00',
    session: 'morning',
    direction: 'Long',
    entry_price: 1.05,
    exit_price: 1.06,
    stop_loss: 1.04,
    take_profit: 1.07,
    lots: 0.1,
    result: 'Win',
    pnl: 10,
    rr: 2,
    rating: 5,
    tags: ['scalping'],
    notes: 'Good trade',
    emotions: 'calm',
    plan_adherence: 'Followed Exactly',
    trading_mistake: 'None',
    mindset: 'disciplined',
    exit_comment: 'Hit TP',
    open_time: '10:00',
    close_time: '11:00',
    before_screenshot: null,
    after_screenshot: null,
  }];

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });
  });

  describe('getTrades', () => {
    it('should return mapped trades', async () => {
      const mockDbTrades = [{
        id: 'trade-1',
        ticket_id: 12345,
        pair: 'EURUSD',
        asset_type: 'forex',
        date: '2023-01-01',
        time: '10:00',
        session: 'morning',
        direction: 'buy',
        entry_price: 1.05,
        exit_price: 1.06,
        stop_loss: 1.04,
        take_profit: 1.07,
        lots: 0.1,
        result: 'win',
        pnl: 10,
        rr: 2,
        rating: 5,
        tags: ['scalping'],
        notes: 'Good trade',
        emotions: 'calm',
        plan_adherence: true,
        trading_mistake: false,
        mindset: 'disciplined',
        exit_comment: 'Hit TP',
        open_time: '10:00',
        close_time: '11:00',
        before_screenshot: null,
        after_screenshot: null,
      }];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockDbTrades, error: null }),
      });

      const result = await dataService.getTrades();
      expect(result).toEqual([mockTrade]);
      expect(supabase.from).toHaveBeenCalledWith('trades');
    });

    it('should throw error on failure', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
      });

      await expect(dataService.getTrades()).rejects.toThrow('DB error');
    });
  });

  describe('addTrade', () => {
    it('should add trade successfully', async () => {
      const newTrade = { ...mockTrade, id: undefined };
      const mockResponse = { ...mockDbTrades[0] };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockResponse, error: null }),
      });

      const result = await dataService.addTrade(newTrade as Trade);
      expect(result).toEqual(mockTrade);
      expect(supabase.from).toHaveBeenCalledWith('trades');
    });

    it('should throw error if not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });

      await expect(dataService.addTrade(mockTrade)).rejects.toThrow('User not authenticated');
    });
  });

  describe('updateTrade', () => {
    it('should update trade successfully', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      await expect(dataService.updateTrade(mockTrade)).resolves.not.toThrow();
    });
  });

  describe('deleteTrades', () => {
    it('should delete trades successfully', async () => {
      (supabase.from as any).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ error: null }),
      });

      await expect(dataService.deleteTrades(['trade-1'])).resolves.not.toThrow();
    });
  });
});