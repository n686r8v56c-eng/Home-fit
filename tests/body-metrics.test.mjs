import test from 'node:test';
import assert from 'node:assert/strict';
import {dailyRows,difference,saveMeasurement,valueFor,validDay,shiftDay} from '../src/bodyMetrics.mjs';

test('legacy keys and computed BMI remain compatible; missing values stay empty',()=>{
 const row={date:'2026-11-02',weight:64,fat:21,muscle:28};
 assert.ok(Math.abs(valueFor(row,'bmi',160)-25)<1e-10);
 assert.equal(valueFor(row,'waist_cm',160),null);
 assert.equal(valueFor(row,'bmi',null),null);
 assert.equal(valueFor({weight:null},'bmi',160),null);
});
test('daily representative uses last array entry without changing duplicate records',()=>{
 const rows=[{date:'2026-11-02',weight:60},{date:'2026-11-01',weight:61},{date:'2026-11-02',fat:20}];
 const original=structuredClone(rows),daily=dailyRows(rows);
 assert.equal(daily.length,2);assert.equal(daily[1].index,2);
 assert.equal(valueFor(daily[1].row,'weight'),null);
 assert.deepEqual(rows,original);
});
test('exact dates required for daily and seven-day differences, including null measurements',()=>{
 const rows=[{date:'2026-10-26',weight:65},{date:'2026-10-31',weight:63},{date:'2026-11-02',weight:64,fat:20}];
 assert.equal(difference(rows,'2026-11-02','weight',160),null);
 assert.equal(difference(rows,'2026-11-02','weight',160,7),-1);
 assert.equal(difference(rows,'2026-11-01','weight',160),null);
 assert.equal(difference([...rows,{date:'2026-11-01',fat:21}],'2026-11-02','fat',160),-1);
 assert.equal(difference([...rows,{date:'2026-11-01',weight:null}],'2026-11-02','weight',160),null);
});
test('editing and correcting dates preserve unknown metadata and other records',()=>{
 const rows=[{date:'2026-11-02',weight:60,unknown:{source:'scale'}},{date:'2026-11-02',weight:61}];
 const next=saveMeasurement(rows,0,{date:'2026-11-01',waist_cm:70,hip_cm:90,thigh_cm:50});
 assert.equal(next.length,2);assert.equal(next[0].weight,60);
 assert.deepEqual(next[0].unknown,{source:'scale'});assert.strictEqual(next[1],rows[1]);
 assert.equal(rows[0].date,'2026-11-02');
 const appended=saveMeasurement(next,null,{date:'2026-11-03',waist_cm:71});
 assert.equal(appended.length,3);assert.equal(appended[2].weight,undefined);
});
test('valid dates and calendar offsets handle leap years and month boundaries',()=>{
 assert.equal(validDay('2024-02-29'),true);assert.equal(validDay('2025-02-29'),false);
 assert.equal(validDay('2026-02-31'),false);assert.equal(validDay(''),false);
 assert.equal(shiftDay('2026-01-01',-1),'2025-12-31');
 assert.equal(shiftDay('2024-03-01',-1),'2024-02-29');
});
