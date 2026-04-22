import { describe, it, expect } from 'vitest';
import { getRayCoordinates, calculateFibLevels } from './utils';

describe('Backtest Drawing Utils', () => {
    describe('getRayCoordinates', () => {
        it('calculates correct horizontal ray to the right', () => {
            const result = getRayCoordinates(100, 100, 200, 100, 1000, 500);
            expect(result.x2).toBe(1000);
            expect(result.y2).toBe(100);
        });

        it('calculates correct vertical ray downwards', () => {
            const result = getRayCoordinates(100, 100, 100, 200, 1000, 500);
            expect(result.x2).toBe(100);
            expect(result.y2).toBe(500);
        });

        it('calculates correct sloped ray', () => {
            // (100,100) to (200,200) -> slope 1. At x=1000, y = 100 + 1*(900) = 1000
            // Increased containerHeight to 1000 so it doesn't clip early
            const result = getRayCoordinates(100, 100, 200, 200, 1000, 1000);
            expect(result.x2).toBe(1000);
            expect(result.y2).toBe(1000);
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
