import { RpcError, ErrorCodes } from "../errors/RpcError.js";
import { PROTOCOL_VERSION, type RpcMessage, type RpcErrorPayload } from "./messages.js";

const VALID_KINDS = new Set(["req", "res", "err", "chunk", "end", "cancel"]);

export function createRequestId(): string {
  const globalCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof globalCrypto?.randomUUID === "function") {
    return globalCrypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function encodeMessage(message: RpcMessage): string {
  return JSON.stringify(message);
}

export function decodeMessage(raw: string): RpcMessage {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new RpcError({
      code: ErrorCodes.PARSE_ERROR,
      message: "Invalid JSON message",
    });
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new RpcError({
      code: ErrorCodes.PARSE_ERROR,
      message: "Message must be an object",
    });
  }

  const message = parsed as Record<string, unknown>;

  if (message.v !== PROTOCOL_VERSION) {
    throw new RpcError({
      code: ErrorCodes.PARSE_ERROR,
      message: `Unsupported protocol version: ${String(message.v)}`,
    });
  }

  if (typeof message.kind !== "string" || !VALID_KINDS.has(message.kind)) {
    throw new RpcError({
      code: ErrorCodes.PARSE_ERROR,
      message: "Invalid message kind",
    });
  }

  if (typeof message.id !== "string" || message.id.length === 0) {
    throw new RpcError({
      code: ErrorCodes.PARSE_ERROR,
      message: "Message id must be a non-empty string",
    });
  }

  switch (message.kind) {
    case "req": {
      if (typeof message.method !== "string" || message.method.length === 0) {
        throw new RpcError({
          code: ErrorCodes.PARSE_ERROR,
          message: "Request method must be a non-empty string",
        });
      }
      return {
        v: PROTOCOL_VERSION,
        kind: "req",
        id: message.id,
        method: message.method,
        params: message.params,
      };
    }
    case "res":
      return {
        v: PROTOCOL_VERSION,
        kind: "res",
        id: message.id,
        result: message.result,
      };
    case "err": {
      const error = message.error;
      if (
        typeof error !== "object" ||
        error === null ||
        typeof (error as Record<string, unknown>).code !== "string" ||
        typeof (error as Record<string, unknown>).message !== "string"
      ) {
        throw new RpcError({
          code: ErrorCodes.PARSE_ERROR,
          message: "Error message must include code and message",
        });
      }
      return {
        v: PROTOCOL_VERSION,
        kind: "err",
        id: message.id,
        error: error as RpcErrorPayload,
      };
    }
    case "chunk":
      return {
        v: PROTOCOL_VERSION,
        kind: "chunk",
        id: message.id,
        value: message.value,
      };
    case "end":
      return {
        v: PROTOCOL_VERSION,
        kind: "end",
        id: message.id,
      };
    case "cancel":
      return {
        v: PROTOCOL_VERSION,
        kind: "cancel",
        id: message.id,
      };
    default:
      throw new RpcError({
        code: ErrorCodes.PARSE_ERROR,
        message: "Unknown message kind",
      });
  }
}

export function createRequest(
  id: string,
  method: string,
  params?: unknown,
): RpcMessage {
  return {
    v: PROTOCOL_VERSION,
    kind: "req",
    id,
    method,
    params,
  };
}

export function createResponse(id: string, result: unknown): RpcMessage {
  return {
    v: PROTOCOL_VERSION,
    kind: "res",
    id,
    result,
  };
}

export function createErrorResponse(id: string, error: RpcErrorPayload): RpcMessage {
  return {
    v: PROTOCOL_VERSION,
    kind: "err",
    id,
    error,
  };
}

export function createChunk(id: string, value: unknown): RpcMessage {
  return {
    v: PROTOCOL_VERSION,
    kind: "chunk",
    id,
    value,
  };
}

export function createEnd(id: string): RpcMessage {
  return {
    v: PROTOCOL_VERSION,
    kind: "end",
    id,
  };
}

export function createCancel(id: string): RpcMessage {
  return {
    v: PROTOCOL_VERSION,
    kind: "cancel",
    id,
  };
}
