"""Check a synthetic-only emulator's microphone against the known Run 38 PCM."""

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import time

import numpy as np
from scipy.signal import correlate


def compare(reference, captured):
    # Compare the spoken portion, excluding its leading and trailing silence.
    voice = np.flatnonzero(np.abs(reference) > 100)
    word = reference[voice[0]:voice[-1] + 1].astype(float)
    data = captured.astype(float)
    dot = correlate(data, word, mode="valid", method="fft")
    energy = np.r_[0, np.cumsum(data * data)]
    window_energy = energy[len(word):] - energy[:-len(word)]
    score = dot / np.sqrt(np.maximum(1, window_energy) * np.dot(word, word))
    best = int(np.argmax(score))
    amplitudes = np.abs(np.fft.rfft(data))
    dominant = np.argmax(amplitudes[1:]) + 1
    return {"bestCorrelation": round(float(score[best]), 6),
            "wordOffsetSeconds": round(best / 16000, 4),
            "dominantHz": round(float(dominant * 16000 / len(data)), 2),
            "peak": int(np.max(np.abs(data))), "nonzeroSamples": int(np.count_nonzero(data))}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("serial")
    parser.add_argument("reference", type=Path)
    parser.add_argument("--wav-only-guest", action="store_true", required=True,
                        help="Confirm the specified disposable emulator uses -audio wav with synthetic input")
    args = parser.parse_args()
    assert args.serial.startswith("emulator-")
    raw = args.reference.read_bytes()
    fixture_hash = hashlib.sha256(raw).hexdigest()
    assert fixture_hash == "136e25b596709a052df742e2bc938b4470475cf8ca491ae48ccb349100cb47cc"
    package = "com.natophonetics.micfixture"

    def adb(*command):
        return subprocess.check_output(["adb", "-s", args.serial, *command], timeout=30)

    adb("install", "-r", "-g", "artifacts/run41/android/micfixture.apk")
    adb("shell", "am", "force-stop", package)
    adb("shell", "am", "start", "-W", "-n", package + "/.Capture")
    # Rewind after the foreground capture client opens the input stream.
    deadline = time.monotonic() + 5
    while time.monotonic() < deadline:
        pid = adb("shell", "pidof", package).strip().decode()
        log = adb("logcat", "-d", "--pid=" + pid, "-s", "NatoMicFixture:I")
        if b": recording" in log:
            break
        time.sleep(.1)
    else:
        raise RuntimeError("AudioRecord did not start")
    assert b"OK" in adb("emu", "avd", "rewindaudio")
    deadline = time.monotonic() + 12
    while time.monotonic() < deadline:
        if b": complete" in adb("logcat", "-d", "--pid=" + pid, "-s", "NatoMicFixture:I"):
            break
        time.sleep(.3)
    else:
        raise RuntimeError("AudioRecord did not return eight seconds")
    capture = adb("exec-out", "run-as", package, "cat", "files/samples.pcm")
    adb("shell", "run-as", package, "rm", "files/samples.pcm")
    assert len(capture) == 8 * 16000 * 2
    measured = compare(np.frombuffer(raw, dtype="<i2"), np.frombuffer(capture, dtype="<i2"))
    result = {"fixtureSha256": fixture_hash, "capturedSha256": hashlib.sha256(capture).hexdigest(),
              "frames": len(capture) // 2, "rateHz": 16000, "source": "VOICE_RECOGNITION",
              **measured, "threshold": .85, "passed": measured["bestCorrelation"] >= .85}
    print(json.dumps(result, indent=2))
    raise SystemExit(0 if result["passed"] else 1)


if __name__ == "__main__":
    main()
