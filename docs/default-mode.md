# Personal default mode

Keep activation in personal instructions, separate from the upstream engineering
method. All providers use `~/.agents/AGENTS.md`. Codex accounts, Claude and Grok
reach it through their existing links. Cursor's always-applied
`~/.cursor/rules/henrique.mdc` only tells the agent to read that shared file;
it contains no separate personal policy. Fleet distributes the shared file and
the Cursor entrypoint. Keep this instruction in the shared file only:

> For engineering tasks, read `~/.agents/skills/poteto-mode/SKILL.md` and follow
> its matching playbook by default, without requiring an explicit command.
> Casual conversation and an explicit opt-out do not activate the mode. Use the
> official skill names. In this mode, use its T3 execution adapter for model and
> account selection; preserve explicit user choices and approval requirements.

Start a new session after changing global instructions. Existing sessions may
retain their initial instruction context. This selects the workflow; it does
not enable every skill or change the main conversation's model.

## Migrating the port names

Install the reviewed fork revision through the existing installer first. Verify
`poteto-mode`, `poteto-help`, `setup-pstack` and their bundled references. Then
remove only the superseded, fork-owned `p3-mode`, `p3-help`, `setup-p3` through
`npx skills@latest remove --global p3-mode p3-help setup-p3 --yes`.

If an existing project or global `p3-models.md` contains custom choices, move it
to `pstack-models.md` after checking for a destination collision. Preserve its
contents. Repositories and source URLs still use `hcaiano/p3-stack`; those are
provenance, not skill commands. Verify Fleet delivery before claiming PC parity.
