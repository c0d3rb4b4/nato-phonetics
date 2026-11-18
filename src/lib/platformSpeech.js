import Tts from 'react-native-tts';
import { Platform } from 'react-native';
import { createNativeTtsAdapter } from './nativeTtsAdapter';

export const platformSpeech = createNativeTtsAdapter(Tts, Platform.OS === 'ios' ? 'ios' : 'android');
