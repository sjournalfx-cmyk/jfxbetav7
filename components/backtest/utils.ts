import { Point } from './types';

export const getRayCoordinates = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    containerWidth: number,
    containerHeight: number
) => {
    // Rays in Backtest Lab are intentionally locked to a horizontal line.
    // The second point only controls placement; it does not change angle.
    const horizontalEndX = x2 >= x1 ? containerWidth : 0;
    return { x1, y1, x2: horizontalEndX, y2: y1 };
};

export const calculateFibLevels = (y1: number, y2: number) => {
    const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const diff = y2 - y1;
    return levels.map(level => ({
        level,
        y: y1 + diff * level
    }));
};
