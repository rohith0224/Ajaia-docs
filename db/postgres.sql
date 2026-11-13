-- Postgres schema. Mirrors drizzle/0000_lumpy_warstar.sql (SQLite, used by tests).
-- Idempotent: scripts/migrate-postgres.mjs runs it on every build.
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
