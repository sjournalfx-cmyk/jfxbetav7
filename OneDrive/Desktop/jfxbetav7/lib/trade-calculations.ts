import { Trade, AssetType } from '../types';

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const resolveExitPrice = (trade: Partial<Trade>): number => {
  const { exitPrice, result, stopLoss, takeProfit, entryPrice } = trade;

  if (exitPrice !== undefined && exitPrice !== null && Number.isFinite(Number(exitPrice))) {
    return Number(exitPrice);
  }

  if (result === 'Win') return toFiniteNumber(takeProfit, toFiniteNumber(entryPrice, 0));
  if (result === 'Loss') return toFiniteNumber(stopLoss, toFiniteNumber(entryPrice, 0));

  return toFiniteNumber(entryPrice, 0);
};

const calculateDirectionalPnL = (trade: Partial<Trade>, exit: number): number => {
  const assetType = trade.assetType;
  const entryPrice = toFiniteNumber(trade.entryPrice, NaN);
  const lots = toFiniteNumber(trade.lots, 0);
  const direction = trade.direction;

  if (!Number.isFinite(entryPrice) || !lots || !assetType) return 0;

  const diff = direction === 'Long' ? (exit - entryPrice) : (entryPrice - exit);

  switch (assetType) {
    case 'Forex':
      return diff * 10000 * lots * 10;
    case 'Indices':
      return diff * lots;
    case 'Commodities':
      return diff * 100 * lots;
    case 'Crypto':
      return diff * lots;
    default:
      return diff * lots;
  }
};

export const calculatePnL = (trade: Partial<Trade>): number => {
  return calculateDirectionalPnL(trade, resolveExitPrice(trade));
};

export const calculatePnLAtPrice = (trade: Partial<Trade>, exitPrice: number): number => {
  return calculateDirectionalPnL(trade, exitPrice);
};

export const calculateRiskReward = (formData: any) => {
    const entry = parseFloat(formData.entryPrice);
    const sl = parseFloat(formData.stopLoss);
    const tp = parseFloat(formData.takeProfit);
    const exit = parseFloat(formData.exitPrice);
    const lots = parseFloat(formData.lots) || 0;

    if (entry && sl && (tp || exit)) {
        const targetExit = exit || tp;
        const riskDist = Math.abs(entry - sl);
        const rewardDist = Math.abs(targetExit - entry);
        const rrRatio = riskDist > 0 ? rewardDist / riskDist : 0;

        const riskPnL = calculatePnLAtPrice({
          ...formData,
          entryPrice: entry,
          stopLoss: sl,
          lots,
          result: 'Loss'
        } as any, sl);

        const rewardPnL = calculatePnLAtPrice({
          ...formData,
          entryPrice: entry,
          takeProfit: targetExit,
          lots,
          result: 'Win'
        } as any, targetExit);

        return {
            risk: Math.abs(riskPnL),
            reward: Math.abs(rewardPnL),
            rr: parseFloat(rrRatio.toFixed(2))
        };
    }
    
    return { risk: 0, reward: 0, rr: 0 };
};

export const getSessionFromTime = (time: string): string => {
    const [h] = time.split(':').map(Number);
    const hour = h;

    if (!Number.isFinite(hour)) return 'London Session';
    if (hour >= 15 && hour < 18) return 'London/NY Overlap';
    if (hour >= 9 && hour < 15) return 'London Session';
    if (hour >= 18 || hour < 0) return 'New York Session';
    if (hour >= 0 && hour < 9) return 'Asian Session';

    return 'London Session';
};
