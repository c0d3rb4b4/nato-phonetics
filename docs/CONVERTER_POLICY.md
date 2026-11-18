# Converter policy

Run 09 establishes shared conversion/export; Run 10 adds pacing, Replay, current-token highlighting and paged card rendering. Native affected accessibility and integrated release acceptance remain open; see the delivery plan and Run 10 evidence.

| Input | Display/export | Speech |
|---|---|---|
| ASCII a–z / A–Z | Canonical NATO spelling, including Alfa and Juliett | Existing entry speechText, deliberately separate from spelling |
| ASCII 0–9 | Canonical digit word | Existing speechText, including tree/fife/niner for 3/5/9 |
| Spaces, tabs, newlines, Unicode whitespace matched by JS `\s` | One SPACE boundary per run; `/` between nonempty words in plain text; no leading/trailing separator | One configured 0/300/700 ms word-boundary gap (default 300 ms), replacing the ordinary 120 ms token gap; no leading/trailing gap |
| `- . / @ +` | Literal dash, dot, slash, at, plus in text and separate controls | Corresponding literal word; these are not NATO code words |
| Other punctuation, accents, Unicode and invisible/combining characters | Original code point retained in a visible `[not spoken: "…" U+…]` marker in plain text and a Not spoken card; omission count disclosed | Omitted explicitly; markers are never spoken |

No accent stripping, compatibility folding, guessed transliteration or Unicode uppercase expansion. `ß` does not become `SS`; precomposed and combining forms remain explicit unsupported code points. Count unsupported Unicode code points, not grapheme clusters. Export uses canonical words; provider inputs remain separate. A slash input exports as the word `slash`, so it cannot be confused with the `/` word-boundary notation. Unsupported-only input can be copied/shared for its markers but cannot start speech. Empty/whitespace-only output disables Play/Copy/Share.

Clear and edits stop owned audio before replacing input. Clear also removes output and export status, and invalidates pending export status callbacks. Menu/Back retains text; blur stops audio and invalidates export feedback. Closing the process/reloading the page discards the in-memory conversion. A clipboard or share action already handed to the OS cannot be undone by Clear; no normal conversion path reads the clipboard.

Native Copy uses the public Clipboard API still included in pinned React Native 0.81.5, behind `conversionExport.js`. That API is deprecated; its migration is an engineering follow-up on framework upgrade or capability failure. No dependency/native project change is needed for this batch. Native Share uses the installed RN system sheet. Android resolves when opened and cannot prove delivery; the UI says “Share sheet opened.” iOS dismissal and browser AbortError report cancellation. Browser Copy requires a supported permitted clipboard API; unavailable/denied capabilities offer selectable text. Unsupported browser Share offers Copy/manual selection. Share denial/cancellation never silently copies.

Verification: [Run 09](evidence/run09/README.md). Physical clipboard history/sync, receiving-app behavior, assistive technology and listening remain M11.3–M11.6. Android live font changes remain P05.2 engineering, not a human prerequisite.

## Playback and long input (Run 10)

Play Full Phrase and Replay phrase start at the beginning with the selected rate. Only spoken tokens advance the progress count; source indices map through whitespace and unsupported code points, including repeated letters. The current token remains highlighted during its boundary pause. A card tap replaces phrase playback and tracks that card; Stop, edit, Clear, pace change, blur and background remove the active highlight. Changing card pages does not interrupt audio or move focus automatically; Show current card selects its page.

The optional converterPacing field in the existing version 1 preference record stores explicit rate/wordPauseMs selections only. Defaults are 1× and 300 ms; Reset Preferences removes the override. Failed saves retain confirmed settings and show an error. No input, playback cursor or page is persisted.

At most 24 source tokens are mounted as cards at once, including spaces and omission markers. Previous/Next exposes every page; editing returns to page 1. Input (up to 200 logical units tall) and selectable plain text (up to 240 units tall) scroll independently, preserving the complete value. Native text scaling remains enabled. Copy, Share and speech always use the complete conversion. No input bound or truncation is introduced: samples of 100/500/2,000 characters guide the rendering strategy, not a universal performance promise. Larger inputs, physical keyboard/AT traversal and provider pacing need qualification. See Run 10 measurements and platform limits.
