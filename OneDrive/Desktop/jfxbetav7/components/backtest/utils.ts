import { Drawing, Point } from './types';

// Helper to calculate geometry
export const calculateRayEnd = (p1: Point, p2: Point, containerWidth: number, containerHeight: number): { x2: number, y2: number, x1: number, y1: number } => {
    // This is a coordinate-space calculation helper.
    // In practice, we need 'coordinates' from the chart, so this logic often stays in the renderer 
    // unless we pass the converter functions.
    // However, we can test the math slope logic.
    return { x1: 0, y1: 0, x2: 0, y2: 0 }; // Placeholder if not strictly pure
};

export const getRayCoordinates = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    containerWidth: number,
    containerHeight: number
) => {
    // Handle vertical lines (infinite slope)
    const isVertical = Math.abs(x2 - x1) < 0.001;

    if (isVertical) {
        // Extend vertically based on direction
        const yEnd = y2 > y1 ? containerHeight : 0;
        return { x1, y1, x2: x1, y2: yEnd };
    }

    // Calculate slope and y-intercept for the line equation: y = mx + b
    const slope = (y2 - y1) / (x2 - x1);
    const yIntercept = y1 - slope * x1;

    // Determine direction of ray extension (from p1 through p2)
    const goingRight = x2 > x1;

    // Calculate potential intersection points with all 4 edges
    let finalX: number, finalY: number;

    if (goingRight) {
        // Check right edge first
        const yAtRightEdge = slope * containerWidth + yIntercept;
        if (yAtRightEdge >= 0 && yAtRightEdge <= containerHeight) {
            finalX = containerWidth;
            finalY = yAtRightEdge;
        } else if (yAtRightEdge < 0) {
            // Intersects top edge
            finalX = -yIntercept / slope;
            finalY = 0;
        } else {
            // Intersects bottom edge
            finalX = (containerHeight - yIntercept) / slope;
            finalY = containerHeight;
        }
    } else {
        // Check left edge first
        const yAtLeftEdge = yIntercept;
        if (yAtLeftEdge >= 0 && yAtLeftEdge <= containerHeight) {
            finalX = 0;
            finalY = yAtLeftEdge;
        } else if (yAtLeftEdge < 0) {
            // Intersects top edge
            finalX = -yIntercept / slope;
            finalY = 0;
        } else {
            // Intersects bottom edge
            finalX = (containerHeight - yIntercept) / slope;
            finalY = containerHeight;
        }
    }

    return { x1, y1, x2: finalX, y2: finalY };
};

export const calculateFibLevels = (y1: number, y2: number) => {
    const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const diff = y2 - y1;
    return levels.map(level => ({
        level,
        y: y1 + diff * level
    }));
};
