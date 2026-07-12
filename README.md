# Loom

TypeScript-first RPC over WebSocket with zero code generation and full end-to-end type inference.

## Packages

- `@loom/core` — Protocol, router, types, errors, middleware
- `@loom/client` — Proxy client with pending request management
- `@loom/server` — Server connection handler and middleware pipeline
- `@loom/transport-ws` — WebSocket transport for browser and Node

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

## MVP Features

- WebSocket transport
- Nested router with dot-notation method paths
- Proxy client with TypeScript inference
- Request/response RPC
- Streaming (`AsyncIterable`)
- Cancellation (`AbortSignal`)
- Middleware pipeline
- Per-connection context
- Configurable timeouts
- Structured `RpcError` handling
