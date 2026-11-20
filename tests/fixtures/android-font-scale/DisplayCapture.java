package com.natophonetics.fonttest;

import android.app.Instrumentation;
import android.os.ParcelFileDescriptor;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

/** Read the system display at this stage without requesting a redraw of the app. */
final class DisplayCapture {
  static final String COMMAND = "screencap -p";

  static void write(Instrumentation test, File destination) throws IOException {
    ParcelFileDescriptor pipe = test.getUiAutomation().executeShellCommand(COMMAND);
    try (InputStream input = new ParcelFileDescriptor.AutoCloseInputStream(pipe);
         FileOutputStream output = new FileOutputStream(destination)) {
      byte[] buffer = new byte[16384];
      int count;
      while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
    }
    if (destination.length() == 0) throw new IOException("Empty display capture");
  }

  private DisplayCapture() {}
}
