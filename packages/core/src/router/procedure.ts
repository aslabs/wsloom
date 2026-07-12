export type HandlerArgs<TInput, TContext> = {
  input: TInput;
  ctx: TContext;
  signal: AbortSignal;
};

export type QueryResolver<TInput, TOutput, TContext> = (
  args: HandlerArgs<TInput, TContext>,
) => TOutput | Promise<TOutput>;

export type StreamResolver<TInput, TOutput, TContext> = (
  args: HandlerArgs<TInput, TContext>,
) => AsyncIterable<TOutput> | AsyncGenerator<TOutput>;

export type ProcedureType = "query" | "mutation" | "stream";

export interface QueryProcedure<TInput = unknown, TOutput = unknown> {
  readonly _type: "query";
  readonly _input: TInput;
  readonly _output: TOutput;
  readonly resolve: QueryResolver<TInput, TOutput, unknown>;
}

export interface MutationProcedure<TInput = unknown, TOutput = unknown> {
  readonly _type: "mutation";
  readonly _input: TInput;
  readonly _output: TOutput;
  readonly resolve: QueryResolver<TInput, TOutput, unknown>;
}

export interface StreamProcedure<TInput = unknown, TOutput = unknown> {
  readonly _type: "stream";
  readonly _input: TInput;
  readonly _output: TOutput;
  readonly resolve: StreamResolver<TInput, TOutput, unknown>;
}

export type Procedure =
  | QueryProcedure
  | MutationProcedure
  | StreamProcedure;

export type RouterRecord = Record<string, unknown>;

export interface Router<TRecord extends RouterRecord = RouterRecord> {
  readonly _record: TRecord;
  readonly _middleware: MiddlewareList;
}

export type MiddlewareList = Array<
  (
    opts: {
      ctx: unknown;
      method: string;
      input: unknown;
      signal: AbortSignal;
    },
    next: () => Promise<unknown>,
  ) => Promise<unknown>
>;

export type QueryDef<TInput, TOutput, TContext> = {
  resolve: QueryResolver<TInput, TOutput, TContext>;
};

export type StreamDef<TInput, TOutput, TContext> = {
  resolve: StreamResolver<TInput, TOutput, TContext>;
};

export function query<TInput = void, TOutput = unknown>(
  def: {
    resolve: QueryResolver<TInput, TOutput, unknown>;
  },
): QueryProcedure<TInput, TOutput> {
  return {
    _type: "query",
    _input: undefined as TInput,
    _output: undefined as TOutput,
    resolve: def.resolve as QueryResolver<TInput, TOutput, unknown>,
  };
}

export function mutation<TInput = void, TOutput = unknown>(
  def: {
    resolve: QueryResolver<TInput, TOutput, unknown>;
  },
): MutationProcedure<TInput, TOutput> {
  return {
    _type: "mutation",
    _input: undefined as TInput,
    _output: undefined as TOutput,
    resolve: def.resolve as QueryResolver<TInput, TOutput, unknown>,
  };
}

export function stream<TInput = void, TOutput = unknown>(
  def: {
    resolve: StreamResolver<TInput, TOutput, unknown>;
  },
): StreamProcedure<TInput, TOutput> {
  return {
    _type: "stream",
    _input: undefined as TInput,
    _output: undefined as TOutput,
    resolve: def.resolve as StreamResolver<TInput, TOutput, unknown>,
  };
}

export function router<TRecord extends RouterRecord>(
  record: TRecord,
): Router<TRecord> {
  return {
    _record: record,
    _middleware: [],
  };
}

export function use<TRecord extends RouterRecord>(
  routerInstance: Router<TRecord>,
  middleware: MiddlewareList[number],
): Router<TRecord> {
  return {
    _record: routerInstance._record,
    _middleware: [...routerInstance._middleware, middleware],
  };
}

export function isProcedure(value: unknown): value is Procedure {
  if (typeof value !== "object" || value === null) return false;
  const type = (value as Procedure)._type;
  return type === "query" || type === "mutation" || type === "stream";
}

export function isRouterRecord(value: unknown): value is RouterRecord {
  return typeof value === "object" && value !== null && !isProcedure(value);
}
