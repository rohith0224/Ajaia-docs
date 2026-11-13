import { Pool } from "pg";
import type { Database } from "../lib/service";
import { SCHEMA_SQL } from "./postgres-schema.mjs";

// One pool per server instance. Keep it small: on Vercel each function
// instance gets its own pool, and Neon's pooled endpoint does the fan-in.
let pool: Pool | undefined;
let ready: Promise<unknown> | undefined;

// Creates the tables on first use, so the app works even if the build ran
// before the database was connected. A failure is retried on the next request.
async function getPool() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString)
    throw new Error("DATABASE_URL is not set. Connect a Neon Postgres database.");
  pool ??= new Pool({ connectionString, max: 3 });
  ready ??= pool.query(SCHEMA_SQL).catch((error) => {
    ready = undefined;
    throw error;
  });
  await ready;
  return pool;
}

// lib/service.ts writes SQLite-style `?` placeholders; Postgres wants $1, $2...
const toPostgres = (sql: string) => {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
};

export function getDb(): Database {
  return {
    prepare(sql: string) {
      const text = toPostgres(sql);
      return {
        bind(...args: unknown[]) {
          const exec = async () => (await getPool()).query(text, args);
          return {
            async first() {
              return (await exec()).rows[0] ?? null;
            },
            async all() {
              return { results: (await exec()).rows };
            },
            async run() {
              return { meta: { changes: (await exec()).rowCount ?? 0 } };
            },
          };
        },
      };
    },
  };
}
