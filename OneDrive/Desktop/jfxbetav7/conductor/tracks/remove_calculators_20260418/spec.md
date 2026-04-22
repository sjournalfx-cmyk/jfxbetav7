# Spec: Remove Calculators Feature

## Goal
Completely remove the "Calculators" feature from the JournalFX project.

## Scope
- Delete components (`Calculators.tsx`, `NewCalculators.tsx`, `PositionSizeCalculator.tsx`)
- Remove references from `App.tsx` (imports, state, UI)
- Remove references from `Sidebar.tsx` (imports, prop, menu item)
- Remove references from `MobileNav.tsx` (imports, button)
- Remove references from `KeyboardShortcuts.tsx` (imports, shortcut)
- Remove references from `lib/constants.ts`
- Update `FEATURES.md`
- Update `DOCUMENTATION.md`
