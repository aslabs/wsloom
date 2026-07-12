import type { RpcErrorPayload } from "../protocol/messages.js";

export const ErrorCodes = {
  PARSE_ERROR: "PARSE_ERROR",
  METHOD_NOT_FOUND: "METHOD_NOT_FOUND",
  INVALID_INPUT: "INVALID_INPUT",
  TIMEOUT: "TIMEOUT",
  ABORTED: "ABORTED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class RpcError extends Error {
  readonly code: string;
  readonly data?: unknown;

  constructor(payload: RpcErrorPayload) {
    super(payload.message);
    this.name = "RpcError";
    this.code = payload.code;
    this.data = payload.data;
  }

  toJSON(): RpcErrorPayload {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
    };
  }

  static fromPayload(payload: RpcErrorPayload): RpcError {
    return new RpcError(payload);
  }

  static isRpcError(value: unknown): value is RpcError {
    return value instanceof RpcError;
  }
}

export type FormatErrorFn = (error: unknown) => RpcErrorPayload;

export const defaultFormatError: FormatErrorFn = (error) => {
  if (RpcError.isRpcError(error)) {
    return error.toJSON();
  }

  if (error instanceof Error) {
    return {
      code: ErrorCodes.INTERNAL_ERROR,
      message: error.message,
    };
  }

  return {
    code: ErrorCodes.INTERNAL_ERROR,
    message: "An unknown error occurred",
  };
};
