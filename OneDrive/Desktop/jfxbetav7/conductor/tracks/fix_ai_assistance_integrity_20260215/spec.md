# Specification: AI Assistance Data Integrity

## Problem Statement
The JFX AI Assistant sometimes provides data in its text responses or generated widgets that does not perfectly match the source of truth in the Analytics dashboard or the raw trade history. This leads to user mistrust and "hallucinated" performance metrics.

## Requirements
1. **Calculation Parity:** The AI service must use the exact same mathematical logic for Net Profit, Win Rate, and Profit Factor as the `Analytics` and `dataService` modules.
2. **Context Synchronization:** The data passed to the AI (current trades, user profile, initial balance) must be synchronized with the latest state of the application.
3. **Widget Integrity:** AI-generated widgets (PNL, Win Rate, etc.) must reflect the same data as their standalone counterparts.
4. **No Hallucinations:** The AI should be strictly instructed to only reference trades present in the provided context and avoid making up symbols or outcomes.

## Success Criteria
- [ ] AI text response "Net Profit" matches Analytics dashboard Net Profit.
- [ ] AI-rendered Equity Curve matches the main dashboard Equity Curve.
- [ ] No false symbols or fake trade counts in AI "Performance Leaks" analysis.
- [ ] Consistent handling of initial balance and currency symbols across AI and UI.
