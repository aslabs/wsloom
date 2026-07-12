# Loom

TypeScript-first RPC over WebSocket with zero code generation and full end-to-end type inference.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Packages

| Package | Description |
|---------|-------------|
| [`@wsloom/core`](https://www.npmjs.com/package/@wsloom/core) | Protocol, router, types, errors, middleware |
| [`@wsloom/client`](https://www.npmjs.com/package/@wsloom/client) | Proxy client with pending request management |
| [`@wsloom/server`](https://www.npmjs.com/package/@wsloom/server) | Server connection handler and middleware pipeline |
| [`@wsloom/transport-ws`](https://www.npmjs.com/package/@wsloom/transport-ws) | WebSocket transport for browser and Node |

## Install

```bash
npm install @wsloom/core @wsloom/client @wsloom/server @wsloom/transport-ws
```

## Quick Start

See [docs/quick-start.md](docs/quick-start.md).

## Development

```bash
pnpm install
pnpm build
pnpm test
```

## Example

```bash
pnpm --filter basic-example dev
```

Open http://localhost:3000

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Releases use [Changesets](https://github.com/changesets/changesets).

## Publishing

See [PUBLISHING.md](PUBLISHING.md) for npm and GitHub setup.

## License

Apache-2.0 — see [LICENSE](LICENSE).
