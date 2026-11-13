import { ApiError, EMPTY, USERS, richContent, title } from "./domain.ts";
export type Database = { prepare(sql: string): any };
export function service(db: Database) {
  const query = (sql: string, ...args: any[]) => db.prepare(sql).bind(...args);
  const decode = (d: any) => ({ ...d, content: JSON.parse(d.content) });
  async function get(id: string, user: string) {
    const d = await query(
      `SELECT d.*, CASE WHEN d.owner_id=? THEN 'owner' ELSE s.role END role
      FROM documents d LEFT JOIN shares s ON s.document_id=d.id AND s.user_id=?
      WHERE d.id=? AND (d.owner_id=? OR s.user_id=?)`,
      user,
      user,
      id,
      user,
      user,
    ).first();
    if (!d) throw new ApiError(404, "Document not found or access removed.");
    return decode(d);
  }
  async function owner(id: string, user: string) {
    const d = await get(id, user);
    if (d.role !== "owner")
      throw new ApiError(403, "Only the owner can manage sharing.");
    return d;
  }
  return {
    get,
    async list(user: string) {
      return (
        await query(
          `SELECT d.id,d.title,d.owner_id,d.version,d.updated_at,
        CASE WHEN d.owner_id=? THEN 'owner' ELSE s.role END role
        FROM documents d LEFT JOIN shares s ON s.document_id=d.id AND s.user_id=?
        WHERE d.owner_id=? OR s.user_id=? ORDER BY d.updated_at DESC`,
          user,
          user,
          user,
          user,
        ).all()
      ).results;
    },
    async create(user: string, input: any) {
      const name = title(input.title ?? "Untitled document");
      const content = richContent(input.content ?? EMPTY);
      const id = crypto.randomUUID(),
        now = new Date().toISOString();
      await query(
        "INSERT INTO documents (id,owner_id,title,content,version,created_at,updated_at) VALUES (?,?,?,?,1,?,?)",
        id,
        user,
        name,
        JSON.stringify(content),
        now,
        now,
      ).run();
      return get(id, user);
    },
    async save(id: string, user: string, input: any) {
      const d = await get(id, user);
      if (d.role === "viewer")
        throw new ApiError(403, "You have view-only access.");
      const name = title(input.title),
        content = richContent(input.content);
      if (!Number.isSafeInteger(input.version) || input.version < 1)
        throw new ApiError(400, "A valid document version is required.");
      const result = await query(
        `UPDATE documents SET title=?,content=?,version=version+1,updated_at=?
        WHERE id=? AND version=? AND (owner_id=? OR EXISTS
        (SELECT 1 FROM shares WHERE document_id=? AND user_id=? AND role='editor'))`,
        name,
        JSON.stringify(content),
        new Date().toISOString(),
        id,
        input.version,
        user,
        id,
        user,
      ).run();
      if (!result.meta.changes)
        throw new ApiError(
          409,
          "A newer version exists or your access changed. Download your draft, then reload the latest version.",
        );
      return get(id, user);
    },
    async shares(id: string, user: string) {
      await owner(id, user);
      return (
        await query(
          "SELECT user_id,role FROM shares WHERE document_id=?",
          id,
        ).all()
      ).results;
    },
    async grant(id: string, user: string, input: any) {
      await owner(id, user);
      if (input.userId === user || !USERS.some((u) => u.id === input.userId))
        throw new ApiError(400, "Choose another demo user.");
      if (!["viewer", "editor"].includes(input.role))
        throw new ApiError(400, "Choose viewer or editor access.");
      await query(
        "INSERT INTO shares (document_id,user_id,role) VALUES (?,?,?) ON CONFLICT(document_id,user_id) DO UPDATE SET role=excluded.role",
        id,
        input.userId,
        input.role,
      ).run();
    },
    async revoke(id: string, user: string, target: string) {
      await owner(id, user);
      await query(
        "DELETE FROM shares WHERE document_id=? AND user_id=?",
        id,
        target,
      ).run();
    },
  };
}
