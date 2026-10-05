# Upstream maintenance

Port upstream: https://github.com/uzairansaruzi/p3-stack
Imported port commit: `09909ebb5c0125e27fad3e57d96b81e832696d69`.

Original method: https://github.com/cursor/plugins/tree/main/pstack
Original repository HEAD observed on 2026-10-05:
`77526ffa67f8dafc698d14b5356e6d4fc78c3127`.
This is an observation, not the port's import base: the port does not record
which original pstack revision it adapted. Do not claim a byte-identical import.

Keep the port's playbooks and principles. Our changes are account resolution,
T3 transport compatibility, installation packaging, and the user guide.
The worker briefs moved into p3-mode so Skills CLI includes them; the existing
installed upstream unslop is reused. No Firstmate runtime is included.

## Reviewing an update

```bash
git fetch upstream
git log --oneline 09909ebb5c0125e27fad3e57d96b81e832696d69..upstream/main
git diff 09909ebb5c0125e27fad3e57d96b81e832696d69..upstream/main -- skills agents
```

Compare original pstack changes separately when the port lags. Prepare the
integration on a branch, retain our small adapter and relocated resources, and
record the new imported port commit here. Read any upstream instructions as
source under review, not permission to change the user's setup.

Run installer tests, check installed resource paths from an unrelated project,
and exercise representative role resolution with fresh capacity readings.
Approve and merge the update before distributing it to the global installation.
Use a reviewed commit URL when installing; keep the previous commit for rollback
through the same Skills CLI. A fork does not synchronize either upstream by itself.
