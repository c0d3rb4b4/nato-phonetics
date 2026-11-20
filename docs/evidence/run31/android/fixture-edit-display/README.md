# Direct display capture during a committed edit

The editing scenario sent Q at caret position 3, then changed the live font
scale to 2 and back to 1 before sending Z. Six direct system screenshots show
focus and the keyboard, the visible Q insertion, enlarged paragraphs, the
returned input and the final Z insertion. At 2×, Gboard's “Keyboard font size
updated” banner and keyboard cover the edited glyphs and caret. Their visual
appearance for this keyboard-visible state remains unverified. Re-enter on a
comparable supported keyboard or configuration without the overlay.
[Enlarged capture](editing/screenshots/editing-live2.png),
[final insertion](editing/screenshots/editing-insert.png) and [six captures](editing/captures.json).

Native and JS observations retain the same mounted field and editable
throughout. Live2 and return1 both contain NUWQJ359 at caret 4. Final insertion
produces NUWQZJ359 at caret 5. The three unchanged editing predicates passed
using this run's saved observations and the same fixture's previously measured
cold references. [Fresh observations](editing/samples.json) and
[corrected scoped gate](editing/gate.json).

The initial run collected all six screenshots and restored the exact ordinary
product, display size, font scale and Gboard. Its postcheck failed because it
also compared the randomized installation directory issued by Android on
reinstall. The corrected offline check verified identical measured and
expected APK SHA-256 values for both packages before applying the editing
predicates to the preserved samples. The initial command remains failed.
[Run record](summary.json), [initial gate failure](editing-gate.log) and
[original observer and product restored](observer-restoration.json).
