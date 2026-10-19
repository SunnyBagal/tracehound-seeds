// verify.ts — checks every entry in key.json against its branch on the mirrors.
//
//   bun verify.ts [--linea ../linea-seeded] [--recall ../recall-seeded] [--only s01,s07] [--no-fetch]
//   (also runs under `npx tsx verify.ts ...`)
//
// Both mirrors must be cloned with dependencies installed (see README.md).
// The clones' working trees must be clean; each branch is checked out
// detached in turn and the original HEAD is restored at the end.
//
// Per seed it checks:
//   commit   the branch is exactly one commit on top of main
//   size     the diff is 5-150 changed lines (renames detected)
//   edited   `edited` in key.json equals the files the commit touches
//   types    the class's typecheck rule, compared with main's baseline:
//              X-typed: new errors exist, every one is outside `edited`,
//                       and at least one lands inside an `accept` range
//              others:  no new errors
//   tests    the test suite passes where the class requires it (X-keyed, C)
//   accept   accept ranges exist at the branch head; X-classes point outside
//            `edited`, D inside it, C has none; brokenSymbolOrKey appears in
//            the diff or at an accept range
//   nohint   no banned word in the branch name, commit message, PR text or
//            added lines

import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join, resolve, normalize } from "node:path";

type Range = { path: string; lines: [number, number] };
type Seed = {
  id: string;
  repo: string;
  branch: string;
  class: "X-typed" | "X-keyed" | "X-semantic" | "D" | "C";
  title: string;
  summary: string;
  accept: Range[];
  brokenSymbolOrKey: string | null;
  edited: string[];
  why: string;
};
type TscError = { file: string; line: number; code: string; message: string };

const HERE = import.meta.dirname ?? process.cwd();
const BANNED = /\b(seeds?|seeded|seeding|bugs?|buggy|tests?|tested|testing|benchmarks?|benchmarking|tracehound)\b/i;

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const REPO_DIRS: Record<string, string> = {
  "SunnyBagal/linea-seeded": resolve(arg("linea", join(HERE, "..", "linea-seeded"))!),
  "SunnyBagal/recall-seeded": resolve(arg("recall", join(HERE, "..", "recall-seeded"))!),
};

function run(cmd: string, args: string[], cwd: string, allowFail = true) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (!allowFail && r.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} (in ${cwd}) failed:\n${r.stdout}\n${r.stderr}`);
  }
  return { code: r.status ?? 1, out: (r.stdout ?? "") + (r.stderr ?? "") };
}

const git = (dir: string, ...args: string[]) => run("git", args, dir, false).out.trim();

// ---------------------------------------------------------------- repo setup

type RepoSpec = {
  typecheck: (dir: string) => TscError[];
  tests: ((dir: string) => { ok: boolean; detail: string }) | null;
};

function parseTsc(out: string): TscError[] {
  const errs: TscError[] = [];
  for (const line of out.split("\n")) {
    const m = line.match(/^(.+?)\((\d+),\d+\): error (TS\d+): (.*)$/);
    if (m) errs.push({ file: normalize(m[1]!), line: Number(m[2]), code: m[3]!, message: m[4]!.trim() });
  }
  return errs;
}

function tsc(dir: string, bin: string, project: string): TscError[] {
  const r = run(join(dir, bin), ["--noEmit", "--pretty", "false", "-p", project], dir);
  const errs = parseTsc(r.out);
  if (r.code !== 0 && errs.length === 0) throw new Error(`tsc -p ${project} failed without diagnostics:\n${r.out}`);
  return errs;
}

const SPECS: Record<string, RepoSpec> = {
  // turbo `check-types` = tsc --noEmit in these four packages (web runs
  // `next typegen` first). Run from the repo root so paths are repo-relative.
  "SunnyBagal/linea-seeded": {
    typecheck: (dir) => {
      run(join(dir, "apps/web/node_modules/.bin/next"), ["typegen"], join(dir, "apps/web"), false);
      const bin = "node_modules/.bin/tsc";
      return ["apps/http-backend", "apps/ws-backend", "packages/ui", "apps/web"].flatMap((p) => tsc(dir, bin, p));
    },
    tests: null, // the repo has no automated test suite
  },
  // Backend: tsc over recall-backend (its tsconfig has no include, so every
  // file is checked). Frontend: the two projects `tsc -b` builds.
  "SunnyBagal/recall-seeded": {
    typecheck: (dir) => [
      ...tsc(dir, "recall-backend/node_modules/.bin/tsc", "recall-backend"),
      ...tsc(dir, "recall-frontend/node_modules/.bin/tsc", "recall-frontend/tsconfig.app.json"),
      ...tsc(dir, "recall-frontend/node_modules/.bin/tsc", "recall-frontend/tsconfig.node.json"),
    ],
    tests: (dir) => {
      const r = run("bun", ["test"], join(dir, "recall-backend"));
      const summary = r.out.split("\n").filter((l) => /^\s*\d+ (pass|fail)\b/.test(l)).map((l) => l.trim()).join(", ");
      return { ok: r.code === 0, detail: summary || `exit ${r.code}` };
    },
  },
};

// Errors are compared without line numbers so an edit that shifts a
// pre-existing error up or down doesn't count as a new one.
const errKey = (e: TscError) => `${e.file}|${e.code}|${e.message}`;

function newErrors(base: TscError[], cur: TscError[]): TscError[] {
  const left = new Map<string, number>();
  for (const e of base) left.set(errKey(e), (left.get(errKey(e)) ?? 0) + 1);
  const added: TscError[] = [];
  for (const e of cur) {
    const n = left.get(errKey(e)) ?? 0;
    if (n > 0) left.set(errKey(e), n - 1);
    else added.push(e);
  }
  return added;
}

// ---------------------------------------------------------------- main

const key: Seed[] = JSON.parse(readFileSync(join(HERE, "key.json"), "utf8"));
const only = arg("only")?.split(",");
const seeds = only ? key.filter((s) => only.includes(s.id)) : key;
const doFetch = !process.argv.includes("--no-fetch");

type Row = { seed: Seed; cells: Record<string, string>; ok: boolean; notes: string[] };
const rows: Row[] = [];

for (const [repo, dir] of Object.entries(REPO_DIRS)) {
  const mine = seeds.filter((s) => s.repo === repo);
  if (mine.length === 0) continue;
  if (!existsSync(dir)) throw new Error(`clone of ${repo} not found at ${dir} (pass --linea/--recall)`);
  if (git(dir, "status", "--porcelain") !== "") throw new Error(`${dir} has uncommitted changes`);

  if (doFetch) {
    run("git", ["fetch", "--quiet", "origin", "+refs/heads/*:refs/remotes/origin/*"], dir, false);
  }
  const resolveRef = (b: string) =>
    run("git", ["rev-parse", "--verify", "--quiet", `refs/remotes/origin/${b}`], dir).code === 0
      ? `refs/remotes/origin/${b}`
      : `refs/heads/${b}`;
  const main = git(dir, "rev-parse", "refs/remotes/origin/main");
  const spec = SPECS[repo]!;
  const origHead = git(dir, "rev-parse", "--abbrev-ref", "HEAD") === "HEAD"
    ? git(dir, "rev-parse", "HEAD")
    : git(dir, "rev-parse", "--abbrev-ref", "HEAD");

  try {
    git(dir, "checkout", "--quiet", "--detach", main);
    const baseline = spec.typecheck(dir);
    const baseTests = spec.tests ? spec.tests(dir) : null;
    console.log(`baseline ${repo} @ ${main.slice(0, 7)}: ${baseline.length} typecheck error(s)` +
      (baseTests ? `, tests ${baseTests.ok ? "pass" : "FAIL"} (${baseTests.detail})` : ", no test suite"));
    for (const e of baseline) console.log(`  ${e.file}(${e.line}): ${e.code} ${e.message.slice(0, 100)}`);

    for (const seed of mine) {
      const notes: string[] = [];
      const cells: Record<string, string> = {};
      const ref = resolveRef(seed.branch);
      const head = git(dir, "rev-parse", ref);

      // commit
      const count = Number(git(dir, "rev-list", "--count", `${main}..${head}`));
      const parent = git(dir, "rev-parse", `${head}^`);
      cells.commit = count === 1 && parent === main ? "ok" : "FAIL";
      if (cells.commit !== "ok") notes.push(`${count} commit(s) over main, parent ${parent.slice(0, 7)}`);

      // size
      const numstat = git(dir, "diff", "--numstat", "-M", main, head);
      const size = numstat.split("\n").filter(Boolean)
        .reduce((n, l) => n + l.split("\t").slice(0, 2).reduce((a, x) => a + (Number(x) || 0), 0), 0);
      cells.size = size >= 5 && size <= 150 ? String(size) : `FAIL(${size})`;

      // edited
      const touched = git(dir, "diff", "--name-only", "--no-renames", main, head).split("\n").filter(Boolean).sort();
      const edited = [...seed.edited].sort();
      cells.edited = JSON.stringify(touched) === JSON.stringify(edited) ? "ok" : "FAIL";
      if (cells.edited !== "ok") notes.push(`touched ${touched.join(", ")}`);

      git(dir, "checkout", "--quiet", "--detach", head);

      // types
      const added = newErrors(baseline, spec.typecheck(dir));
      const inAccept = (e: TscError) =>
        seed.accept.some((a) => normalize(a.path) === e.file && e.line >= a.lines[0] && e.line <= a.lines[1]);
      if (seed.class === "X-typed") {
        const outside = added.length > 0 && added.every((e) => !edited.includes(e.file));
        const hit = added.some(inAccept);
        cells.types = outside && hit ? `ok(${added.length} new)` : "FAIL";
        if (!outside) notes.push(added.length ? `errors in edited files: ${added.filter((e) => edited.includes(e.file)).map((e) => e.file).join(", ")}` : "no new errors");
        if (outside && !hit) notes.push("no new error inside an accept range");
      } else {
        cells.types = added.length === 0 ? "ok" : `FAIL(${added.length} new)`;
      }
      for (const e of added) notes.push(`  ${e.file}(${e.line}): ${e.code} ${e.message.slice(0, 90)}`);

      // tests
      const testsRequired = seed.class === "X-keyed" || seed.class === "C";
      if (!spec.tests) cells.tests = "n/a";
      else if (!testsRequired) cells.tests = "-";
      else {
        const t = spec.tests(dir);
        cells.tests = t.ok ? "ok" : "FAIL";
        if (!t.ok) notes.push(`tests: ${t.detail}`);
      }

      // accept
      const acceptProblems: string[] = [];
      if (seed.class === "C") {
        if (seed.accept.length !== 0) acceptProblems.push("C must have no accept ranges");
      } else {
        if (seed.accept.length === 0) acceptProblems.push("no accept ranges");
        for (const a of seed.accept) {
          const show = run("git", ["show", `${head}:${a.path}`], dir);
          if (show.code !== 0) { acceptProblems.push(`${a.path} missing at head`); continue; }
          const n = show.out.split("\n").length - (show.out.endsWith("\n") ? 1 : 0);
          const [s, e] = a.lines;
          if (!(s >= 1 && e >= s && e <= n)) acceptProblems.push(`${a.path} [${s},${e}] outside 1..${n}`);
          const isEdited = edited.includes(a.path);
          if (seed.class.startsWith("X-") && isEdited) acceptProblems.push(`${a.path} is edited`);
          if (seed.class === "D" && !isEdited) acceptProblems.push(`${a.path} not edited`);
        }
        const k = seed.brokenSymbolOrKey;
        if (!k) acceptProblems.push("brokenSymbolOrKey missing");
        else {
          const diffLines = git(dir, "diff", main, head).split("\n").filter((l) => /^[+-](?![+-]{2} )/.test(l));
          const atAccept = seed.accept.some((a) => {
            const lines = run("git", ["show", `${head}:${a.path}`], dir).out.split("\n");
            return lines.slice(a.lines[0] - 1, a.lines[1]).some((l) => l.includes(k));
          });
          if (!atAccept && !diffLines.some((l) => l.includes(k))) acceptProblems.push(`"${k}" not in diff or accept ranges`);
        }
      }
      cells.accept = acceptProblems.length === 0 ? "ok" : "FAIL";
      notes.push(...acceptProblems);

      // nohint
      const prPath = join(HERE, "prs", `${seed.id}.md`);
      const prText = existsSync(prPath) ? readFileSync(prPath, "utf8") : "";
      if (!prText) notes.push(`missing prs/${seed.id}.md`);
      const prTitle = prText.split("\n")[0] ?? "";
      if (prTitle !== seed.title) notes.push("PR title differs from key.json title");
      const addedLines = git(dir, "diff", main, head).split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++"));
      const texts: [string, string][] = [
        ["branch", seed.branch],
        ["commit", git(dir, "log", "-1", "--format=%B", head)],
        ["PR", prText],
        ["diff", addedLines.join("\n")],
      ];
      const hints = texts.flatMap(([where, t]) => {
        const m = t.match(BANNED);
        return m ? [`${where}: "${m[0]}"`] : [];
      });
      cells.nohint = hints.length === 0 && prText && prTitle === seed.title ? "ok" : "FAIL";
      notes.push(...hints);

      const ok = Object.values(cells).every((c) => !c.startsWith("FAIL"));
      rows.push({ seed, cells, ok, notes });
    }
  } finally {
    git(dir, "checkout", "--quiet", origHead);
  }
}

// ---------------------------------------------------------------- report

const cols = ["commit", "size", "edited", "types", "tests", "accept", "nohint"];
const header = ["id", "repo", "class", "branch", ...cols, "result"];
const table = rows
  .sort((a, b) => a.seed.id.localeCompare(b.seed.id))
  .map((r) => [r.seed.id, r.seed.repo.split("/")[1]!.replace("-seeded", ""), r.seed.class, r.seed.branch,
    ...cols.map((c) => r.cells[c]!), r.ok ? "PASS" : "FAIL"]);
const widths = header.map((h, i) => Math.max(h.length, ...table.map((r) => r[i]!.length)));
const fmt = (r: string[]) => "| " + r.map((c, i) => c.padEnd(widths[i]!)).join(" | ") + " |";
console.log("\n" + fmt(header));
console.log("|" + widths.map((w) => "-".repeat(w + 2)).join("|") + "|");
for (const r of table) console.log(fmt(r));

for (const r of rows) {
  if (r.notes.length) console.log(`\n${r.seed.id} ${r.seed.branch}:\n  ` + r.notes.join("\n  "));
}

const failed = rows.filter((r) => !r.ok).length;
console.log(`\n${rows.length - failed}/${rows.length} pass`);
process.exit(failed === 0 && (only || rows.length === key.length) ? 0 : 1);
