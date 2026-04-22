# Supabase Schema Management Workflow

This document outlines the recommended workflow for managing Supabase database schema changes in a team environment. Adhering to these guidelines will help prevent conflicts and ensure a consistent database state across development, staging, and production environments.

## Tools Overview

*   **Supabase CLI:** The primary tool for interacting with your Supabase project from the command line.
*   `supabase db diff`: Generates a SQL migration file by comparing your local database schema (or a reference schema file) with the current state of your `supabase/migrations` directory.
*   `supabase db push`: Applies all pending migration files from your `supabase/migrations` directory to your linked Supabase project.
*   `supabase db reset`: Resets your linked Supabase database to its initial state and then reapplies all migrations from your `supabase/migrations` directory. Useful for local development.

## Workflow for Making Schema Changes

1.  **Pull Latest Changes:**
    Always start by pulling the latest changes from your version control system (e.g., Git) to ensure your local `supabase/migrations` directory is up-to-date.
    ```bash
    git pull origin main
    ```
    (Replace `main` with your main branch name if different.)

2.  **Ensure Local Database is Synced (Development Only):**
    If you are working with a local Supabase setup (e.g., using `supabase start`), ensure your local database reflects the current state of your migrations.
    ```bash
    supabase db reset
    ```
    This will clear your local database and reapply all migrations.

3.  **Make Your Schema Changes:**
    Make your desired database schema changes. This can be done in a few ways:
    *   **Directly edit your `schema.sql` (if you have one):** This is a common approach for defining the desired state of your database.
    *   **Manually create a new SQL file in `supabase/migrations`:** This is less recommended for routine changes but can be useful for one-off fixes.
    *   **Apply changes to a local Supabase instance:** If you have `supabase start` running, you can make changes via a local GUI tool or SQL client.

4.  **Generate a New Migration File:**
    After making local schema changes, generate a new migration file. This file will contain the SQL statements necessary to transition the database from its previous state to your new changes.
    ```bash
    npm run supabase:migrate
    ```
    (This command assumes you have the `supabase:migrate` script in your `package.json` as discussed previously: `"supabase:migrate": "supabase db diff --local > supabase/migrations/$(date +%Y%m%d%H%M%S)_migration.sql && supabase db push"`)

    **Important:** Review the generated migration file (`supabase/migrations/YYYYMMDDHHmmss_migration.sql`) to ensure it contains only the intended changes.

5.  **Test Your Changes Locally:**
    Before pushing to a shared environment, thoroughly test your application with the new schema changes against your local Supabase instance.

6.  **Commit and Push Your Migration:**
    Add the new migration file to your version control system, commit it, and push to your remote repository.
    ```bash
    git add supabase/migrations/YYYYMMDDHHmmss_migration.sql
    git commit -m "feat: Add new table / column / etc."
    git push origin main
    ```

7.  **Apply to Staging/Production:**
    In shared environments (staging, production), migrations are typically applied as part of your CI/CD pipeline or manually by a designated team member. The process would involve:
    *   Pulling the latest code.
    *   Running `supabase db push` to apply all pending migrations.

## Avoiding Conflicts

*   **Work on Separate Branches:** Always work on feature branches when making schema changes.
*   **Pull Frequently:** Regularly pull the latest changes from the main branch to stay updated with other team members' migrations.
*   **Communicate Changes:** Announce significant schema changes to your team to avoid concurrent modifications that could lead to merge conflicts.
*   **Review Migration Files:** Carefully review generated migration files before committing.

By following this workflow, your team can effectively manage Supabase schema changes and maintain a stable development environment.
