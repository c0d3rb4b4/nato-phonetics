import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";

export async function speak(text) {
  return new Promise(async (resolve) => {
    try {
      // Load selected voice from storage
      const selectedVoice = await AsyncStorage.getItem('selectedVoice');
      
      const options = {
        language: "en-GB",
        onDone: resolve,
        onError: resolve, // Still resolve on error to continue the sequence
      };
      
      // Add voice if one is selected
      if (selectedVoice) {
        options.voice = selectedVoice;
      }
      
      Speech.speak(text, options);
    } catch (e) {
      console.log("Speak:", text);
      resolve();
    }
  });
}
