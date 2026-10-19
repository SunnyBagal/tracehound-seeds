# tracehound-seeds

A pre-registered test set for AI pull-request reviewers. It asks one question:
**do reviewers catch breaks in files the PR did not edit?**

It contains 30 single-commit branches on two public mirrors, an answer key, and
the scoring rules. The rules were fixed, and `key.json` and `SCORING.md` were
hashed, before any PR was opened.

| Mirror | Source | Branches |
|---|---|---|
| [SunnyBagal/linea-seeded](https://github.com/SunnyBagal/linea-seeded) | SunnyBagal/Linea (`main` @ `4f075a5`) | 15 |
| [SunnyBagal/recall-seeded](https://github.com/SunnyBagal/recall-seeded) | SunnyBagal/Recall (`main` @ `20ac149`) | 15 |

## Classes

| Class | n | What it is | Must be true |
|---|---|---|---|
| X-typed | 6 | Cross-file break the compiler sees in an unedited file | Typecheck fails only in files the commit did not touch |
| X-keyed | 6 | Cross-file break through a string (route, env var, message type, storage key, queue prefix) | Typecheck and tests pass; the stale use is in an unedited file |
| X-semantic | 4 | Cross-file break with no shared literal and no type error (units, swapped params, changed default, null→throw) | Typecheck passes; the broken behaviour is in an unedited file |
| D | 6 | Ordinary bug inside the diff (off-by-one, missing await, wrong comparison, unhandled null, unsafe HTML, check-then-act race) | Typecheck passes |
| C | 8 | Clean change that touches shared things correctly | Typecheck and tests pass; no defect |

"Typecheck passes" means *no new errors compared with `main`*. See the
baseline below.

## Blindness rules

- The defects were written from general knowledge of how real changes break
  code. The TraceHound repo, and any reviewer's rules or docs, were not opened
  while writing them.
- Every defect is new. No existing defect in Linea or Recall was searched for,
  described or fixed.
- Nothing public gives the game away. Branch names, commit messages, PR titles
  and bodies, and added code never contain "seed", "bug", "test", "benchmark"
  or "TraceHound". `verify.ts` checks this.
- `key.json` stays private until the results are published. Only its sha256
  (and that of `SCORING.md`) is published in advance.
- Until Sunny says scoring has started, nobody working on TraceHound may open `linea-seeded`, `recall-seeded` or `tracehound-seeds`.

## Files

| File | What it is |
|---|---|
| `key.json` | One entry per seed: `{id, repo, branch, class, title, summary, accept, brokenSymbolOrKey, edited, why}`. `accept` is where a correct comment would point: the stale use in the unedited file (X classes) or the defect line (D). It is empty for C. |
| `prs/<id>.md` | PR title on line 1, a blank line, then the PR body |
| `SCORING.md` | The pre-registered scoring rules (hashed) |
| `verify.ts` | Checks every branch against its class rule; prints a table |
| `open-prs.sh` | Opens the 30 PRs in a fixed shuffled order and triggers CodeRabbit on each (run by Sunny on 25 Oct) |
| `score.ts` | Reads every comment on the PRs from GitHub and applies the automatic rules in `SCORING.md` |
| `manual.json` | Sunny's manual calls (starts empty; schema below) |
| `control-marks.json` | Sunny's valid / invalid marks for comments on C controls (starts empty; schema below) |
| `score.test.ts`, `fixtures/` | Offline checks of `score.ts` against fixture data (no network) |

## Setup

```sh
git clone https://github.com/SunnyBagal/linea-seeded ../linea-seeded
git clone https://github.com/SunnyBagal/recall-seeded ../recall-seeded

(cd ../linea-seeded && pnpm install --frozen-lockfile)        # pnpm 9, Node >= 20
(cd ../recall-seeded/recall-backend && bun install --frozen-lockfile)
(cd ../recall-seeded/recall-frontend && bun install --frozen-lockfile)
```

## Verify the branches

```sh
bun verify.ts                       # or: npx tsx verify.ts
bun verify.ts --only s03,s17        # a subset
bun verify.ts --linea /path/to/linea-seeded --recall /path/to/recall-seeded
```

It fetches every branch of both mirrors, then checks out each seed in turn
(detached) and restores the original HEAD afterwards. Clones must have clean
working trees. Every row must read `PASS`.

What each column checks:

| Column | Check |
|---|---|
| commit | Exactly one commit on top of `main` |
| size | 5–150 changed lines (renames detected) |
| edited | `edited` equals the files the commit touches |
| types | The class's typecheck rule, compared with `main`. For X-typed, at least one new error must also fall inside an `accept` range. |
| tests | The test suite passes where the class requires it (X-keyed, C) |
| accept | Ranges exist at the branch head; they point outside `edited` for X classes and inside it for D; C has none; `brokenSymbolOrKey` appears in the diff or at an accept range |
| nohint | No banned word in the branch name, commit message, PR text or added lines |

How each repo is checked:

| Repo | Typecheck | Tests | Baseline on `main` |
|---|---|---|---|
| Linea | `tsc --noEmit` in `apps/http-backend`, `apps/ws-backend`, `packages/ui`, `apps/web` (after `next typegen`), i.e. what `pnpm check-types` runs | none: the repo has no automated suite (`scripts/smoke.sh` needs live servers and a database) | 0 errors |
| Recall | `tsc --noEmit -p recall-backend`; `tsc --noEmit` on `recall-frontend/tsconfig.app.json` and `tsconfig.node.json` | `bun test` in `recall-backend` | 5 errors already on `main` (`index.ts` ×3, `services/embeddings.ts`, `worker.ts`); 38/38 tests pass |

Errors are compared by file, code and message, not line number, so a seed that
shifts one of Recall's existing errors up or down doesn't count as adding one.

## Open the PRs (25 Oct)

1. Install TraceHound (frozen at freeze-2), CodeRabbit (OSS plan), Greptile
   (Starter) and Bugbot on both mirrors.
2. Run `./open-prs.sh --dry-run` to see the order and the commands. The order
   is fixed by `SHUFFLE_SEED` in the script.
3. Run `./open-prs.sh` while logged in to `gh` as SunnyBagal. The PRs must be
   authored by that account, because Bugbot only reviews PRs its own user
   opened.
   - Right after opening each PR, the script comments `@coderabbitai review`.
     CodeRabbit's OSS plan doesn't review repos with fewer than 10 stars on
     its own.
   - It opens at most 8 PRs per hour (one every 450s), so the full run takes
     about 3h40m.
   - Each PR is logged to `opened-prs.tsv` (id, repo, branch, URL, time, trigger
     status). A failed trigger is flagged there to post by hand.
   - Re-running skips branches that already have a PR and still keeps the 450s
     gap since the last PR it logged.

## Score

```sh
export GITHUB_TOKEN=...            # read access to both mirrors
bun score.ts > results.md
```

Default logins, each overridable with a comma-separated env var:

| Tool | Default login | Override |
|---|---|---|
| TraceHound | `github-actions[bot]` (it posts through the workflow's `GITHUB_TOKEN`) | `TRACEHOUND_LOGINS` |
| CodeRabbit | `coderabbitai[bot]` | `CODERABBIT_LOGINS` |
| Greptile | `greptile-apps[bot]` | `GREPTILE_LOGINS` |
| Bugbot | `cursor[bot]` | `BUGBOT_LOGINS` |

The script prints the logins it used. If any other GitHub Actions workflow
comments on the mirrors, its comments would also count as TraceHound's.

`score.ts` reads inline review comments, review bodies and conversation
comments for each PR, ignoring empty bodies. It then applies:

- **D, location rule:** an inline comment on an `accept` path whose head-side
  line is within `[start-3, end+3]`. Outdated comments use `original_line`.
  Base-side (LEFT) and file-level comments never match.
- **X, mention rule:** any comment whose text contains `brokenSymbolOrKey`
  (case-sensitive) and names an accept file by full path or basename. If that
  basename is also the basename of a file the PR edits, only the full accept
  path counts. That way a summary that restates the PR's own change (e.g. a
  walkthrough listing an edited `index.ts`) can't match by accident.

It prints:

- one table of caught / n per tool and class, with columns `automatic`,
  `manual` (seeds caught only by a manual call) and `auto + manual`;
- a per-seed line, the automatic matches, and every manual call with its quote
  and reason;
- the C controls: comments per tool, how many are marked valid / invalid /
  unmarked, and every comment with its mark;
- the extra comments on seeded PRs (everything that doesn't satisfy the
  automatic rule).

### `manual.json`

An array of manual calls, one per (seed, tool) the automatic rule missed but
Sunny judges caught. It applies to seeded classes only. Controls go in
`control-marks.json`.

```json
[
  {
    "id": "s07",
    "tool": "Greptile",
    "url": "https://github.com/SunnyBagal/recall-seeded/pull/12#discussion_r123",
    "quote": "exact text of the comment, or the relevant excerpt",
    "reason": "one line: why this identifies the defect"
  }
]
```

`tool` is one of `TraceHound`, `CodeRabbit`, `Greptile`, `Bugbot`. The `url`,
`quote` and `reason` fields are required.

### `control-marks.json`

An array with one mark per comment on a C control. The `url` is the comment's
URL as `score.ts` prints it.

```json
[
  { "id": "s04", "tool": "Bugbot", "url": "https://github.com/.../pull/3#discussion_r456",
    "verdict": "invalid", "note": "optional" }
]
```

`verdict` is `valid` or `invalid`. Every invalid comment counts as a false
alarm.

Offline check of the scorer: `bun test score.test.ts`, or
`bun score.ts --fixtures fixtures --key fixtures/key.json --manual fixtures/manual.json --marks fixtures/control-marks.json`.

## Notes

- GitHub only accepts inline review comments on files that are part of the PR's
  diff. The X accept paths are files the PR did not touch, so the X classes are
  scored by the mention rule, which looks at every comment on the PR, not by
  location.
- Commits on the mirrors are authored by the session's git identity, with
  `Co-Authored-By: Claude` trailers. The PRs themselves are opened from
  SunnyBagal's account.

## Pre-registration

```sh
sha256sum key.json SCORING.md
```

The two hashes are published before the PRs are opened. Any later change to
either file changes its hash.
