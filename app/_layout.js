import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable } from "react-native";
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";

function MenuButton() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={() => router.push("/menu")}
      style={({ pressed }) => ({
        marginRight: 15,
        opacity: pressed ? 0.5 : 1,
      })}
    >
      <Ionicons name="menu" size={28} color={theme.colors.text} />
    </Pressable>
  );
}

function LayoutContent() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Home",
          headerRight: () => <MenuButton /> 
        }} 
      />
      <Stack.Screen 
        name="alphabet" 
        options={{ 
          title: "NATO Alphabet",
          headerRight: () => <MenuButton /> 
        }} 
      />
      <Stack.Screen 
        name="converter" 
        options={{ 
          title: "Word Converter",
          headerRight: () => <MenuButton /> 
        }} 
      />
      <Stack.Screen 
        name="letter-quiz" 
        options={{ 
          title: "Letter Quiz",
          headerRight: () => <MenuButton /> 
        }} 
      />
      <Stack.Screen 
        name="menu" 
        options={{ 
          title: "Menu",
          headerRight: undefined
        }} 
      />
      <Stack.Screen 
        name="settings" 
        options={{ 
          title: "Settings",
          headerRight: undefined
        }} 
      />
      <Stack.Screen 
        name="about" 
        options={{ 
          title: "About",
          headerRight: undefined
        }} 
      />
      <Stack.Screen 
        name="voice-select" 
        options={{ 
          title: "Select Voice",
          headerRight: undefined
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LayoutContent />
    </ThemeProvider>
  );
}
