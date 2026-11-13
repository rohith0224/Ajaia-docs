import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { service } from "../lib/service.ts";
import { richContent, fromText, userId } from "../lib/domain.ts";
let db: DatabaseSync;
let app: ReturnType<typeof service>;
beforeEach(() => {
  db = new DatabaseSync(":memory:");
  for (const file of readdirSync("drizzle")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    db.exec(readFileSync("drizzle/" + file, "utf8"));
  app = service({
    prepare(sql: string) {
      return {
        bind(...args: any[]) {
          const statement = db.prepare(sql);
          return {
            async first() {
              return statement.get(...args);
            },
            async all() {
              return { results: statement.all(...args) };
            },
            async run() {
              const result = statement.run(...args);
              return { meta: { changes: Number(result.changes) } };
            },
          };
        },
      };
    },
  });
});
afterEach(() => db.close());
test("create, rename, save and reopen preserves formatting", async () => {
  const d = await app.create("rohith", { title: "Draft" });
  const content = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [
          {
            type: "text",
            text: "Hello",
            marks: [{ type: "bold" }, { type: "underline" }],
          },
        ],
      },
    ],
  };
  const saved = await app.save(d.id, "rohith", {
    title: "Renamed",
    content,
    version: 1,
  });
  assert.equal(saved.version, 2);
  assert.deepEqual((await app.get(d.id, "rohith")).content, content);
  assert.equal((await app.list("rohith"))[0].title, "Renamed");
});
test("unshared users cannot discover or read documents", async () => {
  const d = await app.create("rohith", {});
  assert.equal((await app.list("jamie")).length, 0);
  await assert.rejects(app.get(d.id, "jamie"), { status: 404 });
  await assert.rejects(app.save(d.id, "jamie", { ...d }), { status: 404 });
});
test("viewer can read but cannot write or grant access", async () => {
  const d = await app.create("rohith", {});
  await app.grant(d.id, "rohith", { userId: "jamie", role: "viewer" });
  assert.equal((await app.get(d.id, "jamie")).role, "viewer");
  assert.equal((await app.list("jamie"))[0].role, "viewer");
  await assert.rejects(app.save(d.id, "jamie", { ...d }), { status: 403 });
  await assert.rejects(
    app.grant(d.id, "jamie", { userId: "sam", role: "editor" }),
    { status: 403 },
  );
  await assert.rejects(app.revoke(d.id, "jamie", "rohith"), { status: 403 });
});
test("editor can edit; revocation immediately prevents subsequent reads and writes", async () => {
  const d = await app.create("rohith", {});
  await app.grant(d.id, "rohith", { userId: "jamie", role: "editor" });
  await app.save(d.id, "jamie", { ...d, title: "Team edit" });
  await app.revoke(d.id, "rohith", "jamie");
  await assert.rejects(app.get(d.id, "jamie"), { status: 404 });
  await assert.rejects(app.save(d.id, "jamie", { ...d }), { status: 404 });
});
test("stale save cannot overwrite the newer version", async () => {
  const d = await app.create("rohith", {});
  await app.grant(d.id, "rohith", { userId: "jamie", role: "editor" });
  await app.save(d.id, "rohith", { ...d, title: "First save" });
  await assert.rejects(
    app.save(d.id, "jamie", { ...d, title: "Stale overwrite" }),
    { status: 409 },
  );
  assert.equal((await app.get(d.id, "rohith")).title, "First save");
});
test("grant validation and upsert preserve one grant per person", async () => {
  const d = await app.create("rohith", {});
  await assert.rejects(
    app.grant(d.id, "rohith", { userId: "rohith", role: "editor" }),
    { status: 400 },
  );
  await assert.rejects(
    app.grant(d.id, "rohith", { userId: "sam", role: "owner" }),
    { status: 400 },
  );
  await app.grant(d.id, "rohith", { userId: "sam", role: "viewer" });
  await app.grant(d.id, "rohith", { userId: "sam", role: "editor" });
  assert.equal(
    JSON.stringify(await app.shares(d.id, "rohith")),
    JSON.stringify([{ user_id: "sam", role: "editor" }]),
  );
});
test("plain text import keeps markup inert and line breaks intact", async () => {
  const content = fromText("<script>alert(1)</script>\n\nNext");
  const d = await app.create("rohith", { title: "Import", content });
  assert.deepEqual(d.content, content);
  assert.equal(content.content?.length, 3);
});
test("invalid titles, malformed rich text, oversized content and unknown users are rejected", async () => {
  await assert.rejects(app.create("rohith", { title: "  " }), { status: 400 });
  assert.throws(() => userId("intruder"), { status: 401 });
  assert.throws(
    () =>
      richContent({
        type: "doc",
        content: [{ type: "image", attrs: { src: "bad" } }],
      }),
    { status: 400 },
  );
  assert.throws(() => richContent(fromText("x".repeat(1_000_001))), {
    status: 413,
  });
  assert.throws(
    () =>
      richContent({
        type: "doc",
        content: [{ type: "text", text: "bad nesting" }],
      }),
    { status: 400 },
  );
});
