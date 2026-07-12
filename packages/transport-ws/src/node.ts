import WebSocket from "ws";
import {
  WebSocketTransport,
  type CreateWebSocketTransportOptions,
  type WebSocketLike,
} from "./WebSocketTransport.js";

export type CreateNodeWebSocketTransportOptions = CreateWebSocketTransportOptions & {
  headers?: Record<string, string>;
};

export function createWebSocketTransport(
  options: CreateNodeWebSocketTransportOptions,
): WebSocketTransport {
  return new WebSocketTransport({
    createSocket: () => {
      const socket = new WebSocket(options.url, options.protocols, {
        headers: options.headers,
      });
      return socket as unknown as WebSocketLike;
    },
  });
}

export { WebSocketTransport, WS_READY_STATE } from "./WebSocketTransport.js";
export type { WebSocketLike, WebSocketTransportOptions } from "./WebSocketTransport.js";
