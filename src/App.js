import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AlphabetScreen from "./src/screens/AlphabetScreen";
import ConverterScreen from "./src/screens/ConverterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import LetterQuizScreen from "./src/screens/LetterQuizScreen";
import VoiceQuizScreen from "./src/screens/VoiceQuizScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Alphabet"
          component={AlphabetScreen}
          options={{ title: "NATO Alphabet" }}
        />
        <Stack.Screen
          name="Converter"
          component={ConverterScreen}
          options={{ title: "Word Converter" }}
        />
        <Stack.Screen
          name="LetterQuiz"
          component={LetterQuizScreen}
          options={{ title: "Letter Quiz" }}
        />
        <Stack.Screen
          name="VoiceQuiz"
          component={VoiceQuizScreen}
          options={{ title: "Voice Quiz" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
