"""Verify simulator bundles after shutdown without requiring simctl's boot-only lookup."""
from pathlib import Path
import json,plistlib,hashlib
root=Path(__file__).resolve().parents[4];out=Path(__file__).resolve().parent
artifact=json.loads((out/'artifact.json').read_text());built=root/artifact['appPath'];h=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();results=[]
for name,device in artifact['simulators'].items():
    candidates=[]
    for path in (Path.home()/'Library/Developer/CoreSimulator/Devices'/device/'data/Containers/Bundle/Application').glob('*/NATOPhonetics.app'):
        info=plistlib.loads((path/'Info.plist').read_bytes());meta=plistlib.loads((path.parent/'.com.apple.mobile_container_manager.metadata.plist').read_bytes())
        if info['CFBundleIdentifier']==artifact['bundleIdentifier'] and meta['MCMMetadataIdentifier']==artifact['bundleIdentifier']:candidates.append(path)
    assert len(candidates)==1,(device,candidates)
    installed=candidates[0];checks={file:h(installed/file)==h(built/file)for file in ['NATOPhonetics','main.jsbundle',*[Path(f['file']).name for f in artifact['fonts']]]};assert all(checks.values())
    results.append({'device':name,'udid':device,'installedPath':str(installed),'method':'Unique simulator bundle with matching Info.plist CFBundleIdentifier and MobileContainerManager MCMMetadataIdentifier; filesystem SHA256 after shutdown','matchesBuiltArtifact':checks})
(out/'installed-artifact-verification.json').write_text(json.dumps(results,indent=2)+'\n')
print('PASS: all3 installed executables, bundledJS and3 font files match final builtcandidate; containeridentity verified.')
