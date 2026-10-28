import test from 'node:test';
import assert from 'node:assert/strict';
import {makeSequence,addSequencePlan,toggleCompletion,mergeYogaData} from '../src/exercise/scheduling.js';
const baseline=()=>({folders:['기존'],videos:[{id:'video-1',title:'기존 영상'}],notes:[{id:'note-1'}],plans:[{date:'2026-10-29',videoId:'video-1',kind:'workout'}],completions:[{date:'2026-10-28',videoId:'video-1'}],unknown:{keep:true}});
const sequence=()=>makeSequence({id:'sequence-1',name:'골반 시퀀스',activity:'골반순환',items:[{name:'동작',seconds:60,imagePath:'user/photo.jpg'}]});
test('scheduling preserves all legacy data and snapshots the full sequence',()=>{
 const old=baseline(),source=sequence();const next=addSequencePlan(old,'2026-10-29',source);
 assert.equal(old.plans.length,1);assert.equal(next.plans.length,2);
 for(const key of ['folders','videos','notes','completions','unknown'])assert.deepEqual(next[key],old[key]);
 source.items[0].name='changed';assert.equal(next.plans[1].sequence.items[0].name,'동작');
 assert.equal(next.plans[1].sequence.items[0].imagePath,'user/photo.jpg');
});
test('same sequence and date updates rather than duplicating; different dates remain independent',()=>{
 let data=addSequencePlan(baseline(),'2026-10-29',sequence());
 data=addSequencePlan(data,'2026-10-29',sequence(),'skin');assert.equal(data.plans.length,2);assert.equal(data.plans[1].kind,'skin');
 data=addSequencePlan(data,'2026-10-30',sequence());assert.equal(data.plans.length,3);
});
test('completed snapshot survives schedule deletion and rescheduling',()=>{
 let data=addSequencePlan(baseline(),'2026-10-29',sequence());const id=sequence().id;
 data=toggleCompletion(data,'2026-10-29',id);assert.equal(data.completions.length,2);
 data={...data,plans:data.plans.filter(p=>p.videoId!==id)};
 assert.equal(data.completions[1].sequence.title,'골반 시퀀스');
 data=toggleCompletion(data,'2026-10-29',id);assert.equal(data.completions.length,1);assert.equal(data.completions[0].videoId,'video-1');
});
test('legacy video completion retains compatible record shape',()=>{
 const result=toggleCompletion(baseline(),'2026-10-29','video-1').completions.at(-1);
 assert.equal(result.videoId,'video-1');assert.equal(result.sequence,undefined);
});
test('imports merge missing IDs without overwriting existing presets or metadata',()=>{
 const current={sequences:[{id:'a',name:'original'}],presets:[{id:'p'}],extra:123};
 const incoming={sequences:[{id:'a',name:'replace'},{id:'b'},{id:'b'}],presets:[{id:'p'},{id:'q'}]};
 assert.deepEqual(mergeYogaData(current,incoming),{sequences:[{id:'a',name:'original'},{id:'b'}],presets:[{id:'p'},{id:'q'}],extra:123});
});
test('all sequence adapters normalize names, duration, and category',()=>{
 for(const [activity,kind] of [['요가','stretch'],['SNPE','workout'],['골반순환','stretch'],['매트 필라테스','workout'],['폼롤러','skin'],['마사지','skin'],['덤벨','workout']]){
  const s=makeSequence({id:'x',title:'t',activity,steps:[{title:'움직임',seconds:30},{name:'박자',beats:8}],bpm:30});
  assert.equal(s.kind,kind);assert.equal(s.items[0].name,'움직임');assert.equal(s.items[1].seconds,16);assert.equal(s.minutes,1);
 }
});
