// Offline checks of score.ts against fixtures/ (no network): bun test score.test.ts
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  FixtureSource, controlSummary, readJsonArray, report, scoreAll, summary, toolsFromEnv,
  validateManual, validateMarks, type ControlMark, type ManualCall, type Seed,
} from "./score";

const dir = join(import.meta.dir, "fixtures");
const seeds: Seed[] = JSON.parse(readFileSync(join(dir, "key.json"), "utf8"));
const tools = toolsFromEnv({});
const manual = readJsonArray<ManualCall>(join(dir, "manual.json"));
const marks = readJsonArray<ControlMark>(join(dir, "control-marks.json"));
const results = await scoreAll(seeds, new FixtureSource(dir), tools, manual);
const get = (id: string, tool: string) => results.find((r) => r.seed.id === id)!.perTool[tool]!;

describe("logins", () => {
  test("defaults, and env overrides", () => {
    expect(tools).toEqual({
      TraceHound: ["github-actions[bot]"],
      CodeRabbit: ["coderabbitai[bot]"],
      Greptile: ["greptile-apps[bot]"],
      Bugbot: ["cursor[bot]"],
    });
    expect(toolsFromEnv({ TRACEHOUND_LOGINS: "a[bot], b[bot]" }).TraceHound).toEqual(["a[bot]", "b[bot]"]);
  });
});

describe("X mention rule", () => {
  test("caught by a review body naming the unedited file and the symbol", () => {
    expect(get("x1", "TraceHound").autoCaught).toBe(true);
    expect(get("x1", "TraceHound").auto.map((c) => c.kind)).toEqual(["review"]);
  });
  test("not caught by a comment naming only the symbol", () => {
    expect(get("x1", "Greptile").comments.length).toBe(1);
    expect(get("x1", "Greptile").autoCaught).toBe(false);
  });
  test("a CodeRabbit walkthrough that restates the diff does not count", () => {
    // It contains the key and "index.ts", but that basename is also an edited
    // file's, so only the full unedited path would count.
    const cr = get("x2", "CodeRabbit");
    expect(cr.comments.map((c) => c.kind)).toEqual(["conversation"]);
    expect(cr.autoCaught).toBe(false);
  });
});

describe("D location rule", () => {
  test("caught by an inline comment 3 lines past the range", () => {
    expect(get("d1", "TraceHound").autoCaught).toBe(true);
  });
  test("missed at 4 lines past the range, and a review body never counts for D", () => {
    const b = get("d1", "Bugbot");
    expect(b.comments.length).toBe(2);
    expect(b.autoCaught).toBe(false);
  });
  test("base-side (LEFT) comments have no head line and miss", () => {
    expect(get("d1", "CodeRabbit").autoCaught).toBe(false);
  });
  test("a seed with no PR is missed by every tool", () => {
    expect(results.find((r) => r.seed.id === "d2")!.pr).toBeNull();
    for (const t of Object.keys(tools)) expect(get("d2", t).caught).toBe(false);
  });
});

describe("manual calls", () => {
  test("count in their own column, never in automatic", () => {
    const g = get("x2", "Greptile");
    expect(g.autoCaught).toBe(false);
    expect(g.manualCaught).toBe(true);
    expect(g.caught).toBe(true);
  });
  test("validation rejects controls, unknown tools and empty reasons", () => {
    const base = { id: "x1", tool: "Greptile", url: "u", quote: "q", reason: "r" };
    expect(() => validateManual([{ ...base, id: "c1" }], seeds, tools)).toThrow("control");
    expect(() => validateManual([{ ...base, tool: "Other" }], seeds, tools)).toThrow("unknown tool");
    expect(() => validateManual([{ ...base, reason: " " }], seeds, tools)).toThrow("reason");
    expect(() => validateManual(manual, seeds, tools)).not.toThrow();
    expect(() => validateMarks(marks, seeds, tools)).not.toThrow();
    expect(() => validateMarks([{ id: "x1", tool: "Greptile", url: "u", verdict: "invalid" }], seeds, tools)).toThrow("not a control");
  });
});

describe("tables", () => {
  test("one row per tool and class: automatic, manual, both", () => {
    const rows = summary(results, Object.keys(tools));
    const row = (tool: string, cls: string) => rows.find((r) => r[0] === tool && r[1] === cls)!.slice(2);
    expect(row("TraceHound", "X-typed")).toEqual(["1", "1/1", "+0", "1/1"]);
    expect(row("TraceHound", "all X")).toEqual(["2", "1/2", "+0", "1/2"]);
    expect(row("TraceHound", "D")).toEqual(["2", "1/2", "+0", "1/2"]);
    expect(row("TraceHound", "all seeded")).toEqual(["4", "2/4", "+0", "2/4"]);
    expect(row("Greptile", "X-keyed")).toEqual(["1", "0/1", "+1", "1/1"]);
    expect(row("Greptile", "all seeded")).toEqual(["4", "0/4", "+1", "1/4"]);
    expect(row("CodeRabbit", "all seeded")).toEqual(["4", "0/4", "+0", "0/4"]);
    expect(row("Bugbot", "D")).toEqual(["2", "0/2", "+0", "0/2"]);
  });
  test("a control with 2 comments; the invalid one is a false alarm", () => {
    const c1 = results.find((r) => r.seed.id === "c1")!;
    const total = Object.values(c1.perTool).reduce((n, t) => n + t.comments.length, 0);
    expect(total).toBe(2); // Greptile inline + CodeRabbit walkthrough; empty review and Sunny's trigger ignored
    const cs = controlSummary(results, Object.keys(tools), marks);
    expect(cs.find((r) => r.tool === "Greptile")).toEqual({ tool: "Greptile", comments: 1, valid: 0, invalid: 1, unmarked: 0 });
    expect(cs.find((r) => r.tool === "CodeRabbit")).toEqual({ tool: "CodeRabbit", comments: 1, valid: 0, invalid: 0, unmarked: 1 });
  });
  test("extra comments are everything not satisfying the automatic rule", () => {
    const text = report(results, tools, marks);
    expect(text).toContain("| Bugbot     | 2              |");
    expect(text).toContain("| CodeRabbit | 2              |");
    expect(text).toContain("| Greptile   | 2              |");
    expect(text).toContain("| TraceHound | 0              |");
  });
});
