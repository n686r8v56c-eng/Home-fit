import {useEffect,useState} from 'react';
import {exerciseSupabase as db} from './supabase';
const tables=['mindflow_studio_data','mindflow_snpe_studio','mindflow_activity_sequences','mindflow_foam_roller_sequences','mindflow_activity_moves','mindflow_foam_roller_moves','mindflow_yoga_photos'];
export async function readExercise(client,userId){
 const results=await Promise.all(tables.map(async table=>{
  const rows=[];
  try{for(let offset=0;;offset+=1000){const {data,error}=await client.from(table).select('*').eq('user_id',userId).range(offset,offset+999);if(error)throw error;rows.push(...(data||[]));if(!data||data.length<1000)break;}return {table,rows};}
  catch(error){return {table,rows,error:error.message||'조회 실패'};}
 }));
 // Storage created_at is authoritative for uploads; pose-table creation dates
 // are not photo creation dates. Only scan this authenticated user's prefix.
 if(client.storage){
  const storage=await Promise.all(['mindflow-yoga','mindflow-studio-photos'].map(async bucket=>{
   const rows=[],folders=[userId],seen=new Set();
   try{while(folders.length){const prefix=folders.shift();if(seen.has(prefix))continue;seen.add(prefix);
    for(let offset=0;;offset+=1000){const {data,error}=await client.storage.from(bucket).list(prefix,{limit:1000,offset,sortBy:{column:'name',order:'asc'}});if(error)throw error;
     for(const file of data||[]){const path=`${prefix}/${file.name}`;if(file.id==null&&file.metadata==null)folders.push(path);else if(/\.(jpe?g|png|webp|avif)$/i.test(file.name))rows.push({bucket,path,created_at:file.created_at});}
     if(!data||data.length<1000)break;
    }
   }return {table:'storage',rows};}catch(error){return {table:'storage',rows,error:'운동 사진 조회 실패'};}
  }));results.push(...storage);
 }
 return {rows:results.map(({table,rows})=>({table,rows})),errors:results.filter(x=>x.error).map(x=>`${x.table}: ${x.error}`)};
}
export function useExerciseMetrics(enabled){
 const [state,setState]=useState({rows:[],status:'운동 계정 연동 대기'}),[version,setVersion]=useState(0);
 useEffect(()=>{if(!db)return;const {data:{subscription}}=db.auth.onAuthStateChange(()=>{setState({rows:[],status:'운동 계정 확인 중'});setVersion(x=>x+1)});return()=>subscription.unsubscribe()},[]);
 useEffect(()=>{
  if(!enabled||!db)return;
  let alive=true;setState({rows:[],status:'Exercise 저장본 조회 중'});
  (async()=>{const {data,error}=await db.auth.getUser();if(error||!data.user)throw Error('운동 계정 연동 대기 · Exercise에서 로그인해 주세요.');
   const result=await readExercise(db,data.user.id);if(alive)setState({rows:result.rows,status:result.errors.length?'일부 Exercise 자료 연동 대기 · 계정 연결을 확인하고 새로고침해 주세요.':'Exercise 연결 완료 · 현재 저장본 기준'});
  })().catch(error=>{if(alive)setState({rows:[],status:error.message})});
  return()=>{alive=false};
 },[enabled,version]);
 return {...state,refresh:()=>setVersion(x=>x+1)};
}
