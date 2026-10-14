# Official pstack reconciliation, 0.15.24

Source: `cursor/plugins:pstack`, version 0.15.24.
Commit: `1e5c90a4b6f249917bd21fe361b3a2a7deb741b8`.
Previous audit: [0.15.20](../2026-10-12/README.md) at
`1b6d44ff26d4e242f4e8f68c391e6d2f7ca16def`.
Report fingerprint before this change: `a9010b1ef508018ae8215b31eb940d84614f28ead8cc06f16db05cf91579cdd0`.

The 0.15.20 audit compared the complete official tree. This audit ports the 45
files official changed between the two commits and reruns the auditor over all
169 official files. [inventory.tsv](inventory.tsv) lists each official file,
its fork target, disposition, source blob and target SHA-256. Every `compare`
file is present. The dispositions are unchanged from the previous audit, plus
the two new skills.

## Not ported as code

- `scripts/orch` replaced Graphite with a `gh` or Origin PR base-chain walk.
  The fork already resolves the frontier from T3's native linked-PR chain
  (`list_thread_pull_requests`) checked against current GitHub facts, so it keeps
  that source. Native tracking covers GitHub only; Origin stays a reported
  transport limitation.
- Plugin manifests change only their version. Skills CLI owns T3 packaging.

## Known upstream inconsistencies

Two guide lines are verbatim official but lag the 0.15.24 playbooks.
`docs/guide/07-overnight.md` still starts a swarm round at every later push that
changes the patch, while Autopilot-full now swarm-verifies once.
`docs/guide/06-verify-and-ship.md` still lists trunk moves as Babysit churn,
while this fork's rebase-once delta keeps babysit on its base. The guides and
their bundled copies stay verbatim until official updates them.

No other T3 port was fetched, diffed or copied.
