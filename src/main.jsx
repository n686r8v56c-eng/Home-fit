import React, {useEffect,useMemo,useState,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {Home,CalendarDays,Grid2X2,Plus,FolderPlus,Search,ChevronLeft,ChevronRight,Check,Trash2,Pencil,ExternalLink,X,Play,Clock,RotateCcw,NotebookPen,Menu,ChevronDown,ChevronUp} from 'lucide-react';
import './style.css';
import {createClient} from '@supabase/supabase-js';
const SUPA_URL=import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY=import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase=SUPA_URL&&SUPA_KEY?createClient(SUPA_URL,SUPA_KEY):null;

const KEY='home-fit-v1';
const INITIAL_FOLDERS=['유산소','요가','필라테스','전신','팔·어깨','등·가슴','복부·코어','하체·힙','스트레칭','기타'];
const localDay=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const parseDay=s=>new Date(s+'T12:00:00');
const monthLabel=date=>`${date.getFullYear()}년 ${date.getMonth()+1}월`;
const videoIdFromUrl=value=>{try {const u=new URL(value);const host=u.hostname.replace(/^www\./,'');if(host==='youtu.be')return u.pathname.split('/')[1]?.slice(0,11)||'';if(['youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com'].includes(host)){let id=u.searchParams.get('v');if(!id){const p=u.pathname.split('/').filter(Boolean);if(['shorts','embed','live'].includes(p[0])) id=p[1];}return /^[\w-]{11}$/.test(id||'')?id:'';}}catch{}return ''};
const TYPES=[{id:'workout',label:'운동 일정'},{id:'stretch',label:'스트레칭 일정'},{id:'skin',label:'피부관리 일정'}];
const inferType=v=>v.kind||((v.folders||[]).some(f=>/피부|스킨|마사지|페이스/.test(f))?'skin':(v.folders||[]).some(f=>/스트레칭|요가|릴랙스/.test(f))?'stretch':'workout');
const defaultData={folders:INITIAL_FOLDERS,videos:[],plans:[],completions:[],notes:[]};
const folderTitle=path=>path.split('/').pop();
const folderParent=path=>path.includes('/')?path.slice(0,path.lastIndexOf('/')):null;
const isWithin=(path,parent)=>path===parent||path.startsWith(parent+'/');
function load(){try{const obj=JSON.parse(localStorage.getItem(KEY));return {...defaultData,...obj}}catch{return defaultData}}
function App({initialData,onDataChange,onLogout}){
 const [data,setData]=useState(initialData),[tab,setTab]=useState('home'),[selected,setSelected]=useState(localDay()),[month,setMonth]=useState(new Date()),[folder,setFolder]=useState(null),[search,setSearch]=useState(''),[modal,setModal]=useState(null),[edit,setEdit]=useState(null),[pickType,setPickType]=useState('workout'),[toast,setToast]=useState(''),[playingVideo,setPlayingVideo]=useState(null),[noteText,setNoteText]=useState(''),[noteVideo,setNoteVideo]=useState(null),[expandedNotes,setExpandedNotes]=useState({}),[scheduleVideo,setScheduleVideo]=useState(null),[scheduleDate,setScheduleDate]=useState(localDay()),[scheduleKind,setScheduleKind]=useState('workout');
 useEffect(()=>{onDataChange(data)},[data,onDataChange]);
 const notes=Array.isArray(data.notes)?data.notes:[];
 const addNote=(text,videoId=null)=>{if(!text.trim())return;update(s=>({...s,notes:[...(s.notes||[]),{id:crypto.randomUUID(),text:text.trim(),videoId,createdAt:new Date().toISOString()}]}));setNoteText('');setNoteVideo(null);message('메모가 저장됐어요')};
 const deleteNote=id=>{if(!window.confirm('이 메모를 삭제할까요?'))return;update(s=>({...s,notes:(s.notes||[]).filter(n=>n.id!==id)}))};
 const noteList=(items)=>items.map(n=>{const v=n.videoId&&getVideo(n.videoId);return <article className="memo-card memo-list-card" key={n.id}>{v&&<button type="button" className="memo-list-thumb" onClick={()=>setPlayingVideo(v)} aria-label="영상 열기"><img src={`https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`} alt=""/></button>}<div className="memo-list-detail">{v&&<button className="memo-video-title" onClick={()=>setPlayingVideo(v)}>{v.title}</button>}<div className="memo-meta">{new Date(n.createdAt).toLocaleString('ko-KR')}</div><p className={'memo-content '+(!expandedNotes[n.id]?'memo-clamped':'')}>{n.text}</p><div className="memo-controls"><button onClick={()=>setExpandedNotes(s=>({...s,[n.id]:!s[n.id]}))}>{expandedNotes[n.id]?'메모 접기':'메모 펼치기'} {expandedNotes[n.id]?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</button><button aria-label="메모 삭제" onClick={()=>deleteNote(n.id)}><Trash2 size={15}/></button></div>{v&&<button className="memo-original" onClick={()=>setPlayingVideo(v)}>원본 보기</button>}</div></article>});
 const longPressTimer=useRef(null),longPressTriggered=useRef(false);
 const clearLongPress=()=>{if(longPressTimer.current!==null){clearTimeout(longPressTimer.current);longPressTimer.current=null}};
 const showFolderActions=path=>{clearLongPress();longPressTriggered.current=true;setEdit(path);setModal('folderActions')};
 const folderPointerDown=(event,path)=>{if(event.pointerType==='touch'||event.pointerType==='pen'){clearLongPress();longPressTriggered.current=false;longPressTimer.current=setTimeout(()=>showFolderActions(path),550)}};
 const removeFolder=path=>{if(!window.confirm('이 폴더와 하위 폴더를 삭제할까요? 영상과 운동 기록은 남습니다.'))return;update(s=>({...s,folders:s.folders.filter(f=>!isWithin(f,path)),videos:s.videos.map(v=>({...v,folders:v.folders.filter(f=>!isWithin(f,path))}))}));if(folder&&isWithin(folder,path))setFolder(folderParent(path));setModal(null);message('폴더가 삭제됐어요')};
 const update=fn=>setData(s=>fn(s));
 const message=t=>{setToast(t);setTimeout(()=>setToast(''),2600)};
 const getVideo=id=>data.videos.find(v=>v.id===id);
 const today=localDay();
 const withPlanKind=p=>{const v=getVideo(p.videoId);return v?{...v,scheduleKind:p.kind||inferType(v)}:null};
 const withDoneKind=c=>{const v=getVideo(c.videoId);if(!v)return null;const plan=data.plans.find(p=>p.date===c.date&&p.videoId===c.videoId);return {...v,scheduleKind:plan?.kind||inferType(v)};};
 const plans=data.plans.filter(p=>p.date===selected).map(withPlanKind).filter(Boolean);
 const completed=data.completions.filter(c=>c.date===selected).map(withDoneKind).filter(Boolean);
 const todayPlans=data.plans.filter(p=>p.date===today).map(withPlanKind).filter(Boolean);
 const todayCompleted=data.completions.filter(c=>c.date===today).map(withDoneKind).filter(Boolean);
 const isDone=(date,id)=>data.completions.some(c=>c.date===date&&c.videoId===id);
 function toggleDone(date,id){update(s=>({...s,completions:isDone(date,id)?s.completions.filter(c=>!(c.date===date&&c.videoId===id)):[...s.completions,{date,videoId:id,createdAt:new Date().toISOString()}]}))}
 function addPlan(date,id,kind){const assigned=kind||inferType(getVideo(id));update(s=>({...s,plans:s.plans.some(p=>p.date===date&&p.videoId===id)?s.plans.map(p=>p.date===date&&p.videoId===id?{...p,kind:assigned}:p):[...s.plans,{date,videoId:id,kind:assigned}]}));message((TYPES.find(t=>t.id===assigned)?.label||'일정')+'에 등록했어요')}
 function removePlan(date,id){update(s=>({...s,plans:s.plans.filter(p=>!(p.date===date&&p.videoId===id))}))}
 const duration=items=>items.reduce((sum,v)=>sum+(Number(v.minutes)||0),0);
 function openSchedule(v){setScheduleVideo(v);setScheduleDate(localDay());setScheduleKind(inferType(v));setModal('schedule')}
 function openPicker(date,type){setSelected(date);setPickType(type);setModal('pick')}
 function groupedVideos(items, opts={}, empty='등록된 영상이 없어요.'){
  return <div className="schedule-groups">{TYPES.map(t=>{const group=items.filter(v=>(v.scheduleKind||inferType(v))===t.id);return <section className="schedule-group" key={t.id}><div className="subheading"><h3>{t.label}</h3><div className="group-heading-actions"><span>{group.length}개 · {duration(group)}분</span>{false&&opts.addDate&&<button className="text-button group-add" onClick={()=>openPicker(opts.addDate,t.id)}><Plus size={16}/> 추가</button>}</div></div>{group.length?group.map(v=>renderVideo(v,opts)):<p className="hint group-empty">{empty}</p>}</section>})}</div>
 }
 const goDate=day=>{setSelected(day);setMonth(parseDay(day));setTab('calendar')};
 function renderVideo(v,options={}){return <div className="video" key={v.id}><button className="thumb" onClick={()=>setPlayingVideo(v)} aria-label={`${v.title} 재생`}><img src={`https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`} alt=""/><span className="play"><Play size={15} fill="white"/></span></button><div className="vinfo"><strong>{v.title}</strong><div className="muted small">{v.minutes?`${v.minutes}분 · `:''}{v.folders.join(' · ')||'미분류'} · {TYPES.find(t=>t.id===(v.scheduleKind||inferType(v)))?.label}</div><div className="vactions">{options.checkDate&&<button className={'chip '+(isDone(options.checkDate,v.id)?'checked':'')} onClick={()=>toggleDone(options.checkDate,v.id)}><Check size={14}/>{isDone(options.checkDate,v.id)?'완료':'완료 체크'}</button>}{options.planDate&&<button className="chip" onClick={()=>openSchedule(v)}><Plus size={14}/>일정 추가</button>}<button className="chip" onClick={()=>setPlayingVideo(v)}><NotebookPen size={14}/>메모</button>{options.edit&&<button className="icon-small" aria-label="영상 수정" onClick={()=>{setEdit(v);setModal('video')}}><Pencil size={16}/></button>}{options.removePlan&&<button className="icon-small" aria-label="일정에서 삭제" onClick={()=>removePlan(options.removePlan,v.id)}><X size={16}/></button>}</div>{notes.filter(n=>n.videoId===v.id).slice(-1).map(n=><div className="video-memo-preview" key={n.id}><p className={!expandedNotes[n.id]?'memo-clamped':''}>{n.text}</p><button onClick={()=>setExpandedNotes(s=>({...s,[n.id]:!s[n.id]}))}>{expandedNotes[n.id]?'접기':'메모 펼치기'}</button></div>)}</div></div>}
 const allDatesInMonth=()=>{const yr=month.getFullYear(),mo=month.getMonth(),offset=(new Date(yr,mo,1).getDay()+6)%7,days=new Date(yr,mo+1,0).getDate();return [...Array(offset).fill(null),...Array.from({length:days},(_,i)=>i+1)]};
 const datesWithDone=new Set(data.completions.map(c=>c.date));
 function calendar(){return <div className="calendar-card"><div className="month-head"><button className="plain" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}><ChevronLeft/></button><h2>{monthLabel(month)}</h2><button className="plain" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}><ChevronRight/></button></div><div className="calendar-grid">{['월','화','수','목','금','토','일'].map(d=><div className="week" key={d}>{d}</div>)}{allDatesInMonth().map((day,i)=>{const date=day?localDay(new Date(month.getFullYear(),month.getMonth(),day)):'';return day?<button key={i} className={'day '+(selected===date?'active ':'')+(date===today?'today':'')} onClick={()=>setSelected(date)}><span>{day}</span><div className={'dot '+(datesWithDone.has(date)?'visible':'')}></div></button>:<div key={i}/>})}</div></div>}
 const folderVideos=useMemo(()=>data.videos.filter(v=>(!folder||v.folders.some(f=>isWithin(f,folder)))&&(!search||[v.title,v.memo,...v.folders].join(' ').toLowerCase().includes(search.toLowerCase()))),[data.videos,folder,search]);
 return <div className="app"><main>
 {tab==='home'&&<><header><div><div className="eyebrow">MY HOME WORKOUT</div><h1>Home Fit <span className="heart">♥</span></h1></div></header><section className="summary"><div className="muted">오늘의 운동 · {today}</div><div className="sum-row"><div><strong>{todayCompleted.length}</strong>개 완료 <span className="muted">/ {todayPlans.length}개 계획</span></div><div className="sum-min">{duration(todayCompleted)}분</div></div><div className="progress"><span style={{width:`${todayPlans.length?Math.min(100,Math.round(todayPlans.filter(v=>isDone(today,v.id)).length/todayPlans.length*100)):0}%`}}/></div></section><div className="section-heading"><h2>오늘 할 운동</h2></div>{groupedVideos(todayPlans,{checkDate:today,removePlan:today},'오늘 예정된 영상이 없어요.')}<div className="section-heading top-space"><h2>오늘 완료한 영상</h2><button className="text-button" onClick={()=>goDate(today)}>기록 보기 <ChevronRight size={16}/></button></div>{groupedVideos(todayCompleted,{checkDate:today},'완료한 영상이 없어요.')}</>}
 {tab==='calendar'&&<><header><h1>Calendar</h1></header>{calendar()}<div className="section-heading"><h2>{Number(selected.slice(5,7))}월 {Number(selected.slice(8,10))}일 · 완료한 영상</h2><span className="stat">{completed.length}개 · {duration(completed)}분</span></div>{groupedVideos(completed,{checkDate:selected},'이 날짜에 완료한 영상이 없어요.')}<div className="section-heading top-space"><h2>이날의 일정</h2></div>{groupedVideos(plans,{checkDate:selected,removePlan:selected},'이 날짜에 예정된 영상이 없어요.')}</>}
 {tab==='library'&&<><header><h1>{folder?folderTitle(folder):'Library'}</h1><div className="header-buttons">{folder&&<button className="circle" aria-label="전체 폴더" onClick={()=>setFolder(folderParent(folder))}><ChevronLeft/></button>}<button className="circle" aria-label="새 폴더" onClick={()=>{setEdit(null);setModal('folder')}}><FolderPlus/></button><button className="circle" aria-label="영상 등록" onClick={()=>{setEdit(null);setModal('video')}}><Plus/></button></div></header>{folder&&<div className="breadcrumbs"><button onClick={()=>setFolder(null)}>Library</button>{folder.split('/').map((part,i)=>{const path=folder.split('/').slice(0,i+1).join('/');return <React.Fragment key={path}><ChevronRight size={13}/><button onClick={()=>setFolder(path)}>{part}</button></React.Fragment>})}</div>}<div className="search"><Search size={25}/><input placeholder="영상 제목, 카테고리, 메모 검색" value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button onClick={()=>setSearch('')}><X size={18}/></button>}</div>{<><div className="section-heading"><h2>{folder?'Subfolders':'Folders'}</h2><button className="text-button" onClick={()=>{setEdit(null);setModal('folder')}}><FolderPlus size={18}/> 새 폴더</button></div><div className="folders">{data.folders.filter(f=>folderParent(f)===folder).map(f=><button className="folder" key={f} onPointerDown={e=>folderPointerDown(e,f)} onPointerUp={clearLongPress} onPointerLeave={clearLongPress} onPointerCancel={clearLongPress} onClick={e=>{if(longPressTriggered.current){e.preventDefault();longPressTriggered.current=false;return}setFolder(f)}} onContextMenu={e=>{e.preventDefault();showFolderActions(f)}}><strong>{folderTitle(f)}</strong><span>{data.videos.filter(v=>v.folders.some(vf=>isWithin(vf,f))).length}개 영상</span></button>)}</div><p className="tiny">폴더를 길게 눌러 수정·삭제할 수 있어요. 새 폴더는 현재 폴더 안에 만들어져요.</p></>}<div className="section-heading top-space"><h2>{folder?`${folderTitle(folder)} 영상`:'All Videos'}</h2><span className="stat">{folderVideos.length}개</span></div>{folderVideos.length?folderVideos.map(v=>renderVideo(v,{edit:true,planDate:today})): <div className="empty">등록된 영상이 없어요.<button className="soft-button" onClick={()=>{setEdit(null);setModal('video')}}>첫 영상 등록하기</button></div>}</>}
 {tab==='memos'&&<><header><h1>메모</h1></header><p className="hint">작성일 순으로 모아보는 운동 메모예요. 각 메모는 두 줄까지만 보이고 펼칠 수 있어요.</p><div className="memo-editor"><textarea value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="오늘의 운동과 느낀 점을 기록해보세요." rows={3}/><button className="primary" onClick={()=>addNote(noteText)}>메모 저장</button></div><div className="section-heading"><h2>전체 메모</h2><span className="stat">{notes.length}개</span></div>{notes.length?noteList([...notes].sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))):<p className="hint">아직 작성한 메모가 없어요.</p>}</>}
 <div className="account-footer"><button type="button" onClick={onLogout}>로그아웃</button></div></main><nav className="bottom-nav" aria-label="메인 메뉴">{[['home',Home,'Home'],['calendar',CalendarDays,'Calendar'],['library',Grid2X2,'Library'],['memos',NotebookPen,'메모']].map(([id,Icon,label])=><button key={id} type="button" className={tab===id?'selected':''} aria-current={tab===id?'page':undefined} onClick={()=>{setTab(id);if(id==='calendar'){setSelected(today);setMonth(new Date())}if(id==='library')setFolder(null);window.scrollTo({top:0,behavior:'instant'})}}><Icon size={23}/><span>{label}</span></button>)}</nav>{toast&&<div className="toast">{toast}</div>}
 {playingVideo&&<YoutubePlayer video={playingVideo} close={()=>setPlayingVideo(null)} notes={notes.filter(n=>n.videoId===playingVideo.id).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))} saveNote={addNote} deleteNote={deleteNote}/>}
 {modal==='note'&&noteVideo&&<div className="overlay" onClick={()=>setModal(null)}><div className="sheet" onClick={e=>e.stopPropagation()}><div className="modal-header"><h2>영상 메모</h2><button className="plain" onClick={()=>setModal(null)} aria-label="닫기"><X/></button></div><p className="hint">{noteVideo.title}</p><textarea className="memo-textarea" rows={5} value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="운동하며 느낀 점을 입력하세요."/><button className="primary full" onClick={()=>{addNote(noteText,noteVideo.id);setModal(null)}} disabled={!noteText.trim()}>메모 저장</button>{noteList([...notes].filter(n=>n.videoId===noteVideo.id).reverse())}</div></div>}
 {modal==='video'&&<VideoModal original={edit} folders={data.folders} close={()=>setModal(null)} save={v=>{update(s=>({...s,videos:edit?s.videos.map(o=>o.id===edit.id?v:o):[...s.videos,v]}));setModal(null);message('영상이 저장됐어요')}} deleteVideo={id=>{if(!window.confirm('이 영상을 삭제할까요? 완료 기록과 일정도 삭제됩니다.'))return;update(s=>({...s,videos:s.videos.filter(v=>v.id!==id),plans:s.plans.filter(p=>p.videoId!==id),completions:s.completions.filter(c=>c.videoId!==id)}));setModal(null)}}/>}
 {modal==='folderActions'&&edit&&<div className="overlay" onClick={()=>setModal(null)}><div role="dialog" aria-label="폴더 메뉴" onClick={e=>e.stopPropagation()} style={{position:'fixed',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:'min(360px,85vw)',background:'#fff',border:'1px solid #e9dff0',borderRadius:22,overflow:'hidden',boxShadow:'0 16px 50px #30203833'}}><button type="button" onClick={()=>setModal('folder')} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:14,border:0,background:'white',padding:'23px',color:'#80659c',fontSize:19,fontWeight:650}}><Pencil size={23}/> 수정</button><button type="button" onClick={()=>removeFolder(edit)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:14,border:0,borderTop:'1px solid #eee7f1',background:'white',padding:'23px',color:'#c64e75',fontSize:19,fontWeight:650}}><Trash2 size={23}/> 삭제</button></div></div>}
 {modal==='folder'&&<FolderModal original={edit} parent={folder} close={()=>setModal(null)} save={name=>{const old=edit;const cleaned=name.trim().replaceAll('/','-');if(!cleaned)return;const parent=old?folderParent(old):folder;const path=parent?parent+'/'+cleaned:cleaned;if(data.folders.includes(path)&&path!==old){message('이미 있는 폴더예요');return}update(s=>({...s,folders:old?s.folders.map(f=>isWithin(f,old)?path+f.slice(old.length):f):[...s.folders,path],videos:old?s.videos.map(v=>({...v,folders:v.folders.map(f=>isWithin(f,old)?path+f.slice(old.length):f)})):s.videos}));if(old&&folder&&isWithin(folder,old))setFolder(path+folder.slice(old.length));setModal(null);message('폴더가 저장됐어요')}} remove={()=>{if(!window.confirm('이 폴더와 하위 폴더를 삭제할까요? 영상과 운동 기록은 남습니다.'))return;update(s=>({...s,folders:s.folders.filter(f=>!isWithin(f,edit)),videos:s.videos.map(v=>({...v,folders:v.folders.filter(f=>!isWithin(f,edit))}))}));if(folder&&isWithin(folder,edit))setFolder(folderParent(edit));setModal(null)}}/>}
 {modal==='schedule'&&scheduleVideo&&<div className="overlay" onClick={()=>setModal(null)}><form className="sheet" onClick={e=>e.stopPropagation()} onSubmit={e=>{e.preventDefault();addPlan(scheduleDate,scheduleVideo.id,scheduleKind);setModal(null)}}><div className="modal-header"><h2>영상 일정 추가</h2><button type="button" className="plain" onClick={()=>setModal(null)}><X/></button></div><div className="schedule-picked-video"><img src={`https://img.youtube.com/vi/${scheduleVideo.youtubeId}/mqdefault.jpg`} alt=""/><strong>{scheduleVideo.title}</strong></div><label>일정 날짜<input type="date" required value={scheduleDate} onChange={e=>setScheduleDate(e.target.value)}/></label><label>일정 종류<select value={scheduleKind} onChange={e=>setScheduleKind(e.target.value)}>{TYPES.map(t=><option value={t.id} key={t.id}>{t.label}</option>)}</select></label><p className="hint">영상 보관함 분류는 바뀌지 않고 선택한 날짜의 일정에 등록돼요.</p><button type="submit" className="primary full">이 일정에 추가하기</button></form></div>}
 {modal==='pick'&&<div className="overlay" onClick={()=>setModal(null)}><div className="sheet" onClick={e=>e.stopPropagation()}><div className="modal-header"><h2>{selected} · {TYPES.find(t=>t.id===pickType)?.label} 추가</h2><button className="plain" onClick={()=>setModal(null)}><X/></button></div><div className="picklist">{data.videos.filter(v=>inferType(v)===pickType).length?data.videos.filter(v=>inferType(v)===pickType).map(v=><button key={v.id} className="pick-video" onClick={()=>addPlan(selected,v.id,pickType)}><img src={`https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`} alt=""/><span>{v.title}<small>{v.minutes||0}분 · {data.plans.some(p=>p.date===selected&&p.videoId===v.id)?'일정에 추가됨':'눌러서 일정 추가'}</small></span><Plus size={19}/></button>):<p className="hint">이 분류에 등록된 영상이 없어요. Library에서 영상을 등록하고 일정 분류를 설정하세요.</p>}</div><button className="primary full" onClick={()=>setModal(null)}>완료</button></div></div>}
 </div>;
}
function YoutubePlayer({video,close,notes,saveNote,deleteNote}){
 const [draft,setDraft]=useState(''),[openNotes,setOpenNotes]=useState({});
 const [embedError,setEmbedError]=useState(false);
 const iframeRef=useRef(null);
 const playerUrl=`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
 const youtubeUrl=`https://www.youtube.com/watch?v=${video.youtubeId}`;
 useEffect(()=>{
  const onMessage=(event)=>{
   if(!/^https:\/\/(www\.)?youtube(-nocookie)?\.com$/.test(event.origin))return;
   let payload;try{payload=typeof event.data==='string'?JSON.parse(event.data):event.data}catch{return}
   if(payload?.event==='onError'&&[2,5,100,101,150,153].includes(Number(payload.info)))setEmbedError(true);
  };
  const onKey=(event)=>{if(event.key==='Escape')close()};
  window.addEventListener('message',onMessage);window.addEventListener('keydown',onKey);
  return()=>{window.removeEventListener('message',onMessage);window.removeEventListener('keydown',onKey)};
 },[close]);
 const fullscreen=()=>{
  const frame=iframeRef.current;
  const el=frame?.requestFullscreen?frame:frame?.parentElement;
  if(el?.requestFullscreen){el.requestFullscreen().catch(()=>setEmbedError(true))}
  else if(frame?.webkitEnterFullscreen){try{frame.webkitEnterFullscreen()}catch{setEmbedError(true)}}
  else setEmbedError(true);
 };
 return <div className="video-player-overlay" role="presentation" onClick={close}>
  <section className="video-player-sheet" role="dialog" aria-modal="true" aria-label={`${video.title} 재생`} onClick={e=>e.stopPropagation()}>
   <div className="video-player-head"><strong>{video.title}</strong><button type="button" onClick={close} aria-label="닫기"><X size={23}/></button></div>
   <div className="video-player-frame"><iframe ref={iframeRef} key={video.youtubeId} title={video.title} src={playerUrl} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>
   {embedError&&<p className="video-player-error">영상 재생 또는 전체화면 사용이 제한돼요. 유튜브에서 열어주세요.</p>}
   <div className="video-player-actions"><button type="button" onClick={fullscreen}><ExternalLink size={17}/> 전체화면</button><a href={youtubeUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={17}/> 유튜브에서 열기</a></div>
   <p className="video-player-hint">영상 안의 전체화면 버튼도 사용할 수 있어요. 재생이 차단되거나 검은 화면만 보이면 ‘유튜브에서 열기’를 눌러주세요.</p>
   <div className="player-notes"><h3>영상 메모</h3><textarea value={draft} onChange={e=>setDraft(e.target.value)} rows={4} placeholder="이 영상에서 배운 점, 운동하면서 느낀 점을 적어보세요."/><div className="player-note-actions"><button type="button" className="primary" disabled={!draft.trim()} onClick={()=>{saveNote(draft,video.id);setDraft('')}}>메모 저장</button></div>{notes.map(n=><div className="player-note-entry" key={n.id}><div className="memo-meta"><span>{new Date(n.createdAt).toLocaleString('ko-KR')}</span><button type="button" onClick={()=>deleteNote(n.id)} aria-label="메모 삭제"><Trash2 size={16}/></button></div><p className={'memo-content '+(!openNotes[n.id]?'memo-clamped':'')}>{n.text}</p><button className="memo-expand-btn" onClick={()=>setOpenNotes(s=>({...s,[n.id]:!s[n.id]}))}>{openNotes[n.id]?'메모 접기':'메모 펼치기'}</button></div>)}</div>
  </section>
 </div>;
}
function VideoModal({original,folders,close,save,deleteVideo}){
 const [url,setUrl]=useState(original?.url||''),[title,setTitle]=useState(original?.title||''),[minutes,setMinutes]=useState(String(original?.minutes||'')),[chosen,setChosen]=useState(original?.folders||[]),[memo,setMemo]=useState(original?.memo||''),[kind,setKind]=useState(original?inferType(original):'workout'),[loading,setLoading]=useState(false);
 const youtubeId=videoIdFromUrl(url);
 useEffect(()=>{if(!youtubeId||original)return;let active=true;setLoading(true);fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${youtubeId}`)}&format=json`).then(r=>r.ok?r.json():null).then(json=>{if(active&&json?.title)setTitle(t=>t||json.title)}).catch(()=>{}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[youtubeId]);
 return <div className="overlay" onClick={close}><form className="sheet" onClick={e=>e.stopPropagation()} onSubmit={e=>{e.preventDefault();if(!youtubeId){alert('올바른 유튜브 링크를 입력해주세요');return}if(!title.trim()){alert('영상 제목을 입력해주세요');return}save({id:original?.id||crypto.randomUUID(),youtubeId,url:`https://www.youtube.com/watch?v=${youtubeId}`,title:title.trim(),minutes:Math.max(0,Number(minutes)||0),folders:chosen,memo,kind})}}><div className="modal-header"><h2>{original?'영상 수정':'유튜브 영상 등록'}</h2><button className="plain" type="button" onClick={close}><X/></button></div><label>유튜브 URL<input required value={url} placeholder="https://youtu.be/..." onChange={e=>{setUrl(e.target.value);if(!original)setTitle('')}}/></label>{youtubeId&&<img className="preview" src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`} alt="영상 미리보기"/>}<label>영상 제목 {loading&&<small className="muted">자동 조회 중…</small>}<input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="영상 제목"/></label><label>운동 시간 (분)<input type="number" min="0" value={minutes} onChange={e=>setMinutes(e.target.value)} placeholder="예: 20"/></label><label>일정 분류<select value={kind} onChange={e=>setKind(e.target.value)}>{TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></label><label>폴더 (복수 선택)</label><div className="folder-pills">{folders.map(f=><button key={f} type="button" className={'pill '+(chosen.includes(f)?'on':'')} onClick={()=>setChosen(s=>s.includes(f)?s.filter(x=>x!==f):[...s,f])}>{f}</button>)}</div><label>메모<textarea value={memo} onChange={e=>setMemo(e.target.value)} placeholder="선택 입력"/></label><button className="primary full" type="submit">저장하기</button>{original&&<button className="danger" type="button" onClick={()=>deleteVideo(original.id)}><Trash2 size={16}/> 영상 삭제</button>}</form></div>
}
function FolderModal({original,parent,close,save,remove}){const [name,setName]=useState(original?folderTitle(original):'');return <div className="overlay" onClick={close}><form className="sheet" onClick={e=>e.stopPropagation()} onSubmit={e=>{e.preventDefault();save(name)}}><div className="modal-header"><h2>{original?'폴더 수정':'새 폴더'}</h2><button className="plain" type="button" onClick={close}><X/></button></div><div className="muted small">위치: {original?(folderParent(original)||'최상위'):(parent||'최상위')}</div><label>폴더 이름<input autoFocus required maxLength={30} value={name} onChange={e=>setName(e.target.value)}/></label><button className="primary full">저장</button>{original&&<button className="danger" type="button" onClick={remove}><Trash2 size={16}/> 폴더 삭제</button>}</form></div>}

function AuthScreen({onLogin}){
 const [mode,setMode]=useState('login');
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function submit(e){
  e.preventDefault();setError('');setNotice('');
  if(!supabase){setError('Supabase 연결 설정이 필요해요. README를 확인해주세요.');return;}
  if(mode==='signup'&&password!==confirm){setError('비밀번호가 일치하지 않아요.');return;}
  if(password.length<6){setError('비밀번호는 6자 이상 입력해주세요.');return;}
  setBusy(true);
  try{
   if(mode==='signup'){
    const {data,error}=await supabase.auth.signUp({email:email.trim(),password});
    if(error)throw error;
    if(!data.session)setNotice('인증 이메일을 보냈어요. 메일함에서 인증한 뒤 로그인해주세요.');
   }else{
    const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
    if(error)throw error;
   }
  }catch(err){setError(err.message||'인증에 실패했어요.')}finally{setBusy(false)}
 }
 return <div className="auth-wrap"><div className="auth-card"><div className="auth-symbol">♥</div><h1>Home Fit</h1><p className="auth-caption">MY HOME WORKOUT</p><div className="auth-tabs"><button type="button" className={mode==='login'?'on':''} onClick={()=>{setMode('login');setError('');setNotice('')}}>로그인</button><button type="button" className={mode==='signup'?'on':''} onClick={()=>{setMode('signup');setError('');setNotice('')}}>회원가입</button></div><form onSubmit={submit} className="auth-form"><label>이메일<input type="email" autoComplete="email" required placeholder="이메일 주소" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>비밀번호<input type="password" autoComplete={mode==='signup'?'new-password':'current-password'} required placeholder="비밀번호" value={password} onChange={e=>setPassword(e.target.value)}/></label>{mode==='signup'&&<label>비밀번호 확인<input type="password" autoComplete="new-password" required placeholder="비밀번호 다시 입력" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>}{error&&<p className="auth-error" role="alert">{error}</p>}{notice&&<p className="auth-notice" role="status">{notice}</p>}<button className="primary full" disabled={busy}>{busy?'처리 중…':mode==='login'?'로그인':'회원가입'}</button></form><p className="auth-footnote">로그인 후 영상·폴더·일정이 계정에 안전하게 저장돼요.</p></div></div>
}
function AuthGate(){
 const [session,setSession]=useState(null),[loading,setLoading]=useState(true),[initial,setInitial]=useState(null),[error,setError]=useState('');
 const saveSeq=React.useRef(Promise.resolve());
 const started=React.useRef(false);
 useEffect(()=>{
  if(!supabase){setLoading(false);return;}
  let alive=true;
  supabase.auth.getSession().then(({data})=>{if(alive)setSession(data.session)}).catch(e=>{if(alive)setError(e.message)}).finally(()=>{if(alive)setLoading(false)});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{if(alive)setSession(next)});
  return()=>{alive=false;subscription.unsubscribe()};
 },[]);
 useEffect(()=>{
  if(!session?.user?.id){setInitial(null);started.current=false;return;}
  let alive=true;setInitial(null);setError('');started.current=false;
  (async()=>{
   const userId=session.user.id;
   const {data:row,error:err}=await supabase.from('home_fit_data').select('content').eq('user_id',userId).maybeSingle();
   if(err)throw err;
   const local=load();
   // Only new accounts with no cloud record can import this browser's pre-login data.
   const content=row?.content||local;
   if(!row){const {error:insertErr}=await supabase.from('home_fit_data').insert({user_id:userId,content});if(insertErr)throw insertErr;}
   if(alive){setInitial({...defaultData,...content});started.current=true;}
  })().catch(e=>{if(alive)setError('데이터 불러오기 실패: '+e.message)});
  return()=>{alive=false};
 },[session?.user?.id]);
 const onDataChange=React.useCallback(data=>{
  if(!started.current||!session?.user?.id)return;
  const id=session.user.id;
  // serialize writes to avoid earlier requests overwriting later edits
  const snapshot=JSON.parse(JSON.stringify(data));
  saveSeq.current=saveSeq.current.catch(()=>{}).then(async()=>{
   const {error}=await supabase.from('home_fit_data').upsert({user_id:id,content:snapshot},{onConflict:'user_id'});
   if(error)throw error;
   setError('');
  }).catch(err=>{console.error('Home Fit 저장 실패',err);setError('저장 오류: '+err.message)});
 },[session?.user?.id]);
 const logout=async()=>{await saveSeq.current.catch(()=>{});const {error}=await supabase.auth.signOut();if(error)setError(error.message)};
 if(loading)return <div className="auth-loading">Home Fit 불러오는 중…</div>;
 if(!session)return <><AuthScreen/>{error&&<p className="auth-error" role="alert">{error}</p>}</>;
 if(!initial)return <div className="auth-loading">{error||'운동 기록 불러오는 중…'}</div>;
 return <><App key={session.user.id} initialData={initial} onDataChange={onDataChange} onLogout={logout}/>{error&&<div className="cloud-error" role="alert">{error}</div>}</>;
}
createRoot(document.getElementById('root')).render(<AuthGate/>);
