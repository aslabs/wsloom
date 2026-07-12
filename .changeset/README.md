# Changesets

When making changes that should be released to npm, run from the repository root:

```bash
pnpm changeset
```

Select the affected `@wsloom/*` packages and write a summary. Commit the generated file in `.changeset/`.

When the changeset PR is merged to `master`, GitHub Actions will open a "Version Packages" PR. Merging that PR publishes to npm.
