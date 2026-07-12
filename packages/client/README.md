# @wsloom/client

Type-safe RPC client with a proxy API for [Loom RPC](https://github.com/wsloom/loom).

## Install

```bash
npm install @wsloom/client @wsloom/core
```

## Usage

```ts
import { createClient } from "@wsloom/client";
import { createWebSocketTransport } from "@wsloom/transport-ws/browser";
import { appRouter } from "./router";

const client = createClient(appRouter, {
  transport: createWebSocketTransport({ url: "ws://localhost:3001" }),
});

const result = await client.ping();
```

See the [quick start guide](https://github.com/wsloom/loom/blob/master/docs/quick-start.md).

## License

Apache-2.0
