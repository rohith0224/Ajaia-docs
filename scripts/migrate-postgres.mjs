// Applies db/postgres.sql to DATABASE_URL. Safe to run repeatedly.
import { readFileSync } from "node:fs";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.warn("migrate-postgres: DATABASE_URL not set, skipping migration.");
  process.exit(0);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query(readFileSync(new URL("../db/postgres.sql", import.meta.url), "utf8"));
  console.log("migrate-postgres: schema is up to date.");
} finally {
  await client.end();
}
