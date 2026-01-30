# Specification: Fix Backtest Drawing Layer

## Problem Statement
Traders using the Backtest Lab experience issues with the drawing layer, specifically:
1.  **Trendline Instability**: Trendlines only move correctly if moved *after* an initial placement and a subsequent move action. The first move attempt after placement fails.
2.  **Canvas Anchoring**: Drawings do not "stick" or "freeze" to the canvas when the canvas itself is moved or panned. This results in drawings becoming misaligned with the price data.

## Goals
-   Ensure trendlines can be moved immediately after placement.
-   Implement a coordinate system or anchoring mechanism so that drawings remain locked to their respective price/time coordinates even when the chart is panned or zoomed.
-   Maintain a professional and responsive user experience within the Backtest Lab.

## Technical Requirements
-   Analyze and update the `DrawingLayer.tsx` and related utility functions in `components/backtest/`.
-   Verify interaction logic for trendline placement and selection.
-   Investigate `lightweight-charts` integration to ensure custom drawing layers are synchronized with the chart's coordinate system.

## Acceptance Criteria
-   Trendlines can be selected and moved immediately after being placed on the chart.
-   When the chart is panned or zoomed, all drawings (trendlines, etc.) maintain their correct position relative to the price bars.
-   Unit tests cover the drawing logic and coordinate transformations.
