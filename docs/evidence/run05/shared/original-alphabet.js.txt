import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../src/context/ThemeContext";
import { NATO_ALPHABET } from "../src/data/natoData";
import { speak } from "../src/lib/speech";

export default function AlphabetScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Tap a card to hear the word.
      </Text>
      <ScrollView contentContainerStyle={styles.grid}>
        {NATO_ALPHABET.map((entry) => (
          <Pressable
            key={entry.letter}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: entry.color },
              pressed && styles.cardPressed,
            ]}
            onPress={() => speak(entry.word)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.letter}>{entry.letter}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.word}>{entry.word}</Text>
              <Text style={styles.pronunciation}>{entry.pronunciation}</Text>
            </View>
          </Pressable>
        ))}
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
  subtitle: {
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    width: 110,
    height: 150,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  cardHeader: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  letter: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1F2933',
    textAlign: 'center',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  word: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2933',
    textAlign: 'center',
    marginBottom: 6,
  },
  pronunciation: {
    fontSize: 11,
    fontWeight: '400',
    color: '#4A5568',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
