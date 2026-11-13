import assert from "node:assert/strict";
const base = process.env.BASE_URL || "http://localhost:3000";
async function api(
  path,
  { user = "rohith", method = "GET", body, status = 200, headers = {} } = {},
) {
  const response = await fetch(base + "/api/" + path, {
    method,
    headers: {
      "x-demo-user": user,
      ...(body && !(body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...headers,
    },
    body:
      body instanceof FormData
        ? body
        : body === undefined
          ? undefined
          : JSON.stringify(body),
  });
  const data = await response.json();
  assert.equal(response.status, status, JSON.stringify(data));
  return data;
}
const doc = await api("documents", {
  method: "POST",
  body: { title: "API smoke test" },
});
await api("documents/" + doc.id, { user: "sam", status: 404 });
await api("documents/" + doc.id + "/shares", {
  method: "POST",
  body: { userId: "jamie", role: "editor" },
});
const saved = await api("documents/" + doc.id, {
  user: "jamie",
  method: "PUT",
  body: { ...doc, title: "API smoke test — saved" },
});
assert.equal(saved.version, 2);
await api("documents/" + doc.id, { method: "PUT", body: doc, status: 409 });
await api("documents/" + doc.id + "/shares", {
  user: "jamie",
  method: "POST",
  body: { userId: "sam", role: "editor" },
  status: 403,
});
await api("documents/" + doc.id + "/shares/jamie", { method: "DELETE" });
await api("documents/" + doc.id, { user: "jamie", status: 404 });
const form = new FormData();
form.append(
  "file",
  new File(["Hello\n\n<script>alert(1)</script>"], "smoke-import.txt", {
    type: "text/plain",
  }),
);
const imported = await api("import", { method: "POST", body: form });
assert.equal(imported.content.content.length, 3);
const wrong = new FormData();
wrong.append("file", new File(["hello"], "wrong.pdf"));
await api("import", { method: "POST", body: wrong, status: 400 });
const empty = new FormData();
empty.append("file", new File([], "empty.txt"));
await api("import", { method: "POST", body: empty, status: 400 });
await api("documents", { method: "POST", body: null, status: 400 });
await api("documents", { method: "POST", body: { title: "" }, status: 400 });
await api("documents", { user: "not-a-user", status: 401 });
await api("documents", {
  method: "POST",
  body: { title: "cross-origin" },
  headers: { Origin: "https://other.invalid" },
  status: 403,
});
console.log(
  "HTTP smoke tests passed: create, permissions, save, conflict, revocation, import, validation, identity and origin checks.",
);
