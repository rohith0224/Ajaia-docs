import { Pool } from "pg";
import type { Database } from "../lib/service";

// One pool per server instance. Keep it small: on Vercel each function
// instance gets its own pool, and Neon's pooled endpoint does the fan-in.
let pool: Pool | undefined;

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString)
    throw new Error("DATABASE_URL is not set. Add a Neon Postgres database.");
  pool ??= new Pool({ connectionString, max: 3 });
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
          const exec = () => getPool().query(text, args);
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
