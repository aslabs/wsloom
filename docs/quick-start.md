# Loom Quick Start

Loom is a TypeScript-first RPC framework over WebSocket with full type inference and zero code generation.

## Install

```bash
pnpm add @loom/core @loom/client @loom/server @loom/transport-ws
```

## Define a Router

```ts
import { rpc } from "@loom/core";

export const appRouter = rpc.router({
  users: {
    getUser: rpc.query<{ id: string }, { id: string; name: string }>({
      resolve: ({ input }) => ({
        id: input.id,
        name: "Alice",
      }),
    }),
    updates: rpc.stream<void, { at: number }>({
      resolve: async function* ({ signal }) {
        while (!signal.aborted) {
          yield { at: Date.now() };
          await new Promise((r) => setTimeout(r, 1000));
        }
      },
    }),
  },
});

export type AppRouter = typeof appRouter;
```

## Start a Server

```ts
import { WebSocketServer } from "ws";
import { createServer } from "@loom/server";
import { WebSocketTransport } from "@loom/transport-ws/node";
import { appRouter } from "./router";

const rpcServer = createServer({
  router: appRouter,
  createContext: () => ({ /* db, user, etc. */ }),
  middleware: [
    async ({ method, input }, next) => {
      console.log("calling", method, input);
      return next();
    },
  ],
});

const wss = new WebSocketServer({ port: 3001 });

wss.on("connection", (socket) => {
  const transport = new WebSocketTransport({
    createSocket: () => socket,
  });

  void transport.connect().then(() => {
    rpcServer.handleConnection(transport);
  });
});
```

## Create a Client

```ts
import { createClient } from "@loom/client";
import { createWebSocketTransport } from "@loom/transport-ws/browser";
import { appRouter, type AppRouter } from "./router";

const transport = createWebSocketTransport({
  url: "ws://localhost:3001",
});

const client = createClient(appRouter, { transport });

const user = await client.users.getUser({ id: "1" });

for await (const update of client.users.updates()) {
  console.log(update);
}
```

## Cancellation

```ts
const controller = new AbortController();

const promise = client.users.getUser({ id: "1" }, { signal: controller.signal });
controller.abort();
```

## Error Handling

Server handlers can throw `RpcError`:

```ts
import { RpcError, ErrorCodes } from "@loom/core";

throw new RpcError({
  code: ErrorCodes.NOT_FOUND,
  message: "User not found",
});
```

Clients receive rehydrated `RpcError` instances on rejected promises.

## Packages

| Package | Purpose |
|---------|---------|
| `@loom/core` | Protocol, router, types, errors, middleware |
| `@loom/client` | Proxy client with type inference |
| `@loom/server` | Connection handler and middleware pipeline |
| `@loom/transport-ws` | WebSocket transport (browser + Node) |

## Next Steps

- Run the [basic example](../examples/basic/)
- Add authentication in `createContext` during connection setup
- Explore streaming and middleware for real-time features
