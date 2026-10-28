#!/usr/bin/env bash
# raw/collect.sh: snapshot every seeded PR's comments for seed-01.
#
# For each seed in key.json, writes raw/<mirror>/<branch with "/" -> "__">.json
# holding {number, reviewComments, reviews, issueComments}: the full,
# unfiltered responses of pulls/{n}/comments, pulls/{n}/reviews and
# issues/{n}/comments (every author, not only TraceHound). That is the PrData
# shape score.ts reads with --fixtures, so the scoring can be re-run offline:
#
#   bun score.ts --fixtures raw
#
# Also writes raw/runs-<mirror>.json (every TraceHound workflow run) and
# raw/prs.tsv (id, class, repo, branch, PR URL).
#
# Needs: gh (read access to both mirrors), jq, node.
set -euo pipefail
cd "$(dirname "$0")/.."

: > raw/prs.tsv
node -e '
  const key = JSON.parse(require("fs").readFileSync("key.json", "utf8"));
  key.sort((a, b) => a.id.localeCompare(b.id));
  for (const s of key) console.log([s.id, s.class, s.repo, s.branch].join("\t"));
' | while IFS=$'\t' read -r id cls repo branch; do
  owner=${repo%%/*}; name=${repo#*/}
  n=$(gh api "repos/$repo/pulls?state=all&head=$owner:$branch" --jq '.[0].number // empty')
  if [ -z "$n" ]; then echo "[$id] no PR" >&2; continue; fi
  mkdir -p "raw/$name"
  get() { gh api --paginate --slurp "repos/$repo/$1" | jq 'add // []'; }
  jq -n --argjson number "$n" \
    --argjson reviewComments "$(get "pulls/$n/comments")" \
    --argjson reviews "$(get "pulls/$n/reviews")" \
    --argjson issueComments "$(get "issues/$n/comments")" \
    '{number: $number, reviewComments: $reviewComments, reviews: $reviews, issueComments: $issueComments}' \
    > "raw/$name/${branch//\//__}.json"
  printf '%s\t%s\t%s\t%s\thttps://github.com/%s/pull/%s\n' "$id" "$cls" "$repo" "$branch" "$repo" "$n" >> raw/prs.tsv
  echo "[$id] $repo#$n"
done

for repo in SunnyBagal/linea-seeded SunnyBagal/recall-seeded; do
  gh api --paginate --slurp "repos/$repo/actions/workflows/tracehound-review.yml/runs" \
    | jq '[.[].workflow_runs[] | {id, run_attempt, event, head_branch, head_sha, status, conclusion, created_at, updated_at, html_url}]' \
    > "raw/runs-${repo#*/}.json"
done
