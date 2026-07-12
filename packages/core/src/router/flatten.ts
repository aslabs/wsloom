import {
  isProcedure,
  isRouterRecord,
  type Procedure,
  type Router,
  type RouterRecord,
} from "./procedure.js";

export function flattenRouter(
  record: RouterRecord,
  prefix = "",
): Map<string, Procedure> {
  const map = new Map<string, Procedure>();

  for (const [key, value] of Object.entries(record)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (isProcedure(value)) {
      map.set(path, value);
    } else if (isRouterRecord(value)) {
      for (const [nestedKey, nestedValue] of flattenRouter(value, path)) {
        map.set(nestedKey, nestedValue);
      }
    } else {
      throw new Error(`Invalid router entry at "${path}": expected procedure or namespace`);
    }
  }

  return map;
}

export function getProcedureMap<TRecord extends RouterRecord>(
  routerInstance: Router<TRecord>,
): Map<string, Procedure> {
  return flattenRouter(routerInstance._record);
}

export function lookupProcedure(
  map: Map<string, Procedure>,
  method: string,
): Procedure | undefined {
  return map.get(method);
}
