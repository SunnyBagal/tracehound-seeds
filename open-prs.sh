#!/usr/bin/env bash
# Opens one pull request per entry in key.json on the public mirrors, in a
# shuffled order fixed by SHUFFLE_SEED below.
#
# Run this yourself, from your own GitHub account, once Greptile, Bugbot and
# TraceHound are installed on both mirrors. Bugbot only reviews PRs authored by
# the account it is linked to, so the PRs must not be opened by anyone else.
#
#   ./open-prs.sh --dry-run   # print the order and the commands, open nothing
#   ./open-prs.sh             # open the PRs
#
# Needs: gh (logged in as SunnyBagal), node. Already-open PRs for a branch are
# skipped, so the script can be re-run after an interruption. Every PR opened
# is appended to opened-prs.tsv.

set -euo pipefail

SHUFFLE_SEED=20261025   # recorded: the order below is a pure function of this
EXPECTED_LOGIN="SunnyBagal"
DELAY_SECONDS=20        # spacing between PRs, to stay clear of GitHub's secondary rate limits

cd "$(dirname "$0")"

DRY_RUN=0
if [ "${1:-}" = "--dry-run" ]; then DRY_RUN=1; fi

# id<TAB>repo<TAB>branch, in key.json order (s01..s30)
ids=(); repos=(); branches=()
while IFS=$'\t' read -r id repo branch; do
  ids+=("$id"); repos+=("$repo"); branches+=("$branch")
done < <(node -e '
  const key = JSON.parse(require("fs").readFileSync("key.json", "utf8"));
  key.sort((a, b) => a.id.localeCompare(b.id));
  for (const s of key) console.log([s.id, s.repo, s.branch].join("\t"));
')
n=${#ids[@]}

# Fisher-Yates shuffle driven by a 31-bit LCG, so the order is the same on any
# machine and any bash version (including macOS's bash 3.2).
order=(); for ((i = 0; i < n; i++)); do order+=("$i"); done
state=$SHUFFLE_SEED
for ((i = n - 1; i > 0; i--)); do
  state=$(( (state * 1103515245 + 12345) % 2147483648 ))
  j=$(( state % (i + 1) ))
  tmp=${order[$i]}; order[$i]=${order[$j]}; order[$j]=$tmp
done

echo "Opening $n PRs in this order (SHUFFLE_SEED=$SHUFFLE_SEED):"
for ((k = 0; k < n; k++)); do
  i=${order[$k]}
  printf '  %2d. %s  %s  %s\n' "$((k + 1))" "${ids[$i]}" "${repos[$i]}" "${branches[$i]}"
done
echo

if [ "$DRY_RUN" -eq 0 ]; then
  login=$(gh api user --jq .login)
  if [ "$login" != "$EXPECTED_LOGIN" ]; then
    echo "gh is logged in as '$login', expected '$EXPECTED_LOGIN'. Aborting." >&2
    exit 1
  fi
fi

body_file=$(mktemp)
trap 'rm -f "$body_file"' EXIT

for ((k = 0; k < n; k++)); do
  i=${order[$k]}
  id=${ids[$i]}; repo=${repos[$i]}; branch=${branches[$i]}
  pr="prs/$id.md"
  title=$(head -n 1 "$pr")
  tail -n +3 "$pr" > "$body_file"   # line 1 is the title, line 2 is blank

  if [ "$DRY_RUN" -eq 1 ]; then
    echo "gh pr create --repo $repo --head $branch --base main --title \"$title\" --body-file $pr (minus its title line)"
    continue
  fi

  if ! git ls-remote --exit-code --heads "https://github.com/$repo.git" "$branch" >/dev/null; then
    echo "[$id] branch $branch not found on $repo. Aborting." >&2
    exit 1
  fi
  existing=$(gh pr list --repo "$repo" --head "$branch" --state all --json url --jq '.[0].url // ""')
  if [ -n "$existing" ]; then
    echo "[$id] already open: $existing (skipped)"
    continue
  fi

  url=$(gh pr create --repo "$repo" --head "$branch" --base main --title "$title" --body-file "$body_file")
  printf '%s\t%s\t%s\t%s\t%s\n' "$id" "$repo" "$branch" "$url" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> opened-prs.tsv
  echo "[$id] $url"
  if [ "$k" -lt $((n - 1)) ]; then sleep "$DELAY_SECONDS"; fi
done
