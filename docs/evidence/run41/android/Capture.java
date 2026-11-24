package com.natophonetics.micfixture;

import android.app.Activity;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.Bundle;
import android.util.Log;

import java.io.FileOutputStream;

/** Measures a synthetic microphone source on a disposable WAV-only emulator. */
public final class Capture extends Activity {
    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        new Thread(this::capture).start();
    }

    private void capture() {
        int rate = 16000;
        int channel = AudioFormat.CHANNEL_IN_MONO;
        int format = AudioFormat.ENCODING_PCM_16BIT;
        int minimum = AudioRecord.getMinBufferSize(rate, channel, format);
        AudioRecord recorder = new AudioRecord(MediaRecorder.AudioSource.VOICE_RECOGNITION,
            rate, channel, format, Math.max(minimum, 4096));
        try (FileOutputStream samples = openFileOutput("samples.pcm", MODE_PRIVATE)) {
            recorder.startRecording();
            Log.i("NatoMicFixture", "recording");
            byte[] block = new byte[640];
            for (int remaining = 2 * rate * 8; remaining > 0;) {
                int count = recorder.read(block, 0, Math.min(block.length, remaining));
                if (count <= 0) throw new IllegalStateException("AudioRecord.read " + count);
                samples.write(block, 0, count);
                remaining -= count;
            }
            recorder.stop();
            Log.i("NatoMicFixture", "complete");
        } catch (Exception e) {
            Log.e("NatoMicFixture", "capture failed", e);
        } finally {
            recorder.release();
            runOnUiThread(this::finish);
        }
    }
}
