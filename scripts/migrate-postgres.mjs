// Applies the Postgres schema to DATABASE_URL. Safe to run repeatedly.
import pg from "pg";
import { SCHEMA_SQL } from "../db/postgres-schema.mjs";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.warn("migrate-postgres: DATABASE_URL not set, skipping migration.");
  process.exit(0);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query(SCHEMA_SQL);
  console.log("migrate-postgres: schema is up to date.");
} finally {
  await client.end();
}
