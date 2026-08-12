# GENERAL DEVELOPMENT RULES

## ⚠️ CRITICAL — NEVER DO THESE

### Destructive Commands — NEVER Execute
- `git push` — under any circumstances
- `rm` / `rm -rf` — any file or directory deletion
- `DELETE` SQL queries — without explicit user approval
- `drop table` / `drop database` — ever
- `migrate:undo:all` — without explicit user approval

### Git Commands — Always Ask First
**ALWAYS ask for explicit user approval before executing ANY git command:**
- `git commit`, `git add`, `git reset`
- `git rebase`, `git merge`
- `git branch` (create or delete)
- `git checkout`, `git pull`, `git fetch`
- `git stash`, `git tag`

**Workflow:**
1. Suggest the command
2. Explain what it will do
3. Wait for explicit user confirmation
4. Only execute if approved

---

## Task Assignment — Load Relevant Rules First

When a user assigns a task, identify the context and prompt them to invoke the relevant command before proceeding:

- Working in `server/` or NestJS code → ask: "Please run `/nodejs-rules` before we start."
- Working in `client/` or React code → ask: "Please run `/react-rules` before we start."
- Asking about project structure, tech stack, or integrations → ask: "Please run `/project-rules` before we start."
- Task spans both client and server → ask for both: `/react-rules` and `/nestjs-rules`.
- Task involves monorepo structure, tech stack, AWS (S3, SQS), WebSocket, i18n, logging, or cross-service integration flows → ask: "Please run `/project-rules` before we start."

Do not proceed with the task until the relevant rules are loaded.

---

## Development Workflow

### Essential Commands (Monorepo)

```bash
# Client (React)
cd client
npm run dev              # Start development server
npm run build            # Production build
npm run lint             # Run linting
npm test                 # Run tests

# Server (NestJS)
cd server
npm run start:dev        # Start with watch mode
npm run build            # Production build
npm run lint             # Run linting
npm run test             # Run unit tests
npm run test:cov         # Test with coverage
npm run migrate          # Run database migrations
npm run db:seed:all      # Seed database
```

### Pre-Commit Checklist
1. Run linting in both workspaces
2. Fix lint issues: `npm run lint` (server: `npm run lint --fix`)
3. Run tests in affected workspace
4. Run migrations if DB schema changed
5. Build affected packages to verify no errors

---

## Code Quality Standards

### Type Safety
- Strict TypeScript mode — always enabled
- No `any` types — use `unknown` if truly unknown
- Explicit return types on all functions
- Proper interface definitions for all shapes

### SOLID Principles

- **Single Responsibility** — one class/function = one purpose
- **Open/Closed** — extend via inheritance/composition, don't modify existing code
- **Liskov Substitution** — subtypes must be substitutable for base types
- **Interface Segregation** — many specific interfaces over one general interface
- **Dependency Inversion** — depend on abstractions, not concretions

### Defensive Programming

Always implement:
1. Input validation with schemas (Yup on client, class-validator on server)
2. Normalize and sanitize user input
3. Check business rules before operations
4. Comprehensive error handling with try-catch
5. Transaction management for multi-step DB operations
6. Winston logging for all operations

```typescript
try {
  // 1. Validate input
  // 2. Normalize data
  // 3. Check business rules
  // 4. Execute operation
  return result;
} catch (error) {
  this.logger.error('Operation failed', { error });
  if (error.code === 'SPECIFIC_ERROR') {
    throw new SpecificError('Message');
  }
  throw new InternalServerError('Generic message');
}
```

### Clean Architecture

1. **Domain Layer** — pure business logic, no external dependencies
2. **Application Layer** — use cases and orchestration
3. **Infrastructure Layer** — DB, APIs, file system

Dependencies point inward only.

---

## Project Conventions

- **Components**: PascalCase
- **Files**: kebab-case
- **Imports**: Absolute paths
- **Monorepo**: Clear package boundaries — never import across client/server directly

---

## Environment Variables

### Required Files
- `.env` — local only, never commit
- `.env.example` — template with dummy values, always commit
- Separate `.env` for client and server

### Server (.env)
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=
DB_NAME_DEVELOPMENT=
DB_NAME_TEST=
DB_NAME_PRODUCTION=
DB_DIALECT=postgres
DB_POOL_MAX=5
DB_POOL_MIN=0
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000

# JWT
JWT_SECRET=
JWT_EXPIRATION=3600

# AWS
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_SQS_QUEUE_URL=

# Application
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:3000
```

### Client (.env)
```bash
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
VITE_ENV=development
```

### Rules
- Validate all required env vars on startup
- Fail fast if required variables are missing
- Never hardcode secrets in code
- Use different values per environment (dev/test/prod)

---

## Advanced Patterns

### Pure Functions
- No side effects
- Same input = same output
- Immutable data transformations

### Result Pattern
```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
```

---

## Security
1. Escape HTML entities
2. Validate and sanitize all URLs
3. Parameterized queries only — no raw SQL string building
4. Authorization checks on every protected operation
5. Rate limiting for sensitive operations
6. Sanitize file uploads (type + size)

---

## Documentation
- **JSDoc** — public APIs and complex functions
- **Inline comments** — non-obvious logic only
- **README** — setup instructions and API docs