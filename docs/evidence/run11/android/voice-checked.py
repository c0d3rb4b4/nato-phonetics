from converter import *
# Independently assert prefs/count/text; an earlier checkpoint labelled storage
# unchanged without comparing it. Its raw log remains, but this supplies proof.
adb('shell','settings','put','system','font_scale','1');route('voice-select',cold=True);expect(desc='Search English voices',timeout=60)
before=runtime()['preferences']['preferences']
scroll_to(desc='Search English voices');tap(desc='Search English voices');adb('shell','input','text','zzzz-no-match')
if 'mInputShown=true' in adb('shell','dumpsys','input_method'):adb('shell','input','keyevent','4')
count=scroll_to(rid='voice-filter-count').get('text');assert count.startswith('Showing 0 of '),count
screenshot('voice-checked-no-match','Asserted native no-match count; System Default remains above','dark')
click('Reset voice filters');top();field=scroll_to(desc='Search English voices');assert field.get('text') in ('',field.get('hint')) and field.get('hint')=='Name, locale or quality',field.attrib
count=scroll_to(rid='voice-filter-count').get('text');assert not count.startswith('Showing 0 of '),count
assert runtime()['preferences']['preferences']==before
screenshot('voice-checked-reset','Asserted nonempty restored list and exact unchanged preferences after Reset','dark')
mark('native-voice-filter-asserted',savedPreferencesUnchanged=True,resetFieldShowsPlaceholder=True,restoredCount=count)
