import AsyncStorage from '@react-native-async-storage/async-storage';
import { createProgressStore } from './progress';

// Import is side-effect free; hydration occurs in the hook after mount.
export const progressStore = createProgressStore(AsyncStorage);
