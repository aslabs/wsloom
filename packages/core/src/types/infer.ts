import type {
  MutationProcedure,
  Procedure,
  QueryProcedure,
  RouterRecord,
  StreamProcedure,
} from "../router/procedure.js";

export type InferProcedureInput<P extends Procedure> = P["_input"];
export type InferProcedureOutput<P extends Procedure> = P["_output"];
export type InferProcedureType<P extends Procedure> = P["_type"];

export type InferStreamOutput<P extends StreamProcedure> = P["_output"];

type IsProcedureValue<T> = T extends {
  _type: "query" | "mutation" | "stream";
}
  ? true
  : false;

type InferRecordInputs<T extends RouterRecord> = {
  [K in keyof T]: IsProcedureValue<T[K]> extends true
    ? (T[K] & Procedure)["_input"]
    : T[K] extends RouterRecord
      ? InferRecordInputs<T[K]>
      : never;
};

type InferRecordOutputs<T extends RouterRecord> = {
  [K in keyof T]: IsProcedureValue<T[K]> extends true
    ? (T[K] & Procedure)["_output"]
    : T[K] extends RouterRecord
      ? InferRecordOutputs<T[K]>
      : never;
};

export type InferRouterInputs<T extends RouterRecord> = InferRecordInputs<T>;
export type InferRouterOutputs<T extends RouterRecord> = InferRecordOutputs<T>;

export type ClientCallOptions = {
  signal?: AbortSignal;
  timeout?: number;
};

type ClientProcedureCall<P extends Procedure> = P extends StreamProcedure
  ? (input?: P["_input"], options?: ClientCallOptions) => AsyncIterable<P["_output"]>
  : P extends QueryProcedure | MutationProcedure
    ? (input?: P["_input"], options?: ClientCallOptions) => Promise<P["_output"]>
    : never;

type InferClientRecord<T extends RouterRecord> = {
  [K in keyof T]-?: IsProcedureValue<T[K]> extends true
    ? ClientProcedureCall<T[K] & Procedure>
    : T[K] extends RouterRecord
      ? InferClientRecord<T[K]>
      : never;
};

export type InferRouterClient<T extends RouterRecord> = InferClientRecord<T>;

export type InferRouter<T> = T extends { _record: infer R extends RouterRecord }
  ? R
  : T extends RouterRecord
    ? T
    : never;

export type RouterFrom<T> = InferRouter<T>;
