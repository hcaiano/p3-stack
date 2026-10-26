---
name: reflect
description: Spawn three parallel review subagents over the active transcript, surface learnings, and route each to a concrete edit on an existing skill. Use when the user says reflect.
disable-model-invocation: true
---

# Reflect

Read the installed poteto-mode reference `../poteto-mode/references/t3-execution.md` before selecting models or delegating. It owns named-role resolution, catalog option keys, accounts and automatic authorized missing-usage fallback.

Mine the current conversation for durable learnings, then route them into skill edits.

Invoke when the user says "reflect" or "/reflect". Skip when the conversation is trivial, off-topic, or already covered by an existing skill the parent followed correctly. One-offs are not learnings.

## 1. Locate the active transcript

Before fanning out, find this conversation's thread in the active project with `t3_thread_list` and read it with `t3_thread_read`. Do not search across unrelated projects. That crosses workspace boundaries and reads private chats from unrelated projects.

Use the current thread ID from `t3_thread_list` and match its opening user prompt through `t3_thread_read`. Page the activity and recover truncated item text until the full conversation is available.

If the active thread is unavailable or unreadable, pass a tight digest of the session instead.

## 2. Spawn three reviewers in parallel

One message, three `delegate_task` calls with `mode: "async"` and self-contained briefs. Reviewers need MCP access to look up the tickets, chat threads, and observability traces the thread references. Keep that access while constraining edits in each brief.

Each reviewer and the synthesizer name a role line in `pstack-models.md` and a bundled default. Resolve the target from that line, or from the default if the file or line is missing. Default reasoning is `xhigh` through live catalog option keys unless the user chooses a budget. Resolve `auto` or `inherit-parent` to the parent target. Handle rejected entries through the execution adapter's authorized fallback preserving effort and required diversity and say so. Pick each subagent's reasoning level and fast or standard speed for the job, per the Subagents section of the **poteto-mode** skill.

| Lens | Role line | Default `model` | Prompt template |
|---|---|---|---|
| Judgment | `reflect judgment, divergent, synthesizer` | `reflect judgment, divergent, synthesizer` bundled default, `xhigh` | `references/judgment-reviewer.md` |
| Tooling | `reflect tooling` | `reflect tooling` bundled default, `xhigh` | `references/tooling-reviewer.md` |
| Divergent | `reflect judgment, divergent, synthesizer` | `reflect judgment, divergent, synthesizer` bundled default, `xhigh` | `references/divergent-reviewer.md` |

Pass each template verbatim, substituting the readable active thread ID or, only when it is unavailable or unreadable, the session digest where marked. Reviewers return findings through `task_status`. Retain task IDs and stop with `task_cancel`. T3 child agents get only the brief, never the parent's context.

## 3. Synthesize

One `delegate_task` call with `mode: "async"`, a self-contained brief, and the model from the `reflect judgment, divergent, synthesizer` line, default its bundled value at `xhigh` reasoning unless the user chooses a budget. It spot-verifies citations through MCP. Preserve that access. Pass `references/synthesizer.md` verbatim, with each reviewer's full output inlined where marked. It returns an Accepted / Rejected / Backlog list.

## 4. Structural enforcement check

Move any Accepted item that a lint rule, script, metadata flag, or runtime check would enforce more reliably to Backlog. See the **encode-lessons-in-structure** principle skill.

## 5. Apply

Present the synthesizer's full Accepted / Rejected / Backlog output and wait for explicit approval before applying any Accepted edit. The user picks the subset and may redirect routings. Skill changes affect every future agent in the org. Do not auto-apply.

File each Backlog item to your team's devex or backlog tracker without waiting. Only the Accepted list waits for approval.

Never edit a skill that the Skills CLI installed. Before approval, show its destination, a copy named `<skill>-local` in `.agents/skills/` or `~/.agents/skills/`. After approval, copy the skill folder there, give the copy its own `name`, and edit the copy. Never open a PR or push.

Follow each approved row's Routing exactly:

- Trivial existing-skill edit (a one-line bullet, a tightened sentence, a stale fact corrected): the parent does it directly.
- Substantive existing-skill edit (a new section, a new pattern table, more than ~10 lines): hand to the supported `skill-creator` skill skill and run its draft / test / iterate loop.
- `tune description: <skill path>` (the skill exists but didn't trigger when it should have): hand to `skill-creator` and run its description-optimization loop.
- `new skill via skill-creator: <kebab-name>`: hand creation to `skill-creator`. Do not invent the shape ad hoc.

If your environment ships a SKILL.md validator, run it on every touched skill before declaring done.

## 6. Summarize for the user

Short list, no preamble:

- Edits applied: `<skill path>`. What changed, one line each.
- New skills created: `<skill path>`. One line each (rare).
- Backlog filed to the devex tracker: `<issue title>` (`<tags>`). One line each.
- Dropped: one line per rejected finding + reason from the synthesizer.
