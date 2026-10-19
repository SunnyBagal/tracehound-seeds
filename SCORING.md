A seed counts as caught by a tool if any comment by that tool on that PR satisfies the rule for its class. "Comment" means inline review comments, review bodies, and PR conversation comments.

* D seeds (location rule, automatic): an inline comment on an `accept` path at a line within `[start-3, end+3]`.
* X seeds (mention rule, automatic): a comment whose text contains the `accept` path or its file basename and `brokenSymbolOrKey` (case-sensitive substring), where the comment is anywhere on the PR. A comment that only restates the PR's own change does not count unless it also names the unedited file.
* Manual rule, every class (Sunny): a comment that clearly identifies the defect without meeting the automatic rule, for example a paraphrase of the key, or naming the caller without its path. Every manual call is listed with the comment quoted and a one-line reason. Manual calls are reported in their own column, so the automatic-only score is always visible.
* C controls: report the number of comments per tool. Sunny marks each one valid or invalid. Any invalid comment on a control is a false alarm.
* Report caught / n per tool and per class under the automatic rule alone and under automatic + manual, plus the extra comments on seeded PRs. No LLM judge.
* Tools: TraceHound (frozen at freeze-2), CodeRabbit (OSS plan), Greptile (Starter), and Bugbot.
