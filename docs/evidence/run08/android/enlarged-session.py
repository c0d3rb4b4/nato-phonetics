from sessions import *

def answer_first():
    top();screenshot('enlarged-question','Cold 2× quiz question and proportionally enlarged portrait tile','dark')
    tap_node(scroll_to(rid='quiz-choice-0'))
    scroll_to(desc='Next question')

def main():
    adb('shell','settings','put','system','font_scale','1');time.sleep(2)
    route('letter-quiz',cold=True);expect(desc='Start round');click('5 questions');click('Start round')
    tap_node(scroll_to(rid='quiz-choice-0'));scroll_to(desc='Next question')
    before=runtime("(()=>{const h=__REACT_DEVTOOLS_GLOBAL_HOOK__;const nodes=[];function visit(n){if(!n)return;if(n.memoizedProps?.testID==='quiz-progress')nodes.push(n.memoizedProps.children);visit(n.child);visit(n.sibling)};for(const id of h.renderers.keys())for(const r of h.getFiberRoots(id))visit(r.current);return nodes;})()")
    adb('shell','settings','put','system','font_scale','2');time.sleep(3)
    scroll_to(desc='Next question');frame_capture('submitted-live-scale2-controls')
    click('End round and review');top();frame_capture('results-live-scale2')
    assert find(dump(),contains='of 5 questions answered') is not None
    mark('submitted-live-scale2-retains-round',previousProgress=before)
    adb('shell','settings','put','system','font_scale','1');time.sleep(2)
    route('letter-quiz',cold=True);expect(desc='Start round')
    adb('shell','settings','put','system','font_scale','2');time.sleep(2)
    route('letter-quiz',cold=True);expect(desc='Start round');click('5 questions');click('Start round')
    answer_first();frame_capture('feedback-cold-scale2-controls')
    click('End round and review');top();frame_capture('results-cold-scale2')
    assert find(dump(),contains='of 5 questions answered') is not None
    mark('cold-scale2-question-feedback-review-reachable')
    adb('shell','settings','put','system','font_scale','1')

if __name__=='__main__':main()
