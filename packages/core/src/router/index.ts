import { mutation, query, router, stream, use } from "./procedure.js";
import { flattenRouter, getProcedureMap, lookupProcedure } from "./flatten.js";
export const rpc = {
  router,
  query,
  mutation,
  stream,
  use,
  flattenRouter,
  getProcedureMap,
  lookupProcedure,
};

export type {
  HandlerArgs,
  MutationProcedure,
  Procedure,
  QueryProcedure,
  Router,
  RouterRecord,
  StreamProcedure,
} from "./procedure.js";

export { flattenRouter, getProcedureMap, lookupProcedure } from "./flatten.js";
