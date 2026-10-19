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

## Files

| File | What it is |
|---|---|
| `key.json` | One entry per seed: `{id, repo, branch, class, title, summary, accept, brokenSymbolOrKey, edited, why}`. `accept` is where a correct comment would point: the stale use in the unedited file (X classes) or the defect line (D). It is empty for C. |
| `prs/<id>.md` | PR title on line 1, a blank line, then the PR body |
| `SCORING.md` | The pre-registered scoring rules (hashed) |
| `verify.ts` | Checks every branch against its class rule; prints a table |
| `open-prs.sh` | Opens the 30 PRs in a fixed shuffled order (run by Sunny on 25 Oct) |
| `score.ts` | Reads the PRs' review comments from GitHub and prints the rule (a) tables |
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

1. Install Greptile, Bugbot and TraceHound (frozen at freeze-2) on both mirrors.
2. Run `./open-prs.sh --dry-run` to see the order. It is fixed by `SHUFFLE_SEED`
   in the script.
3. Run `./open-prs.sh` while logged in to `gh` as SunnyBagal. The PRs must be
   authored by that account, because Bugbot only reviews PRs its own user
   opened. Each opened PR is logged to `opened-prs.tsv`. Re-running skips
   branches that already have a PR.

## Score

```sh
export GITHUB_TOKEN=...                         # read access to both mirrors
export TRACEHOUND_LOGINS='<tracehound bot login>'
# optional overrides; defaults are greptile-apps[bot] and cursor[bot]
export GREPTILE_LOGINS=... BUGBOT_LOGINS=...
bun score.ts > results.md
```

Before scoring, confirm each tool's comment login on a real PR. `score.ts`
prints:

- the rule (a) table per seed, and caught / n per tool and class;
- every matching inline comment;
- candidate review bodies and summaries for the manual rule (b) decision. These
  name an accept path and contain `brokenSymbolOrKey`, and are listed but never
  scored;
- all comments on the C controls, for marking valid or invalid;
- the extra inline comments on seeded PRs.

Offline check of the scorer: `bun test score.test.ts`, or
`bun score.ts --fixtures fixtures --key fixtures/key.json`.

## Notes

- GitHub only accepts inline review comments on files that are part of the PR's
  diff. For the X classes the accept paths are, by construction, files the PR
  did not touch, so in practice those seeds can only be caught through rule (b).
- Commits on the mirrors are authored by the session's git identity, with
  `Co-Authored-By: Claude` trailers. The PRs themselves are opened from
  SunnyBagal's account.

## Pre-registration

```sh
sha256sum key.json SCORING.md
```

The two hashes are published before the PRs are opened. Any later change to
either file changes its hash.
