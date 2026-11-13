export const USERS = [
  { id: "rohith", name: "Rohith Sunkara", email: "rohith@ajaia.demo", initials: "RS" },
  {
    id: "jamie",
    name: "Jamie Chen",
    email: "jamie@ajaia.demo",
    initials: "JC",
  },
  { id: "sam", name: "Sam Rivera", email: "sam@ajaia.demo", initials: "SR" },
];
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export function title(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 120)
    throw new ApiError(400, "Use a title between 1 and 120 characters.");
  return value.trim();
}
export type RichNode = {
  type: string;
  text?: string;
  attrs?: { level: number };
  marks?: { type: string }[];
  content?: RichNode[];
};
export const EMPTY: RichNode = {
  type: "doc",
  content: [{ type: "paragraph" }],
};
export function richContent(value: unknown): RichNode {
  if (JSON.stringify(value)?.length > 1_000_000)
    throw new ApiError(413, "Document is too large (maximum 1 MB).");
  let count = 0;
  function node(v: any, depth: number): RichNode {
    if (!v || typeof v !== "object" || ++count > 20000 || depth > 20)
      throw new ApiError(400, "Invalid document structure.");
    const allowed = [
      "doc",
      "paragraph",
      "text",
      "heading",
      "bulletList",
      "orderedList",
      "listItem",
      "hardBreak",
      "blockquote",
    ];
    if (!allowed.includes(v.type))
      throw new ApiError(400, "Unsupported document formatting.");
    const result: RichNode = { type: v.type };
    if (v.type === "text") {
      if (typeof v.text !== "string" || !v.text.length)
        throw new ApiError(400, "Invalid text.");
      result.text = v.text;
      if (v.marks !== undefined) {
        if (
          !Array.isArray(v.marks) ||
          v.marks.some(
            (m: any) => !["bold", "italic", "underline"].includes(m?.type),
          )
        )
          throw new ApiError(400, "Unsupported text style.");
        result.marks = v.marks.map((m: any) => ({ type: m.type }));
      }
      return result;
    }
    if (v.type === "heading") {
      if (![1, 2, 3].includes(v.attrs?.level))
        throw new ApiError(400, "Invalid heading level.");
      result.attrs = { level: v.attrs.level };
    }
    if (v.content !== undefined) {
      if (!Array.isArray(v.content))
        throw new ApiError(400, "Invalid content.");
      const children = v.content.map((c: unknown) => node(c, depth + 1));
      const inline = ["text", "hardBreak"];
      const blocks = [
        "paragraph",
        "heading",
        "bulletList",
        "orderedList",
        "blockquote",
      ];
      const permitted = ["paragraph", "heading"].includes(v.type)
        ? inline
        : ["bulletList", "orderedList"].includes(v.type)
          ? ["listItem"]
          : v.type === "hardBreak"
            ? []
            : blocks;
      if (children.some((c: RichNode) => !permitted.includes(c.type)))
        throw new ApiError(400, "Invalid nested content.");
      if (v.type === "listItem" && children[0]?.type !== "paragraph")
        throw new ApiError(400, "List items must start with a paragraph.");
      result.content = children;
    }
    return result;
  }
  const clean = node(value, 0);
  if (clean.type !== "doc" || !clean.content?.length)
    throw new ApiError(400, "A document must contain at least one paragraph.");
  return clean;
}
export function fromText(text: string): RichNode {
  return {
    type: "doc",
    content: text
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map((line) => ({
        type: "paragraph",
        ...(line ? { content: [{ type: "text", text: line }] } : {}),
      })),
  };
}
export function userId(value: string | null): string {
  if (!USERS.some((u) => u.id === value))
    throw new ApiError(401, "Select a demo account to continue.");
  return value!;
}
