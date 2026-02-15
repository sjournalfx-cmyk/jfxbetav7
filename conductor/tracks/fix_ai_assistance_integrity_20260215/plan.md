# Implementation Plan: AI Assistance Data Integrity

## Phase 1: Audit and Analysis
- [x] Audit `services/geminiService.ts` to see how trade data is summarized for the LLM. [dcbb96e]
- [x] Compare `stats` calculation in `components/Analytics.tsx` with the summary logic in the AI service. [dcbb96e]

## Phase 2: Logic Synchronization
- [x] Extract core statistics logic into a shared utility if necessary, or ensure `geminiService` mirrors `Analytics.tsx` precisely. [dcbb96e]
- [x] Ensure `initialBalance` is correctly accounted for in the AI's equity calculations. [dcbb96e]
- [x] Update the AI system prompt to enforce strict data adherence and prohibit metric estimation. [dcbb96e]

## Phase 3: Verification
- [ ] Cross-verify AI responses with a specific trade set to ensure zero discrepancy.
- [ ] Verify that AI-rendered widgets (like `EquityCurveWidget`) receive the same pre-calculated data as the main dashboard.
- [ ] Test AI responses for "hallucination" by asking for specific trade details.
