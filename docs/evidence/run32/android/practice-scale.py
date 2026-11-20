"""Retest the numeric instruction and typed draft that failed during live font changes."""
import argparse
import hashlib
import importlib.util
import json
import shutil
import time
from pathlib import Path

here = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("round_observer", here / "quiz-round.py")
quiz = importlib.util.module_from_spec(spec)
spec.loader.exec_module(quiz)
ui, product = quiz.ui, quiz.product


def scale(value):
    ui.adb("shell", "settings", "put", "system", "font_scale", str(value))
    time.sleep(1.5)


def capture(name, description):
    ui.screenshot(name, description, "dark")


def start_digits(typed=False):
    product.top()
    quiz.tap(product.seek(name="mode-typed" if typed else "mode-choice"))
    quiz.tap(product.seek(desc="Digits"))
    quiz.tap(product.seek(desc="5 questions"))
    product.click("quiz-start")
    product.top()


def compare(before, after, required):
    assert before["dimensions"]["fontScale"] == 1 and after["dimensions"]["fontScale"] == 2
    assert not before["revealed"] and not after["revealed"]
    symbol = before["symbol"]
    assert symbol == after["symbol"] and isinstance(symbol, str) and len(symbol) == 1 and symbol in "0123456789"
    assert before["runtimePid"] == after["runtimePid"] and before["activityIdentity"] == after["activityIdentity"]
    rows = {}
    for label in required:
        old, new = quiz.fits(before, label), quiz.fits(after, label)
        assert old["viewIdentity"] == new["viewIdentity"] and new["paintPx"] > old["paintPx"], (old, new)
        rows[label] = {"sameView": new["viewIdentity"], "paintBeforePx": old["paintPx"], "paintAfterPx": new["paintPx"]}
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("apk", "observer", "serial", "abi", "attempt"):
        parser.add_argument(name)
    parser.add_argument("--dismiss-before-scale", action="store_true",
                        help="Follow Run 12's original typed flow by dismissing the keyboard before changing scale")
    args = parser.parse_args()
    ui.SERIAL, ui.ADB = args.serial, shutil.which("adb")
    assert ui.adb("shell", "getprop", "ro.kernel.qemu").strip() == "1"
    product.APK, product.TEST = Path(args.apk).resolve(strict=True), Path(args.observer).resolve(strict=True)
    product.OUT = ui.OUT = here / args.attempt
    ui.SHOTS = here.parent / "screenshots/android" / args.attempt
    ui.OUT.mkdir()
    ui.SHOTS.mkdir()
    ui.checks, ui.captures = [], []
    path = ui.adb("shell", "pm", "path", ui.APP).strip().removeprefix("package:")
    sha = ui.adb("shell", "sha256sum", path).split()[0]
    assert sha == hashlib.sha256(product.APK.read_bytes()).hexdigest()
    abi = quiz.installed_abi(ui.adb("shell", "dumpsys", "package", ui.APP))
    assert abi == args.abi
    prior = ui.adb("shell", "settings", "get", "system", "font_scale").strip()
    report = {"passed": False, "apkSha256": sha, "selectedAbi": abi, "serial": args.serial, "originalScale": prior}
    process, log = product.start()
    try:
        ui.tap(desc="Dark")
        ui.route("letter-quiz")
        start_digits()
        first = quiz.read_screen("numeric-1")
        capture("numeric-1", "Numeric multiple choice at original size")
        scale(2)
        enlarged = quiz.read_screen("numeric-2")
        capture("numeric-2", "Same numeric question after live enlargement")
        choices = []
        for index in range(4):
            choice = product.seek(name=f"quiz-choice-{index}").get("content-desc")
            assert choice.startswith("Choose "), choice
            choices.append(choice.removeprefix("Choose "))
        assert len(set(choices)) == 4
        report["numeric"] = compare(first, enlarged, ["What is the phonetic word for this symbol?",
                                "Question 1 of 5 · 0 correct", "Choose an answer below.", *choices])
        capture("numeric-choices-2", "Reachable numeric choices after live enlargement")
        quiz.tap(product.seek(desc="End round and review"))
        scale(1)
        product.top()
        quiz.tap(product.seek(desc="Choose a new round"))
        start_digits(typed=True)
        quiz.tap(product.seek(name="quiz-typed-answer"))
        ui.adb("shell", "input", "text", "three")
        assert ui.expect(desc="Your code word").get("text") == "three"
        if args.dismiss_before_scale:
            if "mInputShown=true" in ui.adb("shell", "dumpsys", "input_method"):
                ui.adb("shell", "input", "keyevent", "KEYCODE_BACK")
                time.sleep(.5)
            assert "mInputShown=true" not in ui.adb("shell", "dumpsys", "input_method")
        report["imeVisibleBeforeScale"] = "mInputShown=true" in ui.adb("shell", "dumpsys", "input_method")
        draft = quiz.read_screen("typed-1")
        capture("typed-1", "Typed numeric draft three before the live font change")
        scale(2)
        live_draft = quiz.read_screen("typed-2")
        capture("typed-2", "Same typed numeric draft after live enlargement")
        report["typed"] = compare(draft, live_draft, ["Type the code word for this symbol.",
                              "Question 1 of 5 · 0 correct", "three", "Check answer"])
        if "mInputShown=true" in ui.adb("shell", "dumpsys", "input_method"):
            ui.adb("shell", "input", "keyevent", "KEYCODE_BACK")
            time.sleep(.5)
        assert ui.expect(desc="Your code word").get("text") == "three"
        action = product.seek(name="quiz-check")
        capture("typed-check-2", "Check answer reachable with the retained draft")
        quiz.tap(action)
        accepted = quiz.read_screen("typed-submitted")
        assert accepted["symbol"] == draft["symbol"] and accepted["revealed"]
        quiz.fits(accepted, "Your answer: three")
        assert len({row["runtimePid"] for row in [first, enlarged, draft, live_draft, accepted]}) == 1
        mappings = json.loads(ui.adb("exec-out", "cat", product.REMOTE + "/runtime-libraries.json"))
        (ui.OUT / "mappings.json").write_text(json.dumps(mappings, indent=2) + "\n")
        report["runtime"] = quiz.check_runtime(product.APK, path, sha, abi, abi, mappings, first["runtimePid"])
        report["passed"] = True
    except Exception as failure:
        report["error"] = repr(failure)
        capture("diagnostic", "Observed state at the interrupted practice check")
        raise
    finally:
        if process.poll() is None:
            product.request("finish", True)
            process.wait(timeout=20)
        log.close()
        if prior == "null":
            ui.adb("shell", "settings", "delete", "system", "font_scale")
        else:
            ui.adb("shell", "settings", "put", "system", "font_scale", prior)
        report["restoredScale"] = ui.adb("shell", "settings", "get", "system", "font_scale").strip()
        (ui.OUT / "result.json").write_text(json.dumps(report, indent=2) + "\n")
        assert report["restoredScale"] == prior


if __name__ == "__main__":
    main()
