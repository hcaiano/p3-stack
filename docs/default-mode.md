# Personal default mode

Keep activation in personal instructions, separate from the upstream engineering
method. All providers use `~/.agents/AGENTS.md`. Codex accounts, Claude and Grok
reach it through their existing links. Cursor ACP loads the rule-only local
plugin at `~/.cursor/plugins/local/shared-personal-instructions`, whose one rule
requires reading the shared file. Its source is in `adapters/cursor/` in this
repository. Keep this instruction in the shared file only:

> For engineering tasks, read `~/.agents/skills/poteto-mode/SKILL.md` and follow
> its matching playbook by default, without requiring an explicit command.
> Casual conversation and an explicit opt-out do not activate the mode. Use the
> official skill names. In this mode, use its T3 execution adapter for model and
> account selection; preserve explicit user choices and approval requirements.

Start a new session after changing global instructions. Existing sessions may
retain their initial instruction context. This selects the workflow; it does
not enable every skill or change the main conversation's model.

The MBP runtime probe confirmed the plugin rule was injected and the Cursor
agent read the shared file. Merely placing a rule in `~/.cursor/rules` or adding
an ancestor `AGENTS.md` link did not pass that probe with Cursor ACP. The editor
rule may remain a pointer, but it is not the verified CLI entrypoint.

Fleet must capture the local plugin directory as well as `.agents/AGENTS.md`.
This adapter has no skills, tools, credentials or duplicate personal policy.

## Migrating the port names

Install the reviewed fork revision through the existing installer first. Verify
`poteto-mode`, `poteto-help`, `setup-pstack` and their bundled references. Then
remove only the superseded, fork-owned `p3-mode`, `p3-help`, `setup-p3` through
`npx skills@latest remove --global p3-mode p3-help setup-p3 --yes`.

If an existing project or global `p3-models.md` contains custom choices, move it
to `pstack-models.md` after checking for a destination collision. Preserve its
contents. Repositories and source URLs still use `hcaiano/p3-stack`; those are
provenance, not skill commands. Verify Fleet delivery before claiming PC parity.
