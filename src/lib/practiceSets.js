import { NATO_ALPHABET, NATO_NUMBERS } from '../data/natoData.js';
import { conversionOutput, convertText } from './conversion.js';

/** @param {import('../types').LetterEntry | import('../types').DigitEntry} entry */
export const entrySymbol = entry => 'letter' in entry ? entry.letter : entry.digit;
export const PRACTICE_ENTRIES = Object.freeze([...NATO_ALPHABET, ...NATO_NUMBERS]);
export const PRACTICE_ENTRY_BY_SYMBOL = new Map(PRACTICE_ENTRIES.map(entry => [entrySymbol(entry), entry]));

const letters = Object.freeze(NATO_ALPHABET.map(entrySymbol));
const digits = Object.freeze(NATO_NUMBERS.map(entrySymbol));
/** @param {string} example */
const exampleSymbols = example => Object.freeze([...new Set(convertText(example).flatMap(part =>
  part.type === 'letter' || part.type === 'number' ? [entrySymbol(part.entry)] : []))]);

// Examples use ordinary canonical conversion; no alternate pronunciation table.
export const PRACTICE_SETS = Object.freeze([
  { id: 'letters', label: 'Letters', symbols: letters, example: '' },
  { id: 'digits', label: 'Digits', symbols: digits, example: '' },
  { id: 'mixed', label: 'Letters and digits', symbols: Object.freeze([...letters, ...digits]), example: '' },
  { id: 'postcode', label: 'Postcode symbols', symbols: exampleSymbols('SW1A 1AA'), example: 'SW1A 1AA' },
  { id: 'callsign', label: 'Callsign symbols', symbols: exampleSymbols('N359AB'), example: 'N359AB' },
].map(set => Object.freeze(set)));

/** @param {typeof PRACTICE_SETS[number]} set */
export const practiceLengths = set => [...new Set([5, 10, set.symbols.length])].sort((a, b) => a - b);
/** @param {typeof PRACTICE_SETS[number]} set */
export const practiceExampleOutput = set => conversionOutput(convertText(set.example));
