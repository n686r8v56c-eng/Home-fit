import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
// Media-element playback also works with iOS media volume and silent-mode routing.
function beatWave(bpm){
 const rate=22050,count=Math.round(rate*60/bpm),buffer=new ArrayBuffer(44+count*2),view=new DataView(buffer);
 const text=(at,value)=>{for(let i=0;i<value.length;i++)view.setUint8(at+i,value.charCodeAt(i))};
 text(0,'RIFF');view.setUint32(4,36+count*2,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,count*2,true);
 for(let i=0;i<count;i++){const t=i/rate,envelope=t<.065?Math.sin(Math.PI*Math.min(1,t/.003)/2)*Math.exp(-t*65):0;view.setInt16(44+i*2,Math.round(26000*envelope*Math.sin(2*Math.PI*1100*t)),true)}
 return URL.createObjectURL(new Blob([buffer],{type:'audio/wav'}));
}
export default function SequenceMetronome({active}){
 const [bpm,setBpm]=useState(30),[enabled,setEnabled]=useState(true),[blocked,setBlocked]=useState(false),[volume,setVolume]=useState(.8);
 const media=useRef(null),wanted=useRef(false),level=useRef(volume);wanted.current=active&&enabled;level.current=volume;
 const start=()=>{if(!wanted.current||!media.current)return;try{if(navigator.audioSession)navigator.audioSession.type='playback';media.current.volume=level.current;media.current.muted=false;const result=media.current.play();result?.then(()=>setBlocked(false)).catch(()=>setBlocked(true))}catch{setBlocked(true)}};
 useEffect(()=>{const el=new Audio();el.loop=true;el.preload='auto';el.setAttribute('playsinline','');media.current=el;
 const unlock=()=>start();document.addEventListener('pointerdown',unlock,true);document.addEventListener('touchend',unlock,true);
 return()=>{wanted.current=false;document.removeEventListener('pointerdown',unlock,true);document.removeEventListener('touchend',unlock,true);el.pause();el.removeAttribute('src');el.load();media.current=null};},[]);
 useEffect(()=>{const el=media.current;if(!el)return;el.pause();const url=beatWave(bpm);el.src=url;el.load();if(active&&enabled)start();return()=>{el.pause();URL.revokeObjectURL(url)}},[bpm,active,enabled]);
 useEffect(()=>{if(media.current)media.current.volume=volume},[volume]);
 if(!active||typeof document==='undefined')return null;
 return createPortal(<aside aria-label="메트로놈" onClick={e=>e.stopPropagation()} style={{position:'fixed',top:'max(8px,env(safe-area-inset-top))',left:'50%',transform:'translateX(-50%)',zIndex:20000,background:'#fff',border:'1px solid #decdea',borderRadius:14,padding:'8px 12px',boxShadow:'0 3px 15px #0002',width:'min(300px,85vw)',color:'#654e78',fontSize:13}}><label><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> 메트로놈 · {bpm} BPM<input aria-label="메트로놈 속도" type="range" min="20" max="60" step="1" value={bpm} onChange={e=>setBpm(Number(e.target.value))} style={{width:'100%'}}/></label><div style={{display:'flex',alignItems:'center',gap:7}}><button type="button" onClick={start}>소리 확인</button><label style={{display:'flex',alignItems:'center',gap:5,flex:1}}>볼륨<input aria-label="메트로놈 볼륨" type="range" min="0" max="1" step="0.05" value={volume} onChange={e=>setVolume(Number(e.target.value))} style={{width:'100%',minWidth:0}}/></label></div>{blocked&&enabled&&<small>소리 확인 버튼을 눌러주세요.</small>}</aside>,document.body);
}
export function useFinalCountdown({active,remaining,step,voice=true,enabled=true}){
 const spoken=useRef(new Set());const lastStep=useRef(step);
 useEffect(()=>{if(lastStep.current!==step||remaining>5){spoken.current.clear();lastStep.current=step;}if(!active||!voice||!enabled||remaining<1||remaining>5||spoken.current.has(remaining)||typeof speechSynthesis==='undefined')return;spoken.current.add(remaining);speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(['','일','이','삼','사','오'][remaining]);u.lang='ko-KR';u.rate=1.1;speechSynthesis.speak(u)},[active,remaining,step,voice,enabled]);
}
