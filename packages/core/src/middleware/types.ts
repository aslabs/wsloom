export type Middleware<TContext> = (
  opts: {
    ctx: TContext;
    method: string;
    input: unknown;
    signal: AbortSignal;
  },
  next: () => Promise<unknown>,
) => Promise<unknown>;

export async function runMiddleware<TContext>(
  middleware: Middleware<TContext>[],
  ctx: TContext,
  method: string,
  input: unknown,
  signal: AbortSignal,
  handler: () => Promise<unknown>,
): Promise<unknown> {
  let index = -1;

  const dispatch = async (i: number): Promise<unknown> => {
    if (i <= index) {
      throw new Error("next() called multiple times");
    }
    index = i;

    const fn = middleware[i];
    if (!fn) {
      return handler();
    }

    return fn({ ctx, method, input, signal }, () => dispatch(i + 1));
  };

  return dispatch(0);
}
