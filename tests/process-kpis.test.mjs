import test from 'node:test';
import assert from 'node:assert/strict';
import {rangeFor,actualFor,collectExercise,configOf,allKpis,editConfig,saveKpi,putEntry,removeItem} from '../src/processKpis.mjs';
const auto=(id,period='week')=>({source:'auto',sourceId:id,period,target:null});

test('period boundaries use calendar week/month and rolling 90 days',()=>{
 assert.deepEqual(rangeFor('week','2026-11-01'),['2026-10-26','2026-11-01']);
 assert.deepEqual(rangeFor('month','2024-02-29'),['2024-02-01','2024-02-29']);
 assert.deepEqual(rangeFor('90','2026-11-02'),['2026-08-05','2026-11-02']);
 assert.throws(()=>rangeFor('day','2026-02-31'));
});
test('execution reads completed actual time/attendance only and reuses strategy goals',()=>{
 const record={strategy:{workout:{days:4,minutes:45}},timeLogs:{'2026-11-02':{workout:{done:true,minutes:30},stretch:{done:false,minutes:99}},'2026-11-03':{workout:{done:true,minutes:999}}},attendance:{'2026-11-02':true,'2026-11-03':true},plans:[{date:'2026-11-02',minutes:800}],completions:[{date:'2026-11-02',minutes:800}]};
 assert.equal(actualFor(auto('workout'),record,{},'2026-11-02').value,30);
 assert.equal(actualFor(auto('workout'),record,{},'2026-11-02').target,180);
 assert.equal(actualFor(auto('stretch'),record,{},'2026-11-02').value,0);
 assert.equal(actualFor(auto('attendance'),record,{},'2026-11-02').value,1);
 assert.equal(actualFor({...auto('workout'),target:0},record,{},'2026-11-02').target,0);
});
test('body uses the last daily representative and latest actual measurement in period; never sums or stores BMI',()=>{
 const record={bodyHeight:160,bodyMeasurements:[{date:'2026-10-01',weight:70},{date:'2026-11-01',weight:64,waist_cm:72},{date:'2026-11-01',weight:65},{date:'2026-11-02',weight:null,waist_cm:73}]};
 assert.equal(actualFor(auto('body:weight'),record,{},'2026-11-01').value,65);
 assert.ok(Math.abs(actualFor(auto('body:bmi'),record,{},'2026-11-01').value-25.390625)<1e-9);
 assert.equal(actualFor(auto('body:weight','day'),record,{},'2026-11-02').value,null);
 assert.equal(actualFor(auto('body:waist_cm','day'),record,{},'2026-11-02').value,73);
 assert.equal(record.bodyMeasurements[1].bmi,undefined);
});
test('learning deduplicates legacy copies, excludes presets/snapshots, and never dates unknown records today',()=>{
 const local={sequences:[{id:'s',items:[]}],presets:[{id:'preset'}],activityStudios:{yoga:{saved:[{id:'s'},{id:'preset:p'},{id:'new',createdAt:'2026-11-02T12:00:00Z'}],exercises:[{imagePath:'u/photo.jpg',bucket:'mindflow-yoga'}]}}};
 const remote=[{table:'mindflow_studio_data',rows:[{studio:'yoga',data:{saved:[{id:'s'}]}}]},{table:'storage',rows:[{path:'u/photo.jpg',bucket:'mindflow-yoga',created_at:'2026-11-02T12:00:00Z'}]}];
 const collected={...collectExercise(local,remote),complete:true};
 assert.equal(collected.sequence.length,2);assert.equal(collected.photo.length,1);
 const result=actualFor(auto('sequence','day'),{},collected,'2026-11-02');
 assert.equal(result.value,1);assert.equal(result.total,2);assert.equal(result.unknown,1);
 assert.equal(actualFor(auto('photo','day'),{},collected,'2026-11-02').value,1);
 assert.equal(actualFor(auto('sequence','day'),{},{sequence:[{id:'s',date:null}],complete:true},'2026-11-02').value,null);
 assert.equal(actualFor(auto('sequence'),{},{sequence:[],complete:false},'2026-11-02').value,null);
});
test('manual entries are immutable, editable by ID, date-filtered and independently deletable',()=>{
 let k={id:'manual',source:'manual',period:'month',target:10,entries:[]};
 k=putEntry(k,{id:'a',date:'2026-11-01',value:3});k=putEntry(k,{id:'b',date:'2026-11-01',value:4});
 assert.equal(actualFor(k,{},null,'2026-11-02').value,7);
 const next=putEntry(k,{id:'a',date:'2026-10-01',value:8});
 assert.equal(k.entries[0].value,3);assert.equal(actualFor(next,{},null,'2026-11-02').value,4);
 assert.throws(()=>putEntry({...k,source:'auto'},{id:'z',date:'2026-11-02',value:1}));
 assert.throws(()=>putEntry(k,{id:'x',date:'2026-02-30',value:1}));
 assert.throws(()=>putEntry(k,{id:'x',date:'2026-11-02',value:''}));
});
test('archive is default, deleting groups never touches original records; categories 4-7 start empty',()=>{
 const record={bodyHeight:160,bodyMeasurements:[{date:'2026-11-02',weight:64}],custom:{keep:true},processKpis:{groups:[{id:'g',stage:'social',name:'소통'}],kpis:[{id:'k',stage:'social',groupId:'g',source:'manual',entries:[{id:'e',value:2}]}],builtins:{},future:{keep:true}}};
 const cfg=configOf(record),archived=removeItem(cfg,'group','g');
 assert.equal(archived.groups[0].archived,true);assert.deepEqual(archived.kpis,cfg.kpis);
 const updated=editConfig(record,c=>removeItem(c,'group','g','delete'));
 assert.deepEqual(updated.bodyMeasurements,record.bodyMeasurements);assert.deepEqual(updated.custom,{keep:true});assert.equal(updated.processKpis.kpis.length,0);assert.deepEqual(updated.processKpis.future,{keep:true});
 const hidden=removeItem(cfg,'kpi','auto:body:weight','delete');
 assert.equal(hidden.builtins['auto:body:weight'].archived,true);
 assert.ok(allKpis({}).every(x=>['learning','execution','outcome'].includes(x.stage)));
 const saved=saveKpi(cfg,{id:'k',name:'rename'});assert.equal(saved.kpis[0].entries.length,1);
 assert.equal(record.processKpis.kpis[0].name,undefined);
});
