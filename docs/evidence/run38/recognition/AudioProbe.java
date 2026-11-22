package com.natophonetics.localprobe;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.media.AudioFormat;
import android.os.Bundle;
import android.os.ParcelFileDescriptor;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import java.io.OutputStream;
import java.io.InputStream;

import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

public final class AudioProbe extends Instrumentation {
    private SpeechRecognizer recognizer;

    @Override public void onCreate(Bundle args) {
        super.onCreate(args);
        start();
    }

    @Override public void onStart() {
        Bundle result = new Bundle();
        CountDownLatch ended = new CountDownLatch(1);
        try (InputStream source = getTargetContext().getAssets().open("answer.pcm")) {
            ParcelFileDescriptor[] pipe = ParcelFileDescriptor.createPipe();
            try (ParcelFileDescriptor fd = pipe[0];
                 OutputStream writer = new ParcelFileDescriptor.AutoCloseOutputStream(pipe[1])) {
                runOnMainSync(() -> {
                    recognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(getTargetContext());
                    recognizer.setRecognitionListener(new RecognitionListener() {
                        @Override public void onReadyForSpeech(Bundle args) { result.putBoolean("ready", true); }
                        @Override public void onBeginningOfSpeech() {}
                        @Override public void onRmsChanged(float rms) {}
                        @Override public void onBufferReceived(byte[] audio) {}
                        @Override public void onEndOfSpeech() {}
                        @Override public void onEvent(int type, Bundle data) {}
                        @Override public void onPartialResults(Bundle data) {}
                        @Override public void onError(int error) {
                            result.putInt("error", error);
                            ended.countDown();
                        }
                        @Override public void onResults(Bundle data) { check(data); ended.countDown(); }
                        @Override public void onSegmentResults(Bundle data) { check(data); }
                        @Override public void onEndOfSegmentedSession() { ended.countDown(); }
                        private void check(Bundle data) {
                            List<String> matches = data.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                            String first = matches == null || matches.isEmpty() ? "" : matches.get(0);
                            result.putBoolean("nonemptyFinal", !first.isBlank());
                            result.putBoolean("exactMatch", first.trim().equalsIgnoreCase("Bravo"));
                            String key = java.text.Normalizer.normalize(first, java.text.Normalizer.Form.NFKD)
                                .replaceAll("\\p{M}", "").toLowerCase(java.util.Locale.ROOT).replaceAll("[^a-z0-9]", "");
                            result.putBoolean("normalizedMatch", key.equals("bravo"));
                        }
                    });
                    recognizer.startListening(new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
                        .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                        .putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US")
                        .putExtra(RecognizerIntent.EXTRA_SEGMENTED_SESSION, RecognizerIntent.EXTRA_AUDIO_SOURCE)
                        .putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE, fd)
                        .putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_CHANNEL_COUNT, 1)
                        .putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_SAMPLING_RATE, 16000)
                        .putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_ENCODING, AudioFormat.ENCODING_PCM_16BIT));
                });
                byte[] frame = new byte[640];
                int size;
                while ((size = source.read(frame)) != -1 && ended.getCount() != 0) {
                    writer.write(frame, 0, size);
                    Thread.sleep(20);
                }
                writer.close();
                if (!ended.await(20, TimeUnit.SECONDS)) result.putBoolean("timedOut", true);
            }
        } catch (Exception error) {
            result.putString("probeException", error.toString());
        } finally {
            if (recognizer != null) runOnMainSync(() -> { recognizer.cancel(); recognizer.destroy(); });
            finish(Activity.RESULT_OK, result);
        }
    }
}
