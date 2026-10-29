import React,{createContext,useContext,useState} from 'react';
import {makeBookmarkVideo,makeSequence} from './scheduling';
export const ExerciseContext=createContext(null);
export const useExercise=()=>useContext(ExerciseContext);
export function ScheduleButton({sequence}){
 const context=useExercise();
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 if(!context)return null;
 async function schedule(){
  setBusy(true);setError('');
  try{
   const snapshot=makeSequence(sequence);
   // Browser-only photos use object URLs, which expire when the screen unmounts.
   // Keep an embedded copy in this schedule rather than persisting an invalid URL.
   snapshot.items=await Promise.all(snapshot.items.map(async item=>{
    if(!item.image?.startsWith('blob:'))return item;
    const response=await fetch(item.image);if(!response.ok)throw Error('사진을 읽을 수 없어요.');const blob=await response.blob();
    const image=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob)});
    return {...item,image};
   }));
   context.onSchedule(snapshot);
  }catch(e){setError(e.message)}finally{setBusy(false)}
 }
 return <><button type="button" className="exercise-schedule-button" disabled={busy||!(sequence.items||sequence.steps)?.length} onClick={schedule}>{busy?'준비 중…':'＋ 일정 추가'}</button>{error&&<small role="alert">{error}</small>}</>;
}

export function BookmarkScheduleButton({bookmark,activity}){
 const context=useExercise();
 const [error,setError]=useState('');
 if(!context)return null;
 return <><button type="button" style={{display:'block',width:'100%',marginTop:7,padding:'8px 4px',border:'1px solid #e0d1ed',borderRadius:10,background:'#f3ebf8',color:'#735989',fontSize:12,cursor:'pointer'}} onClick={e=>{e.preventDefault();e.stopPropagation();try{setError('');context.onSchedule(makeBookmarkVideo(bookmark,activity))}catch(err){setError(err.message)}}}>＋ 일정 추가</button>{error&&<small role="alert">{error}</small>}</>;
}
