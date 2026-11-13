// Postgres schema. Mirrors drizzle/0000_lumpy_warstar.sql (SQLite, used by tests).
// Idempotent: applied at build time (scripts/migrate-postgres.mjs) and again
// lazily by db/index.ts on the first query of each server instance.
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS documents (
  id text PRIMARY KEY NOT NULL,
  owner_id text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  version integer DEFAULT 1 NOT NULL,
  created_at text NOT NULL,
  updated_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS shares (
  document_id text NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  role text NOT NULL,
  PRIMARY KEY (document_id, user_id)
);
`;
