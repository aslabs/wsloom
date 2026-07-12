import { createServer } from "http";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import { rpc, type HandlerArgs } from "@loom/core";
import { createServer as createRpcServer } from "@loom/server";
import { WebSocketTransport } from "@loom/transport-ws/node";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

export const appRouter = rpc.router({
  greet: rpc.query({
    resolve: ({ input }: HandlerArgs<{ name: string }, unknown>) => ({
      message: `Hello, ${input.name}!`,
    }),
  }),
  counter: rpc.stream({
    resolve: async function* ({ input, signal }: HandlerArgs<{ max: number }, unknown>) {
      for (let i = 1; i <= input.max; i++) {
        if (signal.aborted) return;
        yield { count: i };
        await new Promise((r) => setTimeout(r, 500));
      }
    },
  }),
});

const rpcServer = createRpcServer({
  router: appRouter,
  createContext: () => ({ startedAt: Date.now() }),
});

const httpServer = createServer((_req, res) => {
  const html = readFileSync(join(__dirname, "client.html"), "utf-8");
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(html);
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (socket) => {
  const transport = new WebSocketTransport({
    createSocket: () => socket as unknown as import("@loom/transport-ws").WebSocketLike,
  });

  void transport.connect().then(() => {
    rpcServer.handleConnection(transport);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Basic example running at http://localhost:${PORT}`);
});
