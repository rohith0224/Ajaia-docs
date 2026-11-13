import { getDb } from "../../../db";
import { ApiError, fromText, userId, USERS } from "../../../lib/domain";
import { service } from "../../../lib/service";
export const dynamic = "force-dynamic";
async function handle(request: Request) {
  try {
    const url = new URL(request.url),
      path = url.pathname.split("/").filter(Boolean).slice(1);
    const method = request.method;
    if (
      method !== "GET" &&
      request.headers.get("origin") &&
      request.headers.get("origin") !== url.origin
    )
      throw new ApiError(403, "Cross-origin writes are not allowed.");
    const user = userId(request.headers.get("x-demo-user"));
    const app = service(getDb());
    let result: any;
    async function body() {
      const raw = await request.text();
      if (raw.length > 1_100_000)
        throw new ApiError(413, "Request exceeds 1 MB.");
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new ApiError(400, "Invalid JSON body.");
      }
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        throw new ApiError(400, "Expected a JSON object.");
      return parsed;
    }
    if (path[0] === "users" && method === "GET") result = USERS;
    else if (path[0] === "import" && method === "POST") {
      if (Number(request.headers.get("content-length")) > 1_100_000)
        throw new ApiError(413, "File exceeds 1 MB.");
      const data = await request.formData(),
        file = data.get("file");
      if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".txt"))
        throw new ApiError(400, "Choose a UTF-8 .txt file (maximum 1 MB).");
      if (!file.size || file.size > 1_000_000)
        throw new ApiError(400, "File must be non-empty and at most 1 MB.");
      let text: string;
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(
          await file.arrayBuffer(),
        );
      } catch {
        throw new ApiError(400, "The file must use UTF-8 encoding.");
      }
      if (text.includes("\0"))
        throw new ApiError(400, "Binary files are not supported.");
      result = await app.create(user, {
        title: file.name.slice(0, -4).slice(0, 120) || "Imported document",
        content: fromText(text),
      });
    } else if (path[0] === "documents") {
      const id = path[1];
      if (!id && method === "GET") result = await app.list(user);
      else if (!id && method === "POST")
        result = await app.create(user, await body());
      else if (id && path[2] === "shares") {
        if (method === "GET") result = await app.shares(id, user);
        else if (method === "POST") {
          await app.grant(id, user, await body());
          result = { ok: true };
        } else if (method === "DELETE" && path[3]) {
          await app.revoke(id, user, path[3]);
          result = { ok: true };
        }
      } else if (id && method === "GET") result = await app.get(id, user);
      else if (id && method === "PUT")
        result = await app.save(id, user, await body());
    }
    if (result === undefined) throw new ApiError(404, "Endpoint not found.");
    return Response.json(result, {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const expected = error instanceof ApiError;
    if (!expected) console.error("API error", error);
    return Response.json(
      {
        error: expected
          ? error.message
          : "Something went wrong. Please try again.",
      },
      { status: expected ? error.status : 500 },
    );
  }
}
export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
