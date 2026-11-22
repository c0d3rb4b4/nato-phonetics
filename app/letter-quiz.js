import { useCallback, useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { entrySymbol, PRACTICE_SETS, practiceExampleOutput, practiceLengths } from '../src/lib/practiceSets';
import { PlaybackButton, PlaybackNotice } from '../src/components/PlaybackControls';
import { NatoTile, TileGrid } from '../src/components/NatoTile';
import { Button, ChoiceButton, ChoiceGroup, Feedback, Heading, NavigationRow, Screen, SectionHeading, SupportingText, TextField } from '../src/components/ui';
import { useTheme } from '../src/context/ThemeContext';
import { usePlayback } from '../src/hooks/usePlayback';
import { useFocusEffect } from '../src/navigation';
import {
  cancelQuizSession, createQuizSession, currentQuizQuestion, DEFAULT_QUIZ_SESSION_LENGTH,
  nextQuizQuestion, quizActionGuard, quizSessionResults,
  restartQuizSession, retryQuizMistakes, submitQuizAnswer, QUIZ_MODES, MAX_RECALL_ANSWER_LENGTH,
} from '../src/lib/quizSession';
import { normalizeAnswerKey } from '../src/lib/questions';
import { useProgress } from '../src/hooks/useProgress';
import { progressStore } from '../src/lib/progressStore';
import { selectProgressSymbols } from '../src/lib/progress';
import { ProgressStatus } from '../src/components/ProgressStatus';

const REVIEW_SCOPES = /** @type {const} */ ([
  { id: 'all', label: 'Full symbol set' }, { id: 'due', label: 'Due review' }, { id: 'mistakes', label: 'Focus on mistakes' },
]);

export default function LetterQuizScreen() {
  const { theme } = useTheme();
  const audio = usePlayback('letter-quiz');
  const progress = useProgress();
  const [scope, setScope] = useState(/** @type {'all'|'due'|'mistakes'} */ ('all'));
  const [practice, setPractice] = useState(PRACTICE_SETS[0]);
  const [roundPractice, setRoundPractice] = useState(PRACTICE_SETS[0]);
  const [length, setLength] = useState(DEFAULT_QUIZ_SESSION_LENGTH);
  const [session, setSession] = useState(/** @type {import('../src/lib/quizSession').QuizSession | null} */ (null));
  const [choosing, setChoosing] = useState(true);
  const [mode, setMode] = useState(/** @type {import('../src/lib/quizSession').QuizMode} */ ('choice'));
  const [typedAnswer, setTypedAnswer] = useState('');
  const [answerError, setAnswerError] = useState('');
  const [showCodeWord, setShowCodeWord] = useState(false);
  const current = useRef(session);
  const focused = useRef(false);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    // Navigation retains the round/recap; usePlayback releases owned audio.
    return () => { focused.current = false; };
  }, []));

  /** Commit synchronously so rapid taps cannot submit or advance twice.
   * Every rendered handler carries the engine's opaque question/revision guard.
   * @param {import('../src/lib/quizSession').QuizSession} next */
  const commit = next => { current.current = next; setSession(next); };
  const question = session && currentQuizQuestion(session);
  const guard = session && quizActionGuard(session);
  const results = session && quizSessionResults(session);
  const finished = session?.phase === 'complete' || session?.phase === 'cancelled';
  const attempt = session?.attempts[session.index];
  const feedback = session?.phase === 'feedback';
  const textStyle = [styles.body, { color: theme.colors.text }];
  const clearResponse = () => { setTypedAnswer(''); setAnswerError(''); setShowCodeWord(false); };
  const reviewSymbols = selectProgressSymbols(progress.data, practice.symbols, scope, progress.now);
  const effectiveLength = scope === 'all' ? length : Math.min(length, reviewSymbols.length);

  const start = () => {
    if (!focused.current || current.current !== session) return;
    if (!reviewSymbols.length || (scope !== 'all' && progress.isLoading)) return;
    audio.stop();
    commit(session ? restartQuizSession(session, { length: effectiveLength, symbols: reviewSymbols, mode }) : createQuizSession({ length: effectiveLength, symbols: reviewSymbols, mode }));
    clearResponse();
    setRoundPractice(practice);
    setChoosing(false);
  };

  /** @param {string} word */
  const select = word => {
    if (!focused.current || !current.current) return;
    const next = submitQuizAnswer(current.current, guard, word);
    if (next === current.current) return;
    Keyboard.dismiss();
    commit(next);
    const savedAttempt = next.attempts[next.attempts.length - 1];
    void progressStore.record(savedAttempt.questionId, savedAttempt.symbol, savedAttempt.correct);
    if (question) void audio.play([{ text: question.correct.speechText }]);
  };
  const advance = () => {
    if (!focused.current || !current.current) return;
    const next = nextQuizQuestion(current.current, guard);
    if (next === current.current) return;
    audio.stop();
    commit(next);
    clearResponse();
  };
  const playQuestion = () => {
    if (question && focused.current && current.current === session) {
      void audio.play([{ text: question.correct.speechText }]);
    }
  };

  return <Screen overlay={<PlaybackNotice audio={audio} />}>
    {finished && results && <View testID="quiz-results" style={styles.section}>
      <Heading focusKey={`${session.generation}-${session.phase}`}>{session.phase === 'complete' ? 'Round complete' : 'Round ended early'}</Heading>
      <Text style={textStyle}>{roundPractice.label}{roundPractice.example ? ` · ${roundPractice.example}` : ''}</Text>
      <Text style={textStyle}>{QUIZ_MODES.find(item => item.id === session.mode)?.label}</Text>
      <Text style={textStyle} testID="quiz-score">{results.correct} correct of {results.answered} answered · {Math.round(results.accuracyPercent)}% accuracy</Text>
      <Text style={textStyle}>{results.answered} of {results.total} {results.total === 1 ? 'question' : 'questions'} answered.</Text>
      <SectionHeading>Missed answers</SectionHeading>
      {results.missed.length ? results.missed.map((miss, index) => <Text key={`${miss.symbol}-${index}`} style={textStyle}>
        {session.mode === 'listening' ? `Expected symbol: ${miss.expected}` : `${miss.symbol} is ${miss.expected}`}. Your answer: {miss.answer}.
      </Text>) : <Text style={textStyle}>{results.answered ? 'No missed answers.' : 'No answers submitted.'}</Text>}
      {session.phase === 'complete' && results.missed.length > 0 && <Button label="Retry Mistakes" testID="quiz-retry" onPress={() => {
        if (!focused.current || current.current !== session) return;
        const retry = retryQuizMistakes(session);
        if (retry) { audio.stop(); commit(retry); clearResponse(); setChoosing(false); }
      }} />}
      {!choosing && <Button label="Choose a new round" onPress={() => setChoosing(true)} />}
    </View>}
    {choosing ? <>
      <Heading focusKey={finished ? undefined : 'setup'}>Letter and digit practice</Heading>
      <View style={styles.setupSection}>
        <SectionHeading>Answer mode</SectionHeading>
        <ChoiceGroup label="Answer mode">
          {QUIZ_MODES.map(item => <ChoiceButton key={item.id} label={item.label} testID={`mode-${item.id}`} selected={mode === item.id}
            onPress={() => { audio.stop(); setMode(/** @type {import('../src/lib/quizSession').QuizMode} */ (item.id)); }} />)}
        </ChoiceGroup>
        {mode === 'listening' && <SupportingText>Play a code word, then choose its letter or digit. Replay or show the code word as text whenever you need it. No microphone is used.</SupportingText>}
        {mode === 'typed' && <SupportingText>Type the canonical code word for the symbol. Case, accents, spaces and punctuation are ignored. Alpha and Juliet are accepted. Pronunciation guides are not alternative answers.</SupportingText>}
      </View>
      <View style={styles.setupSection}>
        <SectionHeading>Symbols</SectionHeading>
        <ChoiceGroup label="Symbols">
          {PRACTICE_SETS.map(set => <ChoiceButton key={set.id} label={set.label} testID={`practice-${set.id}`} selected={practice === set}
            onPress={() => { audio.stop(); setPractice(set); setLength(Math.min(DEFAULT_QUIZ_SESSION_LENGTH, set.symbols.length)); }} />)}
        </ChoiceGroup>
        {practice.example && <>
          <SupportingText>Example: {practice.example}. The round shuffles its {practice.symbols.length} distinct symbols. Play the complete example in its original order.</SupportingText>
          <View style={styles.audioRow}>
            <PlaybackButton audio={audio} label="Hear example"
              onPlay={() => { void audio.play(practiceExampleOutput(practice).speech); }} />
            <SupportingText muted={false} style={styles.fill} testID="practice-example-text">{practiceExampleOutput(practice).text}</SupportingText>
          </View>
        </>}
      </View>
      <View style={styles.setupSection}>
        <SectionHeading>Review</SectionHeading>
        <ChoiceGroup label="Review">
          {REVIEW_SCOPES.map(item => <ChoiceButton key={item.id} label={item.label} testID={`review-${item.id}`} selected={scope === item.id}
            onPress={() => { audio.stop(); setScope(item.id); }} />)}
        </ChoiceGroup>
        {scope === 'due' && <SupportingText>Review previously practised symbols whose review time has arrived.</SupportingText>}
        {scope === 'mistakes' && <SupportingText>Review symbols whose last saved answer was incorrect.</SupportingText>}
        <SupportingText muted={false} testID="review-availability">{scope === 'all' ? `${practice.symbols.length} symbols in full practice.`
          : progress.isLoading ? 'Loading review symbols…' : progress.error?.operation === 'load' ? 'Saved progress is unavailable. Retry progress storage or choose Full symbol set.'
            : `${reviewSymbols.length} saved symbols available. ${!reviewSymbols.length ? 'Choose Full symbol set to practise now.' : 'This round uses each selected symbol at most once.'}`}</SupportingText>
      </View>
      <View style={styles.setupSection}>
        <SectionHeading>Round length</SectionHeading>
        <ChoiceGroup label="Round length">
          {practiceLengths(practice).map(count => <ChoiceButton key={count} label={`${count} questions`}
            selected={length === count} onPress={() => setLength(count)} />)}
        </ChoiceGroup>
        <SupportingText>{scope === 'all' ? `Each of the ${practice.symbols.length} symbols appears once before the deck repeats.` : `Up to ${length} questions, ${effectiveLength} in this review.`}</SupportingText>
      </View>
      <Button label={session ? 'Start new round' : 'Start round'} testID="quiz-start" disabled={!reviewSymbols.length || (scope !== 'all' && progress.isLoading)} onPress={start} />
    </> : question && session && <>
      <Heading focusKey={`${session.generation}-${session.index}`} testID="quiz-prompt">{session.mode === 'listening'
        ? 'Which symbol matches this code word?' : session.mode === 'typed' ? 'Type the code word for this symbol.' : 'What is the phonetic word for this symbol?'}</Heading>
      <Text style={textStyle} testID="quiz-progress">Question {session.index + 1} of {session.length} · {results?.correct} correct</Text>
      {(session.mode !== 'listening' || feedback) && <TileGrid>
        <NatoTile entry={question.correct} concealed={!feedback} testID="quiz-card"
          symbolTestID="quiz-letter" bodyTestID={feedback ? 'quiz-answer' : undefined} />
      </TileGrid>}
      {session.mode === 'listening' && !feedback && <>
        <View style={styles.audioRow}>
          <PlaybackButton audio={audio} label="Play code word" testID="quiz-listen" onPlay={playQuestion} />
          <Button style={styles.fill} label="Show code word as text" variant="secondary"
            accessibilityState={{ expanded: showCodeWord }} onPress={() => setShowCodeWord(true)} />
        </View>
        {showCodeWord && <Text testID="quiz-code-word" style={textStyle} accessibilityLiveRegion="polite" aria-live="polite">{question.correct.word}</Text>}
        <Text style={textStyle}>Replay with Play code word. If audio is unavailable, use the text alternative; it counts toward the same practice score.</Text>
      </>}
      {!feedback && session.mode !== 'typed' && <Text style={textStyle}>Choose an answer below.</Text>}
      {session.mode === 'typed' ? <>
        {!feedback && <>
          <TextField testID="quiz-typed-answer" accessibilityLabel="Your code word" value={typedAnswer}
            onChangeText={value => { setTypedAnswer(value); setAnswerError(''); }} maxLength={MAX_RECALL_ANSWER_LENGTH}
            autoCorrect={false} spellCheck={false} autoCapitalize="none" autoComplete="off" returnKeyType="done"
            placeholder="Code word"
            onSubmitEditing={() => { if (normalizeAnswerKey(typedAnswer)) select(typedAnswer); else setAnswerError('Enter a code word before checking.'); }} />
          <Button label="Check answer" testID="quiz-check" onPress={() => {
            if (normalizeAnswerKey(typedAnswer)) select(typedAnswer); else setAnswerError('Enter a code word before checking.');
          }} />
          <Feedback message={answerError} error />
        </>}
        {feedback && <Text style={textStyle} testID="quiz-submitted-answer">Your answer: {attempt?.answer}</Text>}
      </> : <View style={styles.section}>
        {question.options.map((word, index) => <Button key={`${question.id.symbol}-${word}`} testID={`quiz-choice-${index}`}
          label={`${word}${attempt?.answer === word ? ' · Your answer' : ''}`} accessibilityLabel={`Choose ${word}`}
          variant="secondary" selected={attempt?.answer === word} disabled={feedback} onPress={() => select(word)} />)}
      </View>}
      {feedback && <>
        <Feedback message={`${attempt?.correct ? 'Correct!' : 'Not quite.'} ${entrySymbol(question.correct)} is ${question.correct.word}.`} />
        <View style={styles.audioRow}>
          <Button style={styles.fill} label={session.index + 1 === session.length ? 'View results' : 'Next question'}
            testID="quiz-next" onPress={advance} />
          <PlaybackButton audio={audio} label="Replay answer" onPlay={playQuestion} />
        </View>
      </>}
      <Button label="End round and review" variant="secondary" onPress={() => {
        if (!focused.current || current.current !== session) return;
        audio.stop(); commit(cancelQuizSession(session));
      }} />
    </>}
    <ProgressStatus progress={progress} />
    {choosing && <>
      <NavigationRow title="View learning progress" icon="book-outline" route="/progress" />
      <SupportingText>Each submitted answer saves symbol totals and a review time on this device. Round details, typed drafts and recaps stay in memory. Starting a new round replaces the recap, and closing or reloading clears it. Review selections are fixed when a round starts.</SupportingText>
    </>}
  </Screen>;
}

const styles = StyleSheet.create({
  body: { fontSize: 16, lineHeight: 24 },
  setupSection: { gap: 8 },
  section: { gap: 10 },
  audioRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  fill: { flex: 1 },
});
