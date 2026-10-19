// score.ts — decides rule (a) of SCORING.md for every seed and tool.
//
//   GITHUB_TOKEN=... bun score.ts            # live: reads the PRs on the mirrors
//   bun score.ts --fixtures fixtures         # offline: reads fixtures/<repo>/<branch>.json
//   (also runs under `npx tsx score.ts ...`)
//
// Rule (a): a seed is caught by a tool if any inline review comment by that
// tool is on an `accept` path at a line within [start-3, end+3]. The line is
// the comment's anchor on the PR head side (`line`, or `original_line` once the
// comment is outdated); comments on the base side (side = LEFT) and file-level
// comments have no head-side line and never match.
//
// Rule (b) (a review body or summary naming an accept path AND
// brokenSymbolOrKey) is decided by hand. This script only lists candidate
// texts for that review; it never scores them.
//
// Tool logins: TraceHound has no default here. Set TRACEHOUND_LOGINS (comma-separated) before scoring.
// GREPTILE_LOGINS and BUGBOT_LOGINS override the defaults below.

import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
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
};

export type ReviewComment = {
  id: number;
  user: { login: string } | null;
  path: string;
  line: number | null;
  original_line: number | null;
  side?: "LEFT" | "RIGHT" | null;
  subject_type?: "line" | "file";
  body: string;
  html_url?: string;
};
export type BodyComment = { id: number; user: { login: string } | null; body: string | null; html_url?: string };

export type PrData = {
  number: number;
  reviewComments: ReviewComment[];
  reviews: BodyComment[];
  issueComments: BodyComment[];
};

export interface Source {
  pr(repo: string, branch: string): Promise<PrData | null>;
}

export type Tools = Record<string, string[]>;

export function toolsFromEnv(env: Record<string, string | undefined> = process.env): Tools {
  const list = (v: string | undefined, d: string[]) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : d);
  return {
    TraceHound: list(env.TRACEHOUND_LOGINS, []),
    Greptile: list(env.GREPTILE_LOGINS, ["greptile-apps[bot]"]),
    Bugbot: list(env.BUGBOT_LOGINS, ["cursor[bot]"]),
  };
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
      this.get<ReviewComment>(`${API}/repos/${repo}/pulls/${n}/comments`),
      this.get<BodyComment>(`${API}/repos/${repo}/pulls/${n}/reviews`),
      this.get<BodyComment>(`${API}/repos/${repo}/issues/${n}/comments`),
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

// ---------------------------------------------------------------- scoring

export function anchorLine(c: ReviewComment): number | null {
  if (c.side === "LEFT" || c.subject_type === "file") return null;
  return c.line ?? c.original_line ?? null;
}

export function matchesA(seed: Seed, c: ReviewComment): boolean {
  const line = anchorLine(c);
  if (line === null) return false;
  return seed.accept.some((a) => a.path === c.path && line >= a.lines[0] - 3 && line <= a.lines[1] + 3);
}

export type SeedResult = {
  seed: Seed;
  pr: number | null;
  perTool: Record<string, {
    caught: boolean;                 // rule (a)
    matching: ReviewComment[];       // inline comments that satisfy (a)
    inline: ReviewComment[];         // every inline comment by the tool
    bodies: BodyComment[];           // review bodies + PR-level comments by the tool
    bCandidates: { kind: string; text: string; url?: string }[]; // for the manual (b) decision
  }>;
};

function namesPath(text: string, path: string): boolean {
  const base = path.split("/").pop()!;
  return text.includes(path) || new RegExp(`(^|[^\\w./-])${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text);
}

export async function scoreAll(seeds: Seed[], source: Source, tools: Tools): Promise<SeedResult[]> {
  const results: SeedResult[] = [];
  for (const seed of seeds) {
    const pr = await source.pr(seed.repo, seed.branch);
    const perTool: SeedResult["perTool"] = {};
    for (const [tool, logins] of Object.entries(tools)) {
      const by = <T extends { user: { login: string } | null }>(xs: T[]) =>
        xs.filter((x) => x.user && logins.includes(x.user.login));
      const inline = pr ? by(pr.reviewComments) : [];
      const bodies = pr ? [...by(pr.reviews), ...by(pr.issueComments)].filter((b) => (b.body ?? "").trim()) : [];
      const matching = inline.filter((c) => matchesA(seed, c));
      const key = seed.brokenSymbolOrKey;
      const bCandidates: SeedResult["perTool"][string]["bCandidates"] = [];
      if (key && seed.accept.length) {
        const texts = bodies.map((b) => ({ kind: "body", text: b.body ?? "", url: b.html_url }));
        for (const t of texts) {
          if (t.text.includes(key) && seed.accept.some((a) => namesPath(t.text, a.path))) bCandidates.push(t);
        }
      }
      perTool[tool] = { caught: matching.length > 0, matching, inline, bodies, bCandidates };
    }
    results.push({ seed, pr: pr?.number ?? null, perTool });
  }
  return results;
}

export const CLASSES = ["X-typed", "X-keyed", "X-semantic", "D"] as const;

export function classTable(results: SeedResult[], tools: string[]): Record<string, Record<string, string>> {
  const t: Record<string, Record<string, string>> = {};
  for (const tool of tools) {
    t[tool] = {};
    let all = 0, allN = 0;
    for (const cls of CLASSES) {
      const rs = results.filter((r) => r.seed.class === cls);
      const caught = rs.filter((r) => r.perTool[tool]!.caught).length;
      t[tool]![cls] = `${caught}/${rs.length}`;
      all += caught;
      allN += rs.length;
    }
    t[tool]!["all seeded"] = `${all}/${allN}`;
  }
  return t;
}

// ---------------------------------------------------------------- report

function table(header: string[], rows: string[][]): string {
  const w = header.map((h, i) => Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length)));
  const line = (r: string[]) => "| " + r.map((c, i) => (c ?? "").padEnd(w[i]!)).join(" | ") + " |";
  return [line(header), "|" + w.map((x) => "-".repeat(x + 2)).join("|") + "|", ...rows.map(line)].join("\n");
}

const oneLine = (s: string, n = 140) => s.replace(/\s+/g, " ").trim().slice(0, n);

export function report(results: SeedResult[], tools: Tools): string {
  const names = Object.keys(tools);
  const out: string[] = [];
  const seeded = results.filter((r) => r.seed.class !== "C");
  const controls = results.filter((r) => r.seed.class === "C");

  out.push("## Rule (a): per seed\n");
  out.push(table(["id", "class", "repo", "PR", ...names], seeded.map((r) => [
    r.seed.id, r.seed.class, r.seed.repo.split("/")[1]!, r.pr ? `#${r.pr}` : "no PR",
    ...names.map((n) => (r.perTool[n]!.caught ? "caught" : "missed")),
  ])));

  out.push("\n## Rule (a): per tool and class (caught / n)\n");
  const ct = classTable(seeded, names);
  const cols = [...CLASSES, "all seeded"];
  out.push(table(["tool", ...cols], names.map((n) => [n, ...cols.map((c) => ct[n]![c]!)])));

  out.push("\n## Matching inline comments (rule a)\n");
  for (const r of seeded) for (const n of names) for (const c of r.perTool[n]!.matching) {
    out.push(`- ${r.seed.id} ${n} ${c.path}:${anchorLine(c)} ${c.html_url ?? ""}\n  > ${oneLine(c.body)}`);
  }

  out.push("\n## Candidates for the manual rule (b) decision (NOT scored here)\n");
  out.push("Review bodies and PR-level comments by a tool that name an accept path (full path or file name) and contain brokenSymbolOrKey.\n");
  let anyB = false;
  for (const r of seeded) for (const n of names) {
    if (r.perTool[n]!.caught) continue;
    for (const b of r.perTool[n]!.bCandidates) {
      anyB = true;
      out.push(`- ${r.seed.id} ${n} [${b.kind}] key=${r.seed.brokenSymbolOrKey} ${b.url ?? ""}\n  > ${oneLine(b.text, 400)}`);
    }
  }
  if (!anyB) out.push("(none)");

  out.push("\n## Comments on C controls (mark each valid / invalid)\n");
  out.push(table(["id", "PR", ...names.map((n) => `${n} inline/body`)], controls.map((r) => [
    r.seed.id, r.pr ? `#${r.pr}` : "no PR",
    ...names.map((n) => `${r.perTool[n]!.inline.length}/${r.perTool[n]!.bodies.length}`),
  ])));
  for (const r of controls) for (const n of names) {
    for (const c of r.perTool[n]!.inline) out.push(`- ${r.seed.id} ${n} inline ${c.path}:${anchorLine(c) ?? "-"} ${c.html_url ?? ""}\n  > ${oneLine(c.body)}`);
    for (const b of r.perTool[n]!.bodies) out.push(`- ${r.seed.id} ${n} body ${b.html_url ?? ""}\n  > ${oneLine(b.body ?? "")}`);
  }

  out.push("\n## Extra inline comments on seeded PRs (not matching rule a)\n");
  out.push(table(["tool", "extra inline comments"], names.map((n) => [
    n, String(seeded.reduce((k, r) => k + r.perTool[n]!.inline.filter((c) => !matchesA(r.seed, c)).length, 0)),
  ])));
  for (const r of seeded) for (const n of names) for (const c of r.perTool[n]!.inline.filter((c) => !matchesA(r.seed, c))) {
    out.push(`- ${r.seed.id} ${n} ${c.path}:${anchorLine(c) ?? "-"} ${c.html_url ?? ""}\n  > ${oneLine(c.body)}`);
  }
  return out.join("\n");
}

// ---------------------------------------------------------------- main

async function main() {
  const here = fileURLToPath(new URL(".", import.meta.url));
  const keyPath = process.argv.includes("--key") ? process.argv[process.argv.indexOf("--key") + 1]! : join(here, "key.json");
  const seeds: Seed[] = JSON.parse(readFileSync(keyPath, "utf8"));
  const fx = process.argv.includes("--fixtures") ? process.argv[process.argv.indexOf("--fixtures") + 1]! : null;
  const tools = toolsFromEnv();
  if (tools.TraceHound!.length === 0) {
    if (!fx) throw new Error("Set TRACEHOUND_LOGINS to the GitHub login(s) TraceHound comments as.");
    tools.TraceHound = ["tracehound-fixture[bot]"];
  }
  let source: Source;
  if (fx) source = new FixtureSource(resolve(fx));
  else {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN is not set");
    source = new GitHubSource(token);
  }
  const results = await scoreAll(seeds, source, tools);
  console.log(`tools: ${Object.entries(tools).map(([n, l]) => `${n}=${l.join("+")}`).join("  ")}\n`);
  console.log(report(results, tools));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
