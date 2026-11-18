import fontTools
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
import argparse,hashlib,json,pathlib
parser = argparse.ArgumentParser(description="Create the three static tile faces from pinned upstream Nunito variable fonts.")
parser.add_argument("source_dir", type=pathlib.Path, help="Directory containing Nunito.ttf and Nunito-Italic.ttf from the pinned revision")
args = parser.parse_args()
if fontTools.__version__ != '4.60.2':
 raise SystemExit('Reproduction requires fontTools 4.60.2; found '+fontTools.__version__)
expected_sources = {
 'Nunito.ttf': 'bb55a5ca5c2042335b3991af27c4d0705d0ef41cac6164ac737fd8f2a1e85207',
 'Nunito-Italic.ttf': 'b520cc871868b0acfca1beda875df7f4a44ebce914f8a89f83977fc9c09529c8',
}
for name, expected in expected_sources.items():
 if hashlib.sha256((args.source_dir / name).read_bytes()).hexdigest() != expected:
  raise SystemExit('Source SHA-256 does not match pinned Nunito revision: '+name)
root=pathlib.Path(__file__).resolve().parent
manifest={'upstream':'https://github.com/googlefonts/nunito','revision':'8c6a9bb9732545b9ed53f29ec5e1ab0ff53c4e6f','license':'OFL-1.1','fontTools':'4.60.2','faces':[]}
for style,weight,italic in [('ExtraBold',800,False),('SemiBold',600,False),('Italic',400,True)]:
 src=args.source_dir / ('Nunito-Italic.ttf' if italic else 'Nunito.ttf')
 f=instantiateVariableFont(TTFont(src),{'wght':weight},inplace=False)
 # Each static face has its own explicit family. Platforms select a file, never synthesize a weight.
 ps='NatoTile-'+style
 for n in f['name'].names:
  values={1:ps,2:'Regular',3:'NatoTile v1 '+style,4:ps,6:ps,16:ps,17:'Regular'}
  if n.nameID in values: n.string=values[n.nameID].encode(n.getEncoding())
 # Preserve actual outlines/weight/italic metadata; line boxes are defined by the shared design.
 f.recalcTimestamp=False
 path=root/(ps+'.ttf'); f.save(path)
 cmap=f.getBestCmap(); units=f['head'].unitsPerEm
 def width(text,size): return sum(f['hmtx'][cmap[ord(c)]][0] for c in text)*size/units
 manifest['faces'].append({'file':path.name,'postscriptName':ps,'weight':weight,'italic':italic,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'unitsPerEm':units,'ascent':f['hhea'].ascent,'descent':f['hhea'].descent,'lineGap':f['hhea'].lineGap,'examplesAtNominalSize':{t:width(t,11 if italic else 16) for t in (['YOU-nee-form','no-VEM-ber','JEW-lee-ett'] if italic else ['November','Uniform','Whiskey','Juliett'])}})
(root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest,indent=2))
