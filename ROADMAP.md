# Boardstate roadmap

The single roadmap for this repository. "Now" and "Next" are planned work. "Later" items are parked on a revisit trigger and are
not counted as planned until they move up.

## Now

- Maintenance on 1.5.13 (the release that fixed the dependency finding in #45; that issue stays open for two repository-settings
  findings). Keep CI, the Hermes catalog
  pin and the install paths current, and answer issues.

## Next

- [ ] Return compact mutation receipts instead of the full workspace by default (#43).
- [ ] Add freshness metadata and stale-state badges for static widgets (#44).

## Later (parked)

- An agent-callable status tool or slash command for bug reports (#24). Parked until it is scheduled.
- The parked follow-ups from the v1.5.0 review (#20), each on the revisit trigger recorded there: two dashboards on one Hermes home, process-start identity in sidecar records,
  a public origin for Desktop widget assets behind a proxy, per-session scoping, and items 19-24 from its comments.

## Done

Shipped work is in the [CHANGELOG](CHANGELOG.md) and the [releases](https://github.com/100yenadmin/boardstate-hermes-plugin/releases).
