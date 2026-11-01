import {createServer} from 'vite';
import assert from 'node:assert/strict';
const server=await createServer({cacheDir:'/workspace/home-fit-runtime/test-vite-cache',server:{middlewareMode:true},appType:'custom'});
try{
 const {readExercise}=await server.ssrLoadModule('/src/processExercise.js');
 const scopes=[],pages=[],storagePrefixes=[];
 const client={from(table){return {select(){return this},eq(key,value){scopes.push([table,key,value]);return this},async range(start,end){pages.push([table,start,end]);if(table==='mindflow_activity_moves')return {error:{message:'fixture denial'},data:null};return {data:table==='mindflow_activity_sequences'?(start===0?Array.from({length:1000},(_,i)=>({id:i})):start===1000?[{id:1000}]:[]):[]}}}},storage:{from(bucket){return {async list(prefix,options){storagePrefixes.push([bucket,prefix,options.offset]);if(bucket==='mindflow-yoga'&&prefix==='user-a')return {data:[{id:null,metadata:null,name:'yoga'}]};if(prefix==='user-a/yoga')return {data:[{id:'photo',name:'one.jpg',metadata:{},created_at:'2026-11-02T00:00:00Z'}]};return {data:[]}}}}}};
 const result=await readExercise(client,'user-a');
 assert.equal(result.rows.find(x=>x.table==='mindflow_activity_sequences').rows.length,1001);
 assert.ok(pages.some(([table,start])=>table==='mindflow_activity_sequences'&&start===1000));
 assert.ok(scopes.every(([,key,value])=>key==='user_id'&&value==='user-a'));
 assert.ok(storagePrefixes.every(([,prefix])=>prefix==='user-a'||prefix.startsWith('user-a/')));
 assert.equal(result.rows.filter(x=>x.table==='storage').flatMap(x=>x.rows).length,1);
 assert.equal(result.errors.length,1);assert.match(result.errors[0],/fixture denial/);
 console.log('PASS: paginated Exercise reads, per-user scope, user-prefix recursive photo reads, independent source failures preserve available data.');
}finally{await server.close()}
