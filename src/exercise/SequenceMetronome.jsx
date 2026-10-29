import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
let audio;
function unlock(){try{const C=window.AudioContext||window.webkitAudioContext;if(C){audio??=new C();if(audio.state==='suspended')void audio.resume().catch(()=>{})}}catch{}}
if(typeof window!=='undefined')window.addEventListener('pointerdown',unlock,{capture:true,passive:true});
export default function SequenceMetronome({active}){
 const [bpm,setBpm]=useState(30),[enabled,setEnabled]=useState(true),[blocked,setBlocked]=useState(false);
 const nodes=useRef(new Set());
 useEffect(()=>{
  if(!active||!enabled)return;unlock();if(!audio){setBlocked(true);return;}
  let next=audio.currentTime,alive=true;const context=audio;
  const tick=()=>{if(!alive)return;if(context.state!=='running'){setBlocked(true);return;}setBlocked(false);if(next<context.currentTime-.1)next=context.currentTime;
   while(next<context.currentTime+.08){const oscillator=context.createOscillator(),gain=context.createGain();oscillator.frequency.value=900;gain.gain.setValueAtTime(0,next);gain.gain.linearRampToValueAtTime(.12,next+.002);gain.gain.exponentialRampToValueAtTime(.001,next+.045);oscillator.connect(gain);gain.connect(context.destination);nodes.current.add(oscillator);oscillator.onended=()=>{nodes.current.delete(oscillator);oscillator.disconnect();gain.disconnect()};oscillator.start(next);oscillator.stop(next+.05);next+=60/bpm;}
  };tick();const id=setInterval(tick,25);
  return()=>{alive=false;clearInterval(id);for(const node of nodes.current){try{node.stop()}catch{}}nodes.current.clear()};
 },[active,enabled,bpm]);
 if(!active||typeof document==='undefined')return null;
 return createPortal(<aside aria-label="메트로놈" onClick={e=>e.stopPropagation()} style={{position:'fixed',top:'max(8px,env(safe-area-inset-top))',left:'50%',transform:'translateX(-50%)',zIndex:20000,background:'#fff',border:'1px solid #decdea',borderRadius:14,padding:'8px 12px',boxShadow:'0 3px 15px #0002',width:'min(300px,85vw)',color:'#654e78',fontSize:13}}><label><input type="checkbox" checked={enabled} onChange={e=>{unlock();setEnabled(e.target.checked)}}/> 메트로놈 · {bpm} BPM<input aria-label="메트로놈 속도" type="range" min="20" max="60" step="1" value={bpm} onChange={e=>{unlock();setBpm(Number(e.target.value))}} style={{width:'100%'}}/></label>{blocked&&enabled&&<button onClick={unlock}>눌러 소리 켜기</button>}</aside>,document.body);
}
export function useFinalCountdown({active,remaining,step,voice=true,enabled=true}){
 const spoken=useRef(new Set());const lastStep=useRef(step);
 useEffect(()=>{if(lastStep.current!==step||remaining>5){spoken.current.clear();lastStep.current=step;}if(!active||!voice||!enabled||remaining<1||remaining>5||spoken.current.has(remaining)||typeof speechSynthesis==='undefined')return;spoken.current.add(remaining);speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(['','일','이','삼','사','오'][remaining]);u.lang='ko-KR';u.rate=1.1;speechSynthesis.speak(u)},[active,remaining,step,voice,enabled]);
}
