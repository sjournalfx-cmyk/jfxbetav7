# Implementation Plan: Fix Drawing Anchoring

## Phase 1: Deep Analysis
- [x] **Task 1: Analyze coordinate transformation drift.**
  - [x] Inspect `DrawingLayer.tsx` and verify if `logical` coordinates are being stored with sufficient precision (floats).
  - [x] Verify if `chart.timeScale().logicalToCoordinate` is returning stale values during fast movement.

## Phase 2: Implementation
- [x] **Task 2: Implement High-Precision Coordinate Mapping.**
  - [x] Update `DrawingLayer.tsx` to use a more direct mapping if possible, or ensure `logical` is always the primary source of truth.
  - [x] Add a more aggressive re-sync mechanism for the overlay layer.
- [x] **Task 3: Resolve Replay Drift.**
  - [x] Ensure that as `currentIndex` changes in `BacktestLab.tsx`, the drawings' logical coordinates are re-evaluated or correctly interpreted by the `timeScale`.

## Phase 3: Verification
- [x] **Task 4: Manual Verification.**
  - [x] Pan chart aggressively and verify drawings "freeze" to candles.
  - [x] Zoom in/out and verify anchoring.
  - [x] Run bar play and verify anchoring.

[checkpoint: new]
