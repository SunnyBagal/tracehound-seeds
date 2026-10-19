// score.ts — applies SCORING.md to every seed and tool.
//
//   GITHUB_TOKEN=... bun score.ts            # live: reads the PRs on the mirrors
//   bun score.ts --fixtures fixtures --key fixtures/key.json \
//                --manual fixtures/manual.json --marks fixtures/control-marks.json
//   (also runs under `npx tsx score.ts ...`)
//
// Comments read per PR: inline review comments (pulls/{n}/comments), review
// bodies (pulls/{n}/reviews) and conversation comments (issues/{n}/comments).
//
// Automatic rules:
//   D  location: an inline comment on an accept path whose head-side line
//      (`line`, or `original_line` once outdated) is within [start-3, end+3].
//      Base-side (LEFT) and file-level comments have no head-side line.
//   X  mention: any comment whose text contains brokenSymbolOrKey
//      (case-sensitive) and names an accept file, by its full path or its
//      basename. A basename that is also the basename of a file the PR edits
//      is ambiguous (it could just be restating the PR's own change), so in
//      that case only the full accept path counts.
//
// Manual calls come from manual.json, control verdicts from control-marks.json
// (both written by hand; schemas in README.md). This script never judges text.
//
// Logins (each overridable, comma-separated):
//   TRACEHOUND_LOGINS  default github-actions[bot]
//   CODERABBIT_LOGINS  default coderabbitai[bot]
//   GREPTILE_LOGINS    default greptile-apps[bot]
//   BUGBOT_LOGINS      default cursor[bot]

import { readFileSync, existsSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

export type Range = { path: string; lines: [number, number] };
export type Seed = {
  id: string;
  repo: string;
  branch: string;
  class: string;
  title: string;
  accept: Range[];
  brokenSymbolOrKey: string | null;
  edited: string[];
};

// Raw GitHub API shapes (only the fields used here).
type User = { login: string } | null;
export type ApiReviewComment = {
  id: number;
  user: User;
  path: string;
  line: number | null;
  original_line: number | null;
  side?: "LEFT" | "RIGHT" | null;
  subject_type?: "line" | "file";
  body: string;
  html_url?: string;
};
export type ApiBodyComment = { id: number; user: User; body: string | null; html_url?: string };
export type PrData = {
  number: number;
  reviewComments: ApiReviewComment[];
  reviews: ApiBodyComment[];
  issueComments: ApiBodyComment[];
};

export type Comment = {
  kind: "inline" | "review" | "conversation";
  login: string;
  body: string;
  url: string;
  path: string | null;
  line: number | null; // head-side anchor; null for non-inline, LEFT-side and file-level
};

export interface Source {
  pr(repo: string, branch: string): Promise<PrData | null>;
}

export type Tools = Record<string, string[]>;

export const DEFAULT_LOGINS: Tools = {
  TraceHound: ["github-actions[bot]"],
  CodeRabbit: ["coderabbitai[bot]"],
  Greptile: ["greptile-apps[bot]"],
  Bugbot: ["cursor[bot]"],
};
const ENV_VARS: Record<string, string> = {
  TraceHound: "TRACEHOUND_LOGINS",
  CodeRabbit: "CODERABBIT_LOGINS",
  Greptile: "GREPTILE_LOGINS",
  Bugbot: "BUGBOT_LOGINS",
};

export function toolsFromEnv(env: Record<string, string | undefined> = process.env): Tools {
  const tools: Tools = {};
  for (const [tool, def] of Object.entries(DEFAULT_LOGINS)) {
    const v = env[ENV_VARS[tool]!];
    tools[tool] = v ? v.split(",").map((s) => s.trim()).filter(Boolean) : def;
  }
  return tools;
}

// ---------------------------------------------------------------- sources

const API = "https://api.github.com";

export class GitHubSource implements Source {
  constructor(private token: string) {}

  private async get<T>(url: string): Promise<T[]> {
    const out: T[] = [];
    let next: string | null = url.includes("?") ? `${url}&per_page=100` : `${url}?per_page=100`;
    while (next) {
      const res = await fetch(next, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      if (!res.ok) throw new Error(`GET ${next}: ${res.status} ${await res.text()}`);
      out.push(...((await res.json()) as T[]));
      next = res.headers.get("link")?.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
    }
    return out;
  }

  async pr(repo: string, branch: string): Promise<PrData | null> {
    const owner = repo.split("/")[0];
    const pulls = await this.get<{ number: number; head: { ref: string } }>(
      `${API}/repos/${repo}/pulls?state=all&head=${encodeURIComponent(`${owner}:${branch}`)}`,
    );
    const pull = pulls.find((p) => p.head.ref === branch);
    if (!pull) return null;
    const n = pull.number;
    const [reviewComments, reviews, issueComments] = await Promise.all([
      this.get<ApiReviewComment>(`${API}/repos/${repo}/pulls/${n}/comments`),
      this.get<ApiBodyComment>(`${API}/repos/${repo}/pulls/${n}/reviews`),
      this.get<ApiBodyComment>(`${API}/repos/${repo}/issues/${n}/comments`),
    ]);
    return { number: n, reviewComments, reviews, issueComments };
  }
}

// fixtures/<repo name>/<branch with "/" replaced by "__">.json holding a PrData.
export class FixtureSource implements Source {
  constructor(private dir: string) {}
  async pr(repo: string, branch: string): Promise<PrData | null> {
    const file = join(this.dir, repo.split("/")[1]!, `${branch.replaceAll("/", "__")}.json`);
    return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as PrData) : null;
  }
}

export function normalize(pr: PrData): Comment[] {
  const login = (u: User) => u?.login ?? "";
  return [
    ...pr.reviewComments.map((c): Comment => ({
      kind: "inline",
      login: login(c.user),
      body: c.body ?? "",
      url: c.html_url ?? `inline:${c.id}`,
      path: c.path,
      line: c.side === "LEFT" || c.subject_type === "file" ? null : (c.line ?? c.original_line ?? null),
    })),
    ...pr.reviews.map((r): Comment => ({
      kind: "review", login: login(r.user), body: r.body ?? "", url: r.html_url ?? `review:${r.id}`, path: null, line: null,
    })),
    ...pr.issueComments.map((r): Comment => ({
      kind: "conversation", login: login(r.user), body: r.body ?? "", url: r.html_url ?? `conversation:${r.id}`, path: null, line: null,
    })),
  ].filter((c) => c.body.trim() !== "");
}

// ---------------------------------------------------------------- rules

export const isX = (s: Seed) => s.class.startsWith("X-");

export function locationMatch(seed: Seed, c: Comment): boolean {
  if (c.kind !== "inline" || c.line === null) return false;
  const line = c.line;
  return seed.accept.some((a) => a.path === c.path && line >= a.lines[0] - 3 && line <= a.lines[1] + 3);
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function namesAcceptFile(text: string, acceptPath: string, edited: string[]): boolean {
  if (text.includes(acceptPath)) return true;
  const base = basename(acceptPath);
  if (edited.some((p) => basename(p) === base)) return false; // ambiguous basename: full path only
  return new RegExp(`(^|[^\\w.-])${escapeRe(base)}(?![\\w-])`).test(text);
}

export function mentionMatch(seed: Seed, c: Comment): boolean {
  const key = seed.brokenSymbolOrKey;
  if (!key || !c.body.includes(key)) return false;
  return seed.accept.some((a) => namesAcceptFile(c.body, a.path, seed.edited));
}

export function autoMatch(seed: Seed, c: Comment): boolean {
  if (seed.class === "D") return locationMatch(seed, c);
  if (isX(seed)) return mentionMatch(seed, c);
  return false;
}

// ---------------------------------------------------------------- manual input

export type ManualCall = { id: string; tool: string; url: string; quote: string; reason: string };
export type ControlMark = { id: string; tool: string; url: string; verdict: "valid" | "invalid"; note?: string };

export function readJsonArray<T>(file: string): T[] {
  if (!existsSync(file)) return [];
  const v = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(v)) throw new Error(`${file} must contain a JSON array`);
  return v as T[];
}

export function validateManual(calls: ManualCall[], seeds: Seed[], tools: Tools): void {
  for (const [i, m] of calls.entries()) {
    const where = `manual.json[${i}]`;
    const seed = seeds.find((s) => s.id === m.id);
    if (!seed) throw new Error(`${where}: unknown seed id ${m.id}`);
    if (seed.class === "C") throw new Error(`${where}: ${m.id} is a control; mark control comments in control-marks.json`);
    if (!(m.tool in tools)) throw new Error(`${where}: unknown tool ${m.tool}`);
    for (const f of ["url", "quote", "reason"] as const) {
      if (typeof m[f] !== "string" || !m[f].trim()) throw new Error(`${where}: ${f} is required`);
    }
  }
}

export function validateMarks(marks: ControlMark[], seeds: Seed[], tools: Tools): void {
  for (const [i, m] of marks.entries()) {
    const where = `control-marks.json[${i}]`;
    const seed = seeds.find((s) => s.id === m.id);
    if (!seed) throw new Error(`${where}: unknown seed id ${m.id}`);
    if (seed.class !== "C") throw new Error(`${where}: ${m.id} is not a control`);
    if (!(m.tool in tools)) throw new Error(`${where}: unknown tool ${m.tool}`);
    if (!m.url) throw new Error(`${where}: url is required`);
    if (m.verdict !== "valid" && m.verdict !== "invalid") throw new Error(`${where}: verdict must be "valid" or "invalid"`);
  }
}

// ---------------------------------------------------------------- scoring

export type ToolResult = {
  comments: Comment[]; // every non-empty comment by the tool on the PR
  auto: Comment[];     // comments satisfying the automatic rule for the seed's class
  manual: ManualCall[];
  autoCaught: boolean;
  manualCaught: boolean; // a manual call exists
  caught: boolean;       // automatic or manual
};
export type SeedResult = { seed: Seed; pr: number | null; perTool: Record<string, ToolResult> };

export async function scoreAll(seeds: Seed[], source: Source, tools: Tools, manual: ManualCall[] = []): Promise<SeedResult[]> {
  const results: SeedResult[] = [];
  for (const seed of seeds) {
    const pr = await source.pr(seed.repo, seed.branch);
    const all = pr ? normalize(pr) : [];
    const perTool: Record<string, ToolResult> = {};
    for (const [tool, logins] of Object.entries(tools)) {
      const comments = all.filter((c) => logins.includes(c.login));
      const auto = comments.filter((c) => autoMatch(seed, c));
      const calls = manual.filter((m) => m.id === seed.id && m.tool === tool);
      perTool[tool] = {
        comments, auto, manual: calls,
        autoCaught: auto.length > 0,
        manualCaught: calls.length > 0,
        caught: auto.length > 0 || calls.length > 0,
      };
    }
    results.push({ seed, pr: pr?.number ?? null, perTool });
  }
  return results;
}

export const ROWS: { label: string; match: (s: Seed) => boolean }[] = [
  { label: "X-typed", match: (s) => s.class === "X-typed" },
  { label: "X-keyed", match: (s) => s.class === "X-keyed" },
  { label: "X-semantic", match: (s) => s.class === "X-semantic" },
  { label: "all X", match: isX },
  { label: "D", match: (s) => s.class === "D" },
  { label: "all seeded", match: (s) => s.class !== "C" },
];

// One row per tool and class. "manual" counts seeds caught only by a manual
// call (the automatic rule missed them); "auto + manual" is the union.
export function summary(results: SeedResult[], tools: string[]): string[][] {
  const rows: string[][] = [];
  for (const tool of tools) {
    for (const r of ROWS) {
      const rs = results.filter((x) => r.match(x.seed));
      if (rs.length === 0) continue;
      const auto = rs.filter((x) => x.perTool[tool]!.autoCaught).length;
      const manualOnly = rs.filter((x) => !x.perTool[tool]!.autoCaught && x.perTool[tool]!.manualCaught).length;
      const both = rs.filter((x) => x.perTool[tool]!.caught).length;
      rows.push([tool, r.label, String(rs.length), `${auto}/${rs.length}`, `+${manualOnly}`, `${both}/${rs.length}`]);
    }
  }
  return rows;
}

export type ControlRow = { tool: string; comments: number; valid: number; invalid: number; unmarked: number };

export function controlSummary(results: SeedResult[], tools: string[], marks: ControlMark[]): ControlRow[] {
  const controls = results.filter((r) => r.seed.class === "C");
  return tools.map((tool) => {
    const row: ControlRow = { tool, comments: 0, valid: 0, invalid: 0, unmarked: 0 };
    for (const r of controls) for (const c of r.perTool[tool]!.comments) {
      row.comments++;
      const m = marks.find((x) => x.id === r.seed.id && x.tool === tool && x.url === c.url);
      if (!m) row.unmarked++;
      else if (m.verdict === "valid") row.valid++;
      else row.invalid++;
    }
    return row;
  });
}

export function extraComments(results: SeedResult[], tool: string): { seed: Seed; comment: Comment }[] {
  return results
    .filter((r) => r.seed.class !== "C")
    .flatMap((r) => r.perTool[tool]!.comments.filter((c) => !autoMatch(r.seed, c)).map((comment) => ({ seed: r.seed, comment })));
}

// ---------------------------------------------------------------- report

function table(header: string[], rows: string[][]): string {
  const w = header.map((h, i) => Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length)));
  const line = (r: string[]) => "| " + r.map((c, i) => (c ?? "").padEnd(w[i]!)).join(" | ") + " |";
  return [line(header), "|" + w.map((x) => "-".repeat(x + 2)).join("|") + "|", ...rows.map(line)].join("\n");
}

const oneLine = (s: string, n = 160) => s.replace(/\s+/g, " ").trim().slice(0, n);
const where = (c: Comment) => (c.kind === "inline" ? `inline ${c.path}:${c.line ?? "-"}` : c.kind);

export function report(results: SeedResult[], tools: Tools, marks: ControlMark[]): string {
  const names = Object.keys(tools);
  const seeded = results.filter((r) => r.seed.class !== "C");
  const controls = results.filter((r) => r.seed.class === "C");
  const out: string[] = [];

  out.push("## Caught / n\n");
  out.push(table(["tool", "class", "n", "automatic", "manual", "auto + manual"], summary(results, names)));
  out.push("\n`manual` = seeds caught only by a manual call (the automatic rule missed them).");

  out.push("\n## Per seed (A = automatic, M = manual, - = missed)\n");
  for (const r of seeded) {
    const marksTxt = names.map((n) => {
      const t = r.perTool[n]!;
      return `${n} ${t.autoCaught ? "A" : ""}${t.manualCaught ? "M" : ""}${t.caught ? "" : "-"}`;
    }).join("  ");
    out.push(`- ${r.seed.id} ${r.seed.class} ${r.pr ? `#${r.pr}` : "(no PR)"}: ${marksTxt}`);
  }

  out.push("\n## Automatic matches\n");
  let any = false;
  for (const r of seeded) for (const n of names) for (const c of r.perTool[n]!.auto) {
    any = true;
    out.push(`- ${r.seed.id} ${n} [${where(c)}] ${c.url}\n  > ${oneLine(c.body)}`);
  }
  if (!any) out.push("(none)");

  out.push("\n## Manual calls\n");
  any = false;
  for (const r of seeded) for (const n of names) for (const m of r.perTool[n]!.manual) {
    any = true;
    const redundant = r.perTool[n]!.autoCaught ? " (already caught automatically)" : "";
    out.push(`- ${r.seed.id} ${n} ${m.url}${redundant}\n  > ${oneLine(m.quote, 400)}\n  reason: ${m.reason}`);
  }
  if (!any) out.push("(none)");

  out.push("\n## C controls (any invalid comment is a false alarm)\n");
  out.push(table(["tool", "comments", "valid", "invalid (false alarms)", "unmarked"],
    controlSummary(results, names, marks).map((r) => [r.tool, String(r.comments), String(r.valid), String(r.invalid), String(r.unmarked)])));
  for (const r of controls) {
    out.push(`\n${r.seed.id} ${r.pr ? `#${r.pr}` : "(no PR)"}: ` + names.map((n) => `${n} ${r.perTool[n]!.comments.length}`).join(", "));
    for (const n of names) for (const c of r.perTool[n]!.comments) {
      const m = marks.find((x) => x.id === r.seed.id && x.tool === n && x.url === c.url);
      out.push(`- ${n} [${where(c)}] ${m ? m.verdict : "UNMARKED"} ${c.url}\n  > ${oneLine(c.body)}`);
    }
  }

  out.push("\n## Extra comments on seeded PRs (not satisfying the automatic rule)\n");
  out.push(table(["tool", "extra comments"], names.map((n) => [n, String(extraComments(results, n).length)])));
  for (const n of names) for (const { seed, comment } of extraComments(results, n)) {
    out.push(`- ${seed.id} ${n} [${where(comment)}] ${comment.url}\n  > ${oneLine(comment.body)}`);
  }
  return out.join("\n");
}

// ---------------------------------------------------------------- main

function opt(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const here = fileURLToPath(new URL(".", import.meta.url));
  const seeds: Seed[] = JSON.parse(readFileSync(opt("key") ?? join(here, "key.json"), "utf8"));
  const tools = toolsFromEnv();
  const manual = readJsonArray<ManualCall>(opt("manual") ?? join(here, "manual.json"));
  const marks = readJsonArray<ControlMark>(opt("marks") ?? join(here, "control-marks.json"));
  validateManual(manual, seeds, tools);
  validateMarks(marks, seeds, tools);

  const fx = opt("fixtures");
  let source: Source;
  if (fx) source = new FixtureSource(resolve(fx));
  else {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN is not set");
    source = new GitHubSource(token);
  }

  console.log("Logins used:");
  for (const [tool, logins] of Object.entries(tools)) {
    console.log(`  ${tool.padEnd(10)} ${logins.join(", ")}${process.env[ENV_VARS[tool]!] ? `  (from ${ENV_VARS[tool]})` : "  (default)"}`);
  }
  console.log(`Manual calls: ${manual.length}   Control marks: ${marks.length}\n`);

  const results = await scoreAll(seeds, source, tools, manual);
  console.log(report(results, tools, marks));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
