/** @type {import('../types').LetterEntry[]} */
export const NATO_ALPHABET = [
  { letter: "A", word: "Alfa", speechText: "Alfa", pronunciation: "AL-fah", color: "#9AD7FF" },
  { letter: "B", word: "Bravo", speechText: "Bravo", pronunciation: "BRAH-voh", color: "#8FD6D8" },
  { letter: "C", word: "Charlie", speechText: "Charlie", pronunciation: "CHAR-lee", color: "#C3B9FF" },
  { letter: "D", word: "Delta", speechText: "Delta", pronunciation: "DELL-tah", color: "#FFC1A6" },
  { letter: "E", word: "Echo", speechText: "Echo", pronunciation: "ECK-oh", color: "#FFE28C" },
  { letter: "F", word: "Foxtrot", speechText: "Foxtrot", pronunciation: "FOKS-trot", color: "#FBC0D6" },
  { letter: "G", word: "Golf", speechText: "Golf", pronunciation: "GOLF", color: "#ACF0C0" },
  { letter: "H", word: "Hotel", speechText: "Hotel", pronunciation: "hoh-TELL", color: "#FFB4AE" },
  { letter: "I", word: "India", speechText: "India", pronunciation: "IN-dee-ah", color: "#FFD9A8" },
  { letter: "J", word: "Juliett", speechText: "Juliet", pronunciation: "JEW-lee-ett", color: "#C9E9FF" },
  { letter: "K", word: "Kilo", speechText: "Kilo", pronunciation: "KEY-loh", color: "#FFEFA3" },
  { letter: "L", word: "Lima", speechText: "Lima", pronunciation: "LEE-mah", color: "#E4C9FF" },
  { letter: "M", word: "Mike", speechText: "Mike", pronunciation: "MIKE", color: "#FFB6B6" },
  { letter: "N", word: "November", speechText: "November", pronunciation: "no-VEM-ber", color: "#FFE3A4" },
  { letter: "O", word: "Oscar", speechText: "Oscar", pronunciation: "OSS-cah", color: "#C8F2D0" },
  { letter: "P", word: "Papa", speechText: "Papa", pronunciation: "pah-PAH", color: "#B5D8FF" },
  { letter: "Q", word: "Quebec", speechText: "keh beck", pronunciation: "keh-BECK", color: "#E8C7FF" },
  { letter: "R", word: "Romeo", speechText: "Romeo", pronunciation: "ROW-me-oh", color: "#FFB2B9" },
  { letter: "S", word: "Sierra", speechText: "Sierra", pronunciation: "see-AIR-ah", color: "#BEEBD5" },
  { letter: "T", word: "Tango", speechText: "Tango", pronunciation: "TANG-go", color: "#FFC9A8" },
  { letter: "U", word: "Uniform", speechText: "Uniform", pronunciation: "YOU-nee-form", color: "#B8E9FF" },
  { letter: "V", word: "Victor", speechText: "Victor", pronunciation: "VIK-tah", color: "#C4D4FF" },
  { letter: "W", word: "Whiskey", speechText: "Whiskey", pronunciation: "WISS-key", color: "#CFE0FF" },
  { letter: "X", word: "X-ray", speechText: "X-ray", pronunciation: "ECKS-ray", color: "#D5C7FF" },
  { letter: "Y", word: "Yankee", speechText: "Yankee", pronunciation: "YANG-key", color: "#FFD0AF" },
  { letter: "Z", word: "Zulu", speechText: "Zulu", pronunciation: "ZOO-loo", color: "#FFE6B3" },
];

/** @type {Partial<Record<string, import('../types').LetterEntry>>} */
export const LETTER_TO_ENTRY = Object.fromEntries(
  NATO_ALPHABET.map((e) => [e.letter, e])
);

/** @type {import('../types').DigitEntry[]} */
export const NATO_NUMBERS = [
  { digit: "0", word: "Zero", speechText: "Zero", pronunciation: "ZEE-roh", color: "#B8E9FF" },
  { digit: "1", word: "One", speechText: "One", pronunciation: "WUN", color: "#FFE28C" },
  { digit: "2", word: "Two", speechText: "Two", pronunciation: "TOO", color: "#C3B9FF" },
  { digit: "3", word: "Three", speechText: "tree", pronunciation: "TREE", color: "#ACF0C0" },
  { digit: "4", word: "Four", speechText: "fower", pronunciation: "FOW-er", color: "#FFC1A6" },
  { digit: "5", word: "Five", speechText: "fife", pronunciation: "FIFE", color: "#FFEFA3" },
  { digit: "6", word: "Six", speechText: "Six", pronunciation: "SIX", color: "#FFB6B6" },
  { digit: "7", word: "Seven", speechText: "Seven", pronunciation: "SEV-en", color: "#E4C9FF" },
  { digit: "8", word: "Eight", speechText: "Eight", pronunciation: "AIT", color: "#C8F2D0" },
  { digit: "9", word: "Nine", speechText: "niner", pronunciation: "NIN-er", color: "#B5D8FF" },
];

/** @type {Partial<Record<string, import('../types').DigitEntry>>} */
export const DIGIT_TO_ENTRY = Object.fromEntries(
  NATO_NUMBERS.map((e) => [e.digit, e])
);
