"""Supplement final iOS evidence with fully visible all-letter reference tiles."""
from pathlib import Path
import os,subprocess
root=Path(__file__).resolve().parents[4];out=Path(__file__).resolve().parent;os.chdir(root)
os.environ['DEVELOPER_DIR']='/Applications/Xcode.app/Contents/Developer';os.environ['GEM_HOME']='/tmp/nato-ruby33-gems';os.environ['GEM_PATH']='/tmp/nato-ruby33-gems'
device='0653F7EC-9237-4AC5-A264-12969E625070'
def run(cmd,log):
    with(out/log).open('w')as f:r=subprocess.run(cmd,stdout=f,stderr=subprocess.STDOUT)
    assert r.returncode==0,(log,r.returncode)
def sim(*args):subprocess.run(['xcrun','simctl',*args],check=True,stdout=subprocess.DEVNULL)
run(['/opt/homebrew/opt/ruby@3.3/bin/ruby',str(out/'capture-ios-ui.rb'),'/tmp/nato-ios-run05'],'references-generate.log')
sim('boot',device);sim('bootstatus',device,'-b');sim('ui',device,'content_size','large')
try:
    run(['xcodebuild','test','-project','/tmp/nato-ios-run05/Capture.xcodeproj','-scheme','Capture','-destination','platform=iOS Simulator,id='+device,'-derivedDataPath','/tmp/nato-ios-run05/build','-resultBundlePath','/tmp/nato-ios-run05/FinalReferences.xcresult','-parallel-testing-enabled','NO','-only-testing:CaptureUITests/CaptureUITests/testCompleteAlphabetReferences','CODE_SIGNING_ALLOWED=NO'],'references-test.log')
    run(['xcrun','xcresulttool','export','attachments','--path','/tmp/nato-ios-run05/FinalReferences.xcresult','--output-path','/tmp/nato-ios-run05/contrast/references'],'references-export.log')
    run(['python3',str(out/'export-screenshots.py'),'/tmp/nato-ios-run05/contrast/references'],'references-export-final.log')
finally:
    sim('ui',device,'content_size','large');sim('shutdown',device)
