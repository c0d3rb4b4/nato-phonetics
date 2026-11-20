package com.natophonetics.fonttest;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.view.inputmethod.InputConnection;

/** Exported only in the isolated test APK; never packaged into the product. */
public final class FontTestImeCommand extends BroadcastReceiver {
  @Override public void onReceive(Context context, Intent intent) {
    InputConnection connection = FontTestIme.active == null ? null : FontTestIme.active.connection();
    boolean passed = false;
    if (connection != null) switch (intent.getStringExtra("op")) {
      case "ready": passed = true; break;
      case "select": passed = connection.setSelection(intent.getIntExtra("start", -1), intent.getIntExtra("end", -1)); break;
      case "commit": passed = connection.commitText(intent.getStringExtra("value"), 1); break;
      case "compose": passed = connection.setComposingText(intent.getStringExtra("value"), 1); break;
      case "finish": passed = connection.finishComposingText(); break;
    }
    setResultCode(passed ? Activity.RESULT_OK : Activity.RESULT_CANCELED);
    setResultData(passed ? "test-ime-ok" : "test-ime-no-connection-or-failed-operation");
  }
}
