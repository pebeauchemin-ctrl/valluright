# Core Web Vitals gate for growth URLs (REB-165)

`node scripts/cwv-check.mjs [baseUrl]` runs Lighthouse (mobile lab) on 8 growth URLs and exits 1
if any is in Google's "poor" band (LCP > 4s, CLS > 0.25, TBT > 600ms; TBT is the lab stand-in for INP).
Needs Chrome. Default target is https://valuright.ai.

## Baseline (live site, 2026-10-27, one mobile lab run from a cloud box)

| path | LCP | CLS | TBT | perf |
|---|---|---|---|---|
| / | 3.1s | 0.000 | 369ms | 80 |
| /what-is-my-business-worth | 6.0s (re-run: 3.5s) | 0.000 | 279ms | 65 |
| /what-is-my-hvac-business-worth | 3.7s | 0.007 | 316ms | 75 |
| /guides/sde-explained | 3.2s | 0.000 | 200ms | 84 |
| /guides/how-to-value-a-small-business | 6.1s (re-run: 3.4s) | 0.000 | 247ms | 66 |
| /demo | 3.2s | 0.003 | 432ms | 76 |
| /pricing | 3.8s | 0.000 | 237ms | 76 |
| /auth | 1.8s | 0.000 | 184ms | 96 |

Readout: CLS is clean everywhere. LCP element on the two slow pages is the hero paragraph
(text, not an image): ~0.9s server response + ~2.5s render delay, and it varies a lot between runs.
No single clear tech blocker, so no code fix in this PR. Lab numbers are noisy; treat one POOR
run as "re-run", two in a row as a regression.

## Wiring it into CI (needs a human with `workflow` scope)

The bot token cannot edit `.github/workflows/*`. To make this a PR-time gate, add this file as
`.github/workflows/cwv.yml`. It checks the live site after merges and weekly, report-only at first:

```yaml
name: CWV
on:
  workflow_dispatch:
  push:
    branches: [main]
  schedule:
    - cron: "0 14 * * 1"
jobs:
  cwv:
    runs-on: ubuntu-latest
    continue-on-error: true # flip to false once the baseline is stable
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: node scripts/cwv-check.mjs https://valuright.ai
```

A true pre-merge gate needs a per-PR preview URL (Lovable does not give one today), so this checks
production right after publish instead.
