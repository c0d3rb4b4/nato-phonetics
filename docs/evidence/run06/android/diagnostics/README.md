# Android Run06 diagnostic candidates

These candidates and captures are failures or temporary observations, not the retained application candidate. Their APKs are under `artifacts/run06/android`; each folder has the exact SHA-256.

- `metrics-refresh`: refresh DisplayMetricsHolder before Activity create/resume only. Live text changes still recreate the Activity: Alphabet returns to Home, converter input is lost, and 200% ordinary text clips inside cached default-height boxes.
- `decor-invalidation`: temporary stable RN feature-provider delegation enables only `enableFontScaleChangesUpdatingLayout`, with manifest fontScale handling and DeviceInfo refresh. Route/input survive, but requesting layout on the decor does not establish ordinary-text remeasurement.
- `surface-invalidation`: replaces the decor request with the public actual React root's requestLayout and pins the private bootstrap to RN0.81.5. Live200% instructions still measure39.43dp, the default height, and hide their second sentence. Actual Hermes reads report the font-layout flag true.
- `font-scale-probe`: adds temporary Android native context logging to the preceding experiment. Its exact source and APK are preserved; any executed log is linked from the final platform report.

The private startup override is absent from the final maintained source. No release-channel change, force-reset of live native flags, typography change, remount key or accessibility scaling disablement is shipped. See [the corrected upstream/source investigation](../upstream-investigation.md): the initial clean-root hypothesis was withdrawn after examining the full Yoga-style update path; no native cache repair has been established.

Early install failed because Android's package service was not yet ready; retry after `sys.boot_completed=1` passed. The first ordinary driver used an incorrect Home text expectation and failed its bounded wait. Both failures are retained in parent log files and do not establish application regressions.
