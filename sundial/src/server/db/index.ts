import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle({ client: sql, schema });
}

type DbInstance = ReturnType<typeof createDb>;
let _db: DbInstance | null = null;

export function getDb(): DbInstance {
  if (!_db) _db = createDb();
  return _db;
}

export const db = new Proxy({} as DbInstance, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type Database = DbInstance;
