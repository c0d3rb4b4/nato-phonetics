export const NATO_ALPHABET = [
  { letter: "A", word: "Alfa", pronunciation: "AL-fah", color: "#9AD7FF" },
  { letter: "B", word: "Bravo", pronunciation: "BRAH-voh", color: "#8FD6D8" },
  { letter: "C", word: "Charlie", pronunciation: "CHAR-lee", color: "#C3B9FF" },
  { letter: "D", word: "Delta", pronunciation: "DELL-tah", color: "#FFC1A6" },
  { letter: "E", word: "Echo", pronunciation: "ECK-oh", color: "#FFE28C" },
  { letter: "F", word: "Foxtrot", pronunciation: "FOKS-trot", color: "#FBC0D6" },
  { letter: "G", word: "Golf", pronunciation: "GOLF", color: "#ACF0C0" },
  { letter: "H", word: "Hotel", pronunciation: "hoh-TELL", color: "#FFB4AE" },
  { letter: "I", word: "India", pronunciation: "IN-dee-ah", color: "#FFD9A8" },
  { letter: "J", word: "Juliet", pronunciation: "JEW-lee-ett", color: "#C9E9FF" },
  { letter: "K", word: "Kilo", pronunciation: "KEY-loh", color: "#FFEFA3" },
  { letter: "L", word: "Lima", pronunciation: "LEE-mah", color: "#E4C9FF" },
  { letter: "M", word: "Mike", pronunciation: "MIKE", color: "#FFB6B6" },
  { letter: "N", word: "November", pronunciation: "no-VEM-ber", color: "#FFE3A4" },
  { letter: "O", word: "Oscar", pronunciation: "OSS-cah", color: "#C8F2D0" },
  { letter: "P", word: "Papa", pronunciation: "pah-PAH", color: "#B5D8FF" },
  { letter: "Q", word: "Quebec", pronunciation: "keh-BECK", color: "#E8C7FF" },
  { letter: "R", word: "Romeo", pronunciation: "ROW-me-oh", color: "#FFB2B9" },
  { letter: "S", word: "Sierra", pronunciation: "see-AIR-ah", color: "#BEEBD5" },
  { letter: "T", word: "Tango", pronunciation: "TANG-go", color: "#FFC9A8" },
  { letter: "U", word: "Uniform", pronunciation: "YOU-nee-form", color: "#B8E9FF" },
  { letter: "V", word: "Victor", pronunciation: "VIK-tah", color: "#C4D4FF" },
  { letter: "W", word: "Whiskey", pronunciation: "WISS-key", color: "#CFE0FF" },
  { letter: "X", word: "X-ray", pronunciation: "ECKS-ray", color: "#D5C7FF" },
  { letter: "Y", word: "Yankee", pronunciation: "YANG-key", color: "#FFD0AF" },
  { letter: "Z", word: "Zulu", pronunciation: "ZOO-loo", color: "#FFE6B3" },
];

export const LETTER_TO_ENTRY = Object.fromEntries(
  NATO_ALPHABET.map((e) => [e.letter, e])
);

export const NATO_NUMBERS = [
  { digit: "0", word: "Zero", pronunciation: "ZEE-roh", color: "#B8E9FF" },
  { digit: "1", word: "One", pronunciation: "WUN", color: "#FFE28C" },
  { digit: "2", word: "Two", pronunciation: "TOO", color: "#C3B9FF" },
  { digit: "3", word: "Three", pronunciation: "TREE", color: "#ACF0C0" },
  { digit: "4", word: "Four", pronunciation: "FOW-er", color: "#FFC1A6" },
  { digit: "5", word: "Five", pronunciation: "FIFE", color: "#FFEFA3" },
  { digit: "6", word: "Six", pronunciation: "SIX", color: "#FFB6B6" },
  { digit: "7", word: "Seven", pronunciation: "SEV-en", color: "#E4C9FF" },
  { digit: "8", word: "Eight", pronunciation: "AIT", color: "#C8F2D0" },
  { digit: "9", word: "Nine", pronunciation: "NIN-er", color: "#B5D8FF" },
];

export const DIGIT_TO_ENTRY = Object.fromEntries(
  NATO_NUMBERS.map((e) => [e.digit, e])
);
