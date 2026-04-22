import { Trade, AssetType } from '../types';
import { getSessionFromTime } from './trade-calculations';

export const parseMTTradeCSV = (text: string): Trade[] => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];

    let headerIdx = lines.findIndex(l => l.toLowerCase().includes('ticket') && l.toLowerCase().includes('profit'));
    if (headerIdx === -1) headerIdx = 0;

    const headers = lines[headerIdx].split(/,|\t/).map(h => h.trim().replace(/"/g, ''));
    const tradeLines = lines.slice(headerIdx + 1);

    const importedTrades: Trade[] = [];

    tradeLines.forEach(line => {
        const values = line.split(/,|\t/).map(v => v.trim().replace(/"/g, ''));
        if (values.length < headers.length || !values[0]) return;

        const tradeObj: any = {};
        headers.forEach((h, i) => {
            tradeObj[h.toLowerCase()] = values[i];
        });

        const ticket = tradeObj.ticket || tradeObj['#'];
        const openTime = tradeObj['open time'] || tradeObj['time'];
        const type = tradeObj.type;
        const size = parseFloat(tradeObj.size || tradeObj.volume || '0');
        const item = tradeObj.item || tradeObj.symbol;
        const openPrice = parseFloat(tradeObj['open price'] || tradeObj['price'] || '0');
        const sl = parseFloat(tradeObj['s/l'] || '0');
        const tp = parseFloat(tradeObj['t/p'] || '0');
        const closeTime = tradeObj['close time'] || tradeObj['time'];
        const closePrice = parseFloat(tradeObj['close price'] || tradeObj['price'] || '0');
        const profit = parseFloat(tradeObj.profit || '0');
        const swap = parseFloat(tradeObj.swap || '0');
        const commission = parseFloat(tradeObj.commission || '0');

        if (!item || isNaN(profit) || !type) return;
        if (type.toLowerCase() !== 'buy' && type.toLowerCase() !== 'sell') return;

        const netPnl = profit + swap + commission;
        const result = netPnl > 0 ? 'Win' : (netPnl < 0 ? 'Loss' : 'BE');

        let date = new Date().toISOString().split('T')[0];
        let time = '00:00';
        let fullOpenTime = '';
        let fullCloseTime = '';
        
        if (openTime) {
            const parts = openTime.split(' ');
            if (parts.length >= 1) date = parts[0].replace(/\./g, '-');
            if (parts.length >= 2) time = parts[1].slice(0, 5);
            fullOpenTime = parts[0] ? parts[0].replace(/\./g, '-') + 'T' + (parts[1] || '00:00:00') : '';
        }
        
        if (closeTime) {
            const parts = closeTime.split(' ');
            fullCloseTime = parts[0] ? parts[0].replace(/\./g, '-') + 'T' + (parts[1] || '00:00:00') : '';
        }

        let assetType: AssetType = 'Forex';
        const upperItem = item.toUpperCase();
        if (upperItem.includes('USD') || upperItem.includes('EUR') || upperItem.includes('GBP')) assetType = 'Forex';
        if (upperItem.includes('NAS') || upperItem.includes('US30') || upperItem.includes('GER') || upperItem.includes('DAX')) assetType = 'Indices';
        if (upperItem.includes('XAU') || upperItem.includes('GOLD') || upperItem.includes('OIL') || upperItem.includes('XAG')) assetType = 'Commodities';
        if (upperItem.includes('BTC') || upperItem.includes('ETH')) assetType = 'Crypto';

        importedTrades.push({
            id: `imported-${ticket || Date.now() + Math.random()}`,
            ticketId: ticket,
            pair: item.toUpperCase(),
            assetType,
            date,
            time,
            session: getSessionFromTime(time),
            direction: type.toLowerCase() === 'buy' ? 'Long' : 'Short',
            entryPrice: openPrice,
            exitPrice: closePrice,
            stopLoss: sl,
            takeProfit: tp,
            lots: size,
            result,
            pnl: netPnl,
            rr: sl && openPrice ? Math.abs(openPrice - tp) / Math.abs(openPrice - sl) : 0,
            rating: 0,
            tags: ['Imported'],
            notes: `Imported from MT4/MT5. Ticket: ${ticket}`,
            planAdherence: 'No Plan',
            mindset: 'Neutral',
            emotions: [],
            openTime: fullOpenTime,
            closeTime: fullCloseTime
        });
    });

    return importedTrades;
};
