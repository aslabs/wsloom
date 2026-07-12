import type { Transport, TransportReadyState } from "../transport/types.js";

type Listener<T extends unknown[]> = (...args: T) => void;

export class MemoryTransport implements Transport {
  private _readyState: TransportReadyState = "closed";
  private messageListeners = new Set<Listener<[string]>>();
  private openListeners = new Set<Listener<[]>>();
  private closeListeners = new Set<Listener<[number?, string?]>>();
  private errorListeners = new Set<Listener<[unknown]>>();
  peer: MemoryTransport | null = null;

  get readyState(): TransportReadyState {
    return this._readyState;
  }

  async connect(): Promise<void> {
    if (this._readyState === "open") return;
    this._readyState = "connecting";
    this._readyState = "open";
    for (const listener of this.openListeners) {
      listener();
    }
  }

  async disconnect(): Promise<void> {
    if (this._readyState === "closed") return;
    this._readyState = "closed";
    for (const listener of this.closeListeners) {
      listener(1000, "closed");
    }
  }

  send(data: string): void {
    if (this._readyState !== "open") {
      throw new Error("Transport is not open");
    }
    if (!this.peer) {
      throw new Error("Transport peer not linked");
    }
    for (const listener of this.peer.messageListeners) {
      listener(data);
    }
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
}

export function linkTransports(a: MemoryTransport, b: MemoryTransport): void {
  a.peer = b;
  b.peer = a;
}

export function createLinkedTransports(): [MemoryTransport, MemoryTransport] {
  const client = new MemoryTransport();
  const server = new MemoryTransport();
  linkTransports(client, server);
  return [client, server];
}
