import {speakVoice,stopVoice} from './sequenceSpeech.mjs';
import {getVoiceVolume} from './SequenceMetronome';
import SequenceMetronome,{useFinalCountdown} from './SequenceMetronome';
import React,{useEffect,useRef,useState} from 'react';
import {exerciseSupabase} from '../supabase';
const format=n=>`${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;
export default function SequencePlayer({sequence,close,onComplete,done}){
 const [index,setIndex]=useState(0),[remaining,setRemaining]=useState(sequence.items[0]?.seconds||0),[running,setRunning]=useState(false),[finished,setFinished]=useState(false),[photos,setPhotos]=useState({}),[voice,setVoice]=useState(true);
 const deadline=useRef(0),latest=useRef(remaining);
 const active=sequence.items[index];
 useFinalCountdown({active:running,remaining,step:index,voice,enabled:active?.reps==null});
 latest.current=remaining;
 useEffect(()=>{
  let alive=true;
  Promise.all(sequence.items.filter(x=>x.imagePath).map(async item=>{
   try{const {data,error}=await exerciseSupabase.storage.from(item.bucket||'mindflow-yoga').createSignedUrl(item.imagePath,3600);return [item.imagePath,error?'':data?.signedUrl||'']}catch{return [item.imagePath,'']}
  })).then(entries=>{if(alive)setPhotos(Object.fromEntries(entries))});
  return()=>{alive=false};
 },[sequence]);
 useEffect(()=>{const handler=e=>{if(e.key==='Escape')close()};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler)},[close]);
 useEffect(()=>{
  if(!running||!voice||!active||!('speechSynthesis'in window))return;
  stopVoice();const u=new SpeechSynthesisUtterance(`${active.name} ${active.side&&active.side!=='기본'?active.side:''}`);u.lang='ko-KR';(u.volume=getVoiceVolume(),speakVoice(u));
 },[running,index,voice]);
 useEffect(()=>()=>{if('speechSynthesis'in window)stopVoice()},[]);
 useEffect(()=>{
  if(!running||active?.reps!=null)return;
  deadline.current=Date.now()+latest.current*1000;
  const timer=setInterval(()=>{
   const seconds=Math.max(0,Math.ceil((deadline.current-Date.now())/1000));setRemaining(seconds);
   if(seconds===0){if(index+1<sequence.items.length){setIndex(index+1);setRemaining(sequence.items[index+1].seconds)}else{setRunning(false);setFinished(true)}}
  },200);
  return()=>clearInterval(timer);
 },[running,index,sequence]);
 function jump(next){if(next>=sequence.items.length){setRunning(false);setFinished(true);return}setIndex(next);setRemaining(sequence.items[next].seconds);setFinished(false)}
 const image=photos[active?.imagePath]||active?.image;
 return <div className="overlay" onClick={close}><section className="sheet exercise-player" role="dialog" aria-modal="true" aria-label={`${sequence.title} 실행`} onClick={e=>e.stopPropagation()}><div className="modal-header"><SequenceMetronome active={running}/><h2>{sequence.title}</h2><button onClick={close} aria-label="닫기">✕</button></div><p>{sequence.activity} · {index+1} / {sequence.items.length}</p>{image&&<img className="exercise-player-photo" src={image} alt={active?.name}/>}<h3>{finished?'시퀀스 종료':active?.name}</h3><p>{active?.side} {active?.description||active?.notes||active?.caution}</p><div className="exercise-timer">{finished?'완료':active?.reps!=null?`${active.weight??0}kg · ${active.reps}회`:format(remaining)}</div><label className="exercise-voice"><input type="checkbox" checked={voice} onChange={e=>setVoice(e.target.checked)}/>한국어 동작 음성 안내</label><div className="exercise-player-actions"><button disabled={!index} onClick={()=>jump(index-1)}>이전</button><button onClick={()=>{if(finished){jump(0);setRunning(true)}else setRunning(x=>!x)}}>{running?'일시정지':finished?'다시 시작':'시작 / 재개'}</button><button disabled={finished} onClick={()=>jump(index+1)}>다음</button></div><button className="primary full" disabled={done} onClick={()=>{setRunning(false);onComplete()}}>{done?'완료 기록됨':'운동 완료 기록'}</button><p className="hint">일정에 선택한 날짜로 완료 기록을 남겨요. 기기를 잠그면 재생과 타이머가 제한될 수 있어요.</p><details><summary>전체 동작 보기</summary><ol>{sequence.items.map((x,i)=><li key={i}>{x.name} {x.side} · {x.reps!=null?`${x.weight??0}kg · ${x.reps}회`:format(x.seconds)}</li>)}</ol></details></section></div>;
}
