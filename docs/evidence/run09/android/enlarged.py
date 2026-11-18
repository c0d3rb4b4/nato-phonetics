from converter import *

adb('shell','settings','put','system','font_scale','2');route('converter',cold=True);expect(desc='Text to convert',timeout=60);top();set_text('a3 b!');top()
scroll_to(rid='converter-plain-text');screenshot('plain-cold-scale2','Cold 2x plain text and omission disclosure','dark')
scroll_to(desc='Share conversion');screenshot('controls-cold-scale2','Cold 2x copy/share controls','dark')
mark('converter-cold-scale2-controls-reachable')
adb('shell','settings','put','system','font_scale','1');route('converter',cold=True);expect(desc='Text to convert',timeout=60);top();set_text('a3 b!');top()
scroll_to(rid='converter-plain-text');screenshot('plain-before-live-scale2','Existing plain text at 1x before live transition','dark')
adb('shell','settings','put','system','font_scale','2');time.sleep(3)
screenshot('plain-live-scale2','Existing plain text after live 1x to 2x; readability observation','dark')
scroll_to(desc='Share conversion');screenshot('controls-live-scale2','Existing export controls after live 1x to 2x; readability observation','dark')
adb('shell','settings','put','system','font_scale','1')
route('privacy');expect(contains='About this policy',timeout=30);top()
scroll_to(rid='privacy-copy-share');screenshot('privacy-copy-share','Clipboard/share privacy disclosure','dark')
