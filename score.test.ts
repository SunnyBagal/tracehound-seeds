// Offline checks of score.ts against fixtures/ (no network): bun test
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FixtureSource, classTable, report, scoreAll, toolsFromEnv, type Seed } from "./score";

const dir = join(import.meta.dir, "fixtures");
const seeds: Seed[] = JSON.parse(readFileSync(join(dir, "key.json"), "utf8"));
const tools = toolsFromEnv({ TRACEHOUND_LOGINS: "tracehound-fixture[bot]" });
const results = await scoreAll(seeds, new FixtureSource(dir), tools);
const get = (id: string) => results.find((r) => r.seed.id === id)!;

describe("rule (a)", () => {
  test("a comment exactly 3 lines past the range counts, 4 does not", () => {
    expect(get("f1").perTool.Greptile!.caught).toBe(true);
    expect(get("f1").perTool.Bugbot!.caught).toBe(false);
  });
  test("a review body is never scored, even when it names path and key", () => {
    expect(get("f1").perTool.TraceHound!.caught).toBe(false);
    expect(get("f1").perTool.TraceHound!.bCandidates.map((b) => b.kind)).toEqual(["body"]);
  });
  test("outdated comments fall back to original_line", () => {
    expect(get("f2").perTool.TraceHound!.caught).toBe(true);
  });
  test("base-side (LEFT) and file-level comments never match", () => {
    expect(get("f2").perTool.Greptile!.caught).toBe(false);
    expect(get("f2").perTool.Bugbot!.caught).toBe(false);
  });
  test("comments by other accounts are ignored; wrong path does not match", () => {
    const r = get("f3");
    for (const t of ["TraceHound", "Greptile", "Bugbot"]) expect(r.perTool[t]!.caught).toBe(false);
    expect(r.perTool.Bugbot!.inline.map((c) => c.id)).toEqual([302]);
    expect(r.perTool.Greptile!.bCandidates.map((b) => b.kind)).toEqual(["body"]);
  });
  test("a seed without a PR is missed by every tool", () => {
    const r = get("f5");
    expect(r.pr).toBeNull();
    for (const t of Object.keys(tools)) expect(r.perTool[t]!.caught).toBe(false);
  });
});

describe("tables", () => {
  test("per tool and class", () => {
    const t = classTable(results.filter((r) => r.seed.class !== "C"), Object.keys(tools));
    expect(t.TraceHound).toEqual({ "X-typed": "0/1", "X-keyed": "0/1", "X-semantic": "0/1", D: "1/1", "all seeded": "1/4" });
    expect(t.Greptile).toEqual({ "X-typed": "1/1", "X-keyed": "0/1", "X-semantic": "0/1", D: "0/1", "all seeded": "1/4" });
    expect(t.Bugbot).toEqual({ "X-typed": "0/1", "X-keyed": "0/1", "X-semantic": "0/1", D: "0/1", "all seeded": "0/4" });
  });
  test("C controls list every non-empty comment and nothing is scored", () => {
    const r = get("f4");
    expect(r.perTool.Greptile!.inline.length).toBe(1);
    expect(r.perTool.Bugbot!.bodies.length).toBe(0);
    expect(r.perTool.TraceHound!.bodies.length).toBe(1);
    const text = report(results, tools);
    expect(text).toContain("| f4 | #4 | 0/1");
    expect(text).not.toContain("| f4 | X");
  });
});
