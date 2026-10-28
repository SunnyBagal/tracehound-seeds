Logins used:
  TraceHound github-actions[bot]  (default)
  CodeRabbit coderabbitai[bot]  (default)
  Greptile   greptile-apps[bot]  (default)
  Bugbot     cursor[bot]  (default)
Manual calls: 0   Control marks: 0

## Caught / n

| tool       | class      | n  | automatic | manual | auto + manual |
|------------|------------|----|-----------|--------|---------------|
| TraceHound | X-typed    | 3  | 0/3       | +0     | 0/3           |
| TraceHound | X-keyed    | 3  | 1/3       | +0     | 1/3           |
| TraceHound | X-semantic | 2  | 0/2       | +0     | 0/2           |
| TraceHound | all X      | 8  | 1/8       | +0     | 1/8           |
| TraceHound | D          | 3  | 2/3       | +0     | 2/3           |
| TraceHound | all seeded | 11 | 3/11      | +0     | 3/11          |
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

- s01 X-semantic #13: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s02 X-typed #7: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s11 X-typed #4: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s12 X-keyed #9: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s19 X-keyed #12: TraceHound A  CodeRabbit -  Greptile -  Bugbot -
- s21 X-typed #6: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s22 D #2: TraceHound A  CodeRabbit -  Greptile -  Bugbot -
- s23 D #8: TraceHound A  CodeRabbit -  Greptile -  Bugbot -
- s26 X-semantic #10: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s27 X-keyed #15: TraceHound -  CodeRabbit -  Greptile -  Bugbot -
- s29 D #1: TraceHound -  CodeRabbit -  Greptile -  Bugbot -

## Automatic matches

- s19 TraceHound [review] https://github.com/SunnyBagal/linea-seeded/pull/12#pullrequestreview-5682596489
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 0 findings (pool 0, kept 0) These comments are model-generated and unverified. ## Files you didn't 
- s22 TraceHound [inline apps/web/lib/canvas/canvas.ts:356] https://github.com/SunnyBagal/linea-seeded/pull/2#discussion_r4400416460
  > The loop condition `i < points.length` lets `i` reach the last index, where `points[i + 1]` is `undefined`. The `!` assertion hides the type error, but at runti
- s23 TraceHound [inline apps/http-backend/src/index.ts:293] https://github.com/SunnyBagal/linea-seeded/pull/8#discussion_r4400501917
  > prisma.room.delete({ where: { slug, adminId } }) passes adminId in the where of a singular delete. Prisma requires the where argument of delete/findUnique/updat

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

s08 #3: TraceHound 0, CodeRabbit 0, Greptile 0, Bugbot 0

s16 #5: TraceHound 0, CodeRabbit 0, Greptile 0, Bugbot 0

s20 #11: TraceHound 0, CodeRabbit 0, Greptile 0, Bugbot 0

## Extra comments on seeded PRs (not satisfying the automatic rule)

| tool       | extra comments |
|------------|----------------|
| TraceHound | 5              |
| CodeRabbit | 0              |
| Greptile   | 0              |
| Bugbot     | 0              |
- s01 TraceHound [inline apps/web/hooks/useSocket.ts:37] https://github.com/SunnyBagal/linea-seeded/pull/13#discussion_r4400578606
  > When `reconnect` is `false` and the socket closes (not closed by us), the handler returns before calling `setLoading(true)`, leaving `loading` in a stale state.
- s01 TraceHound [review] https://github.com/SunnyBagal/linea-seeded/pull/13#pullrequestreview-5682624658
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 1 findings (pool 3, kept 1) These comments are model-generated and unverified. <!-- tracehound:v1 {
- s11 TraceHound [review] https://github.com/SunnyBagal/linea-seeded/pull/4#pullrequestreview-5682447868
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 0 findings (pool 0, kept 0) These comments are model-generated and unverified. ## Files you didn't 
- s22 TraceHound [review] https://github.com/SunnyBagal/linea-seeded/pull/2#pullrequestreview-5682412780
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 1 findings (pool 1, kept 1) These comments are model-generated and unverified. <!-- tracehound:v1 {
- s23 TraceHound [review] https://github.com/SunnyBagal/linea-seeded/pull/8#pullrequestreview-5682522863
  > TraceHound · pool-verify-v1 · nvidia/Nemotron-3.5-Super-VL · 1 findings (pool 1, kept 1) These comments are model-generated and unverified. <!-- tracehound:v1 {
