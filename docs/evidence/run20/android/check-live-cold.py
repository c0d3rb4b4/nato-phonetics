"""A repair must satisfy live/cold frame equivalence; current candidate fails."""
from pathlib import Path
import json,sys
p=Path(__file__).resolve().parent
samples=json.loads((p/'samples.json').read_text())
comparisons=[]
for name in ['stable','feedback','input','revision']:
    live=samples['live2']['frames'][name]['height'];cold=samples['cold2']['frames'][name]['height']
    comparisons.append({'name':name,'live':live,'cold':cold,'passed':abs(live-cold)<=1/1.75})
print(json.dumps(comparisons,indent=2))
sys.exit(0 if all(row['passed'] for row in comparisons) else 1)
