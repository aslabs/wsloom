import {
  createRequest,
  createCancel,
  createRequestId,
  decodeMessage,
  encodeMessage,
  RpcError,
  ErrorCodes,
  type Transport,
  type RouterRecord,
  type Router,
  type ClientCallOptions,
  type InferRouterClient,
  type Procedure,
} from "@wsloom/core";

export type CreateClientOptions = {
  transport: Transport;
  timeout?: number;
};

type PendingCall = {
  kind: "call";
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
  timeoutId: ReturnType<typeof setTimeout>;
  abortController: AbortController;
  externalSignal?: AbortSignal;
};

type PendingStream = {
  kind: "stream";
  push: (value: unknown) => void;
  close: () => void;
  fail: (error: unknown) => void;
  timeoutId: ReturnType<typeof setTimeout>;
  abortController: AbortController;
  externalSignal?: AbortSignal;
};

type PendingRequest = PendingCall | PendingStream;

const DEFAULT_TIMEOUT = 30_000;

export type RpcClient<TRecord extends RouterRecord> = InferRouterClient<TRecord>;

export function createClient<
  TRouter extends Router<RouterRecord> | RouterRecord,
>(
  router: TRouter,
  options: CreateClientOptions,
): RpcClient<TRouter extends Router<infer R> ? R : TRouter> {
  type TRecord = TRouter extends Router<infer R> ? R : TRouter;
  const record = ("_record" in router ? router._record : router) as RouterRecord;
  const { transport, timeout = DEFAULT_TIMEOUT } = options;
  const pending = new Map<string, PendingRequest>();
  const unsubscribers: Array<() => void> = [];
  let connected = false;

  const send = (message: ReturnType<typeof createRequest>) => {
    transport.send(encodeMessage(message));
  };

  const clearPending = (id: string) => {
    const entry = pending.get(id);
    if (!entry) return;
    clearTimeout(entry.timeoutId);
    pending.delete(id);
  };

  const rejectPending = (id: string, error: RpcError) => {
    const entry = pending.get(id);
    if (!entry) return;
    clearTimeout(entry.timeoutId);
    pending.delete(id);
    if (entry.kind === "call") {
      entry.reject(error);
    } else {
      entry.fail(error);
    }
  };

  const setupAbort = (
    id: string,
    abortController: AbortController,
    externalSignal?: AbortSignal,
  ) => {
    const onAbort = () => {
      send(createCancel(id));
      rejectPending(
        id,
        new RpcError({
          code: ErrorCodes.ABORTED,
          message: "Request aborted",
        }),
      );
    };

    abortController.signal.addEventListener("abort", onAbort);
    externalSignal?.addEventListener("abort", () => {
      if (!abortController.signal.aborted) {
        abortController.abort();
      }
    }, { once: true });

    return () => {
      abortController.signal.removeEventListener("abort", onAbort);
    };
  };

  const handleMessage = (raw: string) => {
    let message;
    try {
      message = decodeMessage(raw);
    } catch {
      return;
    }

    const entry = pending.get(message.id);
    if (!entry) return;

    switch (message.kind) {
      case "res":
        if (entry.kind === "call") {
          if (entry.abortController.signal.aborted) {
            return;
          }
          clearPending(message.id);
          entry.resolve(message.result);
        }
        break;
      case "err":
        rejectPending(message.id, RpcError.fromPayload(message.error));
        break;
      case "chunk":
        if (entry.kind === "stream") {
          clearTimeout(entry.timeoutId);
          entry.timeoutId = setTimeout(() => {
            rejectPending(
              message.id,
              new RpcError({
                code: ErrorCodes.TIMEOUT,
                message: "Stream timed out",
              }),
            );
          }, timeout);
          entry.push(message.value);
        }
        break;
      case "end":
        if (entry.kind === "stream") {
          clearPending(message.id);
          entry.close();
        }
        break;
      default:
        break;
    }
  };

  const ensureConnected = async () => {
    if (connected) return;
    await transport.connect();
    connected = true;
  };

  unsubscribers.push(transport.onMessage(handleMessage));

  const invokeCall = async (
    method: string,
    params: unknown,
    callOptions?: ClientCallOptions,
  ): Promise<unknown> => {
    await ensureConnected();

    const id = createRequestId();
    const abortController = new AbortController();
    const callTimeout = callOptions?.timeout ?? timeout;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        send(createCancel(id));
        rejectPending(
          id,
          new RpcError({
            code: ErrorCodes.TIMEOUT,
            message: "Request timed out",
          }),
        );
      }, callTimeout);

      pending.set(id, {
        kind: "call",
        resolve,
        reject,
        timeoutId,
        abortController,
        externalSignal: callOptions?.signal,
      });

      setupAbort(id, abortController, callOptions?.signal);
      send(createRequest(id, method, params));
    });
  };

  function invokeStream(
    method: string,
    params: unknown,
    callOptions?: ClientCallOptions,
  ): AsyncIterable<unknown> {
    const id = createRequestId();
    const abortController = new AbortController();
    const callTimeout = callOptions?.timeout ?? timeout;

    const iterable = createStreamIterable(
      id,
      abortController,
      callOptions,
      callTimeout,
    );

    void ensureConnected().then(() => {
      send(createRequest(id, method, params));
    });

    return iterable;
  }

  function createStreamIterable(
    id: string,
    abortController: AbortController,
    callOptions: ClientCallOptions | undefined,
    callTimeout: number,
  ): AsyncIterable<unknown> {
    const queue: unknown[] = [];
    let closed = false;
    let error: unknown;
    let notify: (() => void) | null = null;

    const wait = () =>
      new Promise<void>((resolve) => {
        notify = resolve;
      });

    pending.set(id, {
      kind: "stream",
      push: (value) => {
        queue.push(value);
        notify?.();
        notify = null;
      },
      close: () => {
        closed = true;
        notify?.();
        notify = null;
      },
      fail: (err) => {
        error = err;
        closed = true;
        notify?.();
        notify = null;
      },
      timeoutId: setTimeout(() => {
        send(createCancel(id));
        rejectPending(
          id,
          new RpcError({
            code: ErrorCodes.TIMEOUT,
            message: "Stream timed out",
          }),
        );
      }, callTimeout),
      abortController,
      externalSignal: callOptions?.signal,
    });

    setupAbort(id, abortController, callOptions?.signal);

    return {
      [Symbol.asyncIterator](): AsyncIterator<unknown> {
        return {
          async next() {
            while (queue.length === 0 && !closed && !error) {
              await wait();
            }
            if (error) {
              throw error;
            }
            if (queue.length > 0) {
              return { value: queue.shift()!, done: false };
            }
            return { value: undefined, done: true };
          },
          async return() {
            if (!closed) {
              send(createCancel(id));
              clearPending(id);
              abortController.abort();
            }
            return { value: undefined, done: true };
          },
        };
      },
    };
  }

  const procedureTypeMap = buildProcedureTypeMap(record);

  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (typeof prop !== "string") {
        return undefined;
      }
      return createProxy([prop], procedureTypeMap, invokeCall, invokeStream);
    },
  };

  return new Proxy({}, handler) as RpcClient<TRecord>;
}

function createProxy(
  path: string[],
  procedureTypeMap: Map<string, Procedure["_type"]>,
  invokeCall: (
    method: string,
    params: unknown,
    options?: ClientCallOptions,
  ) => Promise<unknown>,
  invokeStream: (
    method: string,
    params: unknown,
    options?: ClientCallOptions,
  ) => AsyncIterable<unknown>,
): unknown {
  const methodPath = path.join(".");

  return new Proxy(
    ((input?: unknown, options?: ClientCallOptions) => {
      const procedureType = procedureTypeMap.get(methodPath) ?? "query";
      if (procedureType === "stream") {
        return invokeStream(methodPath, input, options);
      }
      return invokeCall(methodPath, input, options);
    }) as (...args: unknown[]) => unknown,
    {
      get(_target, prop) {
        if (typeof prop !== "string") {
          return undefined;
        }
        return createProxy([...path, prop], procedureTypeMap, invokeCall, invokeStream);
      },
    },
  );
}

function buildProcedureTypeMap(
  record: RouterRecord,
  prefix = "",
): Map<string, Procedure["_type"]> {
  const map = new Map<string, Procedure["_type"]>();

  for (const [key, value] of Object.entries(record)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (
      typeof value === "object" &&
      value !== null &&
      "_type" in value &&
      typeof (value as Procedure)._type === "string"
    ) {
      map.set(path, (value as Procedure)._type);
    } else if (typeof value === "object" && value !== null) {
      for (const [nestedKey, nestedType] of buildProcedureTypeMap(
        value as RouterRecord,
        path,
      )) {
        map.set(nestedKey, nestedType);
      }
    }
  }

  return map;
}

export type { CreateClientOptions as ClientOptions };
