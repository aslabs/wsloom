export type TransportReadyState = "connecting" | "open" | "closed";

export type TransportHandlers = {
  onMessage?: (data: string) => void;
  onOpen?: () => void;
  onClose?: (code?: number, reason?: string) => void;
  onError?: (error: unknown) => void;
};

export interface Transport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(data: string): void;
  onMessage(handler: (data: string) => void): () => void;
  onOpen?(handler: () => void): () => void;
  onClose?(handler: (code?: number, reason?: string) => void): () => void;
  onError?(handler: (error: unknown) => void): () => void;
  readonly readyState: TransportReadyState;
}

export type ConnectionMeta = Record<string, unknown>;
