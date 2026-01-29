export type ToolType = 'cursor' | 'trendline' | 'ray' | 'arrow' | 'rect' | 'fib' | 'vertical' | 'horizontal' | 'long' | 'short';

export interface Point {
    time: number;
    price: number;
    logical?: number;
}

export interface Drawing {
    id: string;
    type: ToolType;
    p1: Point;
    p2?: Point;
    color?: string;
    strokeWidth?: number;
    strokeStyle?: 'solid' | 'dashed' | 'dotted';
    isLocked?: boolean;
    syncAllTimeframes?: boolean;
    // Position Tool specific
    entry?: number;
    target?: number;
    stop?: number;
}
