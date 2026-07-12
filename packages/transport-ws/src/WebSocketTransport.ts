import type { Transport, TransportReadyState } from "@wsloom/core";

type Listener<T extends unknown[]> = (...args: T) => void;

export type WebSocketLike = {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  addEventListener(type: "open" | "message" | "close" | "error", listener: (...args: unknown[]) => void): void;
  removeEventListener(type: "open" | "message" | "close" | "error", listener: (...args: unknown[]) => void): void;
  readyState: number;
};

export const WS_READY_STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;

export type WebSocketTransportOptions = {
  createSocket: () => WebSocketLike;
};

export class WebSocketTransport implements Transport {
  private socket: WebSocketLike | null = null;
  private messageListeners = new Set<Listener<[string]>>();
  private openListeners = new Set<Listener<[]>>();
  private closeListeners = new Set<Listener<[number?, string?]>>();
  private errorListeners = new Set<Listener<[unknown]>>();
  private readonly createSocket: () => WebSocketLike;

  constructor(options: WebSocketTransportOptions) {
    this.createSocket = options.createSocket;
  }

  get readyState(): TransportReadyState {
    if (!this.socket) return "closed";
    switch (this.socket.readyState) {
      case WS_READY_STATE.CONNECTING:
        return "connecting";
      case WS_READY_STATE.OPEN:
        return "open";
      default:
        return "closed";
    }
  }

  async connect(): Promise<void> {
    if (this.readyState === "open") return;

    this.socket = this.createSocket();

    if (this.socket.readyState === WS_READY_STATE.OPEN) {
      this.attachSocketListeners();
      for (const listener of this.openListeners) {
        listener();
      }
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const socket = this.socket;
      if (!socket) {
        reject(new Error("Failed to create WebSocket"));
        return;
      }

      const onOpen = () => {
        cleanup();
        for (const listener of this.openListeners) {
          listener();
        }
        resolve();
      };

      const onError = (event: unknown) => {
        cleanup();
        for (const listener of this.errorListeners) {
          listener(event);
        }
        reject(event instanceof Error ? event : new Error("WebSocket connection failed"));
      };

      const cleanup = () => {
        socket.removeEventListener("open", onOpen);
        socket.removeEventListener("error", onError);
      };

      socket.addEventListener("open", onOpen);
      socket.addEventListener("error", onError);
    });

    this.attachSocketListeners();
  }

  async disconnect(): Promise<void> {
    if (!this.socket) return;
    this.socket.close(1000, "Client disconnect");
    this.socket = null;
  }

  send(data: string): void {
    if (!this.socket || this.readyState !== "open") {
      throw new Error("WebSocket is not open");
    }
    this.socket.send(data);
  }

  onMessage(handler: (data: string) => void): () => void {
    this.messageListeners.add(handler);
    return () => this.messageListeners.delete(handler);
  }

  onOpen(handler: () => void): () => void {
    this.openListeners.add(handler);
    return () => this.openListeners.delete(handler);
  }

  onClose(handler: (code?: number, reason?: string) => void): () => void {
    this.closeListeners.add(handler);
    return () => this.closeListeners.delete(handler);
  }

  onError(handler: (error: unknown) => void): () => void {
    this.errorListeners.add(handler);
    return () => this.errorListeners.delete(handler);
  }

  private attachSocketListeners(): void {
    const socket = this.socket;
    if (!socket) return;

    socket.addEventListener("message", (event: unknown) => {
      const data =
        typeof event === "object" &&
        event !== null &&
        "data" in event &&
        typeof (event as { data: unknown }).data === "string"
          ? (event as { data: string }).data
          : String(event);
      for (const listener of this.messageListeners) {
        listener(data);
      }
    });

    socket.addEventListener("close", (event: unknown) => {
      const closeEvent =
        typeof event === "object" && event !== null
          ? (event as { code?: number; reason?: string })
          : {};
      for (const listener of this.closeListeners) {
        listener(closeEvent.code, closeEvent.reason);
      }
      this.socket = null;
    });

    socket.addEventListener("error", (event: unknown) => {
      for (const listener of this.errorListeners) {
        listener(event);
      }
    });
  }
}

export type CreateWebSocketTransportOptions = {
  url: string;
  protocols?: string | string[];
};

export function createWebSocketTransport(
  options: CreateWebSocketTransportOptions,
): WebSocketTransport {
  return new WebSocketTransport({
    createSocket: () => new WebSocket(options.url, options.protocols),
  });
}
