# Specification: Fix Drawing Anchoring

## Problem Statement
Drawings (trendlines, rays, rectangles, etc.) in the Backtest Lab do not remain perfectly anchored to the price/time grid when:
1. The canvas is panned or zoomed.
2. The bar replay is running (new bars are added/removed).

While a `tick` based re-render was implemented, there is still visible "drift" or lag, and the drawings don't "freeze" relative to the price action as expected.

## Goals
- Ensure all drawings maintain their exact position relative to the price bars at all times.
- Eliminate visual lag/drift during pan and zoom.
- Ensure drawings are correctly mapped using `logical` coordinates to handle gaps or future data updates.

## Technical Requirements
- Re-evaluate the `useCoordinateConverter` in `DrawingLayer.tsx`.
- Investigate if `lightweight-charts` primitives or a custom series should be used for better integration.
- Optimize the rendering loop to synchronize perfectly with the chart's internal render cycle.

## Acceptance Criteria
- Drawings do not move relative to the price candles during panning.
- Drawings do not move relative to the price candles during zooming.
- Drawings remain correctly positioned as new bars are added during replay.
