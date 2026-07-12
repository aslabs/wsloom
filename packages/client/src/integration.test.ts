import { describe, it, expect } from "vitest";
import {
  rpc,
  RpcError,
  ErrorCodes,
  createLinkedTransports,
  type HandlerArgs,
} from "@loom/core";
import { createServer } from "@loom/server";
import { createClient } from "@loom/client";

describe("integration", () => {
  const appRouter = rpc.router({
    math: {
      add: rpc.query({
        resolve: ({ input }: HandlerArgs<{ a: number; b: number }, unknown>) =>
          input.a + input.b,
      }),
      fail: rpc.query({
        resolve: () => {
          throw new RpcError({
            code: ErrorCodes.NOT_FOUND,
            message: "Not found",
          });
        },
      }),
      ticks: rpc.stream({
        resolve: async function* ({ input, signal }: HandlerArgs<{ count: number }, unknown>) {
          for (let i = 0; i < input.count; i++) {
            if (signal.aborted) return;
            yield { tick: i };
            await new Promise((r) => setTimeout(r, 10));
          }
        },
      }),
    },
    ping: rpc.query({
      resolve: () => "pong",
    }),
  });

  const server = createServer({
    router: appRouter,
    createContext: () => ({ requestId: "test" }),
    middleware: [
      async (_opts, next) => next(),
    ],
  });

  function setup() {
    const [clientTransport, serverTransport] = createLinkedTransports();
    server.handleConnection(serverTransport);
    const client = createClient(appRouter, { transport: clientTransport });
    return {
      client,
      ready: Promise.all([clientTransport.connect(), serverTransport.connect()]),
    };
  }

  it("handles query RPC over linked transports", async () => {
    const { client, ready } = setup();
    await ready;
    const result = await client.math.add({ a: 2, b: 3 });
    expect(result).toBe(5);
  });

  it("handles flat namespace queries", async () => {
    const { client, ready } = setup();
    await ready;
    await expect(client.ping()).resolves.toBe("pong");
  });

  it("propagates RpcError to client", async () => {
    const { client, ready } = setup();
    await ready;
    await expect(client.math.fail()).rejects.toMatchObject({
      code: ErrorCodes.NOT_FOUND,
      message: "Not found",
    });
  });

  it("streams values to client", async () => {
    const { client, ready } = setup();
    await ready;
    const values: Array<{ tick: number }> = [];
    for await (const tick of client.math.ticks({ count: 3 })) {
      values.push(tick);
    }
    expect(values).toEqual([{ tick: 0 }, { tick: 1 }, { tick: 2 }]);
  });

  it("cancels in-flight requests", async () => {
    const slowRouter = rpc.router({
      math: {
        slowAdd: rpc.query({
          resolve: async ({ input }: HandlerArgs<{ a: number; b: number }, unknown>) => {
            await new Promise((r) => setTimeout(r, 500));
            return input.a + input.b;
          },
        }),
      },
    });
    const slowServer = createServer({
      router: slowRouter,
      createContext: () => ({}),
    });
    const [clientTransport, serverTransport] = createLinkedTransports();
    slowServer.handleConnection(serverTransport);
    await Promise.all([clientTransport.connect(), serverTransport.connect()]);
    const client = createClient(slowRouter, { transport: clientTransport });

    const controller = new AbortController();
    const promise = client.math.slowAdd({ a: 1, b: 2 }, { signal: controller.signal });
    await new Promise((r) => setTimeout(r, 20));
    controller.abort();
    await expect(promise).rejects.toMatchObject({
      code: ErrorCodes.ABORTED,
    });
  });

  it("times out slow requests", async () => {
    const slowRouter = rpc.router({
      slow: rpc.query({
        resolve: async () => {
          await new Promise((r) => setTimeout(r, 200));
          return "done";
        },
      }),
    });
    const slowServer = createServer({
      router: slowRouter,
      createContext: () => ({}),
    });
    const [clientTransport, serverTransport] = createLinkedTransports();
    slowServer.handleConnection(serverTransport);
    await Promise.all([clientTransport.connect(), serverTransport.connect()]);
    const client = createClient(slowRouter, {
      transport: clientTransport,
      timeout: 50,
    });
    await expect(client.slow()).rejects.toMatchObject({
      code: ErrorCodes.TIMEOUT,
    });
  });
});
