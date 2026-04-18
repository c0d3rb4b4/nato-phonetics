import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";

function MenuButton() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={() => router.push("/menu")}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={({ pressed }) => ({
        opacity: pressed ? 0.5 : 1,
        marginRight: 16,
        padding: 0,
      })}
    >
      <Ionicons name="menu" size={26} color={theme.colors.text} />
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
        headerShadowVisible: false,
        headerBackTitleVisible: false,
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

const styles = StyleSheet.create({
  // header icon is rendered inline; spacing handled on Pressable
});

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LayoutContent />
    </ThemeProvider>
  );
}
