import {speakVoice,stopVoice} from './sequenceSpeech.mjs';
import {getVoiceVolume} from './SequenceMetronome';
import SequenceMetronome from './SequenceMetronome';
import {Folder} from 'lucide-react';
import {ScheduleButton,useExercise} from './ExerciseContext';
import React, { useEffect, useRef, useState } from 'react';
import {loadStudio,saveStudio,uploadStudioPhoto} from './equipmentCloud';
import NatureSound from './NatureSound';

/* Supabase-backed Mind Flow STUDIO.
   For the existing nature-sound mixer, pass NatureSounds as a prop:
   <BodyweightStudio NatureSounds={YourExistingNatureSoundComponent} />
*/
const STRUCTURE = {
  '미분류':['미분류'],
  '엉덩이':['대둔근','중둔근'],
  '허벅지':['내전근','대퇴사두근','햄스트링'],
  '종아리':['비복근','가자미근','전경골근'],
  '등':['광배근','승모근','능형근','척추기립근','대원근'],
  '견갑골':['전거근','하부승모근','안정화·가동성'],
  '복부':['복직근','복횡근','복사근'],
  '가슴':['대흉근'],
  '어깨':['전면삼각근','측면삼각근','후면삼각근'],
  '팔':['이두근','삼두근'],
};
const getInitial = () => ({});
const uid = () => (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`);
const clamp = n => Math.max(1, Math.min(3600, Number(n) || 60));
const secs = n => `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;
const btn = {border:'1px solid #e0d1ed',background:'#f3ebf8',color:'#735989',borderRadius:12,padding:'10px 13px',fontSize:14,cursor:'pointer'};
const field = {border:'1px solid #decdea',borderRadius:12,padding:'12px',width:'100%',boxSizing:'border-box',fontSize:15,color:'#53415e',background:'#fff'};
const card = {background:'#fff',border:'1px solid #e1d4ec',borderRadius:20,padding:15};

export default function EquipmentStudio({ activity, NatureSounds = null }) {
  const [data,setData] = useState(getInitial);
  const [cloudReady,setCloudReady]=useState(false);
  const [cloudError,setCloudError]=useState('');
  const saveQueue=useRef(Promise.resolve());
  const dirtyRef=useRef(false);
  const mountedRef=useRef(true);
  useEffect(()=>{
    let alive=true;
    mountedRef.current=true;
    const onPhotos=urls=>{
      if(!alive)return;
      const addPhoto=x=>x.imagePath && urls[x.imagePath]
        ? {...x,image:urls[x.imagePath]} : x;
      // Image URL hydration is presentation-only, not a new database write.
      setData(prev=>({...prev,
        exercises:(prev.exercises||[]).map(addPhoto),
        saved:(prev.saved||[]).map(seq=>({...seq,items:(seq.items||[]).map(addPhoto)}))
      }));
    };
    loadStudio(activity,onPhotos)
      .then(record=>{if(alive){setData(record);setCloudError('');setCloudReady(true)}})
      .catch(e=>{if(alive)setCloudError('Supabase 불러오기 실패: '+e.message)});
    return()=>{alive=false;mountedRef.current=false};
  },[]);
  const exercises = data.exercises || [];
  const saved = data.saved || [];
  const folders = data.folders || {};
  const favorites = data.favorites || {}; // Legacy: retained for compatibility, no longer shown
  const videoBookmarks = data.videoBookmarks || [];
  const [tab,setTab] = useState('sequence');
  const [major,setMajor] = useState('엉덩이');
  const [minor,setMinor] = useState('대둔근');
  const [search,setSearch] = useState('');
  const [activeTag,setActiveTag] = useState('전체');
  const [editing,setEditing] = useState(null);
  const [form,setForm] = useState({name:'',description:'',weight:0,reps:10,tags:'',image:''});
  const [draft,setDraft] = useState([]);
  const [sequenceName,setSequenceName] = useState('');
  const [loadedId,setLoadedId] = useState(null);
  const [folderPath,setFolderPath] = useState(null);
  const [videoDraft,setVideoDraft] = useState({url:'',title:'',folder:''});
  const [videoEditing,setVideoEditing] = useState(null);
  const [bookmarkOpen,setBookmarkOpen]=useState(false);
  const [videoSearch,setVideoSearch] = useState('');
  const [videoTitleStatus,setVideoTitleStatus]=useState('');
  const [playIndex,setPlayIndex] = useState(-1);
  const [remain,setRemain] = useState(0);
  const [paused,setPaused] = useState(false);
  const [voice,setVoice] = useState(true);
  const spoken = useRef(new Set());
  const remainingRef = useRef(0);
  const indexRef = useRef(-1);
  const draftRef = useRef([]);
  const pausedRef = useRef(false);
  const playRef = useRef(false);
  useEffect(()=>{if(!cloudReady||!dirtyRef.current)return;dirtyRef.current=false;saveQueue.current=saveQueue.current.catch(()=>{}).then(()=>saveStudio(activity,data)).catch(e=>{if(mountedRef.current)setCloudError('Supabase 저장 실패: '+e.message)});},[data,cloudReady]);
  useEffect(()=>{draftRef.current=draft;},[draft]);
  useEffect(()=>{indexRef.current=playIndex;playRef.current=playIndex>=0;},[playIndex]);
  useEffect(()=>{pausedRef.current=paused;},[paused]);
  const update = patch => {if(!cloudReady)return;dirtyRef.current=true;setData(d=>({...d,...(typeof patch==='function'?patch(d):patch)}));};
  const voiceSay = (sentence) => {
    if(!voice || typeof speechSynthesis==='undefined') return;
    stopVoice();
    const s=new SpeechSynthesisUtterance(sentence);s.lang='ko-KR';s.rate=1.05;s.volume=1;
    const voices=speechSynthesis.getVoices();s.voice=voices.find(v=>v.lang?.toLowerCase().startsWith('ko'))||null;
    (s.volume=getVoiceVolume(),speakVoice(s));
  };
  const stop=()=>{setPlayIndex(-1);indexRef.current=-1;playRef.current=false;setRemain(0);if(typeof speechSynthesis!=='undefined')stopVoice();spoken.current.clear();};
  const go=(i,items=draftRef.current)=>{
    if(i<0 || i>=items.length){stop();return;}
    const x=items[i];const n=0;
    setPlayIndex(i);indexRef.current=i;setRemain(n);remainingRef.current=n;setPaused(false);pausedRef.current=false;
    spoken.current.clear();voiceSay(`${x.name}${x.side && x.side!=='기본' ? ', '+x.side : ''}, 시작합니다.`);
  };
  const start=()=>{if(!draft.length)return;go(0,draft);};
  const addToSequence=x=>{
    setDraft(d=>[...d,{id:uid(),exerciseId:x.id,name:x.name,image:x.image||'',imagePath:x.imagePath||'',bucket:x.bucket||'mindflow-studio-photos',weight:Number(x.weight)||0,reps:Number(x.reps)||10,side:x.side||'기본'}]);
    setTab('sequence');
  };
  const clearEdit=()=>{setEditing(null);setForm({name:'',description:'',weight:0,reps:10,tags:'',image:''});};
  const saveExercise=()=>{
    if(!form.name.trim())return alert('운동명을 입력해줘.');
    const exercise={...form,id:editing&&editing!=='new'?editing:uid(),name:form.name.trim(),weight:Math.max(0,Number(form.weight)||0),reps:Math.max(1,Math.round(Number(form.reps)||10)),major:editing&&editing!=='new'?(exercises.find(x=>x.id===editing)?.major||major):major,minor:editing&&editing!=='new'?(exercises.find(x=>x.id===editing)?.minor||minor):minor,tags:String(form.tags).split(',').map(x=>x.trim().replace(/^#/, '')).filter(Boolean)};
    update({exercises:editing&&editing!=='new'?exercises.map(x=>x.id===editing?exercise:x):[...exercises,exercise]});clearEdit();
  };
  const editExercise=x=>{setEditing(x.id);setForm({...x,tags:x.tags.join(', ')});};
  const changePhoto=async(e)=>{
    const file=e.target.files?.[0];if(!file)return;
    try {const photo=await uploadStudioPhoto(activity,file);setForm(f=>({...f,...photo}));}
    catch(err){alert('사진 등록 실패: '+err.message)}
    finally{e.target.value=''}
  };
  const changeCardPhoto=async(e,exercise)=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      const photo=await uploadStudioPhoto(activity,file);
      update(prev=>({exercises:(prev.exercises||[]).map(item=>item.id===exercise.id?{...item,...photo}:item)}));
      setDraft(prev=>prev.map(item=>item.exerciseId===exercise.id?{...item,...photo}:item));
    }catch(err){alert('사진 등록 실패: '+err.message)}
    finally{e.target.value=''}
  };

  const bookmark=x=>{
    const path=`${x.major}/${x.minor}`;
    update({favorites:{...favorites,[x.id]:favorites[x.id]?undefined:path}});
  };
  const getVideoId = raw => {
    try {
      const u=new URL(raw.trim());const host=u.hostname.replace(/^www\./,'').replace(/^m\./,'');
      if(host==='youtu.be')return u.pathname.split('/')[1]||'';
      if(['youtube.com','youtube-nocookie.com','music.youtube.com'].includes(host))return u.searchParams.get('v')||u.pathname.match(/^\/(shorts|live|embed)\/([^/]+)/)?.[2]||'';
    }catch{} return '';
  };

  useEffect(()=>{
    const id=getVideoId(videoDraft.url);
    if(!/^[\w-]{11}$/.test(id)){setVideoTitleStatus('');return;}
    const controller=new AbortController();
    setVideoTitleStatus('영상 제목 확인 중…');
    const timer=setTimeout(async()=>{
      try{
        const canonical=`https://www.youtube.com/watch?v=${id}`;
        const response=await fetch(`https://noembed.com/embed?url=${encodeURIComponent(canonical)}`,{signal:controller.signal});
        if(!response.ok)throw new Error('영상 정보를 읽을 수 없어요.');
        const meta=await response.json();
        if(!meta?.title)throw new Error('영상 제목이 제공되지 않았어요.');
        setVideoDraft(d=>getVideoId(d.url)===id&&!d.title.trim()?{...d,title:meta.title}:d);
        setVideoTitleStatus('제목 자동 입력 완료 · 직접 수정 가능');
      }catch(err){if(err.name!=='AbortError')setVideoTitleStatus('제목을 가져오지 못했어요. 직접 입력할 수 있어요.');}
    },300);
    return()=>{clearTimeout(timer);controller.abort();};
  },[videoDraft.url,videoEditing]);
  const saveVideo=()=>{
    const id=getVideoId(videoDraft.url);
    if(!/^[\w-]{11}$/.test(id))return alert('올바른 YouTube 링크를 입력해줘.');
    const folder=videoEditing?videoDraft.folder:(folderPath||'');
    const video={id:videoEditing||uid(),videoId:id,url:`https://www.youtube.com/watch?v=${id}`,title:videoDraft.title.trim()||'제목 미입력 영상',folder};
    update({videoBookmarks:videoEditing?videoBookmarks.map(x=>x.id===videoEditing?video:x):[...videoBookmarks,video]});
    setBookmarkOpen(false);setVideoEditing(null);setVideoDraft({url:'',title:'',folder:folderPath||''});
  };
  const editVideo=v=>{setBookmarkOpen(true);setVideoEditing(v.id);setVideoDraft({url:v.url,title:v.title,folder:v.folder});};
  const addFolder=path=>{
    const name=prompt('새 서브폴더 이름'); if(!name?.trim())return;
    const key=path?`${path}/${name.trim()}`:name.trim();
    if(folders[key]!==undefined)return alert('이미 있는 폴더야.');
    update({folders:{...folders,[key]:true}});
  };
  const allPaths=Object.keys(STRUCTURE).flatMap(a=>[a,...STRUCTURE[a].map(b=>`${a}/${b}`)]).concat(Object.keys(folders));
  const moveSequence=(i,by)=>setDraft(d=>{const a=[...d];if(i+by<0||i+by>=a.length)return a;[a[i],a[i+by]]=[a[i+by],a[i]];return a;});
  const saveSequence=()=>{
    if(!draft.length)return alert('먼저 운동을 추가해줘.');
    if(!sequenceName.trim())return alert('시퀀스 이름을 입력해줘.');
    const obj={id:loadedId||uid(),name:sequenceName.trim(),items:draft.map(x=>({...x}))};
    update({saved:loadedId?saved.map(x=>x.id===loadedId?obj:x):[...saved,obj]});setLoadedId(obj.id);
  };
  const tagged=exercises.filter(x=>x.major===major&&x.minor===minor);
  const tags=[...new Set(tagged.flatMap(x=>x.tags||[]))];
  const filtered=tagged.filter(x=>(activeTag==='전체'||x.tags?.includes(activeTag))&&`${x.name} ${x.description} ${(x.tags||[]).join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const current=playIndex>=0?draft[playIndex]:null;

  return <div style={{fontFamily:'-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif',color:'#52405f',background:'#fbf8fd',padding:'16px 12px 90px',maxWidth:740,margin:'auto',minHeight:480}}>
    <SequenceMetronome active={playIndex>=0&&!paused}/>
    <style>{`@keyframes bwFade {from{opacity:0}to{opacity:1}} .bw-card button:active{transform:scale(.96)} .bw-input:focus{outline:2px solid #c3a4df}`}</style>
    {!cloudReady&&!cloudError&&<p aria-live="polite" style={{fontSize:12,color:'#9687a0',margin:'3px 0 9px'}}>데이터 연결 중 · 화면은 먼저 표시했어요</p>}
    {cloudError&&<div role="alert" style={{padding:12,color:'#ad3865'}}>{cloudError}</div>}
    <h2 style={{margin:'4px 0 17px',fontSize:23}}>{activity}</h2>
    <div style={{pointerEvents:cloudReady?'auto':'none',opacity:cloudReady?1:0.65}} aria-busy={!cloudReady}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:18}}>{[['sequence','시퀀스'],['library',<>운동<br/>라이브러리</>],['bookmarks','북마크']].map(([key,name])=><button key={key} onClick={()=>setTab(key)} style={{...btn,background:tab===key?'#e7dcf1':'#fff',minHeight:62,fontWeight:600}}>{name}</button>)}</div>
    {tab==='library' && <>
      <div style={{display:'flex',gap:8,marginBottom:10}}><select style={field} value={major} onChange={e=>{setMajor(e.target.value);setMinor(STRUCTURE[e.target.value][0]);setActiveTag('전체');}}>{Object.keys(STRUCTURE).map(x=><option key={x}>{x}</option>)}</select><select style={field} value={minor} onChange={e=>{setMinor(e.target.value);setActiveTag('전체');}}>{STRUCTURE[major].map(x=><option key={x}>{x}</option>)}</select></div>
      <input className="bw-input" value={search} onChange={e=>setSearch(e.target.value)} style={{...field,marginBottom:10}} placeholder="운동명 · 설명 · 태그 검색"/>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>{['전체',...tags].map(t=><button key={t} style={{...btn,padding:'5px 9px',borderRadius:40,background:activeTag===t?'#e4d3f1':'#fff'}} onClick={()=>setActiveTag(t)}>{t==='전체'?t:`#${t}`}</button>)}</div>
      <button style={{...btn,marginBottom:12}} onClick={()=>editing?clearEdit():setEditing('new')}>＋ 새 동작 등록</button>
      {editing && <div style={{...card,marginBottom:14,display:'grid',gap:10}}><strong>{editing==='new'?`${major} · ${minor} 운동 등록`:'운동 수정'}</strong><input className="bw-input" style={field} placeholder="동작명" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><textarea className="bw-input" style={{...field,minHeight:76}} placeholder="설명 / 주의사항 (선택)" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/><label>무게 (kg)<input style={field} type="number" min="0" step="0.5" value={form.weight??0} onChange={e=>setForm({...form,weight:e.target.value})}/></label><label>횟수<input style={field} type="number" min="1" step="1" value={form.reps??10} onChange={e=>setForm({...form,reps:e.target.value})}/></label><input className="bw-input" style={field} placeholder="태그: 초급, 힙업, 누워서" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/><div><button style={btn} onClick={saveExercise}>저장</button> <button style={btn} onClick={clearEdit}>취소</button></div></div>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>{filtered.map(x=><div key={x.id} style={card} className="bw-card"><label title={`${x.name} 사진 추가 또는 변경`} style={{aspectRatio:'4/3',background:'#f8f3fb',borderRadius:14,overflow:'hidden',display:'grid',placeItems:'center',cursor:'pointer',position:'relative'}}>
        {x.image?<img src={x.image} alt={x.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{color:'#b5a3c2'}}>＋ 사진</span>}
        <input type="file" accept="image/*" style={{position:'absolute',width:1,height:1,opacity:0}} onChange={e=>changeCardPhoto(e,x)}/>
      </label><strong style={{display:'block',margin:'10px 0 4px'}}>{x.name}</strong><small>{x.weight??0}kg · {x.reps??10}회 · {(x.tags||[]).map(t=>`#${t}`).join(' ')}</small><div style={{display:'flex',gap:4,marginTop:10,flexWrap:'wrap'}}><button title="시퀀스에 추가" style={btn} onClick={()=>addToSequence(x)}>＋</button><button title="수정" style={btn} onClick={()=>editExercise(x)}>✎</button><button title="삭제" style={btn} onClick={()=>{if(confirm('운동을 삭제할까?'))update({exercises:exercises.filter(y=>y.id!==x.id)})}}>×</button></div></div>)}</div>
      {!filtered.length&&<p style={{color:'#9987a5',textAlign:'center',padding:25}}>등록된 운동이 없어. + 새 동작 등록을 눌러줘.</p>}
    </>}
    {tab==='sequence'&&<div style={card}><h3>나의 {activity} 시퀀스</h3><input className="bw-input" style={field} value={sequenceName} onChange={e=>setSequenceName(e.target.value)} placeholder="시퀀스 이름 직접 입력"/><p style={{fontSize:12,color:'#927ca0'}}>운동 라이브러리에서 ＋ 버튼을 누르면 자동으로 추가돼.</p>{draft.map((x,i)=><div key={x.id} style={{display:'flex',alignItems:'center',gap:7,borderBottom:'1px solid #e8ddf1',padding:'12px 0'}}><small>{i+1}</small><div style={{height:50,width:50,borderRadius:9,background:'#f6f1fa',flexShrink:0,overflow:'hidden'}}>{x.image&&<img alt="" src={x.image} style={{width:'100%',height:'100%',objectFit:'cover'}}/>}</div><div style={{flex:1,minWidth:0}}><strong style={{fontSize:13,display:'block'}}>{x.name}</strong><select aria-label="좌우 설정" value={x.side||'기본'} onChange={e=>setDraft(d=>d.map(y=>y.id===x.id?{...y,side:e.target.value}:y))} style={{...field,width:83,padding:6,marginTop:3,marginRight:5}}>{['기본','왼쪽','오른쪽'].map(side=><option key={side} value={side}>{side}</option>)}</select><input aria-label="무게 (kg)" type="number" min="0" step="0.5" value={x.weight??0} onChange={e=>setDraft(d=>d.map(y=>y.id===x.id?{...y,weight:Math.max(0,Number(e.target.value)||0)}:y))} style={{...field,width:70,padding:6}}/> kg <input aria-label="횟수" type="number" min="1" step="1" value={x.reps??10} onChange={e=>setDraft(d=>d.map(y=>y.id===x.id?{...y,reps:Math.max(1,Math.round(Number(e.target.value)||1))}:y))} style={{...field,width:65,padding:6}}/> 회</div><button style={btn} onClick={()=>moveSequence(i,-1)}>↑</button><button style={btn} onClick={()=>moveSequence(i,1)}>↓</button><button style={btn} onClick={()=>setDraft(d=>d.filter(y=>y.id!==x.id))}>×</button></div>)}<div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:15}}><button style={btn} onClick={start}>▶ 시작</button><button style={btn} onClick={stop}>Ⅱ 정지</button><button style={btn} onClick={saveSequence}>▣ 시퀀스 저장</button><button style={btn} onClick={()=>{stop();setDraft([]);setLoadedId(null);setSequenceName('');}}>＋ 새 시퀀스</button></div><h3 style={{marginTop:25}}>저장된 시퀀스</h3>{saved.map(s=><div key={s.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderTop:'1px solid #e9dcf0'}}><div style={{flex:1}}><strong>{s.name}</strong><small style={{display:'block'}}>{s.items.length}개 동작</small></div><button style={btn} onClick={()=>{stop();setLoadedId(s.id);setSequenceName(s.name);setDraft(s.items.map(x=>({...x})));}}>불러오기</button><ScheduleButton sequence={{...s,activity,items:s.items.map(x=>({...x,bucket:x.bucket||'mindflow-studio-photos'}))}}/><button style={btn} onClick={()=>{if(confirm('저장된 시퀀스를 삭제할까?'))update({saved:saved.filter(x=>x.id!==s.id)})}}>삭제</button></div>)}</div>}
    {tab==='sequence'&&<div style={{marginTop:16}}><NatureSound /></div>}
    {tab==='bookmarks'&&<div style={card}>
      <h3>영상 북마크</h3>
      <p style={{fontSize:12,color:'#927ca0'}}>유튜브 링크 저장 · 기본 분류 · 사용자 서브폴더</p>
      {folderPath!==null&&<button style={btn} onClick={()=>{setFolderPath(folderPath.includes('/')?folderPath.slice(0,folderPath.lastIndexOf('/')):null);setVideoEditing(null);}}>← 상위 폴더</button>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12,margin:'14px 0'}}>
        {allPaths.filter(p=>folderPath===null?!p.includes('/'):p.startsWith(folderPath+'/')&&p.slice(folderPath.length+1).indexOf('/')===-1).map(p=><button key={p} style={{border:0,background:'transparent',color:'#755b8c',font:'inherit',padding:0,minWidth:0,cursor:'pointer'}} onClick={()=>{setFolderPath(p);setVideoDraft(d=>({...d,folder:p}));}}>
          <span style={{display:'grid',placeItems:'center',height:90,background:'#eee6f5',borderRadius:20,marginBottom:8}}><Folder size={36} strokeWidth={1.7}/></span><b style={{display:'block',overflowWrap:'anywhere'}}>{p.split('/').at(-1)}</b>
          <small>{videoBookmarks.filter(v=>v.folder===p||v.folder.startsWith(p+'/')).length}개 영상</small>
        </button>)}
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}><button style={btn} onClick={()=>addFolder(folderPath||'')}>＋ 폴더 추가</button><button style={{...btn,background:'#c98dad',color:'white'}} onClick={()=>{setVideoEditing(null);setVideoDraft({url:'',title:'',folder:folderPath||''});setVideoTitleStatus('');setBookmarkOpen(true);}}>＋ 북마크 추가</button></div>
      {bookmarkOpen&&<div role="dialog" aria-modal="true" aria-label="북마크 저장" style={{position:'fixed',inset:0,zIndex:10000,background:'#0006',display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={()=>setBookmarkOpen(false)}>      <div style={{...card,background:'white',width:'100%',maxWidth:500,maxHeight:'85dvh',overflowY:'auto',boxSizing:'border-box'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h3>{videoEditing?'북마크 수정':'북마크 저장'}</h3><button style={btn} aria-label="닫기" onClick={()=>setBookmarkOpen(false)}>✕</button></div>
        <label style={{display:'block',marginBottom:9}}>유튜브 링크
          <input style={field} type="url" placeholder="https://youtu.be/..." value={videoDraft.url} onChange={e=>setVideoDraft(d=>({...d,url:e.target.value,title:getVideoId(d.url)===getVideoId(e.target.value)?d.title:''}))}/>
        </label>
        <label style={{display:'block',marginBottom:9}}>영상 제목
          <input style={field} placeholder="링크 입력 시 자동으로 제목을 가져와요" value={videoDraft.title} onChange={e=>setVideoDraft(d=>({...d,title:e.target.value}))}/>
        </label>
        {videoTitleStatus&&<small style={{display:'block',color:'#927ca0',margin:'-4px 0 9px'}}>{videoTitleStatus}</small>}
        <div style={{display:'flex',gap:8}}><button style={btn} onClick={saveVideo}>저장</button><button style={btn} onClick={()=>{setBookmarkOpen(false);setVideoEditing(null);setVideoDraft({url:'',title:'',folder:folderPath||''});}}>취소</button></div>
        <p style={{fontSize:12,color:'#927ca0'}}>썸네일과 제목을 YouTube 링크에서 가져와요. 제목 조회가 불가능하면 직접 입력할 수 있어요.</p>
      </div>
</div>}
      <input style={{...field,marginBottom:12}} placeholder="영상 제목 검색" value={videoSearch} onChange={e=>setVideoSearch(e.target.value)}/>
      <h3>{folderPath?`${folderPath.split('/').at(-1)} 영상`:'전체 영상'}</h3>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>
        {videoBookmarks.filter(v=>(!folderPath||v.folder===folderPath||v.folder.startsWith(folderPath+'/'))&&v.title.toLowerCase().includes(videoSearch.toLowerCase())).map(v=><div key={v.id} style={{...card,padding:8,minWidth:0,position:'relative'}}>
          <a href={v.url} target="_blank" rel="noopener noreferrer" aria-label={`${v.title} YouTube에서 보기`} style={{display:'block',color:'inherit',textDecoration:'none'}}><img src={`https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`} alt="" loading="lazy" style={{display:'block',width:'100%',aspectRatio:'16/9',objectFit:'cover',borderRadius:10}}/><b title={v.title} style={{display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',fontSize:13,lineHeight:1.5,overflowWrap:'anywhere',margin:'7px 0',minHeight:'3em'}}>{v.title}</b></a>
          <button type="button" aria-label={`${v.title} 북마크 삭제`} style={{position:'absolute',right:5,top:5,width:32,height:32,border:0,borderRadius:'50%',background:'#fffffff0',color:'#755b8c',fontSize:23,lineHeight:1,cursor:'pointer',display:'grid',placeItems:'center'}} onClick={()=>{if(confirm('이 북마크를 삭제할까?'))update({videoBookmarks:videoBookmarks.filter(x=>x.id!==v.id)});}}>×</button>
        </div>)}
      </div>
    </div>}
    {current&&<div role="dialog" aria-modal="true" aria-label={`${activity} 시퀀스 재생`} style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(38,28,49,.65)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,animation:'bwFade .2s'}}><div style={{...card,maxWidth:450,width:'100%',maxHeight:'95vh',overflowY:'auto',padding:20,borderRadius:25}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:15}}><b>{activity} 시퀀스 재생 · {playIndex+1}/{draft.length}</b><button onClick={stop} style={{...btn,background:'white'}}>✕</button></div><div style={{height:240,background:'#f8f4fb',borderRadius:15,overflow:'hidden',display:'grid',placeItems:'center'}}>{current.image?<img src={current.image} alt={current.name} style={{width:'100%',height:'100%',objectFit:'contain'}}/>:<span>등록한 운동 사진이 여기에 표시돼</span>}</div><h2 style={{textAlign:'center',margin:'16px 0 8px'}}>{current.side&&current.side!=='기본'?current.side+' ':''}{current.name}</h2><div style={{fontSize:36,fontWeight:700,textAlign:'center',fontVariantNumeric:'tabular-nums'}}>{current.weight??0}kg · {current.reps??10}회</div><p style={{textAlign:'center',color:'#9687a0',fontSize:13}}>목표 무게 · 횟수 · 완료 후 다음을 눌러주세요</p><label style={{display:'flex',gap:6,justifyContent:'center',fontSize:13,marginBottom:12}}><input type="checkbox" checked={voice} onChange={e=>setVoice(e.target.checked)}/> 한국어 음성 안내</label><div style={{display:'flex',justifyContent:'center',gap:6,flexWrap:'wrap'}}><button style={btn} disabled={playIndex===0} onClick={()=>go(playIndex-1)}>◀ 이전</button><button style={btn} onClick={()=>{setPaused(v=>!v);if(typeof speechSynthesis!=='undefined')stopVoice();}}>{paused?'▶ 재개':'Ⅱ 일시정지'}</button><button style={btn} onClick={()=>go(playIndex+1)}>다음 ▶</button><button style={btn} onClick={stop}>종료</button></div></div></div>}
    </div>
  </div>;
}
