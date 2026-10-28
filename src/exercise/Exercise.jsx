import React,{useEffect,useState} from 'react';
import YogaLibrary from './YogaLibrary';
import {ExerciseContext} from './ExerciseContext';
import {exerciseSupabase,supabase} from '../supabase';
import {mergeYogaData} from './scheduling';
import './exercise.css';
class ExerciseBoundary extends React.Component{
 state={error:null};
 static getDerivedStateFromError(error){return {error}}
 render(){return this.state.error?<p role="alert">운동 화면을 열지 못했어요. 새로고침 후 다시 시도해 주세요. {this.state.error.message}</p>:this.props.children}
}
export default function Exercise(props){
 const [session,setSession]=useState(undefined),[error,setError]=useState(''),[busy,setBusy]=useState(false),[revision,setRevision]=useState(0);
 useEffect(()=>{
  if(!exerciseSupabase){setSession(null);return}
  let alive=true;
  exerciseSupabase.auth.getSession().then(({data,error})=>{if(alive){if(error)setError(error.message);setSession(data?.session||null)}}).catch(e=>{if(alive){setError(e.message);setSession(null)}});
  const {data:{subscription}}=exerciseSupabase.auth.onAuthStateChange((_event,value)=>{if(alive)setSession(value)});
  return()=>{alive=false;subscription.unsubscribe()};
 },[]);
 async function login(e){e.preventDefault();setBusy(true);setError('');try{const form=new FormData(e.currentTarget);const {error}=await exerciseSupabase.auth.signInWithPassword({email:String(form.get('email')).trim(),password:String(form.get('password'))});if(error)throw error}catch(e){setError(e.message)}finally{setBusy(false)}}
 async function importBackup(e){
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  setBusy(true);setError('');
  try{
   const backup=JSON.parse(await file.text());
   if(backup.format!=='mind-flow-exercise-v1')throw Error('Mind Flow 운동 백업 파일을 선택해 주세요.');
   for(const key of ['sequences','presets'])if(!Array.isArray(backup[key])||backup[key].some(x=>!x?.id||!Array.isArray(x.items)))throw Error('시퀀스 형식이 올바르지 않아요.');
   const photos=backup.photos||{};
   if(Object.values(photos).some(v=>typeof v!=='string'||!/^data:image\/(jpeg|png|webp);base64,/.test(v)))throw Error('사진 형식이 올바르지 않아요.');
   props.onLocalChange(old=>({...mergeYogaData(old,backup),photos:{...photos,...(old.photos||{})}}));
   setRevision(x=>x+1);setError('가져오기 완료. 같은 ID의 기존 구성과 사진은 유지했어요.');
  }catch(e){setError('가져오기 실패: '+e.message)}finally{setBusy(false)}
 }
 if(session===undefined)return <p>운동 계정 확인 중…</p>;
 return <div className="exercise-root">
  {error&&<p role="status" className="exercise-notice">{error}</p>}
  {!exerciseSupabase?<p role="alert">운동 Supabase 연결 설정을 확인해 주세요.</p>:!session?<form onSubmit={login} className="exercise-login"><h2>기존 운동 계정 연결</h2><p>Mind Flow에서 사용한 계정으로 로그인하면 기존 운동·사진·북마크를 불러와요.</p><label>이메일<input name="email" type="email" required autoComplete="username"/></label><label>비밀번호<input name="password" type="password" required autoComplete="current-password"/></label><button className="primary" disabled={busy}>운동 계정 연결</button></form>:<>
   {exerciseSupabase!==supabase&&<p className="exercise-notice">운동 계정: {session.user.email} <button onClick={()=>exerciseSupabase.auth.signOut()}>연결 해제</button></p>}
   <details className="exercise-transfer"><summary>이전 기기의 요가 시퀀스·사진 가져오기</summary><p>Supabase에 저장된 운동은 기존 계정에서 바로 불러와요. Mind Flow 브라우저에만 있던 요가 시퀀스·프리셋·사진은 백업을 가져와 주세요. 기존 항목은 덮어쓰지 않아요.</p><p><a href="/exercise-export.js" download>읽기 전용 내보내기 스크립트</a>를 Mind Flow를 사용하던 브라우저의 개발자 도구 콘솔에서 실행하면 백업 JSON이 내려받아져요. 원본 데이터는 변경하지 않아요.</p><label>백업 JSON 가져오기<input type="file" accept="application/json,.json" disabled={busy} onChange={importBackup}/></label></details>
   <ExerciseContext.Provider value={{...props,sourceUserId:session.user.id}}><ExerciseBoundary key={`${session.user.id}:${revision}`}><YogaLibrary/></ExerciseBoundary></ExerciseContext.Provider>
  </>}
 </div>;
}
