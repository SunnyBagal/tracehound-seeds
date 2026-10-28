Logins used:
  TraceHound github-actions[bot]  (default)
  CodeRabbit coderabbitai[bot]  (default)
  Greptile   greptile-apps[bot]  (default)
  Bugbot     cursor[bot]  (default)
Manual calls: 0   Control marks: 0

## Caught / n

| tool       | class      | n  | automatic | manual | auto + manual |
|------------|------------|----|-----------|--------|---------------|
| TraceHound | X-typed    | 3  | 2/3       | +0     | 2/3           |
| TraceHound | X-keyed    | 3  | 1/3       | +0     | 1/3           |
| TraceHound | X-semantic | 2  | 0/2       | +0     | 0/2           |
| TraceHound | all X      | 8  | 3/8       | +0     | 3/8           |
| TraceHound | D          | 3  | 3/3       | +0     | 3/3           |
| TraceHound | all seeded | 11 | 6/11      | +0     | 6/11          |
| CodeRabbit | X-typed    | 3  | 0/3       | +0     | 0/3           |
| CodeRabbit | X-keyed    | 3  | 0/3       | +0     | 0/3           |
| CodeRabbit | X-semantic | 2  | 0/2       | +0     | 0/2           |
| CodeRabbit | all X      | 8  | 0/8       | +0     | 0/8           |
| CodeRabbit | D          | 3  | 0/3       | +0     | 0/3           |
| CodeRabbit | all seeded | 11 | 0/11      | +0     | 0/11          |
| Greptile   | X-typed    | 3  | 0/3       | +0     | 0/3           |
| Greptile   | X-keyed    | 3  | 0/3       | +0     | 0/3           |
| Greptile   | X-semantic | 2  | 0/2       | +0     | 0/2           |
| Greptile   | all X      | 8  | 0/8       | +0     | 0/8           |
| Greptile   | D          | 3  | 0/3       | +0     | 0/3           |
| Greptile   | all seeded | 11 | 0/11      | +0     | 0/11          |
| Bugbot     | X-typed    | 3  | 0/3       | +0     | 0/3           |
| Bugbot     | X-keyed    | 3  | 0/3       | +0     | 0/3           |
| Bugbot     | X-semantic | 2  | 0/2       | +0     | 0/2           |
| Bugbot     | all X      | 8  | 0/8       | +0     | 0/8           |
| Bugbot     | D          | 3  | 0/3       | +0     | 0/3           |
| Bugbot     | all seeded | 11 | 0/11      | +0     | 0/11          |

`manual` = seeds caught only by a manual call (the automatic rule missed them).

## Per seed (A = automatic, M = manual, - = missed)

- s03 X-keyed #11: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s07 X-typed #3: TraceHound A  CodeRabbit -  Greptile -  Bugbot -
- s09 D #10: TraceHound A  CodeRabbit -  Greptile -  Bugbot -
- s10 D #4: TraceHound A  CodeRabbit -  Greptile -  Bugbot -
- s13 X-semantic #8: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s17 X-semantic #12: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s18 X-keyed #15: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s24 X-typed #6: TraceHound A  CodeRabbit -  Greptile -  Bugbot -
- s25 X-typed #2: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s28 D #9: TraceHound A  CodeRabbit -  Greptile -  Bugbot -
- s30 X-keyed #7: TraceHound A  CodeRabbit -  Greptile -  Bugbot -

## Automatic matches

- s07 TraceHound [inline recall-backend/services/aiProcessor.ts:17] https://github.com/SunnyBagal/recall-seeded/pull/3#discussion_r4393788774
  > The return type now includes `null`, but existing callers such as `repair-blocked-metadata.ts` dereference the result directly (`ai.summary`, `ai.tags`) without
- s09 TraceHound [inline recall-backend/index.ts:320] https://github.com/SunnyBagal/recall-seeded/pull/10#discussion_r4393893728
  > The range check uses `&&` instead of `||`, so `limit < 1 && limit > 10` is always false. Values outside 1–10 (e.g. 0, negative, 100) pass validation and are sil
- s10 TraceHound [inline recall-backend/index.ts:130] https://github.com/SunnyBagal/recall-seeded/pull/4#discussion_r4393814033
  > The handler performs a non-atomic existence check (SELECT for a matching userId/link) and then, when nothing is found, continues to fetch metadata and insert a 
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

s05 #14: TraceHound 0, CodeRabbit 0, Greptile 0, Bugbot 0

s06 #13: TraceHound 0, CodeRabbit 0, Greptile 0, Bugbot 0

s14 #5: TraceHound 0, CodeRabbit 0, Greptile 0, Bugbot 0

s15 #1: TraceHound 0, CodeRabbit 0, Greptile 0, Bugbot 0

## Extra comments on seeded PRs (not satisfying the automatic rule)

| tool       | extra comments |
|------------|----------------|
| TraceHound | 7              |
| CodeRabbit | 0              |
| Greptile   | 0              |
| Bugbot     | 0              |
- s07 TraceHound [review] https://github.com/SunnyBagal/recall-seeded/pull/3#pullrequestreview-5673869854
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 1 findings (pool 1, kept 1) These comments are model-generated and unverified. ## Files you didn't 
- s09 TraceHound [review] https://github.com/SunnyBagal/recall-seeded/pull/10#pullrequestreview-5674003456
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 1 findings (pool 1, kept 1) These comments are model-generated and unverified. <!-- tracehound:v1 {
- s10 TraceHound [review] https://github.com/SunnyBagal/recall-seeded/pull/4#pullrequestreview-5673901730
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 1 findings (pool 1, kept 1) These comments are model-generated and unverified. <!-- tracehound:v1 {
- s17 TraceHound [inline recall-backend/services/embeddings.ts:44] https://github.com/SunnyBagal/recall-seeded/pull/12#discussion_r4393941950
  > The response status check, body reading, JSON parsing, and result extraction (lines 44–50) are outside the try/catch, which only wraps fetch. If the error body 
- s17 TraceHound [review] https://github.com/SunnyBagal/recall-seeded/pull/12#pullrequestreview-5674064001
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 1 findings (pool 1, kept 1) These comments are model-generated and unverified. <!-- tracehound:v1 {
- s25 TraceHound [review] https://github.com/SunnyBagal/recall-seeded/pull/2#pullrequestreview-5672749349
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 0 findings (pool 1, kept 0) These comments are model-generated and unverified. ## Files you didn't 
- s28 TraceHound [review] https://github.com/SunnyBagal/recall-seeded/pull/9#pullrequestreview-5673991775
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 1 findings (pool 1, kept 1) These comments are model-generated and unverified. <!-- tracehound:v1 {
