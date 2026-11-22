package com.natophonetics.localprobe;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognitionSupport;
import android.speech.RecognitionSupportCallback;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

public final class Probe extends Instrumentation {
    private SpeechRecognizer recognizer;

    @Override public void onCreate(Bundle args) {
        super.onCreate(args);
        start();
    }

    @Override public void onStart() {
        Context context = getTargetContext();
        Bundle result = new Bundle();
        boolean local = SpeechRecognizer.isOnDeviceRecognitionAvailable(context);
        result.putBoolean("onDeviceAvailable", local);
        result.putBoolean("anyServiceAvailable", SpeechRecognizer.isRecognitionAvailable(context));
        try {
            if (local) {
                runOnMainSync(() -> recognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(context));
                result.putBoolean("factoryCreated", recognizer != null);
                for (String locale : new String[] {"en-GB", "en-US"}) {
                    CountDownLatch complete = new CountDownLatch(1);
                    Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
                        .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                        .putExtra(RecognizerIntent.EXTRA_LANGUAGE, locale);
                    runOnMainSync(() -> recognizer.checkRecognitionSupport(intent, context.getMainExecutor(),
                        new RecognitionSupportCallback() {
                            @Override public void onSupportResult(RecognitionSupport support) {
                                result.putString(locale + ".installed", support.getInstalledOnDeviceLanguages().toString());
                                result.putString(locale + ".pending", support.getPendingOnDeviceLanguages().toString());
                                result.putString(locale + ".supported", support.getSupportedOnDeviceLanguages().toString());
                                complete.countDown();
                            }
                            @Override public void onError(int error) {
                                result.putInt(locale + ".error", error);
                                complete.countDown();
                            }
                        }));
                    if (!complete.await(15, TimeUnit.SECONDS)) {
                        result.putBoolean(locale + ".timeout", true);
                        break;
                    }
                }
            }
        } catch (Exception error) {
            result.putString("probeException", error.toString());
        } finally {
            if (recognizer != null) runOnMainSync(() -> recognizer.destroy());
            finish(Activity.RESULT_OK, result);
        }
    }
}
