# Publishing to npm

Manual steps required before the first automated release.

## 1. npm organization

1. Create an account at [npmjs.com](https://www.npmjs.com/signup)
2. Enable 2FA on your account
3. Create organization **`wsloom`** at [npmjs.com/org/create](https://www.npmjs.com/org/create)
4. Choose **Unlimited public packages** (free)

Packages will publish as `@wsloom/core`, `@wsloom/client`, etc.

## 2. GitHub repository

1. Create a GitHub repo (e.g. `wsloom/loom`)
2. Push this monorepo to `master`
3. Update `repository` URLs in package.json files if your org/repo differs from `github.com/wsloom/loom`

## 3. GitHub secret

Create a **granular access token** on npm with these settings:

| Setting | Value |
|---------|-------|
| Packages and scopes | **Read and write** |
| Organizations | Select **`wsloom`** (or scope to all `@wsloom/*` packages) |
| Bypass 2FA for automation | **Enabled** (required for provenance publishing) |
| Expiration | 90–365 days (set a calendar reminder to rotate) |

Add to GitHub: **Settings → Secrets and variables → Actions → `NPM_TOKEN`**

`GITHUB_TOKEN` is provided automatically by Actions.

### Troubleshooting `E404 Not Found` on publish

npm returns **404 instead of 403** when a token lacks publish permission for a scoped package. This is almost always a token/org issue, not a code issue.

Checklist:

1. **Org exists** — [npmjs.com/org/wsloom](https://www.npmjs.com/org/wsloom) should exist
2. **Token scope** — granular token must include the **`wsloom` organization** with read+write, not just your personal account
3. **Team permissions** — npm → Organizations → wsloom → Teams → ensure your user/team has **Read and write** on packages
4. **Token not expired** — rotate `NPM_TOKEN` if the token was created before `@wsloom/server` existed
5. **Verify locally** (optional):

```bash
export NODE_AUTH_TOKEN=<your-token>
npm whoami
npm publish --dry-run --access public
# from packages/core after pnpm build
```

After fixing the token, **re-run the failed Release workflow** on GitHub Actions. If `@wsloom/core` already published at `0.1.0`, the re-run will publish the remaining packages.

## 4. First release

An initial changeset is included at [`.changeset/initial-public-release.md`](.changeset/initial-public-release.md).

After pushing to GitHub with workflows enabled:

1. The Release workflow runs on push to `master`
2. It opens a **Version Packages** PR (bumps to `0.1.0`)
3. Merge that PR → packages publish to npm automatically

## 5. Verify

```bash
npm install @wsloom/core @wsloom/client @wsloom/server @wsloom/transport-ws
```

Check [npmjs.com/package/@wsloom/core](https://www.npmjs.com/package/@wsloom/core).

## Local dry-run (optional)

```bash
pnpm install
pnpm build
pnpm test
pnpm version-packages
pnpm --filter @wsloom/core exec npm pack --dry-run
```
