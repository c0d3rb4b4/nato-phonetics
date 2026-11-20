import { router } from '../navigation';
import { View } from 'react-native';
import { Button, Feedback } from './ui';

/** @param {{audio: ReturnType<typeof import('../hooks/usePlayback').usePlayback>}} props */
export function PlaybackStatus({ audio }) {
  const { active, snapshot, result, warning } = audio;
  return <View style={{ gap: 8, marginVertical: 8 }}>
    {active && <>
      <Feedback message={snapshot.status === 'preparing' ? 'Preparing audio…' : `Playing ${snapshot.tokenIndex + 1} of ${snapshot.tokenCount}`} />
      <Button label="Stop playback" variant="secondary" onPress={audio.stop} />
    </>}
    {warning && <Feedback message={warning} />}
    {result?.status === 'failed' && <>
      <Feedback error message={result.error.message} />
      <Button label="Audio Help" variant="secondary" onPress={() => router.push('/audio-help')} />
    </>}
  </View>;
}
