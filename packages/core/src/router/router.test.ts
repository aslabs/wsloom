import { describe, it, expect } from "vitest";
import { rpc, flattenRouter, lookupProcedure, type HandlerArgs } from "../index.js";

describe("router", () => {
  const router = rpc.router({
    users: {
      getUser: rpc.query<{ id: string }, { id: string; name: string }>({
        resolve: ({ input }: HandlerArgs<{ id: string }, unknown>) => ({
          id: input.id,
          name: "Alice",
        }),
      }),
      create: rpc.mutation<{ name: string }, { id: string; name: string }>({
        resolve: ({ input }: HandlerArgs<{ name: string }, unknown>) => ({
          id: "2",
          name: input.name,
        }),
      }),
      updates: rpc.stream({
        resolve: async function* () {
          yield { value: 1 };
        },
      }),
    },
    auth: {
      login: rpc.query({
        resolve: () => ({ token: "abc" }),
      }),
    },
  });

  it("flattens nested routers with dot notation", () => {
    const map = flattenRouter(router._record);
    expect(map.has("users.getUser")).toBe(true);
    expect(map.has("users.create")).toBe(true);
    expect(map.has("users.updates")).toBe(true);
    expect(map.has("auth.login")).toBe(true);
    expect(map.size).toBe(4);
  });

  it("looks up procedures by method path", () => {
    const map = flattenRouter(router._record);
    const procedure = lookupProcedure(map, "users.getUser");
    expect(procedure?._type).toBe("query");
  });

  it("returns undefined for unknown methods", () => {
    const map = flattenRouter(router._record);
    expect(lookupProcedure(map, "users.delete")).toBeUndefined();
  });

  it("identifies stream procedures", () => {
    const map = flattenRouter(router._record);
    expect(lookupProcedure(map, "users.updates")?._type).toBe("stream");
  });
});
