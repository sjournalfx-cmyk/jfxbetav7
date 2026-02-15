import { Trade } from '../types';

export const calculateStats = (trades: Trade[]) => {
  const safeTrades = trades || [];
  const wins = safeTrades.filter(t => t.result === 'Win');
  const losses = safeTrades.filter(t => t.result === 'Loss');
  const totalCount = safeTrades.length || 1;
  
  const grossProfit = wins.reduce((acc, t) => acc + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.pnl, 0));
  const netProfit = grossProfit - grossLoss;
  
  const winRate = (wins.length / totalCount) * 100;
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : (grossProfit > 0 ? 9.9 : 0);
  
  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  const riskRewardRatio = avgLoss > 0 ? (avgWin / avgLoss) : 0;

  // Pair stats
  const pairStats: Record<string, { pnl: number, trades: number, wins: number }> = {};
  safeTrades.forEach(t => {
    const pair = t.pair.toUpperCase();
    if (!pairStats[pair]) pairStats[pair] = { pnl: 0, trades: 0, wins: 0 };
    pairStats[pair].pnl += t.pnl;
    pairStats[pair].trades += 1;
    if (t.result === 'Win') pairStats[pair].wins += 1;
  });

  const bestPair = Object.entries(pairStats).sort((a, b) => b[1].pnl - a[1].pnl)[0];
  const worstPair = Object.entries(pairStats).sort((a, b) => a[1].pnl - b[1].pnl)[0];

  return {
    netProfit,
    grossProfit,
    grossLoss,
    winRate,
    profitFactor,
    avgWin,
    avgLoss,
    rrRatio: riskRewardRatio,
    totalTrades: safeTrades.length,
    pairStats,
    bestPair: bestPair ? { symbol: bestPair[0], pnl: bestPair[1].pnl } : null,
    worstPair: worstPair ? { symbol: worstPair[0], pnl: worstPair[1].pnl } : null
  };
};
