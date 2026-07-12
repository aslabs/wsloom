# @wsloom/transport-ws

WebSocket transport for [Loom RPC](https://github.com/aslabs/wsloom).

## Install

```bash
npm install @wsloom/transport-ws @wsloom/core
```

## Usage

**Browser:**

```ts
import { createWebSocketTransport } from "@wsloom/transport-ws/browser";

const transport = createWebSocketTransport({ url: "ws://localhost:3001" });
```

**Node:**

```ts
import { createWebSocketTransport } from "@wsloom/transport-ws/node";

const transport = createWebSocketTransport({ url: "ws://localhost:3001" });
```

See the [quick start guide](https://github.com/aslabs/wsloom/blob/master/docs/quick-start.md).

## License

Apache-2.0
