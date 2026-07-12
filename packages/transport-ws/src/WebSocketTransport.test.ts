import { describe, it, expect, afterEach } from "vitest";
import { WebSocketServer } from "ws";
import { createWebSocketTransport } from "./node.js";

describe("WebSocketTransport (node)", () => {
  let wss: WebSocketServer;
  let port: number;

  afterEach(async () => {
    await new Promise<void>((resolve) => {
      if (wss) {
        wss.close(() => resolve());
      } else {
        resolve();
      }
    });
  });

  it("connects and exchanges messages", async () => {
    await new Promise<void>((resolve) => {
      wss = new WebSocketServer({ port: 0 });
      wss.on("listening", () => {
        port = (wss.address() as { port: number }).port;
        resolve();
      });
    });

    const receivedOnServer: string[] = [];
    wss.on("connection", (socket) => {
      socket.on("message", (data) => {
        receivedOnServer.push(String(data));
        socket.send(JSON.stringify({ echo: String(data) }));
      });
    });

    const transport = createWebSocketTransport({
      url: `ws://127.0.0.1:${port}`,
    });

    const messages: string[] = [];
    transport.onMessage((data) => messages.push(data));

    await transport.connect();
    transport.send(JSON.stringify({ hello: "world" }));

    await new Promise((r) => setTimeout(r, 100));

    expect(receivedOnServer).toHaveLength(1);
    expect(JSON.parse(receivedOnServer[0]!)).toEqual({ hello: "world" });
    expect(messages).toHaveLength(1);
    expect(JSON.parse(messages[0]!)).toEqual({
      echo: JSON.stringify({ hello: "world" }),
    });

    await transport.disconnect();
  });
});
