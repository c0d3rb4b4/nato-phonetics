import { Icon } from './Icon';
import { useRouter } from '../navigation';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, findNodeHandle, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
 * label: string, variant?: 'primary' | 'secondary', selected?: boolean, compact?: boolean,
 * style?: import('react-native').StyleProp<import('react-native').ViewStyle>
 * }} props
 */
export function Button({ label, variant = 'primary', selected, disabled, compact, style, accessibilityLabel, accessibilityState, ...props }) {
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
    onFocus={event => { setFocused(compact ? showsFocusRing(event.currentTarget) : true); props.onFocus?.(event); }}
    onBlur={event => { setFocused(false); props.onBlur?.(event); }}
    style={({ pressed }) => [styles.button, compact && styles.compactButton, {
      backgroundColor: primary ? (pressed ? '#1E40AF' : theme.colors.primary) : pressed && compact ? theme.colors.card : theme.colors.surface,
      borderColor: focused && !compact ? theme.colors.text : (primary ? theme.colors.primary : theme.colors.border),
      borderWidth: focused && !compact ? 3 : 1,
    }, disabled && !(compact && primary) && { backgroundColor: theme.colors.card, borderColor: theme.colors.border }, style]}>
    <Text style={[styles.buttonLabel, { color: primary && (!disabled || compact) ? '#FFFFFF' : theme.colors.text }]}>{label}</Text>
    {compact && focused && <FocusRing color={theme.colors.text} />}
  </Pressable>;
}

/** @param {{label: string, children: import('react').ReactNode, style?: import('react-native').StyleProp<import('react-native').ViewStyle>}} props */
export function ChoiceGroup({ label, children, style }) {
  return <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.choices, style]}>{children}</View>;
}

/** @param {Omit<Parameters<typeof Button>[0], 'accessibilityRole' | 'accessibilityState' | 'compact' | 'variant'> & {selected: boolean}} props */
export function ChoiceButton({ selected, ...props }) {
  const keyboard = Platform.OS === 'web' && !props.disabled ? {
    /** @param {import('react').KeyboardEvent<HTMLElement>} event */
    onKeyDown(event) {
      // React Native Web handles Enter for radios but limits Space to buttons.
      if (event.key !== ' ') return;
      event.preventDefault();
      if (!event.repeat) event.currentTarget.click();
    },
  } : {};
  return <Button {...props} {...keyboard} compact variant={selected ? 'primary' : 'secondary'}
    accessibilityRole="radio" accessibilityState={{ checked: selected }} />;
}

/** @param {{children: import('react').ReactNode}} props */
export function SectionHeading({ children }) {
  const { theme } = useTheme();
  return <Text accessibilityRole="header" aria-level={2} style={[styles.sectionHeading, { color: theme.colors.text }]}>{children}</Text>;
}

/** @param {import('react-native').TextProps & {muted?: boolean}} props */
export function SupportingText({ muted = true, style, ...props }) {
  const { theme } = useTheme();
  return <Text {...props} style={[styles.supportingText, { color: muted ? theme.colors.textSecondary : theme.colors.text }, style]} />;
}

/** @param {import('react-native').TextInputProps} props */
export function TextField({ style, onFocus, onBlur, ...props }) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  return <TextInput placeholderTextColor={theme.colors.textSecondary} {...props}
    onFocus={event => { setFocused(true); onFocus?.(event); }}
    onBlur={event => { setFocused(false); onBlur?.(event); }}
    style={[styles.field, style, {
      backgroundColor: theme.colors.surface, borderColor: focused ? theme.colors.text : theme.colors.border, color: theme.colors.text,
    }]} />;
}

/** @param {{color: string}} props */
function FocusRing({ color }) {
  return <View pointerEvents="none" style={[styles.focusRing, { borderColor: color }]} />;
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
export function NavigationRow({ title, description, icon, route }) {
  const router = useRouter();
  return <DestinationRow title={title} description={description} icon={icon} onPress={() => router.push(route)} />;
}

/** @param {Omit<import('../types').NavigationItem, 'route'> & {onPress: () => void, url?: string}} props */
function DestinationRow({ title, description, icon, onPress, url }) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const webLink = Platform.OS === 'web' && url ? { href: url, hrefAttrs: { target: '_blank', rel: 'noopener noreferrer' } } : null;
  return <Pressable {...webLink} accessibilityRole={url ? 'link' : 'button'} accessibilityLabel={title} accessibilityHint={description}
    onPress={webLink ? undefined : onPress} onFocus={event => setFocused(showsFocusRing(event.currentTarget))} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.navigationRow, { backgroundColor: pressed ? theme.colors.card : theme.colors.surface,
      borderColor: theme.colors.border }]}>
    <Icon name={icon} size={22} color={theme.colors.text} />
    <View style={styles.navigationText}>
      <Text style={[styles.navigationTitle, { color: theme.colors.text }]}>{title}</Text>
      {description && <SupportingText>{description}</SupportingText>}
    </View>
    <Icon name="chevron-forward" size={18} color={theme.colors.text} />
    {focused && <FocusRing color={theme.colors.text} />}
  </Pressable>;
}

/** @param {Omit<import('../types').NavigationItem, 'route'> & {url: string}} props */
export function ExternalLink({ title, description, icon, url }) {
  const [error, setError] = useState('');
  return <View>
    <DestinationRow title={title} description={description} icon={icon} url={url}
      onPress={() => { setError(''); void Linking.openURL(url).catch(() => setError(`Unable to open this link. Visit ${url}`)); }} />
    <Feedback message={error} error />
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: 840, alignSelf: 'center', padding: 16, paddingBottom: 32, gap: 12 },
  heading: { fontSize: 26, fontWeight: '700', marginVertical: 8 },
  sectionHeading: { fontSize: 18, fontWeight: '700' },
  supportingText: { fontSize: 15, lineHeight: 22 },
  field: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, minHeight: 48 },
  button: { minHeight: 48, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  compactButton: { minWidth: 48, maxWidth: '100%', paddingHorizontal: 12, paddingVertical: 8 },
  buttonLabel: { fontSize: 16, fontWeight: '600', textAlign: 'center', flexShrink: 1, maxWidth: '100%' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  focusRing: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderRadius: 11, borderWidth: 2 },
  feedback: { fontSize: 16, lineHeight: 24, marginVertical: 8 },
  navigationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12, minHeight: 48 },
  navigationText: { flex: 1, minWidth: 0, gap: 2 },
  navigationTitle: { fontSize: 16, fontWeight: '600' },
});
