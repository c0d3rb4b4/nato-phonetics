# Initial final-verifier failure — 20 November 2026

`python3 docs/evidence/run30/shared/verify-records.py` exits1 because the README
links to `verification.json` while the verifier writes that report only after
checking links. Source/artifact/status assertions before that point pass; this
whole invocation remains failed. The exact assertion is:

```text
AssertionError: ('/Users/mac/dev/apps/nato-phonetics/docs/evidence/run30/README.md', 'verification.json')
```

Initial verifier source is retained in `verify-records-first.py.snapshot`.
Correct only this self-reference ordering: recognize the verifier's own output
path, then assert it exists after the completed report is written. All ordinary
local links still require an existing actual file. No application/acceptance
predicate or command result changes.
