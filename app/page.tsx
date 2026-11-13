"use client";
import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  ArrowLeft,
  ArrowUpRight,
  Bold,
  Check,
  Download,
  FileText,
  FolderOpen,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Plus,
  Search,
  Share2,
  Underline,
  Undo2,
  Redo2,
  Upload,
  Users,
  X,
  Eye,
  Clock3,
} from "lucide-react";
import { EMPTY, USERS } from "../lib/domain";
type Doc = {
  id: string;
  title: string;
  content: any;
  owner_id: string;
  role: string;
  version: number;
  updated_at: string;
};
type Share = { user_id: string; role: string };
function download(name: string, data: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function Home() {
  const [user, setUser] = useState("alex"),
    [docs, setDocs] = useState<Doc[]>([]),
    [active, setActive] = useState<Doc | null>(null);
  const [filter, setFilter] = useState("all"),
    [search, setSearch] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(""),
    [status, setStatus] = useState("saved"),
    [tick, setTick] = useState(0);
  const [sharing, setSharing] = useState(false),
    [shares, setShares] = useState<Share[]>([]),
    [recipient, setRecipient] = useState("jamie"),
    [role, setRole] = useState("editor");
  const draft = useRef<Doc | null>(null),
    dirty = useRef(false),
    saving = useRef<Promise<boolean> | null>(null),
    input = useRef<HTMLInputElement>(null),
    dialog = useRef<HTMLDialogElement>(null);
  const [editorSession, setEditorSession] = useState(0);
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          link: false,
          code: false,
          codeBlock: false,
          horizontalRule: false,
          strike: false,
        }),
      ],
      content: active?.content ?? EMPTY,
      editable: active?.role !== "viewer",
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: "document-body",
          "aria-label": "Document content",
          spellcheck: "true",
        },
      },
      onUpdate: ({ editor }) => {
        if (draft.current) {
          draft.current = { ...draft.current, content: editor.getJSON() };
          dirty.current = true;
          setStatus("unsaved");
          setTick((t) => t + 1);
        }
      },
      onSelectionUpdate: () => setTick((t) => t + 1),
    },
    [editorSession],
  );
  async function api(
    path: string,
    method = "GET",
    body?: unknown,
    asUser = user,
  ) {
    const response = await fetch("/api/" + path, {
      method,
      headers: {
        "x-demo-user": asUser,
        ...(body && !(body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    });
    const data: any = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data;
  }
  async function refresh(asUser = user) {
    setDocs(await api("documents", "GET", undefined, asUser));
  }
  useEffect(() => {
    const selected = localStorage.getItem("ajaia-user");
    const id = USERS.some((u) => u.id === selected) ? selected! : "alex";
    setUser(id);
    refresh(id)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, []);
  useEffect(() => {
    if (!dirty.current || status === "conflict") return;
    const timer = setTimeout(() => {
      void save();
    }, 900);
    return () => clearTimeout(timer);
  }, [tick]);
  useEffect(() => {
    if (sharing) dialog.current?.showModal();
    else dialog.current?.close();
  }, [sharing]);
  async function save(): Promise<boolean> {
    if (saving.current) {
      const succeeded = await saving.current;
      if (!succeeded) return false;
      if (dirty.current) return save();
      return true;
    }
    if (!dirty.current || !draft.current) return true;
    const snapshot = draft.current;
    setStatus("saving");
    const task = (async () => {
      try {
        const saved = await api("documents/" + snapshot.id, "PUT", {
          title: snapshot.title,
          content: snapshot.content,
          version: snapshot.version,
        });
        if (draft.current === snapshot) {
          draft.current = saved;
          dirty.current = false;
          setActive(saved);
          setStatus("saved");
        } else {
          draft.current = { ...draft.current!, version: saved.version };
          setStatus("unsaved");
        }
        setDocs((list) => list.map((d) => (d.id === saved.id ? saved : d)));
        return true;
      } catch (e: any) {
        setError(e.message);
        setStatus(e.message.includes("newer version") ? "conflict" : "error");
        return false;
      }
    })();
    saving.current = task;
    const ok = await task;
    saving.current = null;
    if (ok && dirty.current) return save();
    return ok;
  }
  function show(doc: Doc) {
    draft.current = doc;
    dirty.current = false;
    setActive(doc);
    setStatus("saved");
    setError("");
    setEditorSession((value) => value + 1);
  }
  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function open(id: string) {
    await run(async () => {
      if (!(await save())) return;
      show(await api("documents/" + id));
    });
  }
  async function create() {
    await run(async () => {
      if (!(await save())) return;
      const d = await api("documents", "POST", { title: "Untitled document" });
      setDocs((ds) => [d, ...ds]);
      show(d);
    });
  }
  async function goHome() {
    await run(async () => {
      if (!(await save())) return;
      setActive(null);
      draft.current = null;
      await refresh();
    });
  }
  async function switchUser(id: string) {
    await run(async () => {
      if (!(await save())) return;
      setUser(id);
      localStorage.setItem("ajaia-user", id);
      setActive(null);
      draft.current = null;
      await refresh(id);
    });
  }
  async function importFile(file?: File) {
    if (!file) return;
    await run(async () => {
      if (!(await save())) return;
      if (
        !file.name.toLowerCase().endsWith(".txt") ||
        file.size > 1_000_000 ||
        file.size === 0
      )
        throw new Error("Choose a non-empty UTF-8 .txt file, up to 1 MB.");
      const form = new FormData();
      form.append("file", file);
      const d = await api("import", "POST", form);
      setDocs((ds) => [d, ...ds]);
      show(d);
    });
    if (input.current) input.current.value = "";
  }
  async function openSharing() {
    await run(async () => {
      if (!active) return;
      setShares(await api("documents/" + active.id + "/shares"));
      setRecipient(USERS.find((u) => u.id !== user)!.id);
      setSharing(true);
    });
  }
  async function grant() {
    await run(async () => {
      await api("documents/" + active!.id + "/shares", "POST", {
        userId: recipient,
        role,
      });
      setShares(await api("documents/" + active!.id + "/shares"));
    });
  }
  async function revoke(id: string) {
    await run(async () => {
      await api("documents/" + active!.id + "/shares/" + id, "DELETE");
      setShares(await api("documents/" + active!.id + "/shares"));
    });
  }
  const current = USERS.find((u) => u.id === user)!;
  const filtered = docs.filter(
    (d) =>
      (filter === "all" ||
        (filter === "owned" ? d.role === "owner" : d.role !== "owner")) &&
      d.title.toLowerCase().includes(search.toLowerCase()),
  );
  const writable = active && active.role !== "viewer";
  function tool(
    label: string,
    Icon: any,
    action: () => void,
    isActive = false,
  ) {
    return (
      <button
        key={label}
        type="button"
        title={label}
        aria-label={label}
        aria-pressed={isActive}
        disabled={!writable}
        className={"tool " + (isActive ? "selected" : "")}
        onMouseDown={(e) => e.preventDefault()}
        onClick={action}
      >
        <Icon size={17} />
      </button>
    );
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            void goHome();
          }}
        >
          <span className="brand-mark">a</span>ajaia
          <span className="brand-sub">docs</span>
        </a>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <button className="new-button" onClick={create} disabled={busy}>
          <Plus size={18} /> New document <span>+</span>
        </button>
        <nav aria-label="Document filters">
          {[
            ["all", "All documents", FileText],
            ["owned", "Owned by me", FolderOpen],
            ["shared", "Shared with me", Users],
          ].map(([id, label, Icon]: any) => (
            <button
              key={id}
              className={
                filter === id && !active ? "nav-item active" : "nav-item"
              }
              onClick={() => {
                void goHome().then(() => setFilter(id));
              }}
            >
              <Icon size={18} />
              {label}
              <span>
                {id === "all"
                  ? docs.length
                  : docs.filter((d) =>
                      id === "owned" ? d.role === "owner" : d.role !== "owner",
                    ).length}
              </span>
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="tiny-star">✳</span>
          <h3>
            Good work starts
            <br />
            with a shared idea.
          </h3>
          <p>
            A little space to write, think,
            <br />
            and move things forward.
          </p>
        </div>
        <div className="account">
          <span className="avatar">{current.initials}</span>
          <div>
            <label htmlFor="account">Demo account</label>
            <select
              id="account"
              value={user}
              disabled={busy}
              onChange={(e) => void switchUser(e.target.value)}
            >
              {USERS.map((u) => (
                <option value={u.id} key={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span>{" "}
            {active
              ? "Document"
              : filter === "shared"
                ? "Shared with me"
                : "All documents"}
          </div>
          <div className="demo-label">
            <span /> Demo workspace{" "}
            <span className="demo-extra">· 3 switchable accounts</span>
          </div>
        </header>
        {error && (
          <div className="error" role="alert">
            <span>{error}</span>
            <button aria-label="Dismiss error" onClick={() => setError("")}>
              <X size={16} />
            </button>
          </div>
        )}
        <input
          ref={input}
          type="file"
          accept=".txt,text/plain"
          hidden
          onChange={(e) => void importFile(e.target.files?.[0])}
        />
        {!active ? (
          <div className="dashboard">
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  A LITTLE CLARITY, A LOT OF POSSIBILITY
                </div>
                <h1>Your ideas, together.</h1>
                <p>Make room for your next great piece of work.</p>
              </div>
              <button
                className="secondary import"
                onClick={() => input.current?.click()}
                disabled={busy}
              >
                <Upload size={17} /> Import .txt
              </button>
            </div>
            <section className="start-card">
              <div className="start-copy">
                <span className="pill">A FRESH START</span>
                <h2>
                  From a blank page
                  <br />
                  to your next big thing.
                </h2>
                <p>Capture an idea. Shape a plan. Bring your team in.</p>
                <button className="primary" onClick={create} disabled={busy}>
                  Create a document <ArrowUpRight size={17} />
                </button>
              </div>
              <div className="paper-art" aria-hidden="true">
                <div className="art-orbit" />
                <div className="art-page">
                  <span className="art-tag">A little idea</span>
                  <i />
                  <i />
                  <i />
                  <b />
                  <i />
                  <i />
                  <div className="art-check">✓ &nbsp; Make it happen</div>
                </div>
                <div className="floating-note">✦ &nbsp; Better, together.</div>
              </div>
            </section>
            <section className="document-section">
              <div className="section-bar">
                <div>
                  <h2>
                    {filter === "owned"
                      ? "Owned by me"
                      : filter === "shared"
                        ? "Shared with me"
                        : "All documents"}{" "}
                    <span>{filtered.length}</span>
                  </h2>
                  <p>Your work, right where you left it.</p>
                </div>
                <label className="search">
                  <Search size={17} />
                  <input
                    placeholder="Search documents…"
                    aria-label="Search documents"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              </div>
              <div className="table-head">
                <span>DOCUMENT NAME</span>
                <span>OWNERSHIP</span>
                <span>LAST UPDATED</span>
                <span />
              </div>
              {loading ? (
                <div className="empty">
                  <Loader2 className="spin" />
                  Loading your workspace…
                </div>
              ) : filtered.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">
                    <FileText size={27} />
                  </div>
                  <h3>
                    {search
                      ? "No matching documents"
                      : filter === "shared"
                        ? "Nothing shared with you yet"
                        : "Your first page is waiting"}
                  </h3>
                  <p>
                    {filter === "shared"
                      ? "Switch accounts and share a document with this user."
                      : "Create a document or import a .txt file to get started."}
                  </p>
                  {filter !== "shared" && !search && (
                    <button className="secondary" onClick={create}>
                      <Plus size={16} />
                      Create your first document
                    </button>
                  )}
                </div>
              ) : (
                <div className="document-list">
                  {filtered.map((d) => (
                    <button
                      disabled={busy}
                      className="doc-row"
                      key={d.id}
                      onClick={() => void open(d.id)}
                    >
                      <div className="doc-name">
                        <span
                          className={
                            "file-icon " + (d.role === "owner" ? "" : "shared")
                          }
                        >
                          <FileText size={21} />
                        </span>
                        <div>
                          <strong>{d.title}</strong>
                          <small>
                            {USERS.find((u) => u.id === d.owner_id)?.name}{" "}
                            <span>·</span>{" "}
                            {d.role === "owner"
                              ? "Only you can manage access"
                              : d.role === "viewer"
                                ? "You can view"
                                : "You can edit"}
                          </small>
                        </div>
                      </div>
                      <span
                        className={
                          "role-badge " + (d.role === "owner" ? "" : "shared")
                        }
                      >
                        {d.role === "owner"
                          ? "Owned by you"
                          : "Shared · " + d.role}
                      </span>
                      <span className="date">
                        {new Date(d.updated_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <ArrowUpRight size={17} className="row-arrow" />
                    </button>
                  ))}
                </div>
              )}
            </section>
            <footer>
              <span>
                <span className="green-dot" /> Saved in your workspace
              </span>
              <span>Import supports UTF-8 .txt files · up to 1 MB</span>
            </footer>
          </div>
        ) : (
          <div className="editor-screen">
            <div className="editor-heading">
              <button
                className="icon-button"
                title="Back to documents"
                aria-label="Back to documents"
                disabled={busy}
                onClick={goHome}
              >
                <ArrowLeft size={20} />
              </button>
              <div className="editor-title">
                <input
                  aria-label="Document title"
                  value={active.title}
                  maxLength={120}
                  readOnly={!writable}
                  onChange={(e) => {
                    const value = e.target.value;
                    setActive({ ...active, title: value });
                    draft.current = { ...draft.current!, title: value };
                    dirty.current = true;
                    setStatus("unsaved");
                    setTick((t) => t + 1);
                  }}
                />
                <div className="save-label" aria-live="polite">
                  {status === "saved" ? (
                    <Check size={13} />
                  ) : status === "saving" ? (
                    <Loader2 size={13} className="spin" />
                  ) : (
                    <Clock3 size={13} />
                  )}{" "}
                  {status === "saved"
                    ? "All changes saved"
                    : status === "saving"
                      ? "Saving…"
                      : status === "conflict"
                        ? "Conflict — your draft is preserved"
                        : status === "error"
                          ? "Save failed — retry below"
                          : "Unsaved changes"}{" "}
                  <span>·</span>{" "}
                  {active.role === "owner"
                    ? "Owned by you"
                    : active.role + " access"}
                </div>
              </div>
              <div className="editor-actions">
                <button
                  className="secondary"
                  title="Download current draft as plain text"
                  onClick={() =>
                    download(
                      (active.title || "draft") + ".txt",
                      editor?.getText() || "",
                    )
                  }
                >
                  <Download size={16} />
                  <span>Export .txt</span>
                </button>
                {active.role === "owner" && (
                  <button
                    className="primary"
                    onClick={openSharing}
                    disabled={busy}
                  >
                    <Share2 size={16} />
                    Share
                  </button>
                )}
              </div>
            </div>
            {(status === "conflict" || status === "error") && (
              <div className="recovery">
                <strong>Your unsaved draft stays in this tab.</strong>
                <button
                  onClick={() =>
                    download(
                      "recovery-draft.json",
                      JSON.stringify(draft.current, null, 2),
                      "application/json",
                    )
                  }
                >
                  Download formatted draft
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        "Discard this tab’s unsaved changes and load the latest saved version?",
                      )
                    )
                      void run(async () =>
                        show(await api("documents/" + active.id)),
                      );
                  }}
                >
                  Reload latest
                </button>
                {status === "error" && (
                  <button onClick={() => void save()}>Retry save</button>
                )}
              </div>
            )}
            <div
              className="toolbar"
              role="toolbar"
              aria-label="Text formatting"
            >
              {tool("Undo", Undo2, () => editor?.chain().focus().undo().run())}
              {tool("Redo", Redo2, () => editor?.chain().focus().redo().run())}
              <span className="divider" />
              <select
                aria-label="Text style"
                disabled={!writable}
                value={
                  editor?.isActive("heading", { level: 1 })
                    ? "1"
                    : editor?.isActive("heading", { level: 2 })
                      ? "2"
                      : editor?.isActive("heading", { level: 3 })
                        ? "3"
                        : "0"
                }
                onChange={(e) => {
                  const level = Number(e.target.value);
                  if (level)
                    editor
                      ?.chain()
                      .focus()
                      .setHeading({ level: level as 1 | 2 | 3 })
                      .run();
                  else editor?.chain().focus().setParagraph().run();
                }}
              >
                <option value="0">Normal text</option>
                <option value="1">Heading 1</option>
                <option value="2">Heading 2</option>
                <option value="3">Heading 3</option>
              </select>
              <span className="divider" />
              {tool(
                "Bold",
                Bold,
                () => editor?.chain().focus().toggleBold().run(),
                editor?.isActive("bold"),
              )}
              {tool(
                "Italic",
                Italic,
                () => editor?.chain().focus().toggleItalic().run(),
                editor?.isActive("italic"),
              )}
              {tool(
                "Underline",
                Underline,
                () => editor?.chain().focus().toggleUnderline().run(),
                editor?.isActive("underline"),
              )}
              <span className="divider" />
              {tool(
                "Bulleted list",
                List,
                () => editor?.chain().focus().toggleBulletList().run(),
                editor?.isActive("bulletList"),
              )}
              {tool(
                "Numbered list",
                ListOrdered,
                () => editor?.chain().focus().toggleOrderedList().run(),
                editor?.isActive("orderedList"),
              )}
              <span className="toolbar-right">
                {writable ? "Editing" : "View only"}
              </span>
            </div>
            {active.role === "viewer" && (
              <div className="viewer-banner">
                <Eye size={16} />
                You have view-only access. Ask the owner for editing access.
              </div>
            )}
            <div className="page-canvas">
              <article className="document-paper">
                <EditorContent editor={editor} />
              </article>
            </div>
            <div className="editor-footer">
              <span>
                {editor?.getText().trim()
                  ? editor.getText().trim().split(/\s+/).length
                  : 0}{" "}
                words
              </span>
              <span>
                Version {active.version} ·{" "}
                {writable ? "Autosaves as you write" : "Read-only document"}
              </span>
              <button
                disabled={
                  !writable || status === "saving" || status === "conflict"
                }
                onClick={() => void save()}
              >
                Save now
              </button>
            </div>
          </div>
        )}
      </main>
      <dialog
        ref={dialog}
        onCancel={() => setSharing(false)}
        onClick={(e) => {
          if (e.target === dialog.current) setSharing(false);
        }}
      >
        <div className="modal-title">
          <div>
            <div className="eyebrow">BETTER TOGETHER</div>
            <h2>Share this document</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close sharing"
            onClick={() => setSharing(false)}
          >
            <X size={20} />
          </button>
        </div>
        <p className="modal-subtitle">Give a teammate a seat at the page.</p>
        <div className="share-controls">
          <label>
            Teammate
            <select
              aria-label="Teammate"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            >
              {USERS.filter((u) => u.id !== user).map((u) => (
                <option value={u.id} key={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Permission
            <select
              aria-label="Permission"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="editor">Can edit</option>
              <option value="viewer">Can view</option>
            </select>
          </label>
          <button className="primary" onClick={grant} disabled={busy}>
            Grant access
          </button>
        </div>
        {error && (
          <p className="modal-error" role="alert">
            {error}
          </p>
        )}
        <h3 className="access-heading">People with access</h3>
        <div className="person">
          <span className="avatar">{current.initials}</span>
          <div>
            <strong>{current.name} (you)</strong>
            <small>{current.email}</small>
          </div>
          <span>Owner</span>
        </div>
        {shares.map((s) => {
          const u = USERS.find((u) => u.id === s.user_id)!;
          return (
            <div className="person" key={u.id}>
              <span className="avatar pale">{u.initials}</span>
              <div>
                <strong>{u.name}</strong>
                <small>{u.email}</small>
              </div>
              <span>{s.role}</span>
              <button
                aria-label={"Remove access for " + u.name}
                disabled={busy}
                onClick={() => void revoke(u.id)}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
        <div className="sharing-note">
          <Users size={17} />
          <span>
            Switch demo accounts in the sidebar to test access.
            <br />
            Only the owner can grant or remove access.
          </span>
        </div>
        <button className="secondary done" onClick={() => setSharing(false)}>
          Done
        </button>
      </dialog>
    </div>
  );
}
