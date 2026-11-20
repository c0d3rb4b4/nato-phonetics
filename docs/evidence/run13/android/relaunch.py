from progress import *

# Continue after the first command's observer failure, without answering or
# deleting again. Require the real rendered summary before attaching CDP.
adb('shell','settings','put','system','font_scale','1')
route('progress',cold=True);scroll_to(rid='progress-summary');expect(contains='0 answers saved');wait_count(0)
screenshot('cleared-summary-relaunched','Zero saved summary after native relaunch and rendered readiness')
mark('delete-persists-relaunch')
adb('shell','settings','put','system','font_scale','2');time.sleep(2)
screenshot('live-scale2-summary','Live 1x to 2x ordinary labels; affected readability remains open')
assert not progress()['data']['symbols']
mark('live-scale2-retains-cleared-state',readability='Not passed; inherited ordinary-text P1')
adb('shell','settings','put','system','font_scale','1')
