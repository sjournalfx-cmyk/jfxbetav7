# Features

## Overview
JournalFX is a comprehensive web-based trading journal application designed for professional traders. It enables logging, analyzing, and managing trades, strategies, and performance metrics. The app integrates AI assistance for insights and supports automated journaling via expert advisors (EAs) for platforms like MetaTrader. Currently in beta (v1.0.0-beta.1), it offers tiered access: Free (Journaler), Pro (Analyst), and Premium features.

## Core Features
- **Authentication & Onboarding**: Supabase-based login/signup with user profile setup (experience level, trading style, initial balance).
- **Dashboard**: Overview with trade summaries, daily bias tracking, and quick actions for journaling.
- **Journal**: Trade logging and editing with CRUD operations, screenshot attachments, and tagging for categorization.
- **Analytics**: Performance metrics including win/loss ratios, drawdowns, time analysis, and detailed reports.
- **Goals**: Financial and process goals with milestones, auto-tracking rules based on PnL, and progress visualization.
- **Notes**: Rich-text notes with pinning, color coding, and linking to goals or trades.
- **Charts**: TradingView widget integration with focus mode, multi-chart layouts, and persistence across sessions.
- **Calculators**: Risk management tools including position sizing and risk-reward calculators.
- **Rules & Playbook**: Trading rules (hard/soft), strategy entries with logic phases, and diagram visualizations using Mermaid.
- **EA Setup & Broker Connect**: Automated trade syncing via MetaAPI; broker API connections for real-time data.
- **Settings**: User profile management, billing/plans, theme selection (dark/midnight), and usage statistics.
- **Real-Time Sync**: Live updates across devices using Supabase channels for trades, profiles, notes, and goals.
- **Error Handling**: ErrorBoundary for graceful failures with toast notifications and confirmation modals.

## Tier Restrictions
- **Free (Journaler)**: Basic journaling and analytics; limited trades/month (e.g., 100).
- **Pro (Analyst)**: Advanced analytics, goals, and notes; higher limits (e.g., 500 trades).
- **Premium**: Full features including AI insights, EA sync, and unlimited trades.

## AI Integrations
- **Gemini API**: Provides AI-powered insights in analytics (e.g., trade summaries, recommendations) and notes (e.g., content generation or analysis).

## External Integrations
- **MetaAPI**: Syncs trades automatically from trading platforms/brokers.
- **CSV Import/Export**: Bulk import/export of trade history for data migration.
- **TradingView**: Embedded charts for market visualization.