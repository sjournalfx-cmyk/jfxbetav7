# Implementation Plan: Fix Backtest Drawing Layer

This plan outlines the steps to resolve trendline interaction bugs and canvas anchoring issues in the Backtest Lab.

## Phase 1: Research and Reproduction
- [x] **Task 1: Research coordinate anchoring in lightweight-charts.**
  - [x] Web search for "lightweight-charts custom drawing layer sticky coordinates".
  - [x] Examine existing `DrawingLayer.tsx` and `DrawingToolbar.tsx` to understand the current implementation.
- [x] **Task 2: Reproduce the trendline movement bug.**
  - [x] Place a trendline.
  - [x] Attempt to move it immediately.
  - [x] Identify why the initial `onMouseDown` or `onMouseMove` events fail to trigger the move logic correctly.

## Phase 2: Core Logic Fixes
- [x] **Task 3: Fix Trendline Interaction Logic.**
  - [x] **Write Tests**: Create or update `components/backtest/utils.test.ts` to simulate drawing selection and movement immediately after creation.
  - [x] **Implement Fix**: Update selection logic in `DrawingLayer.tsx` to ensure the "newly created" state doesn't block immediate interaction.
- [x] **Task 4: Implement Coordinate Anchoring.**
  - [x] **Write Tests**: Add tests to verify coordinate transformations (Time/Price to Pixel) remain consistent during "view" changes.
  - [x] **Implement Fix**: Update the drawing rendering loop to use the chart's `timeScale` and `priceScale` to dynamically recalculate pixel positions on every frame or pan event.

## Phase 3: Verification and Polishing
- [x] **Task 5: Final Manual Verification.**
  - [x] Verify trendline placement and immediate movement.
  - [x] Verify drawings stay locked during aggressive panning and zooming.
- [x] **Task 6: Conductor - User Manual Verification 'Fix Backtest Drawing Layer' (Protocol in workflow.md)**

[checkpoint: new]
