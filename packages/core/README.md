# @wsloom/core

Core protocol, router, types, errors, and middleware for [Loom RPC](https://github.com/wsloom/loom).

## Install

```bash
npm install @wsloom/core
```

## Usage

```ts
import { rpc } from "@wsloom/core";

export const appRouter = rpc.router({
  ping: rpc.query<void, string>({
    resolve: () => "pong",
  }),
});
```

See the [quick start guide](https://github.com/wsloom/loom/blob/master/docs/quick-start.md).

## License

Apache-2.0
