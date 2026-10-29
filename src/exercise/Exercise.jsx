import React,{useEffect,useState} from 'react';
import YogaLibrary from './YogaLibrary';
import {ExerciseContext} from './ExerciseContext';
import {exerciseSupabase,supabase} from '../supabase';
import './exercise.css';
class ExerciseBoundary extends React.Component{
 state={error:null};
 static getDerivedStateFromError(error){return {error}}
 render(){return this.state.error?<p role="alert">운동 화면을 열지 못했어요. 새로고침 후 다시 시도해 주세요. {this.state.error.message}</p>:this.props.children}
}
export default function Exercise(props){
 const [session,setSession]=useState(undefined),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{
  if(!exerciseSupabase){setSession(null);return}
  let alive=true;
  exerciseSupabase.auth.getSession().then(({data,error})=>{if(alive){if(error)setError(error.message);setSession(data?.session||null)}}).catch(e=>{if(alive){setError(e.message);setSession(null)}});
  const {data:{subscription}}=exerciseSupabase.auth.onAuthStateChange((_event,value)=>{if(alive)setSession(value)});
  return()=>{alive=false;subscription.unsubscribe()};
 },[]);
 async function login(e){e.preventDefault();setBusy(true);setError('');try{const form=new FormData(e.currentTarget);const {error}=await exerciseSupabase.auth.signInWithPassword({email:String(form.get('email')).trim(),password:String(form.get('password'))});if(error)throw error}catch(e){setError(e.message)}finally{setBusy(false)}}
 if(session===undefined)return <p>운동 계정 확인 중…</p>;
 return <div className="exercise-root">
  {error&&<p role="status" className="exercise-notice">{error}</p>}
  {!exerciseSupabase?<p role="alert">운동 Supabase 연결 설정을 확인해 주세요.</p>:!session?<form onSubmit={login} className="exercise-login"><h2>기존 운동 계정 연결</h2><p>Mind Flow에서 사용한 계정으로 로그인하면 기존 운동·사진·북마크를 불러와요.</p><label>이메일<input name="email" type="email" required autoComplete="username"/></label><label>비밀번호<input name="password" type="password" required autoComplete="current-password"/></label><button className="primary" disabled={busy}>운동 계정 연결</button></form>:<>
   {exerciseSupabase!==supabase&&<p className="exercise-notice">운동 계정: {session.user.email} <button onClick={()=>exerciseSupabase.auth.signOut()}>연결 해제</button></p>}

   <ExerciseContext.Provider value={{...props,sourceUserId:session.user.id}}><ExerciseBoundary key={session.user.id}><YogaLibrary/></ExerciseBoundary></ExerciseContext.Provider>
  </>}
 </div>;
}
