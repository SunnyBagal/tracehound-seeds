Logins used:
  TraceHound github-actions[bot]  (default)
  CodeRabbit coderabbitai[bot]  (default)
  Greptile   greptile-apps[bot]  (default)
  Bugbot     cursor[bot]  (default)
Manual calls: 0   Control marks: 0

## Caught / n

| tool       | class      | n  | automatic | manual | auto + manual |
|------------|------------|----|-----------|--------|---------------|
| TraceHound | X-typed    | 6  | 2/6       | +0     | 2/6           |
| TraceHound | X-keyed    | 6  | 2/6       | +0     | 2/6           |
| TraceHound | X-semantic | 4  | 0/4       | +0     | 0/4           |
| TraceHound | all X      | 16 | 4/16      | +0     | 4/16          |
| TraceHound | D          | 6  | 5/6       | +0     | 5/6           |
| TraceHound | all seeded | 22 | 9/22      | +0     | 9/22          |
| CodeRabbit | X-typed    | 6  | 0/6       | +0     | 0/6           |
| CodeRabbit | X-keyed    | 6  | 0/6       | +0     | 0/6           |
| CodeRabbit | X-semantic | 4  | 0/4       | +0     | 0/4           |
| CodeRabbit | all X      | 16 | 0/16      | +0     | 0/16          |
| CodeRabbit | D          | 6  | 0/6       | +0     | 0/6           |
| CodeRabbit | all seeded | 22 | 0/22      | +0     | 0/22          |
| Greptile   | X-typed    | 6  | 0/6       | +0     | 0/6           |
| Greptile   | X-keyed    | 6  | 0/6       | +0     | 0/6           |
| Greptile   | X-semantic | 4  | 0/4       | +0     | 0/4           |
| Greptile   | all X      | 16 | 0/16      | +0     | 0/16          |
| Greptile   | D          | 6  | 0/6       | +0     | 0/6           |
| Greptile   | all seeded | 22 | 0/22      | +0     | 0/22          |
| Bugbot     | X-typed    | 6  | 0/6       | +0     | 0/6           |
| Bugbot     | X-keyed    | 6  | 0/6       | +0     | 0/6           |
| Bugbot     | X-semantic | 4  | 0/4       | +0     | 0/4           |
| Bugbot     | all X      | 16 | 0/16      | +0     | 0/16          |
| Bugbot     | D          | 6  | 0/6       | +0     | 0/6           |
| Bugbot     | all seeded | 22 | 0/22      | +0     | 0/22          |

`manual` = seeds caught only by a manual call (the automatic rule missed them).

## Per seed (A = automatic, M = manual, - = missed)

- s01 X-semantic #13: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s02 X-typed #7: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s03 X-keyed #11: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s07 X-typed #3: TraceHound A  CodeRabbit -  Greptile -  Bugbot -
- s09 D #10: TraceHound A  CodeRabbit -  Greptile -  Bugbot -
- s10 D #4: TraceHound A  CodeRabbit -  Greptile -  Bugbot -
- s11 X-typed #4: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s12 X-keyed #9: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s13 X-semantic #8: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s17 X-semantic #12: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s18 X-keyed #15: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s19 X-keyed #12: TraceHound A  CodeRabbit -  Greptile -  Bugbot -
- s21 X-typed #6: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s22 D #2: TraceHound A  CodeRabbit -  Greptile -  Bugbot -
- s23 D #8: TraceHound A  CodeRabbit -  Greptile -  Bugbot -
- s24 X-typed #6: TraceHound A  CodeRabbit -  Greptile -  Bugbot -
- s25 X-typed #2: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s26 X-semantic #10: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s27 X-keyed #15: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s28 D #9: TraceHound A  CodeRabbit -  Greptile -  Bugbot -
- s29 D #1: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s30 X-keyed #7: TraceHound A  CodeRabbit -  Greptile -  Bugbot -

## Automatic matches

- s07 TraceHound [inline recall-backend/services/aiProcessor.ts:17] https://github.com/SunnyBagal/recall-seeded/pull/3#discussion_r4393788774
  > The return type now includes `null`, but existing callers such as `repair-blocked-metadata.ts` dereference the result directly (`ai.summary`, `ai.tags`) without
- s09 TraceHound [inline recall-backend/index.ts:320] https://github.com/SunnyBagal/recall-seeded/pull/10#discussion_r4393893728
  > The range check uses `&&` instead of `||`, so `limit < 1 && limit > 10` is always false. Values outside 1–10 (e.g. 0, negative, 100) pass validation and are sil
- s10 TraceHound [inline recall-backend/index.ts:130] https://github.com/SunnyBagal/recall-seeded/pull/4#discussion_r4393814033
  > The handler performs a non-atomic existence check (SELECT for a matching userId/link) and then, when nothing is found, continues to fetch metadata and insert a 
- s19 TraceHound [review] https://github.com/SunnyBagal/linea-seeded/pull/12#pullrequestreview-5682596489
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 0 findings (pool 0, kept 0) These comments are model-generated and unverified. ## Files you didn't 
- s22 TraceHound [inline apps/web/lib/canvas/canvas.ts:356] https://github.com/SunnyBagal/linea-seeded/pull/2#discussion_r4400416460
  > The loop condition `i < points.length` lets `i` reach the last index, where `points[i + 1]` is `undefined`. The `!` assertion hides the type error, but at runti
- s23 TraceHound [inline apps/http-backend/src/index.ts:293] https://github.com/SunnyBagal/linea-seeded/pull/8#discussion_r4400501917
  > prisma.room.delete({ where: { slug, adminId } }) passes adminId in the where of a singular delete. Prisma requires the where argument of delete/findUnique/updat
- s24 TraceHound [review] https://github.com/SunnyBagal/recall-seeded/pull/6#pullrequestreview-5673929237
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 0 findings (pool 0, kept 0) These comments are model-generated and unverified. ## Files you didn't 
- s28 TraceHound [inline recall-frontend/src/components/AskAIPanel.tsx:276] https://github.com/SunnyBagal/recall-seeded/pull/9#discussion_r4393884635
  > MessageContent renders AI answer content through dangerouslySetInnerHTML using HTML produced by formatMessage. formatMessage interpolates the raw content into H
- s30 TraceHound [review] https://github.com/SunnyBagal/recall-seeded/pull/7#pullrequestreview-5673943375
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 0 findings (pool 0, kept 0) These comments are model-generated and unverified. ## Files you didn't 

## Manual calls

(none)

## C controls (any invalid comment is a false alarm)

| tool       | comments | valid | invalid (false alarms) | unmarked |
|------------|----------|-------|------------------------|----------|
| TraceHound | 0        | 0     | 0                      | 0        |
| CodeRabbit | 0        | 0     | 0                      | 0        |
| Greptile   | 0        | 0     | 0                      | 0        |
| Bugbot     | 0        | 0     | 0                      | 0        |

s04 #14: TraceHound 0, CodeRabbit 0, Greptile 0, Bugbot 0

s05 #14: TraceHound 0, CodeRabbit 0, Greptile 0, Bugbot 0

s06 #13: TraceHound 0, CodeRabbit 0, Greptile 0, Bugbot 0

s08 #3: TraceHound 0, CodeRabbit 0, Greptile 0, Bugbot 0

s14 #5: TraceHound 0, CodeRabbit 0, Greptile 0, Bugbot 0

s15 #1: TraceHound 0, CodeRabbit 0, Greptile 0, Bugbot 0

s16 #5: TraceHound 0, CodeRabbit 0, Greptile 0, Bugbot 0

s20 #11: TraceHound 0, CodeRabbit 0, Greptile 0, Bugbot 0

## Extra comments on seeded PRs (not satisfying the automatic rule)

| tool       | extra comments |
|------------|----------------|
| TraceHound | 12             |
| CodeRabbit | 0              |
| Greptile   | 0              |
| Bugbot     | 0              |
- s01 TraceHound [inline apps/web/hooks/useSocket.ts:37] https://github.com/SunnyBagal/linea-seeded/pull/13#discussion_r4400578606
  > When `reconnect` is `false` and the socket closes (not closed by us), the handler returns before calling `setLoading(true)`, leaving `loading` in a stale state.
- s01 TraceHound [review] https://github.com/SunnyBagal/linea-seeded/pull/13#pullrequestreview-5682624658
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 1 findings (pool 3, kept 1) These comments are model-generated and unverified. <!-- tracehound:v1 {
- s07 TraceHound [review] https://github.com/SunnyBagal/recall-seeded/pull/3#pullrequestreview-5673869854
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 1 findings (pool 1, kept 1) These comments are model-generated and unverified. ## Files you didn't 
- s09 TraceHound [review] https://github.com/SunnyBagal/recall-seeded/pull/10#pullrequestreview-5674003456
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 1 findings (pool 1, kept 1) These comments are model-generated and unverified. <!-- tracehound:v1 {
- s10 TraceHound [review] https://github.com/SunnyBagal/recall-seeded/pull/4#pullrequestreview-5673901730
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 1 findings (pool 1, kept 1) These comments are model-generated and unverified. <!-- tracehound:v1 {
- s11 TraceHound [review] https://github.com/SunnyBagal/linea-seeded/pull/4#pullrequestreview-5682447868
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 0 findings (pool 0, kept 0) These comments are model-generated and unverified. ## Files you didn't 
- s17 TraceHound [inline recall-backend/services/embeddings.ts:44] https://github.com/SunnyBagal/recall-seeded/pull/12#discussion_r4393941950
  > The response status check, body reading, JSON parsing, and result extraction (lines 44–50) are outside the try/catch, which only wraps fetch. If the error body 
- s17 TraceHound [review] https://github.com/SunnyBagal/recall-seeded/pull/12#pullrequestreview-5674064001
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 1 findings (pool 1, kept 1) These comments are model-generated and unverified. <!-- tracehound:v1 {
- s22 TraceHound [review] https://github.com/SunnyBagal/linea-seeded/pull/2#pullrequestreview-5682412780
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 1 findings (pool 1, kept 1) These comments are model-generated and unverified. <!-- tracehound:v1 {
- s23 TraceHound [review] https://github.com/SunnyBagal/linea-seeded/pull/8#pullrequestreview-5682522863
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 1 findings (pool 1, kept 1) These comments are model-generated and unverified. <!-- tracehound:v1 {
- s25 TraceHound [review] https://github.com/SunnyBagal/recall-seeded/pull/2#pullrequestreview-5672749349
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 0 findings (pool 1, kept 0) These comments are model-generated and unverified. ## Files you didn't 
- s28 TraceHound [review] https://github.com/SunnyBagal/recall-seeded/pull/9#pullrequestreview-5673991775
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 1 findings (pool 1, kept 1) These comments are model-generated and unverified. <!-- tracehound:v1 {
