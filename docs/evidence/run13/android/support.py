from progress import *

def seek(needle):
    for _ in range(45):
        node=find(dump(),contains=needle)
        if node is not None:
            box=list(map(int,re.findall(r'\d+',node.get('bounds',''))))
            if box[1]>195 and box[3]<1515:return node
        adb('shell','input','swipe','650','1200','650','850','230')
    raise AssertionError('Support paragraph not reached: '+needle)

route('privacy',cold=True);seek('Each submitted quiz answer saves');screenshot('privacy-local-progress','Actual new local aggregate record and no-account/sync disclosure')
seek('asks you to confirm deletion');screenshot('privacy-progress-deletion','Actual scoped progress deletion and preference/backup controls')
route('audio-help',cold=True);seek('Every submitted answer adds');screenshot('help-local-progress','Updated progress/text-alternative/reset help')
mark('support-progress-inventory-and-help')
