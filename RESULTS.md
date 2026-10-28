# seed-01 results: TraceHound

TraceHound only, scored with the committed `score.ts` against the pre-registered
`key.json` and `SCORING.md` (sha256 `abbde009…391bc1` and `ebac16b3…a5c1d`,
unchanged). Neither the scorer, the key, SCORING.md nor any seed branch was
modified. PRs were opened 27–28 Oct 2026; scored 28 Oct 2026.

**Headline (automatic rule): 9 of 22 seeded defects caught, 0 false alarms on 8
controls.**

## Setup

| | Recall (`recall-seeded`) | Linea (`linea-seeded`) |
|---|---|---|
| Action commit | `0aeef06` (review-freeze-2) | `86fd5d7` (review-freeze-2.1) |
| Model | `nvidia/Nemotron-3.5-Super-VL` | `nvidia/Nemotron-3.5-Super-VL` |
| Inputs | `max-comments: 10`, `dry-run: false`; defaults `reviewer: pool-verify-v1`, `fixes: on`, `contracts: on`, `learn: off` | same |
| Workflow commit on `main` | `296f8f3` | `3012a54`, then repinned in `6d8771a` |

review-freeze-2.1 is 0aeef06 plus a change to the Action's install step only;
the review code is byte-identical (see decision 072). The Linea runs need it
because at 0aeef06 the Action's `pnpm/action-setup` step fails on any repo
whose root `package.json` pins its own pnpm (`Multiple versions of pnpm
specified`; Linea pins `pnpm@9.0.0`). Recall has no root `package.json`.

Every posted review header reads `TraceHound · pool-verify-v1 ·
nvidia/Nemotron-3.5-Super-VL`.

## Caught / n (automatic rule)

| Class | Overall | Recall (0aeef06) | Linea (86fd5d7) |
|---|---|---|---|
| X-typed | 2/6 | 2/3 | 0/3 |
| X-keyed | 2/6 | 1/3 | 1/3 |
| X-semantic | 0/4 | 0/2 | 0/2 |
| **all X (cross-file)** | **4/16** | 3/8 | 1/8 |
| D (in-diff) | 5/6 | 3/3 | 2/3 |
| **all seeded** | **9/22** | 6/11 | 3/11 |

Manual column: +0 everywhere, because `manual.json` is still empty. Manual calls
are Sunny's; candidates are listed below.

Of the 4 cross-file catches, 3 (s19, s24, s30) come from the review's
deterministic **"Files you didn't edit that depend on this change"** section
(`contracts: on`) in reviews that had 0 model findings. 1 (s07) is a model
inline finding that names the unedited caller.

## C controls

| | Overall | Recall | Linea |
|---|---|---|---|
| Controls | 8 | 4 | 4 |
| TraceHound comments on controls | 0 | 0 | 0 |
| False alarms | **0** | 0 | 0 |

TraceHound posted nothing on any of the 8 controls, so there is nothing to mark
in `control-marks.json`.

## Comments per PR

| | PRs | Reviews | Inline | Conversation | Total | Per PR |
|---|---|---|---|---|---|---|
| Recall | 15 | 8 | 5 | 0 | 13 | 0.87 |
| Linea | 15 | 5 | 3 | 0 | 8 | 0.53 |
| **Overall** | 30 | 13 | 8 | 0 | **21** | **0.70** |

On seeded PRs: 9 comments satisfy the automatic rule and 12 don't (the "extra
comments" in `raw/score-output.md`). The 12 are mostly the review bodies that
accompany a matched inline comment.

## Runs

- 30/30 final runs are green. No partial reviews: no review contains "N of M
  reviewer chunks failed".
- Red runs: **linea-seeded#1** (s29) only.
  - [40564762809](https://github.com/SunnyBagal/linea-seeded/actions/runs/40564762809):
    attempt 1 red at Action install (0aeef06, pnpm conflict). Attempt 2 (rerun) red, same cause.
  - [40589574980](https://github.com/SunnyBagal/linea-seeded/actions/runs/40589574980):
    red, same cause. This was the first draft/ready re-trigger after the repin, but it still ran
    0aeef06 because the PR's test-merge commit had not been rebuilt.
  - [40689159837](https://github.com/SunnyBagal/linea-seeded/actions/runs/40689159837):
    green on 86fd5d7. This is the second re-trigger, after the base was re-set
    (see Deviations). It is the scored run.

### Green, no review posted (17 of 30)

TraceHound logged `reviewer returned no findings; nothing posted.` "Reviewer
step" is the duration of the Action's "Review and post findings" step.

| PR | Seed | Class | Reviewer step |
|---|---|---|---|
| [recall#1](https://github.com/SunnyBagal/recall-seeded/pull/1) | s15 | C | 13.5 s |
| [recall#5](https://github.com/SunnyBagal/recall-seeded/pull/5) | s14 | C | 29.5 s |
| [recall#8](https://github.com/SunnyBagal/recall-seeded/pull/8) | s13 | X-semantic | 40.0 s |
| [recall#11](https://github.com/SunnyBagal/recall-seeded/pull/11) | s03 | X-keyed | 32.5 s |
| [recall#13](https://github.com/SunnyBagal/recall-seeded/pull/13) | s06 | C | 48.1 s |
| [recall#14](https://github.com/SunnyBagal/recall-seeded/pull/14) | s05 | C | 132.2 s |
| [recall#15](https://github.com/SunnyBagal/recall-seeded/pull/15) | s18 | X-keyed | 23.0 s |
| [linea#1](https://github.com/SunnyBagal/linea-seeded/pull/1) | s29 | D | 63.2 s |
| [linea#3](https://github.com/SunnyBagal/linea-seeded/pull/3) | s08 | C | 7.5 s |
| [linea#5](https://github.com/SunnyBagal/linea-seeded/pull/5) | s16 | C | 51.9 s |
| [linea#6](https://github.com/SunnyBagal/linea-seeded/pull/6) | s21 | X-typed | 19.0 s |
| [linea#7](https://github.com/SunnyBagal/linea-seeded/pull/7) | s02 | X-typed | 6.7 s |
| [linea#9](https://github.com/SunnyBagal/linea-seeded/pull/9) | s12 | X-keyed | 56.3 s |
| [linea#10](https://github.com/SunnyBagal/linea-seeded/pull/10) | s26 | X-semantic | 22.2 s |
| [linea#11](https://github.com/SunnyBagal/linea-seeded/pull/11) | s20 | C | 6.7 s |
| [linea#14](https://github.com/SunnyBagal/linea-seeded/pull/14) | s04 | C | 14.7 s |
| [linea#15](https://github.com/SunnyBagal/linea-seeded/pull/15) | s27 | X-keyed | 55.1 s |

8 of these 17 are controls (all 8 controls); 9 are seeded misses.

## Per seed

| Seed | Class | PR | Title | Run | Reviewer step | TraceHound output | Comments | Automatic |
|---|---|---|---|---|---|---|---|---|
| s02 | X-typed | [linea#7](https://github.com/SunnyBagal/linea-seeded/pull/7) | ui: rename submit state "loading" to "pending" | [40687355750](https://github.com/SunnyBagal/linea-seeded/actions/runs/40687355750) | 6.7 s | **no review posted** | 0 | missed |
| s11 | X-typed | [linea#4](https://github.com/SunnyBagal/linea-seeded/pull/4) | Distinguish failed op-log loads from empty boards | [40686735843](https://github.com/SunnyBagal/linea-seeded/actions/runs/40686735843) | 21.1 s | review: 0 findings (pool 0, kept 0) | 1 | missed |
| s21 | X-typed | [linea#6](https://github.com/SunnyBagal/linea-seeded/pull/6) | Add server-to-client message schemas to common types | [40687147653](https://github.com/SunnyBagal/linea-seeded/actions/runs/40687147653) | 19.0 s | **no review posted** | 0 | missed |
| s12 | X-keyed | [linea#9](https://github.com/SunnyBagal/linea-seeded/pull/9) | http: serve the op log at /rooms/:roomId/operations | [40687786942](https://github.com/SunnyBagal/linea-seeded/actions/runs/40687786942) | 56.3 s | **no review posted** | 0 | missed |
| s19 | X-keyed | [linea#12](https://github.com/SunnyBagal/linea-seeded/pull/12) | backend-common: read JWT secret from AUTH_JWT_SECRET | [40688423483](https://github.com/SunnyBagal/linea-seeded/actions/runs/40688423483) | 17.9 s | review: 0 findings (pool 0, kept 0) | 1 | **caught** |
| s27 | X-keyed | [linea#15](https://github.com/SunnyBagal/linea-seeded/pull/15) | ws: namespace per-socket replies as op:ack / op:error | [40689070921](https://github.com/SunnyBagal/linea-seeded/actions/runs/40689070921) | 55.1 s | **no review posted** | 0 | missed |
| s01 | X-semantic | [linea#13](https://github.com/SunnyBagal/linea-seeded/pull/13) | useSocket: make reconnect behaviour configurable | [40688639773](https://github.com/SunnyBagal/linea-seeded/actions/runs/40688639773) | 49.0 s | review: 1 findings (pool 3, kept 1) | 2 | missed |
| s26 | X-semantic | [linea#10](https://github.com/SunnyBagal/linea-seeded/pull/10) | canvas: express zoom limits in percent and add zoom presets | [40687997127](https://github.com/SunnyBagal/linea-seeded/actions/runs/40687997127) | 22.2 s | **no review posted** | 0 | missed |
| s22 | D | [linea#2](https://github.com/SunnyBagal/linea-seeded/pull/2) | canvas: share polyline segment iteration | [40686323049](https://github.com/SunnyBagal/linea-seeded/actions/runs/40686323049) | 12.5 s | review: 1 findings (pool 1, kept 1) | 2 | **caught** |
| s23 | D | [linea#8](https://github.com/SunnyBagal/linea-seeded/pull/8) | http: add DELETE /room/:slug for room admins | [40687571514](https://github.com/SunnyBagal/linea-seeded/actions/runs/40687571514) | 17.1 s | review: 1 findings (pool 1, kept 1) | 2 | **caught** |
| s29 | D | [linea#1](https://github.com/SunnyBagal/linea-seeded/pull/1) | canvas: deselect when another user edits the selected shape | [40689159837](https://github.com/SunnyBagal/linea-seeded/actions/runs/40689159837) | 63.2 s | **no review posted** | 0 | missed |
| s04 | C | [linea#14](https://github.com/SunnyBagal/linea-seeded/pull/14) | canvas: hide the background grid while viewing history | [40688852319](https://github.com/SunnyBagal/linea-seeded/actions/runs/40688852319) | 14.7 s | **no review posted** | 0 | control |
| s08 | C | [linea#3](https://github.com/SunnyBagal/linea-seeded/pull/3) | web: move useSocket next to the other client libs | [40686530194](https://github.com/SunnyBagal/linea-seeded/actions/runs/40686530194) | 7.5 s | **no review posted** | 0 | control |
| s16 | C | [linea#5](https://github.com/SunnyBagal/linea-seeded/pull/5) | ws: send chat broadcasts as chat_message with a timestamp | [40686936280](https://github.com/SunnyBagal/linea-seeded/actions/runs/40686936280) | 51.9 s | **no review posted** | 0 | control |
| s20 | C | [linea#11](https://github.com/SunnyBagal/linea-seeded/pull/11) | canvas: rename stateAtSeq to shapesAtSeq | [40688207488](https://github.com/SunnyBagal/linea-seeded/actions/runs/40688207488) | 6.7 s | **no review posted** | 0 | control |
| s07 | X-typed | [recall#3](https://github.com/SunnyBagal/recall-seeded/pull/3) | Return null from generateSummaryAndTags when the reply can't be parsed | [40578336320](https://github.com/SunnyBagal/recall-seeded/actions/runs/40578336320) | 91.3 s | review: 1 findings (pool 1, kept 1) | 2 | **caught** |
| s24 | X-typed | [recall#6](https://github.com/SunnyBagal/recall-seeded/pull/6) | Card: replace readOnly flag with a variant prop | [40579026923](https://github.com/SunnyBagal/recall-seeded/actions/runs/40579026923) | 78.0 s | review: 0 findings (pool 0, kept 0) | 1 | **caught** |
| s25 | X-typed | [recall#2](https://github.com/SunnyBagal/recall-seeded/pull/2) | Make text extraction cancellable | [40564970734](https://github.com/SunnyBagal/recall-seeded/actions/runs/40564970734) | 182.7 s | review: 0 findings (pool 1, kept 0) | 1 | missed |
| s03 | X-keyed | [recall#11](https://github.com/SunnyBagal/recall-seeded/pull/11) | Store queue data under a dedicated Redis key prefix | [40580166130](https://github.com/SunnyBagal/recall-seeded/actions/runs/40580166130) | 32.5 s | **no review posted** | 0 | missed |
| s18 | X-keyed | [recall#15](https://github.com/SunnyBagal/recall-seeded/pull/15) | Namespace the auth token in localStorage | [40581071148](https://github.com/SunnyBagal/recall-seeded/actions/runs/40581071148) | 23.0 s | **no review posted** | 0 | missed |
| s30 | X-keyed | [recall#7](https://github.com/SunnyBagal/recall-seeded/pull/7) | Move search under /api/v1/content/search | [40579258953](https://github.com/SunnyBagal/recall-seeded/actions/runs/40579258953) | 44.7 s | review: 0 findings (pool 0, kept 0) | 1 | **caught** |
| s13 | X-semantic | [recall#8](https://github.com/SunnyBagal/recall-seeded/pull/8) | Document hybridSearch parameters and lead with the query | [40579492464](https://github.com/SunnyBagal/recall-seeded/actions/runs/40579492464) | 40.0 s | **no review posted** | 0 | missed |
| s17 | X-semantic | [recall#12](https://github.com/SunnyBagal/recall-seeded/pull/12) | Report embedding API failures instead of returning null | [40580392396](https://github.com/SunnyBagal/recall-seeded/actions/runs/40580392396) | 121.1 s | review: 1 findings (pool 1, kept 1) | 2 | missed |
| s09 | D | [recall#10](https://github.com/SunnyBagal/recall-seeded/pull/10) | Search: accept an optional limit parameter | [40579937867](https://github.com/SunnyBagal/recall-seeded/actions/runs/40579937867) | 19.6 s | review: 1 findings (pool 1, kept 1) | 2 | **caught** |
| s10 | D | [recall#4](https://github.com/SunnyBagal/recall-seeded/pull/4) | Return the existing card when a saved link is added again | [40578555069](https://github.com/SunnyBagal/recall-seeded/actions/runs/40578555069) | 153.3 s | review: 1 findings (pool 1, kept 1) | 2 | **caught** |
| s28 | D | [recall#9](https://github.com/SunnyBagal/recall-seeded/pull/9) | Ask AI: render bold, inline code and citations in answers | [40579722688](https://github.com/SunnyBagal/recall-seeded/actions/runs/40579722688) | 59.0 s | review: 1 findings (pool 1, kept 1) | 2 | **caught** |
| s05 | C | [recall#14](https://github.com/SunnyBagal/recall-seeded/pull/14) | Clear the search box with Escape | [40580844173](https://github.com/SunnyBagal/recall-seeded/actions/runs/40580844173) | 132.2 s | **no review posted** | 0 | control |
| s06 | C | [recall#13](https://github.com/SunnyBagal/recall-seeded/pull/13) | Share the chat context column list between both lookups | [40580612482](https://github.com/SunnyBagal/recall-seeded/actions/runs/40580612482) | 48.1 s | **no review posted** | 0 | control |
| s14 | C | [recall#5](https://github.com/SunnyBagal/recall-seeded/pull/5) | Let callers set the metadata fetch timeout | [40578790945](https://github.com/SunnyBagal/recall-seeded/actions/runs/40578790945) | 29.5 s | **no review posted** | 0 | control |
| s15 | C | [recall#1](https://github.com/SunnyBagal/recall-seeded/pull/1) | Chat stream: rename the citations event to sources | [40556700220](https://github.com/SunnyBagal/recall-seeded/actions/runs/40556700220) | 13.5 s | **no review posted** | 0 | control |

## Automatic matches

| Seed | Where | What TraceHound said (excerpt) |
|---|---|---|
| s07 X-typed | [inline `aiProcessor.ts:17`](https://github.com/SunnyBagal/recall-seeded/pull/3#discussion_r4393788774) | return type now includes `null`, but callers such as `repair-blocked-metadata.ts` dereference the result directly |
| s19 X-keyed | [review, dependents section](https://github.com/SunnyBagal/linea-seeded/pull/12#pullrequestreview-5682596489) | all six accept files "still use the env var `JWT_SECRET`, which this pull request renamed to `AUTH_JWT_SECRET`" |
| s24 X-typed | [review, dependents section](https://github.com/SunnyBagal/recall-seeded/pull/6#pullrequestreview-5673929237) | `recall-frontend/src/pages/shared.tsx:81`: TS2322 |
| s30 X-keyed | [review, dependents section](https://github.com/SunnyBagal/recall-seeded/pull/7#pullrequestreview-5673943375) | `useSearch.ts:8` "still uses the HTTP route `/api/v1/search`, which this pull request renamed to `/api/v1/content/search`" |
| s09 D | [inline `index.ts:320`](https://github.com/SunnyBagal/recall-seeded/pull/10#discussion_r4393893728) | range check uses `&&` instead of `\|\|`, so out-of-range limits pass |
| s10 D | [inline `index.ts:130`](https://github.com/SunnyBagal/recall-seeded/pull/4#discussion_r4393814033) | non-atomic existence check, then insert (check-then-act) |
| s22 D | [inline `canvas.ts:356`](https://github.com/SunnyBagal/linea-seeded/pull/2#discussion_r4400416460) | loop bound lets `i` reach the last index; `points[i + 1]` is undefined |
| s23 D | [inline `http-backend/src/index.ts:293`](https://github.com/SunnyBagal/linea-seeded/pull/8#discussion_r4400501917) | `adminId` in the `where` of a singular `prisma.room.delete` |
| s28 D | [inline `AskAIPanel.tsx:276`](https://github.com/SunnyBagal/recall-seeded/pull/9#discussion_r4393884635) | AI answer rendered through `dangerouslySetInnerHTML` with raw content interpolated |

## Candidates for Sunny's manual calls (not counted)

The automatic X rule needs `brokenSymbolOrKey` in the comment text. In these two
reviews, the dependents section names the exact accept file and line with the
compiler error, but not the symbol:

- **s11** X-typed ([review](https://github.com/SunnyBagal/linea-seeded/pull/4#pullrequestreview-5682447868)): `CanvasBoard.tsx:271` TS2488 and `:272` TS2345, `CanvasOp[] | null`. Accept is `CanvasBoard.tsx:270-272`; key is `fetchOperations`, not in the text.
- **s25** X-typed ([review](https://github.com/SunnyBagal/recall-seeded/pull/2#pullrequestreview-5672749349)): `worker.ts:44` and `repair-blocked-metadata.ts:117`, TS2554 "Expected 5 arguments, but got 4". Both accept ranges match; key is `extractText`, not in the text.

TraceHound also commented on the edited file in two X-semantic seeds without
naming an affected caller. These look like misses, but the call is Sunny's:
- s01: [inline `useSocket.ts:37`](https://github.com/SunnyBagal/linea-seeded/pull/13#discussion_r4400578606), about `loading` state when `reconnect` is false.
- s17: [inline `embeddings.ts:44`](https://github.com/SunnyBagal/recall-seeded/pull/12#discussion_r4393941950), about parsing outside the try/catch.

## Deviations from the 19 Oct plan

1. **CodeRabbit, Greptile and Bugbot were not run.** This is a TraceHound-only
   run, so their rows in `raw/score-output.md` are 0 by construction, not
   results.
2. **TraceHound version.** It ran at review-freeze-2 on Nemotron-3.5-Super-VL
   (not 3 Super, which the 19 Oct plan assumed). Linea ran review-freeze-2.1
   (`86fd5d7`, install-step fix only; review code identical per decision 072)
   because the Action at `0aeef06` cannot install on Linea.
3. **Linea seeds opened after the Action fix, same order otherwise.** Recall's
   15 PRs opened 27 Oct 18:05–20:46 UTC. Linea#1 (s29) opened 27 Oct 18:57;
   the other 14 opened 28 Oct 12:15–12:35 UTC.
4. **The open-PR script was a disclosed copy,** `runs/open-prs-seed01a.sh`.
   Its changes, listed in its header:
   - (a) no `@coderabbitai review` comment;
   - (b) 90 s between PRs instead of 450 s;
   - (c) `cd` to the repo root (the copy lives in `runs/`);
   - (d) an `ONLY_REPO` filter, used to open Recall first and Linea later.
   
   Branches, titles, bodies and the `SHUFFLE_SEED` order are unchanged. Gate
   checks were run by stopping the script after the first PR, then resuming
   it. Log: `raw/opened-prs.tsv`.
5. **linea-seeded#1 had extra triggers and one PR edit.**
   - Its first run and its rerun failed at install (0aeef06).
   - A draft/ready toggle after the repin still ran 0aeef06, because the PR's
     test-merge commit was stale.
   - Its base was then re-set to `main` once (`PATCH base=main`, no content
     change; 28 Oct 12:35:52 UTC). The merge commit rebuilt onto `6d8771a`.
   - A second draft/ready toggle (12:36:08 UTC) produced the scored run on 86fd5d7.
6. **A third-party reviewer app (Devin Review) was installed account-wide.** It
   auto-reviewed the first 3 seeded PRs (recall#1, recall#2, linea#1: 1 review
   and 1 inline comment each). It was removed before the rest opened. Its
   comments are left in place and are not scored (the scorer counts
   `github-actions[bot]` only). No other bot commented on any PR.
7. **First-PR gate.** The runbook expected the first PR to show a review
   header. recall#1 (s15, a control) posted no review, so the gate was widened
   to 3 PRs; recall#2 confirmed the header.
8. **Nebius spend** is not shown in the run logs and is not reported here.

## Reproduce

```sh
bun score.ts --fixtures raw                      # offline, from the snapshot in raw/
GITHUB_TOKEN=... bun score.ts                    # live; identical output on 28 Oct
```

`raw/` holds:
- `collect.sh` (the snapshot script);
- one JSON per PR (all three comment endpoints, every author);
- `prs.tsv`, `opened-prs.tsv`, `runs-*.json`, `reviewer-durations.txt`;
- the scorer's full output, overall and per mirror. The per-mirror runs use
  the same scorer with `--key` set to that mirror's subset of `key.json`.
