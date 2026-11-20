import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuizSession, currentQuizQuestion, quizActionGuard, submitQuizAnswer, nextQuizQuestion,
  quizSessionResults, retryQuizMistakes, restartQuizSession, cancelQuizSession } from '../src/lib/quizSession.js';
import { PRACTICE_ENTRIES, entrySymbol } from '../src/lib/practiceSets.js';

const answer = (s, value) => submitQuizAnswer(s, quizActionGuard(s), value);
const next = s => nextQuizQuestion(s, quizActionGuard(s));

test('listening covers every letter/digit with four distinct same-category symbols and correct scoring', () => {
  let s = createQuizSession({mode:'listening', length:36, symbols:PRACTICE_ENTRIES.map(entrySymbol)});
  const seen=[];
  while(s.phase !== 'complete') {
    const q=currentQuizQuestion(s), symbol=entrySymbol(q.correct);seen.push(symbol);
    assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);
    assert.equal(q.options.filter(x=>x===symbol).length,1);
    assert.ok(q.options.every(x=>/\d/.test(x)===/\d/.test(symbol)));
    assert.equal(answer(s,q.correct.word),s,'A code word is not a listening choice');
    s=next(answer(s,symbol));
  }
  assert.equal(new Set(seen).size,36);assert.equal(quizSessionResults(s).correct,36);
});

test('typed recall accepts documented equivalences and rejects phonetic guides, blanks and overlong input', () => {
  for(const [symbol,value] of [['A',' ÁL-PHA! '],['J',' ju liet '],['X','X RAY'],['3','Three'],['5','five'],['9','NINE']]) {
    const s=createQuizSession({mode:'typed',symbols:[symbol],length:1});
    assert.deepEqual(currentQuizQuestion(s).options,[]);
    assert.equal(answer(s,value).attempts[0].correct,true);
    for(const invalid of ['', ' ! -- ', 'a'.repeat(81)]) assert.equal(answer(s,invalid),s);
    assert.equal(answer(s,'unrelated').attempts[0].correct,false);
  }
  for(const [symbol,value] of [['3','Tree'],['5','Fife'],['9','Niner']]) {
    assert.equal(answer(createQuizSession({mode:'typed',symbols:[symbol],length:1}),value).attempts[0].correct,false);
  }
});

test('recall feedback, retry and restart retain mode and reject duplicate/stale/cancelled submissions', () => {
  for(const mode of ['listening','typed']) {
    let s=createQuizSession({mode,symbols:['A','3'],length:2});
    const original=s, guard=quizActionGuard(s), q=currentQuizQuestion(s);
    const wrong=mode==='typed'?'wrong':q.options.find(x=>x!==entrySymbol(q.correct));
    s=submitQuizAnswer(s,guard,wrong);
    assert.equal(s.phase,'feedback');assert.equal(submitQuizAnswer(s,guard,wrong),s);
    s=next(s);
    assert.equal(submitQuizAnswer(s,guard,wrong),s);
    const q2=currentQuizQuestion(s);s=next(answer(s,mode==='typed'?q2.correct.word:entrySymbol(q2.correct)));
    const results=quizSessionResults(s);assert.equal(results.correct,1);assert.equal(results.accuracyPercent,50);
    const retry=retryQuizMistakes(s);assert.equal(retry.mode,mode);assert.equal(retry.length,1);
    assert.equal(currentQuizQuestion(retry).id.symbol,q.id.symbol);
    assert.equal(submitQuizAnswer(retry,guard,wrong),retry);
    const cancelled=cancelQuizSession(retry);assert.equal(answer(cancelled,wrong),cancelled);
    assert.equal(restartQuizSession(s).mode,mode);
    assert.equal(restartQuizSession(s,{mode:'choice'}).mode,'choice');
    assert.equal(original.attempts.length,0);
  }
  assert.throws(()=>createQuizSession({mode:'unknown'}),RangeError);
});
