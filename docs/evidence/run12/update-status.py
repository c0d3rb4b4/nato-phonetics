from pathlib import Path
p=Path('docs/DELIVERY_PLAN.md');s=p.read_text();a=s.index('**Current state:**');b=s.index('\n**Reusable',a)
s=s[:a]+'''**Current state:** Run 12 implements P08.2 listening-to-symbol and typed canonical code-word recall through the guarded P07 sessions and P04 audio owner, plus memory-only inventory/help and CI/browser regressions. **P08.2 remains active for affected native qualification; P05/P06/P07/P08 stay active.** Shared/production browser gates pass, scoped iOS default/maximum input/results/Retry checks pass; actual Android results and all original captures are recorded in [Run 12](evidence/run12/README.md). Android live ordinary-text P1, original iOS long-drag assertion, three strict P3 ink fringes and support/security/release gates stay open. No framework repair, new persisted data, native app rebuild, scope removal or release approval; all M11 unperformed. [Actual captures](evidence/run12/screenshots/index.md).'''+s[b:]
a=s.index('**Queue update —');b=s.index('\n1. **P1',a);s=s[:a]+'''**Queue update — 18 November 2026, after Run 12:** P08.2 listening/typed recall is functionally integrated with affected native acceptance open. P08.1/.4 and P06/P07 retain prior delivery/qualification distinctions. Original letter and numeric browser regressions pass after the engine extension. Reuse Run 11's scoped direct iOS Stop→Replay; Run 12's individual key-event assertions qualify exact typed draft retention before/after Menu, while the original bulk XCTest failure remains uncorrected. Do not repeat unchanged qualified flows without a relevant change/risk.'''+s[b:]
s=s.replace('P08.1/.4 are functionally implemented with affected qualification open; P08.2 listening/typed reverse recall is the next independent product slice, followed by P08.3 local progress and its storage/privacy dependencies.','P08.1/.2/.4 are functionally implemented with affected qualification open; P08.3 local progress is the next independent product slice, with versioned storage, scheduling, deletion and privacy dependencies.')
s=s.replace('Run 11 implements P08.1/.4 functionality; affected native acceptance stays open, while P08.2 is the next independent learning slice.','Runs 11–12 implement P08.1/.2/.4 functionality; affected native acceptance stays open, while P08.3 local progress is the next independent learning slice.')
old='- [ ] **P08.2** Add listening-to-letter/digit and typed reverse-recall modes with documented answer normalization, replay/error handling and accessible alternatives.'
s=s.replace(old,old+''' **Run 12 functional delivery / acceptance partial:** [Letter Quiz](../app/letter-quiz.js) and [guarded engine](../src/lib/quizSession.js) add explicit listening/typed modes across existing sets. Listening hides the answer tile/guide, offers real Play/replay/Stop and a code-word text alternative; typed recall accepts documented canonical normalization/aliases, rejects blank input, retains exact response, and disables suggestions. Shared coverage/guards/score/Retry and production desktop/narrow/200% concealment/AX/audio-error/input/retention checks pass; scoped installed native evidence and failed driver attempts are in [Run 12](evidence/run12/README.md). No microphone/provider/storage addition. **Checkbox remains open for inherited affected native readability/qualification**; no bulk-input/framework repair or M11 acceptance claimed. [Answer rules](NUMERIC_PRACTICE.md#listening-and-typed-recall-run-12).''')
s=s.replace('Remains open for P08.3 progress data/migration/deletion; no local progress or human policy acceptance claimed.','Run 12 adds practice mode, typed draft/text-alternative lifetime and listening/typed help/discovery with no new saved keys. Remains open for P08.3 progress data/migration/deletion; no local progress or human policy acceptance claimed.')
marker='**Run 11 prepared supplement:**';pos=s.index(marker);s=s[:pos]+'''**Run 12 prepared supplement:** [physical listening/typed recall, AT, keyboard/draft/Retry and provider scenarios](evidence/run12/manual-handoff.md). All human results remain unperformed; native measurement/input/gesture/runtime investigations stay engineering.

'''+s[pos:]
# Update current human queue rows without rewriting prior dated execution records.
a=s.index('### Manual findings and retest log');b=s.index('## Complete scope',a);part=s[a:b]
for mid in ['M11.3','M11.4','M11.5','M11.6']:
 lines=part.splitlines()
 for i,line in enumerate(lines):
  if line.startswith('| '+mid+' |'):
   line=line.replace('Run 11 source manifest','Run 12 source manifest');cols=line.split('|');cols[4]+=' Run 12 [supplement](evidence/run12/manual-handoff.md) prepares listening/typed recall scenarios; all human results unperformed. ';lines[i]='|'.join(cols)
 part='\n'.join(lines)+'\n'
s=s[:a]+part+s[b:]
# Scope ledger: only new evidence, no closing inherited failing gates.
a=s.index('## Complete scope');b=s.index('## Execution contract',a);part=s[a:b];lines=part.splitlines()
notes={
 'R03':'Run 12 listening uses existing speechText and typed recall expects canonical words; automated inputs are not audible correctness. [Evidence](evidence/run12/README.md).',
 'R04':'Run 12 adds explicit listening Play/replay/Stop through the unchanged owner; new controlled production error/recovery/Menu/stale-event checks pass. [Evidence](evidence/run12/README.md).',
 'R05':'Run 12 memory-only mode/draft/text-alternative inventory/help added; no new permission/provider/persisted key. [Policy](../PRIVACY.md).',
 'R06':'Run 12 production listening/typed answer concealment and accessible alternatives pass; affected native readability and physical AT stay open. [Evidence](evidence/run12/README.md).',
 'R07':'Run 12 adds narrow/200% listening/typed controls and scoped iOS maximum checks; inherited Android affected gate stays open. [Captures](evidence/run12/screenshots/index.md).',
 'R14':'Run 12 CI adds meaningful recall browser suite and evidence upload; local checks pass, hosted CI unrun.',
 'F01':'Run 12 extends guarded sessions/results/unique-mistake Retry to listening/typed recall, preserving original choice regressions. Affected native acceptance stays open.',
}
for i,line in enumerate(lines):
 if not line.startswith('| '):continue
 cols=line.split('|');rid=cols[1].strip()
 if rid=='F06':
  cols[4]=' in-progress ';cols[5]=' Run 12 P08.2 listening-to-letter/digit and typed code-word recall implemented across existing sets, with explicit Play/Stop/text alternative, canonical normalization/aliases/blank validation, retained drafts, guarded scoring/recaps/mode-preserving Retry. Shared/production/browser and scoped native evidence in [Run 12](evidence/run12/README.md); inherited affected native qualification keeps the task open. M11 listening/AT/usability remains unperformed. ';lines[i]='|'.join(cols)
 elif rid in notes:
  cols[5]+=' '+notes[rid]+' ';lines[i]='|'.join(cols)
s=s[:a]+'\n'.join(lines)+'\n\n'+s[b:]
# Current engineering bulk row supplements historical cause limits.
lines=s.splitlines()
for i,line in enumerate(lines):
 if line.startswith('| P06.4/P10 iOS bulk XCTest anomaly |'):
  lines[i]=line.replace('Next: retain this input method','Run 12 listening/typed driver bulk input observes only `w` from `wrong` after Menu; location is not established by that command. Exact individual key events assert the whole response immediately and after Menu, and the scoped typed round/Retry passes. [Evidence](evidence/run12/ios/README.md). Next: retain this input method')
s='\n'.join(lines)+'\n'
# Add current execution-table row before the per-run template.
pos=s.index('\nFor each implementation run, include:')
s=s[:pos]+'''| Run 12 · 2026-11-18 | P08.2 M listening/typed recall plus P08.5 memory-only inventory/help; bounded native input/accessibility qualification | Functional modes and meaningful tests/CI delivered; 103 tests/types/lint/Expo-free/build and production recall + existing letter/numeric regressions pass. Scoped native outcomes/driver failures: [Run 12](evidence/run12/README.md); [actual captures](evidence/run12/screenshots/index.md). P08.2 remains active for affected gates. | All M11 unperformed; native live-text/long-drag, strict P3 ink, security/runtime/release residuals remain; no new owner prerequisite | P05.2 first-divergence/affected qualification; next independent P08.3 versioned progress. Stop after expanded native driver checks, captures and status/source reconciliation; another storage/cache/framework cycle would consume reserved verification/handoff capacity. |
'''+s[pos:]
s+='''
## Run 12 — 18 November 2026

**Resume/forecast:** No applicable AGENTS.md; [144/144 Run 11 maintained inputs match](evidence/run12/shared/resume-comparison.json). Inherited tracked/untracked changes preserved over `784bb93c5cfb6edfd318d0dcec2d54d5bb222483`, with no reset/commit/push/publication. Select P08.2 M/moderate integration risk through delivered sessions/audio, and update P08.5 memory-only inventory/help. [Forecast/checkpoints](evidence/run12/shared/forecast.md) retains P05.2 first divergent paragraph/JNI/cache/Yoga question and L/high-uncertainty instrumented-source-build cost. No new causal lead supports repeating failed flag/cap/constraint hypotheses or a speculative fork.

**Delivered:** Explicit listening-to-symbol and typed code-word recall across existing sets. Listening hides answer tile/guide, uses explicit Play/replay/Stop and a scored code-word text alternative. Typed responses use documented canonical normalization/Alpha/Juliet aliases, blank validation and exact feedback. Guarded score/recap/unique-mistake Retry retains mode; Menu retains drafts and stops audio. No microphone/provider/dependency/persisted key/font/design/tolerance change. Help/discovery/PRIVACY/practice rules/CI updated. [Implementation and evidence](evidence/run12/README.md).

**Verification and native checkpoint:** 103/103 tests, active JS types/lint, Expo-free graph and 12-route production build pass. Production desktop/light and 320×568 dark/200% recall tests pass concealment/AX, five listening digits, error/recovery/text alternative, exact draft/Enter, 36 typed symbols/aliases, score/Retry, memory-only and stale audio. Existing letter/numeric regressions pass after engine changes. Scoped installed iOS default typed round/Retry and maximum listening/typed keyboard/feedback/partial results pass. A bulk XCTest command observes only `w` after entering `wrong`/Menu; preserved as a failure, not a product fix. Individual character events assert exact value before/after Menu. An intermediate driver's scroll origin lands on a Debug toast; retained checkpoint, content-area origin and separate typed command qualify the retry without warning suppression. Android actual results/captures are in [its report](evidence/run12/android/README.md); inherited live ordinary-text P1 stays open. Original iOS long-drag, bulk compatibility and strict P3 ink failures remain unclosed.

**Evidence/status/manual:** [Original inspected screenshots](evidence/run12/screenshots/index.md), [source identity](evidence/run12/source-identity.json), platform artifact hashes and actual loaded JS distinguish unchanged native binaries, pre-help practice graph and final graph. No native app/Release rebuild, fresh install/audit, hosted CI, broad unchanged raster/runtime matrix or physical acceptance claimed. **3 open / 16 in-progress / 12 implemented-awaiting-M11 / 4 resolved / 0 blocked / 0 scope changes.** F06 moves open→in-progress; P08.2 remains unchecked/active for affected native qualification. All M11 unperformed with [prepared human-only supplement](evidence/run12/manual-handoff.md). Plan/ledger/queue, review Current delivery status and affected docs are reconciled.

**Reforecast/stop:** Default/maximum iOS and exact input/scroll-driver checkpoints cost more than the initial shared/browser checks. Complete Android verification, actual capture inspection, hashes/source/link/status reconciliation and handoff before a new storage/cache/framework cycle. P08.3 is next independent work (M–L; versioned storage, date-boundary scheduling, migration/deletion/privacy plus fresh cross-platform evidence). P10 preparations remain eligible by task. P05.2 first-divergence/affected qualification remains P1 engineering. No fixed phase count, missing owner prerequisite, scope reduction or release approval inferred.
'''
p.write_text(s)
