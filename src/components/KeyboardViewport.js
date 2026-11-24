import { KeyboardAvoidingView, Platform } from 'react-native';

/** @param {{children: import('react').ReactNode, tabs: import('react').ReactNode}} props */
export function KeyboardViewport({ children, tabs }) {
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    {children}
    {tabs}
  </KeyboardAvoidingView>;
}
