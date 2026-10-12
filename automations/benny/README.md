# benny

benny gives you two T3 Code automations for slack issue reports. one triages each report. the other reproduces confirmed bugs and may prepare a small draft fix.

the files in this directory are dormant setup and automation sources. they do not appear as slash skills.

## set it up

1. point T3 Code at [`FOR_AGENTS.md`](./FOR_AGENTS.md) and name the target repository.
2. let setup merge this whole directory into the target at `.agents/automations/benny/`. it must preserve destination-only files and review conflicts instead of overwriting local edits.
3. let setup install shared pstack skills through the approved matching-revision fork installer and `npx skills@latest` in project scope, preserving unrelated skills. record the generated `skills-lock.json`.

4. keep user-owned configuration outside the copied pack, for example in `.agents/benny/`. adapt [`configuration.example.yaml`](./templates/configuration.example.yaml) and [`feature-map.example.md`](./skills/reproduce-and-fix-issues/references/feature-map.example.md).
5. commit `skills-lock.json`, `.agents/automations/benny/`, and any secret-free configuration before enabling either automation.
6. review each new automation draft or update existing automations in their editors. then send a harmless test report and verify every source-channel post stays in the original thread.

## T3 activation boundary

This is a dormant T3 port. Activation is blocked until a reviewed T3 setup handoff and per-automation tool permissions prove the original Slack-trigger, thread-only posting and child-write isolation requirements. A scheduler call alone is not that proof. The reviewed handoff is a required capability, not a callable tool or an installed skill. Do not create or update automations while it is unproved.
