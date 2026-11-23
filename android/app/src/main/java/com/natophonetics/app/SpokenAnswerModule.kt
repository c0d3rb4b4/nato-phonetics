package com.natophonetics.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionSupport
import android.speech.RecognitionSupportCallback
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.*
import com.facebook.react.common.LifecycleState
import com.facebook.react.modules.core.DeviceEventManagerModule

class SpokenAnswerModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context), LifecycleEventListener {
  private val main = Handler(Looper.getMainLooper())
  private var active: Capture? = null

  init { context.addLifecycleEventListener(this) }
  override fun getName() = "SpokenAnswer"

  private fun localAvailable() = Build.VERSION.SDK_INT >= 31 &&
      SpeechRecognizer.isOnDeviceRecognitionAvailable(context)

  private fun request() = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
      .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
      .putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US")
      .putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)

  @ReactMethod fun available(result: Promise) {
    main.post {
      try {
        if (!localAvailable()) result.resolve(false)
        else if (Build.VERSION.SDK_INT >= 33) inspectModel(result)
        else result.resolve(true)
      } catch (error: RuntimeException) {
        result.reject("unavailable", "Cannot inspect the local recognizer.")
      }
    }
  }

  @android.annotation.TargetApi(33)
  private fun inspectModel(result: Promise) {
    val probe = SpeechRecognizer.createOnDeviceSpeechRecognizer(context)
    var complete = false
    fun finish(code: String?) {
      if (complete) return
      complete = true
      main.removeCallbacksAndMessages(probe)
      probe.destroy()
      if (code == null) result.resolve(true) else result.reject(code, "Cannot use the local US English model.")
    }
    // An unresponsive inventory cannot establish that the local model is missing.
    // The on-device factory remains mandatory and the actual request is bounded.
    main.postAtTime({ finish(null) }, probe, android.os.SystemClock.uptimeMillis() + 5000)
    try {
      probe.checkRecognitionSupport(request(), context.mainExecutor, object : RecognitionSupportCallback {
        override fun onSupportResult(support: RecognitionSupport) {
          finish(if (support.installedOnDeviceLanguages.any { it.equals("en-US", ignoreCase = true) }) null else "language")
        }
        override fun onError(error: Int) {
          // Some local providers cannot report installed languages. A real local
          // request can still succeed or return the provider's language error.
          finish(if (error == SpeechRecognizer.ERROR_CANNOT_CHECK_SUPPORT) null else "unavailable")
        }
      })
    } catch (error: RuntimeException) { finish("unavailable") }
  }

  @ReactMethod fun start(id: String, result: Promise) {
    main.post {
      if (context.lifecycleState != LifecycleState.RESUMED) {
        result.reject("interrupted", "Recording interrupted.")
        return@post
      }
      if (context.checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
        result.reject("permission", "Microphone permission is required.")
        return@post
      }
      try {
        if (!localAvailable() || Build.VERSION.SDK_INT < 31) {
          result.reject("unavailable", "On-device recognition is unavailable.")
          return@post
        }
        active?.finish("interrupted")
        val recognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(context)
        val capture = Capture(id, recognizer, result)
        active = capture
        recognizer.setRecognitionListener(capture)
        recognizer.startListening(request())
        capture.deadline(15000)
      } catch (error: RuntimeException) {
        val code = if (error is SecurityException) "permission" else "unavailable"
        active?.takeIf { it.id == id }?.finish(code) ?: result.reject(code, "Recording unavailable.")
      }
    }
  }

  @ReactMethod fun stop(id: String) {
    main.post { active?.takeIf { it.id == id }?.let { capture ->
      runCatching { capture.recognizer.stopListening(); capture.processing() }
          .onFailure { capture.finish("audio") }
    } }
  }
  @ReactMethod fun cancel(id: String) { main.post { active?.takeIf { it.id == id }?.finish("interrupted") } }

  override fun onHostPause() { active?.finish("interrupted") }
  override fun onHostDestroy() { active?.finish("interrupted") }
  override fun onHostResume() {}
  override fun invalidate() {
    context.removeLifecycleEventListener(this)
    main.post { active?.finish("interrupted") }
    super.invalidate()
  }

  private inner class Capture(val id: String, val recognizer: SpeechRecognizer, val result: Promise) : RecognitionListener {
    private val timeout = Runnable { finish("timeout") }
    private var ending = false
    fun deadline(ms: Long) {
      main.removeCallbacks(timeout)
      main.postDelayed(timeout, ms)
    }
    private fun state(value: String) {
      context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          .emit("spokenAnswerState", Arguments.createMap().apply { putString("id", id); putString("state", value) })
    }
    fun processing() {
      if (active !== this || ending) return
      ending = true
      deadline(5000)
      state("processing")
    }
    fun finish(code: String?, transcript: String? = null) {
      if (active !== this) return
      active = null
      main.removeCallbacks(timeout)
      if (code != null) runCatching { recognizer.cancel() }
      runCatching { recognizer.destroy() }
      if (code == null) result.resolve(transcript) else result.reject(code, "Recording ended.")
    }
    override fun onReadyForSpeech(params: Bundle?) {
      if (active === this && !ending) { deadline(15000); state("recording") }
    }
    override fun onEndOfSpeech() = processing()
    override fun onResults(results: Bundle?) {
      val answer = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()
      if (answer.isNullOrBlank()) finish("silence") else finish(null, answer)
    }
    override fun onError(error: Int) = finish(when (error) {
      SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "permission"
      SpeechRecognizer.ERROR_NO_MATCH, SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "silence"
      SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED, SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE -> "language"
      SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "busy"
      SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "timeout"
      else -> "audio"
    })
    override fun onBeginningOfSpeech() {}
    override fun onPartialResults(results: Bundle?) {}
    override fun onRmsChanged(rmsdB: Float) {}
    override fun onBufferReceived(buffer: ByteArray?) {}
    override fun onEvent(eventType: Int, params: Bundle?) {}
  }
}
