# Dependency review

Run `npm run audit:review` against the locked installation. The command queries the npm registry, prints the raw audit status and compares current high and critical findings with the [review inventory](security-audit-inventory.json).

An empty inventory means there are no recorded exceptions. A new high or critical finding fails the check. Investigate its installed version, dependency paths and use in the app or build tools. After a dependency fix, repeat the audit and remove any disposition that no longer applies.

If maintainers record a temporary disposition, include the exact finding fingerprint, owner, applicability, remediation, evidence, review date and expiry date. A change to the advisory, affected version or dependency path requires a new review. An expired disposition and an incomplete registry response both fail the gate. [Review implementation](../scripts/check-audit.cjs) · [Regression tests](../tests/audit-review.test.mjs)
