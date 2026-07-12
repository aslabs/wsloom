import {
  decodeMessage,
  encodeMessage,
  createResponse,
  createErrorResponse,
  createChunk,
  createEnd,
  RpcError,
  ErrorCodes,
  defaultFormatError,
  getProcedureMap,
  lookupProcedure,
  runMiddleware,
  type Router,
  type RouterRecord,
  type Transport,
  type Middleware,
  type ConnectionMeta,
  type FormatErrorFn,
} from "@wsloom/core";

export type CreateContextFn<TContext> = (opts: {
  meta: ConnectionMeta;
}) => TContext | Promise<TContext>;

export type RpcConnectionOptions<
  TRecord extends RouterRecord,
  TContext,
> = {
  transport: Transport;
  router: Router<TRecord>;
  createContext: CreateContextFn<TContext>;
  middleware?: Middleware<TContext>[];
  formatError?: FormatErrorFn;
  meta?: ConnectionMeta;
};

type ActiveRequest = {
  abortController: AbortController;
};

export type RpcConnection<TContext = unknown> = {
  context: TContext;
  close: () => Promise<void>;
};

export function createConnection<
  TRecord extends RouterRecord,
  TContext,
>(options: RpcConnectionOptions<TRecord, TContext>): RpcConnection<TContext> {
  const {
    transport,
    router,
    createContext,
    middleware = [],
    formatError = defaultFormatError,
    meta = {},
  } = options;

  const procedureMap = getProcedureMap(router);
  const allMiddleware = [...router._middleware, ...middleware] as Middleware<TContext>[];
  const activeRequests = new Map<string, ActiveRequest>();
  let context!: TContext;
  let initialized = false;
  let initPromise: Promise<void> | null = null;
  const unsubscribers: Array<() => void> = [];

  const send = (message: ReturnType<typeof createResponse>) => {
    transport.send(encodeMessage(message));
  };

  const handleRequest = async (
    id: string,
    method: string,
    params: unknown,
  ): Promise<void> => {
    const procedure = lookupProcedure(procedureMap, method);
    if (!procedure) {
      send(
        createErrorResponse(id, {
          code: ErrorCodes.METHOD_NOT_FOUND,
          message: `Method not found: ${method}`,
        }),
      );
      return;
    }

    const abortController = new AbortController();
    activeRequests.set(id, { abortController });

    try {
      const executeHandler = async (): Promise<unknown> => {
        const args = {
          input: params ?? undefined,
          ctx: context,
          signal: abortController.signal,
        };

        if (procedure._type === "stream") {
          const iterable = await procedure.resolve(args);
          for await (const value of iterable) {
            if (abortController.signal.aborted) {
              return;
            }
            send(createChunk(id, value));
          }
          if (!abortController.signal.aborted) {
            send(createEnd(id));
          }
          return;
        }

        return procedure.resolve(args);
      };

      const result = await runMiddleware(
        allMiddleware,
        context,
        method,
        params,
        abortController.signal,
        executeHandler,
      );

      if (procedure._type !== "stream" && !abortController.signal.aborted) {
        send(createResponse(id, result));
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        send(createErrorResponse(id, formatError(error)));
      }
    } finally {
      activeRequests.delete(id);
    }
  };

  const handleMessage = async (raw: string): Promise<void> => {
    await ensureInitialized();

    let message;
    try {
      message = decodeMessage(raw);
    } catch (error) {
      if (RpcError.isRpcError(error)) {
        return;
      }
      throw error;
    }

    switch (message.kind) {
      case "req":
        await handleRequest(message.id, message.method, message.params);
        break;
      case "cancel": {
        const active = activeRequests.get(message.id);
        active?.abortController.abort();
        activeRequests.delete(message.id);
        break;
      }
      default:
        break;
    }
  };

  const ensureInitialized = async () => {
    if (initialized) return;
    if (!initPromise) {
      initPromise = (async () => {
        context = await createContext({ meta });
        initialized = true;
      })();
    }
    await initPromise;
  };

  void ensureInitialized();

  unsubscribers.push(
    transport.onMessage((data) => {
      void handleMessage(data);
    }),
  );

  return {
    get context() {
      return context;
    },
    close: async () => {
      for (const [id, active] of activeRequests) {
        active.abortController.abort();
        activeRequests.delete(id);
      }
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
      await transport.disconnect();
    },
  };
}

export type CreateServerOptions<
  TRecord extends RouterRecord,
  TContext,
> = {
  router: Router<TRecord>;
  createContext: CreateContextFn<TContext>;
  middleware?: Middleware<TContext>[];
  formatError?: FormatErrorFn;
};

export type RpcServer<TContext> = {
  handleConnection: (
    transport: Transport,
    meta?: ConnectionMeta,
  ) => RpcConnection<TContext>;
};

export function createServer<
  TRecord extends RouterRecord,
  TContext,
>(options: CreateServerOptions<TRecord, TContext>): RpcServer<TContext> {
  return {
    handleConnection: (transport, meta) =>
      createConnection({
        transport,
        router: options.router,
        createContext: options.createContext,
        middleware: options.middleware,
        formatError: options.formatError,
        meta,
      }),
  };
}
