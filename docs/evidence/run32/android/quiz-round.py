"""Exercise the formerly clipped live feedback, completed recap and Retry on the installed product."""
import argparse
import hashlib
import importlib.util
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

here = Path(__file__).resolve().parent
root = here.parents[3]
sys.path.insert(0, str(root / 'scripts'))
from android_runtime_abi import check_runtime, installed_abi

spec = importlib.util.spec_from_file_location('product', here.parents[1] / 'run30/android/observe-product.py')
product = importlib.util.module_from_spec(spec)
spec.loader.exec_module(product)
ui = product.m


def read_screen(stage):
    request = json.dumps({'name': stage, 'quizText': True}).encode()
    ui.adb('shell', f'cat > {product.REMOTE}/request.tmp && mv {product.REMOTE}/request.tmp {product.REMOTE}/request.json',
           input=request)
    product.wait_file(stage + '-done.json')
    data = json.loads(ui.adb('exec-out', 'cat', product.REMOTE + '/' + stage + '.json'))
    symbol = next((row['text'] for row in data['values'] if row['id'] == 'quiz-letter'), None)
    proof = {key: data[key] for key in ('runtimePid', 'activityIdentity', 'dimensions', 'quizText')}
    proof.update(symbol=symbol, revealed=any(row['id'] == 'quiz-card-word' for row in data['values']))
    (ui.OUT / (stage + '.json')).write_text(json.dumps(proof, indent=2) + '\n')
    return proof


def fits(screen, text):
    rows = [row for row in screen['quizText'] if row['text'] == text]
    assert len(rows) == 1, ('missing or duplicate', text, [r['text'] for r in screen['quizText']])
    row = rows[0]
    assert row['ellipsizedCharacters'] == 0 and row['lastLineEnd'] == len(text), row
    assert row['lastLineBottom'] <= row['viewContentHeight'] + 1 and row['paintPx'] > 0, row
    return row


def tap(node):
    x, y, right, bottom = product.bounds(node)
    ui.adb('shell', 'input', 'tap', str((x + right) // 2), str((y + bottom) // 2))
    time.sleep(.4)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('apk', 'observer', 'serial', 'abi', 'attempt'):
        parser.add_argument(name)
    args = parser.parse_args()
    ui.SERIAL, ui.ADB = args.serial, shutil.which('adb')
    assert ui.adb('shell', 'getprop', 'ro.kernel.qemu').strip() == '1'
    product.APK, product.TEST = Path(args.apk).resolve(strict=True), Path(args.observer).resolve(strict=True)
    product.OUT = ui.OUT = here / args.attempt
    ui.SHOTS = here.parent / 'screenshots/android' / args.attempt
    ui.OUT.mkdir()
    ui.SHOTS.mkdir(parents=True)
    ui.checks, ui.captures = [], []
    canonical = json.loads(subprocess.check_output(['node', '--input-type=module', '-e',
        "import {NATO_ALPHABET as a} from './src/data/natoData.js';"
        "console.log(JSON.stringify(Object.fromEntries(a.map(e=>[e.letter,e.word]))))"], cwd=root, text=True))
    app_path = ui.adb('shell', 'pm', 'path', ui.APP).strip().removeprefix('package:')
    app_sha = ui.adb('shell', 'sha256sum', app_path).split()[0]
    assert app_sha == hashlib.sha256(product.APK.read_bytes()).hexdigest()
    abi = installed_abi(ui.adb('shell', 'dumpsys', 'package', ui.APP))
    assert abi == args.abi
    original = ui.adb('shell', 'settings', 'get', 'system', 'font_scale').strip()
    process, log = product.start()
    attempts = []
    report = {'passed': False, 'attempts': attempts, 'apkSha256': app_sha, 'selectedAbi': abi}
    try:
        ui.tap(desc='Dark')
        ui.route('letter-quiz')
        tap(product.seek(desc='5 questions'))
        product.click('quiz-start')
        for index in range(5):
            product.top()
            question = read_screen(f'question-{index + 1}')
            symbol = question['symbol']
            correct_word = canonical[symbol]
            progress = f'Question {index + 1} of 5 · {max(0, index - 1)} correct'
            assert not question['revealed'] and symbol not in [row['symbol'] for row in attempts]
            fits(question, progress)
            if index == 0:
                ui.screenshot('concealed', 'First question before choosing a word', 'dark')
                # Choose a real visible distractor so the exact Retry set is known.
                for choice_index in range(4):
                    choice = product.seek(name=f'quiz-choice-{choice_index}')
                    answer = choice.get('content-desc').removeprefix('Choose ')
                    if answer != correct_word:
                        break
                assert answer != correct_word
            else:
                choice = product.seek(desc='Choose ' + correct_word)
                answer = correct_word
            tap(choice)
            attempts.append({'symbol': symbol, 'answer': answer, 'expected': correct_word})
            next_label = 'View results' if index == 4 else 'Next question'
            product.seek(desc=next_label)
            if index == 0:
                before = read_screen('submitted-1')
                ui.screenshot('submitted-1', 'Submitted first answer with feedback and controls at 1×', 'dark')
                ui.adb('shell', 'settings', 'put', 'system', 'font_scale', '2')
                time.sleep(1.5)
                product.top()
                product.seek(desc='Next question')
                after = read_screen('same-submission-2')
                assert before['dimensions']['fontScale'] == 1 and after['dimensions']['fontScale'] == 2
                assert before['revealed'] and after['revealed'] and before['symbol'] == after['symbol'] == symbol
                assert before['runtimePid'] == after['runtimePid'] and before['activityIdentity'] == after['activityIdentity']
                labels = ['What is the phonetic word for this symbol?', progress, f'Not quite. {symbol} is {correct_word}.',
                          'Next question', 'Replay answer']
                for label in labels:
                    a, b = fits(before, label), fits(after, label)
                    assert a['viewIdentity'] == b['viewIdentity'] and b['paintPx'] > a['paintPx'], (a, b)
                ui.screenshot('same-submission-2', 'Same submission, enlarged feedback and Next', 'dark')
                product.seek(desc='Replay answer')
                ui.screenshot('replay-2', 'Reachable Replay after live enlargement', 'dark')
                product.top()
            tap(product.seek(desc=next_label))
        product.top()
        done = read_screen('recap')
        miss = attempts[0]
        expected_recap = f"{miss['symbol']} is {miss['expected']}. Your answer: {miss['answer']}."
        for label in ('Round complete', '4 correct of 5 answered · 80% accuracy', '5 of 5 questions answered.',
                      'Missed answers', expected_recap, 'Retry Mistakes'):
            fits(done, label)
        ui.screenshot('results-2', 'Completed five-question round with score and accuracy at 2×', 'dark')
        product.seek(desc='Retry Mistakes')
        ui.screenshot('missed-recap-2', 'Missed answer and Retry Mistakes at 2×', 'dark')
        product.click('quiz-retry')
        product.top()
        retry = read_screen('retry')
        assert retry['symbol'] == miss['symbol'] and not retry['revealed']
        fits(retry, 'Question 1 of 1 · 0 correct')
        ui.screenshot('retry-2', 'Single missed symbol starts a concealed retry round', 'dark')
        tap(product.seek(desc='Choose ' + miss['expected']))
        tap(product.seek(desc='View results'))
        product.top()
        retry_result = read_screen('retry-complete')
        fits(retry_result, '1 correct of 1 answered · 100% accuracy')
        fits(retry_result, 'No missed answers.')
        ui.screenshot('retry-result-2', 'Retry scored one correct of one with no missed answers', 'dark')
        mappings = json.loads(ui.adb('exec-out', 'cat', product.REMOTE + '/runtime-libraries.json'))
        (ui.OUT / 'mapped-libraries.json').write_text(json.dumps(mappings, indent=2) + '\n')
        assert len({r['runtimePid'] for r in (before, after, done, retry, retry_result)}) == 1
        report['runtime'] = check_runtime(product.APK, app_path, app_sha, abi, args.abi, mappings, after['runtimePid'])
        report['passed'] = True
    except Exception as failure:
        report['error'] = repr(failure)
        ui.screenshot('diagnostic', 'Screen at the failed quiz session check', 'dark')
        raise
    finally:
        (ui.OUT / 'result.json').write_text(json.dumps(report, indent=2) + '\n')
        if process.poll() is None:
            product.request('finish', True)
            process.wait(timeout=20)
        log.close()
        if original == 'null':
            ui.adb('shell', 'settings', 'delete', 'system', 'font_scale')
        else:
            ui.adb('shell', 'settings', 'put', 'system', 'font_scale', original)


if __name__ == '__main__':
    main()
