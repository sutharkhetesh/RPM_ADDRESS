# RPM Eyewear Address Management

The existing Next.js 16, React 19, TypeScript, Prisma 7 and Neon PostgreSQL application, with account-based registration and address management.

## User flow

**Signup → Dashboard → Add addresses whenever needed**

New visitors land on signup. Registration requires a full name, email, password and matching password confirmation. Every account is created from the user's submitted details; the application has no default admin account, default password, automatic account seed, or hardcoded production credentials.

Registration creates a salted password hash and a database session, then opens `/dashboard` immediately, including when the user has no addresses. Users can add shipping, billing or BOTH addresses using **Add address**. The existing `/onboarding` shipping/billing wizard remains optional; no dashboard route requires it. In that optional wizard, the user enters shipping details first and billing details second. **Same as Shipping Address** copies the shipping details into the billing fields. The server independently copies and validates those details when saving, so client changes cannot bypass the choice.

Both addresses are saved as separate SHIPPING and BILLING records in a single transaction, linked to the authenticated user's ID. Each becomes the default for its respective purpose. Setup completion is recorded only after both writes succeed. Duplicate submissions are idempotent. All authenticated users can access their dashboard and add addresses immediately, regardless of the optional setup completion timestamp. Login also opens the dashboard.

There is no branch selection, branch registration, branch import, branch cookie dependency, or branch-scoped query in the application. Account ownership scopes every address read, update, deletion, print preview and PDF export.

## Configuration

Use the Neon pooled URL for application queries and the direct/unpooled URL for migrations:

```dotenv
DATABASE_URL="postgresql://neondb_owner:PASSWORD@ep-PROJECT-pooler.REGION.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require"
DIRECT_URL="postgresql://neondb_owner:PASSWORD@ep-PROJECT.REGION.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require"
```

Copy both URLs from **Neon Console → Connect**. Prisma CLI commands use `DIRECT_URL` when set, otherwise `DATABASE_URL`. Percent-encode special characters in passwords. See [Neon's Prisma guide](https://neon.com/docs/guides/prisma).

Remote connections verify TLS certificates using system trust. No provider-specific CA file is required. An explicit `sslrootcert` can select a custom CA file or `system`. The runtime enables channel binding when requested by the connection URL. Cross-region Node.js connections allow at least two seconds per address before trying another address.

## Run locally

Use Node.js 22.12+ and your Neon PostgreSQL project:

```bash
npm install
# For a new checkout only; preserve an existing configured .env:
cp .env.example .env
# Set DATABASE_URL and DIRECT_URL.
npm run db:check
npm run db:deploy
npm run db:generate
npm run dev
```

Open **http://localhost:3000** and create your own account. You may use pnpm and the corresponding scripts instead. No external Auth API keys, SMTP settings, or session-secret variables are required. Email verification and password-reset email delivery are not part of this database-only authentication system.

## Migrations and existing users

`20261106000000_neon_baseline` creates the current schema on plain PostgreSQL without any hosted-auth schemas, functions or roles. It includes account and session tables, address ownership, default-address partial unique indexes, type checks, row-level security and cascading account deletion. The optional onboarding flow and existing profile fields remain available.

For a new Neon database, run `npm run db:deploy`. When moving an existing database, restore and verify account, address and session data before switching connections, then register the baseline against that restored schema. See [the migration notes](docs/neon-migration.md). Do not run the baseline's table-creation SQL over an existing schema or use `prisma migrate reset` on saved data.

The retired migration history, provider-specific certificate and old connection configuration have been removed. New migration work uses the Neon baseline; do not point this migration history at the old database.

## Preserved features

- Overview statistics and a complete searchable, paginated address book; BOTH counts in shipping and billing totals. Shipping and Billing remain separate navigation items.
- Create, view, edit and delete addresses. The top address-type card defaults to the Shipping or Billing tab used to open the form. Existing labels and default flags remain stored; the simplified add/edit form does not expose these controls.
- Case-insensitive server-side search across 12 fields, 350 ms debounce, URL state, filtering, five sort orders and pagination at 10/20/50 records per page.
- Responsive table/mobile cards, light/dark theme, loading states, confirmation dialogs and toast feedback.
- Ownership-checked A4, 4×6 and compact print previews, shipping/billing layouts and jsPDF export. Browser printing supports international scripts; jsPDF uses built-in Latin fonts.

## Security and architecture

- Neon hosts PostgreSQL; local email/password authentication and persistent sessions remain in place. No Neon Auth service is required.
- Node.js scrypt hashes passwords with random salts and constant-time comparisons. Plaintext passwords are never stored.
- Sessions use random 256-bit tokens; only token hashes are stored. Cookies are HttpOnly, SameSite=Lax, Secure in production, and persist across browser restarts for 30 days. Active dashboard/onboarding sessions renew to 30 days at most once daily, checked on page load, window focus and hourly while visible. Expired or revoked sessions cannot renew. Logout revokes the database session and clears the cookie. No authentication tokens are stored in localStorage/sessionStorage.
- `/`, `/login` and `/signup` verify the database session and redirect authenticated users to `/dashboard`. Protected routes restore identity from the cookie on each server request. No schema migration or new environment variable is needed for persistent login.
- Authentication attempts are throttled in PostgreSQL across replicas.
- Server Actions derive user identity from a verified database session. Client-submitted user IDs are never trusted.
- Per-user advisory transaction locks coordinate onboarding and default changes. Partial unique indexes enforce default uniqueness independently of the application.
- Prisma uses a privileged connection, so all queries explicitly scope user ownership. RLS and revoked public table permissions provide additional protection for application tables.

```text
src/app/(auth)/                    Login/signup
src/app/(onboarding)/onboarding/   Optional shipping/billing setup
src/app/(dashboard)/              Protected dashboard and address CRUD
src/app/(print)/                  Protected print/PDF preview
src/actions/                     Auth, onboarding and address Server Actions
src/components/addresses/        Shared fields, forms, setup wizard, lists, print
src/lib/session-service.ts       Existing account/session authentication
src/lib/onboarding-service.ts    Atomic, idempotent address setup
src/lib/validations/              Shared Zod address and account schemas
prisma/schema.prisma
prisma/migrations/
tests/                           Unit, real PostgreSQL and browser tests
```

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Unit and integration tests use a temporary real PostgreSQL cluster and apply actual migrations. They cover registration validation, password hashing, sessions, onboarding atomicity/idempotency, same-as-shipping server behavior, ownership, defaults, CRUD and deployment to plain PostgreSQL and preservation of existing data when migrations are redeployed. These tests never use your live database. Both database URL variables are overridden with the temporary test database URL for migration commands.

Browser tests start with an empty temporary database. Every browser account is registered through the actual signup UI using newly generated test credentials; no default accounts or external Auth mocks are installed. Desktop/mobile checks cover the full onboarding flow, separate/copied billing, validation, login/logout, dashboard access without saved addresses, existing CRUD, search, print/PDF and ownership.

## Production

```bash
npm ci
npm run db:deploy
npm run build
npm start
```

Use HTTPS and a Node.js Next.js host with the pooled `DATABASE_URL` and direct `DIRECT_URL` configured. The runtime pool allows five database connections per process. The build uses Next's supported Webpack option for restricted environments. No production seed command creates user accounts or credentials.

## Quality and reliability

- Shared light/dark tokens, readable typography, consistent form cards, responsive tables/cards and reduced-motion support.
- Keyboard-accessible mobile navigation with focus containment, Escape dismissal, scroll locking and a skip link.
- Address forms validate inline, preserve input on network errors and disable controls while saving. Mutations guard against repeated submissions; the optional setup restores the billing draft when copied shipping is unchecked.
- Remote PostgreSQL connections always verify TLS, including when no custom CA file exists. An explicit `sslrootcert` takes precedence over system certificate trust.
- Session lookup is memoized within a server render. Dashboard statistics use one grouped database query; PDF generation remains loaded on demand.
- `npm run lint` checks formatting using the existing Prettier dependency. Generated files are excluded from formatting. No ESLint dependency is installed.

The browser suite requires a production build first. To use an existing Chrome installation, run `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chrome npm run test:e2e`. Builds and tests require child-process and localhost permissions; a restricted sandbox can prevent these tools from running. Test databases are temporary and never use live database data.
