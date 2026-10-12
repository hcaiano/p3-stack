---
name: interrogate
description: "Use for \"interrogate\", \"adversarial review\", \"multi-model review\", \"challenge this\", \"stress test this code\", \"find blind spots\", or \"tear this apart\". Multiple LLM reviewers challenge changes from independent angles."
disable-model-invocation: true
---

# Interrogate

Read the installed poteto-mode reference `../poteto-mode/references/t3-execution.md` before selecting models or delegating. It owns named-role resolution, catalog option keys, accounts and automatic authorized missing-usage fallback.

Spawn one reviewer per configured model to adversarially review code changes. The adversarial signal comes from model diversity, not assigned personas. The deliverable is a synthesized verdict. Do NOT auto-apply changes.

## Step 1, Scope

Identify what to review from context:

- If the user points at specific files or a diff, use that.
- If on a feature branch, run `git diff main...HEAD` (or the appropriate base branch) for the full changeset.
- If the user's message references recent work, gather the relevant files.

Package the diff or file contents with any surrounding context files the reviewers need to understand the code.

## Step 2, Intent

Before spawning reviewers, state the intent in one clear paragraph from the user's message, commit messages, the PR description if one exists, and the code. If you're unsure about the intent, ask the user before proceeding.

## Step 3, Spawn Reviewers

Launch all reviewers in a single message with `delegate_task` and `mode: "async"`, one per entry on the `interrogate reviewers` line in `pstack-models.md`, labeled Reviewer A, B, and so on to match the entry count. If the file or that line is missing, use the table defaults.

| Subagent | Default model |
|----------|---------------|
| Reviewer A | `interrogate reviewers` bundled default seat 1, `xhigh` |
| Reviewer B | `interrogate reviewers` bundled default seat 2, distinct model, `xhigh` |

Each reviewer gets a read-only, self-contained brief and the target resolved from its configured entry, or its table default when there is no configured line. Resolve `auto` or `inherit-parent` to the parent model. Default reasoning is `xhigh` through live catalog option keys unless the user chooses a budget. T3 child agents get only the brief, never the parent's context. Retain task IDs, drain with `task_status`, and stop with `task_cancel`.

If `delegate_task` rejects a configured entry, run that reviewer on its family's bundled default through the execution adapter's authorized fallback and say so. Resolve families and supported option keys from `orchestrator_capabilities`. With no family match, use Reviewer A's default only when the role policy authorizes it. If a table default is unavailable, use its closest authorized equivalent from the live catalog, prefer the same family and reasoning tier, and open a separate PR to update the default table. Do not block the review on a stale catalog entry when an authorized equivalent exists. Never treat an alias entry as a rejected model or apply either fallback to it. Inspect task status and writes before retrying, retain the seat count and model diversity, and report a factual blocker when no eligible assignment remains.

Read `references/reviewer-prompt.md` and fill in the same template for every reviewer with the stated intent, the diff or file contents, the rubric from `references/rubric.md`, and the code-quality lens from `references/code-quality-review.md`.

## Step 4, Synthesize

As results come back, build a unified picture. Parse every reviewer's findings. Merge findings that describe the same issue differently, and note which models raised each one. Findings two or more models raised independently are the highest signal. Read a lone model's finding, but weight it accordingly. Note disagreements. If one model flags something and another explicitly says the opposite, that is context for the verdict.

## Step 5, Lead Judgment

You are the lead reviewer, a pragmatic senior engineer, not a neutral aggregator. Read `references/lead-judgment.md` for the full framework. Put every finding in one of four buckets, with the model(s) that raised it and a one-line rationale.

- **Act on**. Real issues affecting correctness, security, or maintainability given the actual goals. They would block a real PR.
- **Consider**. Legitimate, but you're not sure they outweigh the cost of addressing them now. Worth the user's attention.
- **Noted**. Technically valid but not actionable. Context-dependent, premature optimization, or low-impact at this stage.
- **Dismissed**. Wrong, nitpicky, or missing context, with a brief reason.

## Output Format

### Intent
> [The stated intent paragraph from Step 2]

### Reviewers
- Reviewer [label]: [model name], [N findings] (one bullet per reviewer)

### Act On
[Each: description, which models raised it, why it matters.]

### Consider
[Each: description, which models raised it, the tradeoff.]

### Noted
[Brief list.]

### Dismissed
[Each with a brief rationale.]

### Agreement Map
[Where models agreed and diverged, and what that pattern tells us.]
