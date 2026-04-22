# Setup

## Prerequisites
- **Node.js**: Version 18+ (check with `node --version`).
- **Supabase Account**: Sign up at supabase.com for database and auth.
- **API Keys**:
  - Gemini API key from Google AI Studio.
  - NVIDIA API key from NVIDIA Build.
  - Supabase project URL and anon key.

## Installation
1. Clone or download the project.
2. Install dependencies:
   ```
   npm install
   ```

## Environment Configuration
1. Copy `.env.local` template (create if missing).
2. Set variables:
   ```
   VITE_GEMINI_API_KEY=your_gemini_key_here
   VITE_NVIDIA_API_KEY=your_nvidia_key_here
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Database Setup
1. Create a new Supabase project.
2. Run SQL migrations in order (from `add_trade_duration_columns.sql` etc.):
   - Tables: trades, profiles, notes, goals, daily_bias, ea_sessions.
   - Enable real-time for trades_sync, profile_sync, etc.
3. Configure authentication providers if needed.

## Running Locally
1. Start dev server:
   ```
   npm run dev
   ```
2. Open http://localhost:5173 (default Vite port).
3. Verify: Login, add a test trade, check real-time sync.

## Testing
- **Manual Testing**: Log in, create/edit trades, view analytics, toggle themes.
- **Integration**: Test MetaAPI sync (requires broker setup), CSV export.
- **AI Features**: Ensure Gemini key works for insights (e.g., in notes).

## Troubleshooting
- **API Key Errors**: Check .env.local keys and Supabase project settings.
- **Sync Failures**: Verify Supabase real-time enabled; check browser console for errors.
- **Build Issues**: Run `npm run build` and check output for TypeScript errors.