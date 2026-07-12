# Contributing

Thank you for contributing to Loom (`@wsloom/*`).

## Development

```bash
pnpm install
pnpm build
pnpm test
```

## Changesets

User-facing changes to published packages require a changeset:

```bash
pnpm changeset
```

Select affected `@wsloom/*` packages and describe the change. Commit the generated file in `.changeset/`.

## Pull requests

1. Fork and branch from `master`
2. Make changes with tests
3. Add a changeset if the change should be released
4. Ensure `pnpm test` passes
5. Open a PR

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
