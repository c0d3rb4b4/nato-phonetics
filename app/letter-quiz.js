import { useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../src/context/ThemeContext";
import { NATO_ALPHABET } from "../src/data/natoData";
import { QUIZ_DISTRACTORS } from "../src/data/quizDistractors";
import { speak } from "../src/lib/speech";

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function createQuestion() {
  const correctIndex = randomInt(NATO_ALPHABET.length);
  const correct = NATO_ALPHABET[correctIndex];

  // Generate 3 random distractors for this letter
  const distractors = generateDistractors(correct);
  
  // Combine correct answer with distractors
  const allOptions = [correct.word, ...distractors];
  
  // Shuffle the options
  allOptions.sort(() => Math.random() - 0.5);

  return { correct, options: allOptions };
}

function generateDistractors(correct) {
  const letter = correct.letter;
  const pool = QUIZ_DISTRACTORS[letter] || [];
  
  // Filter out the correct word if it's in the pool
  const available = pool.filter(w => w !== correct.word);
  
  // Pick 3 random distractors
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

export default function LetterQuizScreen() {
  const { theme } = useTheme();
  const [question, setQuestion] = useState(() => createQuestion());
  const [result, setResult] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.48, 0.5, 1],
    outputRange: [1, 0.7, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.52, 1],
    outputRange: [0, 0, 0.7, 1],
  });

  const frontScale = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.97, 0.95],
  });

  const backScale = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.95, 0.97, 1],
  });

  const frontAnimatedStyle = {
    opacity: frontOpacity,
    transform: [{ scale: frontScale }],
  };

  const backAnimatedStyle = {
    opacity: backOpacity,
    transform: [{ scale: backScale }],
  };

  const handleSelect = (word) => {
    const isCorrect = word === question.correct.word;
    setSelectedOption(word);
    setResult(isCorrect ? "correct" : "wrong");

    // Flip card animation for both correct and wrong answers (eased)
    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 700,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsFlipped(true);
      speak(question.correct.word);
    });

    setTimeout(() => {
      setResult(null);
      setSelectedOption(null);
      setIsFlipped(false);
      flipAnim.setValue(0);
      setQuestion(createQuestion());
    }, isCorrect ? 2000 : 2500);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.prompt, { color: theme.colors.text }]}>
        What is the NATO word for this letter?
      </Text>

      {/* Trading Card with Flip Animation */}
      <View style={styles.cardContainer}>
        <View style={styles.cardInner}>
          <Animated.View style={[styles.cardWrapper, frontAnimatedStyle]}>
            <View
              style={[
                styles.cardFace,
                { backgroundColor: question.correct.color },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.letter}>{question.correct.letter}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.wordCensored}>******</Text>
                <Text style={styles.pronunciationCensored}>***</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.cardWrapper, styles.cardBack, backAnimatedStyle]}>
            <View
              style={[
                styles.cardFace,
                { backgroundColor: question.correct.color },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.letter}>{question.correct.letter}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.wordRevealed}>{question.correct.word}</Text>
                <Text style={styles.pronunciation}>{question.correct.pronunciation}</Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </View>

      {/* Multiple Choice Options */}
      <View style={styles.options}>
        {question.options.map((word, index) => {
          const isSelected = selectedOption === word;
          const isCorrect = word === question.correct.word;
          const showCorrect = result === "correct" && isCorrect;
          const showWrong = result === "wrong" && isSelected;

          return (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.option,
                { backgroundColor: theme.colors.surface },
                showCorrect && styles.optionCorrect,
                showWrong && styles.optionWrong,
                pressed && !result && styles.optionPressed,
              ]}
              onPress={() => !result && handleSelect(word)}
              disabled={!!result}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: theme.colors.text },
                  showCorrect && styles.optionTextCorrect,
                  showWrong && styles.optionTextWrong,
                ]}
              >
                {word}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {result === "correct" && (
        <Text style={[styles.feedback, styles.correct]}>✓ Correct!</Text>
      )}
      {result === "wrong" && (
        <Text style={[styles.feedback, styles.wrong]}>
          ✗ Not quite. The answer was "{question.correct.word}"
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  prompt: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  cardContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  cardInner: {
    width: 180,
    height: 240,
    position: 'relative',
  },
  cardWrapper: {
    width: 180,
    height: 240,
    position: 'absolute',
  },
  cardFace: {
    width: 180,
    height: 240,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    overflow: "hidden",
  },
  cardFront: {
  },
  cardBack: {
  },
  cardHeader: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "rgba(0, 0, 0, 0.15)",
  },
  letter: {
    fontSize: 64,
    fontWeight: "900",
    color: "#1F2933",
  },
  cardBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  wordCensored: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2933",
    marginBottom: 8,
    letterSpacing: 2,
  },
  pronunciationCensored: {
    fontSize: 13,
    fontWeight: "400",
    color: "#4A5568",
    letterSpacing: 2,
  },
  wordRevealed: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2933",
    marginBottom: 8,
  },
  pronunciation: {
    fontSize: 13,
    fontWeight: "400",
    color: "#4A5568",
    fontStyle: "italic",
  },
  options: {
    gap: 10,
  },
  option: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  optionPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  optionCorrect: {
    backgroundColor: "#D1FAE5",
    borderWidth: 2,
    borderColor: "#10B981",
  },
  optionWrong: {
    backgroundColor: "#FEE2E2",
    borderWidth: 2,
    borderColor: "#EF4444",
  },
  optionText: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  optionTextCorrect: {
    color: "#065F46",
  },
  optionTextWrong: {
    color: "#991B1B",
  },
  feedback: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  correct: {
    color: "#16A34A",
  },
  wrong: {
    color: "#EF4444",
  },
});
