import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { router } from '../navigation';
import { Icon } from './Icon';
import { Button, Feedback, showsFocusRing } from './ui';

/** @typedef {ReturnType<typeof import('../hooks/usePlayback').usePlayback>} Playback */

/** @param {{audio: Pick<Playback, 'active' | 'stop'>, label: string, onPlay: () => void, onStop?: () => void,
 * active?: boolean, disabled?: boolean, testID?: string}} props */
export function PlaybackButton({ audio, label, onPlay, onStop = audio.stop, active = audio.active, disabled = false, testID }) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={active ? 'Stop playback' : label}
    accessibilityState={{ disabled }} disabled={disabled} onPress={active ? onStop : onPlay}
    onFocus={event => setFocused(showsFocusRing(event.currentTarget))} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.control, {
      backgroundColor: disabled ? theme.colors.surface : pressed ? '#1E40AF' : theme.colors.primary,
      borderColor: focused ? theme.colors.text : disabled ? theme.colors.border : 'transparent',
      borderWidth: focused ? 3 : 1,
    }]}>
    <Icon name={active ? 'stop' : 'play'} size={20} color={disabled ? theme.colors.textSecondary : '#FFFFFF'} />
  </Pressable>;
}

/** @param {{audio: Pick<Playback, 'result' | 'warning'>, showHelp?: boolean}} props */
export function PlaybackNotice({ audio, showHelp = true }) {
  const failure = audio.result?.status === 'failed' ? audio.result.error.message : null;
  const message = failure ?? audio.warning;
  return message ? <Notice key={message} message={message} error={!!failure} showHelp={!!failure && showHelp} /> : null;
}

/** @param {{message: string, error: boolean, showHelp: boolean}} props */
function Notice({ message, error, showHelp }) {
  const { theme } = useTheme();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return <View pointerEvents="box-none" style={styles.noticePosition}>
    <View style={[styles.notice, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Feedback message={message} error={error} />
      <View style={styles.noticeActions}>
        {showHelp && <Button label="Audio Help" variant="secondary" onPress={() => { setDismissed(true); router.push('/audio-help'); }} />}
        <Button label="Dismiss" variant="secondary" onPress={() => setDismissed(true)} />
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  control: { width: 48, height: 48, flexShrink: 0, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  noticePosition: { position: 'absolute', left: 16, right: 16, bottom: 12, alignItems: 'center', zIndex: 20 },
  notice: { width: '100%', maxWidth: 480, borderWidth: 1, borderRadius: 12, padding: 12 },
  noticeActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
});
