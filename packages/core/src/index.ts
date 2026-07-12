import { RpcError, ErrorCodes, defaultFormatError } from "./errors/RpcError.js";
import {
  PROTOCOL_VERSION,
  type RpcMessage,
  type RpcErrorPayload,
} from "./protocol/messages.js";
import {
  encodeMessage,
  decodeMessage,
  createRequestId,
  createRequest,
  createResponse,
  createErrorResponse,
  createChunk,
  createEnd,
  createCancel,
} from "./protocol/codec.js";
import { rpc } from "./router/index.js";
import type {
  HandlerArgs,
  Procedure,
  Router,
  RouterRecord,
} from "./router/procedure.js";
import { flattenRouter, getProcedureMap, lookupProcedure } from "./router/flatten.js";
import type { Transport, TransportReadyState, ConnectionMeta } from "./transport/types.js";
import type { Middleware } from "./middleware/types.js";
import { runMiddleware } from "./middleware/types.js";
import type {
  InferRouterInputs,
  InferRouterOutputs,
  InferRouterClient,
  InferProcedureInput,
  InferProcedureOutput,
  InferStreamOutput,
  ClientCallOptions,
  RouterFrom,
} from "./types/infer.js";

export {
  RpcError,
  ErrorCodes,
  defaultFormatError,
  PROTOCOL_VERSION,
  encodeMessage,
  decodeMessage,
  createRequestId,
  createRequest,
  createResponse,
  createErrorResponse,
  createChunk,
  createEnd,
  createCancel,
  rpc,
  flattenRouter,
  getProcedureMap,
  lookupProcedure,
  runMiddleware,
};

export type {
  RpcMessage,
  RpcErrorPayload,
  HandlerArgs,
  Procedure,
  Router,
  RouterRecord,
  Transport,
  TransportReadyState,
  ConnectionMeta,
  Middleware,
  InferRouterInputs,
  InferRouterOutputs,
  InferRouterClient,
  InferProcedureInput,
  InferProcedureOutput,
  InferStreamOutput,
  ClientCallOptions,
  RouterFrom,
};

export type { FormatErrorFn } from "./errors/RpcError.js";

export {
  MemoryTransport,
  linkTransports,
  createLinkedTransports,
} from "./transport/memory.js";
