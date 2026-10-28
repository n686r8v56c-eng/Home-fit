import React,{useEffect,useRef,useState} from 'react';

// 사용자 확인 사운드 이름 / 실제 음원 파일명
const TRACKS=[
  {src:'',label:'선택 안 함'},
  {src:'/audio/audio-15.mp3',label:'조용한 물'},
  {src:'/audio/audio-17.mp3',label:'큰 물소리'},
  {src:'/audio/audio-19.mp3',label:'커피숍 (노래)'},
  {src:'/audio/audio-21.mp3',label:'커피숍'},
  {src:'/audio/audio-23.mp3',label:'숲'},
  {src:'/audio/audio-25.mp3',label:'귀뚜라미'},
  {src:'/audio/audio-27.mp3',label:'모닥불'},
  {src:'/audio/audio-29.mp3',label:'드라이어'},
  {src:'/audio/audio-31.mp3',label:'지하철'},
  {src:'/audio/audio-33.mp3',label:'회사'},
  {src:'/audio/audio-35.mp3',label:'천둥'},
  {src:'/audio/audio-37.mp3',label:'기차'},
  {src:'/audio/audio-39.mp3',label:'폭포'},
  {src:'/audio/audio-41.mp3',label:'파도'},
  {src:'/audio/audio-43.mp3',label:'차 위의 비'},
  {src:'/audio/audio-45.mp3',label:'조용한 비'},
  {src:'/audio/audio-47.mp3',label:'새소리'},
];

export default function NatureSound(){
  const [track,setTrack]=useState('');
  const [volume,setVolume]=useState(30);
  const [playing,setPlaying]=useState(false);
  const [error,setError]=useState('');
  const audio=useRef(null);
  useEffect(()=>{
    const a=new Audio();a.loop=true;a.volume=.3;a.preload='none';
    const stopped=()=>setPlaying(false);
    a.addEventListener('ended',stopped);
    a.addEventListener('pause',stopped);
    audio.current=a;
    return()=>{a.pause();a.removeAttribute('src');a.load();a.removeEventListener('ended',stopped);a.removeEventListener('pause',stopped);audio.current=null};
  },[]);
  const play=async a=>{
    try{await a.play();setPlaying(true);setError('')}
    catch(err){setPlaying(false);setError(err?.name==='NotAllowedError'?'아이폰에서 재생 버튼을 한 번 더 눌러주세요.':'재생에 실패했어요. 선택한 음원 파일과 네트워크를 확인해 주세요.')}
  };
  const pick=async src=>{
    const a=audio.current;if(!a)return;
    a.pause();setPlaying(false);setError('');setTrack(src);
    a.src=src||'';
    if(src)await play(a);
  };
  const toggle=async()=>{
    const a=audio.current;if(!a||!track)return;
    if(!a.paused){a.pause();setPlaying(false)}else await play(a);
  };
  return <section style={{border:'1px solid #e8ddf0',background:'white',borderRadius:18,padding:15,margin:'15px 0',color:'#665270'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center',marginBottom:12}}><strong>🌿 자연의 소리</strong><span style={{color:'#9d8eaa',fontSize:12}}>{playing?'재생 중':'정지'}</span></div>
    <select aria-label="자연의 소리 선택" value={track} onChange={e=>pick(e.target.value)} style={{width:'100%',background:'#f7f1fb',border:'1px solid #e7dbee',borderRadius:12,padding:'12px',color:'#6f5684',font:'inherit'}}>{TRACKS.map(({src,label})=><option key={src} value={src}>{label}</option>)}</select>
    <label style={{display:'flex',alignItems:'center',gap:10,margin:'13px 0',fontSize:14}}>볼륨 <input aria-label="자연음 볼륨" style={{flex:1,minWidth:0}} type="range" min="0" max="100" step="1" value={volume} onChange={e=>{const v=Number(e.target.value);setVolume(v);if(audio.current)audio.current.volume=v/100}}/> {volume}%</label>
    <button disabled={!track} onClick={toggle} style={{border:0,borderRadius:12,padding:'11px 16px',background:'#eee5f5',color:'#75548d',fontWeight:700}}>{playing?'⏸ 자연음 정지':'▶ 자연음 재생'}</button>
    {error&&<p role="alert" style={{fontSize:12,color:'#b04b6a'}}>{error}</p>}
  </section>;
}
