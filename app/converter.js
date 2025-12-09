import { Ionicons } from '@expo/vector-icons';
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SPACE_PAUSE_DURATION } from "../constants/speech";
import { useTheme } from "../src/context/ThemeContext";
import { DIGIT_TO_ENTRY, LETTER_TO_ENTRY } from "../src/data/natoData";
import { speak } from "../src/lib/speech";

export default function ConverterScreen() {
  const { theme } = useTheme();
  const [input, setInput] = useState("");

  const parts = [];
  const text = (input || "").toUpperCase();

  for (const ch of text) {
    if (ch === " ") {
      parts.push({ type: "space" });
    } else if (LETTER_TO_ENTRY[ch]) {
      parts.push({ type: "letter", entry: LETTER_TO_ENTRY[ch] });
    } else if (DIGIT_TO_ENTRY[ch]) {
      parts.push({ type: "number", entry: DIGIT_TO_ENTRY[ch] });
    } else {
      parts.push({ type: "unknown", char: ch });
    }
  }

  const handlePlayAll = async () => {
    for (const p of parts) {
      if (p.type === "letter" || p.type === "number") {
        await speak(p.entry.word);
      } else if (p.type === "space") {
        await new Promise(resolve => setTimeout(resolve, SPACE_PAUSE_DURATION));
      }
    }
  };

  const hasValidLetters = parts.some(p => p.type === "letter" || p.type === "number");

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={styles.inputSection}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Type a word or phrase:</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
          value={input}
          onChangeText={setInput}
          placeholder="Example: CV34 7AP"
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="characters"
        />
      </View>

      {hasValidLetters && (
        <Pressable
          style={({ pressed }) => [
            styles.playButton,
            { backgroundColor: theme.colors.primary },
            pressed && styles.playButtonPressed,
          ]}
          onPress={handlePlayAll}
        >
          <Ionicons name="play" size={20} color="#FFFFFF" />
          <Text style={styles.playButtonText}>Play Full Phrase</Text>
        </Pressable>
      )}

      <Text style={[styles.label, { color: theme.colors.text }]}>NATO Phonetic:</Text>
      <ScrollView style={styles.outputContainer} contentContainerStyle={styles.cardsGrid}>
        {parts.length === 0 ? (
          <Text style={[styles.placeholder, { color: theme.colors.textSecondary }]}>
            Cards will appear here as you type.
          </Text>
        ) : (
          <>
            {parts.map((p, idx) => {
              if (p.type === "space") {
                return (
                  <View key={idx} style={styles.spacer}>
                    <Text style={[styles.spacerText, { color: theme.colors.textSecondary }]}>SPACE</Text>
                  </View>
                );
              }
              if (p.type === "unknown") {
                return (
                  <View key={idx} style={[styles.unknownCard, { backgroundColor: theme.colors.surface, borderColor: '#EF4444' }]}>
                    <Text style={styles.unknownChar}>{p.char}</Text>
                    <Text style={[styles.unknownLabel, { color: theme.colors.textSecondary }]}>Unknown</Text>
                  </View>
                );
              }
              if (p.type === "letter") {
                const { letter, word, pronunciation, color } = p.entry;
                return (
                  <Pressable
                    key={idx}
                    style={({ pressed }) => [
                      styles.card,
                      { backgroundColor: color },
                      pressed && styles.cardPressed,
                    ]}
                    onPress={() => speak(word)}
                  >
                    <View style={styles.cardContent}>
                      <Text style={styles.cardWord}>{word}</Text>
                      <Text style={styles.cardPronunciation}>{pronunciation}</Text>
                    </View>
                    <View style={styles.cardLetter}>
                      <Text style={styles.cardLetterText}>{letter}</Text>
                    </View>
                  </Pressable>
                );
              }
              if (p.type === "number") {
                const { digit, word, pronunciation, color } = p.entry;
                return (
                  <Pressable
                    key={idx}
                    style={({ pressed }) => [
                      styles.card,
                      { backgroundColor: color },
                      pressed && styles.cardPressed,
                    ]}
                    onPress={() => speak(word)}
                  >
                    <View style={styles.cardContent}>
                      <Text style={styles.cardWord}>{word}</Text>
                      <Text style={styles.cardPronunciation}>{pronunciation}</Text>
                    </View>
                    <View style={styles.cardLetter}>
                      <Text style={styles.cardLetterText}>{digit}</Text>
                    </View>
                  </Pressable>
                );
              }
              return null;
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inputSection: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  playButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  outputContainer: {
    flex: 1,
    marginTop: 8,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 24,
  },
  placeholder: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  card: {
    width: 160,
    height: 70,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardWord: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2933',
    marginBottom: 2,
  },
  cardPronunciation: {
    fontSize: 10,
    fontWeight: '400',
    color: '#4A5568',
    fontStyle: 'italic',
  },
  cardLetter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  cardLetterText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2933',
  },
  spacer: {
    width: 80,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacerText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  unknownCard: {
    width: 160,
    height: 70,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  unknownChar: {
    fontSize: 24,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 2,
  },
  unknownLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
