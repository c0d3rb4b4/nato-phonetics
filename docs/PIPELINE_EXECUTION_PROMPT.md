# P10.8 pipeline execution prompt

Paste the following into Codex to select the app build pipeline as the next implementation batch. It follows the format of the [reusable delivery prompt](EXECUTION_PROMPT.md) and works from the parent `apps` workspace or the app folder.

```text
Work in [nato-phonetics](nato-phonetics/). Read applicable instructions, [DELIVERY_PLAN.md](nato-phonetics/docs/DELIVERY_PLAN.md) and [APP_REVIEW.md](nato-phonetics/docs/APP_REVIEW.md). Pick P10.8 next and follow the plan's execution contract. Use [eclipse-timer](eclipse-timer/) as the workflow reference. Extend the existing Gradle/Xcode pipeline for an installable develop APK, main Android APK/AAB and iOS simulator builds, and trusted manual reruns. Reuse host-build and existing web CI. Keep builds Expo/EAS-free, preserve failing gates/logs and verify artifact identities. Run hosted or authorized remote checks where available. Keep signing and publication behind their existing approval boundaries. Preserve user changes, record blocked scopes, and update the plan, review and affected runbook. End with job links, downloadable artifacts, verification, remaining blockers and the next step.
```

The prompt is 899 ASCII characters, excluding the code fences. The [P10.8 workflow plan](DELIVERY_PLAN.md#branch-triggered-app-builds) defines triggers, outputs, runner access, artifact checks and publication boundaries.
