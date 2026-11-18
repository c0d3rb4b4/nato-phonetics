import AsyncStorage from '@react-native-async-storage/async-storage';
import { createPreferenceStore } from './preferences';

// Shared by React and speech. No storage is read at module import / static export.
export const preferenceStore = createPreferenceStore(AsyncStorage);
