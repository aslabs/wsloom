# @wsloom/server

Server connection handler with middleware and context for [Loom RPC](https://github.com/aslabs/wsloom).

## Install

```bash
npm install @wsloom/server @wsloom/core
```

## Usage

```ts
import { createServer } from "@wsloom/server";
import { appRouter } from "./router";

const server = createServer({
  router: appRouter,
  createContext: () => ({}),
});

server.handleConnection(transport);
```

See the [quick start guide](https://github.com/aslabs/wsloom/blob/master/docs/quick-start.md).

## License

Apache-2.0
