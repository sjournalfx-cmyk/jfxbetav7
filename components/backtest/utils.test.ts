import { describe, it, expect } from 'vitest';
import { getRayCoordinates, calculateFibLevels } from './utils';

describe('Backtest Drawing Utils', () => {
    describe('getRayCoordinates', () => {
        it('keeps rays horizontal to the right', () => {
            const result = getRayCoordinates(100, 100, 200, 250, 1000, 500);
            expect(result.x2).toBe(1000);
            expect(result.y2).toBe(100);
        });

        it('keeps rays horizontal to the left when dragged backwards', () => {
            const result = getRayCoordinates(300, 150, 200, 250, 1000, 500);
            expect(result.x2).toBe(0);
            expect(result.y2).toBe(150);
        });
    });

    describe('calculateFibLevels', () => {
        it('returns correct 50% level', () => {
            const levels = calculateFibLevels(100, 200);
            const level50 = levels.find(l => l.level === 0.5);
            expect(level50?.y).toBe(150);
        });
    });
});
