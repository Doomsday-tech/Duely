# Contributing to Duely

We welcome contributions to Duely. Please follow these conventions:

## Code Conventions
- Use TypeScript for all frontend and backend code.
- Adhere to the core product philosophy: deterministic dates, calm typography, restrained colors, and human-in-the-loop controls.
- Maintain multi-tenant row-level authorization on all new database operations.

## Running Tests
Run the test suite before submitting a pull request:
```bash
npm run test
```

## Pull Request Guidelines
1. Keep PRs focused on a single feature or bug fix.
2. Ensure schema changes are reflected in both `prisma/schema.prisma` and `prisma/schema.postgresql.prisma`.
3. Add corresponding unit or integration test cases in `server/tests/run-tests.ts`.
