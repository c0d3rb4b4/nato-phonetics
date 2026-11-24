# Android microphone input qualification

24 November 2026 · P09.2–.4 / F08. Run 40 left one installed Android gate open. A recognized word must appear in the editable, unsubmitted quiz field. Before exercising that app again, this run measured whether the known synthetic word reached a separate, foreground Android recorder.

## Measurement

The Windows x86_64 host started with no attached device. The Run 40 Develop APK still had SHA-256 `572b31373a4f4932bbf0f3f864e347153f69d71d663ace10335b75574e652dab`. The synthetic en-US “Bravo” PCM matched its Run 38 hash. The emulator was 36.4.9.0, build 14788078. The read-only Google Play guest reported `google/sdk_gphone64_x86_64/emu64xa:16/BE4B.251210.005/14574095:user/release-keys`, 1080×2400. The network service reported no active default network.

The test APK opened an Android `AudioRecord` with the voice-recognition source, 16 kHz, mono, signed 16-bit PCM. AudioFlinger recorded a route to `AUDIO_DEVICE_IN_BUILTIN_MIC`. Both runs completed eight seconds. The host searched every aligned sample window for the voiced portion of the known PCM, using normalized cross-correlation. The advance gate was 0.85. Captured samples were read from the fixture's private directory and removed. The retained results contain only measurements and hashes. [Recorder](Capture.java) · [Comparator and replay](qualify.py).

| Check | Samples | Peak / 32768 | Highest correlation | Result |
| --- | ---: | ---: | ---: | --- |
| Guest supplied with the WAV path and input enabled | 128,000 | 3,765 | 0.132649 | Known word unverified |
| Same guest after the console input-mute command | 128,000 | 8 | 0.019385 | Negative control |
| Matcher on the original word, delayed and attenuated | 128,000 | 12,966 | 1.000000 | Positive control |
| Matcher on seeded noise / digital silence | 128,000 each | 1,000 / 0 | 0.039784 / 0 | Negative controls |

[Enabled guest input](guest-input.json) · [Muted input](muted-control.json) · [Matcher controls](matcher-controls.json).

The first read-only boot on port 5590 was stopped before collecting samples to specify the WAV backend's channel count and sample rate explicitly. The measured guest on port 5592 had `-audio wav` in its process arguments, and its process environment contained the expected WAV file path, 16 kHz and one channel. Host inspection after capture found no open WAV file on the emulator process and no configured output WAV on disk. The source of the nonzero input remains undetermined. Input activity, a successful rewind and a granted permission do not identify the fixture. The result does not distinguish a quiz defect from a provider defect. The product was never asked to recognize this input.

## Replay and re-entry

1. Prepare the Run 38 PCM and confirm its SHA-256. For this run the input WAV contained 32,000 zero bytes, the full PCM and 160,000 trailing zero bytes. Its header specified 16 kHz signed 16-bit mono. Its SHA-256 was `588af65d1134ae77874c8006a5c37a243d450bbc489e83d0fade8d75c9450af9`. [PCM preparation](../../run38/README.md).
2. From the repository root, run `python docs/evidence/run41/android/build.py` with JDK 17 and SDK 36. The measured test APK SHA-256 was `78720670cc381da78f5d4474c94b94e7e739c5bd77cd23dc89d70f74e1844760`. [Build script](build.py) · [Test-only manifest](AndroidManifest.xml).
3. Re-enter on an emulator or runner where the input can be positively bound to the synthetic source. For the Windows experiment the environment set `QEMU_WAV_IN_PATH`, `QEMU_WAV_PATH`, `QEMU_WAV_FREQUENCY=16000` and `QEMU_WAV_DAC_FIXED_CHANNELS=1`. The launcher used `-read-only -no-snapshot -no-window -camera-front none -camera-back none -audio wav -allow-host-audio`. The console exposed `avd hostmicon`, `avd hostmicoff` and `avd rewindaudio`. The WAV driver reads data after the 44-byte header using its configured sample format. Confirm the fixture binding before using another Windows profile. [Android emulator WAV backend](https://android.googlesource.com/platform/external/qemu/+/refs/heads/emu-master-dev/audio/wavaudio.c).
4. With a disposable WAV-only guest, run `python docs/evidence/run41/android/qualify.py <serial> artifacts/run38/probe/answer.pcm --wav-only-guest`. The script requires Python with NumPy and SciPy. Check for a positive result with input enabled and a negative result on mute. Then use the Run 40 APK to verify the returned word, editing, and explicit Check answer. Capture the returned editable state on that installed app. [Prior app replay](../../run40/android.py).

Both diagnostic guests were shut down without saving snapshots. The input experiment produced no returned-word screenshot. Run 40's permission, dark 2× recorder and navigation images retain their original scope. The later Run 41 Android version-discovery change and installed Release checks have separate captures. Actual ARM application checks, physical microphone accuracy and M11.6 privacy review retain their respective gates. [Run 40 recorder](../../run40/screenshots/index.md) · [Run 41 installed screens](../screenshots/index.md).
