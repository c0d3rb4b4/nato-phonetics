import { Icon } from './Icon';
import { useRouter } from '../navigation';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, findNodeHandle, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/** @param {import('react-native').ScrollViewProps & {overlay?: import('react').ReactNode}} props */
export function Screen({ children, contentContainerStyle, overlay, ...props }) {
  const content = <ScrollView testID="screen-scroll" keyboardShouldPersistTaps="handled" style={styles.screen} {...props}
    contentContainerStyle={[styles.content, contentContainerStyle]}>{children}</ScrollView>;
  return overlay ? <View style={styles.screen}>{content}{overlay}</View> : content;
}

/** @param {unknown} target */
export function showsFocusRing(target) {
  return Platform.OS !== 'web' || (target instanceof HTMLElement && target.matches(':focus-visible'));
}

/**
 * @param {Omit<import('react-native').PressableProps, 'style'> & {
 * label: string, variant?: 'primary' | 'secondary', selected?: boolean,
 * style?: import('react-native').StyleProp<import('react-native').ViewStyle>
 * }} props
 */
export function Button({ label, variant = 'primary', selected, disabled, style, accessibilityLabel, accessibilityState, ...props }) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const primary = variant === 'primary';
  return <Pressable {...props} disabled={disabled} accessibilityRole={props.accessibilityRole ?? 'button'}
    accessibilityLabel={accessibilityLabel ?? label}
    aria-pressed={props.accessibilityRole === 'radio' ? undefined : selected}
    aria-checked={props.accessibilityRole === 'radio' ? !!accessibilityState?.checked : undefined}
    aria-disabled={!!disabled}
    aria-expanded={accessibilityState?.expanded}
    accessibilityState={{ ...accessibilityState, disabled: !!disabled, ...(selected === undefined ? {} : { selected }) }}
    onFocus={event => { setFocused(true); props.onFocus?.(event); }}
    onBlur={event => { setFocused(false); props.onBlur?.(event); }}
    style={({ pressed }) => [styles.button, {
      backgroundColor: primary ? (pressed ? '#1E40AF' : theme.colors.primary) : theme.colors.surface,
      borderColor: focused ? theme.colors.text : (primary ? theme.colors.primary : theme.colors.border),
      borderWidth: focused ? 3 : 1,
    }, disabled && { backgroundColor: theme.colors.card, borderColor: theme.colors.border }, style]}>
    <Text style={[styles.buttonLabel, { color: primary && !disabled ? '#FFFFFF' : theme.colors.text }]}>{label}</Text>
  </Pressable>;
}

/** @param {{ children: import('react').ReactNode, focusKey?: string | number, testID?: string }} props */
export function Heading({ children, focusKey, testID }) {
  const { theme } = useTheme();
  const ref = useRef(/** @type {Text | null} */ (null));
  useEffect(() => {
    if (focusKey === undefined) return;
    const frame = requestAnimationFrame(() => {
      if (Platform.OS === 'web') {
        // Text is a DOM node on web. A negative tab index permits programmatic
        // focus without adding an extra stop to ordinary keyboard navigation.
        const node = /** @type {unknown} */ (ref.current);
        if (node instanceof HTMLElement) { node.setAttribute('tabindex', '-1'); node.focus(); node.scrollIntoView({ block: 'nearest' }); }
      } else if (ref.current) {
        const node = findNodeHandle(ref.current);
        if (node !== null) AccessibilityInfo.setAccessibilityFocus(node);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [focusKey]);
  return <Text ref={ref} testID={testID} accessibilityRole="header" accessible
    style={[styles.heading, { color: theme.colors.text }]}>{children}</Text>;
}

/** @param {{ message?: string | null, error?: boolean }} props */
export function Feedback({ message, error = false }) {
  const { theme } = useTheme();
  useEffect(() => {
    if (message && Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(message);
  }, [message]);
  if (!message) return null;
  return <Text accessibilityRole={error ? 'alert' : undefined} accessibilityLiveRegion={error ? 'assertive' : 'polite'}
    aria-live={error ? 'assertive' : 'polite'} style={[styles.feedback, { color: theme.colors.text }]}>{message}</Text>;
}

/** @param {import('../types').NavigationItem} props */
export function NavigationCard({ title, description, icon, route }) {
  const { theme } = useTheme();
  const router = useRouter();
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityHint={description}
    onPress={() => router.push(route)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.navigationCard, { backgroundColor: pressed ? theme.colors.card : theme.colors.surface,
      borderColor: focused ? theme.colors.text : theme.colors.border, borderWidth: focused ? 3 : 1 }]}>
    <Icon name={icon} size={26} color={theme.colors.text} />
    <View style={styles.navigationText}>
      <Text style={[styles.navigationTitle, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{description}</Text>
    </View>
    <Icon name="chevron-forward" size={20} color={theme.colors.text} />
  </Pressable>;
}

/** @param {{label: string, url: string}} props */
export function ExternalLink({ label, url }) {
  const [error, setError] = useState('');
  return <View>
    <Button label={label} variant="secondary" accessibilityRole="link" accessibilityHint="Opens in your browser"
      onPress={() => { setError(''); void Linking.openURL(url).catch(() => setError(`Unable to open this link. Visit ${url}`)); }} />
    <Feedback message={error} error />
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: 840, alignSelf: 'center', padding: 16, paddingBottom: 32, gap: 12 },
  heading: { fontSize: 26, fontWeight: '700', marginVertical: 8 },
  button: { minHeight: 48, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  buttonLabel: { fontSize: 16, fontWeight: '600', textAlign: 'center', flexShrink: 1, maxWidth: '100%' },
  feedback: { fontSize: 16, lineHeight: 24, marginVertical: 8 },
  navigationCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, padding: 16, minHeight: 72 },
  navigationText: { flex: 1 },
  navigationTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  description: { fontSize: 15, lineHeight: 22 },
});
