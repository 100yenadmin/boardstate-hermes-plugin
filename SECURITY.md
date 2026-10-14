# Security policy

## Reporting a vulnerability

Please report vulnerabilities privately: [open a security advisory](https://github.com/100yenadmin/boardstate-hermes-plugin/security/advisories/new).
Don't open a public issue for a security problem.

We aim to acknowledge reports within 3 business days and to share a decision or fix plan within 14 days.

## What counts as a vulnerability here

- Boardstate dashboard data endpoints accessible without the required session token.
- Boardstate data or sidecar endpoints unintentionally reachable from outside the machine.
- Session tokens, operator secrets, or connector credentials exposed by Boardstate.
- One Hermes profile's Boardstate data visible to another profile.

## Out of scope

- Problems in Hermes Agent core: report those to [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent/security).
- Hermes dashboard core authentication: report it upstream using the link above.

## Supported versions

Fixes go into the latest release.
