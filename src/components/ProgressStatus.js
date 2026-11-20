import { Button, Feedback } from './ui';
import { progressStore } from '../lib/progressStore';

/** @param {{progress: import('../lib/progress').ProgressSnapshot}} props */
export function ProgressStatus({ progress }) {
  return <>
    <Feedback message={progress.isLoading ? 'Loading saved progress…' : progress.isSaving ? 'Saving progress…' : null} />
    <Feedback error message={progress.error?.operation === 'clear' ? null : progress.error?.message} />
    {!!progress.pendingCount && <Feedback message={`${progress.pendingCount} unsaved answer${progress.pendingCount === 1 ? '' : 's'} held in memory.`} />}
    {progress.error && progress.error.operation !== 'clear' && <Button label="Retry progress storage" variant="secondary" disabled={progress.isLoading || progress.isSaving}
      onPress={() => { void progressStore.retry(); }} />}
  </>;
}
