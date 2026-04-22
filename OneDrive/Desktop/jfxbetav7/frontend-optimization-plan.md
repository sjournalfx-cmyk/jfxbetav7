# Frontend Optimization Plan

## Goal
Systematically implement 12 architectural, performance, and accessibility improvements to the JournalFX frontend.

## Roadmap

### Phase 1: UI Foundation & Primitives (Suggestions 1, 8, 11)
- [x] Create `components/ui/Button.tsx`, `Input.tsx`, and `Card.tsx` using `cn` and standard design tokens.
- [x] Implement `aria-label` and `aria-describedby` in all primitives.
- [x] Update `tailwind.config.js` or `index.css` with semantic variables for typography and spacing.
- [x] **Verify**: Components render correctly in a dedicated test page and pass accessibility checks.

### Phase 2: Component Decomposition (Suggestions 2, 3, 12)
- [x] Break down `Analytics.tsx`: Move `ComparisonView` and sub-widgets to `components/analytics/`.
- [x] Break down `LogTrade.tsx`: Move internal UI helpers and large sections to separate files.
- [x] Extract business logic from components to `lib/trade-calculations.ts` or custom hooks.
- [x] Implement `FeatureGate.tsx` for plan-based restrictions.
- [x] **Verify**: App functionality remains identical; file sizes reduced below 500 lines.

### Phase 3: Performance & React Patterns (Suggestions 4, 5, 6, 7)
- [x] Refactor `useEffect` derived state to `useMemo` (e.g., `pairError` in `LogTrade.tsx`).
- [ ] Convert `&&` conditional rendering to ternaries project-wide (In progress: Analytics.tsx done).
- [x] Wrap expensive calculations (`getStats`, `getTrendData`) in `useMemo` (Done in `ComparisonView.tsx`).
- [ ] Optimize `lucide-react` imports.
- [ ] **Verify**: No extra renders on state change; lighthouse score improvement.

### Phase 4: Styling & Polish (Suggestions 9, 10)
- [x] Replace `h-screen` with `h-dvh` for mobile-first responsiveness (Project-wide).
- [ ] Audit `motion` animations: Ensure only compositor props are animated.
- [ ] **Verify**: Visual consistency across mobile and desktop; smooth animations.

## Done When
- [ ] All 12 suggestions implemented and verified.
- [ ] No regressions in core trading workflows.
- [ ] Accessibility audit returns 0 critical issues.
