import { describe, it, expect } from "vitest";
import {
  rpc,
  ErrorCodes,
  createLinkedTransports,
} from "@loom/core";
import { createServer } from "@loom/server";

describe("server", () => {
  it("returns METHOD_NOT_FOUND for unknown procedures", async () => {
    const router = rpc.router({
      known: rpc.query({ resolve: () => "ok" }),
    });
    const server = createServer({
      router,
      createContext: () => ({}),
    });

    const [clientTransport, serverTransport] = createLinkedTransports();
    server.handleConnection(serverTransport);

    const responses: string[] = [];
    clientTransport.onMessage((data) => responses.push(data));

    await Promise.all([clientTransport.connect(), serverTransport.connect()]);
    clientTransport.send(
      JSON.stringify({
        v: 1,
        kind: "req",
        id: "1",
        method: "unknown",
      }),
    );

    await new Promise((r) => setTimeout(r, 50));

    expect(responses).toHaveLength(1);
    const message = JSON.parse(responses[0]!);
    expect(message.kind).toBe("err");
    expect(message.error.code).toBe(ErrorCodes.METHOD_NOT_FOUND);
  });

  it("runs middleware in order", async () => {
    const order: string[] = [];
    const router = rpc.router({
      test: rpc.query({
        resolve: () => {
          order.push("handler");
          return "done";
        },
      }),
    });

    const server = createServer({
      router,
      createContext: () => ({}),
      middleware: [
        async (_opts, next) => {
          order.push("mw1");
          return next();
        },
        async (_opts, next) => {
          order.push("mw2");
          return next();
        },
      ],
    });

    const [clientTransport, serverTransport] = createLinkedTransports();
    server.handleConnection(serverTransport);

    const responses: string[] = [];
    clientTransport.onMessage((data) => responses.push(data));

    await Promise.all([clientTransport.connect(), serverTransport.connect()]);
    clientTransport.send(
      JSON.stringify({
        v: 1,
        kind: "req",
        id: "1",
        method: "test",
      }),
    );

    await new Promise((r) => setTimeout(r, 50));

    expect(order).toEqual(["mw1", "mw2", "handler"]);
    expect(JSON.parse(responses[0]!).result).toBe("done");
  });
});
