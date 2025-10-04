# MVP CRM RBAC Kanban

Monorepo that delivers the CRM + RBAC Kanban MVP described in the specification. The repository is organised as follows:

```
/apps
  /api    # NestJS API (JWT auth, RBAC, Kanban domain)
  /web    # React 18 + Vite + Tailwind UI
/packages
  /shared # shared DTO contracts consumed by API & Web
```

## Requirements

* Node.js 18+
* pnpm 8+
* PostgreSQL 16 (running locally, no Docker)

The API expects a PostgreSQL database with access credentials defined in `.env`. Default values can be found in `apps/api/.env.example`.

## Installation

```bash
pnpm install
```

Copy the environment template and adjust if necessary:

```bash
cp apps/api/.env.example apps/api/.env
```

Create the database and user that match the variables in `.env`.

## Database migrations & seeds

```bash
pnpm migrate:run        # runs TypeORM migrations
pnpm seed               # idempotent seed (company, DevAdmin user, roles, demo board)
```

### Useful database commands

```bash
pnpm migrate:revert     # undo last migration
pnpm migrate:gen <Name> # generate a new migration (uses current schema diff)
```

## Development

Start the API (NestJS with TS live reload):

```bash
pnpm dev:api
```

Start the web client (Vite dev server on port 5173):

```bash
pnpm dev:web
```

Default login after seeds: `devadmin@example.com` / `DevAdmin123!`

## Testing

Basic e2e coverage lives in `apps/api/test/app.e2e-spec.ts` and covers login, permission denial, and task CRUD + move.

```bash
pnpm --filter api test:e2e
```

> The tests expect a running PostgreSQL instance and will run migrations + seeds automatically.

## API collection

`api.http` contains ready-to-use REST requests (compatible with VSCode REST Client or Hoppscotch) covering auth, RBAC, and Kanban flows.

## Front-end notes

* Tokens are persisted in `sessionStorage` and automatically refreshed via interceptors.
* Sidebar navigation is computed from modules returned by `/auth/me/modules`, respecting `visibility` and permissions.
* Kanban board supports HTML5 drag & drop when the user owns the `tasks:move` permission.
* Task creation, movement, and commenting UI elements are permission-aware (`tasks:create`, `tasks:move`, `tasks:comment`).

## Security

* Passwords stored with Argon2id hashes.
* JWT access (15 min) and rotating refresh (30 days) tokens.
* Global rate limiting, CORS whitelist, Helmet, and DTO validation enforced.
* Critical actions recorded in `auth_rbac.audit_log`.

## Multi-tenancy

Every business entity (`crm` schema) is scoped by `company_id` and guarded via repository filters + RBAC guard.

## Seeded data

* Company: **Dev Company**
* Modules: RBAC, Projects, Boards, Tasks, Comments
* Roles: DevAdmin, Admin, Manager, Contributor, Viewer
* Demo Kanban: one project, one board with three columns (`To Do`, `Doing`, `Done`), three sample tasks.

Refer to inline comments and the architecture layout inside `apps/api/src/modules` for domain/application/infra layering and ports/adapters separation.
