"""Read glyph outline bounds from the actual bundled TTFs for native raster checks.
Run using the pinned fontTools4.60.2 environment recorded in assets/fonts/manifest.json.
"""
import json
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
root=Path(__file__).resolve().parents[3]
result={}
for stem in ['ExtraBold','SemiBold','Italic']:
    font=TTFont(root/'assets/fonts'/('NatoTile-'+stem+'.ttf'))
    glyphs=font.getGlyphSet();cmap=font.getBestCmap();metrics={}
    for char in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-':
        pen=BoundsPen(glyphs);glyphs[cmap[ord(char)]].draw(pen);metrics[char]=pen.bounds
    result[stem]={'unitsPerEm':font['head'].unitsPerEm,'glyphs':metrics}
Path(__file__).with_suffix('.json').write_text(json.dumps(result,indent=2)+'\n')
