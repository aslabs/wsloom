import { expectTypeOf, test } from "vitest";
import {
  rpc,
  type InferRouterInputs,
  type InferRouterOutputs,
  type InferRouterClient,
  type HandlerArgs,
} from "../index.js";

const appRouter = rpc.router({
  users: {
    getUser: rpc.query<{ id: string }, { id: string; name: "Alice" }>({
      resolve: ({ input }: HandlerArgs<{ id: string }, unknown>) => ({
        id: input.id,
        name: "Alice" as const,
      }),
    }),
    create: rpc.mutation<{ name: string }, { id: string; name: string }>({
      resolve: ({ input }: HandlerArgs<{ name: string }, unknown>) => ({
        id: "1",
        name: input.name,
      }),
    }),
    updates: rpc.stream<void, { value: number }>({
      resolve: async function* (_args: HandlerArgs<void, unknown>) {
        yield { value: 1 };
      },
    }),
  },
  ping: rpc.query<void, "pong">({
    resolve: (_args: HandlerArgs<void, unknown>) => "pong" as const,
  }),
});

type AppRouter = typeof appRouter._record;

test("infers nested router inputs", () => {
  expectTypeOf<InferRouterInputs<AppRouter>["users"]["getUser"]>().toEqualTypeOf<{
    id: string;
  }>();
});

test("infers nested router outputs", () => {
  expectTypeOf<InferRouterOutputs<AppRouter>["users"]["getUser"]>().toEqualTypeOf<{
    id: string;
    name: "Alice";
  }>();
});

test("infers client proxy types", () => {
  type Client = InferRouterClient<AppRouter>;

  expectTypeOf<
    ReturnType<Client["users"]["getUser"]>
  >().toEqualTypeOf<Promise<{ id: string; name: "Alice" }>>();

  expectTypeOf<
    ReturnType<Client["users"]["updates"]>
  >().toEqualTypeOf<AsyncIterable<{ value: number }>>();

  expectTypeOf<ReturnType<Client["ping"]>>().toEqualTypeOf<Promise<"pong">>();
});
