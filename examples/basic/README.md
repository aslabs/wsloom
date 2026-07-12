# Basic Example

A minimal Loom RPC server with query and streaming procedures.

## Run

From the repository root:

```bash
pnpm install
pnpm build
pnpm --filter basic-example dev
```

Open [http://localhost:3000](http://localhost:3000) and use the buttons to call RPC methods.

## Router

The example defines:

- `greet` — query that returns a greeting
- `counter` — stream that yields incrementing counts

See [`src/server.ts`](src/server.ts) for the router definition.
