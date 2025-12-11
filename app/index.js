import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../src/context/ThemeContext';

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();

  const menuItems = [
    {
      title: 'NATO Alphabet',
      icon: 'book-outline',
      route: '/alphabet',
      description: 'View the full A–Z list and tap to hear each word.',
      color: '#8B5CF6',
    },
    {
      title: 'Word Converter',
      icon: 'text-outline',
      route: '/converter',
      description: 'Type any word or phrase and see its NATO breakdown.',
      color: '#3B82F6',
    },
    {
      title: 'Letter Quiz',
      icon: 'help-circle-outline',
      route: '/letter-quiz',
      description: 'Test yourself with quick multiple-choice questions.',
      color: '#22C55E',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>NATO Phonetics</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Learn, convert, and quiz yourself on the NATO alphabet.
        </Text>
        
        {menuItems.map((item, index) => (
          <Pressable
            key={index}
            style={({ pressed }) => [
              styles.menuItem,
              { backgroundColor: theme.colors.surface },
              pressed && styles.menuItemPressed,
            ]}
            onPress={() => router.push(item.route)}
          >
            <View style={styles.menuItemContent}>
              <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.menuTitle, { color: theme.colors.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.menuDescription, { color: theme.colors.textSecondary }]}>
                  {item.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </View>
          </Pressable>
        ))}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>v1.0.0 • All processing on-device</Text>
          <Text style={[styles.footerTextMuted, { color: theme.colors.textSecondary }]}>
            NATO phonetic alphabet • British English
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  menuItem: {
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  menuItemPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 13,
  },
  footer: {
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
  },
  footerTextMuted: {
    fontSize: 10,
    marginTop: 2,
  },
});

