---
name: how
description: "Use for \"how does X work\", code walkthroughs before changing something, and placement / ownership / layering questions (\"where should this live\", \"which package owns this\", \"is this the right layer\"). Explains subsystem architecture, runtime flow, onboarding mental models. Use why for motivation."
disable-model-invocation: true
---

# How

Read the installed poteto-mode reference `../poteto-mode/references/t3-execution.md` before selecting models or delegating. It owns named-role resolution, catalog option keys, accounts and automatic authorized missing-usage fallback.

Explore the codebase to answer "how does X work?" questions. Produce architectural explanations at the level of a senior engineer onboarding onto a subsystem, enough to build a working mental model, not so much that it reads like annotated source code.

Every spawn is a read-only `delegate_task` child with `mode: "async"` and a self-contained brief. Explorers use the `how explorer` line in `pstack-models.md`, and every explainer uses the `how explainer` line. Resolve a missing line from that role's bundled default at `xhigh` reasoning through live catalog option keys unless the user chooses a budget. For `auto` or `inherit-parent`, resolve the parent target. Handle rejected entries through the execution adapter's authorized fallback preserving effort and required diversity and say so. Retain task IDs, once nothing independent is left, end the turn until their completion notifications wake you, then read each result with `task_status`, and stop with `task_cancel`. T3 child agents get only the brief, never the parent's context. Pick each subagent's reasoning level and fast or standard speed for the job, per the Subagents section of the **poteto-mode** skill.

## 1. Assess complexity

If the scope is ambiguous, state your interpretation and explore. The user can redirect.

- **Simple** (a single module, a small utility, a narrow question such as "how does function X work"): no explorers. Spawn one explainer that explores and explains in one pass, built from `references/explainer-prompt.md` without the explorer-findings section. Go to step 4.
- **Complex** (a subsystem spanning multiple files or services, a cross-cutting feature, a full architectural overview): go to step 2.

When in doubt, take the simple path.

## 2. Explore (complex only)

Decompose the question into 2 to 4 angles, each a distinct slice of the subsystem. Spawn all explorers in a single message, each with `references/explorer-prompt.md` and its angle filled in.

## 3. Synthesize (complex only)

Once all explorers have returned, spawn one explainer with `references/explainer-prompt.md` and every explorer's findings filled in.

## 4. Present

Present the explainer's output. Light edits for clarity or context from the conversation are fine. Do not substantially rewrite it.

## Output format

The explanation uses the sections defined in `references/explainer-prompt.md`, dropping any that do not apply: Overview, Key Concepts, How It Works, Where Things Live, Gotchas.
