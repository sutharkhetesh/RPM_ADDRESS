# Neon PostgreSQL migration

The application uses the pooled `DATABASE_URL` for runtime queries and the unpooled `DIRECT_URL` for Prisma commands. Both use verified TLS. Authentication stays in the application's `User` and `Session` tables; a separate authentication service is not required.

## New databases

Set both connection URLs in `.env`, then run:

```bash
npm run db:deploy
npm run db:generate
npm run db:check
```

The standalone `20261106000000_neon_baseline` migration creates the complete schema, including partial default-address indexes, ownership foreign keys, type checks and row-level security. No provider-specific schemas or roles are needed.

## Existing database transfers

Keep a private source backup and pause source writes for the final copy and connection switch. Use `pg_dump` and `pg_restore` against direct/session connections, excluding previous ownership and grants. The destination must be empty. Restore in a single transaction and stop on errors; never use `--clean` to overwrite existing destination data.

Verify all application tables against the source, including account IDs, password hashes, addresses, session token hashes and expiry timestamps. Preserve indexes, checks, foreign keys and RLS. Passwords and valid session cookies can continue to work because the application authentication format is unchanged.

The new migration history replaces the retired history only on the verified destination. Keep the original history in the private backup. After restoring an existing schema, register the baseline with `prisma migrate resolve --applied 20261106000000_neon_baseline`; do not run its CREATE TABLE statements against restored tables. If the restored database includes the retired `_prisma_migrations` history, archive it privately before registering the new baseline. Never reset a live database.

Update local and production `DATABASE_URL` and `DIRECT_URL`, restart the app, and run:

```bash
npm run db:check
npm run db:deploy
```

Verify existing-account login, protected routes, saved addresses, authenticated login/signup redirects and logout. Keep the same website hostname and cookie settings so valid copied sessions remain usable. Data written to the old database after the copy is not automatically replicated to Neon, so coordinate the production connection switch before reopening writes.

If you create private rollback files, keep them under the git-ignored `.backups/` directory and never publish them. The old service is not used by the application after switching the environment variables. Deleting the old hosted database is a separate action.
