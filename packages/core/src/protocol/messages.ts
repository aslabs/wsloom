export const PROTOCOL_VERSION = 1 as const;

export type RpcErrorPayload = {
  code: string;
  message: string;
  data?: unknown;
};

export type RequestMessage = {
  v: typeof PROTOCOL_VERSION;
  kind: "req";
  id: string;
  method: string;
  params?: unknown;
};

export type ResponseMessage = {
  v: typeof PROTOCOL_VERSION;
  kind: "res";
  id: string;
  result: unknown;
};

export type ErrorMessage = {
  v: typeof PROTOCOL_VERSION;
  kind: "err";
  id: string;
  error: RpcErrorPayload;
};

export type ChunkMessage = {
  v: typeof PROTOCOL_VERSION;
  kind: "chunk";
  id: string;
  value: unknown;
};

export type EndMessage = {
  v: typeof PROTOCOL_VERSION;
  kind: "end";
  id: string;
};

export type CancelMessage = {
  v: typeof PROTOCOL_VERSION;
  kind: "cancel";
  id: string;
};

export type RpcMessage =
  | RequestMessage
  | ResponseMessage
  | ErrorMessage
  | ChunkMessage
  | EndMessage
  | CancelMessage;

export type RpcMessageKind = RpcMessage["kind"];
