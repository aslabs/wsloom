import { describe, it, expect } from "vitest";
import {
  encodeMessage,
  decodeMessage,
  createRequest,
  createResponse,
  createErrorResponse,
  createChunk,
  createEnd,
  createCancel,
  RpcError,
  ErrorCodes,
  PROTOCOL_VERSION,
} from "../index.js";

describe("protocol codec", () => {
  it("round-trips request messages", () => {
    const message = createRequest("1", "users.getUser", { id: "1" });
    const decoded = decodeMessage(encodeMessage(message));
    expect(decoded).toEqual(message);
  });

  it("round-trips response messages", () => {
    const message = createResponse("1", { id: "1", name: "Alice" });
    const decoded = decodeMessage(encodeMessage(message));
    expect(decoded).toEqual(message);
  });

  it("round-trips error messages", () => {
    const message = createErrorResponse("1", {
      code: ErrorCodes.NOT_FOUND,
      message: "User not found",
    });
    const decoded = decodeMessage(encodeMessage(message));
    expect(decoded).toEqual(message);
  });

  it("round-trips stream messages", () => {
    const chunk = createChunk("1", { value: 1 });
    const end = createEnd("1");
    expect(decodeMessage(encodeMessage(chunk))).toEqual(chunk);
    expect(decodeMessage(encodeMessage(end))).toEqual(end);
  });

  it("round-trips cancel messages", () => {
    const message = createCancel("1");
    expect(decodeMessage(encodeMessage(message))).toEqual(message);
  });

  it("throws on invalid JSON", () => {
    expect(() => decodeMessage("not json")).toThrow(RpcError);
    expect(() => decodeMessage("not json")).toThrow(/Invalid JSON/);
  });

  it("throws on unsupported protocol version", () => {
    expect(() =>
      decodeMessage(JSON.stringify({ v: 99, kind: "req", id: "1", method: "x" })),
    ).toThrow(/Unsupported protocol version/);
  });

  it("throws on invalid kind", () => {
    expect(() =>
      decodeMessage(JSON.stringify({ v: PROTOCOL_VERSION, kind: "bad", id: "1" })),
    ).toThrow(/Invalid message kind/);
  });

  it("throws on missing method in request", () => {
    expect(() =>
      decodeMessage(JSON.stringify({ v: PROTOCOL_VERSION, kind: "req", id: "1" })),
    ).toThrow(/method/);
  });
});

describe("RpcError", () => {
  it("serializes to JSON payload", () => {
    const error = new RpcError({
      code: ErrorCodes.UNAUTHORIZED,
      message: "Unauthorized",
      data: { reason: "expired" },
    });
    expect(error.toJSON()).toEqual({
      code: ErrorCodes.UNAUTHORIZED,
      message: "Unauthorized",
      data: { reason: "expired" },
    });
  });

  it("rehydrates from payload", () => {
    const error = RpcError.fromPayload({
      code: ErrorCodes.TIMEOUT,
      message: "Timed out",
    });
    expect(error.code).toBe(ErrorCodes.TIMEOUT);
    expect(error.message).toBe("Timed out");
  });
});
