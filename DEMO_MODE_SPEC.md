# Demo Journal Mode Spec

## Goal
Add a reversible demo mode for first-time users so they can explore JournalFX with realistic sample trades already filled in. The demo should show a believable 3-month history from January to March and let the user switch back to their real account data at any time.

## Product Intent
The demo should make the app feel alive immediately:
- Show completed trades with full detail
- Include notes, entry rationale, exit comments, ratings, emotions, plan adherence, and trading mistakes
- Make the Journal, Dashboard, and Analytics feel populated
- Keep real user data untouched
- Allow an obvious way to exit demo mode and return to the real journal

## Scope
In scope:
- Demo toggle or switch
- Sample trade data for January, February, and March
- Sample notes and optional bias data to make the dashboard feel realistic
- Read-only behavior while in demo mode
- Switching back to real data without losing anything

Out of scope:
- Creating a second account
- Syncing demo data to Supabase
- Allowing edits to demo trades to persist
- Replacing the real user database data

## Core Behavior

### 1) Demo Entry
The app should offer a clear entry point into demo mode, such as:
- A button in onboarding
- A button on the dashboard
- A button in settings
- A banner CTA for new users

When activated:
- The UI switches from real user data to sample data
- A visible `Demo Mode` indicator appears
- The app becomes read-only for journal actions

### 2) Demo Data Source
Demo mode should use a separate local dataset, not the live `trades`, `notes`, or `dailyBias` data.

The demo dataset must:
- Contain trades from January, February, and March only
- Include enough trades to make the journal look active
- Use the same `Trade` shape as real data
- Be deterministic and stable, not randomly regenerated on each load

### 3) Switching Back
There must be a visible control such as:
- `Switch Back to Real Journal`
- `Exit Demo Mode`

When used:
- The app restores the real trades, notes, and analytics
- No demo data is saved to the database
- No real data is deleted or overwritten

### 4) Read-Only Guardrails
While demo mode is active:
- Add trade actions must be blocked
- Edit trade actions must be blocked
- Delete trade actions must be blocked
- Batch update actions must be blocked
- Note creation and deletion must be blocked if the app exposes those actions in demo mode
- Any save attempt should show a short toast or banner message explaining the journal is in demo mode

### 5) Visual Treatment
Demo mode should be obvious but not ugly or disruptive:
- A banner at the top of the app
- A small badge on the Journal and Dashboard
- A short explanatory line such as `You are viewing a sample journal`
- A clear switch-back button

## Demo Dataset Requirements

### Time Range
The sample trades must cover:
- January
- February
- March

### Trade Detail Requirements
Each sample trade should ideally include:
- `date`
- `time`
- `pair`
- `assetType`
- `direction`
- `entryPrice`
- `exitPrice`
- `stopLoss`
- `takeProfit`
- `lots`
- `result`
- `pnl`
- `rr`
- `rating`
- `tags`
- `notes`
- `tradingMistake`
- `mindset`
- `exitComment`
- `emotions`
- `planAdherence`
- `setupName` or `setupId` when useful

### Data Quality
The sample data should look like a real trader logged it:
- Mix winners, losers, and break-even trades
- Use realistic lot sizes and price levels
- Include both good and bad execution examples
- Show different sessions
- Include recurring mistakes and lessons
- Include some grouped or linked setup examples if the journal supports it

### Suggested Volume
Use enough trades to make the journal look credible:
- Minimum: 12 trades
- Better: 18 to 24 trades
- Spread across all 3 months

### Optional Supporting Demo Data
If useful, also include:
- A few demo notes
- A few daily bias entries
- Optional account metrics that make the dashboard feel complete

## Implementation Notes
Recommended approach:
- Keep real data in the existing data layer
- Add a separate demo data module
- Add a `demoMode` flag stored locally
- In `App`, choose between real and demo arrays before passing data to child views
- Keep all mutation handlers guarded with `if (demoMode) return`
- Show the demo banner at the app shell level so it appears across all views

## Acceptance Criteria
The feature is complete when:
- A first-time user can enter demo mode from the UI
- The Journal shows fully populated sample trades from January to March
- The sample trades include rich metadata like notes, rating, and mistakes
- The Dashboard and Analytics also reflect the demo dataset
- The user can switch back to the real journal instantly
- No demo action changes real stored data
- The app clearly shows when it is in demo mode

## Assumptions
- Demo mode is preview-only
- Demo data is local and read-only
- Real user data remains the source of truth
