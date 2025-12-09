import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../src/context/ThemeContext";

export default function VoiceQuizScreen() {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Voice Quiz (Coming Soon)</Text>
      <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
        This screen will eventually let you say the NATO words out loud and use
        speech recognition to check your answer.
      </Text>
      <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
        For now, it's just a placeholder so we can design and test the rest of
        the app without any native speech-to-text setup.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    marginBottom: 8,
  },
});
