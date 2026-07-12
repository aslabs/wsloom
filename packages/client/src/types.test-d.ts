import { expectTypeOf, test } from "vitest";
import { rpc, type InferRouterClient } from "@wsloom/core";
import { createClient } from "./createClient.js";
import { MemoryTransport } from "@wsloom/core";

const appRouter = rpc.router({
  users: {
    getUser: rpc.query<{ id: string }, { id: string; name: "Alice" }>({
      resolve: ({ input }) => ({
        id: input.id,
        name: "Alice" as const,
      }),
    }),
    updates: rpc.stream<void, { value: number }>({
      resolve: async function* () {
        yield { value: 1 };
      },
    }),
  },
});

type AppRouter = typeof appRouter._record;
type Client = InferRouterClient<AppRouter>;

test("createClient infers nested client types", () => {
  const transport = new MemoryTransport();
  const client = createClient(appRouter, { transport });

  expectTypeOf(client).toEqualTypeOf<Client>();
});
