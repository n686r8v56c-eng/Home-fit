import {BookmarkScheduleButton} from './ExerciseContext';
import React,{useEffect,useState} from 'react';
import {Folder} from 'lucide-react';
import {useExercise} from './ExerciseContext';
import {FOAM_CATEGORIES} from './data/foamRollerSeed';
const btn={border:'1px solid #e0d1ed',background:'#f3ebf8',color:'#735989',borderRadius:12,padding:'10px 13px',fontSize:14,cursor:'pointer'};
const field={border:'1px solid #decdea',borderRadius:12,padding:12,width:'100%',boxSizing:'border-box',fontSize:15,color:'#53415e',background:'white'};
const card={background:'white',border:'1px solid #e1d4ec',borderRadius:20,padding:15};
const uid=()=>crypto.randomUUID();
const getVideoId=raw=>{try{const u=new URL(raw);if(u.hostname==='youtu.be')return u.pathname.split('/')[1]||'';if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com'].includes(u.hostname))return u.searchParams.get('v')||u.pathname.match(/(?:embed|shorts|live)\/([\w-]+)/)?.[1]||''}catch{}return ''};
export default function FoamRollerBookmarks(){
 const context=useExercise();
 const data=context?.localData?.foamBookmarks||{};
 const update=patch=>context?.onLocalChange(old=>({...old,foamBookmarks:{...(old.foamBookmarks||{}),...patch}}));
 const videoBookmarks=data.videoBookmarks||[],folders=data.folders||{};
 const allPaths=[...new Set([...FOAM_CATEGORIES.filter(x=>x!=='전체'),...Object.keys(folders)])];
 const [folderPath,setFolderPath]=useState(null),[videoDraft,setVideoDraft]=useState({url:'',title:'',folder:''}),[videoEditing,setVideoEditing]=useState(null),[bookmarkOpen,setBookmarkOpen]=useState(false),[videoSearch,setVideoSearch]=useState(''),[videoTitleStatus,setVideoTitleStatus]=useState('');
 const addFolder=path=>{const name=prompt('새 폴더 이름');if(!name?.trim())return;const key=path?`${path}/${name.trim()}`:name.trim();if(allPaths.includes(key))return alert('이미 있는 폴더야.');update({folders:{...folders,[key]:true}})};
 const saveVideo=()=>{const id=getVideoId(videoDraft.url);if(!/^[\w-]{11}$/.test(id))return alert('올바른 YouTube 링크를 입력해줘.');const video={id:uid(),videoId:id,url:`https://www.youtube.com/watch?v=${id}`,title:videoDraft.title.trim()||'제목 미입력 영상',folder:folderPath||''};update({videoBookmarks:[...videoBookmarks,video]});setBookmarkOpen(false);setVideoDraft({url:'',title:'',folder:''})};
 useEffect(()=>{const id=getVideoId(videoDraft.url);if(!/^[\w-]{11}$/.test(id))return;const controller=new AbortController();const timer=setTimeout(async()=>{setVideoTitleStatus('제목을 가져오는 중…');try{const r=await fetch(`https://noembed.com/embed?url=${encodeURIComponent('https://www.youtube.com/watch?v='+id)}`,{signal:controller.signal});const meta=await r.json();if(!meta.title)throw Error();setVideoDraft(d=>getVideoId(d.url)===id&&!d.title.trim()?{...d,title:meta.title}:d);setVideoTitleStatus('제목 자동 입력 완료 · 수정 가능')}catch(e){if(e.name!=='AbortError')setVideoTitleStatus('제목을 직접 입력해 주세요.')}},300);return()=>{clearTimeout(timer);controller.abort()}},[videoDraft.url]);
 return (
    <div style={card}>
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
          <BookmarkScheduleButton bookmark={v} activity={'폼롤러'}/>
          <button type="button" aria-label={`${v.title} 북마크 삭제`} style={{position:'absolute',right:5,top:5,width:32,height:32,border:0,borderRadius:'50%',background:'#fffffff0',color:'#755b8c',fontSize:23,lineHeight:1,cursor:'pointer',display:'grid',placeItems:'center'}} onClick={()=>{if(confirm('이 북마크를 삭제할까?'))update({videoBookmarks:videoBookmarks.filter(x=>x.id!==v.id)});}}>×</button>
        </div>)}
      </div>
    </div>
 );
}
