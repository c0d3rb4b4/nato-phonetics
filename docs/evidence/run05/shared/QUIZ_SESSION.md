# P07.2 pure session engine — partial delivery

17 November 2026. [Source](../../../../src/lib/quizSession.js), [nine regression tests](../../../../tests/quiz-session.test.mjs), [passing test log](quiz-session-tests.log), [passing type check](quiz-session-typecheck.log).

This engine is not yet imported by the quiz screen. P07.2 remains unfinished until UI/audio lifecycle integration is verified; P07.4 session selection/results/Retry Mistakes screens are not delivered by this module. No screenshot is applicable to the unused pure-logic follow-on.

`createQuizSession` precomputes an immutable coverage deck and canonical four-option questions with injected randomness. Default length is 10; exported initial UI choices are 5/10/26. The engine accepts 1–260 questions to bound memory while permitting repeated coverage cycles. Each complete cycle covers the selected letters once. Its first letter cannot equal the preceding cycle's final letter when the set has at least two letters. A single-symbol mistake retry necessarily repeats that symbol if given multiple questions.

| Action | Allowed transition | Contract |
|---|---|---|
| `submitQuizAnswer` | question → feedback | Only an offered choice; one attempt, with no automatic advance. |
| `nextQuizQuestion` | feedback → question or complete | Last feedback remains until explicit Next. |
| `cancelQuizSession` | question/feedback → cancelled | Retains partial recap and invalidates pending actions. Completed results remain complete. |
| `restartQuizSession` | any → new question generation | Clears new-round scoring; previous immutable results remain available. |
| `retryQuizMistakes` | complete → new question generation, or null | One question per unique missed symbol; null for no mistakes or an incomplete round. |

The caller captures `quizActionGuard(session)` before starting an event or asynchronous callback, then applies the event to current state through a functional update, such as `setSession(current => submitQuizAnswer(current, guard, choice))`. Both the numeric revision and the exact in-memory question identity must still match. Old, duplicate, cancelled, forged/copied-identity and cross-session actions return the same state. Identities are intentionally in-memory objects, not persisted IDs; progress persistence belongs to P08. The UI must stop its owned audio/timers on cancel, navigation and restart. This data module does not own those effects.

`quizSessionResults` reports total/answered/correct/incorrect, accuracy over submitted answers (zero when none), and every missed attempt. Retry deduplicates symbols, while the recap preserves repeated misses. Tests exercise 100 seeded 260-question decks, boundaries, one/two-symbol sets, malformed inputs/random draws, all short lengths, four-choice invariants, immutability, stale submissions, cancellation/restart, explicit completion, scoring and mistake retries. No device workflow or human acceptance is inferred.

Run 08 follow-through: the historical pure-model limitation above is superseded by [actual screen/audio integration and results verification](../../run08/README.md). The original Run 05 test/screenshot scope is unchanged; P07.4 affected enlarged-text acceptance is still open.
