# Database Migrations

This folder contains all Supabase database migrations for JournalFX.

## Migration Files

| File | Date | Description |
|------|------|-------------|
| `20260219_120000_ea_setup.sql` | 2026-02-19 | Initial EA setup tables and functions |
| `20260218_100000_add_backtest_sessions.sql` | 2026-02-18 | Backtest sessions table |
| `20260217_090000_add_keep_note_columns.sql` | 2026-02-17 | Note retention columns (archived, trashed) |
| `20260215_140000_add_position_to_notes.sql` | 2026-02-15 | Note ordering position field |
| `20260214_110000_add_avatar_column.sql` | 2026-02-14 | User profile avatar URL |
| `20260213_150000_add_chart_config.sql` | 2026-02-13 | Chart configuration persistence |
| `20260212_080000_add_performance_settings.sql` | 2026-02-12 | Performance-related user settings |
| `20260210_090000_fix_db.sql` | 2026-02-10 | Database schema fixes |
| `20260208_140000_fix_goals_updated_at.sql` | 2026-02-08 | Goals table timestamp fix |
| `20260205_100000_complete_schema_sync.sql` | 2026-02-05 | Complete schema synchronization |
| `20260201_080000_add_trade_duration_columns.sql` | 2026-02-01 | Trade open/close time fields |

## Usage

```bash
# Push migrations to remote
npm run supabase:migrate

# Reset database (WARNING: destroys all data)
npm run supabase:reset
```

## Creating New Migrations

1. Create a new SQL file with timestamp prefix: `YYYYMMDD_HHMMSS_description.sql`
2. Add descriptive comments at the top
3. Test locally before committing
4. Use `npm run supabase:migrate` to push

## Naming Conventions

- Use snake_case for table and column names
- Prefix migration timestamps with YYYYMMDD_HHMMSS
- Use descriptive names: `add_*`, `fix_*`, `update_*`, `remove_*`
