# Upstream maintenance

Port upstream: https://github.com/uzairansaruzi/p3-stack
Imported port commit: `09909ebb5c0125e27fad3e57d96b81e832696d69`.

Original method: https://github.com/cursor/plugins/tree/main/pstack
Original repository HEAD observed on 2026-10-05:
`77526ffa67f8dafc698d14b5356e6d4fc78c3127`.
This is an observation, not the port's import base: the port does not record
which original pstack revision it adapted. Do not claim a byte-identical import.

Keep the port's engineering content unchanged. No local engineering improvements,
model-quality opinions, reduced review panels or reasoning caps. Our changes are account resolution,
T3 transport compatibility, installation packaging, and the user guide.
The worker briefs moved into poteto-mode so Skills CLI includes them; the existing
installed upstream unslop is reused. No Firstmate runtime is included.

## Checking for updates

```bash
node scripts/upstream.mjs
```

The checker tracks official `cursor/plugins:pstack` directly and the T3 port
separately. Revisions live in [upstream/sources.json](upstream/sources.json).
Changes elsewhere in cursor/plugins do not trigger an update. Reports, scoped
patches and inventories are written under `.git/p3-upstream`; `--output` chooses
another directory. The command changes neither skills nor reviewed revisions.

`initial-audit-required` means the official import base is unknown, even when
the observed source has no newer changes. `update-available` means the reviewed
source tree changed. `current` means that source tree has no changes since its
reviewed revision; it does not certify the global installation. Fetch failures
produce an incomplete report and a nonzero exit status.

## Weekly integration

The T3 recurring task follows [upstream/MAINTENANCE.md](upstream/MAINTENANCE.md):
detect source changes, reconcile official engineering with our small adapter,
and prepare or update one reviewable PR. The initial official audit remains
pending until a full source comparison establishes a reviewed baseline.

Merge and global installation require user approval. After approval, use a
reviewed commit URL through the Skills CLI and verify MBP and PC delivery.
Never mark a revision reviewed merely because it was fetched. A fork does not
synchronize either upstream by itself.
