import React,{useEffect,useRef,useState} from 'react';
import {TRACKS} from './NatureSound';
export default function SequenceNatureSound({running,finished}){
 const [track,setTrack]=useState(''),[volume,setVolume]=useState(.3),[error,setError]=useState('');
 const audio=useRef(null),shouldPlay=useRef(false);shouldPlay.current=running&&!finished;
 const play=()=>{if(audio.current?.src&&shouldPlay.current)audio.current.play()?.then(()=>setError('')).catch(()=>setError('자연음 재생 버튼을 눌러주세요.') )};
 useEffect(()=>{const element=new Audio();element.loop=true;element.preload='none';element.setAttribute('playsinline','');audio.current=element;return()=>{element.pause();element.removeAttribute('src');element.load();audio.current=null}},[]);
 useEffect(()=>{const element=audio.current;if(!element)return;element.pause();if(track){element.src=track;element.load();play()}else{element.removeAttribute('src');element.load()}},[track]);
 useEffect(()=>{if(!audio.current)return;audio.current.volume=volume},[volume]);
 useEffect(()=>{if(running&&!finished)play();else audio.current?.pause()},[running,finished]);
 return <section style={{border:'1px solid #e5d9ee',borderRadius:14,padding:12,margin:'14px 0'}}><label style={{display:'block'}}>자연의 소리<select aria-label="자연의 소리 선택" value={track} onChange={e=>setTrack(e.target.value)} style={{display:'block',width:'100%',padding:10,marginTop:6}}>{TRACKS.map(t=><option key={t.src} value={t.src}>{t.label}</option>)}</select></label><label style={{display:'flex',alignItems:'center',gap:8,marginTop:10}}>볼륨<input aria-label="자연음 볼륨" type="range" min="0" max="1" step="0.05" value={volume} onChange={e=>setVolume(Number(e.target.value))} style={{flex:1,minWidth:0}}/>{Math.round(volume*100)}%</label>{error&&track&&<button type="button" onClick={play}>자연음 재생</button>}</section>;
}
